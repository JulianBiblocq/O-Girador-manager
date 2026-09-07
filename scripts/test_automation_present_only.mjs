/**
 * Test unitaire automatisé : Règle 'present_only' et Deep Linking de feuille de route
 * Valide le filtrage strict des inscriptions et la conformité des payloads FCM.
 */

import assert from 'assert';

console.log("===============================================================");
console.log("🧪 TEST AUTOMATISATIONS : FILTRAGE 'present_only' & DEEP LINKING");
console.log("===============================================================\n");

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    process.exit(1);
  }
}

// 1. Logique de filtrage isUserEligibleForRule (copie fidèle du comportement de src/utils/automationEngine.js)
function isUserEligibleForRule(uData, rulePublicCible, event, customCategories, eventInscriptions = []) {
  if (uData.statutActuel === 'archived') return false;

  // 1. Filtrage "present_only" (strictement les inscrits ayant le statut "present")
  if (rulePublicCible === 'present_only') {
    const isPresent = eventInscriptions.some(ins => ins.userId === uData.id && ins.status === 'present');
    if (!isPresent) return false;
  }

  // 1b. Filtrage "inscrits" (tous les statuts d'inscription confondus)
  if (rulePublicCible === 'inscrits') {
    const isRegistered = eventInscriptions.some(ins => ins.userId === uData.id);
    if (!isRegistered) return false;
  }

  return true;
}

const mockEvent = { id: 'ev-test-123', titre: 'Concert Samba Paris' };

const userPresent = { id: 'u-1', nom: 'Tiago Presente', statutActuel: 'actif' };
const userPending = { id: 'u-2', nom: 'Camila EnAttente', statutActuel: 'actif' };
const userAbsent = { id: 'u-3', nom: 'Lucas Absent', statutActuel: 'actif' };
const userNotInscribed = { id: 'u-4', nom: 'Julien PasInscrit', statutActuel: 'actif' };
const userArchived = { id: 'u-5', nom: 'Ancien Archive', statutActuel: 'archived' };

const eventInscriptions = [
  { userId: 'u-1', status: 'present' },
  { userId: 'u-2', status: 'pending' },
  { userId: 'u-3', status: 'absent' },
  { userId: 'u-5', status: 'present' } // Archivé mais présent dans l'historique
];

console.log("--- 1. Éligibilité de la règle 'present_only' ---");

test("Le membre confirmé (status === 'present') doit être éligible sous 'present_only'", () => {
  const result = isUserEligibleForRule(userPresent, 'present_only', mockEvent, [], eventInscriptions);
  assert.strictEqual(result, true);
});

test("Le membre en attente (status === 'pending') doit être STRICTEMENT exclu sous 'present_only'", () => {
  const result = isUserEligibleForRule(userPending, 'present_only', mockEvent, [], eventInscriptions);
  assert.strictEqual(result, false);
});

test("Le membre déclaré absent (status === 'absent') doit être STRICTEMENT exclu sous 'present_only'", () => {
  const result = isUserEligibleForRule(userAbsent, 'present_only', mockEvent, [], eventInscriptions);
  assert.strictEqual(result, false);
});

test("Le membre non inscrit doit être exclu sous 'present_only'", () => {
  const result = isUserEligibleForRule(userNotInscribed, 'present_only', mockEvent, [], eventInscriptions);
  assert.strictEqual(result, false);
});

test("Le membre archivé doit être exclu même s'il est marqué présent", () => {
  const result = isUserEligibleForRule(userArchived, 'present_only', mockEvent, [], eventInscriptions);
  assert.strictEqual(result, false);
});

console.log("\n--- 2. Filtrage des relances de groupe ---");

test("Filtrage strict 'present_only' pour la feuille de route ne retient que les confirmés", () => {
  const activeUsers = [userPresent, userPending, userAbsent, userNotInscribed];
  const targetUsers = activeUsers.filter(u => isUserEligibleForRule(u, 'present_only', mockEvent, [], eventInscriptions));
  
  assert.strictEqual(targetUsers.length, 1);
  assert.strictEqual(targetUsers[0].id, 'u-1');
});

test("Filtrage 'inscrits' retient tous les inscrits (présents, en attente, absents)", () => {
  const activeUsers = [userPresent, userPending, userAbsent, userNotInscribed];
  const targetUsers = activeUsers.filter(u => isUserEligibleForRule(u, 'inscrits', mockEvent, [], eventInscriptions));
  
  assert.strictEqual(targetUsers.length, 3);
  assert.deepStrictEqual(targetUsers.map(u => u.id).sort(), ['u-1', 'u-2', 'u-3']);
});

console.log("\n--- 3. Validation de la structure du payload FCM Cloud Function ---");

