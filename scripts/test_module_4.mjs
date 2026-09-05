/**
 * Test Automatisé du Module 4 : Pôle Lutherie & Artisanat Instrumental
 * Validation des permissions RBAC, contrôle de validation d'atelier,
 * correspondances des guides pas-à-pas et balises data-tour.
 */

import fs from 'fs';
import path from 'path';
import { canAccessPole, canAccessTabPermission, canValidateWorkshop } from '../src/utils/permissionUtils.js';
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

const ARTISAN_PROFILE = {
  uid: "artisan_test_uid",
  id: "artisan_test_uid",
  role: "membre",
  isSystemAdmin: false,
  tags: ["Luthier", "Maître d'atelier"]
};

const LUTHERIE_TABS = [
  'inventory-projects',
  'instrument-models',
  'inventory-parts',
  'inventory-supplies',
  'workshop-tools',
  'varal-lutherie'
];

const EXPECTED_TOUR_TARGETS = {
  'inventory-projects': [
    'lutherie-new-project-btn',
    'lutherie-project-slots',
    'lutherie-finalize-btn'
  ],
  'instrument-models': [
    'lutherie-models-grid',
    'lutherie-model-blueprint',
    'lutherie-models-grid'
  ],
  'inventory-parts': [
    'lutherie-new-part-btn',
    'lutherie-parts-table',
    'lutherie-parts-filters'
  ]
};

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 4 : PÔLE LUTHERIE =======");
  console.log("=================================================\n");

  const results = {
    permissions: { success: [], errors: [] },
    guides: { success: [], errors: [] },
    dataTourAttributes: { success: [], errors: [] }
  };

  // 1. Permissions RBAC
  console.log("--- 1. Permissions RBAC & Contrôle d'Atelier ---");

  // Tiago (Membre) : accès refusé au pôle et aux onglets de lutherie
  const tiagoAccessPole = canAccessPole('lutherie', TIAGO_PROFILE);
  if (!tiagoAccessPole) {
    results.permissions.success.push("Tiago (Membre) : Accès refusé au pôle 'lutherie'");
  } else {
    results.permissions.errors.push("ALERTE : Tiago a accès au pôle 'lutherie'");
  }

  const tiagoValidateWorkshop = canValidateWorkshop(TIAGO_PROFILE);
  if (!tiagoValidateWorkshop) {
    results.permissions.success.push("Tiago (Membre) : Validation d'atelier refusée (canValidateWorkshop = false)");
  } else {
    results.permissions.errors.push("ALERTE : Tiago peut valider les étapes d'atelier");
  }

  LUTHERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'lutherie', TIAGO_PROFILE);
    if (!hasTabAccess) {
      results.permissions.success.push(`Tiago (Membre) : Accès refusé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Tiago a accès à l'onglet '${tabId}'`);
    }
  });

  // Camila (Admin) : accès accordé au pôle et validation d'atelier accordée
  const camilaAccessPole = canAccessPole('lutherie', CAMILA_PROFILE);
  if (camilaAccessPole) {
    results.permissions.success.push("Camila (Admin) : Accès accordé au pôle 'lutherie'");
  } else {
    results.permissions.errors.push("ALERTE : Camila n'a PAS accès au pôle 'lutherie'");
  }

  const camilaValidateWorkshop = canValidateWorkshop(CAMILA_PROFILE);
  if (camilaValidateWorkshop) {
    results.permissions.success.push("Camila (Admin) : Validation d'atelier accordée (canValidateWorkshop = true)");
  } else {
    results.permissions.errors.push("ALERTE : Camila ne peut pas valider les étapes d'atelier");
  }

  LUTHERIE_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'lutherie', CAMILA_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Camila (Admin) : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Camila n'a PAS accès à l'onglet '${tabId}'`);
    }
  });

  // Profil Artisan / Luthier (membre avec badge d'atelier)
  const artisanAccessPole = canAccessPole('lutherie', ARTISAN_PROFILE);
  if (artisanAccessPole) {
    results.permissions.success.push("Artisan (Membre + Tag Luthier) : Accès accordé au pôle 'lutherie'");
  } else {
    results.permissions.errors.push("ALERTE : L'artisan avec tag 'Luthier' n'a pas accès au pôle");
  }

  const artisanValidateWorkshop = canValidateWorkshop(ARTISAN_PROFILE);
  if (artisanValidateWorkshop) {
    results.permissions.success.push("Artisan (Membre + Tag Luthier) : Validation d'atelier accordée");
  } else {
    results.permissions.errors.push("ALERTE : L'artisan ne peut pas valider les étapes d'atelier");
  }

  // 2. Guides d'Aide dans poleGuides.js
  console.log("\n--- 2. Vérification des Guides poleGuides.js ---");

  // Guide général
  if (POLE_GUIDES['lutherie'] && POLE_GUIDES['lutherie'].etapes?.length > 0) {
    results.guides.success.push("Guide général 'lutherie' présent avec 3 étapes.");
  } else {
    results.guides.errors.push("Guide général 'lutherie' manquant.");
  }

  // Tous les 6 onglets doivent avoir un guide
  LUTHERIE_TABS.forEach(tabId => {
    const g = POLE_GUIDES[tabId];
    if (g && g.titre && g.description && g.etapes?.length > 0) {
      results.guides.success.push(`Guide '${tabId}' rédigé et conforme (${g.etapes.length} étapes).`);
    } else {
      results.guides.errors.push(`Guide '${tabId}' manquant ou incomplet dans POLE_GUIDES !`);
    }
  });

  // Correspondance 1:1 étapes/cibles pour les onglets interactifs
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
      results.guides.errors.push(`Guide '${tabId}' : cibles data-tour discordantes (reçu: ${g.targets.join(', ')}).`);
    }
  });

  // 3. Présence des balises data-tour dans les composants React
  console.log("\n--- 3. Vérification des Attributs data-tour dans le Code ---");

  const componentsToCheck = [
    { file: 'src/components/inventory/InventoryProjectsView.jsx', attrs: ['lutherie-new-project-btn', 'lutherie-project-slots', 'lutherie-finalize-btn'] },
    { file: 'src/components/inventory/InventoryPartsView.jsx', attrs: ['lutherie-new-part-btn', 'lutherie-parts-table', 'lutherie-parts-filters'] },
    { file: 'src/components/varal/InstrumentModelsManager.jsx', attrs: ['lutherie-models-grid', 'lutherie-model-blueprint'] }
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
  console.log("=== BILAN DU MODULE 4 : PÔLE LUTHERIE ===========");
  console.log("=================================================");

  const totalSuccess = results.permissions.success.length + results.guides.success.length + results.dataTourAttributes.success.length;
  const totalErrors = results.permissions.errors.length + results.guides.errors.length + results.dataTourAttributes.errors.length;

  console.log(`\nSuccès total : ${totalSuccess}`);
  console.log(`Erreurs : ${totalErrors}`);

  if (totalErrors === 0) {
    console.log("\n🎉 TOUS LES TESTS DU MODULE 4 SONT VALIDÉS AVEC SUCCÈS !");
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
