import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { cleanHistoricalHtml } from '../src/utils/toadaHtmlCleaner.js';
import {
  isAnchorOnlyLine,
  convertTwoLineToBrackets,
  convertBracketsToTwoLine,
  parseStructureTxt,
  exportStructureAsTxt,
  groupLyricsByRole
} from '../src/utils/toadaTwoLineConverter.js';
import {
  parseLineToCharAnchors,
  rebuildLineFromCharAnchors,
  computeLineMeasureNumbers,
  computePhraseMeasures,
  generateEmptySilenceMeasure,
  isSilenceMeasure
} from '../src/utils/toadaLineEditorHelper.js';

console.log('========================================================================');
console.log('🧪 TEST AUTOMATISÉ : STRUCTURE MUSICALE, FORMAT 2 LIGNES & LOCALES');
console.log('========================================================================\n');

// 1. Test Nettoyage HTML Historique (<p>, <br>, <strong>)
console.log('▶️ Test 1 : Nettoyage automatique des balises HTML historiques');
const rawHtml = '<p><strong>Vovó falou</strong><br>e\'o barão assinou</p>';
const cleaned = cleanHistoricalHtml(rawHtml);
assert.strictEqual(cleaned, "*Vovó falou*\ne'o barão assinou", `Doit convertir en markdown propre (obtenu: ${cleaned})`);
assert(!cleaned.includes('<p>'), 'Ne doit pas contenir de balise <p>');
assert(!cleaned.includes('<br>'), 'Ne doit pas contenir de balise <br>');
console.log('  ✅ Test 1 validé : Nettoyage HTML 100% réussi.\n');

// 2. Test Conversion Format 2 Lignes -> Crochets [b]
console.log('▶️ Test 2 : Conversion Format 2 lignes manuscrit vers crochets');
const anchorLine = '1  2          3   4     1';
const lyricsLine = '   Vovó falou e\'o barão assinou';
const bracketed = convertTwoLineToBrackets(anchorLine, lyricsLine);
assert.strictEqual(bracketed, "[1] _ [2]Vovó falou [3]e'o [4]barão [1]assinou", `Attendu crochets avec silence [1] _ (obtenu: ${bracketed})`);
console.log('  ✅ Test 2 validé : Conversion 2 lignes vers crochets conforme.\n');

// 3. Test Conversion Inverse Crochets [b] -> Format 2 Lignes
console.log('▶️ Test 3 : Conversion inverse crochets vers 2 lignes');
const twoLineBack = convertBracketsToTwoLine("[1] _ [2]Vovó falou [3]e'o [4]barão [1]assinou");
assert(twoLineBack.includes('1'), 'Ligne du haut doit contenir 1');
assert(twoLineBack.includes('2'), 'Ligne du haut doit contenir 2');
assert(twoLineBack.includes('Vovó'), 'Ligne du bas doit contenir Vovó');
console.log('  ✅ Test 3 validé : Rétro-conversion 2 lignes opérationnelle.\n');

// 4. Test Extraction et Reconstruction des Pastilles Temporelles
console.log('▶️ Test 4 : Extraction et reconstruction des pastilles temporelles (parseLineToCharAnchors)');
const line = "*[1] _ [2]Vovó falou [3]e'o [4]barão [1]assinou*";
const parsedLine = parseLineToCharAnchors(line);
assert.strictEqual(parsedLine.isPuxador, true, 'Doit détecter le soliste');
assert.strictEqual(parsedLine.hasLeadingRest, true, 'Doit détecter le silence initial');
assert.strictEqual(parsedLine.leadingRestBeat, 1, 'Silence initial sur temps 1');
assert.strictEqual(parsedLine.charAnchors[0], 2, 'Temps 2 sur le premier caractère (V)');

const rebuilt = rebuildLineFromCharAnchors(
  parsedLine.rawCleanChars,
  parsedLine.charAnchors,
  parsedLine.hasLeadingRest,
  parsedLine.leadingRestBeat,
  parsedLine.isPuxador
);
assert.strictEqual(rebuilt, "*[1] _ [2]Vovó falou [3]e'o [4]barão [1]assinou*", `Reconstruction fidèle attendue (obtenu: ${rebuilt})`);

