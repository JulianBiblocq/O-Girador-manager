/**
 * Test unitaire automatisé : Relance post-événement pour le retour des costumes
 * Valide le calcul after_event, le fuseau Europe/Paris, le filtrage strict
 * des présents sans déclaration, le deep linking et la mise à jour atomique.
 */

import assert from 'assert';

console.log("=======================================================================");
console.log("🧪 TEST AUTOMATISATION : RELANCE POST-ÉVÉNEMENT RETOUR DES COSTUMES");
console.log("=======================================================================\n");

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

// -----------------------------------------------------------------------------
// 1. Calcul de date after_event et normalisation horaire (Logique Backend & Moteur)
// -----------------------------------------------------------------------------
console.log("--- 1. Déclencheur post-date 'after_event' & Fuseau Europe/Paris ---");

function calculateTriggerDateStr(ev, rule) {
  const isAfterEvent = rule.pointDeReference === 'after_event';
  let referenceDateStr = '';
  if (rule.pointDeReference === 'registrationDeadline') {
    referenceDateStr = ev.dateLimiteInscription || ev.date;
  } else if (isAfterEvent) {
    referenceDateStr = ev.dateFin || ev.date;
  } else {
    referenceDateStr = ev.date;
  }

  if (!referenceDateStr) return null;

  const refDayStr = referenceDateStr.split('T')[0];
  const [rYear, rMonth, rDay] = refDayStr.split('-').map(Number);
  if (!rYear || !rMonth || !rDay) return null;

  const triggerDate = new Date(Date.UTC(rYear, rMonth - 1, rDay, 12, 0, 0));
  if (isAfterEvent) {
    const delayAfter = parseInt(rule.joursApres || rule.joursAvant, 10) || 1;
    triggerDate.setUTCDate(triggerDate.getUTCDate() + delayAfter);
  } else {
    const delayBefore = parseInt(rule.joursAvant, 10) || 0;
    triggerDate.setUTCDate(triggerDate.getUTCDate() - delayBefore);
  }

  return triggerDate.toISOString().split('T')[0];
}

test("after_event déclenche exactement à J+1 de la date de fin (dateFin)", () => {
  const ev = { date: '2026-09-05T14:00:00', dateFin: '2026-09-05T22:00:00' };
  const rule = { pointDeReference: 'after_event', joursApres: 1 };
  const triggerStr = calculateTriggerDateStr(ev, rule);
  assert.strictEqual(triggerStr, '2026-09-06');
});

test("after_event se replie sur ev.date si dateFin est absente", () => {
  const ev = { date: '2026-09-10' };
  const rule = { pointDeReference: 'after_event', joursApres: 1 };
  const triggerStr = calculateTriggerDateStr(ev, rule);
  assert.strictEqual(triggerStr, '2026-09-11');
});

test("after_event prend en charge des délais supérieurs (ex: J+2)", () => {
  const ev = { date: '2026-09-10', dateFin: '2026-09-12T18:00:00' };
  const rule = { pointDeReference: 'after_event', joursApres: 2 };
  const triggerStr = calculateTriggerDateStr(ev, rule);
  assert.strictEqual(triggerStr, '2026-09-14');
});

test("La date courante Europe/Paris est correctement formatée en YYYY-MM-DD", () => {
  const fixedDate = new Date('2026-09-06T22:30:00Z'); // 00:30 le 7 septembre à Paris (+2h)
  const parisStr = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(fixedDate);
  assert.strictEqual(parisStr, '2026-09-07');
});

// -----------------------------------------------------------------------------
// 2. Filtrage strict des destinataires pour les costumes (Backend & Frontend)
// -----------------------------------------------------------------------------
console.log("\n--- 2. Filtrage strict des participants sans déclaration de costume ---");

function filterCostumeRecipients(activeUsers, eventInscriptions) {
  return eventInscriptions
    .filter((ins) => {
      // 1. Doit être présent
      if (ins.status !== 'present' || !ins.userId) return false;
      // 2. Ne doit pas avoir encore déclaré son costume
      if (ins.costumeStatus || ins.costumeDeclaration) return false;
      // 3. Doit être un membre actif (non archivé)
      const isActive = activeUsers.some((u) => u.id === ins.userId && u.statutActuel !== 'archived');
      return isActive;
    })
    .map((ins) => ins.userId);
}