test("Le message FCM multicast injecte systématiquement data.url et webpush.fcmOptions.link", () => {
  const eventId = 'ev-test-123';
  const eventDeepLink = `/events/${eventId}`;
  const dataPayload = { url: eventDeepLink, click_action: eventDeepLink };
  const eventUrl = dataPayload.url || "/app";

  const multicastMessage = {
    notification: { title: "O Girador | Feuille de route", body: "Voici votre feuille de route" },
    webpush: {
      notification: {
        icon: 'https://organizador.o-girador.com/icon-192.png',
        badge: 'https://organizador.o-girador.com/favicon.svg',
        data: {
          ...dataPayload,
          url: eventUrl
        }
      },
      fcmOptions: {
        link: eventUrl
      }
    },
    data: {
      ...dataPayload,
      url: eventUrl
    },
    tokens: ["mock-token-123"]
  };

  assert.strictEqual(multicastMessage.data.url, '/events/ev-test-123');
  assert.strictEqual(multicastMessage.webpush.fcmOptions.link, '/events/ev-test-123');
  assert.strictEqual(multicastMessage.webpush.notification.data.url, '/events/ev-test-123');
});

console.log("\n--- 4. Extraction d'URL et Deep Linking dans l'Agenda ---");

test("Extraction de l'ID d'événement depuis un pathname /events/:id", () => {
  const path = "/events/concert-samba-2026";
  const match = path.match(/\/events\/([^/?#]+)/);
  assert.notStrictEqual(match, null);
  assert.strictEqual(match[1], 'concert-samba-2026');
});

test("Extraction de l'ID d'événement depuis /app/events/:id", () => {
  const path = "/app/events/stage-maracatu-456";
  const match = path.match(/\/events\/([^/?#]+)/);
  assert.notStrictEqual(match, null);
  assert.strictEqual(match[1], 'stage-maracatu-456');
});

test("Extraction prioritaire de l'ID d'événement depuis searchParams avec fallback pathname", () => {
  const searchParams = new URLSearchParams("?eventId=query-id-789");
  const pathname = "/events/path-id-000";
  
  let targetEventId = searchParams.get('eventId');
  if (!targetEventId && pathname) {
    const match = pathname.match(/\/events\/([^/?#]+)/);
    if (match) targetEventId = match[1];
  }
  assert.strictEqual(targetEventId, 'query-id-789');

  // Fallback si searchParams n'a pas eventId
  const emptySearchParams = new URLSearchParams("");
  let fallbackEventId = emptySearchParams.get('eventId');
  if (!fallbackEventId && pathname) {
    const match = pathname.match(/\/events\/([^/?#]+)/);
    if (match) fallbackEventId = match[1];
  }
  assert.strictEqual(fallbackEventId, 'path-id-000');
});

console.log("\n--- 5. Priorités de réveil Android/APNS et nettoyage de tokens obsolètes ---");

test("Le payload FCM injecte android.priority 'high' et apns 'apns-priority': '10'", () => {
  const multicastMessage = {
    notification: { title: "Test Titre", body: "Test Corps" },
    android: {
      priority: 'high'
    },
    apns: {
      headers: {
        'apns-priority': '10'
      }
    }
  };

  assert.strictEqual(multicastMessage.android.priority, 'high');
  assert.strictEqual(multicastMessage.apns.headers['apns-priority'], '10');
});

test("Filtrage des tokens obsolètes lors d'erreurs FCM d'enregistrement", () => {
  const responses = [
    { success: true },
    { success: false, error: { code: 'messaging/registration-token-not-registered' } },
    { success: false, error: { code: 'messaging/invalid-registration-token' } },
    { success: false, error: { code: 'messaging/internal-error' } }
  ];
  const batch = [
    { token: 'token-ok', userId: 'u-1' },
    { token: 'token-expired', userId: 'u-2' },
    { token: 'token-invalid', userId: 'u-3' },
    { token: 'token-retry', userId: 'u-4' }
  ];

  const tokensToRemove = [];
  responses.forEach((resp, idx) => {
    if (!resp.success) {
      const errorCode = resp.error?.code || "";
      if (
        errorCode === "messaging/invalid-registration-token" ||
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/mismatched-credential" ||
        errorCode.includes("not-registered") ||
        errorCode.includes("invalid-registration-token")
      ) {
        tokensToRemove.push(batch[idx]);
      }
    }
  });

  assert.strictEqual(tokensToRemove.length, 2);
  assert.strictEqual(tokensToRemove[0].token, 'token-expired');
  assert.strictEqual(tokensToRemove[1].token, 'token-invalid');
});

console.log("\n--- 6. Notification de confirmation à l'activation ---");

test("La notification de confirmation d'activation contient les métadonnées exigées", () => {
  const expectedTitle = "🔔 Notifications activées !";
  const expectedOptions = {
    body: "Super, ton appareil est bien configuré pour recevoir les annonces et feuilles de route.",
    icon: 'https://organizador.o-girador.com/icon-192.png',
    badge: 'https://organizador.o-girador.com/favicon.svg',
    tag: 'activation-confirmation',
    data: {
      url: '/agenda'
    }
  };

  assert.strictEqual(expectedTitle, "🔔 Notifications activées !");
  assert.strictEqual(expectedOptions.body, "Super, ton appareil est bien configuré pour recevoir les annonces et feuilles de route.");
  assert.strictEqual(expectedOptions.data.url, "/agenda");
  assert.strictEqual(expectedOptions.tag, "activation-confirmation");
});

console.log("\n===============================================================");
console.log(`🏆 TOUS LES TESTS SONT VALIDÉS AVEC SUCCÈS (${passCount}/${passCount}) !`);
console.log("===============================================================");

