/**
 * Module d'Assainissement et de Sécurité Pédagogique des QCM
 * Éradique les fuites de réponses (indices entre parenthèses, redondances, leurres révélateurs)
 * et garantit la validité pédagogique des questions générées.
 */

/**
 * Nettoie le titre d'une œuvre, d'un chant ou d'une fiche pour l'affichage dans un énoncé de question.
 * Supprime les mentions entre parenthèses (qui contiennent souvent le rythme, la ville ou la nação)
 * ainsi que toute occurrence directe de la réponse attendue.
 *
 * @param {string} rawTitle - Le titre original brut
 * @param {string} [answerToHide] - La réponse correcte à masquer impérativement
 * @returns {string} Titre nettoyé et prêt pour l'énoncé
 */
export const cleanPromptTitle = (rawTitle, answerToHide = '') => {
  if (!rawTitle || typeof rawTitle !== 'string') return '';

  let cleaned = rawTitle.trim();

  // 1. Si une réponse attendue est fournie, supprimer toute parenthèse qui la contient (insensible à la casse)
  if (answerToHide && typeof answerToHide === 'string') {
    const trimmedAns = answerToHide.trim();
    if (trimmedAns.length >= 2) {
      const escapedAns = trimmedAns.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Regex pour parenthèses contenant la réponse attendue : ex. (Baque Luanda), (Recife), etc.
      const parenWithAnswerRegex = new RegExp(`\\s*\\([^)]*?${escapedAns}[^)]*?\\)`, 'gi');
      cleaned = cleaned.replace(parenWithAnswerRegex, '');

      // Regex pour tirets ou séparateurs contenant la réponse : ex. " - Baque Luanda"
      const dashWithAnswerRegex = new RegExp(`\\s*[-–—]\\s*${escapedAns}\\b`, 'gi');
      cleaned = cleaned.replace(dashWithAnswerRegex, '');
    }
  }

  // 2. Supprimer systématiquement toute parenthèse d'annotation descriptive finale
  // Ex: "Abertura (Baque Luanda)" -> "Abertura", "Caboclo de Lança (Nazaré da Mata)" -> "Caboclo de Lança"
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/g, '').trim();

  // 3. Si le titre nettoyé se retrouve vide (cas rare d'un titre constitué uniquement de parenthèses),
  // on retire juste les parenthèses extérieures
  if (!cleaned && rawTitle) {
    cleaned = rawTitle.replace(/[()]/g, '').trim();
  }

  return cleaned || rawTitle.trim();
};

/**
 * Assainit un texte à trous pour une question de culture.
 * - Supprime les parenthèses d'explication situées immédiatement avant ou après le trou (ex: "______ (tambour)").
 * - Éradique toute autre mention du mot cible dans le reste de l'extrait.
 * - Nettoie le mot cible de parenthèses parasites.
 *
 * @param {string} phrase - La phrase contextuelle extraite
 * @param {string} correctWord - Le mot à trouver
 * @returns {{ phraseTrou: string, cleanWord: string, isValid: boolean }}
 */
export const sanitizeTextHole = (phrase, correctWord) => {
  if (!phrase || !correctWord || typeof phrase !== 'string') {
    return { phraseTrou: '', cleanWord: '', isValid: false };
  }

  // Nettoyage du mot cible : retirer d'éventuelles parenthèses intégrées
  let cleanWord = correctWord.replace(/\s*\([^)]*\)/g, '').trim();
  if (cleanWord.length <= 2) {
    return { phraseTrou: '', cleanWord: '', isValid: false };
  }

  const escapedWord = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Remplacer TOUTES les occurrences du mot cible par le trou
  let phraseTrou = phrase.replace(new RegExp(`\\b${escapedWord}\\b`, 'gi'), '______');

  // Si le mot n'était pas bordé par des limites de mots stricts, faire un remplacement standard
  if (!phraseTrou.includes('______')) {
    phraseTrou = phrase.replace(new RegExp(escapedWord, 'gi'), '______');
  }

  // 2. Supprimer les parenthèses explicatives directement adjacentes au trou
  // Ex: "______ (tambour en bois)" ou "(tambour en bois) ______"
  phraseTrou = phraseTrou.replace(/______\s*\([^)]*\)/g, '______');
  phraseTrou = phraseTrou.replace(/\([^)]*\)\s*______/g, '______');

  // 3. Nettoyer les doubles espaces résiduels et la ponctuation incohérente
  phraseTrou = phraseTrou.replace(/\s{2,}/g, ' ').trim();

  // 4. Vérification de sécurité : le mot cible ne doit plus du tout apparaître dans l'extrait
  const remainingLeak = new RegExp(`\\b${escapedWord}\\b`, 'i').test(phraseTrou.replace('______', ''));

  return {
    phraseTrou,
    cleanWord,
    isValid: !remainingLeak && phraseTrou.includes('______')
  };
};

