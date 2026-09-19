import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 1. Chargement et vérification des utilitaires RBAC frontend
import {
  canAccessPole,
  canAccessTabPermission,
  isUserModeratorOrAdmin,
  POLE_ALLOWED_KEYWORDS
} from '../src/utils/permissionUtils.js';

console.log('🧪 Démarrage des tests : Permissions Trésorier & Logistique...\n');

// --- TEST 1 : Mots-clés des Pôles ---
console.log('▶ Test 1 : Vérification de POLE_ALLOWED_KEYWORDS');
assert.ok(POLE_ALLOWED_KEYWORDS.logistique.includes('trésorier'), 'Le pôle logistique doit inclure "trésorier"');
assert.ok(POLE_ALLOWED_KEYWORDS.logistique.includes('admin'), 'Le pôle logistique doit inclure "admin"');
assert.ok(POLE_ALLOWED_KEYWORDS.logistique.includes('bureau'), 'Le pôle logistique doit inclure "bureau"');
assert.ok(POLE_ALLOWED_KEYWORDS.tresorerie.includes('admin'), 'Le pôle trésorerie doit inclure "admin"');
console.log('  ✅ Mots-clés POLE_ALLOWED_KEYWORDS conformes.\n');

// --- TEST 2 : Profil de Boris (Trésorier + Logistique) ---
console.log('▶ Test 2 : Droits de Boris (Trésorier)');
const borisProfile = {
  uid: 'boris-test-uid',
  role: 'membre',
  groupId: 'Samambaia',
  tags: ['Trésorier']
};

assert.equal(
  canAccessPole('logistique', borisProfile, null, borisProfile.tags, false),
  true,
  'Boris doit accéder au pôle Logistique en tant que Trésorier'
);
assert.equal(
  canAccessPole('tresorerie', borisProfile, null, borisProfile.tags, false),
  true,
  'Boris doit accéder à la Trésorerie'
);
assert.equal(
  isUserModeratorOrAdmin(borisProfile),
  true,
  'Boris doit être reconnu modérateur/admin via son badge Trésorier'
);
console.log('  ✅ Profil Boris validé avec succès.\n');

// --- TEST 3 : Profil Administrateur Système / Asso ---
console.log('▶ Test 3 : Droits du rôle Admin standard');
const adminProfile = {
  uid: 'admin-test-uid',
  role: 'admin',
  groupId: 'samambaia',
  tags: []
};

assert.equal(
  canAccessPole('logistique', adminProfile, null, adminProfile.tags, false),
  true,
  'Un rôle "admin" doit accéder à la logistique sans tags explicites'
);
assert.equal(
  canAccessTabPermission('inventory', adminProfile, null, adminProfile.tags, false),
  true,
  'Un rôle "admin" doit pouvoir consulter l\'inventaire'
);
console.log('  ✅ Profil Admin validé.\n');

// --- TEST 4 : Audit statique des règles Firestore ---
console.log('▶ Test 4 : Analyse syntaxique de firestore.rules');
const rulesCandidates = [
  resolve('ogirador-backend/firestore.rules.DEPRECATED'),
  resolve('ogirador-backend/firestore.rules'),
  resolve('../o-girador-orquestrador/firestore.rules')
];
const rulesPath = rulesCandidates.find(p => existsSync(p)) || rulesCandidates[0];
const rulesContent = readFileSync(rulesPath, 'utf-8');

// Vérification de l'élargissement des tags Trésorier / Secrétaire
assert.match(
  rulesContent,
  /['"]Trésorier['"]|['"]trésorier['"]/,
  'firestore.rules doit contenir le badge Trésorier dans isAdminOrMestre ou canManageInventory'
);
assert.match(
  rulesContent,
  /['"]Secrétaire['"]|['"]secrétaire['"]/,
  'firestore.rules doit contenir le badge Secrétaire'
);

// Vérification de la tolérance à la casse sur groupId
assert.ok(
  rulesContent.includes('.lower()'),
  'firestore.rules doit utiliser .lower() pour normaliser les comparaisons de groupId'
);

console.log('  ✅ Règles Firestore auditées avec succès.\n');
console.log('🏆 TOUS LES CONTRÔLES SONT VALIDÉS (100 % SUCCÈS)');
