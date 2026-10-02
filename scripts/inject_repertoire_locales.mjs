import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const map = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/repertoire_bilingual_map.json'), 'utf8'));

// Construction des dictionnaires { key: value }
const frRepertoire = {};
const ptRepertoire = {};

for (const [text, info] of Object.entries(map)) {
  frRepertoire[info.key] = info.fr;
  ptRepertoire[info.key] = info.pt;
}

// Formatage en code JavaScript
function formatObject(obj, indentLevel = 4) {
  const indent = ' '.repeat(indentLevel);
  const lines = Object.entries(obj).map(([k, v]) => {
    const escaped = JSON.stringify(v);
    return `${indent}  ${k}: ${escaped},`;
  });
  return lines.join('\n');
}

const frContent = fs.readFileSync(path.join(rootDir, 'src/locales/fr.js'), 'utf8');
const ptContent = fs.readFileSync(path.join(rootDir, 'src/locales/pt.js'), 'utf8');

// Injection sous mestre: { ... }
// On cible la fin de mestre: { ... }, juste avant la virgule de fermeture
const targetMarker = 'workshopDeleteConfirm: "Voulez-vous vraiment supprimer cette fiche d\'atelier ?"';

if (!frContent.includes('// --- Pôle Mestria : Lot 1 Répertoire & Modales ---')) {
  if (!frContent.includes(targetMarker)) {
    throw new Error("Target marker non trouvé dans fr.js");
  }

  const frReplacement = `${targetMarker},

    // --- Pôle Mestria : Lot 1 Répertoire & Modales ---
    repertoire: {
${formatObject(frRepertoire, 6)}
    }`;

  const newFrContent = frContent.replace(targetMarker, frReplacement);
  fs.writeFileSync(path.join(rootDir, 'src/locales/fr.js'), newFrContent, 'utf8');
  console.log('✅ Ingestion Répertoire réussie dans src/locales/fr.js');
} else {
  console.log('ℹ️ Répertoire déjà présent dans src/locales/fr.js');
}

const targetMarkerPt = 'workshopDeleteConfirm: "Deseja realmente excluir esta ficha de oficina?"';
if (!ptContent.includes(targetMarkerPt)) {
  throw new Error("Target marker non trouvé dans pt.js");
}

const ptReplacement = `${targetMarkerPt},

    // --- Pôle Mestria : Lot 1 Répertoire & Modales ---
    repertoire: {
${formatObject(ptRepertoire, 6)}
    }`;

const newPtContent = ptContent.replace(targetMarkerPt, ptReplacement);
fs.writeFileSync(path.join(rootDir, 'src/locales/pt.js'), newPtContent, 'utf8');
console.log('✅ Ingestion Répertoire réussie dans src/locales/pt.js');
