/**
 * Test de validation automatisé i18n — Lot 3 : Pôle Costumerie & Artisanat Textile
 * Vérifie :
 * 1. Parité stricte 1:1 des dictionnaires fr.js et pt.js pour le namespace 'costumerie'
 * 2. 0 clé orpheline
 * 3. Utilisation de useTranslation et des clés costumerie.* dans les 12 fichiers cibles
 */
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : VALIDATION I18N PÔLE COSTUMERIE (LOT 3)");
console.log("===============================================================\n");

let hasErrors = false;

// 1. Validation de l'existence et parité des dictionnaires
const frCostumerie = fr.costumerie || {};
const ptCostumerie = pt.costumerie || {};

const frKeys = Object.keys(frCostumerie);
const ptKeys = Object.keys(ptCostumerie);

console.log(`▶️ Module 1 : Parité des clés du namespace 'costumerie'`);
console.log(`   - Clés dans fr.js : ${frKeys.length}`);
console.log(`   - Clés dans pt.js : ${ptKeys.length}`);

if (frKeys.length === 0) {
  console.error("❌ ERREUR : Aucune clé trouvée sous 'costumerie' dans fr.js !");
  hasErrors = true;
}

const missingInPt = frKeys.filter(k => !(k in ptCostumerie));
const missingInFr = ptKeys.filter(k => !(k in frCostumerie));

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

// 2. Vérification des 12 fichiers cibles
console.log(`\n▶️ Module 2 : Raccordement des 12 fichiers cibles du Pôle Costumerie`);

const targetFiles = [
  'src/components/mestre/WardrobeManager.jsx',
  'src/components/mestre/CostumesAdminManager.jsx',
  'src/components/mestre/CostumeSizesTable.jsx',
  'src/components/profile/MonVestiaire.jsx',
  'src/components/profile/CostumeVisualizer.jsx',
  'src/components/profile/PostEventCostumeReturnModal.jsx',
  'src/components/profile/AtelierCouture.jsx',
  'src/components/profile/CollectiveWorkshopView.jsx',
  'src/components/association-settings/blocks/WardrobeBlock.jsx',
  'src/components/association-settings/modules/WardrobeMemberModeCard.jsx',
  'src/components/documents/CostumerieDocumentsTable.jsx',
  'src/components/event-details/EventWardrobeSummaryCard.jsx'
];

targetFiles.forEach((relPath, idx) => {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ERREUR : Fichier non trouvé : ${relPath}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Vérification de useTranslation
  const hasUseTranslation = content.includes('useTranslation') || content.includes('t(');
  if (!hasUseTranslation) {
    console.error(`❌ ERREUR : Pas d'appel ou de prop de traduction dans ${relPath}`);
    hasErrors = true;
    return;
  }

  // Vérification de la présence d'appels à costumerie.
  const costumerieMatches = content.match(/costumerie\.[a-zA-Z0-9_]+/g) || [];
  if (costumerieMatches.length === 0) {
    console.error(`❌ ERREUR : Aucune référence costumerie.* trouvée dans ${relPath}`);
    hasErrors = true;
    return;
  }
  console.log(`   ✅ [${idx + 1}/${targetFiles.length}] ${relPath} : ${costumerieMatches.length} référence(s) costumerie.* branchée(s).`);
});

// 3. Validation de clés spécifiques clés de l'artisanat textile et retours
console.log(`\n▶️ Module 3 : Validation de clés représentatives (textile, bac, confections)`);
const sampleKeys = [
  'gestionDeLaCostumerie',
  'creerUnCostume',
  'tableauDesTaillesVestiaire',
  'monVestiaireGardeRobe',
  'retourDesCostumes',
  'auBacAsso',
  'lavageMaison',
  'atelierCostumesConfections',
  'modeDuVestiaireAdherent',
  'patronsDocumentsVaral',
  'notSpecifiedCount',
  'btnAddTool',
  'btnAddSupply',
  'btnSaveConfig',
  'btnAddPiece',
  'badgePieceMandatory',
  'badgePieceOptional',
  'btnCreateProject'
];

sampleKeys.forEach(k => {
  if (!frCostumerie[k] || !ptCostumerie[k]) {
    console.error(`❌ ERREUR : Clé échantillon manquante : ${k}`);
    hasErrors = true;
  } else {
    console.log(`   ✅ Clé '${k}' validée (FR: "${frCostumerie[k].slice(0, 30)}..." | PT: "${ptCostumerie[k].slice(0, 30)}...")`);
  }
});

console.log("\n===============================================================");
if (hasErrors) {
  console.error("❌ ÉCHEC DU TEST : Des anomalies ont été détectées.");
  process.exit(1);
} else {
  console.log("🏆 SUCCÈS : 100% DES VÉRIFICATIONS I18N COSTUMERIE SONT VALIDÉES !");
  console.log("===============================================================");
  process.exit(0);
}