// 4b. Test symbole _ comme support de temps (entre syllabes, entre mots, en fin de ligne, et mesure de silence)
const underWordLine = "[1]Tra_[2]zen";
const parsedUnderWord = parseLineToCharAnchors(underWordLine);
assert.strictEqual(parsedUnderWord.rawCleanChars, "Tra_zen", "Doit conserver le caractère _ comme support");
const rebuiltUnderWord = rebuildLineFromCharAnchors(parsedUnderWord.rawCleanChars, parsedUnderWord.charAnchors, false, null, false);
assert.strictEqual(rebuiltUnderWord, "[1]Tra_[2]zen", "Doit reconstruire fidèlement [1]Tra_[2]zen");

const silenceLine = generateEmptySilenceMeasure('4/4');
assert.strictEqual(silenceLine, "[1] _ [2]_ [3]_ [4]_", "Mesure de silence 4/4 conforme");
assert.strictEqual(isSilenceMeasure(silenceLine), true, "Doit être reconnue comme mesure de silence");
const parsedSilence = parseLineToCharAnchors(silenceLine);
assert.strictEqual(parsedSilence.hasLeadingRest, true, "Silence initial sur temps 1");
assert.strictEqual(parsedSilence.leadingRestBeat, 1, "Temps 1 pour le silence initial");
assert.strictEqual(parsedSilence.rawCleanChars, "_ _ _", "Caractères muets suivants préservés");
const rebuiltSilence = rebuildLineFromCharAnchors(parsedSilence.rawCleanChars, parsedSilence.charAnchors, parsedSilence.hasLeadingRest, parsedSilence.leadingRestBeat, false);
assert.strictEqual(rebuiltSilence, "[1] _ [2]_ [3]_ [4]_", "Reconstruction fidèle de la mesure de silence");

// 4c. Test Compteur de mesures automatique (computeLineMeasureNumbers)
const testLines = [
  "[2]Vovó", // Anacrouse avant le 1er [1]
  "[1] _ [2]Vovó falou [3]e'o [4]barão [1]assinou", // Deux [1] -> M1–M2
  "[2]Vovó falou [3]e'o [4]barão [1]assinou", // Un [1] -> M3
  "[2]Solo intermédiaire sans temps un", // Zéro [1] en milieu de morceau -> —
  "[sig:6/8] [1] _ [2]_ [3]_ [4]_ [5]_ [6]_", // Un [1] avec changement de métrique -> M4
  "[1]Final" // Un [1] -> M5
];
const measureCounts = computeLineMeasureNumbers(testLines);
assert.strictEqual(measureCounts[0].label, 'Ana.', 'Ligne 0 doit être Anacrouse Ana.');
assert.strictEqual(measureCounts[1].label, 'M1–M2', 'Ligne 1 avec deux [1] doit afficher M1–M2');
assert.strictEqual(measureCounts[2].label, 'M3', 'Ligne 2 avec un [1] doit afficher M3');
assert.strictEqual(measureCounts[3].label, '—', 'Ligne 3 sans aucun [1] doit afficher un tiret —');
assert.strictEqual(measureCounts[4].label, 'M4', 'Ligne 4 doit afficher M4');
assert.strictEqual(measureCounts[4].isSilence, true, 'Ligne 4 doit être reconnue comme silence');
assert.strictEqual(measureCounts[5].label, 'M5', 'Ligne 5 doit afficher M5');
console.log('  ✅ Test 4 validé : Extraction, reconstruction, porte-temps _, signatures et compteur M1..M5 exacts.\n');

// 4d. Test groupLyricsByRole & computePhraseMeasures
console.log('▶️ Test 4d : groupLyricsByRole & computePhraseMeasures (De Norte a Sul)');
const tab1Varal = `*Negro vem de Luanda*
*Trazendo o baque virado nação*

Negro vem de Luanda
Trazendo o baque virado nação`;

const grouped = groupLyricsByRole(tab1Varal);
assert.strictEqual(grouped.length, 2, 'Doit générer exactement 2 lignes');
assert.strictEqual(grouped[0], "*Negro vem de Luanda Trazendo o baque virado nação*", 'Ligne 1 = 1 prise Puxador complète');
assert.strictEqual(grouped[1], "Negro vem de Luanda Trazendo o baque virado nação", 'Ligne 2 = 1 prise Coro complète');

