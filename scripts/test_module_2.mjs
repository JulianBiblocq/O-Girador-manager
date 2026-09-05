/**
 * Test Automatisé du Module 2 : Pôle Mestria
 * Validation des fonctionnalités, permissions et balises data-tour
 */

import { canAccessPole, canAccessTabPermission } from '../src/utils/permissionUtils.js';
import { POLE_GUIDES } from '../src/config/poleGuides.js';

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

const MESTRIA_TABS = [
  'mestre-orientation',
  'mestre-events',
  'mestre-stage-layout',
  'mestre-sequenceur',
  'mestre-mot-mestre'
];

const EXPECTED_TOUR_TARGETS = {
  'mestre-orientation': [
    'mestre-orientation-gauges',
    'mestre-orientation-table',
    'mestre-orientation-assignment'
  ],
  'mestre-stage-layout': [
    'mestre-stage-grid',
    'mestre-stage-roster',
    'mestre-stage-grid'
  ],
  'mestre-sequenceur': [
    'mestre-sequenceur-list',
    'mestre-sequenceur-metadata',
    'mestre-sequenceur-list'
  ]
};

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 2 : PÔLE MESTRIA =======");
  console.log("=================================================\n");

  const results = {
    permissions: { success: [], errors: [] },
    guides: { success: [], errors: [] }
  };

  // 1. Permissions RBAC
  console.log("--- 1. Vérification des Permissions RBAC ---");
  
  // Tiago ne doit pas avoir accès au pôle Mestria
  const tiagoAccessMestre = canAccessPole('mestre', TIAGO_PROFILE);
  if (!tiagoAccessMestre) {
    results.permissions.success.push("Accès refusé à Tiago (Membre) sur le pôle 'mestre'");
  } else {
    results.permissions.errors.push("ALERTE : Tiago a accès au pôle 'mestre'");
  }

  for (const tab of MESTRIA_TABS) {
    const tiagoTab = canAccessTabPermission(tab, 'mestre', TIAGO_PROFILE);
    if (!tiagoTab) {
      results.permissions.success.push(`Onglet '${tab}' inaccessible à Tiago`);
    } else {
      results.permissions.errors.push(`ALERTE : Tiago peut accéder à l'onglet '${tab}'`);
    }
  }

  // Camila doit avoir accès au pôle Mestria
  const camilaAccessMestre = canAccessPole('mestre', CAMILA_PROFILE);
  if (camilaAccessMestre) {
    results.permissions.success.push("Accès accordé à Camila (Admin) sur le pôle 'mestre'");
  } else {
    results.permissions.errors.push("Erreur : Camila n'a pas accès au pôle 'mestre'");
  }

  for (const tab of MESTRIA_TABS) {
    const camilaTab = canAccessTabPermission(tab, 'mestre', CAMILA_PROFILE);
    if (camilaTab) {
      results.permissions.success.push(`Onglet '${tab}' accessible à Camila`);
    } else {
      results.permissions.errors.push(`Erreur : L'onglet '${tab}' est refusé à Camila`);
    }
  }

  // 2. Conformité des Guides et Cibles de Visite Pas-à-Pas
  console.log("\n--- 2. Vérification des Guides & Cibles Pas-à-Pas ---");
  for (const [tabId, expectedTargets] of Object.entries(EXPECTED_TOUR_TARGETS)) {
    const guide = POLE_GUIDES[tabId];
    if (!guide) {
      results.guides.errors.push(`Guide introuvable pour '${tabId}' dans poleGuides.js`);
      continue;
    }

    if (!Array.isArray(guide.targets)) {
      results.guides.errors.push(`Propriété 'targets' manquante pour '${tabId}'`);
      continue;
    }

    const matches = JSON.stringify(guide.targets) === JSON.stringify(expectedTargets);
    if (matches) {
      results.guides.success.push(`Cibles targets valides pour '${tabId}' : [${guide.targets.join(', ')}]`);
    } else {
      results.guides.errors.push(`Cibles incorrectes pour '${tabId}' : attendu [${expectedTargets}], reçu [${guide.targets}]`);
    }

    // Vérifier corrélation longueur étapes / cibles
    if (guide.etapes && guide.etapes.length === guide.targets.length) {
      results.guides.success.push(`Corrélation 1:1 étapes (${guide.etapes.length}) / cibles (${guide.targets.length}) pour '${tabId}'`);
    } else {
      results.guides.errors.push(`Incohérence nombre d'étapes (${guide.etapes?.length}) vs cibles (${guide.targets.length}) pour '${tabId}'`);
    }
  }

  // 3. Synthèse
  console.log("\n=================================================");
  console.log(`PERMISSIONS : ${results.permissions.success.length} succès, ${results.permissions.errors.length} erreurs`);
  console.log(`GUIDES TOUR : ${results.guides.success.length} succès, ${results.guides.errors.length} erreurs`);
  console.log("=================================================");

  if (results.permissions.errors.length > 0 || results.guides.errors.length > 0) {
    console.error("Détails des erreurs :");
    console.error("Permissions :", results.permissions.errors);
    console.error("Guides :", results.guides.errors);
    process.exit(1);
  }

  console.log("✅ TOUS LES TESTS DU MODULE 2 SONT AU VERT !");
  process.exit(0);
}

runTests();
