import assert from 'assert';
import { getInstrumentIconPath } from '../src/utils/instrumentUtils.js';

console.log("========================================================================");
console.log("🧪 TEST MISSION : RÉSOLUTION DES PICTOGRAMMES CORDEL D'INSTRUMENTS");
console.log("========================================================================");

console.log("\n▶️ Test 1 : Famille des Alfaias (Pupitre et toutes ses sous-voix)");
assert.strictEqual(getInstrumentIconPath('Alfaia'), '/icones/alfaia.svg', "Alfaia singulier");
assert.strictEqual(getInstrumentIconPath('Alfaias'), '/icones/alfaia.svg', "Alfaias pluriel");
assert.strictEqual(getInstrumentIconPath('Marcante'), '/icones/alfaia.svg', "Marcante (première voix d'Alfaia)");
assert.strictEqual(getInstrumentIconPath('Meião'), '/icones/alfaia.svg', "Meião (deuxième voix d'Alfaia)");
assert.strictEqual(getInstrumentIconPath('Meiao'), '/icones/alfaia.svg', "Meiao sans accent");
assert.strictEqual(getInstrumentIconPath('Repique'), '/icones/alfaia.svg', "Repique (troisième voix d'Alfaia)");
console.log("  ✅ [PASS] Toutes les voix et appellations de l'Alfaia résolvent vers /icones/alfaia.svg");

console.log("\n▶️ Test 2 : Autres pupitres et instruments du Maracatu");
assert.strictEqual(getInstrumentIconPath('Caixa'), '/icones/caixa.svg', "Caixa");
assert.strictEqual(getInstrumentIconPath('Caixas'), '/icones/caixa.svg', "Caixas pluriel");
assert.strictEqual(getInstrumentIconPath('Tarol'), '/icones/caixa.svg', "Tarol");
assert.strictEqual(getInstrumentIconPath('Sementes'), '/icones/agbe.svg', "Sementes");
assert.strictEqual(getInstrumentIconPath('Agbê'), '/icones/agbe.svg', "Agbê");
assert.strictEqual(getInstrumentIconPath('Gonguê'), '/icones/gongue.svg', "Gonguê");
assert.strictEqual(getInstrumentIconPath('Danse'), '/icones/danse.svg', "Danse");
assert.strictEqual(getInstrumentIconPath('Chant'), '/icones/micro.svg', "Chant");
assert.strictEqual(getInstrumentIconPath('Mineiro'), '/icones/mineiro.svg', "Mineiro");
assert.strictEqual(getInstrumentIconPath('Timbal'), '/icones/timbal.svg', "Timbal");
assert.strictEqual(getInstrumentIconPath('Apito'), '/icones/apito.svg', "Apito");
console.log("  ✅ [PASS] Tous les autres pupitres résolvent vers leurs pictogrammes Cordel respectifs");

console.log("\n▶️ Test 3 : Cas limites et valeurs nulles");
assert.strictEqual(getInstrumentIconPath(null), '/favicon.svg', "null retourne favicon");
assert.strictEqual(getInstrumentIconPath(''), '/favicon.svg', "vide retourne favicon");
assert.strictEqual(getInstrumentIconPath('InconnuX'), '/favicon.svg', "inconnu retourne favicon");
console.log("  ✅ [PASS] Cas limites robustes");

console.log("\n========================================================================");
console.log("🏆 SUCCÈS TOTAL : LE SYSTÈME D'ICÔNES EST 100% OPÉRATIONNEL !");
console.log("========================================================================");
