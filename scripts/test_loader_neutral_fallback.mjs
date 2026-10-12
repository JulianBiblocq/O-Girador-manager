import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Début du test de validation de la neutralité du Loader et des assets...');

// 1. Vérification des assets statiques SVG dans public/
const svgFiles = ['public/favicon.svg', 'public/icon.svg', 'public/og-image.svg'];
for (const file of svgFiles) {
  const content = fs.readFileSync(path.resolve(file), 'utf-8');
  assert(!content.toLowerCase().includes('samambaia'), `Le fichier ${file} ne doit pas contenir "samambaia"`);
  assert(!content.includes('data:image/png;base64'), `Le fichier ${file} ne doit pas contenir de png base64`);
  assert(content.includes('O GIRADOR'), `Le fichier ${file} doit contenir la marque neutre "O GIRADOR"`);
  console.log(`✅ ${file} est 100% neutre O Girador`);
}

// 2. Vérification de public/manifest.json (Bannissement de "Organizad'Or" et conformité "O Girador")
const manifest = JSON.parse(fs.readFileSync(path.resolve('public/manifest.json'), 'utf-8'));
assert(!manifest.name.toLowerCase().includes("organizad'or"), 'manifest.json name ne doit pas contenir "Organizad\'Or"');
assert(!manifest.short_name.toLowerCase().includes("organizad'or"), 'manifest.json short_name ne doit pas contenir "Organizad\'Or"');
assert(manifest.name.startsWith('O Girador'), 'manifest.json name doit débuter par "O Girador"');
console.log('✅ public/manifest.json est conforme à la charte O Girador (sans mention Organizad\'Or)');

// 3. Vérification de index.html
const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
assert(!indexHtml.toLowerCase().includes('samambaia'), 'index.html ne doit pas contenir samambaia');
assert(indexHtml.includes('og-girador-frame.svg'), 'index.html doit référencer og-girador-frame.svg dans son pré-loader');
console.log('✅ index.html possède un pré-chargeur statique neutre');

// 4. Vérification de src/App.jsx
const appJsx = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
assert(appJsx.includes("const logoSrc = activeLogo || '/og-girador-frame.svg';"), 'App.jsx doit utiliser og-girador-frame.svg en fallback');
assert(appJsx.includes('object-contain select-none'), 'App.jsx doit utiliser object-contain pour le centrage sans layout shift');
console.log('✅ src/App.jsx dynamise correctement le loader avec fallback neutre O Girador');

// 5. Vérification des composants nettoyés
const pendingValidation = fs.readFileSync(path.resolve('src/components/auth/PendingValidationScreen.jsx'), 'utf-8');
assert(!pendingValidation.includes('/favicon.svg'), 'PendingValidationScreen ne doit plus faire de fallback sur /favicon.svg');
assert(pendingValidation.includes('/og-girador-frame.svg'), 'PendingValidationScreen doit faire un fallback sur /og-girador-frame.svg');

const layoutShell = fs.readFileSync(path.resolve('src/components/LayoutShell.jsx'), 'utf-8');
assert(!layoutShell.includes("|| (isDemo ? 'Maracatu Na Chuva' : 'Samambaia')"), 'LayoutShell ne doit plus avoir Samambaia en copyright par défaut');

console.log('🎉 Tous les tests d’audit de neutralité ont réussi avec succès !');
