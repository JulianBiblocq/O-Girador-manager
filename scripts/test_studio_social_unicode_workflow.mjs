import assert from 'assert';
import fs from 'fs';
import { 
  toUnicodeBold, 
  toUnicodeItalic, 
  applyUnicodeTransformation, 
  insertTextAtCursor 
} from '../src/utils/unicodeUtils.js';

console.log('🧪 Début des tests fonctionnels : Studio Social & Unicode & Validation Workflow...\n');

// Test 1 : Mathematical Bold conversion
console.log('--- Test 1 : Conversion Unicode Mathematical Bold ---');
const textPlain = 'O-Girador 2026!';
const textBold = toUnicodeBold(textPlain);
console.log(`Original : "${textPlain}" -> Bold : "${textBold}"`);
// Vérifier la présence des glyphes Math Bold
assert(textBold.includes('𝐎'), 'Majuscule O doit être convertie en 𝐎');
assert(textBold.includes('𝐆'), 'Majuscule G doit être convertie en 𝐆');
assert(textBold.includes('𝐢'), 'Minuscule i doit être convertie en 𝐢');
assert(textBold.includes('𝟐𝟎𝟐𝟔'), 'Chiffres 2026 doivent être convertis en 𝟐𝟎𝟐𝟔');
assert(textBold.includes('!'), 'Les signes de ponctuation doivent rester intacts');
console.log('✅ Test 1 validé : Math Bold converti avec succès.');

// Test 2 : Mathematical Italic conversion
console.log('\n--- Test 2 : Conversion Unicode Mathematical Italic ---');
const italicInput = 'Show Maracatu';
const textItalic = toUnicodeItalic(italicInput);
console.log(`Original : "${italicInput}" -> Italic : "${textItalic}"`);
assert(textItalic.includes('𝑆'), 'Majuscule S doit être convertie en 𝑆');
assert(textItalic.includes('ℎ'), 'Minuscule h doit être convertie en ℎ (U+210E)');
assert(textItalic.includes('𝑎'), 'Minuscule a doit être convertie en 𝑎');
console.log('✅ Test 2 validé : Math Italic converti avec succès (y compris exception h).');

// Test 3 : Transformation sur tranche de sélection
console.log('\n--- Test 3 : Transformation ciblée par sélection ---');
const basePhrase = 'Venez au concert le 15 juin !';
// Sélectionner "concert" (index 9 à 16)
const startIdx = 9;
const endIdx = 16;
const boldTransform = applyUnicodeTransformation(basePhrase, startIdx, endIdx, 'bold');
console.log(`Avant : "${basePhrase}"`);
console.log(`Après gras ciblé : "${boldTransform.newText}"`);
assert(boldTransform.applied === true, 'applied doit être vrai');
assert(boldTransform.newText.startsWith('Venez au '), 'Le début de chaîne ne doit pas être modifié');
assert(boldTransform.newText.endsWith(' le 15 juin !'), 'La fin de chaîne ne doit pas être modifiée');
assert(boldTransform.newText.includes('𝐜𝐨𝐧𝐜𝐞𝐫𝐭'), 'Le mot concert doit être en gras Unicode');
console.log('✅ Test 3 validé : Transformation de sélection partielle opérationnelle.');

// Test 4 : Insertion d'émoticône à la position du curseur
console.log('\n--- Test 4 : Insertion d\'émoticône au curseur ---');
const cursorTest = insertTextAtCursor('Rendez-vous : place centrale', 14, 14, '📍 ');
console.log(`Résultat : "${cursorTest.newText}" (Nouveau curseur : ${cursorTest.newCursorPos})`);
assert(cursorTest.newText === 'Rendez-vous : 📍 place centrale', 'L\'émoticône doit être insérée à la position exacte');
assert(cursorTest.newCursorPos === 17, 'Le curseur doit avancer de la longueur de l\'insertion');
console.log('✅ Test 4 validé : Insertion curseur conforme.');

// Test 5 : Vérification de la robustesse du ciblage de salon
console.log('\n--- Test 5 : Algorithme de sélection robuste de salon ---');
function resolveTargetChannel(channelsList, groupId) {
  const validationChan = channelsList.find(c => {
    const n = (c.name || '').toLowerCase();
    return n === 'validation comm' || n === 'validation' || n.includes('validation');
  });

  const bureauCaChan = channelsList.find(c => {
    const n = (c.name || '').toLowerCase();
    return n === 'bureau' || n === 'ca';
  });

  const privateChan = channelsList.find(c => {
    return Array.isArray(c.readRoles) && !c.readRoles.includes('all') && c.readRoles.length > 0;
  });

  const generalChan = channelsList.find(c => {
    const n = (c.name || '').toLowerCase();
    return n === 'général' || n === 'general';
  });

  const fallbackChan = channelsList[0];

  return validationChan?.id || bureauCaChan?.id || privateChan?.id || generalChan?.id || fallbackChan?.id || `${groupId}_bureau`;
}

// Cas A : Salon "Validation Comm" présent
const channelsCaseA = [{ id: 'ch_gen', name: 'Général' }, { id: 'ch_val', name: 'Validation Comm' }];
assert.strictEqual(resolveTargetChannel(channelsCaseA, 'grp1'), 'ch_val', 'Doit privilégier Validation Comm');

// Cas B : Salons standards CA et Bureau
const channelsCaseB = [{ id: 'ch_gen', name: 'Général' }, { id: 'ch_ca', name: 'CA' }];
assert.strictEqual(resolveTargetChannel(channelsCaseB, 'grp1'), 'ch_ca', 'Doit basculer sur CA si pas de Validation');

// Cas C : Aucun salon nommé, uniquement un salon restreint
const channelsCaseC = [{ id: 'ch_priv', name: 'Projets Secrets', readRoles: ['mestre'] }];
assert.strictEqual(resolveTargetChannel(channelsCaseC, 'grp1'), 'ch_priv', 'Doit basculer sur salon restreint');

// Cas D : Liste vide
assert.strictEqual(resolveTargetChannel([], 'grp1'), 'grp1_bureau', 'Doit replier sans erreur sur default bureau');
console.log('✅ Test 5 validé : Ciblage de salon robuste et non bloquant.');

// Test 6 : Vérification de la configuration des règles Firestore
console.log('\n--- Test 6 : Contrôle de syntaxe et règles Firestore ---');
const rulesFile = ['ogirador-backend/firestore.rules.DEPRECATED', 'ogirador-backend/firestore.rules', '../o-girador-orquestrador/firestore.rules'].find(p => fs.existsSync(p));
  const firestoreRules = fs.readFileSync(rulesFile, 'utf8');
assert(firestoreRules.includes('statutPublication'), 'Les règles doivent référencer statutPublication');
assert(firestoreRules.includes('publicationTexte'), 'Les règles doivent référencer publicationTexte');
assert(firestoreRules.includes("request.resource.data.statutPublication == 'en_attente'"), 'La soumission doit être limitée au statut en_attente pour les membres standard');
assert(firestoreRules.includes('validationData'), 'Les règles du forum doivent autoriser validationData');
console.log('✅ Test 6 validé : Règles de sécurité Firestore conformes aux spécifications.');

console.log('\n🎉 TOUS LES TESTS FONCTIONNELS SONT VALIDES AVEC SUCCÈS !');
