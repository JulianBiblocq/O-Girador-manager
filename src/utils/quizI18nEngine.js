/**
 * Moteur de QCM Linguistique Multi-Applications (FR ⇄ PT-BR) (< 140 lignes).
 * S'appuie sur pedagogicalLexiconPool.js et quizTextValidator.js :
 * - Nettoyage typographique strict (<= 4 mots, >= 3 car., majuscule initiale, sans point final)
 * - Règle anti-fuite (hasAnswerLeak / hasLeak)
 * - Appariement morphologique et thématique des 3 distracteurs
 * - Feedback enrichi : catégorie métier, prononciation/syllabes et vers de Toada associé.
 */

import { sanitizeQuizText, isValidQuizTerm, hasAnswerLeak, hasLeak, normalizeNoAccent } from './quizTextValidator.js';
import { CATEGORY_LABELS, buildPedagogicalLexiconPool, formatPortugueseSyllables, findToadaVerseMatch } from './pedagogicalLexiconPool.js';

export { sanitizeQuizText, hasAnswerLeak, hasLeak };

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Extrait le corpus bilingue pédagogique filtré (<= 4 mots, >= 3 caractères, FR !== PT). */
export const extractI18nVocabPool = ({ maxWords = 4, songs = [], sheets = [] } = {}) =>
  buildPedagogicalLexiconPool({ songs, sheets, includeI18n: true, maxWords: Math.min(4, maxWords) });

/**
 * Sélectionne 3 distracteurs morphologiquement et thématiquement calibrés :
 * Priorise la même catégorie thématique, un nombre de mots entre max(1, N-1) et N+1,
 * et une longueur en caractères comprise entre 0.7 * L et 1.35 * L.
 */
export const getSmartDistractors = (correctAnswer, candidatePool = [], difficulty = 'confirme', count = 3, targetCategory = null) => {
  const cleanCorrect = sanitizeQuizText(correctAnswer);
  if (!cleanCorrect || !Array.isArray(candidatePool)) return [];

  const targetWords = cleanCorrect.split(/\s+/).filter(Boolean).length;
  const targetLen = cleanCorrect.length;
  const targetInitial = normalizeNoAccent(cleanCorrect)[0] || '';
  const isMestre = difficulty === 'mestre' || difficulty === 'expert';

  const seen = new Set([normalizeNoAccent(cleanCorrect)]);
  const uniqueCandidates = [];
  for (const raw of candidatePool) {
    const rawText = typeof raw === 'string' ? raw : (raw?.text || '');
    const cat = typeof raw === 'object' ? (raw?.category || null) : null;
    const c = sanitizeQuizText(rawText);
    if (!isValidQuizTerm(c, 4)) continue;
    const norm = normalizeNoAccent(c);
    if (seen.has(norm) || hasAnswerLeak(c, cleanCorrect) || hasAnswerLeak(cleanCorrect, c)) continue;
    seen.add(norm);
    uniqueCandidates.push({
      text: c, category: cat, words: c.split(/\s+/).filter(Boolean).length, len: c.length,
      sameInitial: (norm[0] || '') === targetInitial, sameCategory: Boolean(targetCategory && cat === targetCategory)
    });
  }

  const minW = Math.max(1, targetWords - 1), maxW = targetWords + 1;
  const minL = Math.floor(0.7 * targetLen), maxL = Math.ceil(1.35 * targetLen);
  const selected = [], used = new Set();
  const addFromTier = (predicate, sortByInitial = false) => {
    if (selected.length >= count) return;
    let matches = shuffleArray(uniqueCandidates.filter((item) => !used.has(item.text) && predicate(item)));
    if (sortByInitial) matches.sort((a, b) => (a.sameInitial === b.sameInitial ? 0 : a.sameInitial ? -1 : 1));
    for (const m of matches) {
      selected.push(m.text);
      used.add(m.text);
      if (selected.length >= count) break;
    }
  };

  if (isMestre) {
    addFromTier((it) => it.sameCategory && it.words === targetWords && it.len >= Math.floor(0.8 * targetLen) && it.len <= Math.ceil(1.2 * targetLen), true);
    addFromTier((it) => it.words === targetWords && it.len >= Math.floor(0.8 * targetLen) && it.len <= Math.ceil(1.2 * targetLen), true);
  }
  addFromTier((it) => it.sameCategory && it.words >= minW && it.words <= maxW && it.len >= minL && it.len <= maxL, isMestre);
  addFromTier((it) => it.words >= minW && it.words <= maxW && it.len >= minL && it.len <= maxL, isMestre);
  addFromTier((it) => it.words >= minW && it.words <= maxW, false);
  addFromTier(() => true, false);
  return selected.slice(0, count);
};

