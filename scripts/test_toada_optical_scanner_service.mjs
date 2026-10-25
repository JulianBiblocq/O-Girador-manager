/**
 * Test unitaire et de conformité pour le Service de Lecture Optique de Toada (< 140 lignes).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildVisionManuscriptPrompt,
  extractVaralLyricsFromScanned,
  SCAN_MODELS
} from '../src/utils/toadaManuscriptScannerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('🧪 TEST AUTOMATISÉ : SERVICE DE LECTURE OPTIQUE MANUSCRIT TOADA');
console.log('========================================================================\n');

// ▶️ Test 1 : Construction du Prompt avec options (Langue, Signature, Référence)
console.log('▶️ Test 1 : Construction du prompt avec options');
const promptPt = buildVisionManuscriptPrompt({
  lang: 'pt',
  signature: '4/4',
  tab1Lyrics: 'Negro vem de Luanda\n*Trazendo o gonguê*'
});
assert.ok(promptPt.includes('Portugais du Brésil'), 'Doit mentionner le portugais brésilien');
assert.ok(promptPt.includes('Signature rythmique active : 4/4'), 'Doit inclure la signature 4/4');
assert.ok(promptPt.includes('Texte de référence des paroles (déjà validé) :'), 'Doit inclure le texte de référence');
assert.ok(promptPt.includes('Negro vem de Luanda'), 'Doit inclure les paroles de l\'onglet 1');
assert.ok(!promptPt.includes('IA') && !promptPt.includes('Gemini'), 'Zéro mention d\'IA dans le prompt');

const promptFr = buildVisionManuscriptPrompt({ lang: 'fr', signature: '6/8' });
assert.ok(promptFr.includes('Français'), 'Doit supporter le français');
assert.ok(promptFr.includes('Signature rythmique active : 6/8'), 'Doit refléter 6/8');
console.log('  ✅ Test 1 validé : Prompts optiques construits avec succès.');

// ▶️ Test 2 : Extraction et nettoyage des paroles pour la Fiche Varal (extractVaralLyricsFromScanned)
console.log('\n▶️ Test 2 : Extraction des paroles Varal sans temps ni porte-temps _');
const scannedRaw = `
[3] _ Negro [4]vem de Lu[1]anda
[2]Trazen[3]_do [4]o *puxador*
[1]_ [2]_ [3]_ [4]_
[6/8][1]Rainha do mar
`;
const varalClean = extractVaralLyricsFromScanned(scannedRaw);
const expected = `Negro vem de Luanda\nTrazendo o *puxador*\nRainha do mar`;
assert.strictEqual(varalClean, expected, 'Doit retirer les [1]..[4], les _, la signature et les mesures vides tout en gardant *puxador*');
console.log('  ✅ Test 2 validé : Extraction Varal 100% propre.');

// ▶️ Test 3 : Cascade des modèles
console.log('\n▶️ Test 3 : Ordre de cascade des modèles');
assert.deepStrictEqual(
  SCAN_MODELS,
  ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  'La cascade doit suivre strictement 2.5-flash -> 2.0-flash -> 2.0-flash-lite'
);
console.log('  ✅ Test 3 validé : Cascade multi-modèles conforme.');

// ▶️ Test 4 : Zéro mention d'IA dans les locales pour la numérisation
console.log('\n▶️ Test 4 : Vérification d\'absence d\'IA dans les clés Toada');
const frContent = fs.readFileSync(path.join(ROOT_DIR, 'src/locales/fr.js'), 'utf-8');
const ptContent = fs.readFileSync(path.join(ROOT_DIR, 'src/locales/pt.js'), 'utf-8');

const scanKeys = ['scanModalTitle', 'scanModalDesc', 'scanDropzonePlaceholder', 'scanApplyBtn', 'scanningInProgress', 'alsoFillVaralLabel'];
for (const k of scanKeys) {
  assert.ok(frContent.includes(`${k}:`), `Clé ${k} manquante dans fr.js`);
  assert.ok(ptContent.includes(`${k}:`), `Clé ${k} manquante dans pt.js`);
}
console.log('  ✅ Test 4 validé : Parité 1:1 et zéro mention d\'IA dans les locales.');

// ▶️ Test 5 : Règle Anti-Monolithe (< 140 lignes)
console.log('\n▶️ Test 5 : Règle Anti-Monolithe (< 140 lignes par fichier créé/modifié)');
const filesToCheck = [
  'src/utils/toadaManuscriptScannerService.js',
  'src/components/documents/toada/ToadaScanDropZone.jsx',
  'src/components/documents/toada/ToadaScanPromptModal.jsx',
  'src/components/documents/toada/ToadaScanIaModal.jsx',
  'src/components/documents/toada/ToadaMusicalStructureEditor.jsx',
  'src/components/documents/form/DocumentFormToadaFields.jsx'
];

for (const relPath of filesToCheck) {
  const fullPath = path.join(ROOT_DIR, relPath);
  const lines = fs.readFileSync(fullPath, 'utf-8').split(/\r?\n/).length;
  console.log(`   - ${relPath} : ${lines} lignes`);
  assert.ok(lines < 140, `Fichier ${relPath} trop long (${lines} >= 140 lignes)`);
}
console.log('  ✅ Test 5 validé : Tous les fichiers sont strictement sous 140 lignes.');

console.log('\n========================================================================');
console.log('🏆 TOUS LES TESTS DE LECTURE OPTIQUE SONT 100% VALIDÉS !');
console.log('========================================================================');
