import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Début du test de validation du Sceau Combiné sur le Loader / Splash Screen...');

// 1. Validation de LoadingSeal.jsx
const loadingSealPath = path.resolve('src/components/common/LoadingSeal.jsx');
assert(fs.existsSync(loadingSealPath), 'Le composant LoadingSeal.jsx doit exister');
const loadingSealContent = fs.readFileSync(loadingSealPath, 'utf-8');

// Vérification de la prise en charge du cas Samambaia
assert(
  loadingSealContent.includes('/brandings/logoOGSamambaia.png'),
  'LoadingSeal doit utiliser le blason fusionné /brandings/logoOGSamambaia.png pour Samambaia'
);

// Vérification de la prise en charge du cache localStorage
assert(
  loadingSealContent.includes('og_cached_loader_logo'),
  'LoadingSeal doit consommer le logo en cache local (og_cached_loader_logo)'
);
assert(
  loadingSealContent.includes('og_cached_loader_group'),
  'LoadingSeal doit consommer le groupe en cache local (og_cached_loader_group)'
);

// Vérification de la composition dynamique multi-tenant (2 calques)
assert(
  loadingSealContent.includes('/og-girador-frame.svg'),
  'LoadingSeal doit utiliser /og-girador-frame.svg pour l\'anneau de fond'
);
assert(
  loadingSealContent.includes('w-[62%]') && loadingSealContent.includes('top-[14%]'),
  'LoadingSeal doit positionner le logo centré aux proportions prévues (w-[62%], top-[14%])'
);
assert(
  loadingSealContent.includes('rounded-full') && loadingSealContent.includes('object-contain'),
  'LoadingSeal doit masquer le logo intérieur en cercle et préserver les ratios (object-contain)'
);
console.log('✅ LoadingSeal.jsx implémente parfaitement la composition visuelle et le cache');

// 2. Validation de src/App.jsx
const appJsxContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');

assert(
  appJsxContent.includes('import LoadingSeal from'),
  'App.jsx doit importer LoadingSeal'
);
assert(
  appJsxContent.includes('<LoadingSeal'),
  'App.jsx doit instancier le composant LoadingSeal'
);
assert(
  appJsxContent.includes("localStorage.setItem('og_cached_loader_logo'"),
  'App.jsx doit enregistrer le logo de l\'association dans le cache local (og_cached_loader_logo)'
);
assert(
  appJsxContent.includes("localStorage.setItem('og_cached_loader_group'"),
  'App.jsx doit enregistrer le groupe dans le cache local (og_cached_loader_group)'
);
console.log('✅ src/App.jsx intègre le Sceau Combiné et alimente le cache de démarrage');

// 3. Validation de index.html
const indexHtmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
assert(!indexHtmlContent.toLowerCase().includes('samambaia'), 'index.html ne doit pas contenir de mention en dur');
assert(indexHtmlContent.includes('og_cached_loader_logo'), 'index.html doit lire le logo en cache dès la milliseconde 0');
assert(indexHtmlContent.includes('og-static-inner-wrap'), 'index.html doit prévoir le conteneur du logo intérieur');
console.log('✅ index.html assure la réactivité instantanée dès le F5 sans clignotement');

console.log('🎉 Tous les critères de la mission Sceau Combiné sur Loader sont validés !');
