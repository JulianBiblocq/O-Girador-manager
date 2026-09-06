/**
 * Test Automatisé : Validation du Pôle Gouvernance & Assainissement du Badge CA
 * Vérifie :
 * 1. Profil CA pur (Mon Espace + Gouvernance uniquement, 0 cadenas, disparition de Trésorerie, Diffusion, Secrétariat)
 * 2. Profils cumulés (Trésorier + CA, Secrétaire + CA)
 * 3. Activation / Désactivation modulaire via enabledModules
 */

import { canAccessPole, canAccessTabPermission } from '../src/utils/permissionUtils.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log("🧪 TEST 1 : Compte « CA pur » (sans casquette Bureau)");
console.log("=======================================================");

const CA_PUR_PROFILE = {
  uid: "ca_pur_user_1",
  prenom: "Alain",
  nom: "Conseil",
  role: "membre",
  isSystemAdmin: false,
  tags: ["CA"]
};

const GOUVERNANCE_TABS = [
  'ca-reunions',
  'ca-reports',
  'ca-documents',
  'ca-finances',
  'ca-prestations'
];

const SECRETARIAT_TABS = [
  'export-annu',
  'studio-events',
  'reunion-manager',
  'varal-secretariat',
  'mestre-forum-channels',
  'activity-reports',
  'secretariat-reports',
  'secretariat-documents',
  'secretariat-lieux'
];

const TRESORERIE_TABS = [
  'dashboard-finance',
  'cotisations',
  'events-finances',
  'operations-diverses',
  'frais-km',
  'reports-exports'
];

const DIFFUSION_TABS = [
  'gigs-pipeline',
  'diffusion-contacts'
];

// Vérification déverrouillage pôles
assert(canAccessPole('gouvernance', CA_PUR_PROFILE) === true, "Le Pôle Gouvernance est accessible au badge CA");
assert(canAccessPole('secretariat', CA_PUR_PROFILE) === false, "Le Pôle Secrétariat n'est PLUS accessible par défaut au badge CA (assaini)");
assert(canAccessPole('tresorerie', CA_PUR_PROFILE) === false, "Le Pôle Trésorerie n'est pas accessible au badge CA pur");
assert(canAccessPole('diffusion', CA_PUR_PROFILE) === false, "Le Pôle Diffusion n'est pas accessible au badge CA pur");
assert(canAccessPole('logistique', CA_PUR_PROFILE) === false, "Le Pôle Logistique n'est pas accessible au badge CA pur");
assert(canAccessPole('mestre', CA_PUR_PROFILE) === false, "Le Pôle Mestria n'est pas accessible au badge CA pur");

// Vérification onglets Gouvernance
GOUVERNANCE_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'gouvernance', CA_PUR_PROFILE) === true,
    `Onglet Gouvernance déverrouillé sans cadenas : ${tabId}`
  );
});

// Vérification étanchéité Secrétariat
SECRETARIAT_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'secretariat', CA_PUR_PROFILE) === false,
    `Onglet Secrétariat strictement refusé au CA pur : ${tabId}`
  );
});

// Vérification étanchéité Trésorerie opérationnelle
TRESORERIE_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'tresorerie', CA_PUR_PROFILE) === false,
    `Onglet Trésorerie strictement refusé au CA pur : ${tabId}`
  );
});

// Vérification étanchéité Diffusion
DIFFUSION_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'diffusion', CA_PUR_PROFILE) === false,
    `Onglet Diffusion strictement refusé au CA pur : ${tabId}`
  );
});

console.log("\n=======================================================");
console.log("🧪 TEST 2 : Cumul de casquettes (Trésorier + CA / Secrétaire + CA)");
console.log("=======================================================");

const TRESORIER_CA_PROFILE = {
  uid: "tresorier_ca_user",
  prenom: "Claire",
  nom: "Compta",
  role: "membre",
  isSystemAdmin: false,
  tags: ["Trésorier", "CA"]
};

assert(canAccessPole('gouvernance', TRESORIER_CA_PROFILE) === true, "Trésorier + CA a accès à Gouvernance");
assert(canAccessPole('tresorerie', TRESORIER_CA_PROFILE) === true, "Trésorier + CA conserve l'accès complet à Trésorerie");
assert(canAccessPole('secretariat', TRESORIER_CA_PROFILE) === false, "Trésorier + CA n'a pas accès au Secrétariat");

