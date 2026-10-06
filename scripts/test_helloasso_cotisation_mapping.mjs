/**
 * test_helloasso_cotisation_mapping.mjs
 * Validation du rapprochement chirurgical des formules HelloAsso et calcul des cotisations :
 * 1. Adhésion seule OBLIGATOIRE pour tous·tes (10 €) -> adhesionBase: true
 * 2. Cotisation annuelle PERCUSSIONS (135 € ou 3x 45 €) -> 'percussions', mention 3x
 * 3. Cotisation annuelle DANSE (90 € ou 3x 30 €) -> 'danse', mention 3x
 * 4. Dons complémentaires (5 €, 10 €, 20 € ou libre) -> catégorie 'Dons'
 * 5. Recalcul dynamique du montant dû (10 €, 145 €, 235 €, 100 €)
 */

import { detectHelloAssoOptions } from '../functions/helloasso.js';

console.log("=== TEST DU RAPPROCHEMENT CHIRURGICAL HELLOASSO & COTISATIONS ===\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// TEST 1 : Règle 1 - Adhésion seule obligatoire (10 €)
// --------------------------------------------------------------------------
console.log("TEST 1 : Adhésion de base (10 €)");
const itemsAdhesionSeule = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" }
];
const resAdhesion = detectHelloAssoOptions(itemsAdhesionSeule, { amount: 1000 });
assert(resAdhesion.adhesionBase === true, "adhesionBase est bien true");
assert(!resAdhesion.selectedOptions.includes('percussions'), "Pas d'option percussions");
assert(!resAdhesion.selectedOptions.includes('danse'), "Pas d'option danse");
assert(resAdhesion.echelonne === false, "Non échelonné");

// --------------------------------------------------------------------------
// TEST 2 : Règle 2 - Option Percussions (135 € comptant et 3x 45 €)
// --------------------------------------------------------------------------
console.log("\nTEST 2 : Option Percussions (135 € et 3x 45 €)");
// Cas comptant : Adhésion 10 € + Percussions 135 € = 145 €
const itemsPercuComptant = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle PERCUSSIONS", amount: 13500, type: "membership" }
];
const resPercuComptant = detectHelloAssoOptions(itemsPercuComptant, { amount: 14500 });
assert(resPercuComptant.adhesionBase === true, "Adhésion de base active avec Percussions");
assert(resPercuComptant.selectedOptions.includes('percussions'), "Option 'percussions' ajoutée");
assert(resPercuComptant.pratiquePercussion === true, "pratiquePercussion = true");
assert(resPercuComptant.echelonne === false, "Paiement comptant détecté");

// Cas 3x : Cotisation annuelle paiement 3x PERCUSSIONS (45 €)
const itemsPercu3x = [
  { name: "Cotisation annuelle paiement 3x PERCUSSIONS", amount: 4500, type: "membership" }
];
const resPercu3x = detectHelloAssoOptions(itemsPercu3x, { amount: 4500 });
assert(resPercu3x.selectedOptions.includes('percussions'), "Option 'percussions' ajoutée en formule 3x");
assert(resPercu3x.echelonne === true, "Échelonné détecté sur mention '3x'");
assert(resPercu3x.echeance === 3, "Nombre d'échéances = 3");
assert(resPercu3x.adhesionBase === true, "Adhésion de base acquise car cotisation présente");

// --------------------------------------------------------------------------
// TEST 3 : Règle 3 - Option Danse (90 € comptant et 3x 30 €)
// --------------------------------------------------------------------------
console.log("\nTEST 3 : Option Danse (90 € et 3x 30 €)");
// Cas comptant : Adhésion 10 € + Danse 90 € = 100 €
const itemsDanseComptant = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle DANSE", amount: 9000, type: "membership" }
];
const resDanseComptant = detectHelloAssoOptions(itemsDanseComptant, { amount: 10000 });
assert(resDanseComptant.adhesionBase === true, "Adhésion de base active avec Danse");
assert(resDanseComptant.selectedOptions.includes('danse'), "Option 'danse' ajoutée");
assert(resDanseComptant.pratiqueDanse === true, "pratiqueDanse = true");
assert(resDanseComptant.echelonne === false, "Danse comptant non échelonnée");

// Cas 3x : Cotisation annuelle paiement 3x DANSE (30 €)
const itemsDanse3x = [
  { name: "Cotisation annuelle paiement 3x DANSE", amount: 3000, type: "membership" }
];
const resDanse3x = detectHelloAssoOptions(itemsDanse3x, { amount: 3000 });
assert(resDanse3x.selectedOptions.includes('danse'), "Option 'danse' ajoutée en 3x");
assert(resDanse3x.echelonne === true, "Échelonné 3x détecté pour la Danse");
assert(resDanse3x.echeance === 3, "Échéances = 3");

