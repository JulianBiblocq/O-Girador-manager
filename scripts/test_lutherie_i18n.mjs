/**
 * Test de validation automatisé i18n — Lot 2 : Pôle Lutherie & Artisanat Instrumental
 * Vérifie :
 * 1. Parité stricte 1:1 des dictionnaires fr.js et pt.js pour le namespace 'lutherie'
 * 2. 0 clé orpheline
 * 3. Utilisation de useTranslation et des clés lutherie.* dans les 13 fichiers cibles
 */
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : VALIDATION I18N PÔLE LUTHERIE (LOT 2)");
console.log("===============================================================\n");

let hasErrors = false;

// 1. Validation de l'existence et parité des dictionnaires
const frLutherie = fr.lutherie || {};
const ptLutherie = pt.lutherie || {};

const frKeys = Object.keys(frLutherie);
const ptKeys = Object.keys(ptLutherie);

console.log(`▶️ Module 1 : Parité des clés du namespace 'lutherie'`);
console.log(`   - Clés dans fr.js : ${frKeys.length}`);
console.log(`   - Clés dans pt.js : ${ptKeys.length}`);

if (frKeys.length === 0) {
  console.error("❌ ERREUR : Aucune clé trouvée sous 'lutherie' dans fr.js !");
  hasErrors = true;
}

const missingInPt = frKeys.filter(k => !(k in ptLutherie));
const missingInFr = ptKeys.filter(k => !(k in frLutherie));

if (missingInPt.length > 0) {
  console.error(`❌ ERREUR : ${missingInPt.length} clé(s) présente(s) en FR mais manquante(s) en PT :`, missingInPt);
  hasErrors = true;
} else {
  console.log("   ✅ [PASS] 0 clé orpheline FR -> PT.");
}

if (missingInFr.length > 0) {
  console.error(`❌ ERREUR : ${missingInFr.length} clé(s) présente(s) en PT mais manquante(s) en FR :`, missingInFr);
  hasErrors = true;
} else {
  console.log("   ✅ [PASS] 0 clé orpheline PT -> FR.");
}

// 2. Vérification des fichiers cibles
console.log(`\n▶️ Module 2 : Raccordement des fichiers cibles du Pôle Lutherie`);

const targetFiles = [
  'src/components/inventory/InventoryProjectsView.jsx',
  'src/components/inventory/AssemblySlotItem.jsx',
  'src/components/inventory/InstrumentBaptismModal.jsx',
  'src/components/inventory/ImportModelWizardModal.jsx',
  'src/components/varal/InstrumentModelsManager.jsx',
  'src/components/inventory/InventoryPartsView.jsx',
  'src/components/inventory/PartAssignmentBadge.jsx',
  'src/components/inventory/PartHistoryLogs.jsx',
  'src/components/inventory/PartWorkflowModal.jsx',
  'src/components/inventory/SuppliesListView.jsx',
  'src/components/inventory/WorkshopToolsListView.jsx',
  'src/components/profile/StudentInstrumentsWorkshop.jsx',
  'src/components/profile/MonAtelier.jsx',
  'src/components/documents/LutherieDocumentsTable.jsx',
  'src/components/documents/form/DocumentFormFabricationFields.jsx',
  'src/components/FabricationCard.jsx'
];

targetFiles.forEach((relPath, idx) => {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`   ❌ [${idx + 1}/${targetFiles.length}] Fichier manquant : ${relPath}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const hasUseTranslation = content.includes('useTranslation');
  const matches = [...content.matchAll(/t\(\s*['"]lutherie\.([a-zA-Z0-9_-]+)['"]/g)];

  if (!hasUseTranslation) {
    console.error(`   ❌ [${idx + 1}/${targetFiles.length}] ${relPath} : useTranslation n'est pas importé ou instancié !`);
    hasErrors = true;
  } else if (matches.length === 0) {
    console.error(`   ❌ [${idx + 1}/${targetFiles.length}] ${relPath} : Aucune référence à 'lutherie.*' trouvée !`);
    hasErrors = true;
  } else {
    console.log(`   ✅ [${idx + 1}/${targetFiles.length}] ${relPath} : ${matches.length} référence(s) lutherie.* branchée(s).`);
  }
});

console.log("\n===============================================================");
if (hasErrors) {
  console.error("💥 ÉCHEC : Des erreurs ont été détectées lors de la validation du Pôle Lutherie.");
  console.log("===============================================================\n");
  process.exit(1);
} else {
  console.log("🏆 SUCCÈS TOTAL : LE PÔLE LUTHERIE EST 100% INTERNATIONALISÉ");
  console.log("===============================================================\n");
}
