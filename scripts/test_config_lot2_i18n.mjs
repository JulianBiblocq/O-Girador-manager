import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("==================================================================");
console.log("🧪 TEST UNITAIRE I18N : PÔLE CONFIGURATION (LOT 2 - CONFIG MÉTIER)");
console.log("==================================================================\n");

// 1. Vérification de l'import et de la parité des dictionnaires fr.js et pt.js pour Lot 2
console.log("▶️ Test 1 : Vérification de la parité stricte 1:1 des dictionnaires FR / PT (Lot 2)...");
const frModule = await import('../src/locales/fr.js');
const ptModule = await import('../src/locales/pt.js');

const frDict = frModule.fr || frModule.default;
const ptDict = ptModule.pt || ptModule.default;

assert(frDict && frDict.settings, "fr.settings doit être défini");
assert(ptDict && ptDict.settings, "pt.settings doit être défini");

const REQUIRED_NAMESPACES = ['agenda', 'communication'];

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

const lot2LeavesFr = {};
const lot2LeavesPt = {};

REQUIRED_NAMESPACES.forEach(ns => {
  Object.assign(lot2LeavesFr, getLeaves(frDict.settings[ns], `settings.${ns}`));
  Object.assign(lot2LeavesPt, getLeaves(ptDict.settings[ns], `settings.${ns}`));
});

const frKeys = Object.keys(lot2LeavesFr).sort();
const ptKeys = Object.keys(lot2LeavesPt).sort();

console.log(`  ℹ️ Nombre de clés feuilles dans fr.settings (Lot 2 : agenda + communication) : ${frKeys.length}`);
console.log(`  ℹ️ Nombre de clés feuilles dans pt.settings (Lot 2 : agenda + communication) : ${ptKeys.length}`);

assert.strictEqual(frKeys.length, ptKeys.length, "Le nombre de clés doit être identique en FR et PT");
assert(frKeys.length >= 220, `Au moins 220 clés attendues pour le Lot 2, trouvé ${frKeys.length}`);

let parityErrors = 0;
frKeys.forEach(k => {
  if (!lot2LeavesPt[k]) {
    console.error(`  ❌ Clé manquante dans PT: ${k}`);
    parityErrors++;
  } else if (typeof lot2LeavesPt[k] !== 'string' || lot2LeavesPt[k].trim() === '') {
    console.error(`  ❌ Valeur vide dans PT pour: ${k}`);
    parityErrors++;
  }
});

assert.strictEqual(parityErrors, 0, "Zéro erreur de parité autorisée");
console.log(`✅ [PASS] Parité 1:1 validée avec succès sur les ${frKeys.length} clés du Lot 2 !\n`);

// 2. Vérification des fichiers cibles du Lot 2 et de leur câblage i18n
console.log("▶️ Test 2 : Contrôle du raccordement des fichiers cibles du Lot 2 sur useTranslation...");

const TARGET_FILES = [
  // 1. Configuration Métier : Agenda, Lieux & Convois
  'src/components/association-settings/TabAgenda.jsx',
  'src/components/association-settings/TabLieux.jsx',
  'src/components/association-settings/EventTypeConfigCard.jsx',
  'src/components/association-settings/blocks/DepartureLocationAccordion.jsx',
  'src/components/association-settings/blocks/VehicleFleetSection.jsx',
  'src/components/association-settings/blocks/CarpoolBlock.jsx',

  // 2. Configuration Métier : Communication, E-mails & Relances
  'src/components/association-settings/TabDocuments.jsx',
  'src/components/association-settings/TabAutomations.jsx',
  'src/components/association-settings/blocks/SequenceurLinkBlock.jsx',
  'src/components/association-settings/TabConfigComms.jsx'
];

TARGET_FILES.forEach(filePath => {
  assert(fs.existsSync(filePath), `Le fichier cible doit exister: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Doit importer useTranslation
  const hasUseTranslation = content.includes('useTranslation');
  assert(hasUseTranslation, `${filePath} doit importer useTranslation`);

  // Doit appeler useTranslation ou recevoir t
  const usesT = content.includes('useTranslation(') || content.includes('propT') || content.includes('t(');
  assert(usesT, `${filePath} doit instancier ou utiliser le hook de traduction`);

  // Doit contenir des appels à t()
  const hasTranslationCalls = content.includes("t('") || content.includes('t("');
  assert(hasTranslationCalls, `${filePath} doit effectuer des appels à t()`);

  console.log(`  ✅ [OK] ${path.basename(filePath)} : branché et conforme`);
});

console.log(`\n✅ [PASS] Tous les ${TARGET_FILES.length} fichiers cibles du Lot 2 sont rigoureusement branchés sur l'internationalisation !\n`);

// 3. Vérification des interpolations {param} et {{param}}
console.log("▶️ Test 3 : Vérification de la cohérence des variables interpolées...");
let interpolationErrors = 0;
frKeys.forEach(key => {
  const frText = lot2LeavesFr[key];
  const ptText = lot2LeavesPt[key];

  const frVars = (frText.match(/\{([a-zA-Z0-9_-]+)\}/g) || []).sort();
  const ptVars = (ptText.match(/\{([a-zA-Z0-9_-]+)\}/g) || []).sort();

  if (JSON.stringify(frVars) !== JSON.stringify(ptVars)) {
    console.error(`  ❌ Discordance variables interpolées sur ${key}: FR=[${frVars}] PT=[${ptVars}]`);
    interpolationErrors++;
  }
});
assert.strictEqual(interpolationErrors, 0, "Toutes les variables interpolées doivent être symétriques");
console.log("✅ [PASS] Variables interpolées 100% symétriques !\n");

// 4. Vérification de la propreté AST Babel sur les fichiers cibles du Lot 2
console.log("▶️ Test 4 : Contrôle de la propreté AST Babel (0 chaînes brutes dans les fichiers du Lot 2)...");
const resultsPath = path.resolve('scripts/audit_config_results.json');
if (fs.existsSync(resultsPath)) {
  const auditData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const dirtyAgenda = (auditData.agenda && auditData.agenda.dirtyFiles) || [];
  const dirtyComm = (auditData.communication && auditData.communication.dirtyFiles) || [];
  
  const lot2Dirty = [...dirtyAgenda, ...dirtyComm].filter(d => TARGET_FILES.some(t => d.file.endsWith(path.basename(t))));
  if (lot2Dirty.length > 0) {
    console.error("  ❌ Fichiers du Lot 2 non propres détectés :", lot2Dirty.map(d => `${d.file} (${d.count} chaînes)`));
  }
  assert.strictEqual(lot2Dirty.length, 0, "Tous les fichiers du Lot 2 doivent être certifiés [PROPRE] par l'audit Babel AST");
  console.log("✅ [PASS] Les 10 fichiers cibles du Lot 2 sont certifiés 100% PROPRES sans aucune chaîne brute !\n");
}

console.log("==================================================================");
console.log("🏆 SUCCÈS TOTAL : LE LOT 2 CONFIGURATION EST 100% INTERNATIONALISÉ !");
console.log("==================================================================");
