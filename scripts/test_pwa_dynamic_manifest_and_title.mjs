import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 DÉBUT DU TEST : VALIDATION DU NOM DYNAMIQUE PWA & MANIFEST...');

// 1. Contrôle du fallback statique public/manifest.json
const manifestPath = path.resolve('public/manifest.json');
assert(fs.existsSync(manifestPath), 'public/manifest.json doit exister');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

assert(!manifestContent.name.toLowerCase().includes("organizad'or"), 'Le manifest statique name ne doit pas contenir "Organizad\'Or"');
assert(!manifestContent.short_name.toLowerCase().includes("organizad'or"), 'Le manifest statique short_name ne doit pas contenir "Organizad\'Or"');
assert.strictEqual(manifestContent.name, 'O Girador Samambaia', 'Le manifest statique doit avoir "O Girador Samambaia" par défaut');
assert.strictEqual(manifestContent.short_name, 'O Girador', 'Le short_name statique doit être "O Girador" (<= 12 caractères)');
assert(manifestContent.short_name.length <= 12, 'Le short_name statique doit faire 12 caractères ou moins');
console.log('✅ public/manifest.json est 100% conforme (O Girador Samambaia, sans Organizad\'Or)');

// 2. Contrôle de la génération dynamique du manifest dans src/App.jsx
const appJsxContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');

assert(
  appJsxContent.includes('new Blob([manifestString]') || appJsxContent.includes('new Blob('),
  'App.jsx doit générer un Blob pour le manifest dynamique'
);
assert(
  appJsxContent.includes('URL.createObjectURL(blob)'),
  'App.jsx doit créer un Blob URL pour le manifest dynamique'
);
assert(
  appJsxContent.includes('URL.revokeObjectURL'),
  'App.jsx doit révoquer le Blob URL pour libérer la mémoire'
);
assert(
  appJsxContent.includes('O Girador ${cleanAssoName}'),
  'App.jsx doit combiner la marque O Girador et le nom de l\'association'
);
assert(
  appJsxContent.includes('shortName.length > 12'),
  'App.jsx doit veiller à ce que le short_name ne dépasse pas 12 caractères'
);
console.log('✅ src/App.jsx génère dynamiquement le manifest PWA avec O Girador + Asso');

// 3. Contrôle du document.title dans src/App.jsx
assert(
  !appJsxContent.includes("document.title = \"Organizad'Or"),
  'App.jsx ne doit pas imposer "Organizad\'Or" dans document.title'
);
assert(
  appJsxContent.includes('document.title = fullAppName;'),
  'App.jsx doit appliquer fullAppName sur document.title'
);
console.log('✅ document.title est synchronisé dynamiquement avec le nom du groupe');

console.log('🎉 TOUS LES CONTRÔLES PWA MANIFEST & TITRE DYNAMIQUE ONT RÉUSSI AVEC SUCCÈS !');
