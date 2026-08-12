/**
 * Calcule le score global d'une Toada en fonction des sessions jouées.
 * Seules les sessions de thème "toadas" (ou "MIX" impliquant une Toada spécifique)
 * sont analysées. Pour l'instant, on se base sur `quizHistory` mais 
 * idéalement l'historique devrait stocker le `toadaId` de la session.
 * 
 * Barème :
 * - Découverte : < 34%
 * - Confirmé : 34% - 66%
 * - Mestre : > 66%
 */

export const calculateToadaScore = (toadaId, quizHistory = []) => {
  // Filtrer l'historique pour ne garder que les quiz concernant cette toada
  // Si le quizHistory contient une référence à toadaId
  const toadaSessions = quizHistory.filter(entry => entry.toadaId === toadaId);
  
  if (toadaSessions.length === 0) return { score: 0, level: 'À réviser', badge: '⚪' };

  // Prendre la meilleure session (ou la dernière)
  // On va prendre la meilleure session pour encourager l'élève
  let bestPercentage = 0;
  
  toadaSessions.forEach(session => {
    // Calcul du pourcentage brut (ex: 8/10 = 0.8)
    let rawPercentage = session.score / session.total;
    
    // Application du plafond de difficulté
    // easy -> max 0.33, medium -> max 0.66, hard -> max 1.0
    let cappedPercentage = rawPercentage;
    if (session.difficulty === 'easy') {
      cappedPercentage = Math.min(rawPercentage * 0.33, 0.33); // max 33% (1/3)
    } else if (session.difficulty === 'medium') {
      cappedPercentage = Math.min(rawPercentage * 0.66, 0.66); // max 66% (2/3)
    } else if (session.difficulty === 'hard') {
      cappedPercentage = rawPercentage; // max 100%
    }
    
    if (cappedPercentage > bestPercentage) {
      bestPercentage = cappedPercentage;
    }
  });

  const percentageInt = Math.round(bestPercentage * 100);

  let level = 'À réviser';
  let badge = '⚪';
  
  if (percentageInt > 0 && percentageInt <= 33) {
    level = 'Découverte';
    badge = '🌱';
  } else if (percentageInt > 33 && percentageInt <= 66) {
    level = 'Confirmé';
    badge = '🥁';
  } else if (percentageInt > 66) {
    level = 'Mestre';
    badge = '🏆';
  }

  return {
    score: percentageInt,
    level,
    badge
  };
};

/**
 * Calcule le score global de la Nação (moyenne de toutes les Toadas actives)
 */
export const calculateGlobalNacaoScore = (activeSongs = [], quizHistory = []) => {
  if (!activeSongs || activeSongs.length === 0) return 0;
  
  let totalScore = 0;
  activeSongs.forEach(song => {
    const toadaData = calculateToadaScore(song.id, quizHistory);
    totalScore += toadaData.score;
  });
  
  return Math.round(totalScore / activeSongs.length);
};

/**
 * Extrait la couleur Sémantique Cordel selon le score global
 */
export const getProgressColor = (scoreInt) => {
  if (scoreInt <= 33) return '#8b2a1a'; // --color-cordel-rouge
  if (scoreInt <= 66) return '#c05621'; // --color-cordel-ocre
  return '#2d6a4f'; // --color-cordel-vert
};
