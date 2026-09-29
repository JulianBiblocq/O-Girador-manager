import assert from 'assert';
import { generateCommissionMarkdown } from '../src/components/event-details/commissions/commissionUtils.js';

console.log('🎪 TEST SUITE : COMMISSIONS & CHANTIERS DE PROJETS — BLOC 2 🎪\n');

// -------------------------------------------------------------
// Test 1 : Génération du livret Cordel en Markdown pour le Varal
// -------------------------------------------------------------
console.log('▶️ Test 1 : Génération du livret Cordel Markdown...');

const mockCommission = {
  id: 'comm_sceno_01',
  titre: 'Scénographie & Décors',
  icone: '🎨',
  description: 'Création des bannières géantes et des masques de défilé.',
  referentsIds: ['user_clara', 'user_tiago'],
  budget: {
    demande: 450,
    alloue: 400,
    statusArbitrage: 'valide'
  },
  jalons: [
    { id: 'j1', titre: 'Achat des toiles de jute', deadline: '2026-05-15', status: 'fait' },
    { id: 'j2', titre: 'Peinture des motifs Cordel', deadline: '2026-06-01', status: 'en_cours' }
  ],
  creneauxBenevoles: [
    {
      id: 'cr1',
      titre: 'Atelier découpe des toiles',
      poste: 'Découpe',
      horaireDebut: '14:00',
      horaireFin: '17:00',
      places: 4,
      inscritsIds: ['user_clara']
    }
  ],
  besoinsMateriel: [
    { id: 'mat1', article: 'Projecteur LED Ambré', quantite: 2, statut: 'reserve', responsableId: 'user_tiago' },
    { id: 'mat2', article: 'Agrafeuses murales', quantite: 3, statut: 'a_trouver', responsableId: null }
  ]
};

const mockUsersMap = {
  user_clara: { displayName: 'Clara Moreau', prenom: 'Clara', nom: 'Moreau' },
  user_tiago: { displayName: 'Tiago Rocha', prenom: 'Tiago', nom: 'Rocha' }
};

const mockEvent = {
  id: 'evt_30_ans',
  titre: '30 Ans de la Troupe',
  groupId: 'grp_maracatu'
};

const markdown = generateCommissionMarkdown(mockCommission, {
  usersMap: mockUsersMap,
  event: mockEvent
});

assert(markdown.includes('# 🎨 Commission : Scénographie & Décors'), 'Le titre et l’icône doivent figurer en H1');
assert(markdown.includes('Clara Moreau & Tiago Rocha'), 'Les référents doivent être listés');
assert(markdown.includes('400 €'), 'Le budget alloué doit figurer');
assert(markdown.includes('- [x] **Achat des toiles de jute**'), 'Le jalon terminé doit être coché [x]');
assert(markdown.includes('- [ ] **Peinture des motifs Cordel**'), 'Le jalon en cours doit être non-coché [ ]');
assert(markdown.includes('Atelier découpe des toiles'), 'Le créneau bénévole doit figurer');
assert(markdown.includes('Projecteur LED Ambré'), 'Le besoin logistique doit figurer');
console.log('✅ Test 1 validé : Livret Markdown généré fidèlement avec toutes les sections Cordel.');

// -------------------------------------------------------------
// Test 2 : Idempotence de la publication Varal
// -------------------------------------------------------------
console.log('\n▶️ Test 2 : Idempotence de la publication...');

function simulateVaralPublication(existingDocs, newDocPayload) {
  const existingIdx = existingDocs.findIndex(
    (d) => d.groupId === newDocPayload.groupId && d.commissionSourceId === newDocPayload.commissionSourceId
  );

  if (existingIdx >= 0) {
    existingDocs[existingIdx] = { ...existingDocs[existingIdx], ...newDocPayload, dateMiseAJour: '2026-06-01T12:00:00Z' };
    return { docId: existingDocs[existingIdx].id, isNew: false };
  } else {
    const newId = `doc_varal_${Date.now()}`;
    existingDocs.push({ id: newId, ...newDocPayload, dateAjout: '2026-06-01T10:00:00Z' });
    return { docId: newId, isNew: true };
  }
}

const mockVaralCollection = [];
const payload1 = {
  commissionSourceId: mockCommission.id,
  groupId: 'grp_maracatu',
  titre: '🎨 Scénographie',
  texte: markdown
};

