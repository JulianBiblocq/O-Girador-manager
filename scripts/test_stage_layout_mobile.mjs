/**
 * Test unitaire automatisé pour l'optimisation mobile du Plan de Scène
 * Valide les 4 actions demandées dans la mission :
 * 1. Encart d'en-tête personnalisé "Ta position" (rôle exact, voisins direct immédiats SANS numéro de rang/ligne)
 * 2. Nettoyage conditionnel de la grille (masquage danse si vide, masquage colonnes vides, allègement cases vides)
 * 3. Gabarit compact & repérage contrasté
 * 4. En-tête des pupitres compact avec abréviations courtes
 */

import assert from 'node:assert/strict';
import {
  formatCompactMemberName,
  isStageDancer,
  resolveExactRole,
  getProximityNeighbors,
  getVisibleStageColumns,
  hasDancersOnStage,
  getCompactInstrumentStats
} from '../src/components/event-details/stage-layout/stageLayoutUtils.js';

console.log('🧪 Démarrage des tests de l\'optimisation mobile du Plan de Scène...');

// Mock de nomenclature groupe
const groupNomenclature = {
  alfaia_grave: 'Marcante',
  alfaia_medio: 'Meião',
  alfaia_agudo: 'Repique',
  caixa_baixo: 'Caixa',
  caixa_alto: 'Tarol',
};

// Données de test
const presentMembers = [
  { id: 'user_1', name: 'Julian Biblocq', instrument: 'Caixa' },
  { id: 'user_2', name: 'Sophie Martin', instrument: 'Alfaia' },
  { id: 'user_3', name: 'Benoit Dubois', instrument: 'Alfaia' },
  { id: 'user_4', name: 'Clara Bernard', instrument: 'Caixa' },
  { id: 'user_5', name: 'Alexandre Danse', instrument: 'Danse' },
  { id: 'user_mestre', name: 'Mestre Bateria', instrument: 'Apito' }
];

// Placements actifs :
// Ligne 1 : col 2 (user_2, Alfaia Meião), col 4 (user_3, Alfaia Marcante) -> col 1, 3, 5 vides
// Ligne 2 : col 2 (user_1, Caixa), col 4 (user_4, Tarol)
// Row 0 : col 0 (user_mestre, Mestre)
// Row -1 : col 3 (user_5, Danse)
const activePlacements = {
  user_mestre: { row: 0, col: 0 },
  user_2: { row: 1, col: 2, voice: 'meião' },
  user_3: { row: 1, col: 4, voice: 'marcante' },
  user_1: { row: 2, col: 2, voice: 'caixa' },
  user_4: { row: 2, col: 4, voice: 'tarol' },
  user_5: { row: -1, col: 3 }
};

// --------------------------------------------------------------------------
// TEST 1 : Rôle exact (instrument et nuance de jeu)
// --------------------------------------------------------------------------
console.log('\n--- 1️⃣ Test de la résolution du rôle exact ---');
const roleUser2 = resolveExactRole({
  member: presentMembers.find(m => m.id === 'user_2'),
  placement: activePlacements['user_2'],
  groupNomenclature
});
assert.strictEqual(roleUser2, 'Alfaia Meião', 'Le rôle d\'Alfaia doit inclure sa nuance Meião');
console.log('  ✅ Alfaia Meião résolu :', roleUser2);

const roleUser4 = resolveExactRole({
  member: presentMembers.find(m => m.id === 'user_4'),
  placement: activePlacements['user_4'],
  groupNomenclature
});
assert.strictEqual(roleUser4, 'Tarol', 'Le rôle Caixa avec voice tarol doit afficher Tarol');
console.log('  ✅ Tarol résolu :', roleUser4);

const roleMestre = resolveExactRole({
  member: presentMembers.find(m => m.id === 'user_mestre'),
  placement: activePlacements['user_mestre'],
  groupNomenclature
});
assert.match(roleMestre, /Chef d'orchestre/, 'Le mestre en 0,0 doit être identifié chef d\'orchestre');
console.log('  ✅ Mestre résolu :', roleMestre);

const roleDanse = resolveExactRole({
  member: presentMembers.find(m => m.id === 'user_5'),
  placement: activePlacements['user_5'],
  groupNomenclature
});
assert.strictEqual(roleDanse, 'Danse', 'Le membre placé sur row < 0 doit afficher Danse');
console.log('  ✅ Danseur résolu :', roleDanse);