/**
 * Nettoie le libellé d'un choix / option pour éviter les fuites de réponses.
 * Si le choix contient entre parenthèses le mot-clé de la question (ex: "Hache double (Oxê)" pour la question sur Oxê),
 * la parenthèse révélatrice est expurgée.
 *
 * @param {string} choiceText - Le texte du choix
 * @param {string} [promptKeyword] - Le terme ou sujet de la question
 * @returns {string} Choix nettoyé
 */
export const cleanChoiceText = (choiceText, promptKeyword = '') => {
  if (!choiceText || typeof choiceText !== 'string') return choiceText;

  let cleaned = choiceText.trim();

  if (promptKeyword && typeof promptKeyword === 'string') {
    const trimmedKey = promptKeyword.trim();
    if (trimmedKey.length >= 3) {
      const escapedKey = trimmedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Supprime les parenthèses contenant le mot clé de la question
      cleaned = cleaned.replace(new RegExp(`\\s*\\([^)]*?${escapedKey}[^)]*?\\)`, 'gi'), '');
    }
  }

  // Supprime les parenthèses vides résiduelles
  cleaned = cleaned.replace(/\s*\(\s*\)/g, '').trim();

  return cleaned;
};

/**
 * Détecte si un intitulé de question contient directement la réponse correcte
 * (en dehors du masque prévu "______").
 *
 * @param {string} questionText - L'énoncé de la question
 * @param {string} correctAnswer - La réponse correcte
 * @returns {boolean} True si la question trahit la réponse
 */
export const hasAnswerLeak = (questionText, correctAnswer) => {
  if (!questionText || !correctAnswer || typeof questionText !== 'string' || typeof correctAnswer !== 'string') {
    return false;
  }

  const cleanAns = correctAnswer.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
  // On ignore les réponses trop courtes (1-2 caractères) pour éviter les faux positifs
  if (cleanAns.length <= 2) return false;

  // On ignore le placeholder "______"
  const textWithoutBlank = questionText.replace(/______/g, ' ').toLowerCase();

  // Échappement regex
  const escaped = cleanAns.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const leakRegex = new RegExp(`(^|[^a-zà-ÿ0-9])${escaped}([^a-zà-ÿ0-9]|$)`, 'i');

  return leakRegex.test(textWithoutBlank);
};

/**
 * Valide, nettoie et assainit une question individuelle de QCM.
 * Dédoublonne les choix, nettoie les libellés et vérifie l'absence de fuite.
 *
 * @param {Object} question - La question générée
 * @returns {Object|null} Question assainie, ou null si la question fuit irrémédiablement
 */
export const sanitizeQuestion = (question) => {
  if (!question || !question.questionText || !Array.isArray(question.choices) || question.choices.length < 2) {
    return null;
  }

  const correctChoice = question.choices.find(c => c.isCorrect);
  if (!correctChoice) return null;

  const correctText = correctChoice.text;

  // 1. Si la question est de type visuel (image/pattern), la fuite textuelle ne s'applique pas
  const isVisual = question.type === 'image_options' ||
                   question.type === 'pattern_rythmique' ||
                   question.type === 'blason_orixa' ||
                   question.visualElement ||
                   correctChoice.isImage;

  // 2. Vérification de fuite dans l'intitulé (intitulé direct ou mot significatif)
  if (!isVisual && typeof correctText === 'string' && (hasAnswerLeak(question.questionText, correctText) || hasLeak(question.questionText, correctText))) {
    return null; // Question écartée car elle trahit directement la réponse
  }

  // 3. Nettoyage des libellés de choix
  const subjectKeyword = question.partTitle || question.stepTitle || '';
  const seenTexts = new Set();
  const sanitizedChoices = [];

  for (const choice of question.choices) {
    if (typeof choice.text === 'string') {
      let cleanedText = sanitizeQuizText(cleanChoiceText(choice.text, subjectKeyword));
      const normalizedKey = cleanedText.toLowerCase().trim();

      // Éviter les choix doublons
      if (seenTexts.has(normalizedKey)) continue;
      seenTexts.add(normalizedKey);

      sanitizedChoices.push({
        ...choice,
        text: cleanedText
      });
    } else {
      sanitizedChoices.push(choice);
    }
  }

  // La question doit conserver au moins 2 choix distincts (1 correct et au moins 1 faux)
  const hasCorrect = sanitizedChoices.some(c => c.isCorrect);
  const hasWrong = sanitizedChoices.some(c => !c.isCorrect);
  if (!hasCorrect || !hasWrong) {
    return null;
  }

  return {
    ...question,
    questionText: sanitizeQuizText(question.questionText),
    choices: sanitizedChoices
  };
};

