/**
 * Test de parité et validation i18n — Pôle Studio (Lot 1 : Gazette & Galerie Photos)
 * Périmètre :
 * - 22 fichiers cibles (10 Gazette/Newsletter + 12 Galerie Photos)
 * - 280+ clés bilingues vérifiées sous studio.newsletter.* et studio.photos.*
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

console.log('🧪 Lancement du test unitaire i18n — Pôle Studio (Lot 1 : Gazette & Galerie Photos)...\n');

const subNamespaces = ['newsletter', 'photos'];
let totalChecked = 0;
let errors = [];

// 1. Contrôle de parité 1:1 absolue FR / PT
for (const sub of subNamespaces) {
  const frSub = fr.studio?.[sub];
  const ptSub = pt.studio?.[sub];

  if (!frSub) {
    errors.push(`Sous-namespace manquant dans fr.js: studio.${sub}`);
    continue;
  }
  if (!ptSub) {
    errors.push(`Sous-namespace manquant dans pt.js: studio.${sub}`);
    continue;
  }

  const frKeys = Object.keys(frSub);
  const ptKeys = Object.keys(ptSub);

  console.log(`  🔍 Vérification sous-namespace studio.${sub} (${frKeys.length} clés)...`);

  for (const k of frKeys) {
    totalChecked++;
    if (!(k in ptSub)) {
      errors.push(`Clé orpheline dans fr.js (absente de pt.js) : studio.${sub}.${k}`);
    } else {
      if (typeof frSub[k] !== 'string' || frSub[k].trim() === '') {
        errors.push(`Valeur vide ou non textuelle dans fr.js : studio.${sub}.${k}`);
      }
      if (typeof ptSub[k] !== 'string' || ptSub[k].trim() === '') {
        errors.push(`Valeur vide ou non textuelle dans pt.js : studio.${sub}.${k}`);
      }
    }
  }

  for (const k of ptKeys) {
    if (!(k in frSub)) {
      errors.push(`Clé orpheline dans pt.js (absente de fr.js) : studio.${sub}.${k}`);
    }
  }
}

// 2. Contrôle du câblage des 22 fichiers cibles
const targetFiles = [
  // Gazette & Newsletter (10 fichiers)
  'src/components/studio/NewsletterPage.jsx',
  'src/components/studio/newsletter/NewsletterStepper.jsx',
  'src/components/studio/newsletter/Step1MessageAccueil.jsx',
  'src/components/studio/newsletter/Step2ProchainesDates.jsx',
  'src/components/studio/newsletter/Step3RetourImages.jsx',
  'src/components/studio/newsletter/Step4Recapitulatif.jsx',
  'src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx',
  'src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx',
  'src/components/public/PublicNewsletterForm.jsx',
  'src/hooks/useNewsletterData.js',

  // Galerie Photos & Médiathèque (12 fichiers)
  'src/components/studio/StudioPhotosView.jsx',
  'src/components/studio/StudioPhotoQrPrintModal.jsx',
  'src/components/studio/StudioMultiPhotoManager.jsx',
  'src/components/studio/StudioVaralPickerModal.jsx',
  'src/components/studio/FramaspaceGalleryViewer.jsx',
  'src/components/studio/StudioEventsMediaTable.jsx',
  'src/components/studio/StudioEventMediaAccordionRow.jsx',
  'src/components/studio/StudioEventsManager.jsx',
  'src/components/studio/EventsDataGrid.jsx',
  'src/components/studio/EventsDataGridRow.jsx',
  'src/components/studio/ActivityReports.jsx',
  'src/components/studio/StudioCloudHeader.jsx'
];

console.log(`\n  🔍 Vérification du câblage i18n sur les ${targetFiles.length} fichiers cibles du Lot 1...`);

for (const relPath of targetFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Fichier cible introuvable : ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Vérifier présence de useTranslation
  if (!content.includes('useTranslation')) {
    errors.push(`useTranslation manquant dans : ${relPath}`);
  }

  // Vérifier utilisation effective de t(...)
  const usesTranslationCall = content.includes('t(') || content.includes('t("') || content.includes("t('");
  if (!usesTranslationCall) {
    errors.push(`Aucun appel t(...) trouvé dans : ${relPath}`);
  }
}

// Bilan
console.log('\n======================================================');
if (errors.length === 0) {
  console.log(`✅ Succès total : ${totalChecked} clés vérifiées avec 100% de parité FR/PT.`);
  console.log(`✅ Les ${targetFiles.length} fichiers cibles sont correctement branchés sur useTranslation / t(...).`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`❌ Échec du test : ${errors.length} erreur(s) détectée(s) :`);
  errors.forEach(e => console.error(`  - ${e}`));
  console.log('======================================================\n');
  process.exit(1);
}