TRESORERIE_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'tresorerie', TRESORIER_CA_PROFILE) === true,
    `Trésorier + CA accède à son onglet métier : ${tabId}`
  );
});
GOUVERNANCE_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'gouvernance', TRESORIER_CA_PROFILE) === true,
    `Trésorier + CA accède à son onglet gouvernance : ${tabId}`
  );
});

const SECRETAIRE_CA_PROFILE = {
  uid: "secretaire_ca_user",
  prenom: "Marc",
  nom: "Plume",
  role: "membre",
  isSystemAdmin: false,
  tags: ["Secrétaire", "CA"]
};

assert(canAccessPole('gouvernance', SECRETAIRE_CA_PROFILE) === true, "Secrétaire + CA a accès à Gouvernance");
assert(canAccessPole('secretariat', SECRETAIRE_CA_PROFILE) === true, "Secrétaire + CA conserve l'accès complet à Secrétariat");
assert(canAccessPole('tresorerie', SECRETAIRE_CA_PROFILE) === false, "Secrétaire + CA n'a pas accès à Trésorerie");

SECRETARIAT_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'secretariat', SECRETAIRE_CA_PROFILE) === true,
    `Secrétaire + CA accède à son onglet secrétariat : ${tabId}`
  );
});
GOUVERNANCE_TABS.forEach(tabId => {
  assert(
    canAccessTabPermission(tabId, 'gouvernance', SECRETAIRE_CA_PROFILE) === true,
    `Secrétaire + CA accède à son onglet gouvernance : ${tabId}`
  );
});

console.log("\n=======================================================");
console.log("🧪 TEST 3 : Activation / Désactivation modulaire");
console.log("=======================================================");

// Simulation isModuleEnabled et isPoleEnabled
function simulateIsPoleEnabled(poleId, enabledModules) {
  if (poleId === 'accueil' || poleId === 'mon-espace') return true;
  if (poleId === 'gouvernance' && enabledModules?.gouvernance === false) return false;
  if (poleId === 'tresorerie' && enabledModules?.tresorerie === false) return false;
  return true;
}

function simulateCheckTabAccess(tabId, poleId, profileData, enabledModules) {
  if (poleId === 'gouvernance' && enabledModules?.gouvernance === false) return false;
  if (['dashboard-finance', 'ca-finances'].includes(tabId) && enabledModules?.tresorerie === false) return false;
  if (['gigs-pipeline', 'ca-prestations'].includes(tabId) && enabledModules?.diffusion === false) return false;
  return canAccessTabPermission(tabId, poleId, profileData);
}

// 3.1 Module gouvernance activé (défaut)
const modulesON = { gouvernance: true, tresorerie: true, diffusion: true };
assert(simulateIsPoleEnabled('gouvernance', modulesON) === true, "Pôle Gouvernance activé dans les modules");
assert(simulateCheckTabAccess('ca-reunions', 'gouvernance', CA_PUR_PROFILE, modulesON) === true, "Onglet ca-reunions accessible quand gouvernance est ON");

// 3.2 Module gouvernance désactivé (interrupteur OFF)
const modulesOFF = { gouvernance: false, tresorerie: true, diffusion: true };
assert(simulateIsPoleEnabled('gouvernance', modulesOFF) === false, "Pôle Gouvernance masqué quand l'interrupteur est OFF");
assert(simulateCheckTabAccess('ca-reunions', 'gouvernance', CA_PUR_PROFILE, modulesOFF) === false, "Onglet ca-reunions bloqué quand gouvernance est OFF");
assert(simulateCheckTabAccess('ca-finances', 'gouvernance', CA_PUR_PROFILE, modulesOFF) === false, "Onglet ca-finances bloqué quand gouvernance est OFF");

// 3.3 Module gouvernance par défaut (undefined)
const modulesDefault = {};
assert(simulateIsPoleEnabled('gouvernance', modulesDefault) === true, "Pôle Gouvernance actif par défaut si le champ Firestore est absent");

console.log("\n=======================================================");
console.log(`📊 RÉSULTAT GLOBAL : ${passed} PASS, ${failed} FAIL`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