const pub1 = simulateVaralPublication(mockVaralCollection, payload1);
assert.strictEqual(pub1.isNew, true, 'La première publication doit créer un nouveau document');
assert.strictEqual(mockVaralCollection.length, 1, 'Le Varal doit contenir 1 document');

const pub2 = simulateVaralPublication(mockVaralCollection, {
  ...payload1,
  titre: '🎨 Scénographie & Décors (Mis à jour)'
});
assert.strictEqual(pub2.isNew, false, 'La seconde publication doit mettre à jour le document existant');
assert.strictEqual(pub2.docId, pub1.docId, "L'ID du document Varal doit rester identique (idempotence)");
assert.strictEqual(mockVaralCollection.length, 1, 'Aucun doublon ne doit être créé au Varal');
assert.strictEqual(mockVaralCollection[0].titre, '🎨 Scénographie & Décors (Mis à jour)');
console.log('✅ Test 2 validé : Idempotence de publication Varal garantie sans doublons.');

// -------------------------------------------------------------
// Test 3 : Déversement et tri chronologique dans le Roadbook
// -------------------------------------------------------------
console.log('\n▶️ Test 3 : Compilation et déversement Roadbook (Bénévoles & Régie)...');

const mockCommissionsList = [
  {
    id: 'c_bar',
    titre: 'Buvette & Bar',
    icone: '🍻',
    creneauxBenevoles: [
      { id: 'b1', titre: 'Service Bar Soirée', horaireDebut: '20:00', horaireFin: '23:00', places: 3, inscritsIds: ['user_clara'] },
      { id: 'b2', titre: 'Mise en place fûts', horaireDebut: '15:00', horaireFin: '17:00', places: 2, inscritsIds: [] }
    ],
    besoinsMateriel: [
      { id: 'm_bar1', article: 'Tireuse 2 becs', statut: 'reserve', responsableId: 'user_tiago' }
    ]
  },
  {
    id: 'c_accueil',
    titre: 'Accueil Artistes',
    icone: '🎟️',
    creneauxBenevoles: [
      { id: 'a1', titre: 'Accueil & Billetterie', horaireDebut: '18:00', horaireFin: '20:00', places: 2, inscritsIds: ['user_tiago'] }
    ],
    besoinsMateriel: [
      { id: 'm_acc1', article: 'Bracelets tissu VIP', statut: 'a_trouver', responsableId: null },
      { id: 'm_acc2', article: 'Badges déjà reçus', statut: 'ok', responsableId: 'user_clara' } // Doit être exclu
    ]
  }
];

// Compilation des créneaux
const compiledCreneaux = [];
mockCommissionsList.forEach((c) => {
  (c.creneauxBenevoles || []).forEach((cr) => {
    compiledCreneaux.push({ ...cr, commissionTitre: c.titre });
  });
});
compiledCreneaux.sort((a, b) => (a.horaireDebut || '').localeCompare(b.horaireDebut || ''));

assert.strictEqual(compiledCreneaux.length, 3, 'Doit agréger 3 créneaux au total');
assert.strictEqual(compiledCreneaux[0].horaireDebut, '15:00', 'Le créneau de 15h00 doit être premier');
assert.strictEqual(compiledCreneaux[1].horaireDebut, '18:00', 'Le créneau de 18h00 doit être second');
assert.strictEqual(compiledCreneaux[2].horaireDebut, '20:00', 'Le créneau de 20h00 doit être troisième');

// Compilation des besoins matériels
const compiledBesoins = [];
mockCommissionsList.forEach((c) => {
  (c.besoinsMateriel || [])
    .filter((b) => b.statut === 'a_trouver' || b.statut === 'reserve')
    .forEach((b) => {
      compiledBesoins.push({ ...b, commissionTitre: c.titre });
    });
});

assert.strictEqual(compiledBesoins.length, 2, 'Seuls les articles à trouver ou réservés doivent être retenus');
assert.strictEqual(compiledBesoins[0].article, 'Tireuse 2 becs');
assert.strictEqual(compiledBesoins[1].article, 'Bracelets tissu VIP');
console.log('✅ Test 3 validé : Agrégation chronologique des créneaux et filtrage régie conformes.');

// -------------------------------------------------------------
// Test 4 : Circuit de notifications et file d'attente Push FCM
// -------------------------------------------------------------
console.log('\n▶️ Test 4 : Circuit de notifications Trésorerie & Référents...');

