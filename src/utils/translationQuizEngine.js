/**
 * Passerelle de Génération de Quiz de Traduction (< 140 lignes).
 * Raccorde les appels existants vers le moteur multi-applications (quizI18nEngine.js).
 */

import { generateI18nTranslationQuiz } from './quizI18nEngine.js';

/**
 * Génère une série de questions de QCM de traduction bilingue (FR ⇄ PT-BR)
 * en croisant le lexique de l'écosystème, les Toadas/Fiches Culture et les namespaces musicaux.
 */
export const generateTranslationQuiz = (config = {}) => {
  const {
    count = 10,
    direction = 'MIXED',
    difficulty = 'medium',
    songs = [],
    sheets = [],
    customPool = null
  } = config;

  let mappedDir = 'mixed';
  const upperDir = String(direction || 'MIXED').toUpperCase();
  if (upperDir === 'FR_PT' || upperDir === 'FR_TO_PT') {
    mappedDir = 'fr_to_pt';
  } else if (upperDir === 'PT_FR' || upperDir === 'PT_TO_FR') {
    mappedDir = 'pt_to_fr';
  }

  let mappedDiff = 'confirme';
  const lowerDiff = String(difficulty || 'medium').toLowerCase();
  if (lowerDiff === 'expert' || lowerDiff === 'mestre') {
    mappedDiff = 'mestre';
  }

  return generateI18nTranslationQuiz({
    count,
    direction: mappedDir,
    difficulty: mappedDiff,
    songs,
    sheets,
    customPool
  });
};

export default {
  generateTranslationQuiz
};
