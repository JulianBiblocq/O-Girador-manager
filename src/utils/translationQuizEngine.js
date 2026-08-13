import { extractTranslationsForQuiz } from './translationExtractor';

// Mélange un tableau (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const generateTranslationQuiz = (config = {}) => {
  const { count = 10, direction = 'MIXED', categories = [], difficulty = 'medium', customDistractors = {} } = config;
  let dictionary = extractTranslationsForQuiz();

  // 1. Filtrer par catégories si spécifié
  if (categories && categories.length > 0) {
    dictionary = dictionary.filter(item => categories.includes(item.category));
  }

  // Sécurité si le dictionnaire est trop petit
  if (dictionary.length < 4) {
    console.warn("Pas assez de traductions pour générer un QCM valide.");
    return [];
  }

  // Mélanger le dictionnaire pour choisir les questions au hasard
  const selectedPairs = shuffleArray(dictionary).slice(0, Math.min(count, dictionary.length));

  const quiz = selectedPairs.map((pair, index) => {
    // Déterminer la direction de la question
    let currentDirection = direction;
    if (direction === 'MIXED') {
      currentDirection = Math.random() > 0.5 ? 'FR_PT' : 'PT_FR';
    }

    let prompt = '';
    let correctAnswer = '';
    let distractorsPool = [];

    if (currentDirection === 'FR_PT') {
      prompt = pair.fr;
      correctAnswer = pair.pt;
      // Les distracteurs doivent être d'autres traductions portugaises
      distractorsPool = dictionary.filter(d => d.key !== pair.key).map(d => d.pt);
    } else {
      prompt = pair.pt;
      correctAnswer = pair.fr;
      // Les distracteurs doivent être d'autres traductions françaises
      distractorsPool = dictionary.filter(d => d.key !== pair.key).map(d => d.fr);
    }

    // Ajouter les expressions manuelles personnalisées si elles existent
    if (customDistractors.expressionsTraduction?.length > 0) {
      distractorsPool = distractorsPool.concat(customDistractors.expressionsTraduction);
    }

    // Retirer les doublons potentiels et la bonne réponse
    distractorsPool = [...new Set(distractorsPool)].filter(d => d !== correctAnswer);

    // --- ALGORITHME DE SÉLECTION AVANCÉE DES DISTRACTEURS ---
    const targetTrimmed = correctAnswer.trim();
    const targetWordCount = targetTrimmed.split(/\s+/).length;
    const targetCharCount = targetTrimmed.length;
    const targetPrefix = targetTrimmed.substring(0, 1).toLowerCase();

    let diffLevel = difficulty?.toLowerCase() || 'medium';
    let selectedDistractors = [];

    // Utilitaire pour puiser dans les viviers de distracteurs par ordre de priorité
    const getDistractors = (pools) => {
      const result = [];
      for (const pool of pools) {
        const shuffled = shuffleArray(pool);
        for (const item of shuffled) {
          if (result.length >= 3) return result;
          if (!result.includes(item)) result.push(item);
        }
      }
      return result;
    };

    if (distractorsPool.length < 3) {
      selectedDistractors = distractorsPool;
    } else {
      if (diffLevel === 'expert' || diffLevel === 'mestre') {
        // --- MODE MESTRE (Expert) ---
        // Priorité 1 : Même nb mots, même préfixe, écart char < 15%
        const pool1 = distractorsPool.filter(dist => {
          const distTrim = dist.trim();
          const wordCount = distTrim.split(/\s+/).length;
          const prefix = distTrim.substring(0, 1).toLowerCase();
          const charDiffRatio = Math.abs(distTrim.length - targetCharCount) / targetCharCount;
          return wordCount === targetWordCount && prefix === targetPrefix && charDiffRatio <= 0.15;
        });

        // Priorité 2 : Conserver le même nombre de mots mais tolérer d'autres lettres de départ (écart < 25%)
        const pool2 = distractorsPool.filter(dist => {
          const distTrim = dist.trim();
          const wordCount = distTrim.split(/\s+/).length;
          const charDiffRatio = Math.abs(distTrim.length - targetCharCount) / targetCharCount;
          return wordCount === targetWordCount && charDiffRatio <= 0.25;
        });

        // Priorité 3 : Passer à ±1 mot
        const pool3 = distractorsPool.filter(dist => {
          const wordCount = dist.trim().split(/\s+/).length;
          return Math.abs(wordCount - targetWordCount) <= 1;
        });

        selectedDistractors = getDistractors([pool1, pool2, pool3, distractorsPool]);

      } else if (diffLevel === 'easy' || diffLevel === 'découverte') {
        // --- MODE DÉCOUVERTE (Easy) ---
        // Priorité 1 : Écart de ±2 à ±3 mots, et première lettre différente
        const pool1 = distractorsPool.filter(dist => {
          const distTrim = dist.trim();
          const wordCount = distTrim.split(/\s+/).length;
          const prefix = distTrim.substring(0, 1).toLowerCase();
          const diff = Math.abs(wordCount - targetWordCount);
          return (diff >= 2 && diff <= 3) && prefix !== targetPrefix;
        });

        // Priorité 2 : Écart de ±2 à ±3 mots, peu importe la lettre
        const pool2 = distractorsPool.filter(dist => {
          const wordCount = dist.trim().split(/\s+/).length;
          const diff = Math.abs(wordCount - targetWordCount);
          return diff >= 2 && diff <= 3;
        });
        
        // Priorité 3 : Plus de 1 mot de différence (plus large)
        const pool3 = distractorsPool.filter(dist => {
          const wordCount = dist.trim().split(/\s+/).length;
          return Math.abs(wordCount - targetWordCount) >= 1;
        });

        selectedDistractors = getDistractors([pool1, pool2, pool3, distractorsPool]);

      } else {
        // --- MODE CONFIRMÉ (Medium) ---
        // Priorité 1 : ±1 mot de différence, longueur globale similaire (écart < 40%)
        const pool1 = distractorsPool.filter(dist => {
          const distTrim = dist.trim();
          const wordCount = distTrim.split(/\s+/).length;
          const charDiffRatio = Math.abs(distTrim.length - targetCharCount) / targetCharCount;
          return Math.abs(wordCount - targetWordCount) <= 1 && charDiffRatio <= 0.40;
        });

        // Priorité 2 : ±1 mot de différence (sans critère strict de caractères)
        const pool2 = distractorsPool.filter(dist => {
          const wordCount = dist.trim().split(/\s+/).length;
          return Math.abs(wordCount - targetWordCount) <= 1;
        });
        
        // Priorité 3 : ±2 mots de différence
        const pool3 = distractorsPool.filter(dist => {
          const wordCount = dist.trim().split(/\s+/).length;
          return Math.abs(wordCount - targetWordCount) <= 2;
        });

        selectedDistractors = getDistractors([pool1, pool2, pool3, distractorsPool]);
      }
    }

    // Mélanger les options (1 correcte + 3 fausses)
    const options = shuffleArray([
      { text: correctAnswer, isCorrect: true },
      ...selectedDistractors.map(d => ({ text: d, isCorrect: false }))
    ]);

    return {
      id: `trans_${pair.key}_${index}`,
      type: 'translation',
      prompt: `Traduis : "${prompt}"`,
      correctAnswer: correctAnswer,
      options: options.map(o => o.text), // Retourne juste les textes si l'UI n'a pas besoin de savoir qui est true, mais pour valider on peut garder l'objet complet
      choices: options, // Formater compatible avec AutoEvalQuiz existant
      direction: currentDirection,
      category: pair.category
    };
  });

  return quiz;
};
