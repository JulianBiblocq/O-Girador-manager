import fs from 'fs';
import path from 'path';
import { resolvePieceTrainings } from '../src/utils/repertoireMatcher.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : VOCABULAIRE, DÉDOUBLONNAGE ENTRAÎNEMENTS & CULTURE');
console.log('========================================================================\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ [PASS] ${desc}`);
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    allPassed = false;
  }
}

// -----------------------------------------------------------------------------
// 1. Nettoyage terminologique (Zéro "Speed Trainer", Zéro "Séquenciad'Or")
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Nettoyage terminologique dans src/');

function searchPatternInDir(dir, pattern, matches = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchPatternInDir(fullPath, pattern, matches);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        matches.push(fullPath);
      }
    }
  }
  return matches;
}

const speedTrainerMatches = searchPatternInDir(path.resolve('src'), /speed\s*trainer/i);
assert('Aucune mention de "Speed Trainer" résiduelle dans src/', speedTrainerMatches.length === 0);
if (speedTrainerMatches.length > 0) {
  console.error('    Fichiers contenant Speed Trainer :', speedTrainerMatches);
}

const sequenciadorMatches = searchPatternInDir(path.resolve('src'), /s[eé]quenciad['’]or/i);
assert('Aucune mention de "Séquenciad\'Or" résiduelle dans src/', sequenciadorMatches.length === 0);
if (sequenciadorMatches.length > 0) {
  console.error('    Fichiers contenant Séquenciad\'Or :', sequenciadorMatches);
}

// Vérification de sequenciador en minuscules strictes dans trainingLauncher.js
const launcherCode = fs.readFileSync(path.resolve('src/utils/trainingLauncher.js'), 'utf8');
assert('trainingLauncher.js utilise appLabel = "sequenciador" (minuscules strictes)', launcherCode.includes("appLabel = 'sequenciador'") || launcherCode.includes('appLabel = "sequenciador"'));

// -----------------------------------------------------------------------------
// 2. Dédoublonnage strict et gestion des exclusions (resolvePieceTrainings)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Dédoublonnage strict et exclusions dans resolvePieceTrainings');

const mockRawTrainings = [
  { id: 'tr_preset_1', presetId: 'seq_preset_123', title: 'Entraînement A', startBpm: 60, targetBpm: 100 },
  { id: 'tr_preset_1', presetId: 'seq_preset_123', title: 'Entraînement A Dupliqué', startBpm: 60, targetBpm: 100 }, // Doublon dans la source
  { id: 'tr_preset_2', presetId: 'seq_preset_123', title: 'Entraînement B', startBpm: 80, targetBpm: 120 },
  { id: 'tr_manual_1', presetId: 'other_preset', title: 'Entraînement Manuel C', startBpm: 70, targetBpm: 110 }
];

// Dédoublonnage strict
const resDedup = resolvePieceTrainings('seq_preset_123', mockRawTrainings);
assert('Dédoublonnage strict par id (2 uniques au lieu de 3)', resDedup.length === 2 && resDedup.map(t => t.id).sort().join(',') === 'tr_preset_1,tr_preset_2');

// Exclusion via paramètre
const resExcludedParam = resolvePieceTrainings('seq_preset_123', mockRawTrainings, [], ['tr_preset_2']);
assert('Exclusion via argument excludedTrainingIds', resExcludedParam.length === 1 && resExcludedParam[0].id === 'tr_preset_1');

// Exclusion via objet piece
const pieceObj = {
  sequenceurId: 'seq_preset_123',
  trainingIds: ['tr_manual_1'],
  excludedTrainingIds: ['tr_preset_1']
};
const resPieceObj = resolvePieceTrainings(pieceObj, mockRawTrainings);
assert('Résolution via objet piece complet avec trainingIds et excludedTrainingIds',
  resPieceObj.length === 2 &&
  resPieceObj.some(t => t.id === 'tr_preset_2') &&
  resPieceObj.some(t => t.id === 'tr_manual_1') &&
  !resPieceObj.some(t => t.id === 'tr_preset_1')
);

// Titre par défaut normalisé sans "Speed Trainer"
const resDefaultTitle = resolvePieceTrainings('seq_preset_123', [{ id: 'tr_no_title', presetId: 'seq_preset_123' }]);
assert('Titre par défaut normalisé en "Entraînement"', resDefaultTitle[0]?.title === 'Entraînement');

// -----------------------------------------------------------------------------
// 3. Gestion des entraînements dans RepertoirePieceModal & RepertoireTrainingsManager
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Gestion des entraînements (RepertoireTrainingsManager)');

const trainingsManagerPath = path.resolve('src/components/mestre/RepertoireTrainingsManager.jsx');
assert('RepertoireTrainingsManager.jsx existe', fs.existsSync(trainingsManagerPath));

const trainingsManagerCode = fs.readFileSync(trainingsManagerPath, 'utf8');
assert('RepertoireTrainingsManager gère excludedTrainingIds et onChangeExcludedIds', trainingsManagerCode.includes('excludedTrainingIds') && trainingsManagerCode.includes('onChangeExcludedIds'));
assert('RepertoireTrainingsManager propose le bouton [✕] de détachement', trainingsManagerCode.includes('handleDetachTraining') && trainingsManagerCode.includes('Détacher'));
assert('RepertoireTrainingsManager propose le menu sélecteur d\'ajout', trainingsManagerCode.includes('Associer un autre entraînement existant'));

const modalCode = fs.readFileSync(path.resolve('src/components/mestre/RepertoirePieceModal.jsx'), 'utf8');
assert('RepertoirePieceModal intègre RepertoireTrainingsManager', modalCode.includes('<RepertoireTrainingsManager'));
assert('RepertoirePieceModal gère l\'état excludedTrainingIds', modalCode.includes('excludedTrainingIds, setExcludedTrainingIds'));
assert('RepertoirePieceModal persiste excludedTrainingIds dans pieceData', modalCode.includes('excludedTrainingIds: cleanExcludedTrainingIds.length > 0 ? cleanExcludedTrainingIds : null'));

// -----------------------------------------------------------------------------
// 4. Sélecteur Culture ergonomique (RepertoireCulturePicker)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Sélecteur Culture ergonomique (RepertoireCulturePicker)');

const culturePickerPath = path.resolve('src/components/mestre/RepertoireCulturePicker.jsx');
assert('RepertoireCulturePicker.jsx existe', fs.existsSync(culturePickerPath));

const culturePickerCode = fs.readFileSync(culturePickerPath, 'utf8');
assert('RepertoireCulturePicker dispose d\'une barre de recherche textuelle', culturePickerCode.includes('searchTerm') && culturePickerCode.includes('Rechercher une fiche'));
assert('RepertoireCulturePicker extrait dynamiquement categoriesDisponibles sans catégories en dur',
  culturePickerCode.includes('categorieFiche') &&
  culturePickerCode.includes('categorie') &&
  culturePickerCode.includes('rubrique') &&
  culturePickerCode.includes("'Toutes'")
);
assert('RepertoireCulturePicker affiche les badges Cordel amovibles [✕]', culturePickerCode.includes('handleRemoveDoc') && culturePickerCode.includes('Détacher cette fiche culturelle'));
assert('RepertoireCulturePicker propose les résultats sous forme de lignes avec cases à cocher', culturePickerCode.includes('type="checkbox"') && culturePickerCode.includes('handleToggleDoc'));

assert('RepertoirePieceModal intègre RepertoireCulturePicker', modalCode.includes('<RepertoireCulturePicker'));

// -----------------------------------------------------------------------------
// 5. Construction de l'URL cible sequenciador
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Construction de l\'URL cible sequenciador (trainingLauncher.js)');
assert('trainingLauncher.js garantit le slash final avant ?presetId=',
  launcherCode.includes("baseWithSlash") &&
  launcherCode.includes("presetId=") &&
  launcherCode.includes("trainingId=") &&
  launcherCode.includes("stage=")
);

// -----------------------------------------------------------------------------
// Résultat global
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
if (allPassed) {
  console.log('🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DE LA MISSION SONT VALIDÉES !');
  console.log('========================================================================\n');
  process.exit(0);
} else {
  console.error('❌ ÉCHEC SUR AU MOINS UNE ASSERTION.');
  console.log('========================================================================\n');
  process.exit(1);
}
