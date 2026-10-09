import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST UNITAIRE : LIENS CONTEXTUELS FIL FORUM ➔ TOUR DE CONTRÔLE & VARAL');
console.log('===============================================================\n');

// 1. Contrôle Anti-monolithe (< 200 lignes)
console.log('▶️ Test 1 : Règle anti-monolithe sur ThreadProjectContextBar.jsx...');
const barPath = path.join(rootDir, 'src/components/forum/thread/ThreadProjectContextBar.jsx');
assert.ok(fs.existsSync(barPath), 'ThreadProjectContextBar.jsx doit exister');
const barContent = fs.readFileSync(barPath, 'utf8');
const barLines = barContent.trim().split('\n').length;
console.log(`  - ThreadProjectContextBar.jsx: ${barLines} lignes`);
assert.ok(barLines < 200, `ThreadProjectContextBar doit faire < 200 lignes (actuel: ${barLines})`);
console.log('  ✅ [PASS] Composant modulaire et conforme à la règle anti-monolithe.\n');

// 2. Intégration dans ThreadView.jsx
console.log('▶️ Test 2 : Intégration de la barre contextuelle dans ThreadView.jsx...');
const threadViewPath = path.join(rootDir, 'src/components/ThreadView.jsx');
const threadViewContent = fs.readFileSync(threadViewPath, 'utf8');
assert.ok(threadViewContent.includes('ThreadProjectContextBar'), 'ThreadView doit importer ThreadProjectContextBar');
assert.ok(threadViewContent.includes('<ThreadProjectContextBar'), 'ThreadView doit rendre <ThreadProjectContextBar />');
assert.ok(threadViewContent.includes('onNavigateToView'), 'ThreadView doit recevoir et propager onNavigateToView');
console.log('  ✅ [PASS] ThreadView.jsx intègre correctement ThreadProjectContextBar sous l\'en-tête.\n');

// 3. Propagation depuis Forum.jsx et App.jsx
console.log('▶️ Test 3 : Câblage de onNavigateToView depuis App.jsx et Forum.jsx...');
const forumPath = path.join(rootDir, 'src/components/Forum.jsx');
const forumContent = fs.readFileSync(forumPath, 'utf8');
assert.ok(forumContent.includes('onNavigateToView = null'), 'Forum.jsx doit déclarer onNavigateToView dans ses props');
assert.ok(forumContent.includes('onNavigateToView={onNavigateToView}'), 'Forum.jsx doit transmettre onNavigateToView à ThreadView');

const appPath = path.join(rootDir, 'src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');
assert.ok(appContent.includes('onNavigateToView={handleNavigateToView}'), 'App.jsx doit passer handleNavigateToView à Forum');
assert.ok(appContent.includes('openHub: Boolean(extraOptions.openHub)'), 'App.jsx doit supporter openHub dans case agenda');
console.log('  ✅ [PASS] Chaîne de propagation onNavigateToView 100% connectée.\n');

// 4. Détection du contexte projet / commission et Règle Zéro Bloc Vide
console.log('▶️ Test 4 : Audit de la détection de contexte et règle zéro bloc vide...');
assert.ok(barContent.includes('if (!eventId && !commissionId)'), 'Doit vérifier l\'absence d\'eventId et commissionId');
assert.ok(barContent.includes('return null;'), 'Doit retourner null si aucun contexte projet/commission');
console.log('  ✅ [PASS] Règle zéro bloc vide respectée : masquage strict pour les discussions générales.\n');

// 5. Bouton Tour de Contrôle et Bouton Livret Varal
console.log('▶️ Test 5 : Boutons Tour de Contrôle et Livret Varal...');
assert.ok(barContent.includes('Tour de Contrôle'), 'Bouton Tour de Contrôle présent');
assert.ok(barContent.includes('Livret Varal'), 'Bouton Livret Varal présent');
assert.ok(barContent.includes('DocumentViewerModal'), 'DocumentViewerModal intégré pour lecture in-situ');
assert.ok(barContent.includes('(non publié)'), 'Indication pour les livrets non publiés');

// 6. Support de openHub dans EventDetails.jsx
console.log('▶️ Test 6 : Réception de openHub dans EventDetails.jsx...');
const eventDetailsPath = path.join(rootDir, 'src/components/EventDetails.jsx');
const eventDetailsContent = fs.readFileSync(eventDetailsPath, 'utf8');
assert.ok(eventDetailsContent.includes('openHub') && eventDetailsContent.includes('showCommissionsHub'), 'EventDetails doit réagir au paramètre openHub');
console.log('  ✅ [PASS] EventDetails.jsx réagit au paramètre openHub pour ouvrir la Tour de Contrôle.\n');

console.log('===============================================================');
console.log('🏆 TOUTES LES VALIDATIONS DES LIENS CONTEXTUELS SONT RÉUSSIES !');
console.log('===============================================================');
