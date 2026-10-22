import assert from 'assert';
import { parseNotebookFromTxt, serializeNotebookToTxt } from '../src/utils/toadaNotebookParser.js';
import { toadaToCleanHtml } from '../src/utils/toadaSerializer.js';

console.log('========================================================================');
console.log('🧪 TEST UNITAIRE : CAHIER LIGNÉ TOADAS & ANACROUSE DIFFÉRENCIÉE');
console.log('========================================================================\n');

// 1. Test Anacrouse Solo seule sur ligne mixte
console.log('▶️ Test 1 : Anacrouse Solo seule sur ligne mixte');
const sampleSolo = '+ *Ô Luanda* viva o mar';
const rows1 = parseNotebookFromTxt(sampleSolo, 'O Louanda viva ou mar');
assert.strictEqual(rows1.length, 1, 'Doit avoir 1 ligne');
assert.strictEqual(rows1[0].hasAnaSolo, true, 'Solo doit avoir anacrouse');
assert.strictEqual(rows1[0].hasAnaCoro, false, 'Chœur ne doit PAS avoir anacrouse');
assert.strictEqual(rows1[0].isLinked, false, 'Pas de liaison');
const res1 = serializeNotebookToTxt(rows1);
assert.strictEqual(res1.rawTxtCode, '+ *Ô Luanda* viva o mar', 'Doit re-sérialiser fidèlement');
console.log('  ✅ Test 1 validé : Anacrouse Solo seule reconnue et re-sérialisée.\n');

// 2. Test Anacrouse Chœur seule sur ligne mixte
console.log('▶️ Test 2 : Anacrouse Chœur seule sur ligne mixte');
const sampleCoro = '*Ô Luanda* + viva o mar';
const rows2 = parseNotebookFromTxt(sampleCoro, 'O Louanda viva ou mar');
assert.strictEqual(rows2[0].hasAnaSolo, false, 'Solo ne doit PAS avoir anacrouse');
assert.strictEqual(rows2[0].hasAnaCoro, true, 'Chœur doit avoir anacrouse');
const res2 = serializeNotebookToTxt(rows2);
assert.strictEqual(res2.rawTxtCode, '*Ô Luanda* + viva o mar', 'Doit re-sérialiser fidèlement avec + devant chœur');
console.log('  ✅ Test 2 validé : Anacrouse Chœur seule reconnue et re-sérialisée.\n');

// 3. Test Anacrouse Solo + Chœur sur la même ligne
console.log('▶️ Test 3 : Anacrouse Solo ET Chœur sur la même ligne');
const sampleBoth = '+ *Ô Luanda* + viva o mar';
const rows3 = parseNotebookFromTxt(sampleBoth, 'O Louanda viva ou mar');
assert.strictEqual(rows3[0].hasAnaSolo, true, 'Solo doit avoir anacrouse');
assert.strictEqual(rows3[0].hasAnaCoro, true, 'Chœur doit avoir anacrouse');
const res3 = serializeNotebookToTxt(rows3);
assert.strictEqual(res3.rawTxtCode, '+ *Ô Luanda* + viva o mar', 'Doit re-sérialiser fidèlement les deux anacrouses');
console.log('  ✅ Test 3 validé : Double anacrouse reconnue et re-sérialisée.\n');

// 4. Test Mesure Liée (/)
console.log('▶️ Test 4 : Mesure liée (/)');
const sampleLinked = '/ Continuação do coro';
const rows4 = parseNotebookFromTxt(sampleLinked, 'Kontinouassan dou korou');
assert.strictEqual(rows4[0].isLinked, true, 'Doit être liée');
const res4 = serializeNotebookToTxt(rows4);
assert.strictEqual(res4.rawTxtCode, '/ Continuação do coro', 'Doit préserver le préfixe /');
console.log('  ✅ Test 4 validé : Mesure liée (/) reconnue et re-sérialisée.\n');

// 5. Test Retours visuels au sein d\'une même mesure (Shift+Entrée)
console.log('▶️ Test 5 : Retours visuels (Shift + Entrée / indentation)');
const sampleMulti = `+ *Primeira linha*
 segunda linha visual`;
const rows5 = parseNotebookFromTxt(sampleMulti);
assert.strictEqual(rows5[0].origText.includes('\n'), true, 'Doit contenir un saut de ligne');
const res5 = serializeNotebookToTxt(rows5);
assert.strictEqual(res5.rawTxtCode, `+ *Primeira linha*
 segunda linha visual`, 'Doit indenter la ligne suivante avec 1 espace');
console.log('  ✅ Test 5 validé : Retours visuels préservés sans créer de nouvelle mesure.\n');

// 6. Test Nettoyage HTML pour Carnet de Chants (aucun + ni / dans parolesOriginales)
console.log('▶️ Test 6 : Nettoyage HTML épuré (parolesOriginales)');
const clean1 = toadaToCleanHtml(sampleBoth);
const cleanTextOnly = clean1.replace(/<[^>]+>/g, '');
assert(!cleanTextOnly.includes('+'), 'Le HTML propre ne doit JAMAIS contenir de +');
assert(!cleanTextOnly.includes('/'), 'Le HTML propre ne doit JAMAIS contenir de /');
assert(clean1.includes('<strong>Ô Luanda</strong> viva o mar'), 'Doit générer <strong>Ô Luanda</strong> viva o mar');
console.log('  ✅ Test 6 validé : HTML pour le Carnet de Chants 100% propre.\n');

console.log('========================================================================');
console.log('🏆 TOUS LES TESTS DU CAHIER LIGNÉ SONT VALIDÉS AVEC SUCCÈS !');
console.log('========================================================================');