/**
 * Passe en revue une liste complète de questions générées et filtre les failles.
 *
 * @param {Array<Object>} questions - Liste de questions
 * @returns {Array<Object>} Questions valides et assainies
 */
export const sanitizeQuizQuestions = (questions = []) => {
  if (!Array.isArray(questions)) return [];

  const results = [];
  for (const q of questions) {
    const sanitized = sanitizeQuestion(q);
    if (sanitized) {
      results.push(sanitized);
    }
  }

  return results;
};

/**
 * Nettoie la typographie d'un texte de question ou de choix :
 * retire systématiquement les guillemets («, », ", '), les crochets et parenthèses résiduels.
 * Normalise les espaces multiples.
 *
 * @param {string} str - Texte brut
 * @returns {string} Texte assaini
 */
export const sanitizeQuizText = (str) => {
  if (str == null) return '';
  if (typeof str !== 'string') return String(str).trim();

  return str
    .replace(/[«»‹›"'\`“”‘’„‟[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Liste des mots de liaison courants à ignorer lors de la détection de fuite
const LEAK_STOP_WORDS = new Set([
  'dans', 'pour', 'avec', 'sans', 'sous', 'chez', 'vers', 'entre', 'apres', 'après',
  'quel', 'quelle', 'quels', 'quelles', 'cette', 'celui', 'celle', 'ceux', 'celles',
  'sont', 'etre', 'être', 'avoir', 'fait', 'faire', 'plus', 'moins', 'tout', 'tous',
  'toute', 'toutes', 'comme', 'mais', 'donc', 'leur', 'leurs', 'aussi', 'bien',
  'autre', 'autres', 'meme', 'même', 'dont', 'quand', 'lors', 'afin', 'ainsi',
  'alors', 'ceci', 'cela', 'deux', 'trois', 'quatre', 'cinq', 'vous', 'nous', 'elles', 'ils',
  'para', 'com', 'sem', 'sob', 'sobre', 'qual', 'quais', 'esta', 'este', 'estas', 'estes',
  'esse', 'essa', 'esses', 'essas', 'isso', 'isto', 'aquilo', 'aquele', 'aquela',
  'onde', 'quando', 'como', 'mais', 'menos', 'muito', 'muita', 'muitos', 'muitas'
]);

/**
 * Détecte si l'énoncé de la question trahit la réponse attendue en contenant
 * un mot significatif de la réponse (> 3 caractères, hors mots de liaison courants).
 *
 * @param {string} questionText - Intitulé de la question
 * @param {string} answerText - Réponse correcte attendue
 * @returns {boolean} True si une fuite est détectée
 */
export const hasLeak = (questionText, answerText) => {
  if (!questionText || !answerText || typeof questionText !== 'string' || typeof answerText !== 'string') {
    return false;
  }

  // Écarter les trous "______" pour ne pas pénaliser les textes à trous
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
 * Calibre la longueur des leurres pour les questions de traduction ou définitions :
 * - Écart de nombre de mots <= ±1 mot par rapport à la cible
 * - Ratio de caractères compris à ±35 % de la cible
 *
 * @param {string} target - Réponse correcte attendue
 * @param {Array<string|Object>} pool - Vivier de leurres candidats
 * @returns {Array} Candidats filtrés et calibrés
 */
export const filterDistractorsByLength = (target, pool = []) => {
  if (!target || typeof target !== 'string' || !Array.isArray(pool)) return [];

  const cleanTarget = sanitizeQuizText(target);
  const targetWords = cleanTarget.split(/\s+/).filter(Boolean).length;
  const targetLen = cleanTarget.length;
  if (targetLen === 0) return [];

  return pool.filter(cand => {
    const candStr = typeof cand === 'string' ? cand : (cand?.text || cand?.fr || cand?.explication || '');
    if (!candStr || typeof candStr !== 'string') return false;

    const cleanCand = sanitizeQuizText(candStr);
    if (!cleanCand) return false;
    if (cleanCand.toLowerCase() === cleanTarget.toLowerCase()) return false;

    const candWords = cleanCand.split(/\s+/).filter(Boolean).length;
    const candLen = cleanCand.length;

    // 1. Écart de nombre de mots <= ±1 mot
    if (Math.abs(candWords - targetWords) > 1) {
      return false;
    }

    // 2. Ratio de caractères compris à ±35 % de la cible (|candLen - targetLen| / targetLen <= 0.35)
    const charRatioDiff = Math.abs(candLen - targetLen) / targetLen;
    if (charRatioDiff > 0.35) {
      return false;
    }

    return true;
  });
};