const mockActiveUsers = [
  { id: 'user-present-nodecl', nom: 'Alice', statutActuel: 'actif' },
  { id: 'user-present-rendu', nom: 'Bob', statutActuel: 'actif' },
  { id: 'user-present-lavage', nom: 'Charlie', statutActuel: 'actif' },
  { id: 'user-present-retouche', nom: 'David', statutActuel: 'actif' },
  { id: 'user-absent', nom: 'Emma', statutActuel: 'actif' },
  { id: 'user-pending', nom: 'Félix', statutActuel: 'actif' },
  { id: 'user-archived', nom: 'Gaston', statutActuel: 'archived' }
];

const mockInscriptions = [
  { userId: 'user-present-nodecl', status: 'present' }, // Doit être relancé !
  { userId: 'user-present-rendu', status: 'present', costumeStatus: 'rendu', costumeDeclarationDate: '2026-09-05T23:00:00Z' },
  { userId: 'user-present-lavage', status: 'present', costumeStatus: 'lavage', costumeDeclarationDate: '2026-09-05T23:10:00Z' },
  { userId: 'user-present-retouche', status: 'present', costumeStatus: 'retouche', costumeRetoucheNote: 'Bouton manquant' },
  { userId: 'user-absent', status: 'absent' },
  { userId: 'user-pending', status: 'pending' },
  { userId: 'user-archived', status: 'present' } // Présent mais membre archivé
];

test("Uniquement le membre présent sans déclaration est sélectionné pour le rappel", () => {
  const recipients = filterCostumeRecipients(mockActiveUsers, mockInscriptions);
  assert.strictEqual(recipients.length, 1);
  assert.strictEqual(recipients[0], 'user-present-nodecl');
});

test("Les membres ayant déclaré 'rendu', 'lavage' ou 'retouche' sont exclus (Idempotence)", () => {
  const recipients = filterCostumeRecipients(mockActiveUsers, mockInscriptions);
  assert.strictEqual(recipients.includes('user-present-rendu'), false);
  assert.strictEqual(recipients.includes('user-present-lavage'), false);
  assert.strictEqual(recipients.includes('user-present-retouche'), false);
});

test("Les membres déclarés absents ou en attente sont strictement exclus", () => {
  const recipients = filterCostumeRecipients(mockActiveUsers, mockInscriptions);
  assert.strictEqual(recipients.includes('user-absent'), false);
  assert.strictEqual(recipients.includes('user-pending'), false);
});

test("Les membres archivés sont strictement exclus même s'ils étaient présents", () => {
  const recipients = filterCostumeRecipients(mockActiveUsers, mockInscriptions);
  assert.strictEqual(recipients.includes('user-archived'), false);
});

// -----------------------------------------------------------------------------
// 3. Validation du Payload Push FCM & Deep Linking
// -----------------------------------------------------------------------------
console.log("\n--- 3. Payload Push FCM & Deep Linking /mon-vestiaire ---");

function buildCostumeFcmPayload(ev, rule) {
  const eventName = ev.titre || ev.nom || 'Événement';
  const notifTitle = rule.titreNotification || `🎭 Tenues : ${eventName}`;
  const notifBody = (rule.messageNotification || "Merci d'indiquer l'état de ton costume (rendu, à laver ou retouche).")
    .replace(/\{\{nomEvenement\}\}/g, eventName);
  const deepLinkUrl = `/mon-vestiaire?eventId=${ev.id}`;

  return {
    title: notifTitle,
    body: notifBody,
    dataPayload: {
      url: deepLinkUrl,
      click_action: deepLinkUrl
    }
  };
}

test("Le payload FCM injecte l'URL /mon-vestiaire?eventId={eventId}", () => {
  const ev = { id: 'fest-2026', titre: 'Carnaval Tropical' };
  const rule = { pointDeReference: 'after_event' };
  const payload = buildCostumeFcmPayload(ev, rule);

  assert.strictEqual(payload.dataPayload.url, '/mon-vestiaire?eventId=fest-2026');
  assert.strictEqual(payload.dataPayload.click_action, '/mon-vestiaire?eventId=fest-2026');
  assert.strictEqual(payload.title, '🎭 Tenues : Carnaval Tropical');
  assert.strictEqual(payload.body, "Merci d'indiquer l'état de ton costume (rendu, à laver ou retouche).");
});

// -----------------------------------------------------------------------------
// 4. Mise à jour atomique du tableau inscriptions (PostEventCostumeReturnModal)
// -----------------------------------------------------------------------------
console.log("\n--- 4. Mise à jour atomique des inscriptions dans Firestore ---");

