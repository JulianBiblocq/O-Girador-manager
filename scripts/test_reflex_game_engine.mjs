import assert from 'assert';
import {
  calculatePauseTimes,
  extractPupitrePattern,
  generateDistractors,
  buildQuizOptions,
  getCanonicalPupitrePattern,
  arePatternsEqual,
  CANONICAL_PUPITRE_PATTERNS
} from '../src/utils/reflexGameUtils.js';

console.log('🧪 Lancement des tests unitaires du Moteur Défi Réflexe « Temps 1 »...\n');

// -----------------------------------------------------------------------------
// TEST 1 : Calcul chronométrique des arrêts au Temps 1 (calculatePauseTimes)
// -----------------------------------------------------------------------------
console.log('1️⃣ Test calculatePauseTimes : Calcul des timestamps précis');

const dummyPiece = {
  id: 'piece_maracatu_1',
  titre: 'Baque Luanda',
  bpm: 120,
  signalOverrides: {
    'sig_repere': { isInteractive: false, mode: 'repere' }
  }
};

const dummyPreset = {
  id: 'preset_luanda',
  bpm: 120, // 1 mesure = (4 * 60) / 120 = 2.0 secondes
  sinaisDoMestre: [
    { id: 'sig_1', mesure: 4, name: 'Virada Guerreiro' },
    { id: 'sig_repere', mesure: 8, name: 'Transition Repère' },
    { id: 'sig_2', mesure: 12, name: 'Parada Final' }
  ]
};

const pausePoints = calculatePauseTimes(dummyPiece, dummyPreset);
assert.strictEqual(pausePoints.length, 3, 'Devrait contenir 3 points de signal');

// Signal 1 à la mesure 4 :
// - Annonce mesure 4 : débute à 3 mesures écoulées = 3 * 2.0s = 6.0s
// - Arrêt temps 1 mesure 5 (mesure N+1) : débute à 4 mesures écoulées = 4 * 2.0s = 8.0s
const p1 = pausePoints[0];
assert.strictEqual(p1.mesure, 4, 'Mesure du signal doit être 4');
assert.strictEqual(p1.targetMeasure, 5, 'Mesure cible (temps 1) doit être 5');
assert.strictEqual(p1.announcementStartTime, 6.0, 'Annonce mesure 4 doit démarrer à 6.0s');
assert.strictEqual(p1.pauseTime, 8.0, 'Arrêt temps 1 mesure 5 doit se produire à 8.0s');
assert.strictEqual(p1.isInteractive, true, 'Signal 1 doit être interactif par défaut');

// Signal repère à la mesure 8 :
const p2 = pausePoints[1];
assert.strictEqual(p2.mesure, 8, 'Mesure du repère doit être 8');
assert.strictEqual(p2.announcementStartTime, 14.0, 'Annonce mesure 8 doit démarrer à 14.0s (7 * 2s)');
assert.strictEqual(p2.pauseTime, 16.0, 'Mesure 9 doit être à 16.0s');
assert.strictEqual(p2.isInteractive, false, 'Signal repère doit être désactivé par override Mestre');

console.log('  ✓ Timestamps et détection du mode interactif validés.');

// -----------------------------------------------------------------------------
// TEST 2 : Extraction de la tablature pupitre (extractPupitrePattern)
// -----------------------------------------------------------------------------
console.log('\n2️⃣ Test extractPupitrePattern : Extraction des 16 pas');

const presetWithTracks = {
  tracks: [
    {
      name: 'Caixa de Guerra',
      patterns: [
        {
          measureAssignments: { 4: true }, // Mesure N+1 (0-index = 4 pour mesure 5)
          activeSteps: ['X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X', '-', 'X', 'X', '-', 'X', 'X', '-']
        }
      ]
    },
    {
      name: 'Gonguê',
      steps: [
        // Mesures 0 à 3 (4 x 16)
        ...Array(64).fill('-'),
        // Mesure 4 (mesure 5)
        'X', '-', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', '-', '-'
      ]
    }
  ]
};

