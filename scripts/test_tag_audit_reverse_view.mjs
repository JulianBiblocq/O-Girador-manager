/**
 * Script de test unitaire et de validation pour la vue inverse et l'audit d'attribution des badges.
 * Vérifie le comptage précis des porteurs, la détection multi-critères (id, nomM, nomF),
 * l'exclusion des profils archivés et l'opération de dissociation sans effet de bord.
 */

import assert from 'assert';

console.log("===============================================================");
console.log("🧪 DÉBUT DES TESTS : VUE INVERSE & AUDIT D'ATTRIBUTION DES BADGES");
console.log("===============================================================\n");

// Fonction logique de correspondance de tag (identique à celle de TagMembersAuditModal et TagManager)
function isTagMatch(userTag, targetTag) {
  if (!userTag || !targetTag) return false;
  const targetId = (targetTag.id || '').toLowerCase().trim();
  const targetNomM = (targetTag.nomM || '').toLowerCase().trim();
  const targetNomF = (targetTag.nomF || '').toLowerCase().trim();

  const uTagStr = typeof userTag === 'string'
    ? userTag.toLowerCase().trim()
    : (userTag.id || userTag.nomM || userTag.nom || '').toLowerCase().trim();

  return (targetId && uTagStr === targetId) ||
         (targetNomM && uTagStr === targetNomM) ||
         (targetNomF && uTagStr === targetNomF);
}

// Fonction de vérification de porteur pour un profil utilisateur
function isMemberCarrierOfTag(member, tag) {
  if (!member || !Array.isArray(member.tags) || !tag) return false;
  return member.tags.some((t) => isTagMatch(t, tag));
}

// Jeu de données de test représentatif
const mockTags = [
  { id: 'presidente', nomM: 'Président', nomF: 'Présidente', inheritsFrom: ['Bureau'] },
  { id: 'tresorier', nomM: 'Trésorier', nomF: 'Trésorière', inheritsFrom: ['Bureau'] },
  { id: 'diffusion', nomM: 'Chargé de diffusion', nomF: 'Chargée de diffusion' },
  { id: 'sans_porteur', nomM: 'Archiviste', nomF: 'Archiviste' }
];

const mockUsers = [
  {
    id: 'u1',
    prenom: 'Camille',
    nom: 'Dupont',
    surnom: 'Mimi',
    statutActuel: 'actif',
    tags: ['presidente', 'Bureau'] // Tag stocké sous forme d'id string
  },
  {
    id: 'u2',
    prenom: 'Lucas',
    nom: 'Martin',
    surnom: 'Lulu',
    statutActuel: 'actif',
    tags: [{ id: 'presidente', nomM: 'Président' }] // Tag stocké sous forme d'objet
  },
  {
    id: 'u3',
    prenom: 'Elena',
    nom: 'Ribeiro',
    surnom: 'Foguete',
    statutActuel: 'actif',
    tags: ['Présidente'] // Tag stocké sous la variante féminine textuelle
  },
  {
    id: 'u4',
    prenom: 'Marc',
    nom: 'Dubois',
    surnom: 'Bateria',
    statutActuel: 'archived', // Membre archivé : doit être exclu de l'audit
    tags: ['presidente', 'tresorier']
  },
  {
    id: 'u5',
    prenom: 'Sophie',
    nom: 'Lemoine',
    statutActuel: 'actif',
    tags: ['Trésorière', 'diffusion'] // Porteuse Trésorière (variante nomF) et diffusion
  },
  {
    id: 'u6',
    prenom: 'Jean',
    nom: 'Valjean',
    statutActuel: 'actif',
    tags: [] // Aucun tag
  },
  {
    id: 'u7',
    prenom: 'Sans',
    nom: 'Tags',
    statutActuel: 'actif' // tags non défini
  }
];

let totalAssertions = 0;

function runTest(description, testFn) {
  try {
    testFn();
    totalAssertions++;
    console.log(`  ✅ [PASS] ${description}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Détails: ${err.message}`);
    throw err;
  }
}

// 1. Tests unitaires de la correspondance de tags (isTagMatch)
console.log("📌 Module 1 : Logique de correspondance multi-critères (isTagMatch)");

runTest("Correspondance par identifiant exact (minuscule)", () => {
  assert.strictEqual(isTagMatch('presidente', mockTags[0]), true);
});

runTest("Correspondance par variante masculine 'Président' insensible à la casse et espaces", () => {
  assert.strictEqual(isTagMatch('  président  ', mockTags[0]), true);
});

runTest("Correspondance par variante féminine 'Présidente' avec accents", () => {
  assert.strictEqual(isTagMatch('Présidente', mockTags[0]), true);
});

