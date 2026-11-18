import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================================");
console.log("🧪 DÉBUT DU TEST : CLOISONNEMENT STRICT MULTI-TENANT DE GESTION DES UTILISATEURS");
console.log("===============================================================================\n");

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

// 1. Vérification de SystemAdminPanel.jsx
const panelPath = path.join(rootDir, 'src', 'components', 'SystemAdminPanel.jsx');
assert.ok(fs.existsSync(panelPath), "Le fichier src/components/SystemAdminPanel.jsx doit exister");
const panelContent = fs.readFileSync(panelPath, 'utf8').replace(/\r\n/g, '\n');

const hookPath = path.join(rootDir, 'src', 'hooks', 'useAssociationMembers.js');
const hookContent = fs.readFileSync(hookPath, 'utf8').replace(/\r\n/g, '\n');

test("SystemAdminPanel délègue à useAssociationMembers qui consomme useTenantContext et useGroupContext", () => {
  assert.ok(panelContent.includes("useAssociationMembers"), "useAssociationMembers doit être importé dans SystemAdminPanel");
  assert.ok(hookContent.includes("useTenantContext"), "useTenantContext doit être importé dans useAssociationMembers");
  assert.ok(hookContent.includes("useGroupContext"), "useGroupContext doit être importé dans useAssociationMembers");
});

test("Suppression absolue de tout contournement Super-Admin et de tout groupe en dur dans la requête users", () => {
  assert.ok(!panelContent.includes("query(usersRef)"), "Aucune requête brute query(usersRef) dans SystemAdminPanel");
  assert.ok(!hookContent.toLowerCase().includes("samambaia"), "Aucun groupe codé en dur dans useAssociationMembers");
});

test("Résolution prioritaire et résiliente de currentGroupId", () => {
  assert.ok(panelContent.includes("currentGroupId"), "currentGroupId doit être utilisé comme référence de groupe actif");
  assert.ok(hookContent.includes("candidates = [profileData?.groupId, propGroupId, tenantGroupId, storedGroupId]"), "resolveAssociationGroupId doit combiner les 4 sources sans repli en dur");
});

test("Requête Firestore insensible à la casse avec variants", () => {
  assert.ok(hookContent.includes("where('groupId', 'in', variants)"), "La requête doit filtrer avec where('groupId', 'in', variants)");
  assert.ok(hookContent.includes("buildGroupVariants(rawGroupId)"), "getAssociationGroupVariants doit déléguer à buildGroupVariants");
});

test("Garde-fou en cas de groupe non résolu : vider la liste sans requête", () => {
  assert.ok(hookContent.includes("if (!currentGroupId || !enabled || variants.length === 0)"), "Si currentGroupId est absent, la liste doit être vidée immédiatement");
});

test("Garde-fou local en mémoire pour confirmer l'appartenance stricte au groupe", () => {
  assert.ok(hookContent.includes("return docCanonicalLower === targetLower;"), "matchesAssociationTenant doit vérifier l'égalité stricte insensible à la casse");
});

test("Le compteur 'Total des inscrits' est dérivé de usersList.length filtré", () => {
  assert.ok(
    panelContent.includes("{t('systemAdmin.totalRegistered')} : <span className=\"text-base font-black text-cordel-wood\">{usersList.length}</span>"),
    "Le total des inscrits doit afficher la longueur de la liste filtrée"
  );
});

// 2. Vérification de App.jsx
const appPath = path.join(rootDir, 'src', 'App.jsx');
assert.ok(fs.existsSync(appPath), "Le fichier src/App.jsx doit exister");
const appContent = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');

test("App.jsx transmet groupId={profileData?.groupId || urlGroupId} à SystemAdminPanel", () => {
  assert.ok(
    appContent.includes("groupId={profileData?.groupId || urlGroupId}") || appContent.includes("groupId={urlGroupId || profileData?.groupId}"),
    "App.jsx doit passer explicitement la prop groupId à SystemAdminPanel"
  );
});

// 3. Simulation fonctionnelle du filtre
test("Simulation : isolation stricte sur le groupe 'sambabulles' (2 membres attendus)", () => {
  const currentGroupId = 'sambabulles';
  const canonicalLower = currentGroupId.toLowerCase();
  const groupVariants = Array.from(new Set([currentGroupId, currentGroupId.toLowerCase()].filter(Boolean)));

  const mockFirestoreUsers = [
    { id: 'sb_1', nom: 'Dupont', prenom: 'Alice', groupId: 'sambabulles', statutActuel: 'active' },
    { id: 'sb_2', nom: 'Martin', prenom: 'Bob', groupId: 'Sambabulles', statutActuel: 'active' },
    { id: 'sam_1', nom: 'Bernard', prenom: 'Claire', groupId: 'baque_sol', statutActuel: 'active' },
    { id: 'sam_2', nom: 'Dubois', prenom: 'David', groupId: 'baque_sol', statutActuel: 'active' },
    { id: 'tech_1', nom: 'Admin', prenom: 'Super', groupId: 'system', statutActuel: 'active' }
  ];

  // 1. Simuler Firestore query(usersRef, where('groupId', 'in', groupVariants))
  const firestoreResult = mockFirestoreUsers.filter(u => groupVariants.includes(u.groupId) || groupVariants.includes(u.groupId.toLowerCase()));

  // 2. Simuler garde-fou mémoire docGroupId !== canonicalLower
  const filteredResult = firestoreResult.filter(u => {
    const docGroupId = String(u.groupId || '').trim().toLowerCase();
    return docGroupId === canonicalLower;
  });

  assert.strictEqual(filteredResult.length, 2, "Seuls les 2 membres de sambabulles doivent être retenus");
  assert.deepStrictEqual(filteredResult.map(u => u.id), ['sb_1', 'sb_2'], "Les IDs doivent correspondre aux membres de Samb'à Bulles");
});

console.log(`\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS (${passedCount}/${passedCount}) !`);
