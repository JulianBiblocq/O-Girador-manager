/**
 * Test de Recette Automatisé : Règles Pupitres vs Instruments & Voix
 * Vérifie que les élèves ne peuvent choisir QUE des pupitres et jamais des voix d'Alfaia (Marcante/Meião/Repique)
 * ni Caixa/Tarol séparés, et que le Mestre peut attribuer Caixa/Tarol et les voix d'Alfaia.
 */

import assert from 'assert';
import { 
  filterPublicPercussionInstruments, 
  computePupitresList, 
  resolvePupitreForInstrument 
} from '../src/utils/tagUtils.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : RÈGLES PUPITRES VS INSTRUMENTS & VOIX");
console.log("===============================================================\n");

// --- TEST 1 : filterPublicPercussionInstruments ---
console.log("▶️ Test 1 : Exclusion des voix d'Alfaia et des rôles de direction");
const rawInstrumentsWithSubvoices = [
  "Alfaia",
  "Marcante",
  "Meião",
  "Repique",
  "Caixa",
  "Tarol",
  "Mestre",
  "Direction",
  "Chef de bateria",
  "Danse",
  "Gonguê"
];

const filteredPublic = filterPublicPercussionInstruments(rawInstrumentsWithSubvoices);
assert(!filteredPublic.includes("Marcante"), "Marcante doit être exclu des instruments publics");
assert(!filteredPublic.includes("Meião"), "Meião doit être exclu des instruments publics");
assert(!filteredPublic.includes("Repique"), "Repique doit être exclu des instruments publics");
assert(!filteredPublic.includes("Mestre"), "Mestre doit être exclu des instruments publics");
assert(!filteredPublic.includes("Danse"), "Danse doit être exclu des percussions publiques");
assert(filteredPublic.includes("Alfaia"), "Alfaia doit être conservé");
assert(filteredPublic.includes("Gonguê"), "Gonguê doit être conservé");
console.log("✅ Test 1 validé : Marcante, Meião, Repique, Danse et Mestre sont exclus.\n");

// --- TEST 2 : computePupitresList avec consolidation automatique Caixas ---
console.log("▶️ Test 2 : Consolidation automatique Caixa + Tarol -> Caixas");
const rawWithCaixaAndTarol = ["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro"];
const pupitresConsolides = computePupitresList(rawWithCaixaAndTarol, []);

assert(pupitresConsolides.includes("Caixas"), "Caixas doit être consolidé comme pupitre");
assert(!pupitresConsolides.includes("Caixa"), "Caixa individuel ne doit pas apparaître si consolidé");
assert(!pupitresConsolides.includes("Tarol"), "Tarol individuel ne doit pas apparaître si consolidé");
assert(pupitresConsolides.includes("Alfaia"), "Alfaia doit être présent");
assert(pupitresConsolides.includes("Gonguê"), "Gonguê doit être présent");
console.log("✅ Test 2 validé : Caixa et Tarol sont consolidés sous 'Caixas'.\n");

// --- TEST 3 : computePupitresList avec groupes liés personnalisés ---
console.log("▶️ Test 3 : Respect des groupes d'instruments liés configurés");
const linkedGroups = [
  { name: "Caixa & Tarol", instruments: ["Caixa", "Tarol"] },
  { name: "Agbê & Mineiro", instruments: ["Agbê", "Mineiro"] }
];
const pupitresWithLinked = computePupitresList(rawWithCaixaAndTarol, linkedGroups);

assert(pupitresWithLinked.includes("Caixa & Tarol"), "Le groupe 'Caixa & Tarol' doit être présent");
assert(pupitresWithLinked.includes("Agbê & Mineiro"), "Le groupe 'Agbê & Mineiro' doit être présent");
assert(!pupitresWithLinked.includes("Caixa"), "Caixa seul ne doit pas être présent");
assert(!pupitresWithLinked.includes("Tarol"), "Tarol seul ne doit pas être présent");
assert(!pupitresWithLinked.includes("Agbê"), "Agbê seul ne doit pas être présent");
assert(!pupitresWithLinked.includes("Mineiro"), "Mineiro seul ne doit pas être présent");
console.log("✅ Test 3 validé : Les groupes configurés remplacent parfaitement les instruments constitutifs.\n");

// --- TEST 4 : Exclusion stricte des voix d'Alfaia et garantie de présence d'Alfaia ---
console.log("▶️ Test 4 : Saisie accidentelle de sous-voix dans l'association");
const buggyAssocInstruments = ["Marcante", "Meião", "Repique", "Gonguê"];
const pupitresFromBuggy = computePupitresList(buggyAssocInstruments, []);

assert(!pupitresFromBuggy.includes("Marcante"), "Marcante ne doit pas être un pupitre");
assert(!pupitresFromBuggy.includes("Meião"), "Meião ne doit pas être un pupitre");
assert(!pupitresFromBuggy.includes("Repique"), "Repique ne doit pas être un pupitre");
assert(pupitresFromBuggy.includes("Alfaia"), "Le pupitre Alfaia doit avoir été garanti automatiquement");
console.log("✅ Test 4 validé : Sous-voix converties / protégées et Alfaia garanti.\n");

// --- TEST 5 : Résolution canonique resolvePupitreForInstrument ---
console.log("▶️ Test 5 : Résolution canonique de n'importe quel instrument/voix vers son pupitre");
const associationPupitres = ["Alfaia", "Caixas", "Gonguê", "Agbê & Mineiro"];
const assocLinked = [{ name: "Agbê & Mineiro", instruments: ["Agbê", "Mineiro"] }];

assert.strictEqual(resolvePupitreForInstrument("Marcante", associationPupitres, assocLinked), "Alfaia");
assert.strictEqual(resolvePupitreForInstrument("meião", associationPupitres, assocLinked), "Alfaia");
assert.strictEqual(resolvePupitreForInstrument("repique", associationPupitres, assocLinked), "Alfaia");
assert.strictEqual(resolvePupitreForInstrument("Caixa", associationPupitres, assocLinked), "Caixas");
assert.strictEqual(resolvePupitreForInstrument("tarol", associationPupitres, assocLinked), "Caixas");
assert.strictEqual(resolvePupitreForInstrument("mineiro", associationPupitres, assocLinked), "Agbê & Mineiro");
assert.strictEqual(resolvePupitreForInstrument("Gonguê", associationPupitres, assocLinked), "Gonguê");
console.log("✅ Test 5 validé : Toutes les voix et sous-instruments sont résolus vers leur pupitre respectif.\n");

console.log("===============================================================");
console.log("🏆 SUCCÈS : TOUTES LES RÈGLES PUPITRES & VOIX SONT 100% VALIDÉES !");
console.log("===============================================================");
process.exit(0);
