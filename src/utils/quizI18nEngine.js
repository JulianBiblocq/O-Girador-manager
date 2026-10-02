/**
 * Moteur de QCM Linguistique & Calibrage Réaliste des Distracteurs (FR ↔ PT)
 * 
 * Exploite récursivement le dictionnaire bilingue (src/locales/fr.js et pt.js)
 * pour générer des QCM de traduction dynamiques, crédibles et sans biais visuels :
 * - Élimination des fuites lexicales (hasLeak)
 * - Assainissement typographique (sanitizeQuizText)
 * - Calibrage morphologique et phonétique des leurres selon le niveau (getSmartDistractors)
 * - Fallback multi-paliers garantissant 4 propositions viables à chaque question.
 */

import { fr } from '../locales/fr.js';
import { pt } from '../locales/pt.js';

/**
 * Nettoie la typographie d'un texte de question ou de choix :
 * retire systématiquement les guillemets («, », ‹, ›, ", ', `, “,”, ‘, ’, „, ‟),
 * les crochets et les parenthèses, puis normalise les espaces multiples.
 *
 * @param {string} str - Texte brut à assainir
 * @returns {string} Texte assaini
 */
export const sanitizeQuizText = (str) => {
  if (str == null) return '';
  if (typeof str !== 'string') return String(str).trim();

  return str
    .replace(/[«»‹›"'`“”‘’„‟[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Mots de liaison courants en français et portugais à ignorer lors de la détection de fuite.
 */
const LEAK_STOP_WORDS = new Set([
  // Français
  'dans', 'pour', 'avec', 'sans', 'sous', 'chez', 'vers', 'entre', 'apres', 'après',
  'quel', 'quelle', 'quels', 'quelles', 'cette', 'celui', 'celle', 'ceux', 'celles',
  'sont', 'etre', 'être', 'avoir', 'fait', 'faire', 'plus', 'moins', 'tout', 'tous',
  'toute', 'toutes', 'comme', 'mais', 'donc', 'leur', 'leurs', 'aussi', 'bien',
  'autre', 'autres', 'meme', 'même', 'dont', 'quand', 'lors', 'afin', 'ainsi',
  'alors', 'ceci', 'cela', 'deux', 'trois', 'quatre', 'cinq', 'vous', 'nous', 'elles', 'ils',
  // Portugais
  'para', 'com', 'sem', 'sob', 'sobre', 'qual', 'quais', 'esta', 'este', 'estas', 'estes',
  'esse', 'essa', 'esses', 'essas', 'isso', 'isto', 'aquilo', 'aquele', 'aquela',
  'onde', 'quando', 'como', 'mais', 'menos', 'muito', 'muita', 'muitos', 'muitas',
  'pelo', 'pela', 'pelos', 'pelas', 'numa', 'num', 'todo', 'toda', 'todos', 'todas',
  'tudo', 'dele', 'dela', 'deles', 'delas', 'você', 'voces', 'vocês', 'eles', 'elas'
]);

/**
 * Détecte si l'énoncé de la question trahit la réponse attendue en contenant
 * un mot significatif de la réponse (> 3 caractères, hors mots de liaison courants).
 *
 * @param {string} questionText - Intitulé de la question ou texte source
 * @param {string} answerText - Réponse correcte attendue
 * @returns {boolean} True si une fuite est détectée
 */
export const hasLeak = (questionText, answerText) => {
  if (!questionText || !answerText || typeof questionText !== 'string' || typeof answerText !== 'string') {
    return false;
  }

  // Écarter les trous "______" pour ne pas pénaliser d'éventuels masques
  const cleanQ = questionText.replace(/_{2,}/g, ' ').toLowerCase();

  // Extraire les mots de la réponse (conservation des lettres accentuées Unicode)
  const rawWords = answerText.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

  // Mots significatifs : longueur > 3 et non stop-word
  const significantWords = rawWords.filter(w => w.length > 3 && !LEAK_STOP_WORDS.has(w));
  if (significantWords.length === 0) {
    return false;
  }

  return significantWords.some(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leakRegex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'ui');
    return leakRegex.test(cleanQ);
  });
};

/**
 * Extrait et nettoie récursivement l'ensemble des paires de traduction du dictionnaire i18n.
 * Filtre strictement les interpolations {{...}}, les balises HTML, les termes identiques (FR === PT),
 * les chaînes trop courtes (< 3 caractères) et les URLs ou artefacts techniques.
 *
 * @param {Object} [options={}] - Options de configuration de l'extraction
 * @param {number} [options.maxWords=6] - Longueur maximale en mots pour cibler le vocabulaire mémorisable
 * @param {string} [options.category=null] - Filtre optionnel sur un namespace ou catégorie
 * @param {Object} [options.frSource=fr] - Arbre source français (défaut: fr.js)
 * @param {Object} [options.ptSource=pt] - Arbre source portugais (défaut: pt.js)
 * @returns {Array<{ key: string, namespace: string, category: string, fr: string, pt: string }>} Vivier de paires bilingues
 */
export const extractI18nVocabPool = (options = {}) => {
  const {
    maxWords = 6,
    category = null,
    frSource = fr,
    ptSource = pt
  } = options;

  const pool = [];
  const seenPairs = new Set();

  const flatten = (frObj, ptObj, ns = '', keyPath = '') => {
    if (!frObj || !ptObj) return;

    for (const k of Object.keys(frObj)) {
      const fv = frObj[k];
      const pv = ptObj[k];
      const nextNs = ns || k;
      const nextKey = keyPath ? `${keyPath}.${k}` : k;

      if (typeof fv === 'object' && fv !== null && typeof pv === 'object' && pv !== null) {
        flatten(fv, pv, nextNs, nextKey);
      } else if (typeof fv === 'string' && typeof pv === 'string') {
        const frT = fv.trim();
        const ptT = pv.trim();

        // 1. Filtrer impérativement les paires avec variables d'interpolation (ex: {{count}}, {nom})
        if (/\{.*?\}|\{\{.*?\}\}/.test(frT) || /\{.*?\}|\{\{.*?\}\}/.test(ptT)) continue;

        // 2. Filtrer les textes contenant des balises HTML
        if (/<[^>]+>/.test(frT) || /<[^>]+>/.test(ptT)) continue;

        // 3. Filtrer les URLs, extensions de fichiers techniques et codes hexadécimaux
        if (/https?:\/\/|www\.|\.(png|jpg|jpeg|svg|webp|gif|mp4|mp3|pdf|json)\b|#[0-9a-f]{3,8}\b/i.test(frT)) continue;
        if (/https?:\/\/|www\.|\.(png|jpg|jpeg|svg|webp|gif|mp4|mp3|pdf|json)\b|#[0-9a-f]{3,8}\b/i.test(ptT)) continue;

        const cFr = sanitizeQuizText(frT);
        const cPt = sanitizeQuizText(ptT);

        // 4. Filtrer les chaînes trop courtes (< 3 caractères)
        if (cFr.length < 3 || cPt.length < 3) continue;

        // 5. Filtrer les valeurs identiques (FR === PT, ex: "Agenda", "Alfaia", "BPM")
        if (cFr.toLowerCase() === cPt.toLowerCase()) continue;

        // 6. Limite optionnelle de longueur en nombre de mots (évite les longs paragraphes d'aide)
        if (maxWords != null) {
          const frWords = cFr.split(/\s+/).length;
          const ptWords = cPt.split(/\s+/).length;
          if (frWords > maxWords || ptWords > maxWords) continue;
        }

        // 7. Filtrage par namespace ou catégorie si demandé
        if (category && nextNs.toLowerCase() !== category.toLowerCase()) continue;

        // Dédoublonnage strict par contenu textuel bilingue
        const pairSignature = `${cFr.toLowerCase()}__${cPt.toLowerCase()}`;
        if (seenPairs.has(pairSignature)) continue;
        seenPairs.add(pairSignature);

        pool.push({
          key: nextKey,
          namespace: nextNs,
          category: nextNs,
          fr: cFr,
          pt: cPt
        });
      }
    }
  };

  flatten(frSource, ptSource);
  return pool;
};

/**
 * Mélange aléatoire immuable selon l'algorithme de Fisher-Yates.
 *
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} Copie mélangée
 */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Extrait la première lettre normalisée d'une chaîne (sans accents et en minuscule).
 *
 * @param {string} str - Chaîne source
 * @returns {string} Première lettre normalisée
 */
const getInitialChar = (str) => {
  if (!str) return '';
  return str.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toLowerCase();
};

/**
 * Sélectionne des distracteurs intelligents calibrés selon la réponse cible et le niveau de difficulté.
 * Applique un système de repli (fallback) multi-paliers pour toujours fournir exactement le nombre
 * de distracteurs demandé (par défaut 3 pour un QCM à 4 choix).
 *
 * - Niveau 'decouverte' : tolérance de longueur de ± 2 à 3 mots.
 * - Niveau 'confirme' : tolérance stricte de ± 1 mot et écart de caractères ≤ 35 %.
 * - Niveau 'mestre' : même nombre exact de mots (diff = 0) et écart de caractères ≤ 20 %,
 *   avec priorité absolue aux leurres partageant la même lettre initiale.
 *
 * @param {string} targetText - Réponse correcte attendue
 * @param {Array<string|Object>} pool - Vivier de leurres potentiels
 * @param {string} [difficulty='confirme'] - Niveau de difficulté ('decouverte' | 'confirme' | 'mestre')
 * @param {number} [count=3] - Nombre de distracteurs souhaités
 * @returns {Array<string>} Tableau de distracteurs uniques calibrés
 */
export const getSmartDistractors = (targetText, pool = [], difficulty = 'confirme', count = 3) => {
  if (!targetText || typeof targetText !== 'string' || !Array.isArray(pool)) return [];

  const cleanTarget = sanitizeQuizText(targetText);
  const targetWords = cleanTarget.split(/\s+/).filter(Boolean).length;
  const targetLen = cleanTarget.length;
  const targetInitial = getInitialChar(cleanTarget);
  const diffLevel = (difficulty || 'confirme').toLowerCase().trim();

  // Nettoyage et assainissement préliminaire des candidats du vivier
  const seenCandidates = new Set();
  const validCandidates = [];

  for (const item of pool) {
    const rawCand = typeof item === 'string' ? item : (item?.pt || item?.fr || item?.text || '');
    if (!rawCand || typeof rawCand !== 'string') continue;

    const cleanCand = sanitizeQuizText(rawCand);
    if (!cleanCand || cleanCand.length < 2) continue;

    // Écarter les termes identiques à la cible
    if (cleanCand.toLowerCase() === cleanTarget.toLowerCase()) continue;

    // Écarter les candidats présentant une fuite réciproque avec la réponse
    if (hasLeak(cleanTarget, cleanCand) || hasLeak(cleanCand, cleanTarget)) continue;

    const lowerKey = cleanCand.toLowerCase();
    if (seenCandidates.has(lowerKey)) continue;
    seenCandidates.add(lowerKey);

    const candWords = cleanCand.split(/\s+/).filter(Boolean).length;
    const candLen = cleanCand.length;
    const candInitial = getInitialChar(cleanCand);
    const wordDiff = Math.abs(candWords - targetWords);
    const charRatio = targetLen > 0 ? Math.abs(candLen - targetLen) / targetLen : 1;

    validCandidates.push({
      text: cleanCand,
      words: candWords,
      length: candLen,
      initial: candInitial,
      wordDiff,
      charRatio
    });
  }

  const selectedDistractors = [];

  // Fonction utilitaire pour piocher aléatoirement dans un sous-palier de candidats
  const pickFromCandidates = (candidatesList) => {
    const shuffled = shuffleArray(candidatesList);
    for (const item of shuffled) {
      if (selectedDistractors.length >= count) break;
      if (!selectedDistractors.includes(item.text)) {
        selectedDistractors.push(item.text);
      }
    }
  };

  if (diffLevel === 'mestre' || diffLevel === 'expert') {
    // --- NIVEAU MESTRE ---
    // Exigences : diffWords = 0, charRatio <= 20%, priorité même lettre initiale
    const tier1 = validCandidates.filter(c => c.wordDiff === 0 && c.charRatio <= 0.20 && c.initial === targetInitial);
    const tier2 = validCandidates.filter(c => c.wordDiff === 0 && c.charRatio <= 0.20);
    const tier3 = validCandidates.filter(c => c.wordDiff === 0 && c.charRatio <= 0.35);
    const tier4 = validCandidates.filter(c => c.wordDiff <= 1 && c.charRatio <= 0.35);
    const tier5 = validCandidates.filter(c => c.wordDiff <= 1);

    pickFromCandidates(tier1);
    if (selectedDistractors.length < count) pickFromCandidates(tier2);
    if (selectedDistractors.length < count) pickFromCandidates(tier3);
    if (selectedDistractors.length < count) pickFromCandidates(tier4);
    if (selectedDistractors.length < count) pickFromCandidates(tier5);
    if (selectedDistractors.length < count) pickFromCandidates(validCandidates);

  } else if (diffLevel === 'decouverte' || diffLevel === 'easy' || diffLevel === 'facile') {
    // --- NIVEAU DÉCOUVERTE ---
    // Exigences : tolérance de longueur de ± 2 à 3 mots
    const tier1 = validCandidates.filter(c => c.wordDiff >= 2 && c.wordDiff <= 3);
    const tier2 = validCandidates.filter(c => c.wordDiff >= 1 && c.wordDiff <= 4);
    const tier3 = validCandidates.filter(c => c.wordDiff >= 1);

    pickFromCandidates(tier1);
    if (selectedDistractors.length < count) pickFromCandidates(tier2);
    if (selectedDistractors.length < count) pickFromCandidates(tier3);
    if (selectedDistractors.length < count) pickFromCandidates(validCandidates);

  } else {
    // --- NIVEAU CONFIRMÉ (Défaut) ---
    // Exigences : tolérance stricte de ± 1 mot et écart de caractères <= 35 %
    const tier1 = validCandidates.filter(c => c.wordDiff <= 1 && c.charRatio <= 0.35);
    const tier2 = validCandidates.filter(c => c.wordDiff <= 1 && c.charRatio <= 0.50);
    const tier3 = validCandidates.filter(c => c.wordDiff <= 2);

    pickFromCandidates(tier1);
    if (selectedDistractors.length < count) pickFromCandidates(tier2);
    if (selectedDistractors.length < count) pickFromCandidates(tier3);
    if (selectedDistractors.length < count) pickFromCandidates(validCandidates);
  }

  return selectedDistractors.slice(0, count);
};

/**
 * Générateur de session de Quiz de Traduction bilingue (FR ↔ PT).
 * Élabore des questions calibrées, variées et rigoureusement protégées contre les fuites visuelles.
 *
 * @param {Object} [config={}] - Paramètres de configuration du quiz
 * @param {number} [config.count=10] - Nombre de questions à générer
 * @param {string} [config.direction='mixed'] - Direction linguistique ('mixed' | 'fr_to_pt' | 'pt_to_fr')
 * @param {string} [config.difficulty='confirme'] - Niveau ('decouverte' | 'confirme' | 'mestre')
 * @param {string} [config.category=null] - Filtrage optionnel par namespace
 * @param {number} [config.maxWords=6] - Longueur max des termes
 * @returns {Array<Object>} Liste des questions prêtes pour l'évaluation
 */
export const generateI18nTranslationQuiz = (config = {}) => {
  const {
    count = 10,
    direction = 'mixed',
    difficulty = 'confirme',
    category = null,
    categories = [],
    maxWords = 6,
    customDistractors = {}
  } = config;

  const pool = extractI18nVocabPool({ category: category || (categories?.[0] || null), maxWords });
  if (pool.length < 4) {
    console.warn("Réservoir i18n insuffisant pour générer un QCM de traduction.");
    return [];
  }

  // Viviers pré-extraits par langue
  let allFrDistractors = pool.map(p => p.fr);
  let allPtDistractors = pool.map(p => p.pt);

  // Intégration optionnelle de distracteurs personnalisés du Mestre
  if (customDistractors?.expressionsTraduction?.length > 0) {
    allFrDistractors = [...allFrDistractors, ...customDistractors.expressionsTraduction];
    allPtDistractors = [...allPtDistractors, ...customDistractors.expressionsTraduction];
  }

  const shuffledPool = shuffleArray(pool);
  const questions = [];

  // Normalisation du paramètre de direction
  const rawDirection = String(direction || 'mixed').toLowerCase().replace(/-/g, '_');

  for (let i = 0; i < shuffledPool.length && questions.length < count; i++) {
    const pair = shuffledPool[i];

    // Détermination de la direction pour cette question
    let currentDir = rawDirection;
    if (currentDir === 'mixed') {
      currentDir = Math.random() > 0.5 ? 'fr_to_pt' : 'pt_to_fr';
    }

    const isFrToPt = currentDir === 'fr_to_pt';
    const targetWord = isFrToPt ? pair.fr : pair.pt;
    const correctAnswer = isFrToPt ? pair.pt : pair.fr;
    const candidatePool = isFrToPt ? allPtDistractors : allFrDistractors;

    // Salubrité : vérifier l'absence de fuite lexicale directe entre l'énoncé et la réponse
    if (hasLeak(targetWord, correctAnswer) || hasLeak(correctAnswer, targetWord)) {
      continue;
    }

    // Sélection des 3 distracteurs calibrés selon la difficulté
    const distractors = getSmartDistractors(correctAnswer, candidatePool, difficulty, 3);
    if (distractors.length < 3) {
      continue;
    }

    // Assemblage et mélange des 4 options (la bonne réponse + 3 leurres)
    const optionsRaw = [correctAnswer, ...distractors];
    const options = shuffleArray(optionsRaw);

    const choices = options.map(opt => ({
      text: opt,
      isCorrect: opt.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    }));

    const promptText = `Traduis : "${targetWord}"`;
    const instruction = isFrToPt ? "Traduction Français ➔ Portugais" : "Traduction Portugais ➔ Français";
    const explanation = `"${targetWord}" se traduit par "${correctAnswer}".`;

    questions.push({
      id: `i18n_trans_${questions.length + 1}_${pair.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      type: 'translation',
      direction: isFrToPt ? 'fr_to_pt' : 'pt_to_fr',
      targetWord: targetWord,
      prompt: promptText,
      questionText: promptText,
      instruction: instruction,
      correctAnswer: correctAnswer,
      options: options,
      choices: choices,
      category: pair.namespace || 'vocabulaire',
      namespace: pair.namespace || 'vocabulaire',
      explanation: explanation,
      feedback: `${explanation} Bravo !`
    });
  }

  return questions;
};
