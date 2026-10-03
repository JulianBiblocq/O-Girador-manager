/**
 * Injection automatique des clés bilingues FR & PT pour le Pôle Pédagogie (Lot 1)
 * Sous-namespaces :
 * - pedagogy.student
 * - pedagogy.modals
 * - pedagogy.admin
 * - pedagogy.engine
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const map = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/pedagogy_lot1_bilingual_map.json'), 'utf8'));

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

function buildNamespaceSnippet(lang) {
  return `    // --- Pôle Pédagogie : Lot 1 (Espace Élève & Suivi Adhérent) ---
    student: {
${formatCategory(map.student, lang, 4)}
    },

    // --- Pôle Pédagogie : Lot 1 (Modales & Vues d'Apprentissage par Morceau) ---
    modals: {
${formatCategory(map.modals, lang, 4)}
    },

    // --- Pôle Pédagogie : Lot 1 (Administration & Outils Pédagogiques Mestria) ---
    admin: {
${formatCategory(map.admin, lang, 4)}
    },

    // --- Pôle Pédagogie : Lot 1 (Moteurs de Génération & Évaluation) ---
    engine: {
${formatCategory(map.engine, lang, 4)}
    }`;
}

function updateLocaleFile(filePath, lang, targetMarker) {
  let content = fs.readFileSync(filePath, 'utf8');
  const startMarker = '// --- Pôle Pédagogie : Lot 1 (Espace Élève & Suivi Adhérent) ---';
  const endMarker = '  },\n  treasury: {';

  const newSnippet = buildNamespaceSnippet(lang);

  if (content.includes(startMarker)) {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
      throw new Error(`Fin de bloc non trouvée pour ${filePath}`);
    }
    content = content.slice(0, startIndex) + newSnippet + '\n' + content.slice(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🔄 Bloc Pédagogie Lot 1 mis à jour avec succès dans ${path.basename(filePath)}`);
  } else {
    if (!content.includes(targetMarker)) {
      throw new Error(`Target marker non trouvé dans ${filePath}`);
    }
    const replacement = `${targetMarker},\n\n${newSnippet}`;
    content = content.replace(targetMarker, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Ingestion Pédagogie Lot 1 réussie dans ${path.basename(filePath)}`);
  }
}

// 1. Injection dans fr.js
const frPath = path.join(rootDir, 'src/locales/fr.js');
const frTarget = `    challengeExquisiteCorpseTitle: "Cadavre exquis (Coopération)",
    challengeExquisiteCorpseDesc: "Relais polyrythmique en chaîne et délibération au Conseil de Batterie",
    btnCancelChallenge: "Annuler"`;
updateLocaleFile(frPath, 'fr', frTarget);

// 2. Injection dans pt.js
const ptPath = path.join(rootDir, 'src/locales/pt.js');
const ptTarget = `    challengeExquisiteCorpseTitle: "Desafio em Cadeia (Cooperação)",
    challengeExquisiteCorpseDesc: "Revezamento polirrítmico em cadeia e deliberação no Conselho de Bateria",
    btnCancelChallenge: "Cancelar"`;
updateLocaleFile(ptPath, 'pt', ptTarget);