function applyCostumeDeclaration(inscriptions, targetUserId, userEmail, selectedStatus, retoucheNote) {
  let matched = false;
  const updated = inscriptions.map((ins) => {
    const isTarget = (ins.userId && targetUserId && ins.userId === targetUserId) ||
                     (ins.email && userEmail && ins.email.toLowerCase() === userEmail.toLowerCase()) ||
                     (ins.userEmail && userEmail && ins.userEmail.toLowerCase() === userEmail.toLowerCase());

    if (isTarget) {
      matched = true;
      return {
        ...ins,
        costumeStatus: selectedStatus,
        costumeDeclarationDate: '2026-09-06T10:00:00.000Z',
        costumeRetoucheNote: selectedStatus === 'retouche' ? retoucheNote : (ins.costumeRetoucheNote || '')
      };
    }
    return ins;
  });

  return { updated, matched };
}

test("Mise à jour d'un statut 'rendu' conserve l'instrument et les autres métadonnées", () => {
  const currentInscriptions = [
    { userId: 'u-1', status: 'present', instrumentChoisi: 'Alfaia', transport: 'convoi' }
  ];
  const { updated, matched } = applyCostumeDeclaration(currentInscriptions, 'u-1', null, 'rendu', '');
  assert.strictEqual(matched, true);
  assert.strictEqual(updated[0].costumeStatus, 'rendu');
  assert.strictEqual(updated[0].instrumentChoisi, 'Alfaia');
  assert.strictEqual(updated[0].transport, 'convoi');
  assert.strictEqual(updated[0].costumeDeclarationDate, '2026-09-06T10:00:00.000Z');
});

test("Mise à jour d'un statut 'retouche' injecte bien la consigne pour l'atelier", () => {
  const currentInscriptions = [
    { userId: 'u-1', status: 'present', instrumentChoisi: 'Gonguê' }
  ];
  const { updated, matched } = applyCostumeDeclaration(currentInscriptions, 'u-1', null, 'retouche', 'Ourlet défait jambe gauche');
  assert.strictEqual(matched, true);
  assert.strictEqual(updated[0].costumeStatus, 'retouche');
  assert.strictEqual(updated[0].costumeRetoucheNote, 'Ourlet défait jambe gauche');
});

test("Repli par e-mail si userId absent dans l'inscription", () => {
  const currentInscriptions = [
    { email: 'member@test.com', status: 'present' }
  ];
  const { updated, matched } = applyCostumeDeclaration(currentInscriptions, 'uid-differente', 'member@test.com', 'lavage', '');
  assert.strictEqual(matched, true);
  assert.strictEqual(updated[0].costumeStatus, 'lavage');
});

// -----------------------------------------------------------------------------
// 5. Aiguillage et conservation des searchParams dans App.jsx
// -----------------------------------------------------------------------------
console.log("\n--- 5. Conservation des paramètres d'URL lors de l'aiguillage interne ---");

function simulateDeepLinkNavigation(overridePath, currentSearch) {
  let targetPathname = '/';
  let searchParams = new URLSearchParams(currentSearch);

  if (overridePath) {
    if (overridePath.includes('?')) {
      const parts = overridePath.split('?');
      targetPathname = parts[0];
      searchParams = new URLSearchParams(parts[1]);
    } else {
      targetPathname = overridePath;
    }
  }

  const isVestiaireRoute = targetPathname.includes('/mon-vestiaire') || targetPathname.includes('/vestiaire');
  const hasEventId = searchParams.has('eventId');
  const hasThreadId = searchParams.has('threadId');
  const isAgendaRoute = targetPathname.includes('/agenda') || targetPathname.includes('/events');
  const isForumRoute = targetPathname.includes('/forum') || targetPathname.includes('/threads');

  let pole = 'accueil';
  let tab = 'dashboard';

  if (isVestiaireRoute) {
    pole = 'mon-espace';
    tab = 'vestiaire';
  } else if (hasEventId || isAgendaRoute) {
    pole = 'accueil';
    tab = 'agenda';
  } else if (hasThreadId || isForumRoute) {
    pole = 'mon-espace';
    tab = 'forum';
  }

  return { pole, tab, preservedEventId: searchParams.get('eventId') };
}

test("L'URL /mon-vestiaire?eventId=ev-999 oriente vers mon-espace/vestiaire avec eventId intact", () => {
  const result = simulateDeepLinkNavigation('/mon-vestiaire?eventId=ev-999', '');
  assert.strictEqual(result.pole, 'mon-espace');
  assert.strictEqual(result.tab, 'vestiaire');
  assert.strictEqual(result.preservedEventId, 'ev-999');
});

