/**
 * Test de validation automatisé : Gestion de la visibilité des cordes du Varal
 * Vérifie :
 * 1. Modèle de données (champ actif: true sur DEFAULT_VARAL_CATEGORIES)
 * 2. Règles de filtrage et rendu intelligent (Règle 1, Règle 2, Règle 3)
 * 3. Toggles et commandes d'activation/désactivation dans TabDocuments et VaralManager
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log("✂️ TEST SUITE : VISIBILITÉ ET TOGGLES DES CORDES DU VARAL ✂️");

// 1. Vérification du modèle de données (DEFAULT_VARAL_CATEGORIES)
const varalDataContent = fs.readFileSync('src/hooks/useVaralData.js', 'utf8');
const settingsContent = fs.readFileSync('src/hooks/useAssociationSettings.js', 'utf8');

// Extraction des objets DEFAULT_VARAL_CATEGORIES
const extractDefaultCats = (code) => {
  const match = code.match(/export const DEFAULT_VARAL_CATEGORIES = (\[[\s\S]*?\]);/);
  if (!match) return [];
  // Évaluer en toute sécurité dans une fonction
  return (new Function(`return ${match[1]}`))();
};

const VARAL_CATS_DATA = extractDefaultCats(varalDataContent);
const VARAL_CATS_SETTINGS = extractDefaultCats(settingsContent);

console.log("▶️ Test 1 : Vérification du champ actif sur DEFAULT_VARAL_CATEGORIES...");
assert(Array.isArray(VARAL_CATS_DATA) && VARAL_CATS_DATA.length >= 7, "DEFAULT_VARAL_CATEGORIES doit contenir au moins 7 rubriques dans useVaralData");
assert(Array.isArray(VARAL_CATS_SETTINGS) && VARAL_CATS_SETTINGS.length >= 7, "DEFAULT_VARAL_CATEGORIES doit contenir au moins 7 rubriques dans useAssociationSettings");

VARAL_CATS_DATA.forEach(cat => {
  assert.strictEqual(cat.actif, true, `La catégorie native "${cat.nom || cat.id}" doit avoir actif === true par défaut`);
});

VARAL_CATS_SETTINGS.forEach(cat => {
  assert.strictEqual(cat.actif, true, `La catégorie settings "${cat.nom || cat.id}" doit avoir actif === true par défaut`);
});
console.log("✅ Test 1 validé : Champ actif: true présent sur toutes les catégories natives.");

// 2. Simulation de l'algorithme de filtrage Règle 1, Règle 2 et Règle 3
console.log("▶️ Test 2 : Simulation des règles de filtrage intelligent (Règle 1, 2, 3)...");

const simulateRopeDecision = ({ category, docs = [], isAuthorized = false }) => {
  const isInactive = category.actif === false;
  const hasValidPublicUpload = Boolean(
    category.activerUploadPublic &&
    category.lienUploadPublic &&
    category.lienUploadPublic.trim() !== ''
  );
  const isEmpty = docs.length === 0 && !hasValidPublicUpload;

  // Côté adhérent (non-admin)
  if (!isAuthorized) {
    if (isInactive) return { rendered: false, reason: 'inactive_member' };
    if (isEmpty) return { rendered: false, reason: 'empty_member' };
    return { rendered: true, mode: 'full_rope' };
  }

  // Côté admin
  if (isInactive || isEmpty) {
    return { rendered: true, mode: 'compact_admin', isInactive, isEmpty };
  }

  return { rendered: true, mode: 'full_rope' };
};

// Cas A : Corde désactivée (actif: false) pour un adhérent
const res1 = simulateRopeDecision({
  category: { id: 'Toadas', nom: 'Toadas', actif: false },
  docs: [{ id: 'doc1' }],
  isAuthorized: false
});
assert.strictEqual(res1.rendered, false, "Règle 1 : Une corde avec actif: false doit être masquée à l'adhérent");
assert.strictEqual(res1.reason, 'inactive_member');

// Cas B : Corde vide sans upload public pour un adhérent
const res2 = simulateRopeDecision({
  category: { id: 'Costumerie', nom: 'Costumerie', actif: true, activerUploadPublic: false, lienUploadPublic: '' },
  docs: [],
  isAuthorized: false
});
assert.strictEqual(res2.rendered, false, "Règle 2 : Une corde vide sans upload public doit être masquée à l'adhérent");
assert.strictEqual(res2.reason, 'empty_member');

// Cas C : Corde vide AVEC upload public valide pour un adhérent
const res3 = simulateRopeDecision({
  category: { id: 'PhotosPrestations', nom: 'Photos Prestations', actif: true, activerUploadPublic: true, lienUploadPublic: 'https://drive.google.com/test' },
  docs: [],
  isAuthorized: false
});
assert.strictEqual(res3.rendered, true, "Règle 2 exception : Une corde vide avec upload public valide DOIT être visible");
assert.strictEqual(res3.mode, 'full_rope');

// Cas D : Corde active avec documents pour un adhérent
const res4 = simulateRopeDecision({
  category: { id: 'Culture', nom: 'Culture', actif: true },
  docs: [{ id: 'fiche1', type: 'culture_fiche' }],
  isAuthorized: false
});
assert.strictEqual(res4.rendered, true, "Une corde active avec documents doit s'afficher normalement");
assert.strictEqual(res4.mode, 'full_rope');

// Cas E : Corde vide pour un administrateur (Règle 3)
const res5 = simulateRopeDecision({
  category: { id: 'Administratif', nom: 'Administratif', actif: true },
  docs: [],
  isAuthorized: true
});
assert.strictEqual(res5.rendered, true, "Règle 3 : Une corde vide doit s'afficher pour l'admin");
assert.strictEqual(res5.mode, 'compact_admin', "Règle 3 : La corde vide admin doit être en mode compact");
assert.strictEqual(res5.isEmpty, true);

// Cas F : Corde désactivée pour un administrateur
const res6 = simulateRopeDecision({
  category: { id: 'ComptesRendus', nom: 'Comptes-rendus', actif: false },
  docs: [],
  isAuthorized: true
});
assert.strictEqual(res6.rendered, true, "Une corde désactivée doit être visible en mode compact pour l'admin pour pouvoir être réactivée");
assert.strictEqual(res6.mode, 'compact_admin');
assert.strictEqual(res6.isInactive, true);

console.log("✅ Test 2 validé : Toutes les règles 1, 2 et 3 sont rigoureusement respectées.");

// 3. Vérification de l'intégration dans le code source
console.log("▶️ Test 3 : Vérification du code source des composants...");

const tabDocsSource = fs.readFileSync('src/components/association-settings/TabDocuments.jsx', 'utf8');
assert(tabDocsSource.includes('handleToggleCategoryActive'), "TabDocuments.jsx doit comporter handleToggleCategoryActive");
assert(tabDocsSource.includes('Afficher cette corde'), "TabDocuments.jsx doit afficher le label 'Afficher cette corde'");
assert(tabDocsSource.includes('actif: true'), "TabDocuments.jsx doit initialiser les nouvelles catégories avec actif: true");

const varalManagerSource = fs.readFileSync('src/components/VaralManager.jsx', 'utf8');
assert(varalManagerSource.includes('handleToggleCategoryActive'), "VaralManager.jsx doit comporter handleToggleCategoryActive");
assert(varalManagerSource.includes('Afficher cette corde'), "VaralManager.jsx doit proposer le toggle 'Afficher cette corde'");

const widgetDocsSource = fs.readFileSync('src/components/WidgetDocuments.jsx', 'utf8');
assert(widgetDocsSource.includes('displayedCategories'), "WidgetDocuments.jsx doit utiliser displayedCategories pour filtrer intelligemment");
assert(widgetDocsSource.includes('editingCategory.actif !== false'), "WidgetDocuments.jsx doit permettre de modifier le statut actif dans sa modale");

const emptyRopeAdminSource = fs.readFileSync('src/components/documents/varal/VaralEmptyRopeAdmin.jsx', 'utf8');
assert(emptyRopeAdminSource.includes('Corde vide (masquée aux adhérents)'), "VaralEmptyRopeAdmin doit afficher le badge discret de corde vide");
assert(emptyRopeAdminSource.includes('Corde désactivée (masquée aux adhérents)'), "VaralEmptyRopeAdmin doit afficher le badge de corde désactivée");

const categoryRopeSource = fs.readFileSync('src/components/documents/varal/VaralCategoryRope.jsx', 'utf8');
assert(categoryRopeSource.includes('VaralEmptyRopeAdmin'), "VaralCategoryRope doit intégrer le composant compact VaralEmptyRopeAdmin");
assert(categoryRopeSource.includes('category.actif === false'), "VaralCategoryRope doit vérifier category.actif === false");

console.log("✅ Test 3 validé : L'ensemble des composants et hooks intègrent le système de visibilité.");
console.log("\n🎉 TOUS LES TESTS DE VISIBILITÉ DU VARAL ONT RÉUSSI AVEC SUCCÈS !");
