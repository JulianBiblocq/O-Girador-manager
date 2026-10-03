/**
 * Script d'audit statique exhaustif i18n — Back-Office du Pôle Vitrine
 * Mode : LECTURE SEULE STRICTE (Aucune modification des sources, schémas ou règles)
 *
 * Utilise Babel Parser (@babel/parser) et Traverser (@babel/traverse) pour recenser :
 * 1. Les nœuds JSX textuels bruts (labels de champs, descriptions d'aide, titres de sections)
 * 2. Les attributs textuels : placeholder, title, subtitle, label, aria-label, alt, description
 * 3. Les options statiques de menus déroulants (<option>) et en-têtes (h1-h6, th)
 * 4. Les chaînes littérales dans les expressions JSX (ternaires, replis ||)
 * 5. Les messages runtime (alert, confirm, toasts, setters d'erreurs et de progression)
 * 6. Les configurations d'objets statiques (labels, descriptions, placeholders, listes par défaut)
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

// 1. Définition exhaustive des modules d'administration du Pôle Vitrine
const vitrineAdminModules = {
  general: {
    name: 'Statut de Publication, SEO & Coordonnées (Général)',
    category: 'general',
    files: [
      'src/components/association-settings/TabPublicGeneral.jsx',
      'src/components/association-settings/blocks/LegalInfoBlock.jsx'
    ]
  },
  theme: {
    name: 'Apparence Visuelle & Charte Graphique (Thème)',
    category: 'theme',
    files: [
      'src/components/association-settings/TabPublicTheme.jsx'
    ]
  },
  content: {
    name: 'Hub Éditorial, En-tête Hero & Présentation',
    category: 'content',
    files: [
      'src/components/association-settings/TabPublicContent.jsx',
      'src/components/association-settings/vitrine/HeroHeaderAccordion.jsx',
      'src/components/association-settings/vitrine/PresentationVieAccordion.jsx'
    ]
  },
  recruitment: {
    name: 'Formules d\'Adhésion & Campagne de Recrutement',
    category: 'recruitment',
    files: [
      'src/components/association-settings/vitrine/FormulesRecrutementAccordion.jsx',
      'src/components/association-settings/FormulesManager.jsx'
    ]
  },
  proDocs: {
    name: 'Documents Espace Pro & Fiches Techniques',
    category: 'proDocs',
    files: [
      'src/components/association-settings/vitrine/ProDocsAccordion.jsx',
      'src/components/association-settings/TabPublicProDocs.jsx'
    ]
  },
  gallery: {
    name: 'Galerie & Souvenirs Photographiques',
    category: 'gallery',
    files: [
      'src/components/association-settings/vitrine/GallerySouvenirsAccordion.jsx',
      'src/components/association-settings/TabPublicGallery.jsx'
    ]
  },
  socialNewsletter: {
    name: 'Réseaux Sociaux & Paramètres Newsletter Brevo',
    category: 'socialNewsletter',
    files: [
      'src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx',
      'src/components/association-settings/vitrine/SocialLinksBlock.jsx',
      'src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx'
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
  if (/^(https?:\/\/|\/|#|data:|rgba?\(|\.\/|\.\.\/|[a-z0-9_.-]+@[a-z0-9_.-]+|image\/|audio\/|video\/|application\/)/i.test(trimmed)) {
    return false;
  }

  // Ignorer les chaînes de classes CSS combinées
  if (trimmed.split(/\s+/).every(token => /^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|rounded-|shadow-|gap-|items-|justify-|font-|transition|duration|ease|space-|animate|relative|absolute|fixed|shrink-|accent-|w-full|h-full)/.test(token))) {
    return false;
  }

  // Ignorer les identifiants techniques, clés Firestore ou paramètres isolés usuels
  const technicalKeywords = [
    'id', 'key', 'name', 'type', 'status', 'date', 'desc', 'title', 'role',
    'action', 'label', 'value', 'amount', 'total', 'count', 'items', 'users',
    'events', 'notes', 'tags', 'groupid', 'userid', 'photourl', 'authorid',
    'createdat', 'updatedat', 'asc', 'desc', 'true', 'false', 'null', 'undefined',
    'imageurl', 'photourls', 'photos', 'method', 'post', 'get', 'json', 'headers',
    'body', 'publictheme', 'galleryphotos', 'subscribers', 'titrecampagne',
    'seotitle', 'seodescription', 'seokeywords', 'herocatchphrase', 'herovideolink',
    'dossierpresentationurl', 'fichetechniqueurl', 'plansceneurl', 'kitpresseurl',
    'brevokey', 'brevolistid', 'facebook', 'instagram', 'youtube', 'tiktok', 'snapchat',
    'whatsapp', 'linkedin', 'spotify', 'sans-serif', 'serif', 'display', 'monospace',
    'oswald', 'roboto', 'montserrat', 'open sans', 'playfair display', 'lato', 'poppins',
    'cinzel', 'rye', 'sancreek', 'cactus'
  ];

  if (technicalKeywords.includes(trimmed.toLowerCase())) {
    return false;
  }

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

// 3. Générateur de suggestion de clé sous le namespace "vitrine.admin.*"
function suggestVitrineKey(category, filePath, text) {
  const componentName = path.basename(filePath, path.extname(filePath))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

  const slug = text
    .replace(/[^\w\sÀ-ÿ]/gi, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word, idx) => (idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');

  return `vitrine.admin.${category}.${componentName}.${slug || 'label'}`;
}

// 4. Analyseur AST d'un fichier source
function analyzeFile(filePath, category) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) {
    return { error: 'Fichier introuvable', filePath, items: [] };
  }

  const code = fs.readFileSync(fullPath, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (err) {
    return { error: `Erreur de parsing: ${err.message}`, filePath, items: [] };
  }

  const items = [];

  const recordItem = (line, text, context, type = 'text') => {
    const trimmed = text.trim();
    if (!isTextualString(trimmed)) return;

    // Éviter d'enregistrer deux fois le même texte sur la même ligne
    const exists = items.some((it) => it.line === line && it.text === trimmed);
    if (exists) return;

    items.push({
      line,
      text: trimmed,
      context,
      type,
      suggestedKey: suggestVitrineKey(category, filePath, trimmed)
    });
  };

  // Helper pour extraire les morceaux textuels d'une TemplateLiteral
  const extractTemplateLiteral = (tplNode) => {
    if (!tplNode || tplNode.type !== 'TemplateLiteral') return '';
    return tplNode.quasis
      .map((q, idx) => {
        const text = q.value.raw;
        return idx < tplNode.quasis.length - 1 ? `${text}{param}` : text;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
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
      else if (parentTag === 'kbd') context = 'Touche raccourci (<kbd>)';

      recordItem(nodePath.node.loc.start.line, raw, context, 'jsxText');
    },

    // 2. Attributs JSX textuels
    JSXAttribute(nodePath) {
      const attrName = nodePath.node.name?.name;
      const targetAttrs = ['placeholder', 'title', 'subtitle', 'label', 'aria-label', 'alt', 'heading', 'description'];

      if (targetAttrs.includes(attrName)) {
        let val = null;
        if (nodePath.node.value?.type === 'StringLiteral') {
          val = nodePath.node.value.value;
        } else if (
          nodePath.node.value?.type === 'JSXExpressionContainer' &&
          nodePath.node.value.expression?.type === 'StringLiteral'
        ) {
          val = nodePath.node.value.expression.value;
        } else if (
          nodePath.node.value?.type === 'JSXExpressionContainer' &&
          nodePath.node.value.expression?.type === 'TemplateLiteral'
        ) {
          val = extractTemplateLiteral(nodePath.node.value.expression);
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
        const visitBranch = (branch) => {
          if (!branch) return;
          if (branch.type === 'StringLiteral') {
            recordItem(branch.loc.start.line, branch.value, 'Branche conditionnelle (ternaire)', 'conditional');
          } else if (branch.type === 'ConditionalExpression') {
            visitBranch(branch.consequent);
            visitBranch(branch.alternate);
          } else if (branch.type === 'TemplateLiteral') {
            const rawTpl = extractTemplateLiteral(branch);
            if (rawTpl) recordItem(branch.loc.start.line, rawTpl, 'Template conditionnel', 'conditional');
          }
        };
        visitBranch(expr.consequent);
        visitBranch(expr.alternate);
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
        'setUploadError', 'setUploadProgress', 'setNewsletterStatusMsg'
      ];

      if (alertFns.includes(fnName)) {
        const arg0 = nodePath.node.arguments[0];
        if (arg0?.type === 'StringLiteral') {
          recordItem(nodePath.node.loc.start.line, arg0.value, `Message runtime (${fnName})`, 'runtime');
        } else if (arg0?.type === 'TemplateLiteral') {
          const rawTpl = extractTemplateLiteral(arg0);
          if (rawTpl) {
            recordItem(nodePath.node.loc.start.line, rawTpl, `Message runtime template (${fnName})`, 'runtime');
          }
        }
      }
    },

    // 5. Instanciation de new Error("message")
    NewExpression(nodePath) {
      if (nodePath.node.callee?.type === 'Identifier' && nodePath.node.callee.name === 'Error') {
        const arg0 = nodePath.node.arguments[0];
        if (arg0?.type === 'StringLiteral') {
          recordItem(nodePath.node.loc.start.line, arg0.value, "Exception d'erreur (new Error)", 'runtime');
        }
      }
    },

    // 6. Chaînes statiques dans des tableaux/objets de configuration UI
    ObjectProperty(nodePath) {
      const keyName = nodePath.node.key?.name || nodePath.node.key?.value;
      const targetProps = ['label', 'title', 'subtitle', 'header', 'message', 'placeholder', 'description', 'titre', 'tarif', 'avantages'];
      
      if (targetProps.includes(keyName)) {
        if (nodePath.node.value?.type === 'StringLiteral') {
          const val = nodePath.node.value.value;
          if (isTextualString(val)) {
            recordItem(nodePath.node.loc.start.line, val, `Config statique (${keyName})`, 'config');
          }
        } else if (nodePath.node.value?.type === 'ArrayExpression') {
          nodePath.node.value.elements.forEach((el) => {
            if (el?.type === 'StringLiteral' && isTextualString(el.value)) {
              recordItem(el.loc.start.line, el.value, `Élément liste config (${keyName})`, 'config');
            }
          });
        }
      }
    }
  });

  return { filePath, items };
}

// 5. Exécution globale de l'audit
console.log('🔍 Démarrage de l\'audit statique exhaustif i18n — Back-Office du Pôle Vitrine...\n');

const auditResults = {};
let grandTotal = 0;
let totalCleanFiles = 0;
let totalDirtyFiles = 0;

for (const [modKey, moduleConfig] of Object.entries(vitrineAdminModules)) {
  console.log(`📋 Audit du sous-module : ${moduleConfig.name}...`);
  auditResults[modKey] = {
    name: moduleConfig.name,
    category: moduleConfig.category,
    totalStrings: 0,
    cleanFiles: [],
    dirtyFiles: []
  };

  for (const file of moduleConfig.files) {
    const res = analyzeFile(file, moduleConfig.category);
    if (res.error) {
      console.warn(`  ⚠️  ${file}: ${res.error}`);
      continue;
    }

    if (res.items.length === 0) {
      auditResults[modKey].cleanFiles.push(file);
      totalCleanFiles++;
      console.log(`  ✅ [PROPRE] ${file}`);
    } else {
      auditResults[modKey].dirtyFiles.push({
        file,
        count: res.items.length,
        items: res.items
      });
      auditResults[modKey].totalStrings += res.items.length;
      grandTotal += res.items.length;
      totalDirtyFiles++;
      console.log(`  ⚠️  [TEXTES DÉTECTÉS: ${res.items.length}] ${file}`);
    }
  }
}

console.log(`\n======================================================`);
console.log(`📊 SYNTHÈSE DE L'AUDIT I18N BACK-OFFICE VITRINE`);
console.log(`======================================================`);
console.log(`Fichiers 100% propres  : ${totalCleanFiles}`);
console.log(`Fichiers avec textes  : ${totalDirtyFiles}`);
console.log(`Total chaînes brutes  : ${grandTotal}`);
console.log(`======================================================\n`);

// 6. Sauvegarde des données JSON brutes
const outputPath = path.join(rootDir, 'scripts/audit_vitrine_admin_results.json');
fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`📁 Données brutes JSON enregistrées : scripts/audit_vitrine_admin_results.json\n`);
