/**
 * Injection automatique des clés bilingues FR & PT pour le Pôle Pédagogie (Lot 2)
 * Sous-namespaces :
 * - pedagogy.carnet
 * - pedagogy.reflex
 * - pedagogy.progress
 * - pedagogy.cards
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const map = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/pedagogy_lot2_bilingual_map.json'), 'utf8'));

// Formatage en code JavaScript avec indentation
function formatCategory(catObj, lang, indentLevel = 4) {
  const subIndent = ' '.repeat(indentLevel + 2);
  const lines = [];

  for (const [key, info] of Object.entries(catObj)) {
    const val = info[lang];
    lines.push(`${subIndent}${key}: ${JSON.stringify(val)},`);
  }

  return lines.join('\n');
}

function buildLot2Snippet(lang) {
  return `
    // --- Pôle Pédagogie : Lot 2 (Carnet d'Aisance, Défis Réflexes & Progression) ---
    carnet: {
${formatCategory(map.carnet, lang, 4)}
    },

    reflex: {
${formatCategory(map.reflex, lang, 4)}
    },

    progress: {
${formatCategory(map.progress, lang, 4)}
    },

    cards: {
${formatCategory(map.cards, lang, 4)}
    }`;
}

function updateLocaleFile(filePath, lang) {
  let content = fs.readFileSync(filePath, 'utf8');
  const startMarker = '// --- Pôle Pédagogie : Lot 2 (Carnet d\'Aisance, Défis Réflexes & Progression) ---';
  const endMarker = '  },\n  treasury: {';

  const newSnippet = buildLot2Snippet(lang);

  if (content.includes(startMarker)) {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
      throw new Error(`Fin de bloc non trouvée pour ${filePath}`);
    }
    content = content.slice(0, startIndex) + newSnippet.trim() + '\n' + content.slice(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🔄 Bloc Pédagogie Lot 2 mis à jour avec succès dans ${path.basename(filePath)}`);
  } else {
    // Insérer juste avant '  },\n  treasury: {'
    const target = '    engine: {\n';
    if (!content.includes('engine: {')) {
      throw new Error(`engine: { non trouvé dans ${filePath}`);
    }
    const engineEndIndex = content.indexOf('    }', content.indexOf('engine: {'));
    if (engineEndIndex === -1) {
      throw new Error(`Fin de engine non trouvée dans ${filePath}`);
    }
    const insertPos = engineEndIndex + '    }'.length;
    content = content.slice(0, insertPos) + ',' + newSnippet + content.slice(insertPos);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Ingestion Pédagogie Lot 2 réussie dans ${path.basename(filePath)}`);
  }
}

// 1. Injection dans fr.js
const frPath = path.join(rootDir, 'src/locales/fr.js');
updateLocaleFile(frPath, 'fr');

// 2. Injection dans pt.js
const ptPath = path.join(rootDir, 'src/locales/pt.js');
updateLocaleFile(ptPath, 'pt');