const puxMeasures = computePhraseMeasures("*[3] _ Negro [4]vem de Lu[1]anda [2]Trazen[3]_do [4]o baque vi[1]rado nação*");
assert.strictEqual(puxMeasures.isPuxador, true);
assert.strictEqual(puxMeasures.measuresCount, 2);
assert.strictEqual(puxMeasures.hasAnacrusis, true);
assert.strictEqual(puxMeasures.badgeLabel, "Puxador • 2 M + Ana");

const coroMeasures = computePhraseMeasures("[3] _ Negro [4]vem de Lu[1]anda [2]Trazen[3]_do [4]o baque vi[1]rado nação");
assert.strictEqual(coroMeasures.isPuxador, false);
assert.strictEqual(coroMeasures.measuresCount, 2);
assert.strictEqual(coroMeasures.hasAnacrusis, true);
assert.strictEqual(coroMeasures.badgeLabel, "Coro • 2 M + Ana");
console.log('  ✅ Test 4d validé : Regroupement auto par rôle et badges 2 M + Ana conformes.\n');

// 5. Test Parité Stricte 1:1 des Dictionnaires Locales (fr.js et pt.js)
console.log('▶️ Test 5 : Parité 1:1 des nouvelles clés toada dans fr.js et pt.js');
const frContent = fs.readFileSync(path.resolve('src/locales/fr.js'), 'utf8');
const ptContent = fs.readFileSync(path.resolve('src/locales/pt.js'), 'utf8');

const keysToCheck = [
  'scanModalTitle',
  'scanModalDesc',
  'copiedPrompt',
  'copyPrompt',
  'printStyloTitle',
  'printStyloSubtitle',
  'defaultTitle',
  'modeText',
  'modeTime',
  'pullLyricsBtn',
  'importTxtBtn',
  'exportTxtBtn',
  'printStyloBtn',
  'scanHelperBtn',
  'stampLabel',
  'addSilenceBtn'
];

for (const k of keysToCheck) {
  assert(frContent.includes(`${k}:`), `fr.js doit contenir la clé ${k}`);
  assert(ptContent.includes(`${k}:`), `pt.js doit contenir la clé ${k}`);
}
console.log('  ✅ Test 5 validé : 100% des clés en parité stricte 1:1.\n');

// 6. Test Règle Anti-Monolithe (< 140 lignes par nouveau fichier)
console.log('▶️ Test 6 : Règle Anti-Monolithe (< 140 lignes par fichier créé/modifié)');
const filesToCheck = [
  'src/utils/toadaHtmlCleaner.js',
  'src/utils/toadaTwoLineConverter.js',
  'src/utils/toadaLineEditorHelper.js',
  'src/components/documents/toada/ToadaScanPromptModal.jsx',
  'src/components/documents/toada/ToadaPrintStyloView.jsx',
  'src/components/documents/toada/ToadaStampBadgeSelector.jsx',
  'src/components/documents/toada/ToadaMusicalToolbar.jsx',
  'src/components/documents/toada/ToadaMusicalLineRow.jsx',
  'src/components/documents/toada/ToadaMusicalLineHeader.jsx',
  'src/components/documents/toada/ToadaMusicalStructureEditor.jsx',
  'src/components/documents/toada/ToadaLeadingRestCell.jsx',
  'src/components/documents/toada/ToadaCharAnchorCell.jsx',
  'src/components/documents/form/DocumentFormToadaFields.jsx',
  'src/components/documents/form/ToadaChantTabFields.jsx'
];

for (const relPath of filesToCheck) {
  const absPath = path.resolve(relPath);
  assert(fs.existsSync(absPath), `Le fichier ${relPath} doit exister`);
  const lines = fs.readFileSync(absPath, 'utf8').split('\n').length;
  console.log(`   - ${relPath} : ${lines} lignes`);
  assert(lines < 140, `${relPath} dépasse la limite stricte de 140 lignes (${lines})`);
}
console.log('  ✅ Test 6 validé : Tous les fichiers sont strictement sous 140 lignes.\n');

console.log('========================================================================');
console.log('🏆 TOUS LES TESTS ORGANIZADOR SONT 100% VALIDÉS !');
console.log('========================================================================');
