/**
 * Script de validation et test unitaire du Moteur de QCM Linguistique i18n (FR ↔ PT)
 * Vérifie :
 * 1. Extraction et nettoyage du réservoir i18n (extractI18nVocabPool)
 * 2. Assainissement typographique (sanitizeQuizText)
 * 3. Détection stricte des fuites (hasLeak)
 * 4. Calibrage des distracteurs par niveau (getSmartDistractors)
 * 5. Génération de session complète (generateI18nTranslationQuiz) en modes Confirmé et Mestre
 */

import {
  extractI18nVocabPool,
  sanitizeQuizText,
  hasLeak,
  getSmartDistractors,
  generateI18nTranslationQuiz
} from '../src/utils/quizI18nEngine.js';

console.log('🏁 Démarrage des tests du Moteur de QCM Linguistique i18n...\n');

let failedTests = 0;
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ÉCHEC : ${message}`);
    failedTests++;
  } else {
    console.log(`✅ SUCCÈS : ${message}`);
  }
};

// ============================================================================
// TEST 1 : Nettoyage et assainissement typographique (sanitizeQuizText)
// ============================================================================
console.log('--- Test 1 : sanitizeQuizText ---');
const rawText1 = '  « Agogô   (Cloche) » [acier]  ';
const cleanText1 = sanitizeQuizText(rawText1);
assert(cleanText1 === 'Agogô Cloche acier', `Retrait guillemets/parenthèses/crochets et espaces doubles : "${cleanText1}"`);

const rawText2 = '"Parabéns" \'você\' `conseguiu`';
const cleanText2 = sanitizeQuizText(rawText2);
assert(cleanText2 === 'Parabéns você conseguiu', `Retrait apostrophes/guillemets simples/backticks : "${cleanText2}"`);

// ============================================================================
// TEST 2 : Détection stricte des fuites lexicales (hasLeak)
// ============================================================================
console.log('\n--- Test 2 : hasLeak ---');
// Fuite évidente : mot de la réponse présent dans la question
assert(hasLeak('Quelle est la signification de Baque Luanda ?', 'Baque Luanda') === true, 'Détecte la fuite d\'un mot cible présent dans la question');
assert(hasLeak('Traduis le mot tambour', 'tambour') === true, 'Détecte la fuite exacte');

// Absence de fuite : mots différents ou uniquement mots de liaison
assert(hasLeak('Traduis : "Enregistrer"', 'Salvar') === false, 'Pas de fuite pour deux mots différents');
assert(hasLeak('Ceci est fait pour vous dans la nação', 'para você') === false, 'Ignore les mots de liaison FR/PT comme dans, pour, vous');
assert(hasLeak('Quelle est cette pièce ?', 'Peau') === false, 'Pas de fuite sur mots courts non partagés');

// ============================================================================
// TEST 3 : Extraction du réservoir bilingue (extractI18nVocabPool)
// ============================================================================
console.log('\n--- Test 3 : extractI18nVocabPool ---');
const vocabPool = extractI18nVocabPool({ maxWords: 6 });
assert(vocabPool.length >= 1000, `Réservoir extrait abondant (${vocabPool.length} paires trouvées >= 1000)`);

// Vérification de salubrité sur l'ensemble du vivier
let hasInterpolation = false;
let hasHtmlTag = false;
let hasIdenticalPair = false;
let hasUrlOrTechnical = false;

for (const p of vocabPool) {
  if (/\{.*?\}|\{\{.*?\}\}/.test(p.fr) || /\{.*?\}|\{\{.*?\}\}/.test(p.pt)) {
    hasInterpolation = true;
  }
  if (/<[^>]+>/.test(p.fr) || /<[^>]+>/.test(p.pt)) {
    hasHtmlTag = true;
  }
  if (p.fr.toLowerCase().trim() === p.pt.toLowerCase().trim()) {
    hasIdenticalPair = true;
  }
  if (/https?:\/\/|www\.|\.(png|jpg|jpeg|svg|webp|gif|mp4|mp3|pdf|json)\b|#[0-9a-f]{3,8}\b/i.test(p.fr)) {
    hasUrlOrTechnical = true;
  }
}

assert(!hasInterpolation, 'Zéro variable d\'interpolation résiduelle ({{...}} ou {...})');
assert(!hasHtmlTag, 'Zéro balise HTML résiduelle');
assert(!hasIdenticalPair, 'Zéro paire identique FR === PT');
assert(!hasUrlOrTechnical, 'Zéro URL ou chemin technique');

// ============================================================================
// TEST 4 : Calibrage des distracteurs (getSmartDistractors)
// ============================================================================
console.log('\n--- Test 4 : getSmartDistractors ---');
const samplePool = [
  'Atribuição', 'Atribuições', 'Associação', 'Ausentes', 'Atualizar',
  'Acordo de participação', 'Administração geral do sistema', 'Voltar',
  'Salvar as alterações no cadastro', 'Cancelar'
];

// Mode Mestre : diff mots = 0, char ratio <= 20%, priorité même lettre
const mestreDistractors = getSmartDistractors('Atribuição', samplePool, 'mestre', 3);
assert(mestreDistractors.length === 3, `Fournit 3 distracteurs uniques en mode Mestre (${mestreDistractors.join(', ')})`);
const targetWordCount = 'Atribuição'.split(/\s+/).length;
const allSameWords = mestreDistractors.every(d => d.split(/\s+/).length === targetWordCount);
assert(allSameWords, 'Mode Mestre : tous les distracteurs ont exactement le même nombre de mots (diff = 0)');
const sameInitialCount = mestreDistractors.filter(d => d[0].toLowerCase() === 'a').length;
assert(sameInitialCount >= 2, `Mode Mestre : priorité à la même lettre initiale (${sameInitialCount}/3 partagent l'initiale 'A')`);

// Mode Confirmé : diff mots <= 1, char ratio <= 35%
const confirmeDistractors = getSmartDistractors('Atribuição', samplePool, 'confirme', 3);
assert(confirmeDistractors.length === 3, `Fournit 3 distracteurs uniques en mode Confirmé (${confirmeDistractors.join(', ')})`);
const wordDiffsOk = confirmeDistractors.every(d => Math.abs(d.split(/\s+/).length - targetWordCount) <= 1);
assert(wordDiffsOk, 'Mode Confirmé : écart de mots <= 1 mot');

// ============================================================================
// TEST 5 : Génération d'une session de Quiz en Mode Mestre (10 questions)
// ============================================================================
console.log('\n--- Test 5 : generateI18nTranslationQuiz en Mode Mestre (10 questions) ---');
const quizMestre = generateI18nTranslationQuiz({
  count: 10,
  direction: 'mixed',
  difficulty: 'mestre'
});

assert(quizMestre.length === 10, `Génère exactement 10 questions en mode Mestre (${quizMestre.length})`);

let leaksFound = 0;
let optionsAnomaly = 0;
let mestreLengthAnomalies = 0;

quizMestre.forEach((q, idx) => {
  // Vérification de 4 options uniques
  if (q.options.length !== 4 || new Set(q.options).size !== 4) {
    optionsAnomaly++;
  }
  // Vérification présence de la bonne réponse
  if (!q.options.includes(q.correctAnswer)) {
    optionsAnomaly++;
  }
  // Vérification absence de fuite
  if (hasLeak(q.questionText, q.correctAnswer) || hasLeak(q.correctAnswer, q.targetWord)) {
    leaksFound++;
  }
  // Vérification de la calibration des longueurs
  const targetWords = q.correctAnswer.split(/\s+/).length;
  for (const opt of q.options) {
    const optWords = opt.split(/\s+/).length;
    // Tolérance Mestre principale = 0, repli palier max <= 1
    if (Math.abs(optWords - targetWords) > 1) {
      mestreLengthAnomalies++;
    }
  }
});

assert(optionsAnomaly === 0, 'Chaque question propose exactement 4 options distinctes dont la bonne');
assert(leaksFound === 0, 'Zéro fuite de réponse détectée dans les 10 questions Mestre');
assert(mestreLengthAnomalies === 0, 'Zéro anomalie de longueur sur les distracteurs générés en mode Mestre');

// ============================================================================
// TEST 6 : Génération d'une session en Mode Confirmé (10 questions)
// ============================================================================
console.log('\n--- Test 6 : generateI18nTranslationQuiz en Mode Confirmé (10 questions) ---');
const quizConfirme = generateI18nTranslationQuiz({
  count: 10,
  direction: 'mixed',
  difficulty: 'confirme'
});

assert(quizConfirme.length === 10, `Génère exactement 10 questions en mode Confirmé (${quizConfirme.length})`);

// ============================================================================
// EXEMPLES CONSOLE DEMANDÉS POUR LE LIVRABLE
// ============================================================================
console.log('\n======================================================');
console.log('📌 EXEMPLE CONSOLE : QUESTION GÉNÉRÉE EN MODE CONFIRMÉ');
console.log('======================================================');
const sampleConfirme = quizConfirme[0];
console.log(JSON.stringify({
  id: sampleConfirme.id,
  type: sampleConfirme.type,
  direction: sampleConfirme.direction,
  instruction: sampleConfirme.instruction,
  targetWord: sampleConfirme.targetWord,
  prompt: sampleConfirme.prompt,
  correctAnswer: sampleConfirme.correctAnswer,
  options: sampleConfirme.options,
  explanation: sampleConfirme.explanation
}, null, 2));

console.log('\n======================================================');
console.log('📌 EXEMPLE CONSOLE : QUESTION GÉNÉRÉE EN MODE MESTRE');
console.log('======================================================');
const sampleMestre = quizMestre[0];
console.log(JSON.stringify({
  id: sampleMestre.id,
  type: sampleMestre.type,
  direction: sampleMestre.direction,
  instruction: sampleMestre.instruction,
  targetWord: sampleMestre.targetWord,
  prompt: sampleMestre.prompt,
  correctAnswer: sampleMestre.correctAnswer,
  options: sampleMestre.options,
  explanation: sampleMestre.explanation
}, null, 2));

console.log('\n======================================================');
if (failedTests > 0) {
  console.error(`💥 ${failedTests} test(s) ont échoué.`);
  process.exit(1);
} else {
  console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
  process.exit(0);
}
