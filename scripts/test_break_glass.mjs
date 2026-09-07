/**
 * Test Automatisé Pérenne : Validation du Mode Strict et du Mode Intervention (Break-Glass)
 * 
 * Vérifie :
 * 1. Prévention des faux positifs sur 'super-admin' (mot-clé 'admin' dans POLE_ALLOWED_KEYWORDS & salons forum)
 * 2. Évaluation stricte du Super-Admin avec uniquement le badge 'CA' en Mode Normal (breakGlassActive === false)
 *    - Accès garanti au Pôle Gouvernance et aux sous-onglets du CA
 *    - Accès strictement refusé à la Trésorerie, au Secrétariat et aux autres pôles non assignés
 *    - Exclusion stricte du salon privé '#bureau' du Porte-voix
 * 3. Déverrouillage intégral en Mode Intervention (breakGlassActive === true)
 *    - Accès passe-partout à la Trésorerie, au Secrétariat, à la Mestria et au salon '#bureau'
 * 4. Gestion fine de canAccessMestre :
 *    - Accès direct préservé pour role === 'mestre'
 *    - Accès conditionné au break-glass pour role === 'super-admin' et isSystemAdmin === true
 * 5. Inopérance du Mode Intervention sur un compte membre ordinaire
 */

import {
  canAccessPole,
  canAccessTabPermission,
  canAccessMestre,
  canManageEvents,
  canEditVitrine,
  canUserReadForumChannel,
  canUserWriteInForumChannel,
  matchesAllowedKeyword
} from '../src/utils/permissionUtils.js';

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
console.log("🛡️ BATTERIE DE TESTS : MODE STRICT & BREAK-GLASS");
console.log("=======================================================\n");

// Profils de test
const SUPER_ADMIN_CA_PROFILE = {
  uid: "super_admin_ca_1",
  prenom: "Admin",
  nom: "Gouvernance",
  role: "super-admin",
  isSystemAdmin: true,
  tags: ["CA"]
};

const SYSTEM_ADMIN_ONLY_PROFILE = {
  uid: "system_admin_only_1",
  prenom: "Sys",
  nom: "Admin",
  role: "super-admin",
  isSystemAdmin: true,
  tags: []
};

const MESTRE_PROFILE = {
  uid: "mestre_user_1",
  prenom: "Mestre",
  nom: "Artiste",
  role: "mestre",
  isSystemAdmin: false,
  tags: []
};

const MEMBRE_STANDARD_PROFILE = {
  uid: "membre_std_1",
  prenom: "Membre",
  nom: "Standard",
  role: "membre",
  isSystemAdmin: false,
  tags: []
};

// ====================================================================
// 1. Prévention des faux positifs sur 'super-admin' et mots-clés
// ====================================================================
console.log("--- 1. Tests unitaires anti-faux-positifs sur matchesAllowedKeyword ---");

assert(
  matchesAllowedKeyword("super-admin", "admin") === false,
  "Le tag 'super-admin' ne doit JAMAIS correspondre au mot-clé 'admin'"
);
assert(
  matchesAllowedKeyword("superadmin", "admin") === false,
  "Le tag 'superadmin' ne doit JAMAIS correspondre au mot-clé 'admin'"
);
assert(
  matchesAllowedKeyword("admin", "admin") === true,
  "Le tag exact 'admin' doit correspondre au mot-clé 'admin'"
);
assert(
  matchesAllowedKeyword("administrateur", "admin") === true,
  "Le tag 'administrateur' doit correspondre au mot-clé 'admin'"
);
assert(
  matchesAllowedKeyword("ca", "bureau") === false,
  "Le tag 'ca' ne doit JAMAIS correspondre au mot-clé 'bureau'"
);
assert(
  matchesAllowedKeyword("président", "bureau") === true,
  "Le tag 'président' doit correspondre au mot-clé 'bureau'"
);

// ====================================================================
// 2. Évaluation stricte du Super-Admin (CA uniquement) en Mode Normal
// ====================================================================
console.log("\n--- 2. Super-Admin avec badge 'CA' en Mode Normal (breakGlassActive === false) ---");

