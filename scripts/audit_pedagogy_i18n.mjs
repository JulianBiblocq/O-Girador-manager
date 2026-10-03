/**
 * Script d'audit statique exhaustif i18n — Pôle Pédagogie & Progression
 * Mode : LECTURE SEULE STRICTE (Aucune modification des sources, schémas ou règles)
 *
 * Utilise Babel Parser (@babel/parser) et Traverser (@babel/traverse) pour extraire :
 * 1. Textes bruts dans les nœuds JSX
 * 2. Attributs textuels (placeholder, title, label, aria-label, alt)
 * 3. Options select, colonnes statiques et tableaux de configuration
 * 4. Messages runtime (alert, confirm, toasts, notifications, setters d'erreurs)
 * 5. Textes bruts dans les moteurs d'évaluation et de quiz
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

// 1. Définition des 5 périmètres pédagogiques cibles
const pedagogyPoles = {
  pedagogy: {
    name: 'Espace Pédagogie & Progression',
    category: 'pedagogy',
    subNamespace: 'progression',
    files: [
      'src/components/pedagogy/MonParcours.jsx',
      'src/components/pedagogy/MonCarnetAisance.jsx',
      'src/components/pedagogy/AutoEvalQuiz.jsx',
      'src/components/pedagogy/MestreToadasAnalytics.jsx',
      'src/components/pedagogy/AtelierModelPartsProgress.jsx',
      'src/components/pedagogy/AtelierEntrainement.jsx',
      'src/components/pedagogy/BlindTestTrialModal.jsx',
      'src/components/pedagogy/CarnetPercussionSection.jsx',
      'src/components/pedagogy/ConductorGameModal.jsx',
      'src/components/pedagogy/CultureFichesTable.jsx',
      'src/components/pedagogy/DailyRevisionSession.jsx',
      'src/components/pedagogy/DanseChoregraphieAnalytics.jsx',
      'src/components/pedagogy/DanseItemRow.jsx',
      'src/components/pedagogy/DefisSummaryCard.jsx',
      'src/components/pedagogy/EntrainementMacroAnalytics.jsx',
      'src/components/pedagogy/EntrainementSegmentsBar.jsx',
      'src/components/pedagogy/MestreQuizConfigManager.jsx',
      'src/components/pedagogy/MestreSignalsManager.jsx',
      'src/components/pedagogy/MonParcoursGuideBanner.jsx',
      'src/components/pedagogy/PatternVisualizer.jsx',
      'src/components/pedagogy/PedagogyDocumentsView.jsx',
      'src/components/pedagogy/PercussionPieceRow.jsx',
      'src/components/pedagogy/PercussionRepertoireAnalytics.jsx',
      'src/components/pedagogy/QcmSignaux.jsx',
      'src/components/pedagogy/QuizDistractorManager.jsx',
      'src/components/pedagogy/ReflexGameModal.jsx',
      'src/components/pedagogy/RodaQuizHeaderButton.jsx',
      'src/components/pedagogy/RodaQuizStatsBanner.jsx',
      'src/components/pedagogy/SignauxTrialModal.jsx',
      'src/components/pedagogy/ToadasTable.jsx',
      'src/components/pedagogy/TrainingCompactCard.jsx',
      'src/components/pedagogy/conductor/ConductorAudioPlayer.jsx',
      'src/components/pedagogy/conductor/ConductorMeasureSlot.jsx',
      'src/components/pedagogy/conductor/ConductorSignalPickerSheet.jsx',
      'src/components/pedagogy/conductor/ConductorTimeline.jsx',
      'src/components/pedagogy/reflex/ReflexGameBoard.jsx',
      'src/components/pedagogy/reflex/ReflexSignalBanner.jsx',
      'src/components/SongCard.jsx',
      'src/components/CultureCard.jsx'
    ]
  },
  student: {
    name: 'Espace Élève & Suivi Adhérent',
    category: 'student',
    subNamespace: 'student',
    files: [
      'src/components/student/AutoEvalQuizContainer.jsx',
      'src/components/student/FirestoreMediaRenderer.jsx',
      'src/components/student/StudentToadasProgress.jsx',
      'src/components/profile/StudentInstrumentsWorkshop.jsx',
      'src/components/profile/PieceTutorialModal.jsx'
    ]
  },
  member: {
    name: 'Modales & Vues d\'Apprentissage par Morceau',
    category: 'member',
    subNamespace: 'repertoireLearning',
    files: [
      'src/components/member/PieceLyricsModal.jsx',
      'src/components/member/PieceCultureModal.jsx',
      'src/components/member/PieceSignalsModal.jsx',
      'src/components/member/PieceQuizModal.jsx',
      'src/components/member/PieceAisanceSection.jsx',
      'src/components/member/MemberPieceCard.jsx',
      'src/components/member/MemberPieceUnfoldedContent.jsx',
      'src/components/member/MemberRepertoireHeader.jsx',
      'src/components/member/MemberRepertoireView.jsx',
      'src/components/member/MemberMediaModals.jsx'
    ]
  },
  mestre: {
    name: 'Administration & Outils Pédagogiques Mestria',
    category: 'mestre',
    subNamespace: 'mestreAdmin',
    files: [
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
      'src/components/mestre/TablatureModal.jsx',
      'src/components/mestre/VideoInstrumentCheckboxes.jsx'
    ]
  },
  engines: {
    name: 'Moteurs de Génération & Logique d\'Évaluation',
    category: 'engines',
    subNamespace: 'engines',
    files: [
      'src/utils/quizGenerator.js',
      'src/utils/quizI18nEngine.js',
      'src/utils/quizSanitizer.js',
      'src/utils/translationQuizEngine.js',
      'src/utils/gameQuizGenerator.js',
      'src/utils/reflexGameUtils.js',
      'src/utils/conductorGameUtils.js',
      'src/utils/aisanceStagesUtils.js',
      'src/utils/spacedRepetitionEngine.js',
      'src/utils/pedagogyDashboardCalculations.js',
      'src/utils/toadaProgressEngine.js',
      'src/utils/trainingLauncher.js',
      'src/services/aisanceService.js'
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
  if (/^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|col-|row-|rounded-|shadow-|transition-|cursor-|overflow-|max-|min-|gap-|items-|justify-|leading-|font-|tracking-|animate-|z-|select-|outline-)/.test(trimmed)) {
    return false;
  }

  // Ignorer les URLs, data URLs, chemins de fichiers, SVG paths, formats mime
  if (/^(https?:\/\/|\/|#|data:|rgba?\(|\.\/|\.\.\/|[a-z0-9_.-]+@[a-z0-9_.-]+|image\/|audio\/|video\/)/i.test(trimmed)) {
    return false;
  }

  // Ignorer les noms de classes CSS complexes ou listes de classes
  if (trimmed.split(/\s+/).every(token => /^(flex|grid|block|inline|hidden|text-|bg-|p-|m-|border-|w-|h-|rounded-|shadow-|gap-|items-|justify-|font-)/.test(token))) {
    return false;
  }

  // Ignorer les clés Firestore, paramètres ou constantes techniques usuelles
  const technicalKeywords = [
    'id', 'key', 'name', 'type', 'status', 'date', 'desc', 'title', 'role',
    'action', 'label', 'value', 'amount', 'total', 'count', 'items', 'users',
    'events', 'notes', 'tags', 'groupId', 'userId', 'photoUrl', 'authorId',
    'createdAt', 'updatedAt', 'asc', 'desc', 'true', 'false', 'null', 'undefined',
    'audioUrl', 'videoUrl', 'presetId', 'trainingId', 'stageIndex', 'pieceId',
    'tempo', 'bpm', 'stagesCompleted', 'lastAttempt', 'highScore', 'history',
    'alfaia', 'caixa', 'tarol', 'gongue', 'agbe', 'mineiro', 'apito', 'danse',
    'percussion', 'chant', 'costume', 'direction', 'member', 'admin', 'mestre',
    'reflexes', 'conducteurs', 'repere', 'pause', 'distractors', 'signalId',
    'speed', 'pitch', 'loop', 'volume', 'muted', 'playing', 'paused', 'ready'
  ];

  if (/^[a-zA-Z0-9_]+$/.test(trimmed) && trimmed.length <= 25 && !trimmed.includes(' ')) {
    if (technicalKeywords.includes(trimmed.toLowerCase())) return false;
  }

  // Ignorer les balises ou attributs SVG
  if (/^(M\s*\d+|matrix|rotate|scale|translate|evenodd|nonzero)/i.test(trimmed)) {
    return false;
  }

  return true;
}

// 3. Générateur de suggestion de clé sous le namespace "pedagogy"
function suggestPedagogyKey(subNamespace, fileName, text) {
  // Dériver un nom de composant concis
  const baseName = path.basename(fileName, path.extname(fileName))
    .replace(/(Modal|Card|Section|View|Table|Banner|Picker|Manager|Container|Editor)$/, '')
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

  return `pedagogy.${subNamespace}.${baseName}.${slug || 'label'}`;
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

  // Fonction d'enregistrement évitant les doublons stricts sur la même ligne
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
      suggestedKey: suggestPedagogyKey(subNamespace, fileName, trimmed)
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
      // Ignorer si le parent est un attribut déjà inspecté
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
          // Vérifier si la partie gauche est un appel t(...)
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

      // Ignorer formellement les appels de traduction t(...)
      if (fnName === 't') return;

      const alertFns = ['alert', 'confirm', 'showToast', 'toast', 'notify', 'setErrorMessage', 'setErrorAlert', 'setOrderAlertMessage'];
      if (alertFns.includes(fnName)) {
        const arg0 = nodePath.node.arguments[0];
        if (arg0?.type === 'StringLiteral') {
          recordItem(nodePath.node.loc.start.line, arg0.value, `Message runtime (${fnName})`, 'runtime');
        }
      }
    },

    // 5. Propriétés textuelles d'objets statiques de configuration
    ObjectProperty(nodePath) {
      const keyName = nodePath.node.key?.name || nodePath.node.key?.value;
      const targetProps = ['label', 'title', 'header', 'name', 'description', 'question', 'hint', 'category', 'subLabel', 'emptyText', 'placeholder'];

      if (targetProps.includes(keyName)) {
        if (nodePath.node.value?.type === 'StringLiteral') {
          const val = nodePath.node.value.value;
          // Vérifier que ce n'est pas un identifiant technique ou une clé de route
          if (isTextualString(val) && !val.startsWith('http') && !val.startsWith('/') && !val.includes('.')) {
            // Vérifier si l'objet contient des propriétés sœurs typiques de configuration UI
            if (nodePath.parentPath?.isObjectExpression()) {
              const siblingKeys = nodePath.parent.properties.map((p) => p.key?.name || p.key?.value);
              const isUIConfig = siblingKeys.some((k) => ['key', 'id', 'value', 'tab', 'onClick', 'icon', 'badge', 'action'].includes(k));
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
console.log('🔍 Démarrage de l\'audit statique exhaustif i18n — Pôle Pédagogie & Progression...\n');

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

for (const [poleKey, pole] of Object.entries(pedagogyPoles)) {
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
console.log(`✅ Audit Pédagogie terminé avec succès.`);
console.log(`📁 Total fichiers audités : ${totalFiles}`);
console.log(`✨ Fichiers 100% propres (i18n ready) : ${totalClean}`);
console.log(`⚠️  Fichiers comportant des chaînes en dur : ${totalDirty}`);
console.log(`🔤 Total général des chaînes brutes détectées : ${grandTotal}`);
console.log(`======================================================\n`);

// 6. Sauvegarde des données brutes en JSON
const outputPath = path.join(rootDir, 'scripts/audit_pedagogy_results.json');
fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`💾 Fichier de données JSON généré : scripts/audit_pedagogy_results.json`);
