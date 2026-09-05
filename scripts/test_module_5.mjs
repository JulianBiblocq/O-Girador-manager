/**
 * Test Automatisé du Module 5 : Pôle Costumerie & Artisanat Textile
 * Validation des permissions RBAC, gestion des tenues, modèles de costumes,
 * chantiers de confection, guides et cibles data-tour.
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

const COSTUMIER_PROFILE = {
  uid: "costumier_test_uid",
  id: "costumier_test_uid",
  role: "membre",
  isSystemAdmin: false,
  tags: ["Costumière", "Couture"]
};

const COSTUMERIE_TABS = [
  'wardrobe-projects',
  'wardrobe-models',
  'wardrobe-pieces',
  'wardrobe-supplies',
  'wardrobe-tools',
  'wardrobe-sizes',
  'varal-costumerie'
];

const EXPECTED_TOUR_TARGETS = {
  'wardrobe-projects': [
    'costumerie-new-project-btn',
    'costumerie-projects-grid',
    'costumerie-project-steps'
  ],
  'wardrobe-models': [
    'costumerie-models-cards',
    'costumerie-models-cards',
    'costumerie-models-cards'
  ],
  'wardrobe-pieces': [
    'costumerie-pieces-table',
    'costumerie-pieces-assign',
    'costumerie-pieces-table'
  ]
};

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 5 : PÔLE COSTUMERIE =====");
  console.log("=================================================\n");

  const results = {
    permissions: { success: [], errors: [] },
    guides: { success: [], errors: [] },
    dataTourAttributes: { success: [], errors: [] }
  };

  // 1. Permissions RBAC
  console.log("--- 1. Permissions RBAC Pôle Costumerie ---");

  // Tiago (Membre standard) : accès refusé
  const tiagoAccessPole = canAccessPole('costumerie', TIAGO_PROFILE);
  if (!tiagoAccessPole) {
    results.permissions.success.push("Tiago (Membre) : Accès refusé au pôle 'costumerie'");
  } else {
    results.permissions.errors.push("ALERTE : Tiago a accès au pôle 'costumerie'");
  }

  COSTUMERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'costumerie', TIAGO_PROFILE);
    if (!hasTabAccess) {
      results.permissions.success.push(`Tiago (Membre) : Accès refusé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Tiago a accès à l'onglet '${tabId}'`);
    }
  });

  // Camila (Admin Bureau) : accès accordé
  const camilaAccessPole = canAccessPole('costumerie', CAMILA_PROFILE);
  if (camilaAccessPole) {
    results.permissions.success.push("Camila (Admin) : Accès accordé au pôle 'costumerie'");
  } else {
    results.permissions.errors.push("ALERTE : Camila n'a PAS accès au pôle 'costumerie'");
  }

  COSTUMERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'costumerie', CAMILA_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Camila (Admin) : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Camila n'a PAS accès à l'onglet '${tabId}'`);
    }
  });

  // Profil Costumier / Couturier (Membre avec tag métier)
  const costumierAccessPole = canAccessPole('costumerie', COSTUMIER_PROFILE);
  if (costumierAccessPole) {
    results.permissions.success.push("Costumière (Membre + Tag Couture) : Accès accordé au pôle 'costumerie'");
  } else {
    results.permissions.errors.push("ALERTE : La costumière avec tag 'Couture' n'a pas accès au pôle");
  }

  COSTUMERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'costumerie', COSTUMIER_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Costumière : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : La costumière n'a pas accès à l'onglet '${tabId}'`);
    }
  });

  // 2. Guides et Visites Guidées Interactives (poleGuides.js)
  console.log("\n--- 2. Vérification des Guides poleGuides.js ---");

  // Guide général
  if (POLE_GUIDES['costumerie'] && POLE_GUIDES['costumerie'].etapes?.length > 0) {
    results.guides.success.push("Guide général 'costumerie' présent avec 3 étapes.");
  } else {
    results.guides.errors.push("Guide général 'costumerie' manquant.");
  }

  // Tous les 7 onglets doivent avoir un guide
  COSTUMERIE_TABS.forEach(tabId => {
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

  const componentsToCheck = [
    {
      file: 'src/components/mestre/WardrobeManager.jsx',
      attrs: [
        'costumerie-pieces-table',
        'costumerie-pieces-assign',
        'costumerie-new-project-btn',
        'costumerie-projects-grid',
        'costumerie-project-steps'
      ]
    },
    {
      file: 'src/components/mestre/CostumesAdminManager.jsx',
      attrs: ['costumerie-models-cards']
    }
  ];

  componentsToCheck.forEach(({ file, attrs }) => {
    const fullPath = path.resolve(file);
    if (!fs.existsSync(fullPath)) {
      results.dataTourAttributes.errors.push(`Fichier introuvable : ${file}`);
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    attrs.forEach(attr => {
      if (content.includes(`data-tour="${attr}"`)) {
        results.dataTourAttributes.success.push(`Balise data-tour="${attr}" trouvée dans ${file}`);
      } else {
        results.dataTourAttributes.errors.push(`Balise data-tour="${attr}" MANQUANTE dans ${file}`);
      }
    });
  });

  // 4. Bilan Global
  console.log("\n=================================================");
  console.log("=== BILAN DU MODULE 5 : PÔLE COSTUMERIE =========");
  console.log("=================================================");

  const totalSuccess = results.permissions.success.length + results.guides.success.length + results.dataTourAttributes.success.length;
  const totalErrors = results.permissions.errors.length + results.guides.errors.length + results.dataTourAttributes.errors.length;

  console.log(`\nSuccès total : ${totalSuccess}`);
  console.log(`Erreurs : ${totalErrors}`);

  if (totalErrors === 0) {
    console.log("\n🎉 TOUS LES TESTS DU MODULE 5 SONT VALIDÉS AVEC SUCCÈS !");
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
