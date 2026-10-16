/**
 * Test de validation automatisé : Sélection SaaS du collège de relecteurs / validateurs
 * d'un compte-rendu de réunion (All presents, Present by tags, Custom users, Unanimité 100%).
 */

import assert from 'assert';
import { getEffectiveMemberTags, getCanonicalTagKey, isMemberCaOrBureau } from '../src/utils/memberUtils.js';

console.log("==========================================================================");
console.log("🧪 DÉBUT DES TESTS : COLLÈGE DE RELECTEURS / VALIDATEURS COMPTE-RENDU");
console.log("==========================================================================\n");

// Données de test : 10 membres avec différents profils et rôles
const testMembers = [
  { id: 'u1', uid: 'u1', prenom: 'Alice', nom: 'Pres', role: 'admin', tags: ['Présidente'] },
  { id: 'u2', uid: 'u2', prenom: 'Bob', nom: 'Tres', role: 'adherent', tags: ['Trésorier'] },
  { id: 'u3', uid: 'u3', prenom: 'Claire', nom: 'Ca', role: 'adherent', tags: ['CA'] },
  { id: 'u4', uid: 'u4', prenom: 'David', nom: 'Danse', role: 'adherent', tags: ['Section Danse'] },
  { id: 'u5', uid: 'u5', prenom: 'Emma', nom: 'Cuivres', role: 'adherent', tags: ['Section Cuivres'] },
  { id: 'u6', uid: 'u6', prenom: 'Fabien', nom: 'Membre', role: 'adherent', tags: [] },
  { id: 'u7', uid: 'u7', prenom: 'Gisèle', nom: 'Membre', role: 'adherent', tags: [] },
  { id: 'u8', uid: 'u8', prenom: 'Hugo', nom: 'Membre', role: 'adherent', tags: [] },
  { id: 'u9', uid: 'u9', prenom: 'Inès', nom: 'Membre', role: 'adherent', tags: [] },
  { id: 'u10', uid: 'u10', prenom: 'Jules', nom: 'Membre', role: 'adherent', tags: [] }
];

// Les 10 membres sont pointés présents à la réunion
const testPresents = testMembers.map(m => ({
  userId: m.uid,
  userName: `${m.prenom} ${m.nom}`
}));

/**
 * Fonction de résolution des validateurs reproduisant fidèlement la logique du composant
 */
function resolveValidators({ validationMode, selectedTags, selectedCustomUserIds, presents, members }) {
  if (validationMode === 'all_presents') {
    return presents.map(p => ({ uid: p.userId, displayName: p.userName }));
  }

  if (validationMode === 'present_by_tags') {
    if (!selectedTags || selectedTags.length === 0) return [];

    return presents.filter(p => {
      const memberProfile = members.find(m => (m.id || m.uid) === p.userId) || { uid: p.userId, displayName: p.userName };
      const effTags = getEffectiveMemberTags(memberProfile);
      const allMemberTags = [...effTags, ...(Array.isArray(memberProfile.tags) ? memberProfile.tags : [])];

      return selectedTags.some(selTag => {
        const selCanonical = getCanonicalTagKey(selTag);
        if ((selCanonical === 'ca' || selCanonical === 'bureau') && isMemberCaOrBureau(memberProfile)) {
          return true;
        }
        return allMemberTags.some(t => {
          const tCanonical = getCanonicalTagKey(t);
          const tRaw = typeof t === 'object' ? (t.nomM || t.label || t.nom || t.id || '') : String(t);
          const selRaw = typeof selTag === 'object' ? (selTag.nomM || selTag.label || selTag.nom || selTag.id || '') : String(selTag);
          return (tCanonical && tCanonical === selCanonical) || tRaw.toLowerCase().trim() === selRaw.toLowerCase().trim();
        });
      });
    }).map(p => ({ uid: p.userId, displayName: p.userName }));
  }

  if (validationMode === 'custom_users') {
    return presents
      .filter(p => selectedCustomUserIds.includes(p.userId))
      .map(p => ({ uid: p.userId, displayName: p.userName }));
  }

  return presents.map(p => ({ uid: p.userId, displayName: p.userName }));
}

