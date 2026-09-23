import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  normalizeString,
  findMatchingPreset,
  findMatchingToada,
  findMatchingCultureDoc,
  findMatchingChoreography,
  buildResolutionDictionaries,
  resolvePieceLiveTechnicalData,
  getPieceTablature
} from '../src/utils/repertoireMatcher.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : ARCHITECTURE RÉACTIVE DU RÉPERTOIRE (LIAISON VIVANTE)");
console.log("===============================================================\n");

const baseDir = process.cwd();

// --- Test 1 : Normalisation de chaînes (accents, ponctuation, casse) ---
console.log("▶️ Test 1 : Normalisation de chaîne (normalizeString)");
assert.strictEqual(normalizeString("Baque de Luanda"), "baquedeluanda");
assert.strictEqual(normalizeString("Convenção nº 2 (4)"), "convencaon24");
assert.strictEqual(normalizeString("  Étoile / Forró !  "), "etoileforro");
console.log("  ✅ [PASS] normalizeString valide.");

// --- Test 2 : Appariement automatique et non destructif ---
console.log("\n▶️ Test 2 : Appariement automatique par identifiant et par titre");
const mockPresets = [
  { id: 'seq_101', titre: 'Fatras', audioUrl: 'https://storage/audio1.mp3', parsedData: { bpm: 120, pistes: [] } },
  { id: 'seq_102', displayTitle: 'Virada Samambaia', parsedData: { bpm: 130 } }
];

const match1 = findMatchingPreset('Fatras', mockPresets);
assert.strictEqual(match1?.id, 'seq_101', "Recherche par titre Fatras doit trouver seq_101");

const match2 = findMatchingPreset({ sequenceurId: 'seq_102', titre: 'Inconnu' }, mockPresets);
assert.strictEqual(match2?.id, 'seq_102', "Recherche par ID direct doit primer sur le titre");

const mockToadas = [
  { id: 'song_55', titre: 'Fatras de Noël', audioUrl: 'https://varal/toada.mp3' }
];
const matchToada = findMatchingToada('fatras de noel', mockToadas);
assert.strictEqual(matchToada?.id, 'song_55', "Recherche de Toada normalisée doit fonctionner");

const mockChoreos = [
  { id: 'choreo_99', nom: 'Virada Samambaia', sequenceurId: 'seq_102' }
];
const matchChoreo = findMatchingChoreography({ sequenceurId: 'seq_102' }, mockChoreos);
assert.strictEqual(matchChoreo?.id, 'choreo_99', "Recherche de chorégraphie par sequenceurId doit matcher");
console.log("  ✅ [PASS] Fonctions d'appariement validées.");

// --- Test 3 : Résolution vivante mémoïsée & calcul paresseux de la tablature ---
console.log("\n▶️ Test 3 : Résolution vivante mémoïsée & calcul paresseux (lazy)");
const dicts = buildResolutionDictionaries({
  catalogRhythms: mockPresets,
  toadasList: mockToadas,
  cultureDocsList: [],
  choreographies: mockChoreos
});

const pieceSample = {
  id: 'piece_1',
  titre: 'Fatras',
  sequenceurId: 'seq_101',
  notes: 'Consignes de répétition'
};

const resolved = resolvePieceLiveTechnicalData(pieceSample, dicts);
assert.strictEqual(resolved.hasSequencer, true, "hasSequencer doit être vrai");
assert.strictEqual(resolved.hasAudio, true, "hasAudio doit être vrai car hérité du preset");
assert.strictEqual(resolved.activeAudioUrl, 'https://storage/audio1.mp3', "Audio doit provenir du preset");
assert.strictEqual(resolved.hasTablature, true, "hasTablature doit être vrai");

// Vérification du calcul paresseux : getPieceTablature génère la tablature au clic
const tabText = getPieceTablature(resolved);
assert(typeof tabText === 'string', "getPieceTablature doit retourner une chaîne");
console.log("  ✅ [PASS] Résolution vivante et calcul paresseux de tablature validés.");

// --- Test 4 : Contrôle statique de RepertoirePieceModal.jsx ---
console.log("\n▶️ Test 4 : Contrôle statique de RepertoirePieceModal.jsx");
const modalPath = path.join(baseDir, 'src/components/mestre/RepertoirePieceModal.jsx');
const modalCode = fs.readFileSync(modalPath, 'utf8');

assert(modalCode.includes('repertoireMatcher'), "RepertoirePieceModal doit importer repertoireMatcher");
assert(modalCode.includes('useRepertoireVaralDocs'), "RepertoirePieceModal doit utiliser useRepertoireVaralDocs");
assert(modalCode.includes('sequenceurId: matchedSeqId || null'), "sequenceurId doit valoir null si vide");
assert(modalCode.includes('cleanFirestorePayload'), "Le payload doit être assaini avec cleanFirestorePayload");
console.log("  ✅ [PASS] RepertoirePieceModal respecte l'architecture réactive.");

// --- Test 5 : Contrôle statique de MestreRepertoireView.jsx ---
console.log("\n▶️ Test 5 : Contrôle statique de MestreRepertoireView.jsx");
const viewPath = path.join(baseDir, 'src/components/mestre/MestreRepertoireView.jsx');
const viewCode = fs.readFileSync(viewPath, 'utf8');

assert(viewCode.includes('buildResolutionDictionaries'), "MestreRepertoireView doit construire les dictionnaires mémoïsés");
assert(viewCode.includes('resolvePieceLiveTechnicalData'), "MestreRepertoireView doit résoudre dynamiquement les morceaux");
assert(viewCode.includes('getPieceTablature'), "MestreRepertoireView doit utiliser getPieceTablature pour le calcul paresseux");
assert(viewCode.includes('dancador.ogirador.fr'), "MestreRepertoireView doit proposer le lien Dançad'Or");
console.log("  ✅ [PASS] MestreRepertoireView respecte l'architecture réactive vivante.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DU RÉPERTOIRE RÉACTIF SONT VALIDÉES !");
console.log("===============================================================\n");