runTest("Correspondance avec tag utilisateur stocké en objet { id: 'tresorier' }", () => {
  assert.strictEqual(isTagMatch({ id: 'tresorier' }, mockTags[1]), true);
});

runTest("Correspondance avec tag utilisateur stocké en objet { nomM: 'Trésorier' }", () => {
  assert.strictEqual(isTagMatch({ nomM: 'Trésorier' }, mockTags[1]), true);
});

runTest("Non-correspondance avec un autre badge", () => {
  assert.strictEqual(isTagMatch('diffusion', mockTags[0]), false);
});

runTest("Gestion sécurisée des valeurs nulles ou indéfinies", () => {
  assert.strictEqual(isTagMatch(null, mockTags[0]), false);
  assert.strictEqual(isTagMatch('presidente', null), false);
  assert.strictEqual(isTagMatch(undefined, undefined), false);
});

// 2. Tests du filtrage des membres porteurs et exclusion des profils archivés
console.log("\n📌 Module 2 : Filtrage réactif des membres porteurs et exclusion des archivés");

// Filtrage préliminaire des membres actifs (comme dans TagManager onSnapshot)
const activeMembers = mockUsers.filter(u => u.statutActuel !== 'archived');

runTest("Exclusion stricte du membre archivé (u4)", () => {
  assert.strictEqual(activeMembers.some(m => m.id === 'u4'), false);
  assert.strictEqual(activeMembers.length, 6);
});

runTest("Comptage exact des porteurs pour le badge 'Président / Présidente' (u1, u2, u3)", () => {
  const carriers = activeMembers.filter(m => isMemberCarrierOfTag(m, mockTags[0]));
  assert.strictEqual(carriers.length, 3);
  const carrierIds = carriers.map(c => c.id).sort();
  assert.deepStrictEqual(carrierIds, ['u1', 'u2', 'u3']);
});

runTest("Comptage exact des porteurs pour le badge 'Trésorier / Trésorière' (u5)", () => {
  const carriers = activeMembers.filter(m => isMemberCarrierOfTag(m, mockTags[1]));
  assert.strictEqual(carriers.length, 1);
  assert.strictEqual(carriers[0].id, 'u5');
});

runTest("Comptage exact des porteurs pour le badge 'Chargé de diffusion' (u5)", () => {
  const carriers = activeMembers.filter(m => isMemberCarrierOfTag(m, mockTags[2]));
  assert.strictEqual(carriers.length, 1);
  assert.strictEqual(carriers[0].id, 'u5');
});

runTest("Badge sans porteur : effectif à 0 (déclenche EmptyState)", () => {
  const carriers = activeMembers.filter(m => isMemberCarrierOfTag(m, mockTags[3]));
  assert.strictEqual(carriers.length, 0);
});

// 3. Tests de l'opération de dissociation / retrait rapide d'un badge
console.log("\n📌 Module 3 : Opération de dissociation sans altération des autres données");

runTest("Retrait du tag 'presidente' chez u1 (doit conserver 'Bureau')", () => {
  const member = mockUsers.find(u => u.id === 'u1');
  const initialTags = [...member.tags];
  const updatedTags = initialTags.filter(t => !isTagMatch(t, mockTags[0]));

  assert.deepStrictEqual(updatedTags, ['Bureau']);
  assert.strictEqual(updatedTags.length, 1);
});

runTest("Retrait du tag 'diffusion' chez u5 (doit conserver 'Trésorière')", () => {
  const member = mockUsers.find(u => u.id === 'u5');
  const initialTags = [...member.tags];
  const updatedTags = initialTags.filter(t => !isTagMatch(t, mockTags[2]));

  assert.deepStrictEqual(updatedTags, ['Trésorière']);
});

runTest("Retrait d'un tag objet chez u2 (la liste devient vide)", () => {
  const member = mockUsers.find(u => u.id === 'u2');
  const initialTags = [...member.tags];
  const updatedTags = initialTags.filter(t => !isTagMatch(t, mockTags[0]));

  assert.deepStrictEqual(updatedTags, []);
});

runTest("Tentative de retrait sur un membre sans ce tag : aucun changement", () => {
  const member = mockUsers.find(u => u.id === 'u6');
  const initialTags = [...member.tags];
  const updatedTags = initialTags.filter(t => !isTagMatch(t, mockTags[0]));

  assert.deepStrictEqual(updatedTags, initialTags);
});

console.log("\n===============================================================");
console.log(`🎉 SUCCÈS TOTAL : ${totalAssertions} assertions validées sans aucune erreur !`);
console.log("===============================================================");
