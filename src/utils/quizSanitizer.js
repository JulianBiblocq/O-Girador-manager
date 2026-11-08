/**
 * Module d'Assainissement et de Sécurité Pédagogique des QCM (< 140 lignes).
 * Éradique les fuites de réponses et garantit la validité typographique des questions.
 */

import {
  normalizeNoAccent,
  sanitizeQuizText,
  isValidQuizTerm,
  isValidTranslationPair,
  hasAnswerLeak,
  hasLeak,
  filterDistractorsByLength
} from './quizTextValidator.js';

export {
  normalizeNoAccent,
  sanitizeQuizText,
  isValidQuizTerm,
  isValidTranslationPair,
  hasAnswerLeak,
  hasLeak,
  filterDistractorsByLength
};

/**
 * Nettoie le titre d'une œuvre, d'un chant ou d'une fiche pour l'affichage dans un énoncé.
 * Supprime toute parenthèse et toute occurrence directe de la réponse attendue.
 */
export const cleanPromptTitle = (rawTitle, answerToHide = '') => {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  let cleaned = rawTitle
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim();

  if (answerToHide && typeof answerToHide === 'string') {
    const trimmedAns = sanitizeQuizText(answerToHide);
    if (trimmedAns.length >= 2) {
      const escapedAns = trimmedAns.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const dashRegex = new RegExp(`\\s*[-–—]\\s*${escapedAns}\\b`, 'gi');
      cleaned = cleaned.replace(dashRegex, '');
      const fullNormTitle = normalizeNoAccent(cleaned);
      const fullNormAns = normalizeNoAccent(trimmedAns);
      if (fullNormTitle === fullNormAns || fullNormTitle.includes(fullNormAns)) {
        return 'cette œuvre';
      }
    }
  }

  cleaned = cleaned.replace(/\s*[-–—:]\s*$/, '').trim();
  return cleaned || 'cette œuvre';
};

/**
 * Assainit un vers ou une phrase contenant un trou (______) :
 * supprime toute parenthèse ou crochet juste après le trou et toute fuite du mot masqué.
 */
export const sanitizeTextHole = (textWithHole, missingWord = '') => {
  if (!textWithHole || typeof textWithHole !== 'string') return '';
  let result = textWithHole
    .replace(/(_{3,})\s*\([^)]*\)/g, '$1')
    .replace(/(_{3,})\s*\[[^\]]*\]/g, '$1')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '');

  if (missingWord && typeof missingWord === 'string' && missingWord.trim().length >= 2) {
    const escapedWord = missingWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(`(?<![\\p{L}\\p{N}_])${escapedWord}(?![\\p{L}\\p{N}_])`, 'giu');
    result = result.replace(wordRegex, '______');
  }

  return result.replace(/\s{2,}/g, ' ').trim();
};

/** Nettoie le texte d'un choix de réponse (bonne réponse ou leurre). */
export const cleanChoiceText = (choiceText) => sanitizeQuizText(choiceText);

/** Valide et nettoie une question complète de QCM avant son intégration. */
export const sanitizeQuestion = (q) => {
  if (!q || typeof q !== 'object') return null;
  const rawCandidate = q.questionText || q.prompt || '';
  const rawQuestionText = typeof rawCandidate === 'string' ? rawCandidate : '';
  if (!rawQuestionText) return null;

  let correctAnswer = q.correctAnswer || '';
  if (!correctAnswer && Array.isArray(q.choices)) {
    const correctChoice = q.choices.find((c) => c && c.isCorrect);
    if (correctChoice) correctAnswer = correctChoice.text || '';
  }

  let cleanedQText = rawQuestionText
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanedQText.includes('______') && correctAnswer) {
    cleanedQText = sanitizeTextHole(cleanedQText, correctAnswer);
  }
  if (hasAnswerLeak(cleanedQText, correctAnswer)) {
    return null;
  }

  const sanitized = { ...q, questionText: cleanedQText };
  if (q.prompt) sanitized.prompt = cleanedQText;
  if (sanitized.correctAnswer && typeof sanitized.correctAnswer === 'string') {
    sanitized.correctAnswer = sanitizeQuizText(sanitized.correctAnswer) || sanitized.correctAnswer.trim();
  }
  if (Array.isArray(sanitized.choices)) {
    sanitized.choices = sanitized.choices.map((c) => ({
      ...c,
      text: typeof c.text === 'string' ? (sanitizeQuizText(c.text) || c.text.trim()) : c.text
    }));
  }
  if (Array.isArray(sanitized.options)) {
    sanitized.options = sanitized.options.map((opt) =>
      typeof opt === 'string' ? (sanitizeQuizText(opt) || opt.trim()) : opt
    );
  }
  return sanitized;
};

/** Filtre et assainit un lot de questions de QCM. */
export const sanitizeQuizQuestions = (questions = []) => {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => sanitizeQuestion(q)).filter(Boolean);
};