// Extraction Caixa
const caixaPattern = extractPupitrePattern(presetWithTracks, 'caixa', 4);
assert.strictEqual(caixaPattern.length, 16, 'Le motif doit comporter exactement 16 pas');
assert.strictEqual(caixaPattern[0], 'X', 'Premier pas Caixa doit être actif');
assert.strictEqual(caixaPattern[1], '-', 'Second pas Caixa doit être muet');

// Extraction Gonguê
const gonguePattern = extractPupitrePattern(presetWithTracks, 'gongue', 4);
assert.strictEqual(gonguePattern.length, 16, 'Le motif Gonguê doit comporter 16 pas');
assert.strictEqual(gonguePattern[0], 'X', 'Premier pas Gonguê actif');
assert.strictEqual(gonguePattern[3], 'X', 'Quatrième pas Gonguê actif');

// Repli canonique pour instrument non configuré dans les pistes
const fallbackAlfaia = extractPupitrePattern(presetWithTracks, 'alfaia', 0);
assert.strictEqual(fallbackAlfaia.length, 16, 'Le motif de repli Alfaia doit comporter 16 pas');
assert.ok(fallbackAlfaia.includes('X'), 'Le repli Alfaia doit comporter des frappes');

console.log('  ✓ Extraction directe et repli canonique validés.');

// -----------------------------------------------------------------------------
// TEST 3 : Génération des 3 leurres (generateDistractors)
// -----------------------------------------------------------------------------
console.log('\n3️⃣ Test generateDistractors : Création de 3 leurres plausibles');

const correctPattern = ['X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X', '-', 'X', 'X', '-', 'X', 'X', '-'];
const distractors = generateDistractors(
  correctPattern,
  presetWithTracks,
  'caixa',
  [],
  null,
  4
);

assert.strictEqual(distractors.length, 3, 'Doit générer exactement 3 leurres');

distractors.forEach((d, idx) => {
  assert.strictEqual(d.length, 16, `Leurre #${idx + 1} doit faire 16 pas`);
  assert.strictEqual(
    arePatternsEqual(d, correctPattern),
    false,
    `Leurre #${idx + 1} ne doit PAS être identique à la bonne réponse`
  );
});

// Surcharge Mestre avec leurres verrouillés
const lockedOverrides = {
  distractors: [
    Array(16).fill('-'),
    Array(16).fill('X'),
    ['X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-']
  ]
};
const customDistractors = generateDistractors(
  correctPattern,
  presetWithTracks,
  'caixa',
  [],
  lockedOverrides,
  4
);
assert.strictEqual(customDistractors.length, 3, 'Doit respecter la surcharge');
assert.strictEqual(customDistractors[0][0], '-', 'Doit retourner le leurre verrouillé par le Mestre');

console.log('  ✓ Génération des leurres et verrouillage Mestre validés.');

// -----------------------------------------------------------------------------
// TEST 4 : Mélange du quiz (buildQuizOptions)
// -----------------------------------------------------------------------------
console.log('\n4️⃣ Test buildQuizOptions : Mélange et 1 seule bonne réponse');

const quizOptions = buildQuizOptions(correctPattern, distractors);
assert.strictEqual(quizOptions.length, 4, 'Doit comporter 4 cartes au total');

const correctCount = quizOptions.filter((o) => o.isCorrect).length;
assert.strictEqual(correctCount, 1, 'Doit avoir exactement une seule bonne réponse');

const falseCount = quizOptions.filter((o) => !o.isCorrect).length;
assert.strictEqual(falseCount, 3, 'Doit avoir exactement 3 mauvaises réponses');

console.log('  ✓ Plateau de quiz à 4 cartes validé.');

console.log('\n🎉 TOUS LES TESTS DU MOTEUR DÉFI RÉFLEXE SONT PASSÉS AVEC SUCCÈS !\n');
