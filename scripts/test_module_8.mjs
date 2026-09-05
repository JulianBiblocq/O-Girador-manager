/**
 * Test Automatisé du Module 8 : Pôle Trésorerie, Configuration & Visites Guidées
 * Validation des permissions RBAC financières, intégrité des 6 onglets de trésorerie,
 * comportement de getPoleGuide (exclusion membre vs inclusion admin).
 */

import { canAccessPole, canAccessTabPermission } from '../src/utils/permissionUtils.js';
import { POLE_GUIDES, getPoleGuide } from '../src/config/poleGuides.js';

const TIAGO_PROFILE = {
  uid: "lhVUdkIY3uY94UDPG9DlKN2HEQL2",
  id: "lhVUdkIY3uY94UDPG9DlKN2HEQL2",
  role: "membre",
  isSystemAdmin: false,
  tags: []
};

const CAMILA_PROFILE = {
  uid: "97R0qCLbJtOgOiJ4ojcosN6GfCF2",
  id: "97R0qCLbJtOgOiJ4ojcosN6GfCF2",
  role: "admin",
  isSystemAdmin: false,
  tags: ["Bureau", "Secrétaire", "Trésorier", "Logisticien"]
};

const TRESORIER_PROFILE = {
  uid: "tresorier_test_uid",
  id: "tresorier_test_uid",
  role: "membre",
  isSystemAdmin: false,
  tags: ["Trésorier", "Comptable"]
};

const TRESORERIE_TABS = [
  'dashboard-finance',
  'cotisations',
  'events-finances',
  'operations-diverses',
  'frais-km',
  'reports-exports'
];