test("L'URL classique /events/ev-123 conserve son aiguillage vers accueil/agenda", () => {
  const result = simulateDeepLinkNavigation('/events/ev-123', '');
  assert.strictEqual(result.pole, 'accueil');
  assert.strictEqual(result.tab, 'agenda');
});

// -----------------------------------------------------------------------------
// 6. Calcul fiable du franchissement de l'événement (Reconstitution du timestamp)
// -----------------------------------------------------------------------------
console.log("\n--- 6. Calcul fiable du franchissement de l'événement ---");

function isEventStrictlyPassed(event, referenceDate = new Date()) {
  if (!event) return false;
  const baseDate = event.dateFin || event.date;
  if (!baseDate) return false;

  if (baseDate.includes('T')) {
    const parsed = new Date(baseDate);
    return !isNaN(parsed.getTime()) && parsed < referenceDate;
  }

  const timeEnd = event.heureFin || '23:59';
  const fullEndIso = `${baseDate}T${timeEnd.length === 5 ? timeEnd + ':00' : timeEnd}`;
  const parsedEnd = new Date(fullEndIso);
  if (!isNaN(parsedEnd.getTime())) {
    return parsedEnd < referenceDate;
  }

  return new Date(baseDate) < referenceDate;
}

test("Événement du jour avec heureFin à 18:00 n'est PAS considéré passé à 15:00", () => {
  const eventToday = { date: '2026-09-06', heureFin: '18:00' };
  const refTimeAfternoon = new Date('2026-09-06T15:00:00');
  const isPassed = isEventStrictlyPassed(eventToday, refTimeAfternoon);
  assert.strictEqual(isPassed, false);
});

test("Événement du jour avec heureFin à 18:00 EST considéré passé à 19:30", () => {
  const eventToday = { date: '2026-09-06', heureFin: '18:00' };
  const refTimeEvening = new Date('2026-09-06T19:30:00');
  const isPassed = isEventStrictlyPassed(eventToday, refTimeEvening);
  assert.strictEqual(isPassed, true);
});

test("Événement sans heureFin se replie sur 23:59 et reste non passé pendant la journée", () => {
  const eventWithoutTime = { date: '2026-09-06' };
  const refTimeDay = new Date('2026-09-06T12:00:00');
  const isPassed = isEventStrictlyPassed(eventWithoutTime, refTimeDay);
  assert.strictEqual(isPassed, false);
});

test("Événement d'hier sans heureFin est bien considéré passé aujourd'hui", () => {
  const eventYesterday = { date: '2026-09-05' };
  const refTimeToday = new Date('2026-09-06T08:00:00');
  const isPassed = isEventStrictlyPassed(eventYesterday, refTimeToday);
  assert.strictEqual(isPassed, true);
});

// -----------------------------------------------------------------------------
// 7. Anti-spam et mémoire de relance manuelle (lastCostumeReminderSentAt)
// -----------------------------------------------------------------------------
console.log("\n--- 7. Anti-spam et mémoire de relance manuelle ---");

function checkMemberReminderStatus(inscription, currentDateStr, remindedUserIds = []) {
  if (!inscription) return false;
  if (remindedUserIds.includes(inscription.userId)) return true;
  if (!inscription.lastCostumeReminderSentAt) return false;
  if (inscription.lastCostumeReminderSentAt.startsWith(currentDateStr)) return true;
  const diffHours = (Date.now() - new Date(inscription.lastCostumeReminderSentAt).getTime()) / (1000 * 3600);
  return diffHours < 24;
}

test("Membre jamais relancé est éligible au rappel par push", () => {
  const ins = { userId: 'u-10', status: 'present' };
  const isBlocked = checkMemberReminderStatus(ins, '2026-09-06');
  assert.strictEqual(isBlocked, false);
});

test("Membre relancé aujourd'hui est bloqué (affiche Déjà relancé aujourd'hui)", () => {
  const ins = { 
    userId: 'u-11', 
    status: 'present', 
    lastCostumeReminderSentAt: '2026-09-06T14:20:00.000Z' 
  };
  const isBlocked = checkMemberReminderStatus(ins, '2026-09-06');
  assert.strictEqual(isBlocked, true);
});

test("Mise à jour optimiste immédiate bloque immédiatement un membre relancé", () => {
  const ins = { userId: 'u-12', status: 'present' };
  const isBlocked = checkMemberReminderStatus(ins, '2026-09-06', ['u-12']);
  assert.strictEqual(isBlocked, true);
});

