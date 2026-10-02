/**
 * Passerelle de Génération de Quiz de Traduction
 * Raccorde les appels existants vers le moteur calibré i18n (quizI18nEngine.js).
 */

import { generateI18nTranslationQuiz } from './quizI18nEngine.js';

/**
 * Génère une série de questions de QCM de traduction bilingue (FR ↔ PT)
 * en exploitant le moteur i18n haute fidélité (distracteurs calibrés et anti-fuite).
 *
 * @param {Object} [config={}] - Paramètres de configuration du quiz
 * @param {number} [config.count=10] - Nombre de questions souhaitées
 * @param {string} [config.direction='MIXED'] - Direction linguistique ('MIXED', 'FR_PT', 'PT_FR')
 * @param {Array<string>} [config.categories=[]] - Filtrage optionnel par catégories
 * @param {string} [config.difficulty='medium'] - Difficulté ('easy', 'medium', 'expert', 'mestre', 'confirme')
 * @param {Object} [config.customDistractors={}] - Distracteurs personnalisés éventuels
 * @returns {Array<Object>} Questions de QCM prêtes pour l'évaluation
 */
export const generateTranslationQuiz = (config = {}) => {
  const {
    count = 10,
    direction = 'MIXED',
    categories = [],
    difficulty = 'medium',
    customDistractors = {}
  } = config;

  // Normalisation de la direction linguistique
  let dir = 'mixed';
  if (direction === 'FR_PT' || direction === 'fr_to_pt') {
    dir = 'fr_to_pt';
  } else if (direction === 'PT_FR' || direction === 'pt_to_fr') {
    dir = 'pt_to_fr';
  }

  // Normalisation du niveau de difficulté
  let diff = 'confirme';
  const rawDiff = String(difficulty || '').toLowerCase();
  if (rawDiff === 'expert' || rawDiff === 'mestre' || rawDiff === 'hard') {
    diff = 'mestre';
  } else if (rawDiff === 'easy' || rawDiff === 'découverte' || rawDiff === 'decouverte') {
    diff = 'decouverte';
  }

  return generateI18nTranslationQuiz({
    count,
    direction: dir,
    difficulty: diff,
    categories,
    category: categories?.[0] || null,
    customDistractors
  });
};
