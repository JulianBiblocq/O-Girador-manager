import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : SÉCURISATION MULTI-TENANTS & ÉTANCHÉITÉ SAAS");
console.log("===============================================================\n");

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     -> ${err.message}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// 1. Audit statique de firestore.rules
// -------------------------------------------------------------
console.log("📌 Module 1 : Étanchéité et règles d'isolation de firestore.rules");

const firestoreRulesPath = path.join(rootDir, 'ogirador-backend', 'firestore.rules');
assert.ok(fs.existsSync(firestoreRulesPath), "Le fichier ogirador-backend/firestore.rules doit exister");
const firestoreRulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');

test("Fonction isAdminOrMestre() exige la correspondance stricte de groupe (isDocSameGroup / groupId)", () => {
  assert.ok(
    firestoreRulesContent.includes('isDocSameGroup()') || firestoreRulesContent.includes('resource.data.groupId == getUserData().groupId'),
    "isAdminOrMestre doit vérifier l'appartenance au même groupe"
  );
});

test("Fonction canReadGroupData() vérifie le groupId de l'utilisateur par rapport au document", () => {
  assert.ok(
    firestoreRulesContent.includes("function canReadGroupData()"),
    "canReadGroupData() doit être défini"
  );
  assert.ok(
    firestoreRulesContent.includes("resource.data.get('groupId', '') == getUserData().get('groupId', '')") ||
    firestoreRulesContent.includes("resource.data.groupId == getUserData().groupId"),
    "canReadGroupData() doit comparer le groupId du document et du profil"
  );
});

test("Cloisonnement strict des collections sensibles (invoices, documents, reunions, gigs_pipeline, inventory, costumes, events)", () => {
  const sensitiveCollections = [
    'invoices',
    'documents',
    'reunions',
    'gigs_pipeline',
    'inventory',
    'costumes',
    'wardrobeInventory',
    'events'
  ];

  for (const col of sensitiveCollections) {
    const colRegex = new RegExp(`match\\s+/${col}/\\{[^}]+\\}\\s*\\{[\\s\\S]*?allow read:\\s*if\\s*([^;]+);`, 'm');
    const match = firestoreRulesContent.match(colRegex);
    assert.ok(match, `La collection /${col}/ doit comporter une règle de lecture explicite`);
    const condition = match[1];
    assert.ok(
      condition.includes('canReadGroupData()') || condition.includes('groupId'),
      `La lecture de /${col}/ doit être cloisonnée par groupId ou canReadGroupData (actuel: ${condition})`
    );
    assert.ok(
      !condition.trim().match(/^isAuthenticated\(\)$/),
      `La lecture de /${col}/ ne doit PAS être un isAuthenticated() inconditionnel`
    );
  }
});

