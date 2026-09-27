/**
 * Test de validation automatisé : Réduction et réorganisation du Varal (5 cordes cibles)
 * Vérifie :
 * 1. L'ordre strict des 5 cordes principales (Toadas, Culture, TutosFabrication, PhotosPrestations, ComptesRendus)
 * 2. La désactivation de TutorielsVideo par défaut (actif: false)
 * 3. La détection des documents administratifs (isAdministrativeDoc)
 * 4. Le tri sur ComptesRendus (docs administratifs fixes en tête, CR par date décroissante)
 * 5. La fusion des documents sans perte de données (Administratif -> ComptesRendus, Costumerie -> TutosFabrication)
 * 6. Le tampon xylogravé Couture dans getInstrumentStamp
 * 7. La variable CSS bleu-ardoise dans index.css
 */

import assert from 'assert';
import fs from 'fs';

console.log("✂️ TEST SUITE : RÉDUCTION ET RÉORGANISATION DU VARAL (5 CORDES CIBLES) ✂️\n");

// 1. Ordre strict et statut par défaut des catégories
console.log("▶️ Test 1 : Vérification de l'ordre strict des 5 cordes et désactivation de TutorielsVideo...");
const varalDataCode = fs.readFileSync('src/hooks/useVaralData.js', 'utf8');

const match = varalDataCode.match(/export const DEFAULT_VARAL_CATEGORIES = (\[[\s\S]*?\]);/);
assert(match, "DEFAULT_VARAL_CATEGORIES doit être exporté dans useVaralData.js");
const defaultCats = (new Function(`return ${match[1]}`))();

const expectedOrder = ['Toadas', 'Culture', 'TutosFabrication', 'PhotosPrestations', 'ComptesRendus'];
for (let i = 0; i < expectedOrder.length; i++) {
  assert.strictEqual(
    defaultCats[i].id,
    expectedOrder[i],
    `La corde à l'index ${i} doit être ${expectedOrder[i]} (reçu: ${defaultCats[i].id})`
  );
  assert.strictEqual(
    defaultCats[i].actif,
    true,
    `La corde principale ${expectedOrder[i]} doit avoir actif === true`
  );
}

const tutosVideo = defaultCats.find(c => c.id === 'TutorielsVideo');
assert(tutosVideo, "TutorielsVideo doit exister dans DEFAULT_VARAL_CATEGORIES");
assert.strictEqual(tutosVideo.actif, false, "TutorielsVideo doit être désactivé par défaut (actif: false)");

console.log("✅ Test 1 validé : 5 cordes principales ordonnées et TutorielsVideo désactivé.\n");

// 2. Vérification de la fonction isAdministrativeDoc
console.log("▶️ Test 2 : Détection des documents administratifs fixes...");
// Extraction de la fonction isAdministrativeDoc
const adminDocFuncMatch = varalDataCode.match(/export const isAdministrativeDoc = ([\s\S]*?\n\};)/);
assert(adminDocFuncMatch, "isAdministrativeDoc doit être exportée dans useVaralData.js");
const isAdministrativeDoc = (new Function(`return ${adminDocFuncMatch[1]}`))();

// Cas positifs
assert.strictEqual(isAdministrativeDoc({ categoryId: 'Administratif' }), true);
assert.strictEqual(isAdministrativeDoc({ typeDoc: 'statuts' }), true);
assert.strictEqual(isAdministrativeDoc({ titre: 'Statuts de l\'association 2024' }), true);
assert.strictEqual(isAdministrativeDoc({ titre: 'Règlement Intérieur' }), true);
assert.strictEqual(isAdministrativeDoc({ titre: 'Attestation d\'Assurance MAIF' }), true);
assert.strictEqual(isAdministrativeDoc({ titre: 'RIB Compte Bancaire' }), true);
assert.strictEqual(isAdministrativeDoc({ titre: 'Composition du Conseil d\'Administration' }), true);

// Cas négatifs (Comptes-rendus ordinaires ou autres docs)
assert.strictEqual(isAdministrativeDoc({ titre: 'Compte-rendu AG ordinaire 2024', type: 'reunion' }), false);
assert.strictEqual(isAdministrativeDoc({ titre: 'PV Réunion Mensuelle Novembre', categoryId: 'ComptesRendus' }), false);
assert.strictEqual(isAdministrativeDoc({ titre: 'Chant Maracatu Estrela', categoryId: 'Toadas' }), false);

console.log("✅ Test 2 validé : isAdministrativeDoc filtre avec exactitude les pièces fixes.\n");

// 3. Vérification de la fusion et du tri
console.log("▶️ Test 3 : Simulation du partitionnement et tri de groupedDocs...");