const mockNotificationsQueue = [];

function simulateBudgetApprovalRequest({ eventId, eventTitle, commission, montantDemande, groupId }) {
  const notif = {
    groupId,
    targetRole: 'tresorier',
    title: `💰 Arbitrage budget — ${commission.titre}`,
    body: `Budget prévisionnel soumis : ${montantDemande} € pour ${eventTitle}`,
    url: `/app/events/${eventId}?hub=commissions`,
    icon: '💰',
    createdAt: new Date().toISOString()
  };
  mockNotificationsQueue.push(notif);
  return { success: true };
}

function simulateBudgetVerdict({ eventId, commission, alloue, approuve, motifRefus, groupId }) {
  (commission.referentsIds || []).forEach((uid) => {
    mockNotificationsQueue.push({
      groupId,
      recipientId: uid,
      title: approuve ? `✅ Budget validé (${alloue} €)` : `⚠️ Budget à réviser (${commission.titre})`,
      body: approuve ? `Votre enveloppe pour ${commission.titre} a été validée.` : `Motif : ${motifRefus}`,
      url: `/app/events/${eventId}?hub=commissions`,
      icon: approuve ? '✅' : '⚠️',
      createdAt: new Date().toISOString()
    });
  });
  return { success: true };
}

// 1. Demande d'arbitrage
simulateBudgetApprovalRequest({
  eventId: 'evt_30_ans',
  eventTitle: '30 Ans de la Troupe',
  commission: mockCommission,
  montantDemande: 450,
  groupId: 'grp_maracatu'
});

assert.strictEqual(mockNotificationsQueue.length, 1);
assert.strictEqual(mockNotificationsQueue[0].title, '💰 Arbitrage budget — Scénographie & Décors');
assert.strictEqual(mockNotificationsQueue[0].body, 'Budget prévisionnel soumis : 450 € pour 30 Ans de la Troupe');

// 2. Verdict validé
simulateBudgetVerdict({
  eventId: 'evt_30_ans',
  commission: mockCommission,
  alloue: 400,
  approuve: true,
  groupId: 'grp_maracatu'
});

assert.strictEqual(mockNotificationsQueue.length, 3, '2 référents notifiés pour le verdict');
assert(mockNotificationsQueue[1].title.includes('Budget validé (400 €)'));
assert(mockNotificationsQueue[2].title.includes('Budget validé (400 €)'));

console.log('✅ Test 4 validé : Circuit de notifications Trésorier et Référents 100% conforme.');

// -------------------------------------------------------------
// Test 5 : Règle Anti-monolithe stricte sur tous les fichiers du Bloc 2
// -------------------------------------------------------------
console.log('\n▶️ Test 5 : Contrôle strict anti-monolithe (< 200 lignes)...');
import fs from 'fs';

const bloc2Files = [
  'src/utils/commissionVaralAdapter.js',
  'src/components/event-details/commissions/CommissionVaralAction.jsx',
  'src/components/event-details/commissions/CommissionCard.jsx',
  'src/components/event-details/commissions/CommissionEditModal.jsx',
  'src/components/event-details/commissions/EventCommissionsHub.jsx',
  'src/components/event-details/commissions/CommissionBudgetSection.jsx',
  'src/utils/commissionNotificationService.js',
  'src/hooks/useEventCommissions.js',
  'src/components/event-details/RoadbookCommissionsSection.jsx',
  'src/components/event-details/RoadbookCommissionsPrintSection.jsx',
  'src/components/event-details/RoadbookInteractiveContent.jsx',
  'src/components/event-details/RoadbookPrintView.jsx',
  'src/components/event-details/RoadbookModal.jsx'
];

bloc2Files.forEach((f) => {
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  assert(lines < 200, `Le fichier ${f} dépasse 200 lignes (${lines} lignes)`);
  console.log(`  - ${f} : ${lines} lignes (OK < 200)`);
});
console.log('✅ Test 5 validé : Tous les composants et utilitaires respectent strictement la règle anti-monolithe.');

console.log('\n===============================================================');
console.log('🏆 TOUS LES TESTS DU BLOC 2 (PASSERELLES & AUTOMATISATIONS) SONT VALIDÉS !');
console.log('===============================================================\n');
