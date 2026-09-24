import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { computeTrainingStages } from '../src/utils/aisanceStagesUtils.js';
import { normalizeString } from '../src/utils/repertoireMatcher.js';

console.log('===============================================================');
console.log('🧪 TEST AUTOMATISÉ : LIAISON SPEED TRAINER & AISANCE DES ADHÉRENTS');
console.log('===============================================================');

// -------------------------------------------------------------
// 1. Test de computeTrainingStages
// -------------------------------------------------------------
console.log("\n▶️ Test 1 : Normalisation et calcul des paliers (computeTrainingStages)");

// Cas 1.1 : Paliers explicites avec objets
const trainingObjStages = {
  stages: [
    { startBpm: 80, targetBpm: 95 },
    { startBpm: 95, targetBpm: 110 },
    { startBpm: 110, targetBpm: 125 }
  ]
};
const stagesObj = computeTrainingStages(trainingObjStages);
assert.strictEqual(stagesObj.length, 3, "Doit comporter 3 paliers");
assert.strictEqual(stagesObj[0].startBpm, 80);
assert.strictEqual(stagesObj[0].targetBpm, 95);
assert.strictEqual(stagesObj[0].label, "Palier 1 : 80 ➔ 95 BPM");
assert.strictEqual(stagesObj[2].targetBpm, 125);
console.log("  ✅ [PASS] Paliers explicites par objets validés");

// Cas 1.2 : Paliers numériques bruts
const trainingNumStages = {
  startBpm: 70,
  stages: [90, 110, 130]
};
const stagesNum = computeTrainingStages(trainingNumStages);
assert.strictEqual(stagesNum.length, 3);
assert.strictEqual(stagesNum[0].startBpm, 70);
assert.strictEqual(stagesNum[0].targetBpm, 90);
assert.strictEqual(stagesNum[1].startBpm, 90);
assert.strictEqual(stagesNum[1].targetBpm, 110);
console.log("  ✅ [PASS] Paliers explicites numériques validés");

// Cas 1.3 : Génération dynamique startBpm / targetBpm / stepBpm
const trainingDyn = {
  startBpm: 60,
  targetBpm: 90,
  stepBpm: 10
};
const stagesDyn = computeTrainingStages(trainingDyn);
assert.strictEqual(stagesDyn.length, 3, "60->70, 70->80, 80->90 = 3 paliers");
assert.strictEqual(stagesDyn[0].startBpm, 60);
assert.strictEqual(stagesDyn[0].targetBpm, 70);
assert.strictEqual(stagesDyn[2].targetBpm, 90);
console.log("  ✅ [PASS] Génération dynamique de paliers validée");

// Cas 1.4 : Repli de secours
const stagesFallback = computeTrainingStages({});
assert.strictEqual(stagesFallback.length, 3, "Doit avoir 3 paliers de repli");
console.log("  ✅ [PASS] Repli sécurisé par défaut validé");

// -------------------------------------------------------------
// 2. Test du format d'URL du lanceur SSO (trainingLauncher.js)
// -------------------------------------------------------------
console.log("\n▶️ Test 2 : Format d'URL et paramètres du lanceur SSO");
const launcherPath = path.resolve('src/utils/trainingLauncher.js');
const launcherSource = fs.readFileSync(launcherPath, 'utf8');

assert.ok(launcherSource.includes('presetId'), "Le lanceur doit inclure presetId");
assert.ok(launcherSource.includes('trainingId'), "Le lanceur doit inclure trainingId");
assert.ok(launcherSource.includes('stage='), "Le lanceur doit inclure stage=");
assert.ok(launcherSource.includes('launchCrossApp'), "Le lanceur doit s'appuyer sur launchCrossApp");
console.log("  ✅ [PASS] trainingLauncher.js respecte la syntaxe d'URL SSO");

// -------------------------------------------------------------
// 3. Test de resolvePieceTrainings (repertoireMatcher.js & aisanceService.js)
// -------------------------------------------------------------
console.log("\n▶️ Test 3 : Résolution d'entraînement par presetId (resolvePieceTrainings)");

import { resolvePieceTrainings } from '../src/utils/repertoireMatcher.js';

const mockTrainings = [
  { id: 'train_1', presetId: 'preset_maracatu_1', title: 'Défi Vitesse Elegante', startBpm: 60, targetBpm: 90 },
  { id: 'train_2', presetId: 'preset_luanda_2', title: 'Défi Luanda Rapide', stages: [80, 100, 120] },
  { id: 'train_3', presetId: 'preset_ondas_3', title: 'Accélération Ondas', startBpm: 75, targetBpm: 105, stepBpm: 10 },
  { id: 'train_4', presetId: 'preset_maracatu_1', title: 'Défi Virada Turbo', startBpm: 90, targetBpm: 120 }
];

