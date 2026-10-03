/**
 * Script d'injection symétrique des traductions Studio Lot 1 dans fr.js et pt.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const bilingualMap = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/studio_lot1_bilingual_map.json'), 'utf8'));

// Formatage d'un bloc d'objet JS pour fr ou pt
function formatStudioObject(lang) {
  let out = ',\n\n  studio: {\n';
  
  // 1. Newsletter
  out += '    newsletter: {\n';
  for (const [key, val] of Object.entries(bilingualMap.newsletter)) {
    const text = val[lang].replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    out += `      ${key}: "${text}",\n`;
  }
  out += '    },\n\n';

  // 2. Photos
  out += '    photos: {\n';
  for (const [key, val] of Object.entries(bilingualMap.photos)) {
    const text = val[lang].replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    out += `      ${key}: "${text}",\n`;
  }
  out += '    }\n';

  out += '  }';
  return out;
}

const frBlock = formatStudioObject('fr');
const ptBlock = formatStudioObject('pt');

// Injection dans fr.js
const frPath = path.join(rootDir, 'src/locales/fr.js');
let frContent = fs.readFileSync(frPath, 'utf8');

// Si studio existe déjà, le remplacer, sinon l'insérer avant le dernier };
if (frContent.includes('studio: {\n    newsletter: {')) {
  frContent = frContent.replace(/,\r?\n\s*studio: \{\r?\n\s*newsletter:[\s\S]*?\n  \}/, frBlock);
} else {
  const lastClosing = frContent.lastIndexOf('};');
  if (lastClosing === -1) throw new Error("Impossible de trouver '};' dans fr.js");
  frContent = frContent.substring(0, lastClosing) + frBlock + '\n' + frContent.substring(lastClosing);
}

// Vérification syntaxique Babel de fr.js
try {
  parser.parse(frContent, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  fs.writeFileSync(frPath, frContent, 'utf8');
  console.log('✅ fr.js mis à jour et validé syntaxiquement avec succès.');
} catch (err) {
  console.error('❌ Erreur de syntaxe dans fr.js :', err.message);
  process.exit(1);
}

// Injection dans pt.js
const ptPath = path.join(rootDir, 'src/locales/pt.js');
let ptContent = fs.readFileSync(ptPath, 'utf8');

if (ptContent.includes('studio: {\n    newsletter: {')) {
  ptContent = ptContent.replace(/,\r?\n\s*studio: \{\r?\n\s*newsletter:[\s\S]*?\n  \}/, ptBlock);
} else {
  const lastClosing = ptContent.lastIndexOf('};');
  if (lastClosing === -1) throw new Error("Impossible de trouver '};' dans pt.js");
  ptContent = ptContent.substring(0, lastClosing) + ptBlock + '\n' + ptContent.substring(lastClosing);
}

// Vérification syntaxique Babel de pt.js
try {
  parser.parse(ptContent, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  fs.writeFileSync(ptPath, ptContent, 'utf8');
  console.log('✅ pt.js mis à jour et validé syntaxiquement avec succès.');
} catch (err) {
  console.error('❌ Erreur de syntaxe dans pt.js :', err.message);
  process.exit(1);
}

console.log('🎉 Dictionnaires FR et PT-BR enrichis avec 100% de parité pour Studio Lot 1.');
