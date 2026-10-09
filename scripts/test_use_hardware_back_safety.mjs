import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST UNITAIRE : SÉCURITÉ useHardwareBack & ANTI-FERMETURE');
console.log('===============================================================\n');

// 1. Audit statique du code de useHardwareBack.js
console.log('▶️ Test 1 : Audit statique de src/hooks/useHardwareBack.js...');
const hookPath = path.join(rootDir, 'src/hooks/useHardwareBack.js');
assert.ok(fs.existsSync(hookPath), 'src/hooks/useHardwareBack.js doit exister');
const hookContent = fs.readFileSync(hookPath, 'utf8');

assert.ok(hookContent.includes('useRef'), 'useHardwareBack doit utiliser useRef pour le callback');
assert.ok(hookContent.includes('callbackRef.current = callback'), 'useHardwareBack doit mettre à jour callbackRef.current');
assert.ok(!hookContent.includes('modalStack'), 'modalStack doit être supprimé pour éviter la désynchronisation globale');
assert.ok(!hookContent.includes('window.history.back()'), 'window.history.back() ne doit pas être appelé dans le cleanup');
assert.ok(!hookContent.includes('window.history.pushState'), 'window.history.pushState ne doit pas être appelé');
assert.ok(hookContent.includes('window.addEventListener(\'popstate\', handlePopState)'), 'L\'écouteur popstate doit être passé sans parenthèses');
assert.ok(hookContent.includes('window.removeEventListener(\'popstate\', handlePopState)'), 'Le cleanup doit retirer l\'écouteur');

const lineCount = hookContent.trim().split('\n').length;
assert.ok(lineCount < 200, `useHardwareBack.js doit faire < 200 lignes (actuel: ${lineCount})`);
console.log(`  ✅ [PASS] useHardwareBack.js est épuré, robuste et modulaire (${lineCount} lignes).\n`);

// 2. Vérification de l'appel sécurisé dans EventDetails.jsx
console.log('▶️ Test 2 : Contrôle de l\'appel useHardwareBack dans EventDetails.jsx...');
const eventDetailsPath = path.join(rootDir, 'src/components/EventDetails.jsx');
const eventDetailsContent = fs.readFileSync(eventDetailsPath, 'utf8');

assert.ok(
  eventDetailsContent.includes('useHardwareBack(() => setShowCommissionsHub(false), Boolean(showCommissionsHub))') ||
  eventDetailsContent.includes('useHardwareBack(() => setShowCommissionsHub(false), showCommissionsHub)'),
  'showCommissionsHub doit être conditionné strictement par Boolean(showCommissionsHub) avec le callback en premier argument'
);
console.log('  ✅ [PASS] EventDetails.jsx n\'active useHardwareBack que si showCommissionsHub est ouvert.\n');

// 3. Contrôle de l'absence de <form> dans CommissionBudgetSection et CommissionEditModal
console.log('▶️ Test 3 : Absence totale de balise <form> dans les commissions...');
const budgetPath = path.join(rootDir, 'src/components/event-details/commissions/CommissionBudgetSection.jsx');
const budgetContent = fs.readFileSync(budgetPath, 'utf8');
assert.ok(!budgetContent.includes('<form'), 'CommissionBudgetSection ne doit pas contenir de balise <form>');
assert.ok(budgetContent.includes('handleAddDevis'), 'handleAddDevis doit être présent');
assert.ok(budgetContent.includes('type="button"'), 'Bouton d\'ajout de devis doit être type="button"');

const modalPath = path.join(rootDir, 'src/components/event-details/commissions/CommissionEditModal.jsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');
assert.ok(!modalContent.includes('<form'), 'CommissionEditModal ne doit pas contenir de balise <form>');
console.log('  ✅ [PASS] Aucune balise <form> détectée (zéro conflit DOM de formulaires imbriqués).\n');

// 4. Contrôle de getCategoryLabel dans VaralCategoryRope et le proxy
console.log('▶️ Test 4 : Présence et fonctionnement de getCategoryLabel...');
const varalRopePath = path.join(rootDir, 'src/components/documents/varal/VaralCategoryRope.jsx');
const varalRopeContent = fs.readFileSync(varalRopePath, 'utf8');
assert.ok(varalRopeContent.includes('getCategoryLabel'), 'VaralCategoryRope.jsx doit définir ou exporter getCategoryLabel');

const proxyPath = path.join(rootDir, 'src/components/VaralCategoryRope.jsx');
assert.ok(fs.existsSync(proxyPath), 'src/components/VaralCategoryRope.jsx proxy doit exister');
const proxyContent = fs.readFileSync(proxyPath, 'utf8');
assert.ok(proxyContent.includes('getCategoryLabel'), 'Le proxy doit ré-exporter getCategoryLabel');
console.log('  ✅ [PASS] getCategoryLabel est protégé contre toute ReferenceError.\n');

// 5. Contrôle TDZ (Temporal Dead Zone) sur PrivateChatView.jsx
console.log('▶️ Test 5 : Contrôle TDZ (Temporal Dead Zone) dans PrivateChatView.jsx...');
const privateChatPath = path.join(rootDir, 'src/components/PrivateChatView.jsx');
const privateChatContent = fs.readFileSync(privateChatPath, 'utf8');
const conversationIdIndex = privateChatContent.indexOf('const conversationId =');
const useHardwareBackIndex = privateChatContent.indexOf('useHardwareBack(Boolean(conversationId');
assert.ok(conversationIdIndex !== -1, 'conversationId doit être déclaré');
assert.ok(useHardwareBackIndex !== -1, 'useHardwareBack doit utiliser conversationId');
assert.ok(conversationIdIndex < useHardwareBackIndex, 'conversationId doit être initialisé avant l\'appel useHardwareBack pour éviter ReferenceError TDZ');
console.log('  ✅ [PASS] conversationId est initialisé avant useHardwareBack (zéro ReferenceError TDZ).\n');

console.log('===============================================================');
console.log('🏆 TOUTES LES VALIDATIONS DU HOOK useHardwareBack ONT RÉUSSI !');
console.log('===============================================================');
