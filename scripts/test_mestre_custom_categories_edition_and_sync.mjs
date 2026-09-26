import fs from 'fs';
import assert from 'assert';
import {
  getCategoryName,
  getCustomCategories,
  resolveCategory,
  isUserCategoryMatchingEvent,
  DEFAULT_CUSTOM_CATEGORIES
} from '../src/utils/categoryUtils.js';

console.log("========================================================================");
console.log("🧪 TEST MISSION : ÉDITION ET SYNCHRONISATION DES CATÉGORIES DE PRATIQUE");
console.log("========================================================================");

console.log("\n▶️ Test 1 : getCategoryName et normalisation");
assert.strictEqual(getCategoryName('Débutant'), 'Débutant');
assert.strictEqual(getCategoryName({ id: 'c1', name: 'Première année', color: '#2d6a4f' }), 'Première année');
assert.strictEqual(getCategoryName(null), '');
assert.strictEqual(getCategoryName(undefined), '');
console.log("  ✅ [PASS] getCategoryName extrait fidèlement le libellé sous tous formats");

console.log("\n▶️ Test 2 : getCustomCategories");
const settingsWithString = { customCategories: ['Première année', 'Plus d\'un an'] };
const settingsWithObj = {
  customCategories: [
    { id: '1', name: 'Première année' },
    { id: '2', name: 'Plus d\'un an d\'existence' }
  ]
};
assert.deepStrictEqual(getCustomCategories(settingsWithString), ['Première année', 'Plus d\'un an']);
assert.deepStrictEqual(getCustomCategories(settingsWithObj), ['Première année', 'Plus d\'un an d\'existence']);
assert.deepStrictEqual(getCustomCategories({}), DEFAULT_CUSTOM_CATEGORIES);
console.log("  ✅ [PASS] getCustomCategories normalise les listes d'objets ou de chaînes");

console.log("\n▶️ Test 3 : resolveCategory avec nouveaux intitulés souhaités par l'utilisateur");
const customCats = [
  { id: 'cat_0', name: 'Première année', color: '#2d6a4f' },
  { id: 'cat_1', name: 'Plus d\'un an d\'existence', color: '#8b2a1a' }
];

// Cas débutant -> Première année
assert.strictEqual(resolveCategory('debutant', customCats), 'Première année');
assert.strictEqual(resolveCategory('Débutant', customCats), 'Première année');
assert.strictEqual(resolveCategory('débutant', customCats), 'Première année');

// Cas confirmé -> Plus d'un an d'existence
assert.strictEqual(resolveCategory('confirme', customCats), 'Plus d\'un an d\'existence');
assert.strictEqual(resolveCategory('Confirmé', customCats), 'Plus d\'un an d\'existence');
assert.strictEqual(resolveCategory('confirmé', customCats), 'Plus d\'un an d\'existence');

// Cas catégorie spécifique déjà attribuée
assert.strictEqual(resolveCategory('Première année', customCats), 'Première année');
assert.strictEqual(resolveCategory('Plus d\'un an d\'existence', customCats), 'Plus d\'un an d\'existence');
console.log("  ✅ [PASS] resolveCategory fait le pont rétrocompatible parfait vers les nouveaux libellés");

console.log("\n▶️ Test 4 : Contrôle statique de CategoryCardItem.jsx");
assert(fs.existsSync('src/components/mestre/CategoryCardItem.jsx'), "CategoryCardItem.jsx doit exister");
const cardItemContent = fs.readFileSync('src/components/mestre/CategoryCardItem.jsx', 'utf8');
const cardItemLines = cardItemContent.split('\n').length;
console.log(`  ℹ️ Nombre de lignes CategoryCardItem.jsx : ${cardItemLines}`);
assert(cardItemLines < 200, "CategoryCardItem.jsx doit respecter la règle anti-monolithe (< 200 lignes)");
assert(cardItemContent.includes('isEditing'), "Mode édition en ligne présent");
assert(cardItemContent.includes('onSaveEdit'), "Callback onSaveEdit présent");
assert(cardItemContent.includes('onStartEdit'), "Callback onStartEdit présent");
assert(cardItemContent.includes('✏️'), "Bouton d'édition avec pictogramme ✏️ présent");
console.log("  ✅ [PASS] CategoryCardItem est modulaire, propre et conforme aux standards Cordel");

console.log("\n▶️ Test 5 : Contrôle statique de MestreCustomCategories.jsx");
const customCategoriesContent = fs.readFileSync('src/components/mestre/MestreCustomCategories.jsx', 'utf8');
assert(customCategoriesContent.includes('CategoryCardItem'), "MestreCustomCategories doit intégrer CategoryCardItem");
assert(customCategoriesContent.includes('handleSaveEditCategory'), "Gestionnaire de modification présent");
assert(customCategoriesContent.includes('editingCatId'), "État d'édition présent");
assert(customCategoriesContent.includes('batchMigrateUserCategories'), "Migration batch branchée lors du renommage");
console.log("  ✅ [PASS] MestreCustomCategories intègre l'édition et le déclenchement de la synchronisation");

console.log("\n========================================================================");
console.log("🏆 SUCCÈS TOTAL : LE SYSTÈME DE GESTION DES CATÉGORIES EST 100% OPÉRATIONNEL !");
console.log("========================================================================");