/** Génère un QCM de traduction Portugais enrichi pédagogiquement. */
export const generateI18nTranslationQuiz = (options = {}) => {
  const { count = 10, direction = 'mixed', difficulty = 'confirme', customPool = null, songs = [], sheets = [] } = options;
  const pool = Array.isArray(customPool) && customPool.length >= 4
    ? customPool
    : buildPedagogicalLexiconPool({ songs, sheets, includeI18n: true, maxWords: 4 });
  if (pool.length < 4) return [];

  const ptCandidates = pool.map((p) => ({ text: p.pt, category: p.category }));
  const frCandidates = pool.map((p) => ({ text: p.fr, category: p.category }));
  const normDir = String(direction || 'mixed').toLowerCase();
  const questions = [];

  for (const pair of shuffleArray(pool)) {
    if (questions.length >= count) break;
    const isFrToPt = normDir === 'fr_to_pt' || normDir === 'fr_pt' ? true : (normDir === 'pt_to_fr' || normDir === 'pt_fr' ? false : questions.length % 2 === 0);
    const targetWord = sanitizeQuizText(isFrToPt ? pair.fr : pair.pt);
    const correctAnswer = sanitizeQuizText(isFrToPt ? pair.pt : pair.fr);
    if (!isValidQuizTerm(targetWord, 4) || !isValidQuizTerm(correctAnswer, 4)) continue;

    const promptText = sanitizeQuizText(`Traduis : ${targetWord}`);
    if (hasAnswerLeak(promptText, correctAnswer) || hasAnswerLeak(targetWord, correctAnswer)) continue;

    const distractors = getSmartDistractors(correctAnswer, isFrToPt ? ptCandidates : frCandidates, difficulty, 3, pair.category);
    if (distractors.length < 3) continue;

    const opts = shuffleArray([correctAnswer, ...distractors]);
    const catLabel = pair.categoryLabel || CATEGORY_LABELS[pair.category] || CATEGORY_LABELS.culture;
    const phonetic = formatPortugueseSyllables(pair.pt, pair.pronunciation);
    const toadaMatch = findToadaVerseMatch(pair.pt, songs) || (pair.songTitle && pair.verse ? { songTitle: pair.songTitle, verse: pair.verse } : null);
    const toadaInfo = toadaMatch ? ` • Toada « ${toadaMatch.songTitle} » : « ${toadaMatch.verse} »` : '';
    const explanation = `${catLabel} • Prononciation PT : ${pair.pt} ${phonetic}${toadaInfo}`;

    questions.push({
      id: `i18n_trans_${questions.length + 1}_${String(pair.key || questions.length).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      type: 'translation', direction: isFrToPt ? 'fr_to_pt' : 'pt_to_fr', targetWord, prompt: promptText,
      questionText: promptText, instruction: isFrToPt ? 'Traduction Français ➔ Portugais' : 'Traduction Portugais ➔ Français',
      correctAnswer, options: opts, choices: opts.map((opt) => ({ text: opt, isCorrect: normalizeNoAccent(opt) === normalizeNoAccent(correctAnswer) })),
      category: pair.category || 'culture', categoryLabel: catLabel, pronunciation: phonetic, toadaMatch,
      explanation, correctAnswerExplanation: explanation, feedback: explanation
    });
  }
  return questions;
};
