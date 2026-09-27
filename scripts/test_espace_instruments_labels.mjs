/**
 * Test de validation automatisé : Renommage des libellés Espace Instruments & Assignations
 * Vérifie :
 * 1. fr.js : poles.tabMateriel === 'Instruments' et userProfile.instrumentsHeading === 'Instruments & Assignations'
 * 2. pt.js : poles.tabMateriel === 'Instrumentos' et userProfile.instrumentsHeading === 'Instrumentos e Atribuições'
 * 3. App.jsx : onglet 'materiel' porte le label 'Instruments'
 * 4. LayoutShell.jsx : item 'materiel' porte le label 'Instruments'
 * 5. UserMateriel.jsx : le titre d'en-tête résout vers 'Instruments & Assignations'
 */

import assert from 'assert';
import fs from 'fs';

console.log("✂️ TEST SUITE : RENOMMAGE ESPACE INSTRUMENTS & ASSIGNATIONS ✂️\n");

// 1. Locales françaises
console.log("▶️ Test 1 : Vérification des traductions fr.js...");
const frContent = fs.readFileSync('src/locales/fr.js', 'utf8');
assert(
  frContent.includes('instrumentsHeading: "Instruments & Assignations",'),
  "fr.js doit contenir instrumentsHeading: 'Instruments & Assignations'"
);
assert(
  frContent.includes('tabMateriel: "Instruments",'),
  "fr.js doit contenir tabMateriel: 'Instruments'"
);
console.log("✅ Test 1 validé : fr.js à jour.\n");

// 2. Locales portugaises
console.log("▶️ Test 2 : Vérification des traductions pt.js...");
const ptContent = fs.readFileSync('src/locales/pt.js', 'utf8');
assert(
  ptContent.includes('instrumentsHeading: "Instrumentos e Atribuições",'),
  "pt.js doit contenir instrumentsHeading: 'Instrumentos e Atribuições'"
);
assert(
  ptContent.includes('tabMateriel: "Instrumentos",'),
  "pt.js doit contenir tabMateriel: 'Instrumentos'"
);
console.log("✅ Test 2 validé : pt.js à jour.\n");

// 3. App.jsx & LayoutShell.jsx
console.log("▶️ Test 3 : Vérification des menus de navigation...");
const appContent = fs.readFileSync('src/App.jsx', 'utf8');
assert(
  appContent.includes("{ id: 'materiel', label: 'Instruments', labelKey: 'tabMateriel' }"),
  "App.jsx doit déclarer l'onglet materiel avec le label 'Instruments'"
);

const layoutContent = fs.readFileSync('src/components/LayoutShell.jsx', 'utf8');
assert(
  layoutContent.includes("{ id: 'materiel', label: 'Instruments', labelKey: 'poles.tabMateriel'"),
  "LayoutShell.jsx doit déclarer l'item materiel avec le label 'Instruments'"
);
console.log("✅ Test 3 validé : App.jsx et LayoutShell.jsx à jour.\n");

// 4. UserMateriel.jsx
console.log("▶️ Test 4 : Vérification du composant UserMateriel.jsx...");
const userMaterielContent = fs.readFileSync('src/components/profile/UserMateriel.jsx', 'utf8');
assert(
  userMaterielContent.includes("translate('userProfile.instrumentsHeading', 'Instruments & Assignations')"),
  "UserMateriel.jsx doit utiliser 'Instruments & Assignations' comme texte de secours"
);
console.log("✅ Test 4 validé : UserMateriel.jsx à jour.\n");

console.log("🎉 TOUS LES TESTS DE RENOMMAGE ONT RÉUSSI AVEC SUCCÈS ! 🎉");
