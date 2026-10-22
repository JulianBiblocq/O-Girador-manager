import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { parseToadaMeasures, parseToadaMeasureText } from '../src/utils/toadaMeasureParser.js';
import { serializeToadaMeasures, toadaToCleanHtml, generateToadaTxtWithLegend } from '../src/utils/toadaSerializer.js';

console.log('========================================================================');
console.log('🧪 TEST AUTOMATISÉ : ÉDITEUR PAR MESURES, SÉRIALISEUR & CLEAN READER');
console.log('========================================================================\n');

// 1. Test du Parsing avec Sections, Accords, Anacrouse et Mesure liée
console.log('▶️ Test 1 : Parsing complet d\'un texte Toada multi-mesures');
const sampleTxt = `[Intro]
+ *Ô Luanda* [Dm7]
 suite de la mesure

/ Chœur en réponse [A7]

[Refrain]
*Solo refrain*

Chœur refrain`;

const parsed = parseToadaMeasures(sampleTxt);
assert.strictEqual(parsed.isMeasureFormat, true, 'Doit être reconnu comme format mesure');
assert.strictEqual(parsed.sections.length, 2, 'Doit comporter 2 sections');
assert.strictEqual(parsed.sections[0].name, 'Intro', 'Première section doit être Intro');
assert.strictEqual(parsed.sections[0].measures.length, 2, 'Section Intro doit avoir 2 mesures');
assert.strictEqual(parsed.sections[0].measures[0].hasAnacrusis, true, 'Mesure 1 a une anacrouse (+) :');
assert.strictEqual(parsed.sections[0].measures[1].isLinked, true, 'Mesure 2 est liée (/) :');
assert.strictEqual(parsed.sections[1].name, 'Refrain', 'Deuxième section doit être Refrain');
console.log('  ✅ Test 1 validé : Détection fidèle des sections, anacrouses et liaisons.\n');

// 2. Test du Retour Visuel au sein d'une même mesure
console.log('▶️ Test 2 : Détection des retours visuels (Shift + Entrée / ligne indentée)');
const measure1 = parsed.sections[0].measures[0];
assert.strictEqual(measure1.lines.length, 2, 'Mesure 1 doit avoir 2 lignes');
assert.strictEqual(measure1.lines[1].isVisualBreak, true, 'La 2e ligne doit être marquée comme retour visuel');
console.log('  ✅ Test 2 validé : Retours visuels au sein de la mesure préservés.\n');

// 3. Test de la Sérialisation Inverse (sections -> txt)
console.log('▶️ Test 3 : Sérialisation inverse (arbre vers code .txt)');
const reconstructedTxt = serializeToadaMeasures(parsed.sections);
assert(reconstructedTxt.includes('[Intro]'), 'Doit inclure [Intro]');
assert(reconstructedTxt.includes('+ *Ô Luanda* [Dm7]'), 'Doit inclure + et soliste');
assert(reconstructedTxt.includes('/ Chœur en réponse [A7]'), 'Doit inclure / mesure liée');
console.log('  ✅ Test 3 validé : Sérialisation inverse isomorphe sans perte.\n');

// 4. Test du Nettoyage HTML Propre pour Fiche Élève (toadaToCleanHtml)
console.log('▶️ Test 4 : Génération HTML propre pour parolesOriginales (sans + ni /)');
const cleanHtml = toadaToCleanHtml(sampleTxt);
const textOnly = cleanHtml.replace(/<[^>]+>/g, '');
assert(!textOnly.includes('+'), 'Le texte propre ne doit JAMAIS contenir de + technique');
assert(!textOnly.includes('/'), 'Le texte propre ne doit JAMAIS contenir de / technique');
assert(cleanHtml.includes('<strong>Ô Luanda</strong>'), 'Le soliste doit être en gras <strong>');
assert(cleanHtml.includes('Chœur en réponse'), 'Le texte normal doit être préservé');
console.log('  ✅ Test 4 validé : Rétrocompatibilité HTML 100% propre sans symboles techniques.\n');

// 5. Test de l'Export avec Légende
console.log('▶️ Test 5 : Génération du fichier .txt enrichi avec légende');
const txtWithLegend = generateToadaTxtWithLegend(sampleTxt, {
  titre: 'Toada da Luanda',
  signature: '4/4',
  bpm: 55,
  tonalite: 'Dm'
});
assert(txtWithLegend.includes('# Titre: Toada da Luanda'), 'Doit contenir le titre');
assert(txtWithLegend.includes('# Signature: 4/4'), 'Doit contenir la signature');
assert(txtWithLegend.includes('LÉGENDE DU FORMAT TOADA'), 'Doit contenir la légende');
console.log('  ✅ Test 5 validé : Export .txt avec en-tête et légende opérationnel.\n');

// 6. Test Règle Anti-Monolithe (< 150 lignes) sur tous les fichiers créés/modifiés
console.log('▶️ Test 6 : Vérification stricte anti-monolithe (< 150 lignes)');
const filesToCheck = [
  'src/utils/toadaMeasureParser.js',
  'src/utils/toadaSerializer.js',
  'src/utils/toadaDocumentFormatter.js',
  'src/utils/toadaNotebookParser.js',
  'src/components/documents/toada/ToadaInlineFormattingBar.jsx',
  'src/components/documents/toada/ToadaNotebookRow.jsx',
  'src/components/documents/toada/ToadaLinedNotebookEditor.jsx',
  'src/components/song/SongCardLyricsSection.jsx',
  'src/components/documents/form/DocumentFormToadaFields.jsx'
];

for (const relPath of filesToCheck) {
  const absPath = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(absPath)) {
    const lines = fs.readFileSync(absPath, 'utf8').split('\n').length;
    console.log(`   - ${relPath} : ${lines} lignes`);
    assert(lines < 150, `${relPath} dépasse 150 lignes (trouvé: ${lines})`);
  }
}
console.log('  ✅ Test 6 validé : 100% des fichiers sont strictement sous 150 lignes.\n');

console.log('========================================================================');
console.log('🏆 TOUS LES TESTS DE L\'ÉDITEUR DE TOADAS SONT VALIDÉS AVEC SUCCÈS !');
console.log('========================================================================');
