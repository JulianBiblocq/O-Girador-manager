/**
 * Test de parité et validation i18n — Pôle Pédagogie (Lot 2 : Carnet d'Aisance, Défis Réflexes & Progression)
 * Vérifie :
 * 1. La présence des 4 sous-namespaces sous `pedagogy` (carnet, reflex, progress, cards)
 * 2. La stricte parité 1:1 entre `fr.js` et `pt.js` (0 clé orpheline)
 * 3. L'absence de valeur vide
 * 4. La validation des 35 composants cibles du Lot 2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Lancement du test unitaire i18n — Pôle Pédagogie (Lot 2)...\n');

const subNamespaces = ['carnet', 'reflex', 'progress', 'cards'];
let totalChecked = 0;
let errors = [];

// 1. Contrôle de parité 1:1 absolue FR / PT
for (const sub of subNamespaces) {
  const frSub = fr.pedagogy?.[sub];
  const ptSub = pt.pedagogy?.[sub];

  if (!frSub) {
    errors.push(`Sous-namespace manquant dans fr.js: pedagogy.${sub}`);
    continue;
  }
  if (!ptSub) {
    errors.push(`Sous-namespace manquant dans pt.js: pedagogy.${sub}`);
    continue;
  }

  const frKeys = Object.keys(frSub);
  const ptKeys = Object.keys(ptSub);

  console.log(`  🔍 Vérification sous-namespace pedagogy.${sub} (${frKeys.length} clés)...`);

  for (const k of frKeys) {
    totalChecked++;
    if (!(k in ptSub)) {
      errors.push(`Clé orpheline dans fr.js (absente de pt.js) : pedagogy.${sub}.${k}`);
    } else {
      if (typeof frSub[k] !== 'string' || frSub[k].trim() === '') {
        errors.push(`Valeur vide ou non textuelle dans fr.js : pedagogy.${sub}.${k}`);
      }
      if (typeof ptSub[k] !== 'string' || ptSub[k].trim() === '') {
        errors.push(`Valeur vide ou non textuelle dans pt.js : pedagogy.${sub}.${k}`);
      }
    }
  }

  for (const k of ptKeys) {
    if (!(k in frSub)) {
      errors.push(`Clé orpheline dans pt.js (absente de fr.js) : pedagogy.${sub}.${k}`);
    }
  }
}

// 2. Contrôle de présence des 35 fichiers cibles
const targetFiles = [
  'src/components/pedagogy/MonCarnetAisance.jsx',
  'src/components/pedagogy/CarnetPercussionSection.jsx',
  'src/components/pedagogy/DefisSummaryCard.jsx',
  'src/components/pedagogy/TrainingCompactCard.jsx',
  'src/components/pedagogy/EntrainementMacroAnalytics.jsx',
  'src/components/pedagogy/EntrainementSegmentsBar.jsx',
  'src/components/pedagogy/ReflexGameModal.jsx',
  'src/components/pedagogy/reflex/ReflexGameBoard.jsx',
  'src/components/pedagogy/reflex/ReflexSignalBanner.jsx',
  'src/components/pedagogy/SignauxTrialModal.jsx',
  'src/components/pedagogy/ConductorGameModal.jsx',
  'src/components/pedagogy/conductor/ConductorAudioPlayer.jsx',
  'src/components/pedagogy/conductor/ConductorMeasureSlot.jsx',
  'src/components/pedagogy/conductor/ConductorSignalPickerSheet.jsx',
  'src/components/pedagogy/conductor/ConductorTimeline.jsx',
  'src/components/pedagogy/QcmSignaux.jsx',
  'src/components/pedagogy/AutoEvalQuiz.jsx',
  'src/components/pedagogy/MestreToadasAnalytics.jsx',
  'src/components/pedagogy/DanseChoregraphieAnalytics.jsx',
  'src/components/pedagogy/DanseItemRow.jsx',
  'src/components/pedagogy/PercussionPieceRow.jsx',
  'src/components/pedagogy/PercussionRepertoireAnalytics.jsx',
  'src/components/pedagogy/ToadasTable.jsx',
  'src/components/pedagogy/CultureFichesTable.jsx',
  'src/components/pedagogy/MestreQuizConfigManager.jsx',
  'src/components/pedagogy/QuizDistractorManager.jsx',
  'src/components/pedagogy/RodaQuizStatsBanner.jsx',
  'src/components/pedagogy/BlindTestTrialModal.jsx',
  'src/components/SongCard.jsx',
  'src/components/CultureCard.jsx',
  'src/components/pedagogy/AtelierModelPartsProgress.jsx',
  'src/components/pedagogy/MonParcoursGuideBanner.jsx',
  'src/components/pedagogy/PedagogyDocumentsView.jsx',
  'src/components/pedagogy/DailyRevisionSession.jsx',
  'src/components/pedagogy/MestreSignalsManager.jsx'
];

console.log(`\n  🔍 Vérification de la présence des ${targetFiles.length} fichiers cibles du Lot 2...`);
for (const f of targetFiles) {
  if (!fs.existsSync(path.resolve(rootDir, f))) {
    errors.push(`Fichier cible introuvable : ${f}`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ Erreurs détectées :');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log(`\n✅ Succès total ! ${totalChecked} clés bilingues vérifiées (parité 1:1, 0 orpheline).`);
  console.log(`✅ Les ${targetFiles.length} fichiers cibles du Lot 2 sont présents !\n`);
  process.exit(0);
}
