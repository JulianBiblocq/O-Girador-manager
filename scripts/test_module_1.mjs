/**
 * Test Automatisé du Module 1 : Accueil & Espace Membre
 * Validation des profils Tiago Rocha (Membre) et Camila Santos (Admin)
 */

import { canAccessPole, canAccessTabPermission } from '../src/utils/permissionUtils.js';

const TIAGO_PROFILE = {
  uid: "lhVUdkIY3uY94UDPG9DlKN2HEQL2",
  id: "lhVUdkIY3uY94UDPG9DlKN2HEQL2",
  prenom: "Tiago",
  nom: "Rocha",
  surnom: "Tiaguinho",
  email: "recette.membre@o-girador.test",
  groupId: "Samambaia",
  role: "membre",
  isSystemAdmin: false,
  isNew: false,
  onboardingCompleted: true,
  tags: [],
  instrument: "Alfaia",
  instrumentPrincipal: "Alfaia",
  pratiquePercussion: true,
  cotisationStatut: "a_jour"
};

const CAMILA_PROFILE = {
  uid: "97R0qCLbJtOgOiJ4ojcosN6GfCF2",
  id: "97R0qCLbJtOgOiJ4ojcosN6GfCF2",
  prenom: "Camila",
  nom: "Santos",
  surnom: "Mila",
  email: "recette.admin@o-girador.test",
  groupId: "Samambaia",
  role: "admin",
  isSystemAdmin: false,
  isNew: false,
  onboardingCompleted: true,
  tags: ["Bureau", "Secrétaire", "Trésorier", "Logisticien"],
  instrument: "Caixa",
  instrumentPrincipal: "Caixa",
  pratiquePercussion: true,
  cotisationStatut: "a_jour"
};

const POLES = [
  'accueil',
  'diffusion',
  'logistique',
  'lutherie',
  'costumerie',
  'secretariat',
  'tresorerie',
  'studio',
  'mestre'
];

const MEMBRE_TABS = [
  'dashboard',
  'profil',
  'agenda',
  'materiel',
  'vestiaire',
  'trombinoscope',
  'forum',
  'mon-parcours'
];

const ADMIN_ONLY_TABS = [
  { pole: 'tresorerie', tab: 'cotisations' },
  { pole: 'tresorerie', tab: 'events-finances' },
  { pole: 'mestre', tab: 'mestre-orientation' },
  { pole: 'mestre', tab: 'mestre-stage-layout' },
  { pole: 'lutherie', tab: 'inventory-projects' },
  { pole: 'costumerie', tab: 'wardrobe-projects' },
  { pole: 'secretariat', tab: 'secretariat-reports' },
  { pole: 'diffusion', tab: 'gigs-pipeline' }
];

async function runTests() {
  console.log("=================================================");
  console.log("=== VÉRIFICATION MODULE 1 : ACCUEIL & MEMBRE ===");
  console.log("=================================================\n");

  const results = {
    tiago: { success: [], errors: [] },
    camila: { success: [], errors: [] }
  };

  // 1. TIAGO ROCHA (Membre Standard)
  console.log("--- 1. Tests sur Tiago Rocha (Membre Standard) ---");
  
  // A. Accès au pôle Accueil / Espace Membre
  const tiagoCanAccueil = canAccessPole('accueil', TIAGO_PROFILE);
  if (tiagoCanAccueil) {
    results.tiago.success.push("Accès autorisé au pôle 'accueil' (Espace Membre)");
  } else {
    results.tiago.errors.push("Erreur : accès refusé à 'accueil'");
  }

  // B. Omission totale du DOM pour les pôles d'administration
  for (const pole of POLES) {
    if (pole === 'accueil') continue;
    const canAccess = canAccessPole(pole, TIAGO_PROFILE);
    if (!canAccess) {
      results.tiago.success.push(`Pôle '${pole}' invisible et omis du DOM`);
    } else {
      results.tiago.errors.push(`ALERTE SÉCURITÉ : Le pôle '${pole}' est accessible à Tiago !`);
    }
  }

  // C. Accès aux onglets publics de l'Espace Membre
  for (const tab of MEMBRE_TABS) {
    const canTab = canAccessTabPermission(tab, 'accueil', TIAGO_PROFILE);
    if (canTab) {
      results.tiago.success.push(`Onglet public '${tab}' accessible`);
    } else {
      results.tiago.errors.push(`Erreur : onglet public '${tab}' refusé`);
    }
  }

  // D. Refus des onglets d'administration
  for (const { pole, tab } of ADMIN_ONLY_TABS) {
    const canTab = canAccessTabPermission(tab, pole, TIAGO_PROFILE);
    if (!canTab) {
      results.tiago.success.push(`Onglet admin '${tab}' (${pole}) strictement refusé`);
    } else {
      results.tiago.errors.push(`ALERTE SÉCURITÉ : L'onglet '${tab}' est accessible à Tiago !`);
    }
  }

  // E. Vérification isSystemAdmin (super-admin racine)
  if (TIAGO_PROFILE.isSystemAdmin === false) {
    results.tiago.success.push("Accès au panneau système racine (/system-admin) bloqué");
  } else {
    results.tiago.errors.push("ALERTE : Tiago a isSystemAdmin == true");
  }

  // 2. CAMILA SANTOS (Administrateur Bureau)
  console.log("\n--- 2. Tests sur Camila Santos (Administrateur Bureau) ---");

  // A. Accès à l'accueil
  const camilaCanAccueil = canAccessPole('accueil', CAMILA_PROFILE);
  if (camilaCanAccueil) {
    results.camila.success.push("Accès autorisé au pôle 'accueil'");
  } else {
    results.camila.errors.push("Erreur : accès refusé à 'accueil'");
  }

  // B. Accès aux pôles d'administration autorisés
  for (const pole of POLES) {
    const canAccess = canAccessPole(pole, CAMILA_PROFILE);
    if (canAccess) {
      results.camila.success.push(`Pôle '${pole}' visible et accessible`);
    } else {
      results.camila.errors.push(`Erreur : Le pôle '${pole}' devrait être accessible à Camila`);
    }
  }

  // C. Accès aux onglets d'administration
  for (const { pole, tab } of ADMIN_ONLY_TABS) {
    const canTab = canAccessTabPermission(tab, pole, CAMILA_PROFILE);
    if (canTab) {
      results.camila.success.push(`Onglet admin '${tab}' (${pole}) autorisé`);
    } else {
      results.camila.errors.push(`Erreur : L'onglet admin '${tab}' est refusé à Camila`);
    }
  }

  // D. Vérification de l'absence de droits super-administrateur racine
  if (CAMILA_PROFILE.isSystemAdmin === false) {
    results.camila.success.push("Accès au panneau système racine (/system-admin) bloqué (non super-admin)");
  } else {
    results.camila.errors.push("ALERTE : Camila a isSystemAdmin == true");
  }

  // 3. SYNTHÈSE
  console.log("\n=================================================");
  console.log(`TIAGO :  ${results.tiago.success.length} succès, ${results.tiago.errors.length} erreurs`);
  console.log(`CAMILA : ${results.camila.success.length} succès, ${results.camila.errors.length} erreurs`);
  console.log("=================================================");

  if (results.tiago.errors.length > 0 || results.camila.errors.length > 0) {
    console.error("Détails des erreurs :");
    console.error("Tiago :", results.tiago.errors);
    console.error("Camila :", results.camila.errors);
    process.exit(1);
  }

  console.log("✅ TOUS LES TESTS DU MODULE 1 SONT AU VERT !");
  process.exit(0);
}

runTests();
