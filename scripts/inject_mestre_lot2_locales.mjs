/**
 * Injection automatique des clés bilingues FR & PT pour le Pôle Mestria (Lot 2)
 * Sous-namespaces :
 * - mestre.sequenceur
 * - mestre.stageLayout
 * - mestre.editorial
 * - mestre.casting
 * - mestre.pedagogy
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const map = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/mestre_lot2_bilingual_map.json'), 'utf8'));

// Formatage en code JavaScript avec indentation
function formatCategory(catObj, lang, indentLevel = 4) {
  const indent = ' '.repeat(indentLevel);
  const subIndent = ' '.repeat(indentLevel + 2);
  const lines = [];

  for (const [text, info] of Object.entries(catObj)) {
    const val = info[lang];
    lines.push(`${subIndent}${info.key}: ${JSON.stringify(val)},`);
  }

  return lines.join('\n');
}

function buildNamespaceSnippet(lang) {
  return `
    // --- Pôle Mestria : Lot 2 (Passerelle Séquenceur, Presets & Signes) ---
    sequenceur: {
${formatCategory(map.sequenceur, lang, 6)}
    },

    // --- Pôle Mestria : Lot 2 (Régie Scénique & Plateau) ---
    stageLayout: {
${formatCategory(map.stageLayout, lang, 6)}
    },

    // --- Pôle Mestria : Lot 2 (Consignes Artistiques & Mot du Mestre) ---
    editorial: {
${formatCategory(map.editorial, lang, 6)}
    },

    // --- Pôle Mestria : Lot 2 (Orientation, Casting, Quotas & Disciplines) ---
    casting: {
${formatCategory(map.casting, lang, 6)}
    },

    // --- Pôle Mestria : Lot 2 (Pédagogie, Points Chauds, Bloc-notes & Auto-éval) ---
    pedagogy: {
${formatCategory(map.pedagogy, lang, 6)}
    }`;
}

// 1. Injection dans fr.js
const frPath = path.join(rootDir, 'src/locales/fr.js');
let frContent = fs.readFileSync(frPath, 'utf8');

const frTarget = `        repertoireSheetPrefix: "Fiche Répertoire :",
    }`;

if (!frContent.includes(frTarget)) {
  throw new Error("Target marker frTarget non trouvé dans fr.js !");
}

const frSnippet = buildNamespaceSnippet('fr');
const frReplacement = `${frTarget},
${frSnippet}`;

frContent = frContent.replace(frTarget, frReplacement);
fs.writeFileSync(frPath, frContent, 'utf8');
console.log('✅ Ingestion Mestria Lot 2 réussie dans src/locales/fr.js');

// 2. Injection dans pt.js
const ptPath = path.join(rootDir, 'src/locales/pt.js');
let ptContent = fs.readFileSync(ptPath, 'utf8');

const ptTarget = `        repertoireSheetPrefix: "Ficha do Repertório:",
    }`;

if (!ptContent.includes(ptTarget)) {
  throw new Error("Target marker ptTarget non trouvé dans pt.js !");
}

const ptSnippet = buildNamespaceSnippet('pt');
const ptReplacement = `${ptTarget},
${ptSnippet}`;

ptContent = ptContent.replace(ptTarget, ptReplacement);
fs.writeFileSync(ptPath, ptContent, 'utf8');
console.log('✅ Ingestion Mestria Lot 2 réussie dans src/locales/pt.js');