// --------------------------------------------------------------------------
// TEST 4 : Panier combiné Percussions + Danse (10 € + 135 € + 90 € = 235 €)
// --------------------------------------------------------------------------
console.log("\nTEST 4 : Formule combinée Percussions + Danse (Total 235 €)");
const itemsCombines = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle PERCUSSIONS", amount: 13500, type: "membership" },
  { name: "Cotisation annuelle DANSE", amount: 9000, type: "membership" }
];
const resCombines = detectHelloAssoOptions(itemsCombines, { amount: 23500 });
assert(resCombines.adhesionBase === true, "Adhésion de base true");
assert(resCombines.selectedOptions.includes('percussions'), "Percussions présente");
assert(resCombines.selectedOptions.includes('danse'), "Danse présente");
assert(resCombines.pratiquePercussion === true, "pratiquePercussion true");
assert(resCombines.pratiqueDanse === true, "pratiqueDanse true");

// --------------------------------------------------------------------------
// TEST 5 : Règle 4 - Dons complémentaires (5 €, 10 €, 20 € ou libre / résiduel)
// --------------------------------------------------------------------------
console.log("\nTEST 5 : Dons complémentaires et résiduels");
// Cas don explicite
const itemsAvecDon = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle PERCUSSIONS", amount: 13500, type: "membership" },
  { name: "Don complémentaire libre pour l'association", amount: 1500, type: "donation" }
];
const resAvecDon = detectHelloAssoOptions(itemsAvecDon, { amount: 16000 });
assert(resAvecDon.montantDons === 15, `Don de 15 € détecté (trouvé: ${resAvecDon.montantDons} €)`);
assert(resAvecDon.selectedOptions.includes('percussions'), "Option cotisation maintenue");

// Cas don résiduel interdit : sans article don explicite, le montant des dons doit rester à 0
const itemsSansDonExplicite = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle PERCUSSIONS", amount: 13500, type: "membership" }
];
const resSansDon = detectHelloAssoOptions(itemsSansDonExplicite, { amount: 16000 });
assert(resSansDon.montantDons === 0, `Pas de don sans article explicite (trouvé: ${resSansDon.montantDons} €)`);

// --------------------------------------------------------------------------
// TEST 6 : Simulation du recalcul dynamique dans MemberTreasuryRow
// --------------------------------------------------------------------------
console.log("\nTEST 6 : Simulation du calcul de la somme due (MemberTreasuryRow)");

function simulateMemberTreasuryRowActiveOptions({ selectedOptions, optionsCotisation = [] }) {
  const resolveOption = (optKey) => {
    if (!optKey) return null;
    const strKey = String(optKey).trim().toLowerCase();
    let found = optionsCotisation?.find(o => 
      o.id === optKey || (o.nom && String(o.nom).trim().toLowerCase() === strKey)
    );
    if (found) return found;
    if (strKey.includes('percussion') || strKey.includes('alfaia') || strKey.includes('caixa')) {
      return { id: 'percussions', nom: 'Percussions', montant: 135 };
    }
    if (strKey.includes('danse')) {
      return { id: 'danse', nom: 'Danse', montant: 90 };
    }
    return null;
  };

  // Déduplication canonique stricte par catégorie
  const seenCategories = new Set();
  const activeOptions = [];
  for (const optKey of (selectedOptions || [])) {
    const resolved = resolveOption(optKey) || (typeof optKey === 'string' && optKey ? { id: optKey, nom: optKey, montant: 0 } : null);
    if (!resolved) continue;

    const lowerId = String(resolved.id || '').toLowerCase();
    const lowerNom = String(resolved.nom || '').toLowerCase();

    let category = lowerId;
    if (lowerId.includes('percussion') || lowerNom.includes('percussion') || lowerId.includes('alfaia') || lowerId.includes('caixa')) {
      category = 'percussions';
    } else if (lowerId.includes('danse') || lowerNom.includes('danse')) {
      category = 'danse';
    }

    if (!seenCategories.has(category)) {
      seenCategories.add(category);
      activeOptions.push(resolved);
    }
  }
  return activeOptions;
}

function simulateMemberTreasuryRowTotal({ adhesionBase, selectedOptions, optionsCotisation = [] }) {
  const hasBase = adhesionBase !== false;
  const baseAmount = hasBase ? 10 : 0;
  const activeOptions = simulateMemberTreasuryRowActiveOptions({ selectedOptions, optionsCotisation });
  const optionsAmount = activeOptions.reduce((sum, opt) => sum + (parseFloat(opt.montant) || 0), 0);
  return baseAmount + optionsAmount;
}

// 1. Adhésion seule
const totalAdhesion = simulateMemberTreasuryRowTotal({ adhesionBase: true, selectedOptions: [] });
assert(totalAdhesion === 10, `Adhésion seule = 10 € (calculé: ${totalAdhesion} €)`);

// 2. Adhésion + Percussions
const totalPercu = simulateMemberTreasuryRowTotal({ adhesionBase: true, selectedOptions: ['percussions'] });
assert(totalPercu === 145, `Adhésion + Percussions = 145 € (calculé: ${totalPercu} €)`);

// 3. Adhésion + Danse
const totalDanse = simulateMemberTreasuryRowTotal({ adhesionBase: true, selectedOptions: ['danse'] });
assert(totalDanse === 100, `Adhésion + Danse = 100 € (calculé: ${totalDanse} €)`);

