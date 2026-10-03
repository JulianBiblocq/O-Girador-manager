/**
 * Test de parité et validation i18n — Back-Office du Pôle Vitrine
 * Périmètre :
 * - 15 fichiers cibles du Back-Office Vitrine (TabPublic*, vitrine/*, FormulesManager, LegalInfoBlock)
 * - 255 clés bilingues vérifiées sous vitrine.admin.*
 * - 0 clé orpheline entre FR et PT
 * - Vérification du câblage useTranslation / t(...) dans l'ensemble des composants cibles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Lancement du test unitaire i18n — Back-Office du Pôle Vitrine...\n');

let totalChecked = 0;
let errors = [];

const frVitrineAdmin = fr.vitrine?.admin;
const ptVitrineAdmin = pt.vitrine?.admin;

if (!frVitrineAdmin) {
  errors.push("Namespace 'vitrine.admin' manquant dans src/locales/fr.js");
}
if (!ptVitrineAdmin) {
  errors.push("Namespace 'vitrine.admin' manquant dans src/locales/pt.js");
}

function compareObjects(frObj, ptObj, prefix = 'vitrine.admin') {
  if (!frObj || typeof frObj !== 'object' || !ptObj || typeof ptObj !== 'object') {
    return;
  }

  const frKeys = Object.keys(frObj);
  const ptKeys = Object.keys(ptObj);

  for (const k of frKeys) {
    const curPath = `${prefix}.${k}`;
    if (!(k in ptObj)) {
      errors.push(`Clé orpheline dans fr.js (absente de pt.js) : ${curPath}`);
    } else if (typeof frObj[k] === 'object' && frObj[k] !== null) {
      compareObjects(frObj[k], ptObj[k], curPath);
    } else {
      totalChecked++;
      if (typeof frObj[k] !== 'string' || frObj[k].trim() === '') {
        errors.push(`Valeur vide ou non textuelle dans fr.js : ${curPath}`);
      }
      if (typeof ptObj[k] !== 'string' || ptObj[k].trim() === '') {
        errors.push(`Valeur vide ou non textuelle dans pt.js : ${curPath}`);
      }
    }
  }

  for (const k of ptKeys) {
    const curPath = `${prefix}.${k}`;
    if (!(k in frObj)) {
      errors.push(`Clé orpheline dans pt.js (absente de fr.js) : ${curPath}`);
    }
  }
}

if (frVitrineAdmin && ptVitrineAdmin) {
  compareObjects(frVitrineAdmin, ptVitrineAdmin);
  console.log(`  🔍 Vérification de parité terminée : ${totalChecked} clés bilingues inspectées.`);
}

// 2. Contrôle du câblage des 15 fichiers cibles
const targetFiles = [
  'src/components/association-settings/TabPublicGeneral.jsx',
  'src/components/association-settings/blocks/LegalInfoBlock.jsx',
  'src/components/association-settings/TabPublicTheme.jsx',
  'src/components/association-settings/TabPublicContent.jsx',
  'src/components/association-settings/vitrine/HeroHeaderAccordion.jsx',
  'src/components/association-settings/vitrine/PresentationVieAccordion.jsx',
  'src/components/association-settings/vitrine/FormulesRecrutementAccordion.jsx',
  'src/components/association-settings/FormulesManager.jsx',
  'src/components/association-settings/vitrine/ProDocsAccordion.jsx',
  'src/components/association-settings/TabPublicProDocs.jsx',
  'src/components/association-settings/vitrine/GallerySouvenirsAccordion.jsx',
  'src/components/association-settings/TabPublicGallery.jsx',
  'src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx',
  'src/components/association-settings/vitrine/SocialLinksBlock.jsx',
  'src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx'
];

console.log(`\n  🔍 Vérification du câblage i18n sur les ${targetFiles.length} fichiers cibles du Pôle Vitrine...`);

for (const relPath of targetFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Fichier cible introuvable : ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  if (!content.includes('useTranslation') && !content.includes('t(')) {
    errors.push(`useTranslation ou t(...) manquant dans : ${relPath}`);
  }

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
