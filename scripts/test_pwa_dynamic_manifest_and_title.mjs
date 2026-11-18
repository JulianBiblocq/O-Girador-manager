import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 DÉBUT DU TEST : VALIDATION DU MANIFEST STATIQUE NEUTRE & TITRE DYNAMIQUE PWA...');

// 1. Contrôle du fallback statique public/manifest.json
const manifestPath = path.resolve('public/manifest.json');
assert(fs.existsSync(manifestPath), 'public/manifest.json doit exister');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

assert(!manifestContent.name.toLowerCase().includes("organizad'or"), 'Le manifest statique name ne doit pas contenir d\'apostrophe parasite');
assert(!manifestContent.short_name.toLowerCase().includes("organizad'or"), 'Le manifest statique short_name ne doit pas contenir d\'apostrophe parasite');
assert.strictEqual(manifestContent.name, 'O Girador', 'Le manifest statique doit avoir "O Girador" par défaut (100 % SaaS neutre)');
assert.strictEqual(manifestContent.short_name, 'O Girador', 'Le short_name statique doit être "O Girador" (<= 12 caractères)');
assert(manifestContent.short_name.length <= 12, 'Le short_name statique doit faire 12 caractères ou moins');
console.log('✅ public/manifest.json est 100% conforme et neutre (O Girador)');

// 2. Contrôle du hook useDynamicManifest.js
const dynamicManifestHook = fs.readFileSync(path.resolve('src/hooks/useDynamicManifest.js'), 'utf-8');
assert(dynamicManifestHook.includes('document.title = dynamicTitle'), 'useDynamicManifest doit synchroniser document.title dynamiquement');
assert(dynamicManifestHook.includes("manifestLink.setAttribute('href', '/manifest.json')"), 'useDynamicManifest doit préserver /manifest.json statique');
console.log('✅ useDynamicManifest.js synchronise document.title par association tout en gardant /manifest.json statique');

// 3. Contrôle de l'intégration dans src/App.jsx
const appJsxContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
assert(appJsxContent.includes('useDynamicManifest('), 'App.jsx doit invoquer useDynamicManifest');
console.log('✅ App.jsx pilote dynamiquement le titre de l\'application');

console.log('🎉 TOUS LES CONTRÔLES PWA MANIFEST & TITRE DYNAMIQUE ONT RÉUSSI AVEC SUCCÈS !');
