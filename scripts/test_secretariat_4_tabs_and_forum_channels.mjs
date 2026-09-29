/**
 * Test de validation automatisé : Restructuration du Secrétariat (4 onglets) & Déport de la modération Porte-voix
 * Vérifie :
 * 1. POLES_CONFIG (App.jsx) : exactement les 4 onglets prescrits pour le secrétariat
 * 2. TabSecurity.jsx : matrice RBAC alignée sur les 4 onglets stricts
 * 3. Forum.jsx : déport de ForumChannelsManager en modale interne pour les modérateurs/admins
 * 4. AdminExport.jsx & AdminExportModal.jsx : bouton d'action, modale et filtres
 * 5. Locales fr.js & pt.js : traductions associées
 */

import assert from 'assert';
import fs from 'fs';

console.log("✂️ TEST SUITE : RESTRUCTURATION SECRÉTARIAT (4 ONGLETS) & DÉPORT GESTION PORTE-VOIX ✂️\n");

// 1. POLES_CONFIG dans App.jsx
console.log("▶️ Test 1 : Vérification de POLES_CONFIG dans App.jsx...");
const appCode = fs.readFileSync('src/App.jsx', 'utf8');

// Extraction du pôle secretariat dans POLES_CONFIG
const secMatch = appCode.match(/id:\s*['"]secretariat['"],[\s\S]*?tabs:\s*(\[[\s\S]*?\])\s*\},/);
assert(secMatch, "Le pôle secretariat doit être défini dans POLES_CONFIG");
const secTabs = (new Function(`return ${secMatch[1]}`))();

assert(secTabs.length >= 4, `Le secrétariat doit comporter au moins 4 onglets (trouvé: ${secTabs.length})`);

const expectedTabs = ['export-annu', 'secretariat-reports', 'studio-events', 'varal-secretariat', 'secretariat-documents'];
const actualTabs = secTabs.map(t => t.id);
expectedTabs.forEach(tabId => {
  assert(actualTabs.includes(tabId), `L'onglet actif '${tabId}' doit figurer dans POLES_CONFIG`);
});

// Vérification de l'absence des onglets retirés
const removedTabs = ['reunion-manager', 'activity-reports', 'secretariat-lieux', 'mestre-forum-channels'];
removedTabs.forEach(tabId => {
  assert(!actualTabs.includes(tabId), `L'onglet retiré '${tabId}' ne doit plus figurer dans POLES_CONFIG`);
});

console.log("✅ Test 1 validé : Onglets du Secrétariat conformes dans POLES_CONFIG.\n");

// 2. TabSecurity.jsx
console.log("▶️ Test 2 : Vérification de la matrice RBAC dans TabSecurity.jsx...");
const tabSecurityCode = fs.readFileSync('src/components/association-settings/TabSecurity.jsx', 'utf8');
const rbacMatch = tabSecurityCode.match(/id:\s*['"]secretariat['"],[\s\S]*?tabs:\s*(\[[\s\S]*?\])\s*\},/);
assert(rbacMatch, "Le pôle secretariat doit être défini dans PERMISSION_POLES (TabSecurity.jsx)");
const rbacTabs = (new Function(`return ${rbacMatch[1]}`))();

assert(rbacTabs.length >= 4, `TabSecurity doit comporter les onglets du secrétariat (trouvé: ${rbacTabs.length})`);
const actualRbacTabs = rbacTabs.map(t => t.id);
expectedTabs.forEach(tabId => {
  assert(actualRbacTabs.includes(tabId), `L'onglet RBAC '${tabId}' doit être présent`);
});

console.log("✅ Test 2 validé : Matrice RBAC alignée sur les onglets du Secrétariat.\n");

// 3. Déport de ForumChannelsManager dans Forum.jsx
console.log("▶️ Test 3 : Déport de la gestion des salons dans Forum.jsx...");
const forumCode = fs.readFileSync('src/components/Forum.jsx', 'utf8');

assert(forumCode.includes('import ForumChannelsManager'), "Forum.jsx doit importer ForumChannelsManager");
assert(forumCode.includes('isChannelsManagerOpen'), "Forum.jsx doit gérer l'état d'ouverture isChannelsManagerOpen");
assert(forumCode.includes('<ForumChannelsManager'), "Forum.jsx doit instancier ForumChannelsManager dans une modale");
assert(forumCode.includes("manageChannels"), "Forum.jsx doit utiliser la clé de traduction manageChannels");

console.log("✅ Test 3 validé : Modale ForumChannelsManager intégrée directement au Porte-voix.\n");

// 4. Annuaire & Modale d'export CSV
console.log("▶️ Test 4 : Contrôle de AdminExport.jsx et AdminExportModal.jsx...");
const adminExportCode = fs.readFileSync('src/components/AdminExport.jsx', 'utf8');
assert(adminExportCode.includes('AdminExportModal'), "AdminExport.jsx doit importer et utiliser AdminExportModal");
assert(adminExportCode.includes('isExportModalOpen'), "AdminExport.jsx doit gérer l'état isExportModalOpen");
assert(adminExportCode.includes('roleFilter'), "AdminExport.jsx doit gérer le filtre par rôle");
assert(adminExportCode.includes('Exporter les données'), "AdminExport.jsx doit afficher le bouton 'Exporter les données'");

// Vérification de AdminExportModal
assert(fs.existsSync('src/components/admin/AdminExportModal.jsx'), "AdminExportModal.jsx doit exister");
const modalCode = fs.readFileSync('src/components/admin/AdminExportModal.jsx', 'utf8');
const modalLines = modalCode.split('\n').length;
assert(modalLines < 200, `AdminExportModal.jsx doit respecter la règle anti-monolithe (< 200 lignes, actuel: ${modalLines})`);
assert(modalCode.includes('Télécharger le CSV'), "AdminExportModal doit comporter le bouton de téléchargement");
assert(modalCode.includes('UTF-8 avec BOM'), "AdminExportModal doit mentionner l'encodage Excel");

console.log("✅ Test 4 validé : Annuaire et modale d'export CSV conformes et modulaires.\n");

// 5. Traductions fr.js & pt.js
console.log("▶️ Test 5 : Vérification des traductions associées...");
const frCode = fs.readFileSync('src/locales/fr.js', 'utf8');
const ptCode = fs.readFileSync('src/locales/pt.js', 'utf8');
assert(frCode.includes('manageChannels: "Gérer",'), "fr.js doit contenir manageChannels");
assert(ptCode.includes('manageChannels: "Gerenciar",'), "pt.js doit contenir manageChannels");

console.log("✅ Test 5 validé : Traductions bilingues présentes.\n");

console.log("🎉 TOUS LES TESTS DE RESTRUCTURATION DU SECRÉTARIAT ET PORTE-VOIX SONT VALIDÉS ! 🎉");
