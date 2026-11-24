/**
 * Validateurs typographiques, anti-fuite et calibrage morphologique des QCM (< 140 lignes).
 * Garantit la propreté des énoncés/options et préserve intégralement les URLs médias.
 */

const LEAK_STOP_WORDS = new Set([
  'dans', 'pour', 'avec', 'sans', 'sous', 'chez', 'vers', 'entre', 'apres', 'avant',
  'quel', 'quelle', 'quels', 'quelles', 'cette', 'celui', 'celle', 'ceux', 'celles',
  'sont', 'etre', 'avoir', 'fait', 'faire', 'plus', 'moins', 'tout', 'tous', 'toute',
  'toutes', 'comme', 'mais', 'donc', 'leur', 'leurs', 'aussi', 'bien', 'autre', 'autres',
  'meme', 'dont', 'quand', 'lors', 'afin', 'ainsi', 'alors', 'tres', 'peut', 'deux',
  'trois', 'elle', 'elles', 'nous', 'vous', 'votre', 'notre', 'para', 'como', 'mais',
  'menos', 'muito', 'muita', 'tudo', 'todos', 'todas', 'este', 'esta', 'isso', 'esse',
  'essa', 'qual', 'quais', 'pelo', 'pela', 'pelos', 'pelas', 'sobre', 'entre', 'quando',
  'onde', 'quem', 'porque', 'fazer', 'pode', 'seus', 'suas', 'dele', 'dela', 'voce'
]);

/** Normalise une chaîne en minuscules sans accents diacritiques. */
export const normalizeNoAccent = (str) =>
  String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Détecte si une valeur correspond à une URL média/image (Storage, HTTP/S, data URI, firestore:). */
export const isQuizMediaUrl = (val) => {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  if (/^(?:https?:\/\/|firestore:|data:image\/|blob:)/i.test(s)) return true;
  return s.startsWith('/') && (/\/sinais/i.test(s) || /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(s));
};

/** Normalise uniquement le schéma d'une URL (ex. Https:// -> https://) sans altérer le chemin ni le jeton. */
export const normalizeQuizMediaUrl = (val) =>
  typeof val === 'string' ? val.trim().replace(/^https?:\/\//i, (m) => m.toLowerCase()) : val;

/** Nettoie les textes de QCM sans jamais capitaliser ni tronquer une URL média. */
export const sanitizeQuizText = (str) => {
  if (str == null) return '';
  if (typeof str !== 'string') return String(str).trim();
  if (isQuizMediaUrl(str)) return normalizeQuizMediaUrl(str);

  let cleaned = str
    .replace(/\{\{[^}]*\}\}|\{[a-zA-Z0-9_]+\}/g, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[\p{Extended_Pictographic}\u2600-\u27BF]/gu, '')
    .replace(/[«»‹›"'`“”‘’„‟[\]()*]/g, '')
    .replace(/^[\s+/•\-–—:;,←→➔]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned.endsWith('...')) cleaned = cleaned.replace(/\.+$/, '').trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
};

/** Vérifie qu'un terme QCM compte entre 3 caractères et maxWords mots (défaut : 4 mots). */
export const isValidQuizTerm = (str, maxWords = 4) => {
  if (isQuizMediaUrl(str)) return false;
  const cleaned = sanitizeQuizText(str);
  if (!cleaned || cleaned.length < 3) return false;
  if (/<[^>]+>|https?:\/\/|www\.|\.(png|jpg|jpeg|svg|webp|gif|mp4|mp3|pdf|json)\b/i.test(cleaned)) return false;
  if (!/\p{L}/u.test(cleaned)) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= maxWords;
};

/** Vérifie la validité d'une paire bilingue FR ⇄ PT (<= 4 mots, >= 3 car., FR !== PT). */
export const isValidTranslationPair = (frRaw, ptRaw, maxWords = 4) => {
  if (!isValidQuizTerm(frRaw, maxWords) || !isValidQuizTerm(ptRaw, maxWords)) return false;
  return normalizeNoAccent(sanitizeQuizText(frRaw)) !== normalizeNoAccent(sanitizeQuizText(ptRaw));
};

/** Règle Anti-Fuite : rejette une question si un mot significatif (> 3 lettres) de la réponse y figure. */
export const hasAnswerLeak = (questionText, answerText) => {
  if (!questionText || !answerText || isQuizMediaUrl(answerText)) return false;
  const normQ = normalizeNoAccent(String(questionText).replace(/_{2,}/g, ' '));
  const normA = normalizeNoAccent(sanitizeQuizText(String(answerText)) || String(answerText));
  if (!normQ || !normA) return false;

  const rawTokens = normA.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const significantWords = rawTokens.filter((w) => w.length > 3 && !LEAK_STOP_WORDS.has(w));
  if (significantWords.length === 0 && rawTokens.length === 1 && rawTokens[0].length === 3) {
    significantWords.push(rawTokens[0]);
  }
  return significantWords.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'ui').test(normQ);
  });
};

export const hasLeak = hasAnswerLeak;

/** Appariement morphologique des distracteurs (±1 mot, longueur entre 0.7*L et 1.35*L). */
export const filterDistractorsByLength = (target, pool = [], targetCategory = null) => {
  if (!target || typeof target !== 'string' || !Array.isArray(pool)) return [];
  const cleanTarget = sanitizeQuizText(target);
  const targetWords = cleanTarget.split(/\s+/).filter(Boolean).length;
  const targetLen = cleanTarget.length;
  if (targetLen === 0) return [];

  const minWords = Math.max(1, targetWords - 1), maxWords = targetWords + 1;
  const minLen = Math.floor(0.7 * targetLen), maxLen = Math.ceil(1.35 * targetLen);

  const matched = pool.filter((cand) => {
    const rawStr = typeof cand === 'string' ? cand : (cand?.text || cand?.fr || cand?.pt || cand?.explication || '');
    const cleanCand = sanitizeQuizText(rawStr);
    if (!cleanCand || cleanCand.length < 3) return false;
    if (normalizeNoAccent(cleanCand) === normalizeNoAccent(cleanTarget)) return false;
    const candWords = cleanCand.split(/\s+/).filter(Boolean).length;
    return candWords >= minWords && candWords <= maxWords && cleanCand.length >= minLen && cleanCand.length <= maxLen;
  });

  if (!targetCategory) return matched;
  return [...matched].sort((a, b) => {
    const aSame = typeof a === 'object' && a?.category === targetCategory ? 0 : 1;
    const bSame = typeof b === 'object' && b?.category === targetCategory ? 0 : 1;
    return aSame - bSame;
  });
};
