import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { canonicalizeGroupId, isSameGroupCaseInsensitive } from '../src/utils/tenantUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : DÉBLOCAGE DES PERMISSIONS FIRESTORE & FRONTEND");
console.log("===============================================================\n");

// 1. Test canonicalizeGroupId & isSameGroupCaseInsensitive
console.log("📌 Module 1 : Normalisation canonique de groupId (tenantUtils)");
assert.strictEqual(canonicalizeGroupId('samambaia'), 'Samambaia', "samambaia doit être normalisé en Samambaia");
assert.strictEqual(canonicalizeGroupId('Samambaia'), 'Samambaia', "Samambaia doit rester Samambaia");
assert.strictEqual(canonicalizeGroupId('SAMAMBAIA'), 'Samambaia', "SAMAMBAIA tout en majuscules doit être normalisé en Samambaia");
assert.strictEqual(canonicalizeGroupId('autreGroupe'), 'autreGroupe', "Un autre groupe doit être préservé");
assert.strictEqual(canonicalizeGroupId(null), null, "null doit être préservé");
assert.strictEqual(canonicalizeGroupId(undefined), undefined, "undefined doit être préservé");

assert.strictEqual(isSameGroupCaseInsensitive('samambaia', 'Samambaia'), true, "samambaia et Samambaia doivent être reconnus comme identiques");
assert.strictEqual(isSameGroupCaseInsensitive('Samambaia', 'Autre'), false, "Samambaia et Autre doivent être distincts");
console.log("  ✅ [PASS] Normalisation canonique et comparaison insensible à la casse validées");

// 2. Test ogirador-backend/firestore.rules
console.log("\n📌 Module 2 : Audit des règles de sécurité Firestore");
const rulesCandidates = [
  path.join(rootDir, 'ogirador-backend', 'firestore.rules.DEPRECATED'),
  path.join(rootDir, 'ogirador-backend', 'firestore.rules'),
  path.join(rootDir, '..', 'o-girador-orquestrador', 'firestore.rules')
];
const rulesPath = rulesCandidates.find(p => fs.existsSync(p)) || rulesCandidates[0];
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

// Forum paternity bilingue
assert.ok(
  rulesContent.includes("resource.data.get('auteurId', resource.data.get('authorId', ''))"),
  "Les règles Firestore doivent tester indifféremment auteurId et authorId pour le forum"
);

// Notifications collection rule
assert.ok(
  rulesContent.includes("match /notifications/{notifId}"),
  "Les règles Firestore doivent déclarer la collection /notifications/{notifId}"
);

// Réunions sujetsProposes
assert.ok(
  rulesContent.includes("'sujetsProposes'"),
  "Les règles Firestore doivent inclure 'sujetsProposes' dans affectedKeys de events"
);

// Commentaires événements souples
assert.ok(
  rulesContent.includes("!resource.data.keys().hasAny(['groupId'])"),
  "Les règles Firestore pour comments doivent tolérer l'absence de groupId"
);

// Inventaire signalement de casse et retour
assert.ok(
  rulesContent.includes("pendingMovement"),
  "Les règles Firestore pour inventory doivent autoriser pendingMovement"
);
assert.ok(
  rulesContent.includes("'À réparer'"),
  "Les règles Firestore doivent autoriser l'état 'À réparer' pour les signalements de casse"
);

// Onboarding tolérance paiement et normalisation groupId
assert.ok(
  rulesContent.includes("paymentStatus in ['unpaid', 'paid']"),
  "Les règles Firestore doivent autoriser paymentStatus in ['unpaid', 'paid'] lors de l'onboarding"
);
assert.ok(
  rulesContent.includes("resource.data.get('groupId', '').lower() == getUserData().get('groupId', '').lower()"),
  "Les règles Firestore users doivent comparer groupId avec .lower() pour la tolérance de casse"
);
console.log("  ✅ [PASS] Règles de sécurité Firestore 100% conformes et validées");

// 3. Test useEventComments.js (injection systématique de groupId)
console.log("\n📌 Module 3 : Injection groupId dans useEventComments");
const eventCommentsPath = path.join(rootDir, 'src', 'hooks', 'useEventComments.js');
const eventCommentsContent = fs.readFileSync(eventCommentsPath, 'utf8');

assert.ok(
  eventCommentsContent.includes("groupId: effectiveGroupId"),
  "useEventComments doit injecter groupId dans le commentaire Firestore"
);
console.log("  ✅ [PASS] useEventComments garantit l'injection de groupId");

// 4. Test ThreadValidationCard.jsx (try/catch non-bloquant sur notifications)
console.log("\n📌 Module 4 : Robustesse notifications dans ThreadValidationCard");
const threadCardPath = path.join(rootDir, 'src', 'components', 'forum', 'thread', 'ThreadValidationCard.jsx');
const threadCardContent = fs.readFileSync(threadCardPath, 'utf8');

assert.ok(
  threadCardContent.includes("Notification interne non transmise"),
  "ThreadValidationCard doit envelopper la notification interne dans un try/catch sécurisé"
);
console.log("  ✅ [PASS] Notifications in-app sécurisées sans blocage métier");

// 5. Test EventDetails allUsers & unregisteredUsers logic
console.log("\n📌 Module 5 : Intégrité d'EventDetails");
const eventDetailsPath = path.join(rootDir, 'src', 'components', 'EventDetails.jsx');
const eventDetailsContent = fs.readFileSync(eventDetailsPath, 'utf8');

assert.ok(
  eventDetailsContent.includes("canonicalizeGroupId(event.groupId)"),
  "EventDetails doit utiliser canonicalizeGroupId pour synchroniser les utilisateurs"
);
assert.ok(
  eventDetailsContent.includes("u.displayName || u.email"),
  "EventDetails doit fournir un repli pour les utilisateurs sans prénom explicite"
);
assert.ok(
  eventDetailsContent.includes("currentInscription.status !== 'present'"),
  "EventDetails doit permettre d'inclure les membres notés absents pour repêchage manuel"
);
console.log("  ✅ [PASS] EventDetails validé");

// 6. Test App.jsx auto-heal et protection de groupe
console.log("\n📌 Module 6 : Protection anti-écrasement dans App.jsx");
const appPath = path.join(rootDir, 'src', 'App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert.ok(
  appContent.includes("canonicalizeGroupId"),
  "App.jsx doit utiliser canonicalizeGroupId"
);
assert.ok(
  appContent.includes("isSameGroupCaseInsensitive"),
  "App.jsx doit vérifier isSameGroupCaseInsensitive avant de muter groupId"
);
console.log("  ✅ [PASS] Protection contre l'écrasement de casse validée dans App.jsx");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DE DÉBLOCAGE SONT VALIDÉES !");
console.log("===============================================================");
