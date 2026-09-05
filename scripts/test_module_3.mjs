/**
 * Test Automatisé du Module 3 : Pôle Diffusion & Prestations
 * Validation des permissions RBAC, guides interactifs data-tour,
 * et de la logique métier (pipeline Kanban, CRM contacts, réconciliation des statuts).
 */

import fs from 'fs';
import path from 'path';
import { canAccessPole, canAccessTabPermission, canAccessDiffusion } from '../src/utils/permissionUtils.js';
import { POLE_GUIDES } from '../src/config/poleGuides.js';
import { matchesGigStatus, isToRelance } from '../src/utils/diffusionUtils.js';

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

const DIFFUSION_TABS = [
  'gigs-pipeline',
  'diffusion-contacts'
];

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 3 : PÔLE DIFFUSION ======");
  console.log("=================================================\n");

  const results = {
    permissions: { success: [], errors: [] },
    guides: { success: [], errors: [] },
    businessLogic: { success: [], errors: [] }
  };

  // 1. Permissions RBAC
  console.log("--- 1. Vérification des Permissions RBAC ---");

  // Tiago (Membre) : accès refusé
  const tiagoAccessPole = canAccessPole('diffusion', TIAGO_PROFILE);
  if (!tiagoAccessPole) {
    results.permissions.success.push("Tiago (Membre) : Accès refusé au pôle 'diffusion'");
  } else {
    results.permissions.errors.push("ALERTE : Tiago a accès au pôle 'diffusion'");
  }

  const tiagoAccessDiffusion = canAccessDiffusion(TIAGO_PROFILE);
  if (!tiagoAccessDiffusion) {
    results.permissions.success.push("Tiago (Membre) : canAccessDiffusion() retourne false");
  } else {
    results.permissions.errors.push("ALERTE : canAccessDiffusion(Tiago) retourne true");
  }

  DIFFUSION_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'diffusion', TIAGO_PROFILE);
    if (!hasTabAccess) {
      results.permissions.success.push(`Tiago (Membre) : Accès refusé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Tiago a accès à l'onglet '${tabId}'`);
    }
  });

  // Camila (Admin) : accès accordé
  const camilaAccessPole = canAccessPole('diffusion', CAMILA_PROFILE);
  if (camilaAccessPole) {
    results.permissions.success.push("Camila (Admin) : Accès accordé au pôle 'diffusion'");
  } else {
    results.permissions.errors.push("ALERTE : Camila n'a PAS accès au pôle 'diffusion'");
  }

  const camilaAccessDiffusion = canAccessDiffusion(CAMILA_PROFILE);
  if (camilaAccessDiffusion) {
    results.permissions.success.push("Camila (Admin) : canAccessDiffusion() retourne true");
  } else {
    results.permissions.errors.push("ALERTE : canAccessDiffusion(Camila) retourne false");
  }

  DIFFUSION_TABS.forEach(tabId => {
    const hasTabAccess = canAccessTabPermission(tabId, 'diffusion', CAMILA_PROFILE);
    if (hasTabAccess) {
      results.permissions.success.push(`Camila (Admin) : Accès accordé à l'onglet '${tabId}'`);
    } else {
      results.permissions.errors.push(`ALERTE : Camila n'a PAS accès à l'onglet '${tabId}'`);
    }
  });

  // 2. Guides et Visites Guidées Interactives (poleGuides.js et data-tour)
  console.log("\n--- 2. Vérification des Guides & Balises data-tour ---");

  // Guide général diffusion
  if (POLE_GUIDES['diffusion'] && POLE_GUIDES['diffusion'].etapes?.length > 0) {
    results.guides.success.push("Guide général 'diffusion' présent avec " + POLE_GUIDES['diffusion'].etapes.length + " étapes.");
  } else {
    results.guides.errors.push("Guide général 'diffusion' manquant ou incomplet.");
  }

  // Guide gigs-pipeline
  const gigsGuide = POLE_GUIDES['gigs-pipeline'];
  if (gigsGuide && gigsGuide.targets && gigsGuide.targets.length === gigsGuide.etapes.length) {
    results.guides.success.push(`Guide 'gigs-pipeline' conforme : ${gigsGuide.targets.length} cibles pour ${gigsGuide.etapes.length} étapes.`);
  } else {
    results.guides.errors.push(`Incohérence étapes/cibles dans le guide 'gigs-pipeline'.`);
  }

  // Guide diffusion-contacts
  const contactsGuide = POLE_GUIDES['diffusion-contacts'];
  if (contactsGuide && contactsGuide.targets && contactsGuide.targets.length === contactsGuide.etapes.length) {
    results.guides.success.push(`Guide 'diffusion-contacts' conforme : ${contactsGuide.targets.length} cibles pour ${contactsGuide.etapes.length} étapes.`);
  } else {
    results.guides.errors.push(`Incohérence étapes/cibles dans le guide 'diffusion-contacts'.`);
  }

  // Vérification de la présence des data-tour dans les fichiers composants
  const gigsPipelineCode = fs.readFileSync(path.resolve('src/components/diffusion/GigsPipelineManager.jsx'), 'utf-8');
  ['gigs-add-button', 'gigs-kanban-board'].forEach(attr => {
    if (gigsPipelineCode.includes(`data-tour="${attr}"`)) {
      results.guides.success.push(`GigsPipelineManager.jsx contient bien data-tour="${attr}"`);
    } else {
      results.guides.errors.push(`GigsPipelineManager.jsx : balise data-tour="${attr}" manquante !`);
    }
  });

  const contactsManagerCode = fs.readFileSync(path.resolve('src/components/diffusion/DiffusionContactsManager.jsx'), 'utf-8');
  ['contacts-add-button', 'contacts-filter-bar', 'contacts-table'].forEach(attr => {
    if (contactsManagerCode.includes(`data-tour="${attr}"`)) {
      results.guides.success.push(`DiffusionContactsManager.jsx contient bien data-tour="${attr}"`);
    } else {
      results.guides.errors.push(`DiffusionContactsManager.jsx : balise data-tour="${attr}" manquante !`);
    }
  });

  // 3. Logique Métier & Réconciliation de Statuts
  console.log("\n--- 3. Logique Métier du Pôle Diffusion ---");

  // Tolérance des statuts de gigs (matchesGigStatus)
  const statusTestCases = [
    { current: '3_devis_envoye', target: '3_devis', expected: true },
    { current: '2_option_posee', target: '2_option', expected: true },
    { current: '4_contrat_envoye', target: '4_contrat', expected: true },
    { current: '5_facture_emise', target: '5_facture', expected: true },
    { current: '6_valide', target: '6_paye', expected: true },
    { current: '1_demande', target: '1_demande', expected: true },
    { current: '1_demande', target: '3_devis', expected: false },
    { current: '7_annule', target: '6_paye', expected: false }
  ];

  let statusAllOk = true;
  statusTestCases.forEach(tc => {
    const res = matchesGigStatus(tc.current, tc.target);
    if (res !== tc.expected) {
      statusAllOk = false;
      results.businessLogic.errors.push(`Échec matchesGigStatus('${tc.current}', '${tc.target}') => reçu ${res}, attendu ${tc.expected}`);
    }
  });
  if (statusAllOk) {
    results.businessLogic.success.push(`matchesGigStatus : Tous les ${statusTestCases.length} cas de réconciliation de statut sont validés.`);
  }

  // Calcul du badge de relance CRM (isToRelance)
  const today = new Date();
  const pastDate = new Date(today); pastDate.setDate(today.getDate() - 3);
  const soonDate = new Date(today); soonDate.setDate(today.getDate() + 3);
  const farDate = new Date(today); farDate.setDate(today.getDate() + 20);

  const pastStr = pastDate.toISOString().split('T')[0];
  const soonStr = soonDate.toISOString().split('T')[0];
  const farStr = farDate.toISOString().split('T')[0];

  if (isToRelance(pastStr) === true) {
    results.businessLogic.success.push("isToRelance : Date dépassée correctement signalée pour relance.");
  } else {
    results.businessLogic.errors.push("isToRelance : Échec détection relance pour date passée.");
  }

  if (isToRelance(soonStr) === true) {
    results.businessLogic.success.push("isToRelance : Date dans les 7 jours correctement signalée pour relance.");
  } else {
    results.businessLogic.errors.push("isToRelance : Échec détection relance pour date < 7 jours.");
  }

  if (isToRelance(farStr) === false) {
    results.businessLogic.success.push("isToRelance : Date lointaine (> 7 jours) correctement non signalée.");
  } else {
    results.businessLogic.errors.push("isToRelance : Fausse alerte pour date > 7 jours.");
  }

  // 4. Bilan Global
  console.log("\n=================================================");
  console.log("=== BILAN DU MODULE 3 : PÔLE DIFFUSION ==========");
  console.log("=================================================");

  const totalSuccess = results.permissions.success.length + results.guides.success.length + results.businessLogic.success.length;
  const totalErrors = results.permissions.errors.length + results.guides.errors.length + results.businessLogic.errors.length;

  console.log(`\nSuccès total : ${totalSuccess}`);
  console.log(`Erreurs : ${totalErrors}`);

  if (totalErrors === 0) {
    console.log("\n🎉 TOUS LES TESTS DU MODULE 3 SONT VALIDÉS AVEC SUCCÈS !");
    process.exit(0);
  } else {
    console.error("\n❌ CERTAINS TESTS ONT ÉCHOUÉ :");
    [...results.permissions.errors, ...results.guides.errors, ...results.businessLogic.errors].forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Erreur fatale lors de l'exécution du test :", err);
  process.exit(1);
});
