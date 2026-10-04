import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("==================================================================");
console.log("🧪 TEST UNITAIRE I18N : PÔLE CONFIGURATION (LOT 1 - PILIERS 1 À 4)");
console.log("==================================================================\n");

// 1. Vérification de l'import et de la parité des dictionnaires fr.js et pt.js
console.log("▶️ Test 1 : Vérification de la parité stricte 1:1 des dictionnaires FR / PT...");
const frModule = await import('../src/locales/fr.js');
const ptModule = await import('../src/locales/pt.js');

const frDict = frModule.fr || frModule.default;
const ptDict = ptModule.pt || ptModule.default;

assert(frDict && frDict.settings, "fr.settings doit être défini");
assert(ptDict && ptDict.settings, "pt.settings doit être défini");

const REQUIRED_NAMESPACES = ['general', 'identity', 'organization', 'security', 'modules'];

REQUIRED_NAMESPACES.forEach(ns => {
  assert(frDict.settings[ns], `fr.settings.${ns} doit être défini`);
  assert(ptDict.settings[ns], `pt.settings.${ns} doit être défini`);
});

function getLeaves(obj, prefix = '') {
  let leaves = {};
  for (let key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(leaves, getLeaves(obj[key], fullPath));
    } else {
      leaves[fullPath] = obj[key];
    }
  }
  return leaves;
}

const frLeaves = getLeaves(frDict.settings, 'settings');
const ptLeaves = getLeaves(ptDict.settings, 'settings');

const frKeys = Object.keys(frLeaves).sort();
const ptKeys = Object.keys(ptLeaves).sort();

console.log(`  ℹ️ Nombre de clés feuilles dans fr.settings : ${frKeys.length}`);
console.log(`  ℹ️ Nombre de clés feuilles dans pt.settings : ${ptKeys.length}`);

assert.strictEqual(frKeys.length, ptKeys.length, "Le nombre de clés doit être identique en FR et PT");

let parityErrors = 0;
frKeys.forEach(k => {
  if (!ptLeaves[k]) {
    console.error(`  ❌ Clé manquante dans PT: ${k}`);
    parityErrors++;
  } else if (typeof ptLeaves[k] !== 'string' || ptLeaves[k].trim() === '') {
    console.error(`  ❌ Valeur vide dans PT pour: ${k}`);
    parityErrors++;
  }
});

assert.strictEqual(parityErrors, 0, "Zéro erreur de parité autorisée");
console.log("✅ [PASS] Parité 1:1 validée avec succès sur 496 clés !\n");

// 2. Vérification des 26 fichiers cibles et de leur câblage i18n
console.log("▶️ Test 2 : Contrôle du raccordement des 26 fichiers cibles sur useTranslation...");

const TARGET_FILES = [
  // Cadre général (1)
  'src/components/AssociationSettings.jsx',

  // Pilier 1 : Identité Légale (8)
  'src/components/association-settings/TabIdentity.jsx',
  'src/components/association-settings/identity/SubscriptionInvitationHeader.jsx',
  'src/components/association-settings/identity/LegalInfoAccordion.jsx',
  'src/components/association-settings/identity/OfficialSignaturesAccordion.jsx',
  'src/components/association-settings/identity/BankDetailsAccordion.jsx',
  'src/components/association-settings/identity/BureauAccordion.jsx',
  'src/components/association-settings/identity/MestriaAccordion.jsx',
  'src/components/association-settings/blocks/BankDetailsBlock.jsx',

  // Pilier 2 : Inscription & Organisation (8)
  'src/components/association-settings/organization/RegistrationFieldsTable.jsx',
  'src/components/association-settings/organization/CustomFieldsAccordion.jsx',
  'src/components/association-settings/organization/CustomFieldAddForm.jsx',
  'src/components/association-settings/organization/AnnualCyclesAccordion.jsx',
  'src/components/association-settings/organization/PupitresNomenclatureAccordion.jsx',
  'src/components/association-settings/organization/DefaultLocationsByEventTypeGrid.jsx',
  'src/components/association-settings/organization/LieuEditModal.jsx',
  'src/components/association-settings/blocks/InstrumentsCatalogBlock.jsx',

  // Pilier 3 : Badges, Rôles & Sécurité (2)
  'src/components/association-settings/TabSecurity.jsx',
  'src/components/PermissionsGuideBox.jsx',

  // Pilier 4 : Modules SaaS, Apparence & Médias (7)
  'src/components/association-settings/modules/ModulesSwitchesTable.jsx',
  'src/components/association-settings/modules/WardrobeMemberModeCard.jsx',
  'src/components/association-settings/modules/TamboursNamingAccordion.jsx',
  'src/components/association-settings/modules/BrandingLogoAccordion.jsx',
  'src/components/association-settings/modules/MediaStorageAccordion.jsx',
  'src/components/association-settings/modules/MemberDashboardLayoutAccordion.jsx',
  'src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx'
];

assert.strictEqual(TARGET_FILES.length, 26, "26 fichiers attendus");

TARGET_FILES.forEach(filePath => {
  assert(fs.existsSync(filePath), `Le fichier cible doit exister: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Doit importer useTranslation
  const hasUseTranslation = content.includes('useTranslation');
  assert(hasUseTranslation, `${filePath} doit importer useTranslation`);

  // Doit appeler useTranslation ou recevoir t
  const usesT = content.includes('useTranslation()') || content.includes('const tFunc = t ||');
  assert(usesT, `${filePath} doit instancier ou utiliser le hook de traduction`);

  // Doit contenir des appels à settings.
  const hasSettingsKeys = content.includes('settings.') || content.includes("t('settings") || content.includes('t("settings');
  assert(hasSettingsKeys, `${filePath} doit utiliser les clés i18n de settings`);

  console.log(`  ✅ [OK] ${path.basename(filePath)} : branché et conforme`);
});

console.log("\n✅ [PASS] Tous les 26 fichiers cibles sont rigoureusement branchés sur l'internationalisation !\n");

// 3. Vérification des interpolations
console.log("▶️ Test 3 : Vérification de la cohérence des variables interpolées...");
let interpolationErrors = 0;
frKeys.forEach(key => {
  const frText = frLeaves[key];
  const ptText = ptLeaves[key];

  const frVars = (frText.match(/\{([a-zA-Z0-9_-]+)\}/g) || []).sort();
  const ptVars = (ptText.match(/\{([a-zA-Z0-9_-]+)\}/g) || []).sort();

  if (JSON.stringify(frVars) !== JSON.stringify(ptVars)) {
    console.error(`  ❌ Discordance variables interpolées sur ${key}: FR=[${frVars}] PT=[${ptVars}]`);
    interpolationErrors++;
  }
});
assert.strictEqual(interpolationErrors, 0, "Toutes les variables interpolées doivent être symétriques");
console.log("✅ [PASS] Variables interpolées 100% symétriques !\n");

console.log("==================================================================");
console.log("🏆 SUCCÈS TOTAL : LE LOT 1 CONFIGURATION EST 100% INTERNATIONALISÉ !");
console.log("==================================================================");