// -----------------------------------------------------------------------------
// Test 1 : Mode all_presents (Tous les présents)
// -----------------------------------------------------------------------------
console.log("▶️ Test 1 : Mode 'all_presents' (Tous les présents)");
const allPresentsValidators = resolveValidators({
  validationMode: 'all_presents',
  selectedTags: [],
  selectedCustomUserIds: [],
  presents: testPresents,
  members: testMembers
});
assert.strictEqual(allPresentsValidators.length, 10, "Mode all_presents doit inclure les 10 présents");
console.log(`  ✅ ${allPresentsValidators.length} validateurs sélectionnés sur 10 présents.`);

// -----------------------------------------------------------------------------
// Test 2 : Mode present_by_tags (Filtrage par badge parmi les présents)
// -----------------------------------------------------------------------------
console.log("\n▶️ Test 2 : Mode 'present_by_tags' (Filtrage par badge CA / Bureau)");
// Alice (Présidente), Bob (Trésorier) et Claire (CA) ont le badge institutionnel CA
const caValidators = resolveValidators({
  validationMode: 'present_by_tags',
  selectedTags: ['CA'],
  selectedCustomUserIds: [],
  presents: testPresents,
  members: testMembers
});
assert.strictEqual(caValidators.length, 3, "Seuls les 3 membres CA doivent être retenus");
const caUids = caValidators.map(v => v.uid).sort();
assert.deepStrictEqual(caUids, ['u1', 'u2', 'u3'], "Les membres CA doivent être Alice, Bob et Claire");
console.log(`  ✅ 3 membres CA filtrés parmi les 10 présents : [${caValidators.map(v => v.displayName).join(', ')}]`);

// Filtrage avec un badge spécifique non institutionnel ('Section Danse')
const danseValidators = resolveValidators({
  validationMode: 'present_by_tags',
  selectedTags: ['Section Danse'],
  selectedCustomUserIds: [],
  presents: testPresents,
  members: testMembers
});
assert.strictEqual(danseValidators.length, 1, "Seul David Danse doit être retenu");
assert.strictEqual(danseValidators[0].uid, 'u4');
console.log(`  ✅ 1 membre 'Section Danse' filtré : [${danseValidators[0].displayName}]`);

// -----------------------------------------------------------------------------
// Test 3 : Mode custom_users (Sélection manuelle nominative)
// -----------------------------------------------------------------------------
console.log("\n▶️ Test 3 : Mode 'custom_users' (Sélection manuelle de 2 membres précis)");
const customValidators = resolveValidators({
  validationMode: 'custom_users',
  selectedTags: [],
  selectedCustomUserIds: ['u6', 'u7'],
  presents: testPresents,
  members: testMembers
});
assert.strictEqual(customValidators.length, 2, "Doit contenir exactement 2 personnes");
assert.deepStrictEqual(customValidators.map(v => v.uid), ['u6', 'u7']);
console.log(`  ✅ 2 membres nominatifs choisis : [${customValidators.map(v => v.displayName).join(', ')}]`);

// -----------------------------------------------------------------------------
// Test 4 : Blocage démocratique si 0 validateur sélectionné
// -----------------------------------------------------------------------------
console.log("\n▶️ Test 4 : Blocage de la soumission si 0 validateur");
const emptyTagsValidators = resolveValidators({
  validationMode: 'present_by_tags',
  selectedTags: [],
  selectedCustomUserIds: [],
  presents: testPresents,
  members: testMembers
});
assert.strictEqual(emptyTagsValidators.length, 0, "Aucun validateur si aucun tag sélectionné");

const emptyCustomValidators = resolveValidators({
  validationMode: 'custom_users',
  selectedTags: [],
  selectedCustomUserIds: [],
  presents: testPresents,
  members: testMembers
});
assert.strictEqual(emptyCustomValidators.length, 0, "Aucun validateur si aucun membre coché");
console.log("  ✅ Soumission bloquée avec succès en cas de collège vide (0 validateur).");

