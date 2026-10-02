/**
 * Test de validation automatisé i18n — Pôle Mestria : Lot 2 (Casting, Scène, Signes, Mot du Mestre & Évaluations)
 *
 * Vérifie :
 * 1. Parité stricte 1:1 des dictionnaires fr.js et pt.js pour les sous-namespaces de Mestre Lot 2 :
 *    - mestre.sequenceur
 *    - mestre.stageLayout
 *    - mestre.editorial
 *    - mestre.casting
 *    - mestre.pedagogy
 * 2. Zéro clé orpheline entre FR et PT
 * 3. Utilisation effective de useTranslation et des clés mestre.* dans les 14 fichiers cibles
 * 4. Présence et intégrité des termes métier et pédagogiques du Maracatu
 */
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("==========================================================================================");
console.log("🧪 DÉBUT DU TEST : VALIDATION I18N PÔLE MESTRIA — LOT 2 (CASTING, SCÈNE, SIGNES & PÉDAGOGIE)");
console.log("==========================================================================================\n");

let hasErrors = false;

// 1. Validation de l'existence et parité des 5 sous-namespaces du Lot 2
const subNamespaces = ['sequenceur', 'stageLayout', 'editorial', 'casting', 'pedagogy'];

subNamespaces.forEach((ns) => {
  const frSub = fr.mestre?.[ns] || {};
  const ptSub = pt.mestre?.[ns] || {};

  const frKeys = Object.keys(frSub);
  const ptKeys = Object.keys(ptSub);

  console.log(`▶️ Validation du sous-namespace 'mestre.${ns}'`);
  console.log(`   - Clés dans fr.js : ${frKeys.length}`);
  console.log(`   - Clés dans pt.js : ${ptKeys.length}`);

  if (frKeys.length === 0) {
    console.error(`❌ ERREUR : Aucune clé trouvée sous 'mestre.${ns}' dans fr.js !`);
    hasErrors = true;
  }

  const missingInPt = frKeys.filter((k) => !(k in ptSub));
  const missingInFr = ptKeys.filter((k) => !(k in frSub));

  if (missingInPt.length > 0) {
    console.error(`❌ ERREUR : ${missingInPt.length} clé(s) présente(s) en FR mais manquante(s) en PT dans 'mestre.${ns}' :`, missingInPt);
    hasErrors = true;
  } else {
    console.log(`   ✅ [PASS] 0 clé orpheline FR -> PT dans 'mestre.${ns}'.`);
  }

  if (missingInFr.length > 0) {
    console.error(`❌ ERREUR : ${missingInFr.length} clé(s) présente(s) en PT mais manquante(s) en FR dans 'mestre.${ns}' :`, missingInFr);
    hasErrors = true;
  } else {
    console.log(`   ✅ [PASS] 0 clé orpheline PT -> FR dans 'mestre.${ns}'.`);
  }
});

// 1.bis Validation des clés chirurgicales directes sous mestre.*
const mestreDirectKeys = [
  'btnTogglePresetsShow', 'btnTogglePresetsHide',
  'statusInSeason', 'statusReady',
  'btnOpenPreset', 'btnSynchronize', 'btnLinkSequenceur',
  'conductorRoleMestre', 'mestrePositionDesc', 'stageAreaFrontDance', 'btnPlaceCell',
  'danceRowAligned', 'rowAligned', 'rowStaggered',
  'btnSaveAndPublish'
];

console.log(`\n▶️ Validation des ${mestreDirectKeys.length} clés chirurgicales directes 'mestre.*'`);
mestreDirectKeys.forEach((k) => {
  const valFr = fr.mestre?.[k];
  const valPt = pt.mestre?.[k];
  if (!valFr || !valPt) {
    console.error(`❌ ERREUR : Clé mestre.${k} manquante (FR: ${Boolean(valFr)}, PT: ${Boolean(valPt)})`);
    hasErrors = true;
  } else {
    console.log(`   ✅ Clé 'mestre.${k}' validée (FR: "${valFr}" | PT: "${valPt}")`);
  }
});

// 2. Vérification du raccordement des 14 fichiers cibles du Pôle Mestria Lot 2
console.log(`\n▶️ Module 2 : Raccordement des 14 fichiers cibles du Pôle Mestria Lot 2`);