// Accès légitime au Pôle Gouvernance et ses onglets
assert(
  canAccessPole("gouvernance", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === true,
  "Le Super-Admin avec badge CA a accès au Pôle Gouvernance en Mode Normal"
);
assert(
  canAccessTabPermission("ca-reunions", "gouvernance", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === true,
  "Le Super-Admin avec badge CA a accès à l'onglet ca-reunions"
);
assert(
  canAccessTabPermission("ca-finances", "gouvernance", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === true,
  "Le Super-Admin avec badge CA a accès à l'onglet ca-finances"
);

// Restriction stricte sur les autres pôles (Trésorerie, Secrétariat, Mestria...)
assert(
  canAccessPole("tresorerie", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === false,
  "Le Super-Admin sans badge trésorier n'a PAS accès au Pôle Trésorerie en Mode Normal"
);
assert(
  canAccessTabPermission("dashboard-finance", "tresorerie", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === false,
  "Le Super-Admin sans badge trésorier n'a PAS accès à dashboard-finance en Mode Normal"
);
assert(
  canAccessPole("secretariat", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === false,
  "Le Super-Admin sans badge secrétariat/bureau n'a PAS accès au Secrétariat en Mode Normal"
);
assert(
  canAccessPole("diffusion", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === false,
  "Le Super-Admin n'a PAS accès à la Diffusion en Mode Normal"
);
assert(
  canAccessPole("mestre", SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === false,
  "Le Super-Admin n'a PAS accès au Pôle Mestre en Mode Normal"
);
assert(
  canAccessMestre(SUPER_ADMIN_CA_PROFILE, null, ["CA"], false) === false,
  "canAccessMestre renvoie false pour un Super-Admin sans tag artistique en Mode Normal"
);

// Sécurité du Porte-voix (Forum)
const bureauChannel = { id: "canal_bureau", name: "Bureau", allowedRoles: ["bureau"] };
const caChannel = { id: "canal_ca", name: "CA", allowedRoles: ["ca"] };

assert(
  canUserReadForumChannel(caChannel, SUPER_ADMIN_CA_PROFILE, [], ["CA"], false) === true,
  "Le Super-Admin avec badge CA peut lire le salon #ca en Mode Normal"
);
assert(
  canUserReadForumChannel(bureauChannel, SUPER_ADMIN_CA_PROFILE, [], ["CA"], false) === false,
  "Le Super-Admin membre du CA (sans casquette Bureau) NE PEUT PAS lire le salon privé #bureau en Mode Normal"
);
assert(
  canUserWriteInForumChannel(bureauChannel, SUPER_ADMIN_CA_PROFILE, [], ["CA"], false) === false,
  "Le Super-Admin membre du CA NE PEUT PAS publier dans le salon privé #bureau en Mode Normal"
);

// ====================================================================
// 3. Déverrouillage complet en Mode Intervention (breakGlassActive === true)
// ====================================================================
console.log("\n--- 3. Super-Admin en Mode Intervention (breakGlassActive === true) ---");

assert(
  canAccessPole("tresorerie", SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "Le Super-Admin déverrouille la Trésorerie en Mode Intervention"
);
assert(
  canAccessTabPermission("dashboard-finance", "tresorerie", SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "Le Super-Admin déverrouille l'onglet dashboard-finance en Mode Intervention"
);
assert(
  canAccessPole("secretariat", SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "Le Super-Admin déverrouille le Secrétariat en Mode Intervention"
);
assert(
  canAccessPole("mestre", SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "Le Super-Admin déverrouille la Mestria en Mode Intervention"
);
assert(
  canAccessMestre(SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "canAccessMestre renvoie true pour un Super-Admin en Mode Intervention"
);
assert(
  canUserReadForumChannel(bureauChannel, SUPER_ADMIN_CA_PROFILE, [], ["CA"], true) === true,
  "Le Super-Admin déverrouille la lecture du salon privé #bureau en Mode Intervention"
);
assert(
  canUserWriteInForumChannel(bureauChannel, SUPER_ADMIN_CA_PROFILE, [], ["CA"], true) === true,
  "Le Super-Admin déverrouille l'écriture dans le salon privé #bureau en Mode Intervention"
);
assert(
  canManageEvents(SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "Le Super-Admin a les droits de gestion de l'agenda en Mode Intervention"
);
assert(
  canEditVitrine(SUPER_ADMIN_CA_PROFILE, null, ["CA"], true) === true,
  "Le Super-Admin a les droits d'édition vitrine en Mode Intervention"
);

// ====================================================================
// 4. Gestion fine de canAccessMestre
// ====================================================================
console.log("\n--- 4. Gestion fine de canAccessMestre (Mestre artistique vs Super-Admin) ---");

// Le rôle 'mestre' légitime conserve son accès direct en mode normal
assert(
  canAccessMestre(MESTRE_PROFILE, null, [], false) === true,
  "Le profil avec role: 'mestre' a un accès direct garanti en Mode Normal"
);
assert(
  canAccessPole("mestre", MESTRE_PROFILE, null, [], false) === true,
  "Le profil avec role: 'mestre' a accès au pôle 'mestre' en Mode Normal"
);

// Le super-admin sans badge mestre est restreint en mode normal
assert(
  canAccessMestre(SYSTEM_ADMIN_ONLY_PROFILE, null, [], false) === false,
  "Le Super-Admin pur sans tag artistique n'a PAS accès à la Mestria en Mode Normal"
);
assert(
  canAccessMestre(SYSTEM_ADMIN_ONLY_PROFILE, null, [], true) === true,
  "Le Super-Admin pur déverrouille la Mestria en Mode Intervention (breakGlassActive === true)"
);

// ====================================================================
// 5. Inopérance du Mode Intervention sur un membre standard
// ====================================================================
console.log("\n--- 5. Sécurité : Aucun effet du break-glass sur un membre standard ---");

assert(
  canAccessPole("tresorerie", MEMBRE_STANDARD_PROFILE, null, [], false) === false,
  "Un membre standard n'a pas accès à la trésorerie en mode normal"
);
assert(
  canAccessPole("tresorerie", MEMBRE_STANDARD_PROFILE, null, [], true) === false,
  "Un membre standard NE PEUT PAS déverrouiller la trésorerie même si breakGlassActive est à true"
);
assert(
  canUserReadForumChannel(bureauChannel, MEMBRE_STANDARD_PROFILE, [], [], true) === false,
  "Un membre standard NE PEUT PAS accéder au salon #bureau même si breakGlassActive est à true"
);

// ====================================================================
// Bilan du test
// ====================================================================
console.log("\n=======================================================");
console.log(`📊 RÉSULTAT : ${passed} passés, ${failed} échoués`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