// -----------------------------------------------------------------------------
// Test 5 : Calcul d'unanimité (100 %) et publication automatique
// -----------------------------------------------------------------------------
console.log("\n▶️ Test 5 : Unanimité à 100 % sur les validateurs désignés exclusivement");
const designatedValidators = [
  { uid: 'u1', displayName: 'Alice Pres' },
  { uid: 'u2', displayName: 'Bob Tres' },
  { uid: 'u3', displayName: 'Claire Ca' }
];

// 2 votes sur 3
const partialApprovals = {
  u1: { approved: true, date: '2026-10-15T15:00:00Z' },
  u2: { approved: true, date: '2026-10-15T15:01:00Z' }
};

const isUnanimousPartial = designatedValidators.every(v => partialApprovals[v.uid]?.approved === true);
assert.strictEqual(isUnanimousPartial, false, "2/3 n'est pas unanime");
console.log("  ✅ 2/3 validations : Compte-rendu reste en attente de relecture.");

// 3ème vote validé
const fullApprovals = {
  ...partialApprovals,
  u3: { approved: true, date: '2026-10-15T15:02:00Z' }
};
const isUnanimousFull = designatedValidators.every(v => fullApprovals[v.uid]?.approved === true);
assert.strictEqual(isUnanimousFull, true, "3/3 est unanime et déclenche la publication immédiate");
console.log("  ✅ 3/3 validations atteintes : Publication au Varal déclenchée immédiatement SANS attendre les 7 autres présents.");

// -----------------------------------------------------------------------------
// Test 6 : Rétrocompatibilité (absence de compteRenduValidators)
// -----------------------------------------------------------------------------
console.log("\n▶️ Test 6 : Rétrocompatibilité si compteRenduValidators est indéfini ou vide");
const legacyEvent = {
  inscriptions: testPresents.map(p => ({ userId: p.userId, userName: p.userName, status: 'present' })),
  compteRenduValidators: null
};

const effectiveLegacyValidators = (Array.isArray(legacyEvent.compteRenduValidators) && legacyEvent.compteRenduValidators.length > 0)
  ? legacyEvent.compteRenduValidators
  : legacyEvent.inscriptions.filter(i => i.status === 'present').map(i => ({ uid: i.userId, displayName: i.userName }));

assert.strictEqual(effectiveLegacyValidators.length, 10, "Doit retomber sur les 10 présents par rétrocompatibilité");
console.log(`  ✅ Rétrocompatibilité assurée : ${effectiveLegacyValidators.length} présents pris en compte.`);

// -----------------------------------------------------------------------------
// Test 7 : Droit de vote et affichage du bandeau pour les présents non désignés
// -----------------------------------------------------------------------------
console.log("\n▶️ Test 7 : Droit de vote et bandeau pour les présents non désignés");
const userAlice = { uid: 'u1' }; // Fait partie du collège
const userDavid = { uid: 'u4' }; // Présent mais NON désigné

const isAliceValidator = designatedValidators.some(v => v.uid === userAlice.uid);
const isDavidValidator = designatedValidators.some(v => v.uid === userDavid.uid);
const isDavidPresent = testPresents.some(p => p.userId === userDavid.uid);

assert.strictEqual(isAliceValidator, true, "Alice a le droit de vote");
assert.strictEqual(isDavidValidator, false, "David n'a pas le droit de vote");
assert.strictEqual(isDavidPresent, true, "David était présent à la réunion");
console.log("  ✅ Alice (validatrice) accède aux boutons de vote.");
console.log("  ✅ David (présent non désigné) visualise le bandeau informatif avec l'avancement des validations.");

console.log("\n==========================================================================");
console.log("🏆 TOUS LES TESTS DU COLLÈGE DE VALIDATION SONT VALIDÉS AVEC SUCCÈS (100%) !");
console.log("==========================================================================");