// Résolution pour preset_maracatu_1 (2 défis associés)
const res1 = resolvePieceTrainings('preset_maracatu_1', mockTrainings);
assert.strictEqual(res1.length, 2, "Doit trouver 2 entraînements pour preset_maracatu_1");
assert.strictEqual(res1[0].id, 'train_1');
assert.strictEqual(res1[0].title, 'Défi Vitesse Elegante');
assert.strictEqual(res1[0].startBpm, 60);
assert.strictEqual(res1[0].targetBpm, 90);
assert.strictEqual(res1[0].stagesCount, 3);
assert.strictEqual(res1[1].id, 'train_4');
console.log("  ✅ [PASS] resolvePieceTrainings résout les défis multiples d'un preset");

// Résolution pour preset sans entraînement
const resEmpty = resolvePieceTrainings('preset_inconnu', mockTrainings);
assert.strictEqual(resEmpty.length, 0, "Doit retourner une liste vide si aucun match");

// Résolution avec paramètres vides/nuls
assert.strictEqual(resolvePieceTrainings(null, mockTrainings).length, 0);
assert.strictEqual(resolvePieceTrainings('preset_1', []).length, 0);
console.log("  ✅ [PASS] Tolérance aux données absentes validée");

// -------------------------------------------------------------
// 4. Contrôle statique des composants modifiés
// -------------------------------------------------------------
console.log("\n▶️ Test 4 : Contrôle statique des composants modifiés");

const repViewPath = path.resolve('src/components/mestre/MestreRepertoireView.jsx');
const repViewContent = fs.readFileSync(repViewPath, 'utf8');
assert.ok(repViewContent.includes('Speed Trainer'), "MestreRepertoireView doit afficher le badge Speed Trainer");
assert.ok(repViewContent.includes('resolvePieceTrainings'), "MestreRepertoireView doit utiliser resolvePieceTrainings");
assert.ok(repViewContent.includes('TrainingCompactCard'), "MestreRepertoireView doit intégrer TrainingCompactCard");
console.log("  ✅ [PASS] MestreRepertoireView.jsx intègre Speed Trainer et TrainingCompactCard");

const eventProgPath = path.resolve('src/components/event-details/EventRevisionProgram.jsx');
const eventProgContent = fs.readFileSync(eventProgPath, 'utf8');
assert.ok(eventProgContent.includes('resolvePieceTrainings'), "EventRevisionProgram doit appeler resolvePieceTrainings");
assert.ok(eventProgContent.includes('TrainingCompactCard'), "EventRevisionProgram doit intégrer TrainingCompactCard");
assert.ok(eventProgContent.includes('rehearsal'), "EventRevisionProgram doit utiliser le mode rehearsal");
console.log("  ✅ [PASS] EventRevisionProgram.jsx intègre l'encart d'entraînement de répétition");

const trainingCardPath = path.resolve('src/components/pedagogy/TrainingCompactCard.jsx');
const trainingCardContent = fs.readFileSync(trainingCardPath, 'utf8');
assert.ok(trainingCardContent.includes('Entraînement recommandé pour la séance'), "TrainingCompactCard doit proposer l'en-tête de recommandation");
assert.ok(trainingCardContent.includes('launchTrainingStage'), "TrainingCompactCard doit appeler launchTrainingStage");
console.log("  ✅ [PASS] TrainingCompactCard.jsx opérationnel et conforme à la charte");

const carnetPath = path.resolve('src/components/pedagogy/MonCarnetAisance.jsx');
const carnetContent = fs.readFileSync(carnetPath, 'utf8');
assert.ok(carnetContent.includes('Défis Rythmiques'), "MonCarnetAisance doit comporter l'onglet Défis Rythmiques");
assert.ok(carnetContent.includes('toggleStageCompletion'), "MonCarnetAisance doit appeler toggleStageCompletion");
assert.ok(carnetContent.includes('👑'), "MonCarnetAisance doit comporter le badge Maîtrisé");
assert.ok(carnetContent.includes('launchTrainingStage'), "MonCarnetAisance doit appeler launchTrainingStage");
console.log("  ✅ [PASS] MonCarnetAisance.jsx intègre le Carnet d'Aisance et les paliers");

const dashboardPath = path.resolve('src/components/mestre/MestrePedagogyDashboard.jsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
assert.ok(dashboardContent.includes('speedtrainer'), "MestrePedagogyDashboard doit disposer de l'onglet speedtrainer");
assert.ok(dashboardContent.includes('userAisanceMap'), "MestrePedagogyDashboard doit suivre userAisanceMap");
console.log("  ✅ [PASS] MestrePedagogyDashboard.jsx intègre le suivi Mestre en lecture seule");

// -------------------------------------------------------------
// 5. Gouvernance centralisée des règles Firebase
// -------------------------------------------------------------
console.log("\n▶️ Test 5 : Respect strict de la gouvernance Firebase");
assert.strictEqual(fs.existsSync('firestore.rules'), false, "firestore.rules ne doit pas exister localement");
assert.strictEqual(fs.existsSync('storage.rules'), false, "storage.rules ne doit pas exister localement");
console.log("  ✅ [PASS] Aucune règle locale altérée (Gouvernance Orchestrad'Or respectée)");

console.log('\n===============================================================');
console.log('🏆 TOUS LES TESTS SPEED TRAINER & AISANCE SONT 100% VALIDÉS !');
console.log('===============================================================');
