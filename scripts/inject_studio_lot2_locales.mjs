// Script d'injection des dictionnaires FR / PT pour le Studio Lot 2 (Communication & Lexique)
import fs from 'fs';
import path from 'path';

const frPath = path.resolve('src/locales/fr.js');
const ptPath = path.resolve('src/locales/pt.js');
const mappingsPath = path.resolve('scripts/studio_lot2_mappings.json');

const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

function formatSection(name, obj) {
  const lines = Object.entries(obj).map(([key, val]) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    return '      ' + safeKey + ': ' + JSON.stringify(val) + ',';
  });
  return ',\n\n    ' + name + ': {\n' + lines.join('\n') + '\n    }';
}

function injectIntoLocale(filePath, commObj, lexObj) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Trouver l'accolade fermante de studio: { ... }
  const idxStudio = content.indexOf('studio: {');
  if (idxStudio === -1) throw new Error('studio: { non trouvé dans ' + filePath);

  let depth = 0;
  let studioEnd = -1;
  for (let i = idxStudio; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        studioEnd = i;
        break;
      }
    }
  }

  if (studioEnd === -1) throw new Error('Fin de studio: non trouvée dans ' + filePath);

  const commFormatted = formatSection('communication', commObj);
  const lexFormatted = formatSection('lexique', lexObj);

  const updatedContent = content.slice(0, studioEnd) + commFormatted + lexFormatted + '\n  ' + content.slice(studioEnd);
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Injecté avec succès dans ${filePath}`);
}

injectIntoLocale(frPath, mappings.communication.fr, mappings.lexique.fr);
injectIntoLocale(ptPath, mappings.communication.pt, mappings.lexique.pt);
