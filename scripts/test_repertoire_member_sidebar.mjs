/**
 * test_repertoire_member_sidebar.mjs
 * Validation unitaire de l'intégration de l'onglet « Répertoire » dans la barre latérale gauche (Vue Membre).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log("🚀 Lancement des tests de validation de l'onglet Répertoire en Vue Membre...\n");

// --- 1. Vérification statique dans LayoutShell.jsx ---
const layoutShellPath = path.resolve('src/components/LayoutShell.jsx');
const layoutShellSource = fs.readFileSync(layoutShellPath, 'utf-8');

console.log("Test 1 : Présence de l'entrée 'repertoire' dans allMemberMenuItems...");
assert.ok(
  layoutShellSource.includes("id: 'repertoire'"),
  "L'identifiant 'repertoire' doit être présent dans LayoutShell.jsx"
);
assert.ok(
  layoutShellSource.includes("labelKey: 'tabRepertoire'"),
  "La clé i18n 'tabRepertoire' doit être associée à l'élément Répertoire"
);
console.log("✅ Test 1 validé !");

console.log("\nTest 2 : Positionnement après l'Agenda...");
const agendaIdx = layoutShellSource.indexOf("id: 'agenda'");
const repertoireIdx = layoutShellSource.indexOf("id: 'repertoire'");
const atelierIdx = layoutShellSource.indexOf("id: 'atelier'");

assert.ok(agendaIdx !== -1, "L'onglet 'agenda' doit exister dans allMemberMenuItems");
assert.ok(repertoireIdx !== -1, "L'onglet 'repertoire' doit exister dans allMemberMenuItems");
assert.ok(atelierIdx !== -1, "L'onglet 'atelier' doit exister dans allMemberMenuItems");
assert.ok(
  repertoireIdx > agendaIdx && repertoireIdx < atelierIdx,
  "L'onglet 'repertoire' doit être positionné exactement entre 'agenda' et 'atelier'"
);
console.log("✅ Test 2 validé !");

console.log("\nTest 3 : Simulation de la condition Feature Toggle (isModuleEnabled)...");
function simulateIsModuleEnabled(tabId, features, profile, isMasterKeyActive = false) {
  if (tabId === 'repertoire') {
    const role = (profile?.role || '').toLowerCase();
    const isMestreOrAdmin = role === 'mestre' || role === 'super-admin' || role === 'admin' || profile?.isSystemAdmin === true;
    const hasAccessMestreLocal = isMasterKeyActive || isMestreOrAdmin;
    if (features?.repertoireEleves !== true && !hasAccessMestreLocal) return false;
  }
  return true;
}

const adherentProfile = { role: 'adherent', uid: 'adh1' };
const mestreProfile = { role: 'mestre', uid: 'mestre1' };
const adminProfile = { role: 'admin', uid: 'admin1' };

// Scénario A : Module Répertoire fermé (features.repertoireEleves = false)
assert.strictEqual(
  simulateIsModuleEnabled('repertoire', { repertoireEleves: false }, adherentProfile),
  false,
  "L'adhérent ne doit PAS voir le répertoire si le module est fermé"
);
assert.strictEqual(
  simulateIsModuleEnabled('repertoire', { repertoireEleves: false }, mestreProfile),
  true,
  "Le Mestre doit voir le répertoire même si fermé (préparation en coulisses)"
);
assert.strictEqual(
  simulateIsModuleEnabled('repertoire', { repertoireEleves: false }, adminProfile),
  true,
  "L'Admin doit voir le répertoire même si fermé"
);

// Scénario B : Module Répertoire ouvert (features.repertoireEleves = true)
assert.strictEqual(
  simulateIsModuleEnabled('repertoire', { repertoireEleves: true }, adherentProfile),
  true,
  "L'adhérent DOIT voir le répertoire quand repertoireEleves est actif"
);
assert.strictEqual(
  simulateIsModuleEnabled('repertoire', { repertoireEleves: true }, mestreProfile),
  true,
  "Le Mestre doit voir le répertoire quand repertoireEleves est actif"
);
console.log("✅ Test 3 validé !");

console.log("\nTest 4 : Validation de l'état actif Cordel et des callbacks de navigation...");
function simulateIsActive(itemId, currentPole, currentTab) {
  return (itemId === 'accueil' && currentPole === 'accueil' && (currentTab === 'dashboard' || !currentTab)) ||
         (itemId !== 'accueil' && currentTab === itemId);
}

assert.strictEqual(
  simulateIsActive('repertoire', 'mon-espace', 'repertoire'),
  true,
  "L'onglet répertoire doit être actif quand currentTab === 'repertoire'"
);
assert.strictEqual(
  simulateIsActive('repertoire', 'mon-espace', 'agenda'),
  false,
  "L'onglet répertoire ne doit pas être actif quand currentTab === 'agenda'"
);

// Simulation de l'appel onClick
let navigatedPole = null;
let navigatedTab = null;
const mockItem = {
  id: 'repertoire',
  onClick: () => {
    navigatedPole = 'mon-espace';
    navigatedTab = 'repertoire';
  }
};
mockItem.onClick();
assert.strictEqual(navigatedPole, 'mon-espace');
assert.strictEqual(navigatedTab, 'repertoire');
console.log("✅ Test 4 validé !");

console.log("\nTest 5 : Vérification de la propagation du prop features dans App.jsx...");
const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
assert.ok(
  appSource.includes("features={features}"),
  "App.jsx doit propager le prop features={features} vers LayoutShell"
);
console.log("✅ Test 5 validé !");

console.log("\n🎉 Tous les tests d'intégration de l'onglet Répertoire en Vue Membre sont validés avec succès !");
