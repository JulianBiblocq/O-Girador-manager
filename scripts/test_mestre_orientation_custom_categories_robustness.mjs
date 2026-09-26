import fs from 'fs';
import assert from 'assert';
import { getCustomCategories, getCategoryName } from '../src/utils/categoryUtils.js';

console.log("========================================================================");
console.log("🧪 TEST MISSION : ROBUSTESSE DES CATÉGORIES DANS MESTRE ORIENTATION & CASTING");
console.log("========================================================================");

console.log("\n▶️ Test 1 : getCategoryName et getCustomCategories avec des objets et des chaînes mixtes");
const mixedCategories = [
  { name: 'Débutant', color: '#ffcc00' },
  { name: 'Intermédiaire', color: '#00ccff' },
  'Confirmé',
  { label: 'Avancé' },
  null,
  undefined
];

const normalized = getCustomCategories({ customCategories: mixedCategories });
console.log("  Catégories normalisées :", normalized);
assert.deepStrictEqual(normalized, ['Débutant', 'Intermédiaire', 'Confirmé', 'Avancé']);
console.log("  ✅ [PASS] getCustomCategories assainit parfaitement toute structure d'objets Firestore");

console.log("\n▶️ Test 2 : Filtrage défensif de la Danse avec getCategoryName");
const danceFiltered = mixedCategories
  .filter(cat => {
    const name = getCategoryName(cat);
    return name && name.toLowerCase().replace(/é|è|ê/g, 'e') !== 'debutant';
  })
  .map(cat => getCategoryName(cat));

assert.deepStrictEqual(danceFiltered, ['Intermédiaire', 'Confirmé', 'Avancé']);
console.log("  ✅ [PASS] Le filtrage Danse ne crashe plus même avec des objets { name, color } ou valeurs nulles");

console.log("\n▶️ Test 3 : Contrôle statique dans MestreOrientationCasting.jsx");
const fileContent = fs.readFileSync('src/components/mestre/MestreOrientationCasting.jsx', 'utf8');
assert(!fileContent.includes('cat => cat.toLowerCase()'), "Aucun appel direct cat.toLowerCase() ne doit exister");
assert(fileContent.includes('getCategoryName(cat)'), "getCategoryName(cat) doit être utilisé pour sécuriser les accès");
assert(fileContent.includes('setCustomCategories(getCustomCategories(data))'), "customCategories doit être initialisé avec getCustomCategories");
console.log("  ✅ [PASS] MestreOrientationCasting.jsx est totalement sécurisé contre les objets Firestore");

console.log("\n========================================================================");
console.log("🏆 SUCCÈS TOTAL : LE CRASH EST ENTIÈREMENT RÉSOLU ET PÉRENNISÉ !");
console.log("========================================================================");
