/**
 * Moteur de Répétition Espacée (Spaced Repetition System)
 * Inspiré du système de Leitner / SuperMemo-2 simplifié.
 */

// Calcule la prochaine date de révision selon si la réponse est juste ou fausse
export const calculateNextReview = (isCorrect, currentConsecutiveCorrect = 0) => {
  const now = new Date();
  
  if (!isCorrect) {
    // En cas d'erreur, on retombe à 0 et on révise dès demain
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      consecutiveCorrect: 0,
      nextReview: tomorrow.toISOString(),
      lastAnswered: now.toISOString()
    };
  }

  // En cas de succès, on incrémente et on repousse exponentiellement (1, 2, 4, 8, 16 jours...)
  const newConsecutive = currentConsecutiveCorrect + 1;
  const daysToAdd = Math.pow(2, newConsecutive - 1);
  
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  return {
    consecutiveCorrect: newConsecutive,
    nextReview: nextDate.toISOString(),
    lastAnswered: now.toISOString()
  };
};

/**
 * Filtre et trie les questions pour générer la session du jour.
 * 
 * @param {Array} allPossibleQuestions - Toutes les questions générées par le quizGenerator
 * @param {Object} userSpacedRepetitionData - L'objet Firestore `spaced_repetition` de l'utilisateur
 * @param {number} limit - Nombre max de questions pour la session (défaut: 15)
 * @returns {Array} Les questions sélectionnées pour aujourd'hui
 */
export const getDailyRevisionSession = (allPossibleQuestions, userSpacedRepetitionData = {}, limit = 15) => {
  const now = new Date();
  
  // 1. Séparer en catégories
  const dueQuestions = [];       // À réviser (date passée)
  const newQuestions = [];       // Jamais vues
  const notDueQuestions = [];    // Déjà vues mais pas encore dues

  allPossibleQuestions.forEach(q => {
    const history = userSpacedRepetitionData[q.id];
    
    if (!history) {
      newQuestions.push(q);
    } else {
      const reviewDate = new Date(history.nextReview);
      if (reviewDate <= now) {
        dueQuestions.push({ ...q, historyScore: history.consecutiveCorrect });
      } else {
        notDueQuestions.push(q);
      }
    }
  });

  // 2. Trier les questions dues par urgence (celles avec le plus bas consecutiveCorrect d'abord, car plus fragiles)
  dueQuestions.sort((a, b) => a.historyScore - b.historyScore);

  // 3. Composer la session
  let session = [];
  
  // On prend d'abord les dues (jusqu'à la limite)
  if (dueQuestions.length > 0) {
    session = dueQuestions.slice(0, limit);
  }

  // S'il reste de la place, on complète avec des nouvelles questions (pour la découverte continue)
  if (session.length < limit && newQuestions.length > 0) {
    // Mélanger les nouvelles
    const shuffledNew = [...newQuestions].sort(() => Math.random() - 0.5);
    const missing = limit - session.length;
    session = [...session, ...shuffledNew.slice(0, missing)];
  }

  // S'il reste encore de la place (très rare, petit catalogue), on complète avec des pas dues
  if (session.length < limit && notDueQuestions.length > 0) {
    const shuffledNotDue = [...notDueQuestions].sort(() => Math.random() - 0.5);
    const missing = limit - session.length;
    session = [...session, ...shuffledNotDue.slice(0, missing)];
  }

  // 4. Mélanger le résultat final pour que l'ordre soit imprévisible
  return session.sort(() => Math.random() - 0.5);
};