const MEMBER_SIMPLE_TABS = [
  'profil',
  'agenda',
  'materiel',
  'vestiaire',
  'trombinoscope',
  'forum'
];

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 8 : TRÉSORERIE & CONFIG =");
  console.log("=================================================\n");

  const results = {
    permissions: { success: [], errors: [] },
    guides: { success: [], errors: [] },
    guideExclusions: { success: [], errors: [] }
  };

  // 1. Permissions RBAC Trésorerie
  console.log("--- 1. Permissions RBAC Pôle Trésorerie ---");

  // Tiago (Membre standard) : accès refusé
  const tiagoAccessPole = canAccessPole('tresorerie', TIAGO_PROFILE);
  if (!tiagoAccessPole) {
    results.permissions.success.push("Tiago (Membre) : Accès refusé au pôle 'tresorerie'");
  } else {
    results.permissions.errors.push("ALERTE : Tiago a accès au pôle 'tresorerie'");
  }

  TRESORERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'tresorerie', TIAGO_PROFILE);
    if (!hasTabAccess) {
      results.permissions.success.push(`Tiago (Membre) : Accès refusé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Tiago a accès à l'onglet '${tabId}'`);
    }
  });

  // Camila (Admin Bureau / Trésorier) : accès accordé
  const camilaAccessPole = canAccessPole('tresorerie', CAMILA_PROFILE);
  if (camilaAccessPole) {
    results.permissions.success.push("Camila (Admin) : Accès accordé au pôle 'tresorerie'");
  } else {
    results.permissions.errors.push("ALERTE : Camila n'a PAS accès au pôle 'tresorerie'");
  }

  TRESORERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'tresorerie', CAMILA_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Camila (Admin) : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Camila n'a PAS accès à l'onglet '${tabId}'`);
    }
  });

  // Profil Trésorier Dédié (Membre avec tag Trésorier)
  const tresorierAccessPole = canAccessPole('tresorerie', TRESORIER_PROFILE);
  if (tresorierAccessPole) {
    results.permissions.success.push("Trésorier (Membre + Tag Trésorier) : Accès accordé au pôle 'tresorerie'");
  } else {
    results.permissions.errors.push("ALERTE : Le trésorier avec tag 'Trésorier' n'a pas accès au pôle");
  }

  TRESORERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'tresorerie', TRESORIER_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Trésorier : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Le trésorier n'a pas accès à l'onglet '${tabId}'`);
    }
  });

  // 2. Guides et Visites Guidées Interactives de la Trésorerie
  console.log("\n--- 2. Vérification des Guides de Trésorerie ---");

  // Guide général
  if (POLE_GUIDES['tresorerie'] && POLE_GUIDES['tresorerie'].etapes?.length > 0) {
    results.guides.success.push("Guide général 'tresorerie' présent avec " + POLE_GUIDES['tresorerie'].etapes.length + " étapes.");
  } else {
    results.guides.errors.push("Guide général 'tresorerie' manquant.");
  }

  // Tous les 6 onglets doivent avoir un guide
  TRESORERIE_TABS.forEach(tabId => {
    const g = POLE_GUIDES[tabId];
    if (g && g.titre && g.description && g.etapes?.length > 0) {
      results.guides.success.push(`Guide '${tabId}' rédigé et conforme (${g.etapes.length} étapes).`);
    } else {
      results.guides.errors.push(`Guide '${tabId}' manquant ou incomplet dans POLE_GUIDES !`);
    }
  });

  // 3. Comportement de getPoleGuide (Filtrage Espace Membre vs Pôles Métiers)
  console.log("\n--- 3. Contrôle du Filtrage Intelligent des Guides (getPoleGuide) ---");

  // Espace Membre : doit retourner null pour ne pas polluer l'interface membre
  MEMBER_SIMPLE_TABS.forEach(tabKey => {
    const guide = getPoleGuide(tabKey, 'mon-espace');
    if (guide === null) {
      results.guideExclusions.success.push(`getPoleGuide('${tabKey}') retourne strictement null (vue membre épurée)`);
    } else {
      results.guideExclusions.errors.push(`ALERTE : getPoleGuide('${tabKey}') ne devrait PAS afficher de guide membre`);
    }
  });

  // Pôles d'Administration : doit retourner le guide métier enrichi
  const adminTabsToCheck = [
    { tab: 'dashboard-finance', pole: 'tresorerie' },
    { tab: 'cotisations', pole: 'tresorerie' },
    { tab: 'gigs-pipeline', pole: 'diffusion' },
    { tab: 'inventory-projects', pole: 'lutherie' },
    { tab: 'wardrobe-projects', pole: 'costumerie' },
    { tab: 'secretariat-reports', pole: 'secretariat' },
    { tab: 'mestre-stage-layout', pole: 'mestre' }
  ];

  adminTabsToCheck.forEach(({ tab, pole }) => {
    const guide = getPoleGuide(tab, pole);
    if (guide && guide.titre && guide.etapes?.length > 0) {
      results.guideExclusions.success.push(`getPoleGuide('${tab}', '${pole}') retourne le guide enrichi valide`);
    } else {
      results.guideExclusions.errors.push(`ALERTE : getPoleGuide('${tab}', '${pole}') n'a pas retourné de guide valide`);
    }
  });

  // 4. Bilan Global
  console.log("\n=================================================");
  console.log("=== BILAN DU MODULE 8 : TRÉSORERIE & CONFIG =====");
  console.log("=================================================");

  const totalSuccess = results.permissions.success.length + results.guides.success.length + results.guideExclusions.success.length;
  const totalErrors = results.permissions.errors.length + results.guides.errors.length + results.guideExclusions.errors.length;

  console.log(`\nSuccès total : ${totalSuccess}`);
  console.log(`Erreurs : ${totalErrors}`);

  if (totalErrors === 0) {
    console.log("\n🎉 TOUS LES TESTS DU MODULE 8 SONT VALIDÉS AVEC SUCCÈS !");
    process.exit(0);
  } else {
    console.error("\n❌ CERTAINS TESTS ONT ÉCHOUÉ :");
    [...results.permissions.errors, ...results.guides.errors, ...results.guideExclusions.errors].forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Erreur fatale lors de l'exécution du test :", err);
  process.exit(1);
});
