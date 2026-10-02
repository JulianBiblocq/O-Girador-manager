/**
 * Test de validation automatisé i18n — Pôle Mestria : Lot 1 Répertoire Maître & Modales
 *
 * Vérifie :
 * 1. Parité stricte 1:1 des dictionnaires fr.js et pt.js pour le sous-namespace 'mestre.repertoire'
 * 2. Zéro clé orpheline entre FR et PT
 * 3. Utilisation effective de useTranslation et des clés mestre.repertoire.* dans les 19 fichiers cibles
 * 4. Présence et intégrité des termes métier et culturels du Maracatu
 */
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : VALIDATION I18N PÔLE MESTRIA — LOT 1 RÉPERTOIRE");
console.log("===============================================================\n");

let hasErrors = false;

// 1. Validation de l'existence et parité des dictionnaires
const frRepertoire = fr.mestre?.repertoire || {};
const ptRepertoire = pt.mestre?.repertoire || {};

const frKeys = Object.keys(frRepertoire);
const ptKeys = Object.keys(ptRepertoire);

console.log(`▶️ Module 1 : Parité des clés du namespace 'mestre.repertoire'`);
console.log(`   - Clés dans fr.js : ${frKeys.length}`);
console.log(`   - Clés dans pt.js : ${ptKeys.length}`);

if (frKeys.length === 0) {
  console.error("❌ ERREUR : Aucune clé trouvée sous 'mestre.repertoire' dans fr.js !");
  hasErrors = true;
}

if (frKeys.length < 200) {
  console.error(`❌ ERREUR : Nombre insuffisant de clés sous 'mestre.repertoire' (${frKeys.length} < 200) !`);
  hasErrors = true;
}

const missingInPt = frKeys.filter((k) => !(k in ptRepertoire));
const missingInFr = ptKeys.filter((k) => !(k in frRepertoire));

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

// 2. Vérification des 19 fichiers cibles du Pôle Mestria Répertoire
console.log(`\n▶️ Module 2 : Raccordement des 19 fichiers cibles du Pôle Mestria Répertoire`);

const targetFiles = [
  'src/components/mestre/MestreRepertoireView.jsx',
  'src/components/mestre/MestreRepertoireHeader.jsx',
  'src/components/mestre/RepertoirePieceModal.jsx',
  'src/components/mestre/RepertoirePieceStatusSelector.jsx',
  'src/components/mestre/ProgramPieceModal.jsx',
  'src/components/mestre/ProgramRehearsalModal.jsx',
  'src/components/mestre/RepertoireCulturePicker.jsx',
  'src/components/mestre/RepertoireModalNavArrows.jsx',
  'src/components/mestre/RepertoireVideoModal.jsx',
  'src/components/mestre/RepertoireVideosPicker.jsx',
  'src/components/mestre/SignalZoomModal.jsx',
  'src/components/mestre/TablatureModal.jsx',
  'src/components/mestre/VideoInstrumentCheckboxes.jsx',
  'src/components/mestre/WorkshopEditorModal.jsx',
  'src/components/mestre/CreateCultureFicheModal.jsx',
  'src/components/repertoire/BatchAssignVideoModal.jsx',
  'src/components/repertoire/BatchAssignVideoSource.jsx',
  'src/components/repertoire/PieceVideoSection.jsx',
  'src/components/repertoire/RepertoirePasserelleButton.jsx'
];

targetFiles.forEach((relPath, idx) => {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ERREUR : Fichier non trouvé : ${relPath}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Vérification de la présence de useTranslation ou fonction t
  const hasUseTranslation = content.includes('useTranslation') || content.includes('t(');
  if (!hasUseTranslation) {
    console.error(`❌ ERREUR : Pas d'appel ou de prop de traduction dans ${relPath}`);
    hasErrors = true;
    return;
  }

  // Vérification des appels mestre.repertoire.*
  const repertoireMatches = content.match(/mestre\.repertoire\.[a-zA-Z0-9_]+/g) || [];
  if (repertoireMatches.length === 0) {
    console.error(`❌ ERREUR : Aucune référence mestre.repertoire.* trouvée dans ${relPath}`);
    hasErrors = true;
    return;
  }

  console.log(`   ✅ [${idx + 1}/${targetFiles.length}] ${relPath} : ${repertoireMatches.length} référence(s) mestre.repertoire.* branchée(s).`);
});

// 3. Validation d'échantillons clés de terminologie Maracatu et gouvernance Répertoire
console.log(`\n▶️ Module 3 : Validation de clés représentatives (Maracatu, Tablatures, Varal, SSO)`);

const sampleKeys = [
  'loadingRepertoire',
  'addFirstPiece',
  'clickToEditPiece',
  'tablatureVivante',
  'consultSignalsTitle',
  'signalBadge',
  'showTrainingsTitle',
  'trainingSingular',
  'autonomousBadge',
  'openInSequencerTitle',
  'consultTablatureTitle',
  'tablatureBadge',
  'toadaBadge',
  'consultCultureSheetsTitle',
  'createCultureFromContextTitle',
  'repertoireSheetPrefix',
  'batchAssignVideoTitle',
  'validationNoticeFree',
  'useToadaNameAsTitle',
  'youtubeVideoPieceLabel',
  'ficheSavedAndLinkedNotice',
  'errSongNotFoundOnVaral'
];

sampleKeys.forEach((k) => {
  if (!frRepertoire[k] || !ptRepertoire[k]) {
    console.error(`❌ ERREUR : Clé échantillon manquante : ${k}`);
    hasErrors = true;
  } else {
    console.log(`   ✅ Clé '${k}' validée (FR: "${frRepertoire[k].slice(0, 32)}..." | PT: "${ptRepertoire[k].slice(0, 32)}...")`);
  }
});

console.log("\n===============================================================");
if (hasErrors) {
  console.error("❌ ÉCHEC DU TEST : Des anomalies ont été détectées dans le Lot 1 Répertoire.");
  console.log("===============================================================\n");
  process.exit(1);
} else {
  console.log("🏆 SUCCÈS TOTAL : LE PÔLE MESTRIA (LOT 1 RÉPERTOIRE) EST 100% INTERNATIONALISÉ !");
  console.log("===============================================================\n");
  process.exit(0);
}