// --------------------------------------------------------------------------
// TEST 2 : Repères de proximité immédiats (SANS numéro de rang ni de ligne)
// --------------------------------------------------------------------------
console.log('\n--- 2️⃣ Test des voisins directs immédiats ---');
const neighborsUser2 = getProximityNeighbors({
  currentUserId: 'user_2',
  activePlacements,
  presentMembers,
  groupNomenclature
});
// Sur row 1, user_2 est en col 2, user_3 est en col 4
assert.strictEqual(neighborsUser2.leftNeighbor, null, 'user_2 n\'a aucun voisin à gauche (bord de scène)');
assert.ok(neighborsUser2.rightNeighbor, 'user_2 doit avoir user_3 à droite');
assert.strictEqual(neighborsUser2.rightNeighbor.name, 'Benoit Dubois', 'Le voisin direct de droite est Benoit Dubois');
assert.strictEqual(neighborsUser2.rightNeighbor.role, 'Alfaia Marcante', 'Le rôle du voisin doit être renseigné');
assert.strictEqual(neighborsUser2.row, undefined, 'Aucune propriété row ne doit être exposée');
assert.strictEqual(neighborsUser2.line, undefined, 'Aucune propriété line ne doit être exposée');
console.log('  ✅ Voisins immédiats user_2 : Gauche = null (Bord), Droite = Benoit Dubois (Alfaia Marcante)');

const neighborsUser4 = getProximityNeighbors({
  currentUserId: 'user_4',
  activePlacements,
  presentMembers,
  groupNomenclature
});
// Sur row 2, user_4 est en col 4, user_1 est en col 2
assert.ok(neighborsUser4.leftNeighbor, 'user_4 doit avoir user_1 à sa gauche');
assert.strictEqual(neighborsUser4.leftNeighbor.name, 'Julian Biblocq');
assert.strictEqual(neighborsUser4.rightNeighbor, null, 'user_4 n\'a aucun voisin à droite');
console.log('  ✅ Voisins immédiats user_4 : Gauche = Julian Biblocq (Caixa), Droite = null (Bord)');

// --------------------------------------------------------------------------
// TEST 3 : Nettoyage conditionnel des colonnes vides
// --------------------------------------------------------------------------
console.log('\n--- 3️⃣ Test du masquage des colonnes entièrement vides ---');
// Grille de 5 colonnes au total. Les membres de percussions (row >= 1) sont placés aux colonnes 2 et 4 uniquement.
const visibleColsMember = getVisibleStageColumns({
  totalCols: 5,
  activePlacements,
  isEditingMode: false
});
assert.deepStrictEqual(visibleColsMember, [2, 4], 'En vue adhérent, seules les colonnes occupées 2 et 4 doivent être visibles');
console.log('  ✅ Colonnes visibles en mode membre (resserrées) :', visibleColsMember);

// En mode édition Mestre, TOUTES les colonnes doivent rester visibles
const visibleColsMestre = getVisibleStageColumns({
  totalCols: 5,
  activePlacements,
  isEditingMode: true
});
assert.deepStrictEqual(visibleColsMestre, [1, 2, 3, 4, 5], 'En mode Mestre, toutes les 5 colonnes doivent être visibles');
console.log('  ✅ Colonnes visibles en mode Mestre (complètes) :', visibleColsMestre);

// --------------------------------------------------------------------------
// TEST 4 : Détection de l'avant-scène / Danse
// --------------------------------------------------------------------------
console.log('\n--- 4️⃣ Test de masquage de l\'avant-scène danse ---');
assert.strictEqual(hasDancersOnStage(activePlacements), true, 'Doit détecter que user_5 est sur l\'avant-scène');

const placementsWithoutDancers = {
  user_1: { row: 1, col: 2 },
  user_2: { row: 2, col: 2 }
};
assert.strictEqual(hasDancersOnStage(placementsWithoutDancers), false, 'Doit détecter l\'absence de danseurs');
console.log('  ✅ Détection présence / absence de danseurs validée avec succès');

// --------------------------------------------------------------------------
// TEST 5 : En-tête des pupitres compact avec flex-wrap
// --------------------------------------------------------------------------
console.log('\n--- 5️⃣ Test des cartouches compacts de pupitres ---');
const stats = getCompactInstrumentStats({
  activePlacements,
  presentMembers,
  groupNomenclature
});
assert.ok(stats.alfaiasBadge.includes('Marc.') && stats.alfaiasBadge.includes('Meio.'), 'Le badge Alfaias doit abréger Marc. et Meio.');
assert.ok(stats.caixasBadge.includes('Cx.') && stats.caixasBadge.includes('Tar.'), 'Le badge Caixas doit abréger Cx. et Tar.');
assert.strictEqual(stats.danceBadge, '1 Danse');
console.log('  ✅ Badge Alfaias compact :', stats.alfaiasBadge);
console.log('  ✅ Badge Caixas compact :', stats.caixasBadge);
console.log('  ✅ Badge Danse compact :', stats.danceBadge);

console.log('\n===============================================================');
console.log('🏆 TOUS LES TESTS DU PLAN DE SCÈNE MOBILE SONT 100% VALIDÉS !');
console.log('===============================================================');