test("Cloisonnement strict des profils utilisateurs (/users/{userId})", () => {
  const usersRegex = /match\s+\/users\/\{userId\}\s*\{[\s\S]*?allow read:\s*if\s*([^;]+);/m;
  const match = firestoreRulesContent.match(usersRegex);
  assert.ok(match, "La collection /users/{userId} doit comporter une règle de lecture");
  const condition = match[1];
  assert.ok(
    condition.includes('request.auth.uid == userId') && (condition.includes('groupId') || condition.includes('isSystemAdmin')),
    "La lecture d'un profil doit être restreinte à son propre compte, au même groupe ou à l'administrateur système"
  );
  assert.ok(
    !condition.trim().match(/^isAuthenticated\(\)$/),
    "La lecture de /users/{userId} ne doit PAS être un isAuthenticated() inconditionnel"
  );
});

test("Suppression absolue des jokers permissifs résiduels (match /events/{document=**} et match /users/{document=**})", () => {
  assert.ok(
    !firestoreRulesContent.includes('match /events/{document=**}'),
    "Le joker permissif match /events/{document=**} doit être supprimé"
  );
  assert.ok(
    !firestoreRulesContent.includes('match /users/{document=**}'),
    "Le joker permissif match /users/{document=**} doit être supprimé"
  );
});

// -------------------------------------------------------------
// 2. Audit statique de storage.rules
// -------------------------------------------------------------
console.log("\n📌 Module 2 : Étanchéité et règles d'isolation de storage.rules");

const storageRulesPath = path.join(rootDir, 'storage.rules');
assert.ok(fs.existsSync(storageRulesPath), "Le fichier storage.rules doit exister");
const storageRulesContent = fs.readFileSync(storageRulesPath, 'utf8');

test("Définition de la fonction d'isolation de groupe isMemberOfGroup(groupId)", () => {
  assert.ok(
    storageRulesContent.includes("function isMemberOfGroup(groupId)"),
    "storage.rules doit définir isMemberOfGroup(groupId)"
  );
  assert.ok(
    storageRulesContent.includes("request.auth.token.groupId == groupId") ||
    storageRulesContent.includes("getUserData().groupId == groupId"),
    "isMemberOfGroup doit vérifier le token ou le profil utilisateur Firestore"
  );
});

test("Remplacement des règles ouvertes sur /documents, /orders et /transactions par isMemberOfGroup(groupId)", () => {
  const pathsToCheck = ['documents', 'orders', 'transactions', 'workshops_media', 'forum_images', 'studio_validation'];
  for (const prefix of pathsToCheck) {
    const ruleRegex = new RegExp(`match\\s+/${prefix}/\\{groupId\\}/\\{allPaths=\\*\\*\\}\\s*\\{[\\s\\S]*?allow read,\\s*write:\\s*if\\s*([^;]+);`, 'm');
    const match = storageRulesContent.match(ruleRegex);
    assert.ok(match, `Le chemin /${prefix}/{groupId}/{allPaths=**} doit être défini dans storage.rules`);
    const condition = match[1].trim();
    assert.strictEqual(
      condition,
      'isMemberOfGroup(groupId)',
      `Le chemin /${prefix}/{groupId} doit exiger isMemberOfGroup(groupId) (actuel: ${condition})`
    );
  }
});

// -------------------------------------------------------------
// 3. Audit des requêtes frontend orphelines
// -------------------------------------------------------------
console.log("\n📌 Module 3 : Résolution des requêtes orphelines (Frontend)");

test("Hook useMestreSignals filtre par groupId avec repli global", () => {
  const hookPath = path.join(rootDir, 'src', 'hooks', 'useMestreSignals.js');
  const content = fs.readFileSync(hookPath, 'utf8');
  assert.ok(content.includes("useMestreSignals(groupId = null)"), "useMestreSignals doit accepter le paramètre groupId");
  assert.ok(content.includes("where('groupId', '==', groupId)"), "useMestreSignals doit filtrer par groupId");
  assert.ok(content.includes("where('groupId', '==', 'global')"), "useMestreSignals doit prévoir le repli vers les signaux globaux");
});

test("Composant QcmSignaux filtre par groupId avec repli global", () => {
  const qcmPath = path.join(rootDir, 'src', 'components', 'pedagogy', 'QcmSignaux.jsx');
  const content = fs.readFileSync(qcmPath, 'utf8');
  assert.ok(content.includes("groupId = null"), "QcmSignaux doit accepter la prop groupId");
  assert.ok(content.includes("where('groupId', '==', groupId)"), "QcmSignaux doit filtrer par groupId");
});

test("EventPollSection sécurise la suppression des créneaux de sondage avec groupId", () => {
  const compPath = path.join(rootDir, 'src', 'components', 'event-details', 'EventPollSection.jsx');
  const content = fs.readFileSync(compPath, 'utf8');
  assert.ok(
    content.includes("where('groupId', '==', targetGroupId)") && content.includes("pollGroupId"),
    "La suppression des options dans EventPollSection doit filtrer par groupId en plus de pollGroupId"
  );
});

test("EventDetails sécurise la synchronisation de sondage avec groupId", () => {
  const compPath = path.join(rootDir, 'src', 'components', 'EventDetails.jsx');
  const content = fs.readFileSync(compPath, 'utf8');
  assert.ok(
    content.includes("where('groupId', '==', event.groupId)") && content.includes("event.pollGroupId"),
    "La synchronisation dans EventDetails doit filtrer par event.groupId en plus de event.pollGroupId"
  );
});

test("EventReportSection sécurise la synchronisation de sondage avec groupId", () => {
  const compPath = path.join(rootDir, 'src', 'components', 'event-details', 'EventReportSection.jsx');
  const content = fs.readFileSync(compPath, 'utf8');
  assert.ok(
    content.includes("where('groupId', '==', event.groupId)") && content.includes("event.pollGroupId"),
    "La synchronisation dans EventReportSection doit filtrer par event.groupId en plus de event.pollGroupId"
  );
});

console.log("\n===============================================================");
console.log(`🎉 SUCCÈS TOTAL : ${passedCount}/${passedCount} assertions d'étanchéité validées sans aucune erreur !`);
console.log("===============================================================");
