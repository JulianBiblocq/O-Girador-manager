/**
 * Script d'audit statique exhaustif i18n — Pôle Studio
 * Mode : LECTURE SEULE STRICTE (Aucune modification des sources, schémas ou règles)
 *
 * Utilise Babel Parser (@babel/parser) et Traverser (@babel/traverse) pour extraire :
 * 1. Textes bruts dans les nœuds JSX
 * 2. Attributs textuels (placeholder, title, label, aria-label, alt)
 * 3. Options select, colonnes statiques et tableaux de configuration UI
 * 4. Messages runtime (alert, confirm, toasts, notifications, setters d'erreurs, new Error)
 * 5. Textes bruts dans les dictionnaires de configuration et services Studio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import traversePkg from '@babel/traverse';

const traverse = traversePkg.default || traversePkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Définition des 4 sous-périmètres du Pôle Studio
const studioPoles = {
  newsletter: {
    name: 'Gazette & Newsletter',
    category: 'newsletter',
    subNamespace: 'newsletter',
    files: [
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
      'src/services/newsletterService.js'
    ]
  },
  communication: {
    name: 'Studio Communication & Identité',
    category: 'communication',
    subNamespace: 'communication',
    files: [
      'src/components/studio/StudioCommunication.jsx',
      'src/components/StudioSocial.jsx',
      'src/components/association-settings/TabCommunication.jsx',
      'src/components/association-settings/TabConfigComms.jsx',
      'src/components/association-settings/email/EmailConfigSection.jsx',
      'src/components/association-settings/email/EmailDnsHelpCard.jsx',
      'src/components/association-settings/blocks/BrevoIntegrationBlock.jsx',
      'src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx',
      'src/components/association-settings/blocks/YouTubePlaylistsBlock.jsx',
      'src/components/studio/SendContractModal.jsx',
      'src/components/studio/StudioSocialPreview.jsx',
      'src/components/studio/StudioTextToolbar.jsx',
      'src/components/studio/StudioWritingGuide.jsx',
      'src/components/studio/StudioEmojiPicker.jsx',
      'src/components/studio/StudioQuickChips.jsx',
      'src/components/studio/preview/FacebookPreviewGrid.jsx',
      'src/components/studio/preview/InstagramPreviewCard.jsx',
      'src/config/studioSocialConfig.js'
    ]
  },
  photos: {
    name: 'Galerie Photos & Médiathèque',
    category: 'photos',
    subNamespace: 'photos',
    files: [
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
      'src/components/studio/EventToggleSwitch.jsx',
      'src/components/studio/ActivityReports.jsx',
      'src/components/studio/StudioCloudHeader.jsx'
    ]
  },
  lexique: {
    name: 'Lexique Franco-Brésilien',
    category: 'lexique',
    subNamespace: 'lexique',
    files: [
      'src/components/studio/StudioLexiqueManager.jsx',
      'src/components/studio/lexique/HashtagsSection.jsx',
      'src/components/studio/lexique/MentionsSection.jsx',
      'src/components/studio/lexique/VocabForm.jsx',
      'src/components/studio/lexique/VocabSection.jsx'
    ]
  }
};

// 2. Filtres rigoureux de détection textuelle
function isTextualString(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length < 2) return false;

  // Doit comporter au moins 2 lettres consécutives (incluant accents)
  if (!/[a-zA-ZÀ-ÿ]{2,}/.test(trimmed)) return false;

  // Ignorer les classes CSS probables Tailwind / Cordel
  if (/^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|col-|row-|rounded-|shadow-|transition-|cursor-|overflow-|max-|min-|gap-|items-|justify-|leading-|font-|tracking-|animate-|z-|select-|outline-|scale-|opacity-|space-|self-|aspect-|duration-|ease-|ring-)/.test(trimmed)) {
    return false;
  }

  // Ignorer les URLs, data URLs, chemins de fichiers, SVG paths, formats mime
  if (/^(https?:\/\/|\/|#|data:|rgba?\(|\.\/|\.\.\/|[a-z0-9_.-]+@[a-z0-9_.-]+|image\/|audio\/|video\/)/i.test(trimmed)) {
    return false;
  }

  // Ignorer les chaînes de classes CSS combinées
  if (trimmed.split(/\s+/).every(token => /^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|rounded-|shadow-|gap-|items-|justify-|font-|transition|duration|ease|space-|animate|relative|absolute|fixed)/.test(token))) {
    return false;
  }

  // Ignorer les clés Firestore, paramètres ou constantes techniques usuelles
  const technicalKeywords = [
    'id', 'key', 'name', 'type', 'status', 'date', 'desc', 'title', 'role',
    'action', 'label', 'value', 'amount', 'total', 'count', 'items', 'users',
    'events', 'notes', 'tags', 'groupId', 'userId', 'photoUrl', 'authorId',
    'createdAt', 'updatedAt', 'asc', 'desc', 'true', 'false', 'null', 'undefined',
    'imageUrl', 'photoUrls', 'photos', 'mentions', 'hashtags', 'equivalences',
    'activeChip', 'handle', 'recolte', 'varal', 'facebook', 'instagram', 'brevo',
    'framaspace', 'youtube', 'drive', 'dropbox', 'text', 'url', 'method', 'post',
    'get', 'json', 'headers', 'body', 'publictheme', 'galleryphotos', 'subscribers',
    'syncingbrevo', 'exportingnewsletter', 'savingvideo', 'newsletterstatusmsg',
    'titrecampagne', 'messageaccueil', 'prochainesdates', 'evenementspasses'
  ];

  if (/^[a-zA-Z0-9_]+$/.test(trimmed) && trimmed.length <= 25 && !trimmed.includes(' ')) {
    if (technicalKeywords.includes(trimmed.toLowerCase())) return false;
  }

  // Ignorer les balises ou attributs SVG
  if (/^(M\s*\d+|matrix|rotate|scale|translate|evenodd|nonzero|stroke-width)/i.test(trimmed)) {
    return false;
  }

  // Ignorer les formats de date / heure bruts (ex: 'YYYY-MM-DD', 'HH:mm')
  if (/^(YYYY-MM-DD|HH:mm|DD\/MM\/YYYY)$/i.test(trimmed)) {
    return false;
  }

  return true;
}

// 3. Générateur de suggestion de clé sous le namespace "studio"
function suggestStudioKey(subNamespace, fileName, text) {
  const baseName = path.basename(fileName, path.extname(fileName))
    .replace(/(Modal|Card|Section|View|Table|Banner|Picker|Manager|Container|Editor|Row|Grid|Header|Block|Accordion)$/, '')
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

  const slug = text
    .replace(/[^\w\sÀ-ÿ]/gi, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word, idx) => (idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');

  return `studio.${subNamespace}.${baseName}.${slug || 'label'}`;
}

// 4. Analyseur AST d'un fichier
function analyzeFile(filePath, subNamespace) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) {
    return { error: 'Fichier introuvable', filePath, items: [] };
  }

  const code = fs.readFileSync(fullPath, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (err) {
    return { error: `Erreur de parsing AST: ${err.message}`, filePath, items: [] };
  }

  const items = [];
  const fileName = path.basename(filePath);

  const recordItem = (line, text, context, type = 'text') => {
    const trimmed = text.trim();
    if (!isTextualString(trimmed)) return;

    // Éviter d'enregistrer deux fois exactement le même texte sur la même ligne
    const exists = items.some((it) => it.line === line && it.text === trimmed);
    if (exists) return;

    items.push({
      line,
      text: trimmed,
      context,
      type,
      suggestedKey: suggestStudioKey(subNamespace, fileName, trimmed)
    });
  };

  traverse(ast, {
    // 1. Textes JSX bruts
    JSXText(nodePath) {
      const raw = nodePath.node.value;
      if (!raw || !raw.trim()) return;

      const parentTag = nodePath.parent?.openingElement?.name?.name || 'JSX';
      if (['style', 'script'].includes(parentTag)) return;

      let context = 'Nœud JSX';
      if (parentTag === 'option') context = 'Option de liste (<option>)';
      else if (parentTag === 'th') context = 'En-tête de tableau (<th>)';
      else if (parentTag === 'button') context = 'Bouton (<button>)';
      else if (/^h[1-6]$/.test(parentTag)) context = `Titre (<${parentTag}>)`;
      else if (parentTag === 'p') context = 'Paragraphe (<p>)';
      else if (parentTag === 'span') context = 'Libellé / Badge (<span>)';
      else if (parentTag === 'label') context = 'Label de formulaire (<label>)';

      recordItem(nodePath.node.loc.start.line, raw, context, 'jsxText');
    },

    // 2. Attributs JSX textuels
    JSXAttribute(nodePath) {
      const attrName = nodePath.node.name?.name;
      const targetAttrs = ['placeholder', 'title', 'label', 'aria-label', 'alt'];

      if (targetAttrs.includes(attrName)) {
        let val = null;
        if (nodePath.node.value?.type === 'StringLiteral') {
          val = nodePath.node.value.value;
        } else if (
          nodePath.node.value?.type === 'JSXExpressionContainer' &&
          nodePath.node.value.expression?.type === 'StringLiteral'
        ) {
          val = nodePath.node.value.expression.value;
        }

        if (val) {
          recordItem(nodePath.node.loc.start.line, val, `Attribut ${attrName}`, 'attribute');
        }
      }
    },

    // 3. Chaînes littérales dans les expressions JSX (hors appels t())
    JSXExpressionContainer(nodePath) {
      if (nodePath.parentPath?.isJSXAttribute()) return;

      const expr = nodePath.node.expression;

      // Cas 1 : StringLiteral direct { "Mon texte" }
      if (expr?.type === 'StringLiteral') {
        recordItem(expr.loc.start.line, expr.value, 'Expression JSX directe', 'expression');
      }

      // Cas 2 : Ternaire { cond ? "Texte 1" : "Texte 2" }
      if (expr?.type === 'ConditionalExpression') {
        if (expr.consequent?.type === 'StringLiteral') {
          recordItem(expr.consequent.loc.start.line, expr.consequent.value, 'Branche conditionnelle (ternaire)', 'conditional');
        }
        if (expr.alternate?.type === 'StringLiteral') {
          recordItem(expr.alternate.loc.start.line, expr.alternate.value, 'Branche conditionnelle (ternaire)', 'conditional');
        }
      }

      // Cas 3 : Opérateur logique OU { val || "Texte repli" }
      if (expr?.type === 'LogicalExpression' && expr.operator === '||') {
        if (expr.right?.type === 'StringLiteral') {
          const isLeftT = expr.left?.type === 'CallExpression' && expr.left.callee?.name === 't';
          const ctx = isLeftT ? 'Repli en dur après t()' : 'Repli logique (||)';
          recordItem(expr.right.loc.start.line, expr.right.value, ctx, 'fallback');
        }
      }
    },

    // 4. Messages runtime et dialogues
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      let fnName = '';
      if (callee.type === 'Identifier') {
        fnName = callee.name;
      } else if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
        fnName = callee.property.name;
      }

      if (fnName === 't') return;

      const alertFns = [
        'alert', 'confirm', 'showToast', 'toast', 'notify',
        'setErrorMessage', 'setErrorAlert', 'setError', 'setToastMessage',
        'setNewsletterStatusMsg', 'setSavingVideoMsg'
      ];
      if (alertFns.includes(fnName)) {
        const arg0 = nodePath.node.arguments[0];
        if (arg0?.type === 'StringLiteral') {
          recordItem(nodePath.node.loc.start.line, arg0.value, `Message runtime (${fnName})`, 'runtime');
        }
      }
    },

    // 5. Instanciation de new Error("message")
    NewExpression(nodePath) {
      if (nodePath.node.callee?.type === 'Identifier' && nodePath.node.callee.name === 'Error') {
        const arg0 = nodePath.node.arguments[0];
        if (arg0?.type === 'StringLiteral') {
          recordItem(nodePath.node.loc.start.line, arg0.value, "Message d'erreur runtime (new Error)", 'runtime');
        }
      }
    },

    // 6. Propriétés textuelles d'objets statiques de configuration
    ObjectProperty(nodePath) {
      const keyName = nodePath.node.key?.name || nodePath.node.key?.value;
      const targetProps = ['label', 'title', 'header', 'name', 'description', 'hint', 'category', 'subLabel', 'emptyText', 'placeholder', 'context', 'contexte'];

      if (targetProps.includes(keyName)) {
        if (nodePath.node.value?.type === 'StringLiteral') {
          const val = nodePath.node.value.value;
          if (isTextualString(val) && !val.startsWith('http') && !val.startsWith('/') && !val.includes('.')) {
            if (nodePath.parentPath?.isObjectExpression()) {
              const siblingKeys = nodePath.parent.properties.map((p) => p.key?.name || p.key?.value);
              const isUIConfig = siblingKeys.some((k) => ['key', 'id', 'value', 'tab', 'onClick', 'icon', 'badge', 'action', 'emojis', 'preferred', 'avoid', 'recommande', 'aEviter'].includes(k));
              if (isUIConfig) {
                recordItem(nodePath.node.loc.start.line, val, `Propriété d'objet (${keyName})`, 'config');
              }
            }
          }
        }
      }
    }
  });

  return { filePath, items };
}

// 5. Exécution globale de l'audit
console.log('🔍 Démarrage de l\'audit statique exhaustif i18n — Pôle Studio...\n');

const auditResults = {
  timestamp: new Date().toISOString(),
  poleSummary: {},
  grandTotal: 0,
  cleanFilesCount: 0,
  dirtyFilesCount: 0,
  totalFilesAudited: 0
};

let grandTotal = 0;
let totalClean = 0;
let totalDirty = 0;
let totalFiles = 0;

for (const [poleKey, pole] of Object.entries(studioPoles)) {
  console.log(`📋 Audit : ${pole.name} (${pole.files.length} fichiers)...`);

  const poleData = {
    name: pole.name,
    category: pole.category,
    subNamespace: pole.subNamespace,
    totalFiles: pole.files.length,
    totalStrings: 0,
    cleanFiles: [],
    dirtyFiles: []
  };

  for (const file of pole.files) {
    totalFiles++;
    const res = analyzeFile(file, pole.subNamespace);
    if (res.error) {
      console.warn(`  ⚠️  ${file}: ${res.error}`);
      continue;
    }

    if (res.items.length === 0) {
      poleData.cleanFiles.push(file);
      totalClean++;
    } else {
      poleData.dirtyFiles.push({
        file,
        count: res.items.length,
        items: res.items
      });
      poleData.totalStrings += res.items.length;
      grandTotal += res.items.length;
      totalDirty++;
    }
  }

  auditResults.poleSummary[poleKey] = poleData;
}

auditResults.grandTotal = grandTotal;
auditResults.cleanFilesCount = totalClean;
auditResults.dirtyFilesCount = totalDirty;
auditResults.totalFilesAudited = totalFiles;

console.log(`\n======================================================`);
console.log(`✅ Audit Studio terminé avec succès.`);
console.log(`📁 Total fichiers audités : ${totalFiles}`);
console.log(`✨ Fichiers 100% propres (i18n ready) : ${totalClean}`);
console.log(`⚠️  Fichiers comportant des chaînes en dur : ${totalDirty}`);
console.log(`🔤 Total général des chaînes brutes détectées : ${grandTotal}`);
console.log(`======================================================\n`);

// 6. Sauvegarde des données brutes en JSON
const jsonOutputPath = path.join(rootDir, 'scripts/audit_studio_results.json');
fs.writeFileSync(jsonOutputPath, JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`💾 Fichier de données JSON généré : scripts/audit_studio_results.json`);

// 7. Génération automatique du Rapport Markdown de synthèse
function generateMarkdownReport(results) {
  let md = `# Rapport d'Audit Statique Exhaustif i18n — Pôle Studio\n\n`;
  md += `> **Mode d'exécution :** Lecture Seule Stricte (Inspection AST Babel \`@babel/parser\` & \`@babel/traverse\`).  \n`;
  md += `> **Date de l'audit :** ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}  \n`;
  md += `> **Application cible :** \`o-girador-organizador\` (Front-End React / Tailwind CSS / Cordel)  \n`;
  md += `> **Données brutes générées :** [\`scripts/audit_studio_results.json\`](file:///E:/o-girador/o-girador-organizador/scripts/audit_studio_results.json)  \n`;
  md += `> **Script d'audit :** [\`scripts/audit_studio_i18n.mjs\`](file:///E:/o-girador/o-girador-organizador/scripts/audit_studio_i18n.mjs)\n\n`;
  md += `---\n\n`;

  md += `## 1. Vue d'Ensemble & Métriques Clés\n\n`;
  md += `L'inspection statique a scanné l'intégralité des composants, modales, modules et services gravitant autour de la communication, de la newsletter, de la médiathèque de photos, des réseaux sociaux et du lexique franco-brésilien.\n\n`;
  md += `| Métrique | Valeur |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Total de fichiers audités** | **${results.totalFilesAudited} fichiers** |\n`;
  const cleanPct = ((results.cleanFilesCount / results.totalFilesAudited) * 100).toFixed(1);
  const dirtyPct = ((results.dirtyFilesCount / results.totalFilesAudited) * 100).toFixed(1);
  md += `| **Fichiers 100 % propres (i18n Ready / 0 texte en dur)** | **${results.cleanFilesCount} fichiers** (${cleanPct} %) |\n`;
  md += `| **Fichiers comportant des chaînes brutes à traduire** | **${results.dirtyFilesCount} fichiers** (${dirtyPct} %) |\n`;
  md += `| **Total général des chaînes brutes détectées** | **${results.grandTotal} chaînes** |\n`;
  md += `| **Namespace racine cible recommandé** | \`studio.*\` |\n\n`;
  md += `---\n\n`;

  md += `## 2. Décomposition par Sous-Périmètre\n\n`;
  md += `| Sous-Périmètre | Fichiers audités | Fichiers propres | Fichiers avec chaînes | Chaînes brutes |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: |\n`;

  for (const [key, pole] of Object.entries(results.poleSummary)) {
    const cleanCount = pole.cleanFiles.length;
    const dirtyCount = pole.dirtyFiles.length;
    md += `| **${pole.name}** (\`studio.${pole.subNamespace}.*\`) | ${pole.totalFiles} | ${cleanCount} | ${dirtyCount} | **${pole.totalStrings}** |\n`;
  }
  md += `| **TOTAL GÉNÉRAL** | **${results.totalFilesAudited}** | **${results.cleanFilesCount}** | **${results.dirtyFilesCount}** | **${results.grandTotal}** |\n\n`;
  md += `---\n\n`;

  md += `## 3. Détail Exhaustif par Composant & Fichier\n\n`;

  for (const [key, pole] of Object.entries(results.poleSummary)) {
    md += `### ${pole.name} (${pole.totalStrings} chaînes)\n`;
    md += `*Namespace recommandé : \`studio.${pole.subNamespace}.*\`*\n\n`;
    md += `| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |\n`;
    md += `| :--- | :---: | :---: | :--- |\n`;

    // Dirty files d'abord, triés par count décroissant
    const sortedDirty = [...pole.dirtyFiles].sort((a, b) => b.count - a.count);
    for (const item of sortedDirty) {
      const examples = item.items.slice(0, 4).map((it) => `\`"${it.text.replace(/"/g, '\\"')}"\``).join(', ');
      md += `| [\`${item.file}\`](file:///E:/o-girador/o-girador-organizador/${item.file}) | ⚠️ À traduire | **${item.count}** | ${examples} |\n`;
    }

    // Clean files
    for (const cleanFile of pole.cleanFiles) {
      md += `| [\`${cleanFile}\`](file:///E:/o-girador/o-girador-organizador/${cleanFile}) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |\n`;
    }

    md += `\n`;
  }

  md += `---\n\n`;

  md += `## 4. Recommandations d'Architecture pour l'Injection i18n\n\n`;
  md += `1. **Sous-namespaces dédiés dans \`src/locales/fr.js\` et \`src/locales/pt.js\` :**\n`;
  md += `   - \`studio.newsletter.*\` : Stepper 4 étapes, sélection d'événements, téléversement de photos, export API Brevo.\n`;
  md += `   - \`studio.communication.*\` : Paramètres généraux, passerelles Brevo / DNS / Framaspace / YouTube, prévisualisation réseaux (Instagram, Facebook).\n`;
  md += `   - \`studio.photos.*\` : Albums, QR-Code d'impression pour événements, modale Varal, visionneuse plein écran.\n`;
  md += `   - \`studio.lexique.*\` : Éditeur de vocabulaire traditionnel, mentions officielles et hashtags associatifs.\n\n`;
  md += `2. **Parité linguistique stricte :** 100% des clés créées en français devront disposer de leur équivalent en portugais brésilien avec une terminologie fidèle aux traditions percussives de Pernambuco (*baques, toadas, cortejo, puxador, alfaias, batuque*).\n\n`;
  md += `3. **Préservation des variables d'interpolation :** Les interpolations existantes telles que \`{count}\`, \`{name}\`, \`{url}\` devront être scrupuleusement maintenues dans les deux locales.\n`;

  return md;
}

const mdContent = generateMarkdownReport(auditResults);
const mdOutputPath = path.join(rootDir, 'AUDIT_STUDIO_I18N.md');
fs.writeFileSync(mdOutputPath, mdContent, 'utf8');
console.log(`📄 Rapport Markdown de synthèse généré : AUDIT_STUDIO_I18N.md\n`);
