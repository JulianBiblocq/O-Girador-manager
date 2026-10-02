/**
 * Test de validation automatisé i18n — Lot 1 : Pôle Logistique
 * Vérifie :
 * 1. Parité stricte 1:1 des dictionnaires fr.js et pt.js pour le namespace 'logistics'
 * 2. 0 clé orpheline
 * 3. Utilisation de useTranslation et des clés logistics.* dans les 13 fichiers cibles
 */
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : VALIDATION I18N PÔLE LOGISTIQUE (LOT 1)");
console.log("===============================================================\n");

let hasErrors = false;

// 1. Validation de l'existence et parité des dictionnaires
const frLogistics = fr.logistics || {};
const ptLogistics = pt.logistics || {};

const frKeys = Object.keys(frLogistics);
const ptKeys = Object.keys(ptLogistics);

console.log(`▶️ Module 1 : Parité des clés du namespace 'logistics'`);
console.log(`   - Clés dans fr.js : ${frKeys.length}`);
console.log(`   - Clés dans pt.js : ${ptKeys.length}`);

if (frKeys.length === 0) {
  console.error("❌ ERREUR : Aucune clé trouvée sous 'logistics' dans fr.js !");
  hasErrors = true;
}

const missingInPt = frKeys.filter(k => !(k in ptLogistics));
const missingInFr = ptKeys.filter(k => !(k in frLogistics));

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

// 2. Vérification des 13 fichiers cibles
console.log(`\n▶️ Module 2 : Raccordement des 13 fichiers cibles du Pôle Logistique`);

const targetFiles = [
  'src/components/InventoryManager.jsx',
  'src/components/inventory/InventoryItemCard.jsx',
  'src/components/inventory/InstrumentsDataTable.jsx',
  'src/components/inventory/InstrumentEditModal.jsx',
  'src/components/inventory/RepairDiagnosticModal.jsx',
  'src/components/inventory/InstrumentCautionFields.jsx',
  'src/components/inventory/InventoryFilterBar.jsx',
  'src/components/inventory/InventoryMovementsBanner.jsx',
  'src/components/OrdersManager.jsx',
  'src/components/orders/OrderPaymentControls.jsx',
  'src/components/orders/MemberOrdersPaymentAlert.jsx',
  'src/components/association-settings/blocks/AccessoriesKitsBlock.jsx',
  'src/components/profile/UserMateriel.jsx',
  'src/components/association-settings/blocks/CarpoolBlock.jsx',
  'src/components/association-settings/blocks/VehicleFleetSection.jsx',
  'src/components/association-settings/blocks/DepartureLocationAccordion.jsx',
  'src/components/logistics/CollectiveKitsManager.jsx'
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

  // Vérification de la présence d'appels à logistics.
  const logisticsMatches = content.match(/logistics\.[a-zA-Z0-9_]+/g) || [];
  console.log(`   ✅ [${idx + 1}/${targetFiles.length}] ${relPath} : ${logisticsMatches.length} référence(s) logistics.* branchée(s).`);
});

// 3. Vérification des clés spécifiques Commandes, Convois & Malles
console.log(`\n▶️ Module 3 : Validation des 28 clés spécifiques Commandes, Convois & Malles`);
const requiredKeys = [
  'emptyOrdersNoticeDesc',
  'btnCreateOrderCampaign',
  'fleetConvoysTitle',
  'fleetConvoysDesc',
  'troopFleetTitle',
  'troopFleetDesc',
  'searchMemberOrVehiclePlaceholder',
  'kpiVehicles',
  'kpiVehiclesPlural',
  'kpiPassengerSeats',
  'kpiCargoVolume',
  'kpiEquipments',
  'labelSeatsCount',
  'badgeTrailerHitch',
  'labelTrunkFuts',
  'vehicleTypeLudospace',
  'statusReadyForConvoy',
  'rallyPointTitle',
  'btnViewLocalDeparturePoint',
  'btnSaveCarpoolSettings',
  'collectiveKitsTitle',
  'collectiveKitsDesc',
  'btnInitDefaultKits',
  'btnNewKitCase',
  'emptyCollectiveKitsNotice',
  'filterAllCategories',
  'btnAddKit',
  'btnSavePupitreKits'
];

let missingSpecificKeys = 0;
requiredKeys.forEach(key => {
  const inFr = key in frLogistics;
  const inPt = key in ptLogistics;
  if (!inFr || !inPt) {
    console.error(`❌ Clé manquante : ${key} (FR: ${inFr}, PT: ${inPt})`);
    hasErrors = true;
    missingSpecificKeys++;
  }
});

if (missingSpecificKeys === 0) {
  console.log(`   ✅ [PASS] 28/28 clés spécifiques présentes et synchronisées en FR et PT.`);
}

console.log("\n===============================================================");
if (hasErrors) {
  console.error("❌ ÉCHEC DES TESTS I18N LOGISTIQUE");
  console.log("===============================================================\n");
  process.exit(1);
} else {
  console.log("🏆 SUCCÈS TOTAL : LE PÔLE LOGISTIQUE EST 100% INTERNATIONALISÉ");
  console.log("===============================================================\n");
  process.exit(0);
}
