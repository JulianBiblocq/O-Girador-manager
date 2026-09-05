/**
 * Test Automatisé du Module 6 : Pôle Secrétariat & Rapports AG
 * Validation des permissions RBAC, guides d'aide, rapports AG consolidés,
 * et balises data-tour.
 */

import fs from 'fs';
import path from 'path';
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

const SECRETAIRE_PROFILE = {
  uid: "secretaire_test_uid",
  id: "secretaire_test_uid",
  role: "membre",
  isSystemAdmin: false,
  tags: ["Secrétaire", "Bureau"]
};

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

const EXPECTED_TOUR_TARGETS = {
  'secretariat-reports': [
    'reports-period-selector',
    'reports-blocks-grid',
    'reports-export-actions'
  ]
};

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 6 : PÔLE SECRÉTARIAT ====");
  console.log("=================================================\n");

  const results = {
    permissions: { success: [], errors: [] },
    guides: { success: [], errors: [] },
    dataTourAttributes: { success: [], errors: [] }
  };

  // 1. Permissions RBAC
  console.log("--- 1. Permissions RBAC Pôle Secrétariat ---");

  // Tiago (Membre standard) : accès refusé
  const tiagoAccessPole = canAccessPole('secretariat', TIAGO_PROFILE);
  if (!tiagoAccessPole) {
    results.permissions.success.push("Tiago (Membre) : Accès refusé au pôle 'secretariat'");
  } else {
    results.permissions.errors.push("ALERTE : Tiago a accès au pôle 'secretariat'");
  }

  SECRETARIAT_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'secretariat', TIAGO_PROFILE);
    if (!hasTabAccess) {
      results.permissions.success.push(`Tiago (Membre) : Accès refusé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Tiago a accès à l'onglet '${tabId}'`);
    }
  });

  // Camila (Admin Bureau) : accès accordé
  const camilaAccessPole = canAccessPole('secretariat', CAMILA_PROFILE);
  if (camilaAccessPole) {
    results.permissions.success.push("Camila (Admin) : Accès accordé au pôle 'secretariat'");
  } else {
    results.permissions.errors.push("ALERTE : Camila n'a PAS accès au pôle 'secretariat'");
  }

  SECRETARIAT_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'secretariat', CAMILA_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Camila (Admin) : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Camila n'a PAS accès à l'onglet '${tabId}'`);
    }
  });

  // Profil Secrétaire (Membre avec tag métier Secrétaire/Bureau)
  const secrAccessPole = canAccessPole('secretariat', SECRETAIRE_PROFILE);
  if (secrAccessPole) {
    results.permissions.success.push("Secrétaire (Membre + Tag Secrétaire) : Accès accordé au pôle 'secretariat'");
  } else {
    results.permissions.errors.push("ALERTE : Le secrétaire avec tag 'Secrétaire' n'a pas accès au pôle");
  }

  SECRETARIAT_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'secretariat', SECRETAIRE_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Secrétaire : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Le secrétaire n'a pas accès à l'onglet '${tabId}'`);
    }
  });

  // 2. Guides et Visites Guidées Interactives (poleGuides.js)
  console.log("\n--- 2. Vérification des Guides poleGuides.js ---");

  // Guide général
  if (POLE_GUIDES['secretariat'] && POLE_GUIDES['secretariat'].etapes?.length > 0) {
    results.guides.success.push("Guide général 'secretariat' présent avec 3 étapes.");
  } else {
    results.guides.errors.push("Guide général 'secretariat' manquant.");
  }

  // Tous les 9 onglets doivent avoir un guide
  SECRETARIAT_TABS.forEach(tabId => {
    const g = POLE_GUIDES[tabId];
    if (g && g.titre && g.description && g.etapes?.length > 0) {
      results.guides.success.push(`Guide '${tabId}' rédigé et conforme (${g.etapes.length} étapes).`);
    } else {
      results.guides.errors.push(`Guide '${tabId}' manquant ou incomplet dans POLE_GUIDES !`);
    }
  });

  // Correspondance 1:1 étapes/cibles
  Object.entries(EXPECTED_TOUR_TARGETS).forEach(([tabId, expectedTargets]) => {
    const g = POLE_GUIDES[tabId];
    if (!g || !g.targets) {
      results.guides.errors.push(`Guide '${tabId}' ne possède pas de propriété targets.`);
      return;
    }

    if (g.targets.length !== g.etapes.length) {
      results.guides.errors.push(`Guide '${tabId}' : nombre de cibles (${g.targets.length}) != nombre d'étapes (${g.etapes.length}).`);
      return;
    }

    const matchesExpected = expectedTargets.every((t, i) => g.targets[i] === t);
    if (matchesExpected) {
      results.guides.success.push(`Guide '${tabId}' : cibles data-tour conformes (${expectedTargets.join(' -> ')}).`);
    } else {
      results.guides.errors.push(`Guide '${tabId}' : cibles discordantes (reçu: ${g.targets.join(', ')}).`);
    }
  });

  // 3. Présence des balises data-tour dans les composants React
  console.log("\n--- 3. Vérification des Attributs data-tour dans le Code ---");

  const reportsPath = path.resolve('src/components/secretariat/SecretariatReportsView.jsx');
  if (fs.existsSync(reportsPath)) {
    const content = fs.readFileSync(reportsPath, 'utf-8');
    EXPECTED_TOUR_TARGETS['secretariat-reports'].forEach(attr => {
      if (content.includes(`data-tour="${attr}"`)) {
        results.dataTourAttributes.success.push(`Balise data-tour="${attr}" trouvée dans SecretariatReportsView.jsx`);
      } else {
        results.dataTourAttributes.errors.push(`Balise data-tour="${attr}" MANQUANTE dans SecretariatReportsView.jsx`);
      }
    });
  } else {
    results.dataTourAttributes.errors.push("Fichier SecretariatReportsView.jsx introuvable.");
  }

  // 4. Bilan Global
  console.log("\n=================================================");
  console.log("=== BILAN DU MODULE 6 : PÔLE SECRÉTARIAT ========");
  console.log("=================================================");

  const totalSuccess = results.permissions.success.length + results.guides.success.length + results.dataTourAttributes.success.length;
  const totalErrors = results.permissions.errors.length + results.guides.errors.length + results.dataTourAttributes.errors.length;

  console.log(`\nSuccès total : ${totalSuccess}`);
  console.log(`Erreurs : ${totalErrors}`);

  if (totalErrors === 0) {
    console.log("\n🎉 TOUS LES TESTS DU MODULE 6 SONT VALIDÉS AVEC SUCCÈS !");
    process.exit(0);
  } else {
    console.error("\n❌ CERTAINS TESTS ONT ÉCHOUÉ :");
    [...results.permissions.errors, ...results.guides.errors, ...results.dataTourAttributes.errors].forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Erreur fatale lors de l'exécution du test :", err);
  process.exit(1);
});
