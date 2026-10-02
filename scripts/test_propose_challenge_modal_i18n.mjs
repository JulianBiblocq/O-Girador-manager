// Test de validation de l'internationalisation FR / PT-BR — Modale « Proposer un défi en direct »
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : INTERNATIONALISATION MODALE PROPOSER UN DÉFI EN DIRECT (FR / PT)');
console.log('========================================================================\n');

let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedAssertions++;
  }
}

// -----------------------------------------------------------------------------
// 1. Contrôle de parité et exactitude des clés dans fr.js et pt.js
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle de parité des clés cibles dans fr.js et pt.js');

const targetKeys = [
  'proposeChallengeTitle',
  'proposeChallengeDesc',
  'challengeRhythmTitle',
  'challengeRhythmDesc',
  'challengeCultureTitle',
  'challengeCultureDesc',
  'challengeExquisiteCorpseTitle',
  'challengeExquisiteCorpseDesc',
  'btnCancelChallenge'
];

targetKeys.forEach(k => {
  assert(fr.pedagogy && typeof fr.pedagogy[k] === 'string' && fr.pedagogy[k].length > 0, `Clé fr.pedagogy.${k} présente et non-vide`);
  assert(pt.pedagogy && typeof pt.pedagogy[k] === 'string' && pt.pedagogy[k].length > 0, `Clé pt.pedagogy.${k} présente et non-vide`);
});

// Vérification des libellés exacts
assert(fr.pedagogy.proposeChallengeTitle === "Proposer un défi en direct", "FR proposeChallengeTitle conforme");
assert(pt.pedagogy.proposeChallengeTitle === "Propor um desafio ao vivo", "PT proposeChallengeTitle conforme");

assert(fr.pedagogy.proposeChallengeDesc === "Choisissez le thème de l'arène. Un salon d'attente sera ouvert et vos camarades connectés pourront vous rejoindre en direct !", "FR proposeChallengeDesc conforme");
assert(pt.pedagogy.proposeChallengeDesc === "Escolha o tema da arena. Uma sala de espera será aberta e seus colegas conectados poderão entrar ao vivo!", "PT proposeChallengeDesc conforme");

assert(fr.pedagogy.challengeRhythmTitle === "Défi Rythme", "FR challengeRhythmTitle conforme");
assert(pt.pedagogy.challengeRhythmTitle === "Desafio de Ritmo", "PT challengeRhythmTitle conforme");

assert(fr.pedagogy.challengeRhythmDesc === "Tempo, breaks, variations et repères rythmiques", "FR challengeRhythmDesc conforme");
assert(pt.pedagogy.challengeRhythmDesc === "Andamento, viradas, variações e referências rítmicas", "PT challengeRhythmDesc conforme");

assert(fr.pedagogy.challengeCultureTitle === "Défi Culture", "FR challengeCultureTitle conforme");
assert(pt.pedagogy.challengeCultureTitle === "Desafio Cultural", "PT challengeCultureTitle conforme");

assert(fr.pedagogy.challengeCultureDesc === "Histoire du Maracatu, toadas, traditions et instruments", "FR challengeCultureDesc conforme");
assert(pt.pedagogy.challengeCultureDesc === "História do Maracatu, toadas, tradições e instrumentos", "PT challengeCultureDesc conforme");

assert(fr.pedagogy.challengeExquisiteCorpseTitle === "Cadavre exquis (Coopération)", "FR challengeExquisiteCorpseTitle conforme");
assert(pt.pedagogy.challengeExquisiteCorpseTitle === "Desafio em Cadeia (Cooperação)", "PT challengeExquisiteCorpseTitle conforme");

assert(fr.pedagogy.challengeExquisiteCorpseDesc === "Relais polyrythmique en chaîne et délibération au Conseil de Batterie", "FR challengeExquisiteCorpseDesc conforme");
assert(pt.pedagogy.challengeExquisiteCorpseDesc === "Revezamento polirrítmico em cadeia e deliberação no Conselho de Bateria", "PT challengeExquisiteCorpseDesc conforme");

assert(fr.pedagogy.btnCancelChallenge === "Annuler", "FR btnCancelChallenge conforme");
assert(pt.pedagogy.btnCancelChallenge === "Cancelar", "PT btnCancelChallenge conforme");

// -----------------------------------------------------------------------------
// 2. Contrôle du composant GameThemeSelectorModal.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Contrôle des clés i18n dans GameThemeSelectorModal.jsx');
const modalPath = path.resolve('src/components/games/GameThemeSelectorModal.jsx');
assert(fs.existsSync(modalPath), 'GameThemeSelectorModal.jsx existe');

if (fs.existsSync(modalPath)) {
  const src = fs.readFileSync(modalPath, 'utf8');
  assert(src.includes("t('pedagogy.proposeChallengeTitle')"), 'Titre de la modale branché sur t(pedagogy.proposeChallengeTitle)');
  assert(src.includes("t('pedagogy.proposeChallengeDesc')"), 'Description salon attente branchée sur t(pedagogy.proposeChallengeDesc)');
  assert(src.includes("t('pedagogy.challengeRhythmTitle')"), 'Titre défi rythme branché sur t(pedagogy.challengeRhythmTitle)');
  assert(src.includes("t('pedagogy.challengeRhythmDesc')"), 'Description défi rythme branchée sur t(pedagogy.challengeRhythmDesc)');
  assert(src.includes("t('pedagogy.challengeCultureTitle')"), 'Titre défi culture branché sur t(pedagogy.challengeCultureTitle)');
  assert(src.includes("t('pedagogy.challengeCultureDesc')"), 'Description défi culture branchée sur t(pedagogy.challengeCultureDesc)');
  assert(src.includes("t('pedagogy.challengeExquisiteCorpseTitle')"), 'Titre cadavre exquis branché sur t(pedagogy.challengeExquisiteCorpseTitle)');
  assert(src.includes("t('pedagogy.challengeExquisiteCorpseDesc')"), 'Description cadavre exquis branchée sur t(pedagogy.challengeExquisiteCorpseDesc)');
  assert(src.includes("t('pedagogy.btnCancelChallenge')"), 'Bouton annuler branché sur t(pedagogy.btnCancelChallenge)');
}

console.log('\n========================================================================');
if (failedAssertions === 0) {
  console.log('🏆 TOUS LES TESTS MODALE PROPOSER UN DÉFI SONT 100% VALIDÉS AVEC SUCCÈS !');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error(`❌ ÉCHEC : ${failedAssertions} assertion(s) non validée(s).`);
  console.log('========================================================================');
  process.exit(1);
}
