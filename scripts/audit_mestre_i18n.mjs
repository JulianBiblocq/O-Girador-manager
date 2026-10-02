/**
 * Script d'audit statique exhaustif i18n — Pôle Mestria (Direction Artistique)
 * Mode : LECTURE SEULE STRICTE (Aucune modification des sources, schémas ou règles)
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

// 1. Définition des sous-périmètres du Pôle Mestria
const mestreSubModules = {
  repertoire: {
    name: 'Répertoire & Modales Associées',
    category: 'repertoire',
    files: [
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
    ]
  },
  sequenceurGateway: {
    name: 'Passerelle Séquenciad\'Or, Presets & Signes',
    category: 'sequenceur',
    files: [
      'src/components/mestre/RepertoireUnlinkedPresetsBanner.jsx',
      'src/components/mestre/RepertoireTrainingsManager.jsx',
      'src/components/mestre/RepertoireSinaisDoMestreEditor.jsx',
      'src/components/mestre/reflex/SignalReflexCard.jsx'
    ]
  },
  casting: {
    name: 'Orientation, Casting & Disciplines',
    category: 'casting',
    files: [
      'src/components/mestre/MestreOrientationCasting.jsx',
      'src/components/mestre/MestreCustomCategories.jsx',
      'src/components/mestre/CategoryCardItem.jsx'
    ]
  },
  stageLayout: {
    name: 'Régie Scénique & Plateau',
    category: 'stageLayout',
    files: [
      'src/components/mestre/MestreStageLayout.jsx',
      'src/components/event-details/EventStageLayoutSection.jsx'
    ]
  },
  editorial: {
    name: 'Consignes Artistiques & Mot du Mestre',
    category: 'editorial',
    files: [
      'src/components/mestre/MestreMotMestre.jsx'
    ]
  },
  pedagogy: {
    name: 'Pédagogie & Évaluations du Mestre',
    category: 'pedagogy',
    files: [
      'src/components/mestre/MestrePedagogyDashboard.jsx',
      'src/components/mestre/MestrePedagogyNotepad.jsx',
      'src/components/mestre/MestreAutoEvalConfig.jsx',
      'src/components/mestre/CustomQuizConfigPanel.jsx'
    ]
  }
};

// 2. Utilitaires de détection de chaînes textuelles
function isTextualString(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length < 2) return false;
  // Doit comporter au moins 2 lettres consécutives (incluant accents)
  if (!/[a-zA-ZÀ-ÿ]{2,}/.test(trimmed)) return false;

  // Ignorer les classes CSS probables
  if (/^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|col-|row-|rounded-|shadow-|transition-|cursor-|overflow-|opacity-|z-|top-|left-|right-|bottom-|justify-|items-|gap-)/.test(trimmed)) {
    return false;
  }

  // Ignorer les formats web, hex, urls, MIME, paths
  if (/^(https?:\/\/|\/|#|data:|rgba?\(|\.\/|\.\.\/|[a-z0-9_.-]+@[a-z0-9_.-]+)/i.test(trimmed)) return false;

  // Ignorer les styles inline ou SVG
  if (/^(sans-serif|serif|monospace|auto|inherit|none|currentColor|solid|dashed|dotted)$/i.test(trimmed)) return false;

  // Ignorer les identifiants techniques isolés usuels
  if (/^[a-z0-9_-]+$/i.test(trimmed) && trimmed.length <= 18 && !trimmed.includes(' ')) {
    const technicalKeywords = [
      'id', 'key', 'name', 'type', 'status', 'date', 'desc', 'title', 'role',
      'action', 'label', 'value', 'amount', 'total', 'count', 'items', 'users',
      'events', 'notes', 'tags', 'groupid', 'userid', 'photourl', 'authorid',
      'createdat', 'updatedat', 'asc', 'desc', 'true', 'false', 'null', 'undefined',
      'member', 'admin', 'mestre', 'bureau', 'active', 'inactive', 'pending',
      'repetition', 'prestation', 'atelier', 'autre', 'stage', 'reunion', 'general',
      'alfaia', 'caixa', 'tarol', 'gongue', 'agbe', 'mineiro', 'apito', 'danse',
      'timbal', 'tous', 'pause', 'repere', 'reflexes', 'conducteurs', 'presets',
      'toadas', 'culture', 'signesmestre', 'photosprestations', 'comptesrendus',
      'administratif', 'tutosfabrication', 'costumes', 'costumerie', 'artisanat'
    ];
    if (technicalKeywords.includes(trimmed.toLowerCase())) return false;
  }

  return true;
}

// 3. Générateur de clé i18n dans le namespace mestre
function suggestKey(prefix, text) {
  const clean = text
    .replace(/[^\w\sÀ-ÿ]/gi, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word, idx) => idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return `mestre.${prefix}${clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Label'}`;
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

  traverse(ast, {
    // 1. Nœuds JSX textuels bruts
    JSXText(nodePath) {
      const raw = nodePath.node.value.trim();
      if (!isTextualString(raw)) return;

      const parentTag = nodePath.parent?.openingElement?.name?.name || 'JSX';
      let context = 'Nœud JSX';
      if (parentTag === 'option') context = 'Option select';
      else if (parentTag === 'th') context = 'En-tête th';
      else if (parentTag === 'button') context = 'Bouton';
      else if (/^h[1-6]$/.test(parentTag)) context = 'Titre';
      else if (parentTag === 'p') context = 'Paragraphe';
      else if (parentTag === 'span') context = 'Span / Badge';
      else if (parentTag === 'label') context = 'Label de champ';

      items.push({
        line: nodePath.node.loc.start.line,
        text: raw,
        context,
        suggestedKey: suggestKey(category, raw)
      });
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

        if (val && isTextualString(val)) {
          items.push({
            line: nodePath.node.loc.start.line,
            text: val.trim(),
            context: `Attribut ${attrName}`,
            suggestedKey: suggestKey(category, val)
          });
        }
      }
    },

    // 3. Messages runtime (alert, confirm, toasts)
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      let fnName = '';
      if (callee.type === 'Identifier') {
        fnName = callee.name;
      } else if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
        fnName = callee.property.name;
      }

      const alertFns = ['alert', 'confirm', 'showToast', 'toast', 'notify'];
      if (alertFns.includes(fnName)) {
        const arg0 = nodePath.node.arguments[0];
        if (arg0?.type === 'StringLiteral' && isTextualString(arg0.value)) {
          items.push({
            line: nodePath.node.loc.start.line,
            text: arg0.value.trim(),
            context: `Message runtime (${fnName})`,
            suggestedKey: suggestKey(category, arg0.value)
          });
        }
      }
    },

    // 4. Chaînes statiques dans des tableaux/objets de configuration
    ObjectProperty(nodePath) {
      const keyName = nodePath.node.key?.name || nodePath.node.key?.value;
      if (['label', 'title', 'header', 'name', 'message'].includes(keyName)) {
        if (nodePath.node.value?.type === 'StringLiteral') {
          const val = nodePath.node.value.value;
          if (isTextualString(val)) {
            if (nodePath.parentPath?.isObjectExpression()) {
              const props = nodePath.parent.properties.map(p => p.key?.name || p.key?.value);
              if (props.includes('key') || props.includes('id') || props.includes('value') || props.includes('tab') || props.includes('status')) {
                items.push({
                  line: nodePath.node.loc.start.line,
                  text: val.trim(),
                  context: `Config statique (${keyName})`,
                  suggestedKey: suggestKey(category, val)
                });
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
console.log('🔍 Démarrage de l\'audit statique i18n — Pôle Mestria (Direction Artistique)...\n');

const auditResults = {};
let grandTotal = 0;

for (const [subKey, subModule] of Object.entries(mestreSubModules)) {
  console.log(`📋 Audit : ${subModule.name}...`);
  auditResults[subKey] = {
    name: subModule.name,
    category: subModule.category,
    totalStrings: 0,
    cleanFiles: [],
    dirtyFiles: []
  };

  for (const file of subModule.files) {
    const res = analyzeFile(file, subModule.category);
    if (res.error) {
      console.warn(`  ⚠️  ${file}: ${res.error}`);
      continue;
    }

    if (res.items.length === 0) {
      auditResults[subKey].cleanFiles.push(file);
    } else {
      auditResults[subKey].dirtyFiles.push({
        file,
        count: res.items.length,
        items: res.items
      });
      auditResults[subKey].totalStrings += res.items.length;
      grandTotal += res.items.length;
    }
  }
}

console.log(`\n✅ Audit terminé avec succès. Total des chaînes brutes détectées : ${grandTotal}`);

// 6. Sauvegarde des données JSON brutes
const outputPath = path.join(rootDir, 'scripts/audit_mestre_results.json');
fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`📁 Données brutes JSON enregistrées : scripts/audit_mestre_results.json`);
