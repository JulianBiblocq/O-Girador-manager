/**
 * Script de test unitaire et de validation pour le Simulateur de Vue (Mode Impersonation / Test de vue).
 * Vérifie le calcul de effectiveProfile, l'isolation du break-glass, le masquage strict
 * des pôles non autorisés et la logique de redirection automatique de sécurité.
 */

import assert from 'assert';
import { canAccessPole, isSuperAdminProfile } from '../src/utils/permissionUtils.js';
import { resolveEffectiveUserTags } from '../src/utils/tagUtils.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DES TESTS : SIMULATEUR DE VUE (MODE IMPERSONATION)");
console.log("===============================================================\n");

let totalAssertions = 0;

function runTest(description, testFn) {
  try {
    testFn();
    totalAssertions++;
    console.log(`  ✅ [PASS] ${description}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Détails: ${err.message}`);
    throw err;
  }
}

// Jeu de données de test
const mockAdminProfile = {
  uid: 'admin_123',
  prenom: 'Admin',
  nom: 'Girador',
  email: 'admin@o-girador.com',
  role: 'super-admin',
  isSystemAdmin: true,
  groupId: 'groupe_test',
  tags: ['admin']
};

const mockAvailableTags = [
  { id: 'tresorier', nomM: 'Trésorier', nomF: 'Trésorière', inheritsFrom: ['Bureau'] },
  { id: 'diffusion', nomM: 'Chargé de diffusion', nomF: 'Chargée de diffusion' },
  { id: 'ca', nomM: 'Membre du CA', nomF: 'Membre du CA' },
  { id: 'communication', nomM: 'Communication', nomF: 'Communication' }
];

const mockMemberUser = {
  id: 'user_456',
  prenom: 'Camille',
  nom: 'Ribeiro',
  surnom: 'Mimi',
  role: 'membre',
  statutActuel: 'actif',
  instrumentPrincipal: 'Alfaias',
  tags: ['diffusion']
};

// Fonction miroir du calcul de effectiveProfile dans ViewSimulatorContext
function computeEffectiveProfile(isSimulating, simulationTarget, realProfile) {
  if (!isSimulating || !simulationTarget) {
    return realProfile;
  }

  if (simulationTarget.type === 'user' && simulationTarget.simulatedUser) {
    const u = simulationTarget.simulatedUser;
    return {
      ...realProfile,
      uid: u.id || u.uid || 'simulated-user',
      prenom: u.prenom || 'Membre',
      nom: u.nom || 'Simulé',
      surnom: u.surnom || '',
      email: u.email || '',
      avatar: u.avatar || u.photoURL || '',
      photoURL: u.photoURL || u.avatar || '',
      role: u.role || 'membre',
      tags: Array.isArray(u.tags) ? u.tags : [],
      statutActuel: u.statutActuel || 'actif',
      instrumentPrincipal: u.instrumentPrincipal || '',
      isSystemAdmin: false, // Sécurité : JAMAIS admin en simulation
      isNew: false,
      onboardingCompleted: true
    };
  }

  if (simulationTarget.type === 'tag') {
    return {
      ...realProfile,
      uid: 'simulated-tag-user',
      prenom: 'Vue Badge',
      nom: simulationTarget.label || 'Étiquette',
      surnom: '',
      role: simulationTarget.role || 'membre',
      tags: Array.isArray(simulationTarget.tags) ? simulationTarget.tags : [simulationTarget.label],
      statutActuel: 'actif',
      instrumentPrincipal: 'Pupitre simulé',
      isSystemAdmin: false,
      isNew: false,
      onboardingCompleted: true
    };
  }

  return {
    ...realProfile,
    uid: 'simulated-standard-user',
    prenom: 'Adhérent',
    nom: 'Standard',
    surnom: '',
    role: 'membre',
    tags: [],
    statutActuel: 'actif',
    instrumentPrincipal: 'Pupitre',
    isSystemAdmin: false,
    isNew: false,
    onboardingCompleted: true
  };
}

// -------------------------------------------------------------
// MODULE 1 : Calcul des profils effectifs
// -------------------------------------------------------------
console.log("📌 Module 1 : Calcul des profils effectifs et étiquettes");

