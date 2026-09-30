import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('========================================================================');
console.log('🧪 TEST MISSION FICHE 5 : REMPLACEMENT DES WINDOW.CONFIRM PAR MODALE CORDEL');
console.log('========================================================================\n');

let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedAssertions++;
  }
}

// -----------------------------------------------------------------------------
// Test 1 : Composant CordelConfirmModal
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle statique de CordelConfirmModal.jsx');
const modalPath = path.resolve('src/components/common/CordelConfirmModal.jsx');
assert(fs.existsSync(modalPath), 'CordelConfirmModal.jsx existe sous src/components/common/');

if (fs.existsSync(modalPath)) {
  const modalSrc = fs.readFileSync(modalPath, 'utf8');
  assert(modalSrc.includes('e.target === e.currentTarget'), 'Clic de fermeture sécurisé sur le backdrop (e.target === e.currentTarget)');
  assert(modalSrc.includes("e.key === 'Escape'"), 'Écoute et fermeture sécurisée sur touche Escape');
  assert(modalSrc.includes("e.key === 'Enter'"), 'Validation sur touche Enter');
  assert(modalSrc.includes('confirmLabel') && modalSrc.includes('confirmText'), 'Support bi-compatible des libellés de confirmation (confirmLabel / confirmText)');
  assert(modalSrc.includes('cancelLabel') && modalSrc.includes('cancelText'), 'Support bi-compatible des libellés d\'annulation (cancelLabel / cancelText)');
  assert(modalSrc.includes('var(--color-cordel-rouge)'), 'Couleur sémantique rouge terre cuite Cordel pour variant="danger"');
  assert(modalSrc.includes('var(--color-cordel-vert)'), 'Couleur sémantique verte pour variant="success"');
  assert(modalSrc.includes('var(--color-cordel-ocre)'), 'Couleur sémantique ocre pour variant="warning"');
}

// -----------------------------------------------------------------------------
// Test 2 : Contexte et Hook useConfirm
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Contrôle statique de ConfirmModalContext.jsx et useConfirm');
const ctxPath = path.resolve('src/context/ConfirmModalContext.jsx');
const legacyCtxPath = path.resolve('src/context/ConfirmContext.jsx');
const hookPath = path.resolve('src/hooks/useConfirm.js');

assert(fs.existsSync(ctxPath), 'ConfirmModalContext.jsx existe');
assert(fs.existsSync(legacyCtxPath), 'ConfirmContext.jsx existe pour rétro-compatibilité');
assert(fs.existsSync(hookPath), 'src/hooks/useConfirm.js existe');

if (fs.existsSync(ctxPath)) {
  const ctxSrc = fs.readFileSync(ctxPath, 'utf8');
  assert(ctxSrc.includes('new Promise'), 'Fonction confirm asynchrone renvoyant une Promesse');
  assert(ctxSrc.includes('confirmFn.confirm = confirmFn'), 'useConfirm supporte l\'appel direct et la déstructuration { confirm }');
  assert(ctxSrc.includes('confirmFn.alert = context.alert'), 'useConfirm expose la méthode alert');
  assert(ctxSrc.includes('window.alert = (msg) =>'), 'Interception globale sécurisée de window.alert');
}

// -----------------------------------------------------------------------------
// Test 3 : Éradication totale de window.confirm dans tout src/
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Éradication totale des appels window.confirm');
const srcDir = path.resolve('src');

function findWindowConfirms(dir) {
  let found = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found = found.concat(findWindowConfirms(fullPath));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Ignorer les commentaires
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
        if (line.includes('window.confirm(') || line.includes('window.confirm ')) {
          found.push(`${fullPath}:${idx + 1}`);
        }
      });
    }
  }
  return found;
}

const windowConfirmCalls = findWindowConfirms(srcDir);
assert(windowConfirmCalls.length === 0, `Aucun appel window.confirm restant dans src/ (trouvés: ${windowConfirmCalls.length})`);
if (windowConfirmCalls.length > 0) {
  console.error('    Détail des appels trouvés :', windowConfirmCalls);
}

// -----------------------------------------------------------------------------
// Test 4 : Intégration dans CommissionEditModal et CommissionJalonsSection
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Vérification des modales et jalons de commission');
const commModalPath = path.resolve('src/components/event-details/commissions/CommissionEditModal.jsx');
const commJalonsPath = path.resolve('src/components/event-details/commissions/CommissionJalonsSection.jsx');

if (fs.existsSync(commModalPath)) {
  const commModalSrc = fs.readFileSync(commModalPath, 'utf8');
  assert(commModalSrc.includes('useConfirm'), 'CommissionEditModal importe useConfirm');
  assert(commModalSrc.includes('Supprimer la commission'), 'CommissionEditModal propose la confirmation de suppression');
}

if (fs.existsSync(commJalonsPath)) {
  const jalonsSrc = fs.readFileSync(commJalonsPath, 'utf8');
  assert(jalonsSrc.includes('useConfirm'), 'CommissionJalonsSection importe useConfirm');
  assert(jalonsSrc.includes('Supprimer le jalon ?'), 'CommissionJalonsSection confirme la suppression des jalons avec Cordel');
}

// -----------------------------------------------------------------------------
// Test 5 : Exécution du build Vite (production)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Compilation de production Vite (npm run build)');
try {
  execSync('npm.cmd run build', { stdio: 'pipe', encoding: 'utf8' });
  assert(true, 'Compilation Vite réussie sans aucune erreur');
} catch (buildErr) {
  console.error('Erreur build:', buildErr.stdout || buildErr.stderr);
  assert(false, 'Compilation Vite a échoué');
}

console.log('\n========================================================================');
if (failedAssertions === 0) {
  console.log('🏆 TOUS LES TESTS FICHE 5 SONT 100% VALIDÉS AVEC SUCCÈS !');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error(`❌ ÉCHEC : ${failedAssertions} assertion(s) non validée(s).`);
  console.log('========================================================================');
  process.exit(1);
}
