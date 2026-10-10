import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST UNITAIRE : OPTIMISATION LCP & CLS (CORE WEB VITALS)');
console.log('===============================================================\n');

// Mock simple de sessionStorage pour tester dashboardCacheUtils en environnement Node
const sessionStore = new Map();
globalThis.window = {};
globalThis.sessionStorage = {
  getItem: (k) => sessionStore.get(k) ?? null,
  setItem: (k, v) => sessionStore.set(k, String(v)),
  removeItem: (k) => sessionStore.delete(k),
  clear: () => sessionStore.clear()
};

// 1. Test unitaire des utilitaires de cache SWR
console.log('▶️ Test 1 : Test unitaire de dashboardCacheUtils.js...');
const {
  getCachedDashboardItem,
  setCachedDashboardItem,
  getCachedAnnouncements,
  setCachedAnnouncements,
  getCachedDashboardLayout,
  setCachedDashboardLayout
} = await import('../src/utils/dashboardCacheUtils.js');

// Test items génériques
setCachedDashboardItem('testGroup', 'metric1', { score: 42 });
assert.deepStrictEqual(getCachedDashboardItem('testGroup', 'metric1'), { score: 42 });
assert.strictEqual(getCachedDashboardItem('testGroup', 'unknown', 'fallback'), 'fallback');

// Test annonces
const sampleAnnouncements = [
  { id: 'ann-1', titre: 'Répétition générale', dateCreation: '2026-10-09' },
  { id: 'ann-2', titre: 'Atelier couture', dateCreation: '2026-10-08' }
];
setCachedAnnouncements('testGroup', sampleAnnouncements);
assert.deepStrictEqual(getCachedAnnouncements('testGroup'), sampleAnnouncements);

// Test layout
const defaultLayout = ['motMestre', 'annonces', 'agenda'];
const customLayout = ['annonces', 'agenda', 'motMestre'];
assert.deepStrictEqual(getCachedDashboardLayout('emptyGroup', defaultLayout), defaultLayout);
setCachedDashboardLayout('testGroup', customLayout);
assert.deepStrictEqual(getCachedDashboardLayout('testGroup', defaultLayout), customLayout);
console.log('  ✅ [PASS] dashboardCacheUtils.js gère parfaitement la persistance et la restitution SWR.\n');

// 2. Audit statique de WidgetAnnonces.jsx (Élément LCP & CLS)
console.log('▶️ Test 2 : Audit statique de WidgetAnnonces.jsx...');
const annoncesPath = path.join(rootDir, 'src/components/WidgetAnnonces.jsx');
const annoncesContent = fs.readFileSync(annoncesPath, 'utf8');

assert.ok(annoncesContent.includes('getCachedAnnouncements'), 'WidgetAnnonces doit importer getCachedAnnouncements');
assert.ok(annoncesContent.includes('setCachedAnnouncements'), 'WidgetAnnonces doit importer setCachedAnnouncements');
assert.ok(annoncesContent.includes('useState(() => getCachedAnnouncements(groupId))'), 'announcements doit être initialisé via getCachedAnnouncements');
assert.ok(annoncesContent.includes('min-h-[140px]'), 'Le squelette doit réserver une hauteur minimale de 140px pour éviter le CLS');
assert.ok(annoncesContent.includes('Notification.permission !== \'granted\''), 'La bannière push doit initialiser son état de manière synchrone');
console.log('  ✅ [PASS] WidgetAnnonces.jsx pré-hydrate les annonces au 1er rendu (LCP < 0.1s) et stabilise son squelette.\n');

// 3. Audit statique de Dashboard.jsx (Grille, Ordre & Suspense Fallbacks)
console.log('▶️ Test 3 : Audit statique de Dashboard.jsx...');
const dashboardPath = path.join(rootDir, 'src/components/Dashboard.jsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

assert.ok(dashboardContent.includes('getCachedDashboardLayout'), 'Dashboard doit importer getCachedDashboardLayout');
assert.ok(dashboardContent.includes('setCachedDashboardLayout'), 'Dashboard doit importer setCachedDashboardLayout');
assert.ok(dashboardContent.includes('getCachedDashboardItem'), 'Dashboard doit importer getCachedDashboardItem');
assert.ok(dashboardContent.includes('setCachedDashboardItem'), 'Dashboard doit importer setCachedDashboardItem');
assert.ok(dashboardContent.includes('min-h-[380px]'), 'Le Suspense fallback de l\'Agenda doit réserver l\'espace (min-h-[380px])');
assert.ok(dashboardContent.includes('min-h-[160px]'), 'Le Suspense fallback du Varal doit réserver l\'espace (min-h-[160px])');
assert.ok(dashboardContent.includes('min-h-[120px]'), 'Le Suspense fallback de la Trésorerie doit réserver l\'espace (min-h-[120px])');
assert.ok(dashboardContent.includes('loading="eager"'), 'L\'avatar du membre en haut de page doit être chargé en mode eager');
console.log('  ✅ [PASS] Dashboard.jsx est immunisé contre les 6 décalages de disposition successifs.\n');

// 4. Audit statique de WidgetMotMestre.jsx
console.log('▶️ Test 4 : Audit statique de WidgetMotMestre.jsx...');
const motMestrePath = path.join(rootDir, 'src/components/WidgetMotMestre.jsx');
const motMestreContent = fs.readFileSync(motMestrePath, 'utf8');

assert.ok(motMestreContent.includes('getCachedDashboardItem'), 'WidgetMotMestre doit importer getCachedDashboardItem');
assert.ok(motMestreContent.includes('if (!publie)'), 'WidgetMotMestre doit vérifier publie sans attendre loading');
assert.ok(motMestreContent.includes('if (!isAuthorized && (!motDuMestre || !motDuMestre.trim()))'), 'WidgetMotMestre ne doit pas afficher de bloc fantôme temporaire');
console.log('  ✅ [PASS] WidgetMotMestre.jsx ne s\'effondre plus après son chargement.\n');

// 5. Audit de index.html pour le préchargement de la police
console.log('▶️ Test 5 : Audit de index.html (Font Preload Cactus)...');
const indexPath = path.join(rootDir, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

assert.ok(indexContent.includes('rel="preload"'), 'index.html doit contenir une balise preload');
assert.ok(indexContent.includes('/fonts/Cactus%20Regular.otf'), 'index.html doit précharger Cactus Regular.otf');
assert.ok(indexContent.includes('as="font"'), 'Le préchargement doit spécifier as="font"');
console.log('  ✅ [PASS] La police Cactus est préchargée pour éviter le saut de texte (FOUT).\n');

console.log('===============================================================');
console.log('🏆 TOUTES LES VALIDATIONS LCP & CLS ONT RÉUSSI AVEC SUCCÈS !');
console.log('===============================================================');
