/**
 * Test unitaire : Gestion du Puxador (gras) et Chœur (normal) sur la même ligne dans les Toadas
 * Vérifie que parseLyricsString découpe correctement les lignes mixtes sans forcer tout en gras.
 */
import assert from 'node:assert';
import { parseLyricsString } from '../src/utils/lyricsParser.js';

console.log('🧪 Test: Découpage Puxador / Chœur sur la même ligne (Toadas)...');

// 1. Test d'une ligne mixte où seul le premier mot ou la première phrase est en gras
const mixedHtml = '<p><strong>Ô marinheiro</strong> o barco vai navegar</p>';
const mixedResult = parseLyricsString(mixedHtml);

assert(Array.isArray(mixedResult), 'Le résultat doit être un tableau de blocs');
assert.strictEqual(mixedResult.length, 1, 'Il doit y avoir un seul bloc pour une ligne');

const mixedBlock = mixedResult[0];
assert.strictEqual(mixedBlock.isMixed, true, 'Le bloc doit être marqué isMixed = true');
assert.strictEqual(mixedBlock.puxador, 'Ô marinheiro', 'Le puxador doit correspondre au texte en gras');
assert.strictEqual(mixedBlock.coro, 'o barco vai navegar', 'Le coro doit correspondre au texte non gras');
assert.strictEqual(mixedBlock.segments.length, 2, 'Il doit y avoir 2 segments');
assert.strictEqual(mixedBlock.segments[0].text, 'Ô marinheiro');
assert.strictEqual(mixedBlock.segments[0].isBold, true);
assert.strictEqual(mixedBlock.segments[1].text, ' o barco vai navegar');
assert.strictEqual(mixedBlock.segments[1].isBold, false);
console.log('✅ Cas 1 réussi : Ligne mixte Puxador + Coro correctement identifiée sans gras global.');

// 2. Test d'une strophe complète alternant solo, choeur, et ligne mixte
const toadaComplete = `
<p><strong>Ô marinheiro</strong></p>
<p>o barco vai navegar</p>
<p><strong>Vem cá,</strong> vem ver o mar balançar</p>
<p><br></p>
<p><strong>Viva a Rainha do Mar!</strong></p>
`;
const toadaResult = parseLyricsString(toadaComplete);

assert(Array.isArray(toadaResult), 'Doit retourner un tableau');
assert.strictEqual(toadaResult[0].puxador, 'Ô marinheiro', 'Ligne 1 : Puxador pur');
assert.strictEqual(toadaResult[0].isMixed, undefined, 'Ligne 1 : Pas mixte');
assert.strictEqual(toadaResult[1].coro, 'o barco vai navegar', 'Ligne 2 : Coro pur');
assert.strictEqual(toadaResult[2].isMixed, true, 'Ligne 3 : Mixte Puxador + Coro');
assert.strictEqual(toadaResult[2].puxador, 'Vem cá,', 'Ligne 3 : Puxador isolé');
assert.strictEqual(toadaResult[2].coro, 'vem ver o mar balançar', 'Ligne 3 : Coro isolé');
console.log('✅ Cas 2 réussi : Strophe complète avec mixité, lignes pures et saut de ligne.');

// 3. Test sans aucun gras (doit retourner la chaîne brute sans forcer de conversion)
const plainHtml = '<p>Texte simple sans aucun puxador en gras</p>';
const plainResult = parseLyricsString(plainHtml);
assert.strictEqual(plainResult, plainHtml, 'Doit préserver la chaîne originale si aucun mot en gras');
console.log('✅ Cas 3 réussi : Fallback texte simple respecté si aucun gras.');

// 4. Test avec balises <b> au lieu de <strong>
const bTagHtml = '<p><b>Soliste :</b> réponse du chœur</p>';
const bTagResult = parseLyricsString(bTagHtml);
assert.strictEqual(bTagResult[0].isMixed, true);
assert.strictEqual(bTagResult[0].puxador, 'Soliste :');
assert.strictEqual(bTagResult[0].coro, 'réponse du chœur');
console.log('✅ Cas 4 réussi : Support des balises <b>.');

console.log('🎉 TOUS LES TESTS DE PARSING LYRICS ONT RÉUSSI !');