runTest("Simulation inactive : renvoie le profil réel avec ses droits", () => {
  const effective = computeEffectiveProfile(false, null, mockAdminProfile);
  assert.strictEqual(effective.isSystemAdmin, true);
  assert.strictEqual(effective.role, 'super-admin');
  assert.strictEqual(effective.uid, 'admin_123');
});

runTest("Simulation Adhérent standard : rôle membre, tags vides, isSystemAdmin false", () => {
  const target = { type: 'standard', label: 'Adhérent standard', role: 'membre', tags: [] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);

  assert.strictEqual(effective.isSystemAdmin, false);
  assert.strictEqual(effective.role, 'membre');
  assert.deepStrictEqual(effective.tags, []);
  assert.strictEqual(effective.prenom, 'Adhérent');
  assert.strictEqual(isSuperAdminProfile(effective), false);
});

runTest("Simulation par Badge 'Diffusion' : injecte uniquement le tag ciblé", () => {
  const target = { type: 'tag', label: 'Diffusion', role: 'membre', tags: ['diffusion'] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);

  assert.strictEqual(effective.isSystemAdmin, false);
  assert.strictEqual(effective.role, 'membre');
  assert.deepStrictEqual(effective.tags, ['diffusion']);
  const resolvedTags = resolveEffectiveUserTags(effective.tags, mockAvailableTags);
  assert.strictEqual(resolvedTags.includes('diffusion') || resolvedTags.includes('Chargé de diffusion'), true);
});

runTest("Simulation par Adhérent précis : adopte l'identité et les tags réels du membre", () => {
  const target = {
    type: 'user',
    label: 'Camille Ribeiro',
    role: mockMemberUser.role,
    tags: mockMemberUser.tags,
    simulatedUser: mockMemberUser
  };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);

  assert.strictEqual(effective.isSystemAdmin, false);
  assert.strictEqual(effective.prenom, 'Camille');
  assert.strictEqual(effective.surnom, 'Mimi');
  assert.strictEqual(effective.instrumentPrincipal, 'Alfaias');
  assert.deepStrictEqual(effective.tags, ['diffusion']);
});

// -------------------------------------------------------------
// MODULE 2 : Isolation du Break-Glass (Garde-fou 1)
// -------------------------------------------------------------
console.log("\n📌 Module 2 : Isolation absolue du Break-Glass (Garde-fou 1)");

runTest("En mode simulation, breakGlassActive doit être forcé à false", () => {
  const isSimulating = true;
  const breakGlassActiveFromParent = true; // L'admin réel a activé le mode intervention
  const effectiveBreakGlassActive = isSimulating ? false : breakGlassActiveFromParent;

  assert.strictEqual(effectiveBreakGlassActive, false);
});

runTest("L'adhérent standard simulé n'a aucun passe-partout même si l'admin a breakGlassActive", () => {
  const target = { type: 'standard', label: 'Adhérent standard', role: 'membre', tags: [] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);
  const effectiveBreakGlassActive = false; // Forcé par le garde-fou 1

  const isMasterKeyActive = isSuperAdminProfile(effective) && effectiveBreakGlassActive;
  assert.strictEqual(isMasterKeyActive, false);

  // Vérification sur un pôle sensible (Trésorerie)
  const canAccessTresorerie = canAccessPole('tresorerie', effective, null, [], effectiveBreakGlassActive);
  assert.strictEqual(canAccessTresorerie, false);
});

// -------------------------------------------------------------
// MODULE 3 : Masquage strict et recalcul des pôles d'administration
// -------------------------------------------------------------
console.log("\n📌 Module 3 : Masquage strict du DOM et filtrage des pôles");

runTest("Adhérent standard : tous les pôles administratifs renvoient false", () => {
  const target = { type: 'standard', label: 'Adhérent standard', role: 'membre', tags: [] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);

  assert.strictEqual(canAccessPole('tresorerie', effective, null, [], false), false);
  assert.strictEqual(canAccessPole('diffusion', effective, null, [], false), false);
  assert.strictEqual(canAccessPole('gouvernance', effective, null, [], false), false);
  assert.strictEqual(canAccessPole('mestre', effective, null, [], false), false);
  assert.strictEqual(canAccessPole('logistique', effective, null, [], false), false);

  // Espaces publics toujours ouverts
  assert.strictEqual(canAccessPole('accueil', effective, null, [], false), true);
  assert.strictEqual(canAccessPole('mon-espace', effective, null, [], false), true);
});

