import fs from 'fs';
import path from 'path';
import { resolvePieceTrainings } from '../src/utils/repertoireMatcher.js';

console.log('===============================================================');
console.log('🧪 TEST MISSION : OUVERTURE RÉPERTOIRE ADHÉRENTS & AISANCE');
console.log('===============================================================\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ [PASS] ${desc}`);
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    allPassed = false;
  }
}

// 1. Test unitaire : extension resolvePieceTrainings avec trainingIds
console.log('▶️ Test 1 : Extension de resolvePieceTrainings avec trainingIds & déduplication');
const mockTrainings = [
  { id: 'tr_preset_1', presetId: 'seq_123', title: 'Entraînement Preset A', startBpm: 60, targetBpm: 100 },
  { id: 'tr_manual_1', presetId: 'other_preset', title: 'Entraînement Manuel B', startBpm: 70, targetBpm: 110 },
  { id: 'tr_other', presetId: 'third_preset', title: 'Entraînement Inexistant C', startBpm: 80, targetBpm: 120 }
];

const resolvedPresetOnly = resolvePieceTrainings('seq_123', mockTrainings);
assert('Résolution classique par presetId', resolvedPresetOnly.length === 1 && resolvedPresetOnly[0].id === 'tr_preset_1');

const resolvedWithManual = resolvePieceTrainings('seq_123', mockTrainings, ['tr_manual_1']);
assert('Résolution combinée presetId + trainingIds', resolvedWithManual.length === 2 && resolvedWithManual.some(t => t.id === 'tr_manual_1'));

const resolvedDedup = resolvePieceTrainings('seq_123', mockTrainings, ['tr_preset_1']);
assert('Déduplication des entraînements par id', resolvedDedup.length === 1);

const resolvedNoPresetWithManual = resolvePieceTrainings(null, mockTrainings, ['tr_manual_1']);
assert('Résolution sans presetId mais avec trainingIds', resolvedNoPresetWithManual.length === 1 && resolvedNoPresetWithManual[0].id === 'tr_manual_1');

// 2. Contrôle statique : TabModules.jsx
console.log('\n▶️ Test 2 : Contrôle statique de TabModules.jsx (Feature Toggle)');
const tabModulesContent = fs.readFileSync(path.resolve('src/components/association-settings/TabModules.jsx'), 'utf-8');
assert('Contient le bloc Accès Adhérent au Répertoire', tabModulesContent.includes('Accès Adhérent au Répertoire'));
assert('Modifie features.repertoireEleves', tabModulesContent.includes('repertoireEleves'));

// 3. Contrôle statique : MestreRepertoireView.jsx
console.log('\n▶️ Test 3 : Contrôle statique de MestreRepertoireView.jsx (Bandeau interactif)');
const mestreRepContent = fs.readFileSync(path.resolve('src/components/mestre/MestreRepertoireView.jsx'), 'utf-8');
assert('Accepte le prop features', mestreRepContent.includes('features'));
assert('Contient le badge d\'état interactif Répertoire adhérents ouvert/masqué', mestreRepContent.includes('Répertoire adhérents ouvert') && mestreRepContent.includes('Répertoire adhérents masqué'));
assert('Met à jour features.repertoireEleves via updateDoc', mestreRepContent.includes("'features.repertoireEleves'"));

// 4. Contrôle statique : App.jsx
console.log('\n▶️ Test 4 : Contrôle statique de App.jsx (Routage et sécurité)');
const appContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
assert('Import paresseux de MemberRepertoireView', appContent.includes('MemberRepertoireView = lazyWithRetry'));
assert('Onglet repertoire déclaré dans POLES_CONFIG', appContent.includes("id: 'repertoire'") && appContent.includes("labelKey: 'tabRepertoire'"));
assert('Règle de visibilité isModuleEnabled pour repertoire', appContent.includes("tabId === 'repertoire' && features?.repertoireEleves !== true && !hasAccessMestre"));
assert('Navigation handleNavigateToView pour repertoire', appContent.includes("case 'repertoire':"));
assert('Rendu conditionnel currentTab === repertoire', appContent.includes("currentTab === 'repertoire'"));

// 5. Contrôle statique : RepertoirePieceModal.jsx
console.log('\n▶️ Test 5 : Contrôle statique de RepertoirePieceModal.jsx (trainingIds)');
const modalContent = fs.readFileSync(path.resolve('src/components/mestre/RepertoirePieceModal.jsx'), 'utf-8');
assert('Contient le sélecteur trainingIds', modalContent.includes('trainingIds') && modalContent.includes('selectedTrainingIds'));
assert('Souscrit aux entraînements du groupe', modalContent.includes('subscribeGroupTrainings'));

// 6. Contrôle des composants Adhérent (Lignes & Responsabilités)
console.log('\n▶️ Test 6 : Contrôle des composants Adhérent (src/components/member/)');
const viewPath = path.resolve('src/components/member/MemberRepertoireView.jsx');
const cardPath = path.resolve('src/components/member/MemberPieceCard.jsx');
const aisancePath = path.resolve('src/components/member/PieceAisanceSection.jsx');

assert('MemberRepertoireView.jsx existe', fs.existsSync(viewPath));
assert('MemberPieceCard.jsx existe', fs.existsSync(cardPath));
assert('PieceAisanceSection.jsx existe', fs.existsSync(aisancePath));

const viewLines = fs.readFileSync(viewPath, 'utf-8').split('\n').length;
const cardLines = fs.readFileSync(cardPath, 'utf-8').split('\n').length;
const aisanceLines = fs.readFileSync(aisancePath, 'utf-8').split('\n').length;

assert(`MemberRepertoireView < 220 lignes (actuel: ${viewLines})`, viewLines < 220);
assert(`MemberPieceCard < 200 lignes (actuel: ${cardLines})`, cardLines < 200);
assert(`PieceAisanceSection < 150 lignes (actuel: ${aisanceLines})`, aisanceLines < 150);

const cardContent = fs.readFileSync(cardPath, 'utf-8');
assert('MemberPieceCard gère les demandes de révision', cardContent.includes('onToggleRevision') && cardContent.includes('Révision demandée'));
assert('MemberPieceCard gère le curseur de confort à 4 pastilles', cardContent.includes('COMFORT_LEVELS') && cardContent.includes('onSetComfortLevel'));

const aisanceContent = fs.readFileSync(aisancePath, 'utf-8');
assert('PieceAisanceSection respecte Zéro Bloc Vide (return null)', aisanceContent.includes('return null;'));
assert('PieceAisanceSection intègre toggleStageCompletion et launchTrainingStage', aisanceContent.includes('toggleStageCompletion') && aisanceContent.includes('launchTrainingStage'));

console.log('\n===============================================================');
if (allPassed) {
  console.log('🏆 SUCCÈS TOTAL : TOUTES LES SPÉCIFICATIONS SONT VALIDÉES !');
  process.exit(0);
} else {
  console.error('❌ ÉCHEC : CERTAINES ASSERTIONS ONT ÉCHOUÉ.');
  process.exit(1);
}