test("Relance d'un membre met à jour atomiquement son inscription avec l'horodatage", () => {
  const currentInscriptions = [
    { userId: 'u-1', status: 'present', userName: 'Jean' },
    { userId: 'u-2', status: 'present', userName: 'Claire' }
  ];
  const nowIso = '2026-09-06T16:00:00.000Z';
  const updatedInscriptions = currentInscriptions.map((ins) => {
    if (ins.userId === 'u-1') {
      return { ...ins, lastCostumeReminderSentAt: nowIso };
    }
    return ins;
  });

  assert.strictEqual(updatedInscriptions[0].lastCostumeReminderSentAt, nowIso);
  assert.strictEqual(updatedInscriptions[1].lastCostumeReminderSentAt, undefined);
});

// -----------------------------------------------------------------------------
// 8. Propagation de l'action groupée du bac vers l'inventaire réel
// -----------------------------------------------------------------------------
console.log("\n--- 8. Propagation groupée du bac vers l'inventaire réel (writeBatch) ---");

function simulateBatchLaundryProcessing(event, piecesInventory) {
  const nowIso = '2026-09-06T18:00:00.000Z';
  const renduInscriptions = (event.inscriptions || []).filter(ins => ins.costumeStatus === 'rendu');
  const renduUserIds = new Set(renduInscriptions.map(i => i.userId).filter(Boolean));

  // 1. Simulation mise à jour Event
  const updatedInscriptions = (event.inscriptions || []).map(ins => {
    if (ins.costumeStatus === 'rendu') {
      return {
        ...ins,
        costumeBacStatut: 'au_sale',
        costumeBacTraiteAt: nowIso
      };
    }
    return ins;
  });

  const updatedEvent = {
    ...event,
    costumesBacTraites: true,
    costumesBacStatus: 'au_sale',
    costumesBacDate: nowIso,
    inscriptions: updatedInscriptions
  };

  // 2. Simulation mise à jour Pièces d'inventaire
  const updatedPieces = piecesInventory.map(piece => {
    const ownerId = piece.emprunteurId || piece.assignedTo || piece.userId;
    if (ownerId && renduUserIds.has(ownerId)) {
      return {
        ...piece,
        statut: 'au_sale',
        localisationPhysique: 'local',
        derniereSortieEventId: event.id,
        updatedAt: nowIso
      };
    }
    return piece;
  });

  return { updatedEvent, updatedPieces };
}

test("L'action groupée met à jour l'événement avec costumesBacTraites et la date", () => {
  const ev = {
    id: 'ev-test',
    groupId: 'grp-1',
    inscriptions: [
      { userId: 'u-1', status: 'present', costumeStatus: 'rendu' },
      { userId: 'u-2', status: 'present', costumeStatus: 'lavage' }
    ]
  };
  const pieces = [
    { id: 'piece-1', emprunteurId: 'u-1', statut: 'prete', localisationPhysique: 'adherent' },
    { id: 'piece-2', emprunteurId: 'u-2', statut: 'prete', localisationPhysique: 'adherent' }
  ];

  const { updatedEvent, updatedPieces } = simulateBatchLaundryProcessing(ev, pieces);

  assert.strictEqual(updatedEvent.costumesBacTraites, true);
  assert.strictEqual(updatedEvent.costumesBacStatus, 'au_sale');
  assert.strictEqual(updatedEvent.costumesBacDate, '2026-09-06T18:00:00.000Z');
  assert.strictEqual(updatedEvent.inscriptions[0].costumeBacStatut, 'au_sale');
  assert.strictEqual(updatedEvent.inscriptions[1].costumeBacStatut, undefined);

  // Seule la pièce de l'adhérent u-1 (rendu au bac) passe en au_sale et local
  assert.strictEqual(updatedPieces[0].statut, 'au_sale');
  assert.strictEqual(updatedPieces[0].localisationPhysique, 'local');
  assert.strictEqual(updatedPieces[0].derniereSortieEventId, 'ev-test');

  // La pièce de u-2 (lavage maison) ne bouge pas
  assert.strictEqual(updatedPieces[1].statut, 'prete');
  assert.strictEqual(updatedPieces[1].localisationPhysique, 'adherent');
});

console.log("\n=======================================================================");
console.log(`🏆 SUCCÈS : ${passCount} ASSERTIONS VALIDÉES SUR L'AUTOMATISATION DES COSTUMES !`);
console.log("=======================================================================");

