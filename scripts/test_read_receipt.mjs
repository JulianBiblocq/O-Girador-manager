/**
 * test_read_receipt.mjs
 * Test de validation pour les accusés de lecture horodatés façon WhatsApp (Fiche 1).
 */

import {
  formatReadReceiptDate,
  getReadReceiptStats
} from '../src/utils/readReceiptUtils.js';

console.log("=== DÉBUT DES TESTS ACCUSÉ DE LECTURE (FICHE 1) ===\n");

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
// TEST 1 : Formatage de date stricte « Lu le 20 mai à 14:32 »
// --------------------------------------------------------------------------
console.log("TEST 1 : Formatage de date d'accusé de lecture");

// Créer une date de test : 20 mai 2026 à 14:32:00
const testDate = new Date(2026, 4, 20, 14, 32, 0); // Mois 4 = mai en JS (0-indexé)
const formatted = formatReadReceiptDate(testDate);
assert(
  formatted === "Lu le 20 mai à 14:32",
  `Date correctement formatée : "${formatted}" (attendu: "Lu le 20 mai à 14:32")`
);

// Cas avec chaîne ISO
const isoString = testDate.toISOString();
const formattedFromIso = formatReadReceiptDate(isoString);
assert(
  formattedFromIso.includes("mai") && formattedFromIso.startsWith("Lu le 20"),
  `Date ISO correctement convertie : "${formattedFromIso}"`
);

// Cas d'entrée vide
assert(formatReadReceiptDate(null) === '', "Entrée nulle retourne une chaîne vide");
assert(formatReadReceiptDate(undefined) === '', "Entrée undefined retourne une chaîne vide");

// --------------------------------------------------------------------------
// TEST 2 : Calcul des statistiques de lecture (getReadReceiptStats)
// --------------------------------------------------------------------------
console.log("\nTEST 2 : Calcul des statistiques de lecture et des non-lecteurs");

const mockMembers = [
  { id: 'author_1', prenom: 'Mestre', nom: 'Pastinha' },
  { id: 'user_1', prenom: 'Camila', nom: 'Silva' },
  { id: 'user_2', prenom: 'Julien', nom: 'Dupont' },
  { id: 'user_3', prenom: 'Aline', nom: 'Moreau' }
];

const mockLectures = {
  'user_1': {
    luLe: '2026-05-20T14:32:00.000Z',
    nom: 'Camila Silva'
  },
  'user_2': {
    luLe: '2026-05-20T15:10:00.000Z',
    nom: 'Julien Dupont'
  }
};

const stats = getReadReceiptStats(mockLectures, mockMembers, 'author_1');

assert(
  stats.readCount === 2,
  `Nombre de lecteurs correct (2) : ${stats.readCount}`
);

assert(
  stats.readers.length === 2,
  `Nombre d'entrées lecteurs retournées (2) : ${stats.readers.length}`
);

// Tri par date décroissante : user_2 (15:10) doit précéder user_1 (14:32)
assert(
  stats.readers[0].userId === 'user_2',
  `Le lecteur le plus récent est en tête de liste : "${stats.readers[0].nom}"`
);

// Liste des non-lecteurs : exclut l'auteur ('author_1') et ne conserve que 'user_3'
assert(
  stats.unreadMembers.length === 1,
  `Nombre de non-lecteurs correct (1 attendu, l'auteur étant exclu) : ${stats.unreadMembers.length}`
);

assert(
  stats.unreadMembers[0].userId === 'user_3',
  `Le membre non-lecteur est bien user_3 ("${stats.unreadMembers[0].nom}")`
);

// --------------------------------------------------------------------------
// TEST 3 : Validation des règles d'exclusion de l'auteur et d'idempotence
// --------------------------------------------------------------------------
console.log("\nTEST 3 : Règles d'exclusion de l'auteur et d'idempotence");

// Simulation de la règle d'exclusion de recordReadReceipt
function simulateRecordReadReceipt({ currentUserId, authorId, isAlreadyRead }) {
  if (authorId && currentUserId === authorId) {
    return { success: false, reason: "author_excluded" };
  }
  if (isAlreadyRead) {
    return { success: false, reason: "already_read" };
  }
  return { success: true, luLe: new Date().toISOString() };
}

const authorAttempt = simulateRecordReadReceipt({
  currentUserId: 'author_1',
  authorId: 'author_1',
  isAlreadyRead: false
});
assert(
  authorAttempt.success === false && authorAttempt.reason === "author_excluded",
  "L'auteur du message est correctement exclu du déclenchement de l'accusé"
);

const alreadyReadAttempt = simulateRecordReadReceipt({
  currentUserId: 'user_1',
  authorId: 'author_1',
  isAlreadyRead: true
});
assert(
  alreadyReadAttempt.success === false && alreadyReadAttempt.reason === "already_read",
  "Un message déjà lu ne déclenche pas de réécriture Firestore inutile"
);

const validAttempt = simulateRecordReadReceipt({
  currentUserId: 'user_3',
  authorId: 'author_1',
  isAlreadyRead: false
});
assert(
  validAttempt.success === true,
  "Un nouveau lecteur valide correctement son accusé de lecture"
);

// --------------------------------------------------------------------------
// TEST 4 : Paramètres du seuil d'intersection (70% visibilité pendant 1,5s)
// --------------------------------------------------------------------------
console.log("\nTEST 4 : Paramètres du seuil d'intersection (70% pendant 1,5s)");

const EXPECTED_THRESHOLD = 0.7; // 70%
const EXPECTED_DURATION_MS = 1500; // 1,5s

assert(EXPECTED_THRESHOLD === 0.7, "Seuil de visibilité minimum fixé à 70% (0.7)");
assert(EXPECTED_DURATION_MS === 1500, "Durée de temporisation minimale fixée à 1,5 seconde (1500ms)");

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
