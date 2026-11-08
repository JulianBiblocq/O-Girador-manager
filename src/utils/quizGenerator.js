// Moteur central de génération de QCM Pédagogiques (<= 140 lignes)
// Orchestre les générateurs spécialisés (Atelier, Culture, Toadas, Sequenciador, Dançador, Signes & Répertoire)

import {
  sanitizeQuizText,
  hasAnswerLeak,
  hasLeak,
  filterDistractorsByLength,
} from './quizSanitizer.js';
import { detectAlfaiaSticks } from './sequencerParser.js';
import {
  extractI18nVocabPool,
  getSmartDistractors,
  generateI18nTranslationQuiz,
} from './quizI18nEngine.js';
import { buildPieceRevisionQuestions } from './pieceRevisionQuizBuilder.js';
import { generateQuizFromDancador, buildPieceDanceAndPostureQuestions } from './danceQuizBuilder.js';
import {
  buildDeterministicQuizQuestionId,
  resolveQuizQuestionOverride,
  applyQuizOverrides,
} from './quizOverrideKeyHelper.js';
import { generateQuizFromInstrumentModel } from './quiz/quizInstrumentGenerator.js';
import { generateQuizFromSheet } from './quiz/quizSheetGenerator.js';
import { generateQuizFromSong } from './quiz/quizSongGenerator.js';
import {
  generateQuizFromSequencerJson,
  generateQuizFromPieceSignals,
} from './quiz/quizSequencerAndSignalsGenerator.js';

export {
  sanitizeQuizText,
  hasAnswerLeak,
  hasLeak,
  filterDistractorsByLength,
  extractI18nVocabPool,
  getSmartDistractors,
  generateI18nTranslationQuiz,
  detectAlfaiaSticks,
  generateQuizFromInstrumentModel,
  generateQuizFromSheet,
  generateQuizFromSong,
  generateQuizFromSequencerJson,
  generateQuizFromDancador,
  generateQuizFromPieceSignals,
  buildPieceDanceAndPostureQuestions,
  buildDeterministicQuizQuestionId,
  resolveQuizQuestionOverride,
  applyQuizOverrides,
};

/**
 * Générateur de QCM ciblé sur une fiche Répertoire ("Mode Focus Répertoire").
 * Combine Matériel Alfaia, Signes du Mestre, Rythme/Nação/Tablature, Toada, Danse Dançador & Culture,
 * avec résolution déterministe des surcharges quizOverrides du Mestre.
 */
export const generateQuizFromRepertoirePiece = (pieceDoc, contextData = {}, config = {}) =>
  buildPieceRevisionQuestions(pieceDoc, contextData, config, {
    generateQuizFromPieceSignals,
    generateQuizFromSheet,
    generateQuizFromSong,
  });
