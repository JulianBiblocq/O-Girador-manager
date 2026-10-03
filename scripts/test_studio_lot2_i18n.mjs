/**
 * Test de parité et validation i18n — Pôle Studio (Lot 2 : Communication, Réseaux Sociaux & Lexique)
 * Périmètre :
 * - 22 fichiers cibles (17 Communication/Réseaux Sociaux + 5 Lexique Franco-Brésilien)
 * - 315+ clés bilingues vérifiées sous studio.communication.* et studio.lexique.*
 * - 0 clé orpheline entre FR et PT
 * - Vérification du câblage useTranslation / t(...) dans les composants cibles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Lancement du test unitaire i18n — Pôle Studio (Lot 2 : Communication, Réseaux Sociaux & Lexique)...\n');

const subNamespaces = ['communication', 'lexique'];
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
  // Studio Communication, Réseaux Sociaux & Intégrations (17 fichiers)
  'src/components/StudioSocial.jsx',
  'src/components/association-settings/email/EmailConfigSection.jsx',
  'src/components/association-settings/TabCommunication.jsx',
  'src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx',
  'src/components/studio/SendContractModal.jsx',
  'src/components/studio/preview/FacebookPreviewGrid.jsx',
  'src/components/association-settings/blocks/BrevoIntegrationBlock.jsx',
  'src/components/studio/StudioSocialPreview.jsx',
  'src/components/association-settings/blocks/YouTubePlaylistsBlock.jsx',
  'src/components/association-settings/email/EmailDnsHelpCard.jsx',
  'src/components/studio/StudioCommunication.jsx',
  'src/components/studio/StudioWritingGuide.jsx',
  'src/config/studioSocialConfig.js',
  'src/components/studio/StudioQuickChips.jsx',
  'src/components/studio/preview/InstagramPreviewCard.jsx',
  'src/components/association-settings/TabConfigComms.jsx',
  'src/components/studio/StudioTextToolbar.jsx',

  // Lexique Franco-Brésilien (5 fichiers)
  'src/components/studio/lexique/MentionsSection.jsx',
  'src/components/studio/lexique/VocabSection.jsx',
  'src/components/studio/lexique/VocabForm.jsx',
  'src/components/studio/StudioLexiqueManager.jsx',
  'src/components/studio/lexique/HashtagsSection.jsx'
];

console.log(`\n  🔍 Vérification du câblage i18n sur les ${targetFiles.length} fichiers cibles du Lot 2...`);

for (const relPath of targetFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Fichier cible introuvable : ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  if (relPath.endsWith('.js')) {
    // Fichier de configuration JS
    if (!content.includes('labelKey') && !content.includes('i18n') && !content.includes('t(')) {
      errors.push(`Gestion i18n manquante dans le fichier config : ${relPath}`);
    }
  } else {
    // Composant JSX
    if (!content.includes('useTranslation')) {
      errors.push(`useTranslation manquant dans : ${relPath}`);
    }

    const usesTranslationCall = content.includes('t(') || content.includes('t("') || content.includes("t('");
    if (!usesTranslationCall) {
      errors.push(`Aucun appel t(...) trouvé dans : ${relPath}`);
    }
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
