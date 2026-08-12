import { generateTranslationQuiz } from './src/utils/translationQuizEngine.js';

console.log("=== GÉNÉRATION D'UN QUIZ DE TRADUCTION DE TEST (5 questions) ===");
try {
  const quiz = generateTranslationQuiz({ count: 5, direction: 'MIXED' });
  console.dir(quiz, { depth: null });
  console.log("=== SUCCÈS ===");
} catch (e) {
  console.error("Erreur :", e);
}
