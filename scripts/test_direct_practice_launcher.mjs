/**
 * Test automatisé : Suppression de la modale pupitre d'Organizad'Or & Redirection directe vers Sequenciador.
 * Vérifie :
 * 1. Normalisation robuste des pupitres traditionnels (resolveUserSequencerRole).
 * 2. Bypass de la modale et génération des URLs complètes ou avec rôle omis.
 * 3. Absence de balise active RoleSelectorModal dans le code JSX des composants pédagogiques.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { resolveUserSequencerRole } from '../src/utils/trainingLauncher.js';

console.log('===============================================================');
console.log('🧪 TEST AUTOMATISÉ : BYPASS MODALE PUPITRE & LANCEUR SEQUENCIADOR DIRECT');
console.log('===============================================================');

// -------------------------------------------------------------
// 1. Détection et normalisation de l'instrument principal
// -------------------------------------------------------------
console.log("\n▶️ Test 1 : Détection & normalisation (resolveUserSequencerRole)");

assert.strictEqual(
  resolveUserSequencerRole({ instrumentPrincipal: 'Marcante (alfaia)' }),
  'marcante',
  "« Marcante (alfaia) » doit donner « marcante »"
);

assert.strictEqual(
  resolveUserSequencerRole({ instrument: 'Meião' }),
  'meiao',
  "« Meião » doit donner « meiao »"
);

assert.strictEqual(
  resolveUserSequencerRole({ instrumentRole: 'Caixa' }),
  'caixa',
  "« Caixa » doit donner « caixa »"
);

assert.strictEqual(
  resolveUserSequencerRole({ pupitre: 'Alfaia Repique' }),
  'repique',
  "« Alfaia Repique » doit donner « repique »"
);

assert.strictEqual(
  resolveUserSequencerRole({ pupitrePrincipal: 'Gonguê' }),
  'gongue',
  "« Gonguê » doit donner « gongue »"
);

assert.strictEqual(
  resolveUserSequencerRole({ role: 'Agbê' }),
  'agbe',
  "« Agbê » doit donner « agbe »"
);

assert.strictEqual(
  resolveUserSequencerRole({ instrumentsJoues: ['Timbal', 'Caixa'] }),
  'timbal',
  "Premier instrument 'Timbal' doit donner « timbal »"
);

assert.strictEqual(
  resolveUserSequencerRole('Marcante'),
  'marcante',
  "Passage d'une string brute 'Marcante' doit donner « marcante »"
);

assert.strictEqual(
  resolveUserSequencerRole({ instrument: 'Danse' }),
  null,
  "« Danse » ne fait pas partie des 7 pupitres et doit retourner null"
);

assert.strictEqual(
  resolveUserSequencerRole(null),
  null,
  "profileData null doit retourner null"
);

assert.strictEqual(
  resolveUserSequencerRole({}),
  null,
  "profileData vide doit retourner null"
);

console.log("  ✅ [PASS] Tous les cas de normalisation de pupitre sont validés");

// -------------------------------------------------------------
// 2. Contrôle du code source de trainingLauncher.js
// -------------------------------------------------------------
console.log("\n▶️ Test 2 : Format des URLs dans trainingLauncher.js");
const launcherPath = path.resolve('src/utils/trainingLauncher.js');
const launcherCode = fs.readFileSync(launcherPath, 'utf8');

assert.ok(launcherCode.includes('tocarJunto'), "launchTrainingStage doit gérer tocarJunto");
assert.ok(launcherCode.includes('baseOnly'), "launchTrainingStage doit gérer baseOnly");
assert.ok(launcherCode.includes("params.set('role', role"), "launchTrainingStage doit ajouter role s'il existe");
assert.ok(launcherCode.includes("params.set('presetId', presetId)"), "launchTrainingStage doit ajouter presetId");
assert.ok(launcherCode.includes("params.set('trainingId', trainingId)"), "launchTrainingStage doit ajouter trainingId si présent");
assert.ok(launcherCode.includes("params.set('stage', String(stageIndex))"), "launchTrainingStage doit ajouter stage");

console.log("  ✅ [PASS] trainingLauncher.js forge les paramètres URL attendus");

// -------------------------------------------------------------
// 3. Contrôle du hook usePracticeLauncher.js
// -------------------------------------------------------------
console.log("\n▶️ Test 3 : Absence d'interception modale dans usePracticeLauncher.js");
const hookPath = path.resolve('src/hooks/usePracticeLauncher.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

assert.ok(!hookCode.includes('setIsRoleModalOpen(true)'), "usePracticeLauncher ne doit plus ouvrir la modale");
assert.ok(!hookCode.includes('setPendingTraining'), "usePracticeLauncher ne doit plus stocker de pendingTraining");
assert.ok(hookCode.includes('launchTrainingStage('), "usePracticeLauncher doit appeler immédiatement launchTrainingStage");
assert.ok(hookCode.includes('resolveUserSequencerRole'), "usePracticeLauncher doit utiliser resolveUserSequencerRole");

console.log("  ✅ [PASS] usePracticeLauncher bypass immédiatement sans interception");

// -------------------------------------------------------------
// 4. Contrôle de l'absence de modales actives dans les composants
// -------------------------------------------------------------
console.log("\n▶️ Test 4 : Absence de balise RoleSelectorModal dans les composants");

const checkNoModal = (relPath) => {
  const filePath = path.resolve(relPath);
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(!code.includes('<RoleSelectorModal'), `${relPath} ne doit plus contenir <RoleSelectorModal`);
  assert.ok(!code.includes("import RoleSelectorModal"), `${relPath} ne doit plus importer RoleSelectorModal`);
};

checkNoModal('src/components/pedagogy/TrainingCompactCard.jsx');
checkNoModal('src/components/member/PieceAisanceSection.jsx');
checkNoModal('src/components/pedagogy/MonCarnetAisance.jsx');

console.log("  ✅ [PASS] TrainingCompactCard, PieceAisanceSection et MonCarnetAisance nettoyés");

// -------------------------------------------------------------
// 5. Contrôle de désactivation de RoleSelectorModal.jsx
// -------------------------------------------------------------
console.log("\n▶️ Test 5 : Désactivation propre de RoleSelectorModal.jsx");
const modalPath = path.resolve('src/components/pedagogy/RoleSelectorModal.jsx');
const modalCode = fs.readFileSync(modalPath, 'utf8');

assert.ok(modalCode.includes('return null;'), "RoleSelectorModal doit retourner immédiatement null");
assert.ok(!modalCode.includes('addEventListener'), "RoleSelectorModal ne doit plus attacher d'écouteurs");

console.log("  ✅ [PASS] RoleSelectorModal.jsx est neutralisé et retourne null");

console.log('\n===============================================================');
console.log('🏆 TOUS LES TESTS DU BYPASS MODALE VERS SEQUENCIADOR SONT VALIDÉS !');
console.log('===============================================================');