const targetFiles = [
  // 1. Orientation, Casting & Disciplines (3 fichiers)
  'src/components/mestre/MestreOrientationCasting.jsx',
  'src/components/mestre/MestreCustomCategories.jsx',
  'src/components/mestre/CategoryCardItem.jsx',

  // 2. Régie Scénique & Plateau (2 fichiers)
  'src/components/mestre/MestreStageLayout.jsx',
  'src/components/event-details/EventStageLayoutSection.jsx',

  // 3. Passerelle Séquenceur, Presets & Signes (4 fichiers)
  'src/components/mestre/RepertoireUnlinkedPresetsBanner.jsx',
  'src/components/mestre/RepertoireTrainingsManager.jsx',
  'src/components/mestre/RepertoireSinaisDoMestreEditor.jsx',
  'src/components/mestre/reflex/SignalReflexCard.jsx',

  // 4. Consignes Artistiques & Mot du Mestre (1 fichier)
  'src/components/mestre/MestreMotMestre.jsx',

  // 5. Pédagogie & Évaluations du Mestre (4 fichiers)
  'src/components/mestre/MestrePedagogyDashboard.jsx',
  'src/components/mestre/MestrePedagogyNotepad.jsx',
  'src/components/mestre/MestreAutoEvalConfig.jsx',
  'src/components/mestre/CustomQuizConfigPanel.jsx'
];

targetFiles.forEach((relPath, idx) => {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ERREUR : Fichier non trouvé : ${relPath}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Vérification de useTranslation ou fonction t
  const hasUseTranslation = content.includes('useTranslation') || content.includes('t(');
  if (!hasUseTranslation) {
    console.error(`❌ ERREUR : Pas d'appel ou d'instanciation de traduction dans ${relPath}`);
    hasErrors = true;
    return;
  }

  // Vérification de références mestre.*
  const mestreMatches = content.match(/mestre\.(sequenceur|stageLayout|editorial|casting|pedagogy)\.[a-zA-Z0-9_]+/g) || [];
  if (mestreMatches.length === 0) {
    console.error(`❌ ERREUR : Aucune référence mestre.* trouvée dans ${relPath}`);
    hasErrors = true;
    return;
  }

  console.log(`   ✅ [${idx + 1}/${targetFiles.length}] ${relPath} : ${mestreMatches.length} référence(s) mestre.* branchée(s).`);
});

// 3. Validation d'échantillons clés de terminologie Maracatu, régie et pédagogie
console.log(`\n▶️ Module 3 : Validation de clés représentatives (Signes, Scène, Casting, Pédagogie)`);

const sampleChecks = [
  { ns: 'sequenceur', key: 'trainingsLinkedHeading', frSample: 'Entraînements rattachés au morceau' },
  { ns: 'sequenceur', key: 'mestreSignalsLinkedHeading', frSample: 'Signes du Mestre' },
  { ns: 'stageLayout', key: 'headerTitle', frSample: 'Plans de Scène & Cortejo' },
  { ns: 'stageLayout', key: 'alertDancersOnlyFrontStage', frSample: 'Avant-Scène' },
  { ns: 'editorial', key: 'manageHeading', frSample: 'Mot du Mestre' },
  { ns: 'editorial', key: 'motMestreUpdateSuccess', frSample: 'succès' },
  { ns: 'casting', key: 'orientationCastingTitle', frSample: 'Orientation, Casting & Pupitres' },
  { ns: 'casting', key: 'customCategoriesTitle', frSample: 'Catégories & Niveaux de Pratique' },
  { ns: 'casting', key: 'btnValidateSave', frSample: 'Valider' },
  { ns: 'pedagogy', key: 'autoEvalHeading', frSample: 'Auto-Évaluation' },
  { ns: 'pedagogy', key: 'hotspotsAriaLabel', frSample: 'Points chauds' },
  { ns: 'pedagogy', key: 'allEvalsResetSuccess', frSample: 'remises à zéro' }
];

sampleChecks.forEach(({ ns, key, frSample }) => {
  const frVal = fr.mestre?.[ns]?.[key];
  const ptVal = pt.mestre?.[ns]?.[key];

  if (!frVal || !ptVal) {
    console.error(`❌ ERREUR : Clé échantillon manquante : mestre.${ns}.${key}`);
    hasErrors = true;
  } else if (!frVal.includes(frSample)) {
    console.error(`❌ ERREUR : Le texte FR pour 'mestre.${ns}.${key}' ne contient pas '${frSample}' (obtenu: '${frVal}')`);
    hasErrors = true;
  } else {
    console.log(`   ✅ Clé 'mestre.${ns}.${key}' validée (FR: "${frVal.slice(0, 32)}..." | PT: "${ptVal.slice(0, 32)}...")`);
  }
});

console.log("\n==========================================================================================");
if (hasErrors) {
  console.error("❌ ÉCHEC DU TEST : Des anomalies ont été détectées dans le Lot 2 Pôle Mestria.");
  console.log("==========================================================================================\n");
  process.exit(1);
} else {
  console.log("🏆 SUCCÈS TOTAL : LE PÔLE MESTRIA (LOT 2 : CASTING, SCÈNE, SIGNES & PÉDAGOGIE) EST 100% INTERNATIONALISÉ !");
  console.log("==========================================================================================\n");
  process.exit(0);
}