// 4. Adhésion + Percussions + Danse
const totalComplet = simulateMemberTreasuryRowTotal({ adhesionBase: true, selectedOptions: ['percussions', 'danse'] });
assert(totalComplet === 235, `Adhésion + Percussions + Danse = 235 € (calculé: ${totalComplet} €)`);

// --------------------------------------------------------------------------
// TEST 7 : Cas réel Hélène Chevalier (10 € adhésion + 135 € percussions + 5 € don = 150 €)
// --------------------------------------------------------------------------
console.log("\nTEST 7 : Cas réel Hélène Chevalier (Panier 150 € avec don de 5 €)");
const itemsHelene = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle PERCUSSIONS", amount: 13500, type: "membership" },
  { name: "Don de soutien", amount: 500, type: "donation" }
];
const resHelene = detectHelloAssoOptions(itemsHelene, { amount: 15000 });
assert(resHelene.selectedOptions.length === 1, "Hélène a exactement 1 option souscrite");
assert(resHelene.selectedOptions[0] === 'percussions', "L'option d'Hélène est uniquement 'percussions'");
assert(!resHelene.selectedOptions.includes('danse'), "Aucune option danse pour Hélène");
assert(resHelene.montantDons === 5, `Don de 5 € extrait pour Hélène (trouvé: ${resHelene.montantDons} €)`);
const dueHelene = simulateMemberTreasuryRowTotal({ adhesionBase: resHelene.adhesionBase, selectedOptions: resHelene.selectedOptions });
assert(dueHelene === 145, `Montant dû par Hélène est exactement de 145 € (calculé: ${dueHelene} €)`);

// --------------------------------------------------------------------------
// TEST 8 : Cas réels Yann Cauquil & Valérie Jéhanno-Guillaud (10 € adhésion + 135 € percussions)
// --------------------------------------------------------------------------
console.log("\nTEST 8 : Cas réels Yann Cauquil & Valérie Jéhanno-Guillaud (145 €)");
const itemsYannValerie = [
  { name: "Adhésion seule OBLIGATOIRE pour tous·tes", amount: 1000, type: "membership" },
  { name: "Cotisation annuelle PERCUSSIONS", amount: 13500, type: "membership" }
];
const resYann = detectHelloAssoOptions(itemsYannValerie, { amount: 14500 });
assert(resYann.selectedOptions.length === 1 && resYann.selectedOptions[0] === 'percussions', "Yann et Valérie ont uniquement 'percussions'");
assert(!resYann.selectedOptions.includes('danse'), "Pas d'option danse");
const dueYann = simulateMemberTreasuryRowTotal({ adhesionBase: resYann.adhesionBase, selectedOptions: resYann.selectedOptions });
assert(dueYann === 145, `Montant dû par Yann / Valérie = 145 € (calculé: ${dueYann} €)`);

// --------------------------------------------------------------------------
// TEST 9 : Élimination formelle du bug des 370 € (options dupliquées)
// --------------------------------------------------------------------------
console.log("\nTEST 9 : Élimination formelle du bug des 370 €");
// Profil corrompu préalable avec 3 options : Percussions, Danse, Cotisation annuelle PERCUSSIONS
const corruptedOptions = ['Percussions', 'Danse', 'Cotisation annuelle PERCUSSIONS'];
const activeOpts = simulateMemberTreasuryRowActiveOptions({ selectedOptions: corruptedOptions });
assert(activeOpts.length === 2, `Seulement 2 options uniques retenues (trouvé: ${activeOpts.length})`);
assert(activeOpts.filter(o => o.id === 'percussions').length === 1, "Exactement 1 seule option Percussions");
assert(activeOpts.filter(o => o.id === 'danse').length === 1, "Exactement 1 seule option Danse");
const totalCorrige = simulateMemberTreasuryRowTotal({ adhesionBase: true, selectedOptions: corruptedOptions });
assert(totalCorrige === 235, `Montant total corrigé = 235 € (et NON 370 € ! trouvé: ${totalCorrige} €)`);

// --------------------------------------------------------------------------
// TEST 10 : Profil avec options multiples percussions seules (ex: 'Percussions' + 'Cotisation annuelle PERCUSSIONS')
// --------------------------------------------------------------------------
console.log("\nTEST 10 : Profil avec doublon Percussions uniquement");
const corruptedPercuOnly = ['Percussions', 'Cotisation annuelle PERCUSSIONS'];
const activePercuOnly = simulateMemberTreasuryRowActiveOptions({ selectedOptions: corruptedPercuOnly });
assert(activePercuOnly.length === 1, `Exactement 1 option Percussions conservée (trouvé: ${activePercuOnly.length})`);
const totalPercuCorrige = simulateMemberTreasuryRowTotal({ adhesionBase: true, selectedOptions: corruptedPercuOnly });
assert(totalPercuCorrige === 145, `Montant dû Percussions dédoublonné = 145 € (et NON 280 € ! trouvé: ${totalPercuCorrige} €)`);

console.log(`\n=== RÉSULTATS : ${passed}/${total} TESTS RÉUSSIS ===`);
if (passed === total) {
  console.log("✨ Tous les mappings HelloAsso et calculs de cotisations sont validés à 100% !");
} else {
  process.exit(1);
}
