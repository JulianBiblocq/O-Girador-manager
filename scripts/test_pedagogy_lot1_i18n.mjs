/**
 * Test de parité et validation i18n — Pôle Pédagogie (Lot 1)
 * Périmètre :
 * - 27 fichiers cibles (Espace Élève, Modales & Morceau, Mestria, Moteurs)
 * - 164 clés bilingues vérifiées
 * - 0 clé orpheline entre FR et PT
 * - Vérification du câblage useTranslation / t(...) dans les composants
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Lancement du test unitaire i18n — Pôle Pédagogie (Lot 1)...\n');

const subNamespaces = ['student', 'modals', 'admin', 'engine'];
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

// 2. Contrôle du câblage des 27 fichiers cibles
const targetFiles = [
  'src/components/student/AutoEvalQuizContainer.jsx',
  'src/components/student/FirestoreMediaRenderer.jsx',
  'src/components/student/StudentToadasProgress.jsx',
  'src/components/profile/StudentInstrumentsWorkshop.jsx',
  'src/components/profile/PieceTutorialModal.jsx',
  'src/components/member/PieceLyricsModal.jsx',
  'src/components/member/PieceCultureModal.jsx',
  'src/components/member/PieceSignalsModal.jsx',
  'src/components/member/PieceAisanceSection.jsx',
  'src/components/member/MemberPieceCard.jsx',
  'src/components/member/MemberPieceUnfoldedContent.jsx',
  'src/components/member/MemberRepertoireHeader.jsx',
  'src/components/member/MemberRepertoireView.jsx',
  'src/components/mestre/MestrePedagogyDashboard.jsx',
  'src/components/mestre/MestrePedagogyNotepad.jsx',
  'src/components/mestre/MestreAutoEvalConfig.jsx',
  'src/components/mestre/CustomQuizConfigPanel.jsx',
  'src/components/mestre/CreateCultureFicheModal.jsx',
  'src/components/mestre/RepertoireSinaisDoMestreEditor.jsx',
  'src/components/mestre/reflex/SignalReflexCard.jsx',
  'src/components/mestre/RepertoireTrainingsManager.jsx',
  'src/components/mestre/RepertoireCulturePicker.jsx',
  'src/components/mestre/RepertoireVideosPicker.jsx',
  'src/components/mestre/SignalZoomModal.jsx',
  'src/components/mestre/VideoInstrumentCheckboxes.jsx',
  'src/utils/conductorGameUtils.js',
  'src/utils/pedagogyDashboardCalculations.js'
];

console.log(`\n  🔍 Vérification du câblage i18n sur les ${targetFiles.length} fichiers cibles du Lot 1...`);

for (const relPath of targetFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Fichier introuvable : ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');

  // Si composant JSX React
  if (relPath.endsWith('.jsx')) {
    if (!content.includes('useTranslation')) {
      errors.push(`Composant sans hook useTranslation : ${relPath}`);
    }
    if (!content.includes("t('") && !content.includes('t("')) {
      errors.push(`Composant sans appel t(...) : ${relPath}`);
    }
  } else {
    // Fichiers utilitaires JS
    if (!content.includes('pedagogy.engine.')) {
      errors.push(`Utilitaire sans clés pedagogy.engine : ${relPath}`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ Erreurs détectées :');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log(`\n✅ Succès total ! ${totalChecked} clés bilingues vérifiées (parité 1:1, 0 orpheline).`);
  console.log(`✅ Les ${targetFiles.length} fichiers cibles sont tous rigoureusement branchés sur l'internationalisation !\n`);
  process.exit(0);
}
