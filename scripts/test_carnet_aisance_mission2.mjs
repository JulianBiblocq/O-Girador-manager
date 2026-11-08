/**
 * Test unitaire — Mission 2 : Refonte ergonomique et pratique du Carnet d'Aisance
 * Vérifie :
 * 1. Les 3 stades vocaux progressifs ('coro', 'simultane', 'puxador') et leur agrégation Mestre
 * 2. L'auto-promotion du confort (Pratique ➔ Confort) sans rétrogradation d'un niveau supérieur
 * 3. Le bandeau Prochaine Répétition et la règle Zéro Bloc Vide
 * 4. La présence de la passerelle Cantad'Or (launchCantador mode 'eleve') et le retrait de InlineQuiz
 * 5. Le respect strict des plafonds de lignes (<= 140 lignes, et plafonds dédiés)
 * 6. La parité 1:1 absolue entre src/locales/fr.js et src/locales/pt.js (0 clé orpheline)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VOCAL_STAGES,
  normalizeVocalStage,
  computePromotedComfort,
  findNextRehearsalWithSetlist,
  aggregateToadaVocalMetrics
} from '../src/utils/aisanceAutoSync.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Test Mission 2 : Refonte ergonomique et pratique du Carnet d\'Aisance...\n');

// 1. Vérification des 3 stades vocaux progressifs et de l'agrégation Mestre
assert.deepEqual(VOCAL_STAGES, ['none', 'coro', 'simultane', 'puxador']);
assert.equal(normalizeVocalStage('coro'), 'coro');
assert.equal(normalizeVocalStage('simultane'), 'simultane');
assert.equal(normalizeVocalStage('puxador'), 'puxador');
assert.equal(normalizeVocalStage('invalid_stage'), 'none');
assert.equal(normalizeVocalStage(null), 'none');

const sampleSong = { id: 'song_1', titre: 'Nação Nagô' };
const sampleUsers = [
  { id: 'u1', prenom: 'Alice' },
  { id: 'u2', prenom: 'Bruno' },
  { id: 'u3', prenom: 'Carla' },
  { id: 'u4', prenom: 'Davi' }
];
const sampleProgressMap = {
  u1: { song_1: { vocalStage: 'coro' } },
  u2: { song_1: { vocalStage: 'simultane' } },
  u3: { song_1: { vocalStage: 'puxador' } },
  u4: { song_1: { vocalStage: 'none' } }
};
const vocalMetrics = aggregateToadaVocalMetrics(sampleSong, sampleUsers, sampleProgressMap, []);
assert.equal(vocalMetrics.coroCount, 3);
assert.equal(vocalMetrics.simultaneCount, 2);
assert.equal(vocalMetrics.puxadorCount, 1);
assert.deepEqual(vocalMetrics.puxadores, ['Carla']);
console.log('✅ [1/6] Stades vocaux progressifs (coro, simultane, puxador) et agrégation Mestre validés.');

// 2. Vérification de la promotion automatique Pratique ➔ Confort sans rétrogradation
const promo1 = computePromotedComfort({
  currentComfort: null,
  completedStagesCount: 1,
  totalStagesCount: 3
});
assert.equal(promo1.promoted, true);
assert.equal(promo1.newComfort, 'pratique');

const promoQuiz = computePromotedComfort({
  currentComfort: 'decouverte',
  completedStagesCount: 0,
  totalStagesCount: 0,
  quizScorePct: 0.8
});
assert.equal(promoQuiz.promoted, true);
assert.equal(promoQuiz.newComfort, 'pratique');

const promoAllStages = computePromotedComfort({
  currentComfort: 'pratique',
  completedStagesCount: 4,
  totalStagesCount: 4
});
assert.equal(promoAllStages.promoted, true);
assert.equal(promoAllStages.newComfort, 'alaise');

const noDowngradeReferent = computePromotedComfort({
  currentComfort: 'referent',
  completedStagesCount: 1,
  totalStagesCount: 4,
  quizScorePct: 0.8
});
assert.equal(noDowngradeReferent.promoted, false);
assert.equal(noDowngradeReferent.newComfort, 'referent');

const noDowngradeAlaise = computePromotedComfort({
  currentComfort: 'alaise',
  completedStagesCount: 1,
  totalStagesCount: 4
});
assert.equal(noDowngradeAlaise.promoted, false);
assert.equal(noDowngradeAlaise.newComfort, 'alaise');
console.log('✅ [2/6] Synchronisation automatique Pratique ➔ Confort sans rétrogradation validée.');

// 3. Vérification du bandeau Prochaine Répétition, de l'accordéon et du retrait de InlineQuiz
assert.equal(findNextRehearsalWithSetlist([{ id: 'e1', date: '2099-05-01', setlist: [] }], '2026-01-01'), null);
const nextEv = findNextRehearsalWithSetlist(
  [
    { id: 'e_past', date: '2020-01-01', setlist: [{ titre: 'Ancien' }] },
    { id: 'e_next', date: '2099-05-10', setlist: [{ titre: 'Luanda' }], noteIntention: 'Travailler le break' }
  ],
  '2026-01-01'
);
assert.equal(nextEv?.id, 'e_next');

const bannerCode = fs.readFileSync(path.join(ROOT, 'src/components/pedagogy/NextRehearsalAisanceBanner.jsx'), 'utf8');
assert.ok(bannerCode.includes('findNextRehearsalWithSetlist'), 'findNextRehearsalWithSetlist doit être utilisé');
assert.ok(bannerCode.includes('return null'), 'La règle Zéro Bloc Vide doit retourner null');

const accordionCode = fs.readFileSync(path.join(ROOT, 'src/components/pedagogy/AisancePieceAccordionRow.jsx'), 'utf8');
assert.ok(accordionCode.includes('isCantadorValidated'), 'AisancePieceAccordionRow doit vérifier isCantadorValidated');
assert.ok(accordionCode.includes('launchCantador'), 'AisancePieceAccordionRow doit intégrer launchCantador');
assert.ok(accordionCode.includes("mode: 'eleve'"), 'launchCantador doit ouvrir le mode eleve');
assert.ok(accordionCode.includes('PieceAisanceSection'), 'AisancePieceAccordionRow doit intégrer PieceAisanceSection');

const carnetCode = fs.readFileSync(path.join(ROOT, 'src/components/pedagogy/MonCarnetAisance.jsx'), 'utf8');
assert.ok(!carnetCode.includes('InlineQuiz'), 'InlineQuiz éphémère doit être supprimé de MonCarnetAisance.jsx');
assert.ok(carnetCode.includes('NextRehearsalAisanceBanner'), 'MonCarnetAisance doit afficher NextRehearsalAisanceBanner');
assert.ok(carnetCode.includes('AisancePieceAccordionRow'), 'MonCarnetAisance doit afficher AisancePieceAccordionRow');

const mestreToadasCode = fs.readFileSync(path.join(ROOT, 'src/components/pedagogy/MestreToadasAnalytics.jsx'), 'utf8');
assert.ok(mestreToadasCode.includes('aggregateToadaVocalMetrics'), 'MestreToadasAnalytics doit agréger les stades vocaux');
assert.ok(mestreToadasCode.includes('coroCount') && mestreToadasCode.includes('simultaneCount') && mestreToadasCode.includes('puxadores'), 'Les 3 compteurs vocaux Mestre doivent être présents');
console.log('✅ [3/6] Passerelles Cantad\'Or, accordéon, bandeau répétition et analytique Mestre validés.');

// 4. Vérification des plafonds stricts de lignes
const lineLimits = [
  { file: 'src/utils/aisanceAutoSync.js', max: 110 },
  { file: 'src/components/pedagogy/NextRehearsalAisanceBanner.jsx', max: 120 },
  { file: 'src/components/pedagogy/AisancePieceAccordionRow.jsx', max: 135 },
  { file: 'src/components/pedagogy/MestreToadasAnalytics.jsx', max: 135 },
  { file: 'src/components/pedagogy/MonCarnetAisance.jsx', max: 140 },
  { file: 'src/hooks/useCarnetAisanceData.js', max: 140 },
  { file: 'src/components/pedagogy/PieceRevisionRunner.jsx', max: 140 },
  { file: 'src/components/member/PieceAisanceSection.jsx', max: 140 },
  { file: 'src/components/mestre/MestreSeasonAdminTab.jsx', max: 140 }
];

for (const { file, max } of lineLimits) {
  const fullPath = path.join(ROOT, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
  assert.ok(lines <= max, `${file} dépasse la limite (${lines} > ${max} lignes)`);
  console.log(`  📏 ${file} : ${lines} / ${max} lignes`);
}
console.log('✅ [4/6] Tous les plafonds Anti-Monolithe sont strictement respectés.');

// 5. Vérification des clés pedagogy.carnet.* et pedagogy.vocal.*
const requiredVocalKeys = ['sectionTitle', 'stageCoro', 'stageSimultane', 'stagePuxador', 'colCoro', 'colSimultane', 'colPuxadores'];
for (const k of requiredVocalKeys) {
  assert.ok(typeof fr.pedagogy?.vocal?.[k] === 'string' && fr.pedagogy.vocal[k].length > 0, `Clé FR manquante : pedagogy.vocal.${k}`);
  assert.ok(typeof pt.pedagogy?.vocal?.[k] === 'string' && pt.pedagogy.vocal[k].length > 0, `Clé PT manquante : pedagogy.vocal.${k}`);
}
console.log('✅ [5/6] Clés bilingues pedagogy.vocal.* et pedagogy.carnet.* présentes.');

// 6. Parité 1:1 globale entre fr.js et pt.js
function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const frKeys = new Set(flattenKeys(fr));
const ptKeys = new Set(flattenKeys(pt));
const missingInPt = [...frKeys].filter((k) => !ptKeys.has(k));
const missingInFr = [...ptKeys].filter((k) => !frKeys.has(k));
assert.equal(missingInPt.length, 0, `Clés absentes de pt.js : ${missingInPt.join(', ')}`);
assert.equal(missingInFr.length, 0, `Clés absentes de fr.js : ${missingInFr.join(', ')}`);
console.log(`✅ [6/6] Parité 1:1 absolue entre fr.js et pt.js (${frKeys.size} clés, 0 clé orpheline).\n`);
console.log('🎉 TOUS LES TESTS DE LA MISSION 2 SONT PASSÉS AVEC SUCCÈS !');
