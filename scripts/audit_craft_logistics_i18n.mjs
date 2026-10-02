/**
 * Script d'audit statique exhaustif i18n — Pôles Logistique, Lutherie & Costumerie
 * Mode : LECTURE SEULE STRICTE (Aucune modification des sources)
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

// 1. Définition des fichiers cibles par pôle
const targetPoles = {
  logistics: {
    name: 'Pôle Logistique',
    namespace: 'logistics',
    files: [
      'src/components/InventoryManager.jsx',
      'src/components/inventory/InventoryItemCard.jsx',
      'src/components/inventory/InventoryItemModal.jsx',
      'src/components/inventory/InstrumentsDataTable.jsx',
      'src/components/inventory/InstrumentEditModal.jsx',
      'src/components/inventory/RepairDiagnosticModal.jsx',
      'src/components/inventory/InstrumentAttributionSection.jsx',
      'src/components/inventory/InstrumentCautionFields.jsx',
      'src/components/inventory/InventoryFilterBar.jsx',
      'src/components/inventory/InventoryMovementsBanner.jsx',
      'src/components/inventory/InstrumentVisualizer.jsx',
      'src/components/OrdersManager.jsx',
      'src/components/orders/OrderPaymentControls.jsx',
      'src/components/orders/MemberOrdersPaymentAlert.jsx',
      'src/components/association-settings/blocks/AccessoriesKitsBlock.jsx',
      'src/components/profile/UserMateriel.jsx'
    ]
  },
  lutherie: {
    name: 'Pôle Lutherie & Artisanat Instrumental',
    namespace: 'lutherie',
    files: [
      'src/components/inventory/InventoryProjectsView.jsx',
      'src/components/inventory/AssemblySlotItem.jsx',
      'src/components/inventory/InstrumentBaptismModal.jsx',
      'src/components/inventory/ImportModelWizardModal.jsx',
      'src/components/varal/InstrumentModelsManager.jsx',
      'src/components/inventory/InventoryPartsView.jsx',
      'src/components/inventory/PartAssignmentBadge.jsx',
      'src/components/inventory/PartHistoryLogs.jsx',
      'src/components/inventory/PartWorkflowModal.jsx',
      'src/components/inventory/SuppliesListView.jsx',
      'src/components/inventory/WorkshopToolsListView.jsx',
      'src/components/profile/StudentInstrumentsWorkshop.jsx',
      'src/components/profile/MonAtelier.jsx'
    ]
  },
  costumerie: {
    name: 'Pôle Costumerie & Artisanat Textile',
    namespace: 'costumerie',
    files: [
      'src/components/mestre/WardrobeManager.jsx',
      'src/components/mestre/CostumesAdminManager.jsx',
      'src/components/mestre/CostumeSizesTable.jsx',
      'src/components/profile/MonVestiaire.jsx',
      'src/components/profile/CostumeVisualizer.jsx',
      'src/components/profile/CostumeChecklist.jsx',
      'src/components/profile/PostEventCostumeReturnModal.jsx',
      'src/components/profile/AtelierCouture.jsx',
      'src/components/profile/CollectiveWorkshopView.jsx',
      'src/components/association-settings/blocks/WardrobeBlock.jsx',
      'src/components/association-settings/modules/WardrobeMemberModeCard.jsx',
      'src/components/documents/CostumerieDocumentsTable.jsx',
      'src/components/event-details/EventWardrobeSummaryCard.jsx'
    ]
  }
};

// Fonctions utilitaires de filtrage
function isTextualString(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length < 2) return false;
  // Doit contenir au moins 2 lettres consécutives (avec accents)
  if (!/[a-zA-ZÀ-ÿ]{2,}/.test(trimmed)) return false;
  // Ignorer les classes CSS probables (ex: "flex items-center gap-2", "text-xs font-bold")
  if (/^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|col-|row-|rounded-|shadow-|transition-|cursor-|overflow-)/.test(trimmed)) {
    return false;
  }
  // Ignorer les URLs, chemins de fichiers, couleurs hexadécimales, formats techniques
  if (/^(https?:\/\/|\/|#|data:|rgba?\(|\.\/|\.\.\/|[a-z0-9_.-]+@[a-z0-9_.-]+)/i.test(trimmed)) return false;
  // Ignorer les clés Firestore usuelles ou identifiants
  if (/^[a-z0-9_]+$/i.test(trimmed) && trimmed.length <= 15 && !trimmed.includes(' ')) {
    const commonTechnicalKeys = [
      'id', 'key', 'name', 'type', 'status', 'date', 'desc', 'title', 'role',
      'action', 'label', 'value', 'amount', 'total', 'count', 'items', 'users',
      'events', 'notes', 'tags', 'groupId', 'userId', 'photoUrl', 'authorId',
      'createdAt', 'updatedAt', 'asc', 'desc', 'true', 'false', 'null', 'undefined',
      'member', 'admin', 'mestre', 'bureau', 'active', 'inactive', 'pending',
      'repetition', 'prestation', 'atelier', 'autre', 'stage', 'reunion', 'general',
      'alfaia', 'caixa', 'tarol', 'gongue', 'agbe', 'mineiro', 'apito', 'danse'
    ];
    if (commonTechnicalKeys.includes(trimmed.toLowerCase())) return false;
  }
  return true;
}

// Générateur de clé de suggestion
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
  return `${prefix}.${clean || 'label'}`;
}

// Analyse d'un fichier source
function analyzeFile(filePath, namespace) {
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
    // 1. Textes bruts dans les balises JSX
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
        suggestedKey: suggestKey(namespace, raw)
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
          // Ignorer si c'est déjà un appel de traduction
          items.push({
            line: nodePath.node.loc.start.line,
            text: val.trim(),
            context: `Attribut ${attrName}`,
            suggestedKey: suggestKey(namespace, val)
          });
        }
      }
    },

    // 3. Dialogues et messages runtime (alert, confirm, showToast, etc.)
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
            context: `Dialogue / Message (${fnName})`,
            suggestedKey: suggestKey(namespace, arg0.value)
          });
        }
      }
    },

    // 4. Chaînes statiques dans des tableaux/objets de configuration (ex: colonnes, onglets)
    ObjectProperty(nodePath) {
      const keyName = nodePath.node.key?.name || nodePath.node.key?.value;
      if (['label', 'title', 'header', 'name'].includes(keyName)) {
        if (nodePath.node.value?.type === 'StringLiteral') {
          const val = nodePath.node.value.value;
          if (isTextualString(val)) {
            // Vérifier que ce n'est pas un champ technique comme name="email"
            if (nodePath.parentPath?.isObjectExpression()) {
              // Vérifier si un sibling est key / id / type (signe de structure de colonne ou tab)
              const props = nodePath.parent.properties.map(p => p.key?.name || p.key?.value);
              if (props.includes('key') || props.includes('id') || props.includes('value') || props.includes('tab')) {
                items.push({
                  line: nodePath.node.loc.start.line,
                  text: val.trim(),
                  context: `Configuration statique (propriété ${keyName})`,
                  suggestedKey: suggestKey(namespace, val)
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
console.log('🔍 Démarrage de l\'audit statique i18n — Pôles Logistique, Lutherie & Costumerie...\n');

const auditResults = {};
let grandTotal = 0;

for (const [poleKey, pole] of Object.entries(targetPoles)) {
  console.log(`📋 Audit du ${pole.name}...`);
  auditResults[poleKey] = {
    name: pole.name,
    namespace: pole.namespace,
    totalStrings: 0,
    cleanFiles: [],
    dirtyFiles: []
  };

  for (const file of pole.files) {
    const res = analyzeFile(file, pole.namespace);
    if (res.error) {
      console.warn(`  ⚠️  ${file}: ${res.error}`);
      continue;
    }

    if (res.items.length === 0) {
      auditResults[poleKey].cleanFiles.push(file);
    } else {
      auditResults[poleKey].dirtyFiles.push({
        file,
        count: res.items.length,
        items: res.items
      });
      auditResults[poleKey].totalStrings += res.items.length;
      grandTotal += res.items.length;
    }
  }
}

console.log(`\n✅ Audit terminé avec succès. Total des chaînes brutes détectées : ${grandTotal}`);

// 6. Sauvegarde des résultats au format JSON pour consultation
const outputPath = path.join(rootDir, 'scripts/audit_craft_logistics_results.json');
fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`📁 Fichier de résultats généré : scripts/audit_craft_logistics_results.json`);