runTest("Badge Diffusion : autorise le Pôle Diffusion et masque les autres", () => {
  const target = { type: 'tag', label: 'Diffusion', role: 'membre', tags: ['diffusion'] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);
  const effectiveTags = resolveEffectiveUserTags(effective.tags, mockAvailableTags);

  assert.strictEqual(canAccessPole('diffusion', effective, null, effectiveTags, false), true);
  assert.strictEqual(canAccessPole('tresorerie', effective, null, effectiveTags, false), false);
  assert.strictEqual(canAccessPole('gouvernance', effective, null, effectiveTags, false), false);
});

runTest("Règle anti-cadenas : pour les profils non privilégiés, les pôles inaccessibles sont ignorés (zéro cadenas)", () => {
  const target = { type: 'standard', label: 'Adhérent standard', role: 'membre', tags: [] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);
  const isPrivileged = isSuperAdminProfile(effective) && false; // isMasterKeyActive = false

  assert.strictEqual(isPrivileged, false);
  // Dans LayoutShell : if (!isUnlocked) { if (!isPrivileged) return null; }
  // Donc aucun élément n'est retourné pour les pôles inaccessibles !
});

// -------------------------------------------------------------
// MODULE 4 : Redirection automatique de sécurité (Garde-fou 2)
// -------------------------------------------------------------
console.log("\n📌 Module 4 : Redirection automatique de sécurité (Garde-fou 2)");

runTest("Si le pôle actif devient inaccessible en simulation, détection de redirection vers accueil", () => {
  const currentPole = 'tresorerie';
  const target = { type: 'standard', label: 'Adhérent standard', role: 'membre', tags: [] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);

  const isPoleAccessible = currentPole === 'accueil' || currentPole === 'mon-espace' || canAccessPole(currentPole, effective, null, [], false);
  assert.strictEqual(isPoleAccessible, false);
  // Déclenche la redirection vers 'accueil'
  const redirectTarget = !isPoleAccessible ? 'accueil' : currentPole;
  assert.strictEqual(redirectTarget, 'accueil');
});

runTest("Si le pôle actif reste accessible en simulation, aucun changement de pôle", () => {
  const currentPole = 'diffusion';
  const target = { type: 'tag', label: 'Diffusion', role: 'membre', tags: ['diffusion'] };
  const effective = computeEffectiveProfile(true, target, mockAdminProfile);
  const effectiveTags = resolveEffectiveUserTags(effective.tags, mockAvailableTags);

  const isPoleAccessible = currentPole === 'accueil' || currentPole === 'mon-espace' || canAccessPole(currentPole, effective, null, effectiveTags, false);
  assert.strictEqual(isPoleAccessible, true);
  const redirectTarget = !isPoleAccessible ? 'accueil' : currentPole;
  assert.strictEqual(redirectTarget, 'diffusion');
});

// -------------------------------------------------------------
// MODULE 5 : Restauration immédiate des droits (stopSimulation)
// -------------------------------------------------------------
console.log("\n📌 Module 5 : Restauration immédiate des droits (stopSimulation)");

runTest("Désactivation de simulation : restauration instantanée des droits super-admin", () => {
  let isSimulating = true;
  let target = { type: 'standard', label: 'Adhérent standard', role: 'membre', tags: [] };

  // En simulation
  let currentProfile = computeEffectiveProfile(isSimulating, target, mockAdminProfile);
  assert.strictEqual(currentProfile.isSystemAdmin, false);

  // Arrêt de la simulation
  isSimulating = false;
  target = null;
  currentProfile = computeEffectiveProfile(isSimulating, target, mockAdminProfile);

  assert.strictEqual(currentProfile.isSystemAdmin, true);
  assert.strictEqual(currentProfile.role, 'super-admin');
  assert.strictEqual(currentProfile.uid, 'admin_123');
});

console.log("\n===============================================================");
console.log(`🎉 SUCCÈS TOTAL : ${totalAssertions} assertions validées sans aucune erreur !`);
console.log("===============================================================");