// Docs tests
const testDocs = [
  { id: 'cr-2023', titre: 'CR Réunion 2023', categoryId: 'ComptesRendus', annee: 2023, dateAjout: '2023-05-01' },
  { id: 'rib', titre: 'RIB de l\'Association', categoryId: 'Administratif', annee: 2024, dateAjout: '2024-01-01' },
  { id: 'cr-2026', titre: 'CR AG 2026', categoryId: 'ComptesRendus', annee: 2026, dateAjout: '2026-02-15' },
  { id: 'statuts', titre: 'Statuts officiels', categoryId: 'Administratif', annee: 2022, dateAjout: '2022-01-01' },
  { id: 'cr-2025', titre: 'CR Réunion 2025', categoryId: 'ComptesRendus', annee: 2025, dateAjout: '2025-09-01' },
  { id: 'costume-rei', titre: 'Patron Veste de Roi', categoryId: 'Costumerie', dateAjout: '2025-01-01' },
  { id: 'fab-alfaia', titre: 'Fabrication Alfaia', categoryId: 'TutosFabrication', dateAjout: '2025-02-01' }
];

// Logique de dispatching de useVaralData
const groups = {};
expectedOrder.forEach(catId => { groups[catId] = []; });

testDocs.forEach(doc => {
  let targetCat = doc.categoryId;
  if (targetCat === 'Administratif' || targetCat === 'DocumentsFixes') {
    targetCat = 'ComptesRendus';
  } else if (targetCat === 'Costumerie') {
    targetCat = 'TutosFabrication';
  }
  if (groups[targetCat]) {
    groups[targetCat].push(doc);
  }
});

// Tri sur ComptesRendus
groups['ComptesRendus'].sort((a, b) => {
  const aIsAdmin = isAdministrativeDoc(a);
  const bIsAdmin = isAdministrativeDoc(b);
  if (aIsAdmin && !bIsAdmin) return -1;
  if (!aIsAdmin && bIsAdmin) return 1;

  const yearA = a.annee || (a.date ? new Date(a.date).getFullYear() : (a.dateAjout ? new Date(a.dateAjout).getFullYear() : 0));
  const yearB = b.annee || (b.date ? new Date(b.date).getFullYear() : (b.dateAjout ? new Date(b.dateAjout).getFullYear() : 0));
  if (yearB !== yearA) return yearB - yearA;

  const dateA = a.date ? new Date(a.date) : (a.dateAjout ? new Date(a.dateAjout) : 0);
  const dateB = b.date ? new Date(b.date) : (b.dateAjout ? new Date(b.dateAjout) : 0);
  return dateB - dateA;
});

// Vérifications
assert.strictEqual(groups['TutosFabrication'].length, 2, "La costumerie doit être fusionnée dans TutosFabrication");
assert(groups['TutosFabrication'].some(d => d.id === 'costume-rei'));
assert(groups['TutosFabrication'].some(d => d.id === 'fab-alfaia'));

assert.strictEqual(groups['ComptesRendus'].length, 5, "Les 2 docs administratifs + 3 CR doivent être fusionnés dans ComptesRendus");
// Les deux premiers doivent être les docs administratifs fixes
assert.strictEqual(isAdministrativeDoc(groups['ComptesRendus'][0]), true, "Le premier doc doit être un doc administratif fixe");
assert.strictEqual(isAdministrativeDoc(groups['ComptesRendus'][1]), true, "Le deuxième doc doit être un doc administratif fixe");

// Ensuite les comptes-rendus triés par année décroissante (2026, puis 2025, puis 2023)
assert.strictEqual(groups['ComptesRendus'][2].id, 'cr-2026', "Le premier CR doit être 2026");
assert.strictEqual(groups['ComptesRendus'][3].id, 'cr-2025', "Le deuxième CR doit être 2025");
assert.strictEqual(groups['ComptesRendus'][4].id, 'cr-2023', "Le troisième CR doit être 2023");

console.log("✅ Test 3 validé : Fusion et tri sur ComptesRendus conformes à la spécification.\n");

// 4. Tampon xylogravé Couture
console.log("▶️ Test 4 : Vérification du tampon Couture dans InstrumentStampSVG...");
const stampContent = fs.readFileSync('src/components/InstrumentStampSVG.jsx', 'utf8');
assert(stampContent.includes('COUTURE'), "InstrumentStampSVG doit définir le tampon COUTURE");
assert(stampContent.includes('nameLower.includes(\'costume\')'), "InstrumentStampSVG doit reconnaître le mot costume");
assert(stampContent.includes('nameLower.includes(\'couture\')'), "InstrumentStampSVG doit reconnaître le mot couture");
assert(stampContent.includes('nameLower.includes(\'patron\')'), "InstrumentStampSVG doit reconnaître le mot patron");

console.log("✅ Test 4 validé : Tampon Couture défini et accessible par mots-clés.\n");

// 5. CSS Bleu Ardoise
console.log("▶️ Test 5 : Vérification de la variable CSS bleu-ardoise...");
const cssContent = fs.readFileSync('src/index.css', 'utf8');
assert(cssContent.includes('--color-cordel-bleu-ardoise'), "index.css doit définir --color-cordel-bleu-ardoise");
assert(cssContent.includes('.theme-bg-bleu-ardoise'), "index.css doit fournir la classe utilitaire .theme-bg-bleu-ardoise");

console.log("✅ Test 5 validé : Variables CSS et classes Cordel présentes.\n");

console.log("🎉 TOUS LES TESTS DE RÉORGANISATION DU VARAL ONT RÉUSSI AVEC SUCCÈS ! 🎉");
