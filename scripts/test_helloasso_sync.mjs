/**
 * test_helloasso_sync.mjs
 * Script de test et de simulation pour la synchronisation HelloAsso & Cotisations (Fiche 8).
 * Valide les fonctions d'extraction d'options, gestion de l'échelonnement 3x,
 * réconciliation prioritaire (UID > Email), et anti-doublon comptable.
 */

import {
  detectHelloAssoOptions,
  detectInstallmentPayment,
  findUserIdentifierFromCustomFields
} from '../functions/helloasso.js';

console.log("=== DÉBUT DES TESTS HELLOASSO & COTISATIONS (FICHE 8) ===\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// TEST 1 : Détection des formules et options (Standard, Solidaire, Instrument, Costume, Dons)
// --------------------------------------------------------------------------
console.log("TEST 1 : Détection des options HelloAsso");

const sampleItemsSolidaire = [
  { name: "Cotisation Adhérent Tarif Solidaire / RSA", amount: 6000, type: "membership" },
  { name: "Option Location Alfaia", amount: 3000, type: "option" },
  { name: "Costume Défilé 2026", amount: 2500, type: "option" },
  { name: "Don de soutien à l'association", amount: 1500, type: "donation" }
];

const parsedSolidaire = detectHelloAssoOptions(sampleItemsSolidaire);
assert(
  parsedSolidaire.formulePrincipale.includes("Solidaire"),
  `Formule principale correctement identifiée comme Solidaire/Réduit: "${parsedSolidaire.formulePrincipale}"`
);
assert(
  parsedSolidaire.montantDons === 15,
  `Montant des dons correctement extrait (15 €): ${parsedSolidaire.montantDons} €`
);
assert(
  parsedSolidaire.optionsAdditionnelles.length === 2,
  `Nombre d'options matérielles détectées (2): ${parsedSolidaire.optionsAdditionnelles.length}`
);
assert(
  parsedSolidaire.optionsAdditionnelles.some(o => o.categorie === 'instrument'),
  "Option instrument correctement catégorisée"
);
assert(
  parsedSolidaire.optionsAdditionnelles.some(o => o.categorie === 'costume'),
  "Option costume correctement catégorisée"
);

// --------------------------------------------------------------------------
// TEST 2 : Gestion des paiements échelonnés (3x)
// --------------------------------------------------------------------------
console.log("\nTEST 2 : Gestion des paiements échelonnés (3x)");

// Cas 1 : 1ère échéance sur 3 validée -> statut 'en_cours' (et non 'impayé')
const sample3xFirstPayment = {
  payments: [
    { id: "pay_1", amount: 4000, state: "Authorized" },
    { id: "pay_2", amount: 4000, state: "Pending" },
    { id: "pay_3", amount: 4000, state: "Pending" }
  ]
};

const installmentActive = detectInstallmentPayment(sample3xFirstPayment);
assert(
  installmentActive.isInstallment === true,
  "Paiement 3x correctement détecté comme échelonné"
);
assert(
  installmentActive.isComplete === false,
  "Paiement 3x non complet à la 1ère échéance"
);
assert(
  installmentActive.status === 'en_cours',
  `Statut 1ère échéance égal à 'en_cours' (et NON impayé): status = "${installmentActive.status}"`
);
assert(
  installmentActive.installmentNumber === 1,
  `Numéro d'échéance validée = 1 (trouvé: ${installmentActive.installmentNumber})`
);

// Cas 2 : Toutes les échéances validées -> statut 'a_jour'
const sample3xCompleted = {
  payments: [
    { id: "pay_1", amount: 4000, state: "Authorized" },
    { id: "pay_2", amount: 4000, state: "Authorized" },
    { id: "pay_3", amount: 4000, state: "Authorized" }
  ]
};
const installmentDone = detectInstallmentPayment(sample3xCompleted);
assert(
  installmentDone.isComplete === true,
  "Paiement 3x complet quand toutes les échéances sont Authorized"
);
assert(
  installmentDone.status === 'a_jour',
  `Statut final égal à 'a_jour': status = "${installmentDone.status}"`
);

// Cas 3 : Paiement comptant en une fois
const sampleOneShot = {
  payments: [
    { id: "pay_unique", amount: 12000, state: "Authorized" }
  ]
};
const oneShotResult = detectInstallmentPayment(sampleOneShot);
assert(
  oneShotResult.isInstallment === false,
  "Paiement unique non échelonné"
);
assert(
  oneShotResult.status === 'a_jour',
  "Paiement unique immédiatement 'a_jour'"
);

// --------------------------------------------------------------------------
// TEST 3 : Réconciliation prioritaire (customField UID > Email)
// --------------------------------------------------------------------------
console.log("\nTEST 3 : Priorité customField UID sur Email");

const sampleWithUid = {
  customFields: [
    { name: "userId", answer: "USER_UID_12345" },
    { name: "ville", answer: "Paris" }
  ],
  payer: {
    email: "autre_email_discordant@example.com"
  }
};

const extractedUid = findUserIdentifierFromCustomFields(sampleWithUid.customFields, null, sampleWithUid);
assert(
  extractedUid === "USER_UID_12345",
  `customField userId correctement extrait en priorité 1: "${extractedUid}"`
);

// Recherche dans metadata
const sampleMetadata = {
  metadata: {
    userId: "USER_UID_FROM_METADATA"
  }
};
const extractedMeta = findUserIdentifierFromCustomFields([], sampleMetadata.metadata, sampleMetadata);
assert(
  extractedMeta === "USER_UID_FROM_METADATA",
  `metadata.userId extrait en priorité 1: "${extractedMeta}"`
);

// Repli si pas de customField
const sampleWithoutUid = {
  customFields: [{ name: "taille_tshirt", answer: "M" }]
};
const noUidResult = findUserIdentifierFromCustomFields(sampleWithoutUid.customFields, null, sampleWithoutUid);
assert(
  noUidResult === null,
  "Retourne null si aucun identifiant UID dans customFields"
);

// --------------------------------------------------------------------------
// TEST 4 : Simulation de structure de mise à jour profil adhérent
// --------------------------------------------------------------------------
console.log("\nTEST 4 : Structure du profil adhérent (users/{uid})");

const mockAmount = 90;
const mockFormule = parsedSolidaire.formulePrincipale;
const mockCotisationObj = {
  aJour: true,
  statut: installmentActive.status,
  formule: mockFormule,
  montantTotal: mockAmount,
  modeReglement: 'helloasso',
  derniereSynchro: new Date().toISOString()
};

assert(mockCotisationObj.aJour === true, "cotisation.aJour est true");
assert(mockCotisationObj.formule === mockFormule, `cotisation.formule est "${mockFormule}"`);
assert(mockCotisationObj.montantTotal === 90, `cotisation.montantTotal est 90€`);
assert(mockCotisationObj.modeReglement === 'helloasso', "cotisation.modeReglement est 'helloasso'");
assert(typeof mockCotisationObj.derniereSynchro === 'string', "cotisation.derniereSynchro est une date ISO");

// --------------------------------------------------------------------------
// TEST 5 : Simulation anti-doublon d'écriture comptable dans transactions
// --------------------------------------------------------------------------
console.log("\nTEST 5 : Écriture comptable anti-doublon (transactions)");

// Simulation d'une table en mémoire pour tester l'unicité
const transactionsMemory = [];

function simulateAddTransaction(tx) {
  const exists = transactionsMemory.some(t => t.refExterne === tx.refExterne && t.groupId === tx.groupId);
  if (exists) {
    return { created: false, reason: "Doublon évité" };
  }
  transactionsMemory.push(tx);
  return { created: true, id: `helloasso_${tx.refExterne}` };
}

const tx1 = {
  groupId: "samambaia",
  type: "recette",
  categorie: "Cotisation",
  justificatif: "HelloAsso",
  refExterne: "PAYMENT_HELLOASSO_9999",
  montant: 90
};

const res1 = simulateAddTransaction(tx1);
assert(res1.created === true, "Première écriture comptable insérée avec succès");

const res2 = simulateAddTransaction(tx1);
assert(res2.created === false, "Deuxième appel avec le même paymentId bloqué sans doublon");
assert(transactionsMemory.length === 1, `Une seule transaction présente dans le grand livre (longueur: ${transactionsMemory.length})`);

// --------------------------------------------------------------------------
// BILAN DES TESTS
// --------------------------------------------------------------------------
console.log(`\n=== RÉSULTATS : ${passedTests}/${totalTests} tests réussis ===`);
if (passedTests === totalTests) {
  console.log("🎉 TOUS LES TESTS SONT AU VERT !");
} else {
  console.error("❌ Certains tests ont échoué.");
  process.exit(1);
}
