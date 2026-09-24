import assert from 'assert';
import {
  extractConductorChallenge,
  DEFAULT_MESTRE_SIGNALS,
  shuffleArray
} from '../src/utils/conductorGameUtils.js';

console.log('🧪 Lancement des tests unitaires du Moteur « Conducteur à trous »...\n');

// -----------------------------------------------------------------------------
// TEST 1 : extractConductorChallenge avec Preset complet et catalogue de signaux
// -----------------------------------------------------------------------------
console.log('1️⃣ Test extractConductorChallenge : Extraction standard et options à 4 choix');

const dummyPiece = {
  id: 'piece_maracatu_estevao',
  titre: 'Estevão no Passo',
  bpm: 125,
  audioUrl: 'https://example.com/audio/estevao.mp3'
};

const dummyPreset = {
  id: 'preset_estevao',
  bpm: 125,
  sinaisDoMestre: [
    { id: 'sig_depart', mesure: 1, name: 'Appel de départ' },
    { id: 'sig_virada_1', mesure: 9, name: 'Virada Guerreiro' },
    { id: 'sig_parada', mesure: 17, name: 'Parada Finale' }
  ],
  tracks: [
    {
      name: 'Caixa',
      measures: Array(24).fill(null)
    }
  ]
};

const customCatalog = [
  { id: 'sig_depart', name: 'Appel de départ', imageUrl: 'https://example.com/depart.png' },
  { id: 'sig_virada_1', name: 'Virada Guerreiro', imageUrl: 'https://example.com/virada.png' },
  { id: 'sig_parada', name: 'Parada Finale', imageUrl: 'https://example.com/parada.png' },
  { id: 'sig_luanda', name: 'Appel Luanda', imageUrl: 'https://example.com/luanda.png' },
  { id: 'sig_cortejo', name: 'Signal Cortejo', imageUrl: 'https://example.com/cortejo.png' }
];

const challenge = extractConductorChallenge(dummyPiece, dummyPreset, customCatalog);

assert.strictEqual(challenge.totalSignals, 3, 'Doit identifier exactement 3 slots de signaux');
assert.strictEqual(challenge.slots.length, 3, 'La liste des slots doit contenir 3 éléments');
assert.strictEqual(challenge.audioUrl, 'https://example.com/audio/estevao.mp3', 'Doit extraire le lien audio');
assert.strictEqual(challenge.nominalBpm, 125, 'Le BPM doit être extrait fidèlement');
assert(challenge.totalMeasures >= 24, 'L\'envergure doit être d\'au moins 24 mesures');

// Vérification de chaque slot et de ses 4 choix
challenge.slots.forEach((slot, idx) => {
  const expectedMeasures = [1, 9, 17];
  assert.strictEqual(slot.mesure, expectedMeasures[idx], `La mesure du slot ${idx} doit être ${expectedMeasures[idx]}`);
  assert.strictEqual(slot.options.length, 4, `Le slot mesure ${slot.mesure} doit proposer exactement 4 choix`);

  // La bonne réponse doit figurer dans les 4 options
  const hasTarget = slot.options.some((opt) => opt.id === slot.targetSignal.id);
  assert.strictEqual(hasTarget, true, `L'option cible doit être présente parmi les 4 options (mesure ${slot.mesure})`);

  // Les 4 options doivent être distinctes (pas de doublons)
  const optionIds = slot.options.map((opt) => opt.id);
  const uniqueOptionIds = new Set(optionIds);
  assert.strictEqual(uniqueOptionIds.size, 4, `Les 4 options du slot ${slot.mesure} doivent avoir des identifiants distincts`);
});

console.log('  ✓ 3 slots extraits, chacun muni de 4 options uniques incluant le signal cible.');

// -----------------------------------------------------------------------------
// TEST 2 : Complétion automatique par les fallbacks universels si catalogue restreint
// -----------------------------------------------------------------------------
console.log('\n2️⃣ Test extractConductorChallenge : Complétion automatique avec les signaux universels');

const pieceWithSingleSignal = {
  id: 'piece_solo',
  titre: 'Baque Simple',
  sinaisDoMestre: [
    { id: 'sig_custom_special', mesure: 4, name: 'Signal Inconnu Unique' }
  ]
};

// Catalogue vide : l'algorithme doit puiser dans DEFAULT_MESTRE_SIGNALS
const challengeSolo = extractConductorChallenge(pieceWithSingleSignal, null, []);

assert.strictEqual(challengeSolo.slots.length, 1, 'Doit identifier 1 slot');
const soloSlot = challengeSolo.slots[0];
assert.strictEqual(soloSlot.mesure, 4, 'Mesure du slot doit être 4');
assert.strictEqual(soloSlot.options.length, 4, 'Doit générer 4 choix même avec un catalogue externe vide');

const hasSoloTarget = soloSlot.options.some((opt) => opt.id === soloSlot.targetSignal.id);
assert.strictEqual(hasSoloTarget, true, 'Le signal cible doit être dans les 4 choix');

const soloIds = new Set(soloSlot.options.map((o) => o.id));
assert.strictEqual(soloIds.size, 4, 'Les 4 choix doivent être tous différents');

console.log('  ✓ Repli automatique sur DEFAULT_MESTRE_SIGNALS validé (4 choix distincts garantis).');

// -----------------------------------------------------------------------------
// TEST 3 : Indexation directe par mesure (slotsByMeasure) O(1)
// -----------------------------------------------------------------------------
console.log('\n3️⃣ Test slotsByMeasure : Accès rapide pour la timeline');

assert.strictEqual(Boolean(challenge.slotsByMeasure[1]), true, 'Mesure 1 doit être indexée');
assert.strictEqual(Boolean(challenge.slotsByMeasure[9]), true, 'Mesure 9 doit être indexée');
assert.strictEqual(Boolean(challenge.slotsByMeasure[17]), true, 'Mesure 17 doit être indexée');
assert.strictEqual(challenge.slotsByMeasure[2], undefined, 'Mesure 2 sans signal ne doit pas avoir de slot');

console.log('  ✓ Indexation slotsByMeasure validée pour un rendu fluide de la frise.');

// -----------------------------------------------------------------------------
// TEST 4 : Robustesse sur données vides ou atypiques
// -----------------------------------------------------------------------------
console.log('\n4️⃣ Test robustesse : Tolérance aux données manquantes');

const emptyChallenge = extractConductorChallenge({}, null, []);
assert.strictEqual(emptyChallenge.slots.length, 0, 'Slots vides si aucun signal');
assert.strictEqual(emptyChallenge.totalMeasures, 16, 'Timeline par défaut de 16 mesures minimum');
assert.strictEqual(emptyChallenge.audioUrl, null, 'Audio null par défaut');

console.log('  ✓ Résistance aux données incomplètes validée.');

// -----------------------------------------------------------------------------
// TEST 5 : Fonction de mélange Fisher-Yates
// -----------------------------------------------------------------------------
console.log('\n5️⃣ Test shuffleArray : Permutation sans altération d\'éléments');

const original = [1, 2, 3, 4, 5];
const shuffled = shuffleArray(original);
assert.strictEqual(shuffled.length, original.length, 'La taille doit être identique');
assert.deepStrictEqual([...shuffled].sort(), original, 'Tous les éléments d\'origine doivent être préservés');
assert.notStrictEqual(shuffled, original, 'Doit retourner une nouvelle référence');

console.log('  ✓ Mélange Fisher-Yates validé.');

console.log('\n🎉 TOUS LES TESTS DU CONDUCTEUR À TROUS SONT PASSÉS AVEC SUCCÈS !');
