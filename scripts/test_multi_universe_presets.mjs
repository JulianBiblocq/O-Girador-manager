import assert from 'assert';
import {
  UNIVERSE_DEFAULT_INSTRUMENTS,
  UNIVERSE_TERMINOLOGY,
  normalizeUniverseId,
  getUniverseDefaultInstruments,
  getUniverseTerminology
} from '../src/constants/universeDefaults.js';

console.log("=== TEST SUITE : MULTI-UNIVERS (BATUCADA STRICT, SAMBA-REGGAE, SAMBA, MARACATU) ===");

// Test 1 : Normalisation des identifiants
console.log("\n▶️ Test 1 : Normalisation des identifiants d'univers");
assert.strictEqual(normalizeUniverseId('maracatu'), 'maracatu');
assert.strictEqual(normalizeUniverseId('MARACATU'), 'maracatu');
assert.strictEqual(normalizeUniverseId('batucada'), 'batucada');
assert.strictEqual(normalizeUniverseId('sambareggae'), 'sambareggae');
assert.strictEqual(normalizeUniverseId('samba'), 'samba');
assert.strictEqual(normalizeUniverseId('capoeira'), 'capoeira');
assert.strictEqual(normalizeUniverseId(''), 'maracatu', 'Fallback strict sur maracatu si vide');
assert.strictEqual(normalizeUniverseId(null), 'maracatu', 'Fallback strict sur maracatu si null');
assert.strictEqual(normalizeUniverseId('inconnu'), 'maracatu', 'Fallback strict sur maracatu si inconnu');
console.log("  ✅ [PASS] Normalisation et replis sécurisés vérifiés.");

// Test 2 : Instruments par défaut par univers
console.log("\n▶️ Test 2 : Instruments par défaut dissociés (Batucada stricte)");
const maracatuInsts = getUniverseDefaultInstruments('maracatu');
const batucadaInsts = getUniverseDefaultInstruments('batucada');
const sambareggaeInsts = getUniverseDefaultInstruments('sambareggae');
const sambaInsts = getUniverseDefaultInstruments('samba');
const capoeiraInsts = getUniverseDefaultInstruments('capoeira');

// Batucada stricte
const expectedBatucada = [
  "Surdo 1",
  "Surdo 2",
  "Surdo 3",
  "Repique",
  "Caixa",
  "Timba",
  "Chocalho",
  "Tambourin",
  "Agogô",
  "Chant",
  "Danse"
];
assert.deepStrictEqual(batucadaInsts, expectedBatucada, "Batucada correspond exactement aux 11 instruments stricts demandés");
assert(!batucadaInsts.includes('Alfaia'), "Batucada ne contient pas Alfaia");

// Samba-Reggae
assert(sambareggaeInsts.includes('Surdo Fundo'), "Samba-Reggae contient Surdo Fundo");
assert(sambareggaeInsts.includes('Surdo Dobra'), "Samba-Reggae contient Surdo Dobra");
assert(sambareggaeInsts.includes('Surdo Resposta'), "Samba-Reggae contient Surdo Resposta");
assert(sambareggaeInsts.includes('Timbal'), "Samba-Reggae contient Timbal");

// Samba Enredo
assert(sambaInsts.includes('Surdo 1 (Primeira)'), "Samba contient Surdo 1");
assert(sambaInsts.includes('Tamborim'), "Samba contient Tamborim");
assert(sambaInsts.includes('Cuíca'), "Samba contient Cuíca");
assert(sambaInsts.includes('Passistas'), "Samba contient Passistas");

// Maracatu
assert(maracatuInsts.includes('Alfaia'), "Maracatu contient Alfaia");
assert(maracatuInsts.includes('Gonguê'), "Maracatu contient Gonguê");

// Capoeira
assert(capoeiraInsts.includes('Berimbau Gunga'), "Capoeira contient Berimbau");

// Fallback inconnu
const fallbackInsts = getUniverseDefaultInstruments('inconnu_random');
assert.deepStrictEqual(fallbackInsts, maracatuInsts, "Univers inconnu replie rigoureusement sur Maracatu");
console.log("  ✅ [PASS] Catalogues d'instruments distincts et Batucada stricte 100% validés.");

// Test 3 : Vocabulaire sémantique & Déclinaisons de direction
console.log("\n▶️ Test 3 : Dictionnaire sémantique & Titres de direction");
const maracatuTerm = getUniverseTerminology('maracatu');
const batucadaTerm = getUniverseTerminology('batucada');
const sambareggaeTerm = getUniverseTerminology('sambareggae');
const sambaTerm = getUniverseTerminology('samba');

// Batucada
assert.strictEqual(batucadaTerm.playerMasc, 'Batuqueiro');
assert.strictEqual(batucadaTerm.playerFem, 'Batuqueira');
assert.strictEqual(batucadaTerm.leader, 'Mestre');
assert.strictEqual(batucadaTerm.leaderFem, 'Mestra');
assert.strictEqual(batucadaTerm.leaderDimMasc, 'Mestrinho');
assert.strictEqual(batucadaTerm.leaderDimFem, 'Mestrinha');
assert.strictEqual(batucadaTerm.section, 'Pupitre');
assert.strictEqual(batucadaTerm.event, 'Défilé de rue');
assert.strictEqual(batucadaTerm.songs, 'Morceaux');

// Samba
assert.strictEqual(sambaTerm.playerMasc, 'Ritmista');
assert.strictEqual(sambaTerm.leader, 'Mestre de Bateria');
assert.strictEqual(sambaTerm.leaderFem, 'Mestra de Bateria');
assert.strictEqual(sambaTerm.section, 'Naipe');
assert.strictEqual(sambaTerm.event, 'Desfile');
assert.strictEqual(sambaTerm.songs, 'Sambas-Enredo');

// Maracatu
assert.strictEqual(maracatuTerm.playerMasc, 'Batuqueiro');
assert.strictEqual(maracatuTerm.leader, 'Mestre');
assert.strictEqual(maracatuTerm.leaderFem, 'Mestra');
assert.strictEqual(maracatuTerm.leaderDimMasc, 'Mestrinho');
assert.strictEqual(maracatuTerm.leaderDimFem, 'Mestrinha');
assert.strictEqual(maracatuTerm.section, 'Pupitre');
assert.strictEqual(maracatuTerm.event, 'Cortejo');
assert.strictEqual(maracatuTerm.songs, 'Toadas');

console.log("  ✅ [PASS] Vocabulaire sémantique et déclinaisons de genre/titres validés.");

console.log("\n=========================================================================");
console.log("🏆 SUCCÈS TOTAL : SÉPARATION STRICTE BATUCADA / SAMBA-REGGAE VALIDÉE !");
console.log("=========================================================================\n");
