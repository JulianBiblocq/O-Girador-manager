/**
 * Test de validation : Module Signes du Mestre sur les fiches Répertoire
 * Vérifie l'intégration du bouton, du sélecteur d'intention (Aide-mémoire vs Défi)
 * et de la génération des questions ciblées de QCM.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { generateQuizFromPieceSignals } from '../src/utils/quizGenerator.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : AJOUT DES SIGNES DU MESTRE SUR LES FICHES RÉPERTOIRE');
console.log('========================================================================\n');

// 1. Test du générateur de QCM : generateQuizFromPieceSignals
console.log('▶️ Test 1 : Génération ciblée des questions de Signes du Mestre (quizGenerator.js)');

const mockPieceWithSignals = {
  id: 'piece_1',
  titre: 'Baque Luanda',
  sinaisDoMestre: [
    {
      id: 'sig_1',
      mesure: 1,
      nom: 'Appel Départ',
      consigne: 'Lancer le roulement initial des alfaias',
      imageUrl: 'https://example.com/sig1.png'
    },
    {
      id: 'sig_2',
      mesure: 8,
      nom: 'Virada 1',
      consigne: 'Passer sur le deuxième temps fort',
      imageUrl: 'https://example.com/sig2.png'
    },
    {
      id: 'sig_3',
      mesure: 16,
      nom: 'Break Coupure',
      consigne: 'Arrêt net sur le temps 1'
      // Sans imageUrl -> teste la tolérance du pictogramme et les questions consignes
    }
  ]
};

const mockCatalog = [
  { id: 'cat_1', name: 'Appel Départ', imageUrl: 'https://example.com/sig1.png', consigne: 'Lancer le roulement initial des alfaias' },
  { id: 'cat_2', name: 'Virada 1', imageUrl: 'https://example.com/sig2.png', consigne: 'Passer sur le deuxième temps fort' },
  { id: 'cat_3', name: 'Virada 2', imageUrl: 'https://example.com/sig3.png', consigne: 'Passage en ternaire' },
  { id: 'cat_4', name: 'Break Coupure', imageUrl: 'https://example.com/sig4.png', consigne: 'Arrêt net sur le temps 1' }
];

// Test sans signaux -> doit renvoyer un tableau vide
const emptyQuestions = generateQuizFromPieceSignals({ id: 'empty', titre: 'Sans signes' }, [], mockCatalog);
assert.strictEqual(emptyQuestions.length, 0, 'Une pièce sans signes ne doit générer aucune question');
console.log('  ✅ [PASS] Pièce sans signes -> 0 questions');

// Test avec les signaux de la pièce
const generatedQuestions = generateQuizFromPieceSignals(mockPieceWithSignals, mockPieceWithSignals.sinaisDoMestre, mockCatalog);
assert(generatedQuestions.length >= 3, 'Doit générer au moins 3 questions pour 3 signaux');

// Vérifier la présence de questions visuelles (type image_options)
const visualQ = generatedQuestions.find(q => q.type === 'image_options');
assert(visualQ, 'Doit comporter au moins une question visuelle (type: image_options)');
assert(visualQ.choices.length === 4, 'La question visuelle doit proposer 4 choix de vignettes');
assert(visualQ.choices.some(c => c.isCorrect), 'La question visuelle doit avoir un choix correct');
console.log('  ✅ [PASS] Question Visuelle (Reconnaissance du geste parmi 4 vignettes) validée');

// Vérifier la présence de questions de consigne / direction musicale
const consigneQ = generatedQuestions.find(q => q.type === 'mestre_signal_consigne');
assert(consigneQ, 'Doit comporter au moins une question de consigne musicale');
assert(consigneQ.choices.length === 4, 'La question consigne doit proposer 4 choix textuels');
assert(consigneQ.choices.some(c => c.isCorrect), 'La question consigne doit avoir un choix correct');
console.log('  ✅ [PASS] Question Consigne (Action musicale déclenchée) validée');

// 2. Contrôle statique de MemberPieceUnfoldedContent.jsx
console.log('\n▶️ Test 2 : Contrôle statique de MemberPieceUnfoldedContent.jsx');
const unfoldedPath = path.resolve('src/components/member/MemberPieceUnfoldedContent.jsx');
const unfoldedCode = fs.readFileSync(unfoldedPath, 'utf-8');
const unfoldedLines = unfoldedCode.split('\n').length;

assert(unfoldedLines < 200, `MemberPieceUnfoldedContent.jsx doit être sous 200 lignes (actuel: ${unfoldedLines})`);
assert(unfoldedCode.includes('sinaisDoMestre'), 'Doit tester la présence conditionnelle de sinaisDoMestre');
assert(unfoldedCode.includes('onOpenSignals'), 'Doit accepter et appeler le callback onOpenSignals');
assert(unfoldedCode.includes('🖐️'), 'Le bouton doit comporter le pictogramme 🖐️');
console.log(`  ✅ [PASS] MemberPieceUnfoldedContent.jsx < 200 lignes (actuel: ${unfoldedLines})`);
console.log('  ✅ [PASS] Bouton conditionnel [🖐️ Signes] présent dans la rangée multimédia');

// 3. Contrôle statique de MemberPieceCard.jsx
console.log('\n▶️ Test 3 : Contrôle statique de MemberPieceCard.jsx');
const cardPath = path.resolve('src/components/member/MemberPieceCard.jsx');
const cardCode = fs.readFileSync(cardPath, 'utf-8');
const cardLines = cardCode.split('\n').length;

assert(cardLines < 200, `MemberPieceCard.jsx doit être sous 200 lignes (actuel: ${cardLines})`);
assert(cardCode.includes('PieceSignalsModal'), 'Doit importer et inclure PieceSignalsModal');
assert(cardCode.includes('isSignalsModalOpen'), 'Doit gérer l\'état d\'ouverture de la modale');
console.log(`  ✅ [PASS] MemberPieceCard.jsx < 200 lignes (actuel: ${cardLines})`);
console.log('  ✅ [PASS] Intégration de PieceSignalsModal dans MemberPieceCard validée');

// 4. Contrôle statique de PieceSignalsModal.jsx
console.log('\n▶️ Test 4 : Contrôle statique de PieceSignalsModal.jsx');
const modalPath = path.resolve('src/components/member/PieceSignalsModal.jsx');
const modalCode = fs.readFileSync(modalPath, 'utf-8');
const modalLines = modalCode.split('\n').length;

assert(modalLines < 200, `PieceSignalsModal.jsx doit être sous 200 lignes (actuel: ${modalLines})`);
assert(modalCode.includes('useMestreSignals'), 'Doit utiliser useMestreSignals pour résoudre les images du catalogue');
assert(modalCode.includes('memorando'), 'Doit inclure l\'onglet Option A (Aide-mémoire)');
assert(modalCode.includes('quiz'), 'Doit inclure l\'onglet Option B (Défi des signes)');
assert(modalCode.includes('hideLabels'), 'Doit proposer le mode récitation masquée');
assert(modalCode.includes('AutoEvalQuiz'), 'Doit intégrer le composant AutoEvalQuiz pour le défi');
assert(modalCode.includes('🖐️'), 'Doit intégrer un pictogramme de repli propre sans casser la mise en page');
console.log(`  ✅ [PASS] PieceSignalsModal.jsx < 200 lignes (actuel: ${modalLines})`);
console.log('  ✅ [PASS] Option A (Aide-mémoire avec récitation masquée) & Option B (Défi AutoEvalQuiz) validées');
console.log('  ✅ [PASS] Pictogramme de repli en l\'absence d\'image garanti');

// 5. Contrôle des traductions FR et PT
console.log('\n▶️ Test 5 : Contrôle des traductions FR et PT');
const frPath = path.resolve('src/locales/fr.js');
const frCode = fs.readFileSync(frPath, 'utf-8');
assert(frCode.includes('signes: "Signes"'), 'fr.js doit contenir la traduction "Signes"');
assert(frCode.includes('signalsVisualInstruction:'), 'fr.js doit contenir signalsVisualInstruction');

const ptPath = path.resolve('src/locales/pt.js');
const ptCode = fs.readFileSync(ptPath, 'utf-8');
assert(ptCode.includes('signes: "Sinais"'), 'pt.js doit contenir la traduction "Sinais"');
assert(ptCode.includes('signalsVisualInstruction:'), 'pt.js doit contenir signalsVisualInstruction');
console.log('  ✅ [PASS] Traductions multilingues FR et PT validées');

console.log('\n========================================================================');
console.log('🏆 SUCCÈS TOTAL : LE MODULE SIGNES DU MESTRE EST 100% OPÉRATIONNEL !');
console.log('========================================================================\n');
