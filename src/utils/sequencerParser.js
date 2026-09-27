/**
 * Parseur pour extraire les métadonnées pédagogiques depuis le JSON du séquenceur.
 * Utilisé par le module Mon Parcours (Élève) et le Fallback Mestre.
 */

export const parseSequencerJson = (jsonData) => {
  if (!jsonData) return { baguettes: null, unisonAlfaias: null };

  let baguettes = null;
  let unisonAlfaias = null;

  // 1. Analyse de la section info (prioritaire si explicitement défini)
  if (jsonData.info) {
    if (jsonData.info.baguettes) {
      baguettes = jsonData.info.baguettes;
    }
    if (jsonData.info.unisonAlfaias !== undefined) {
      unisonAlfaias = Boolean(jsonData.info.unisonAlfaias);
    }
  }

  // 2. Détection automatique du matériel (Bacalhau), instruments présents et patterns rythmiques
  let instrumentsPresents = [];
  let patterns = [];
  
  if (Array.isArray(jsonData.tracks)) {
    const instrumentsSet = new Set();
    let hasBacalhau = false;
    
    jsonData.tracks.forEach(track => {
      let trackName = (track.name || track.instrument || '').trim();
      if (trackName.toLowerCase().includes('bacalhau')) {
        hasBacalhau = true;
      }
      
      if (trackName) {
        // Clean up names like "Alfaia 1", "Caixa 2" -> "Alfaia", "Caixa"
        let cleanName = trackName.replace(/\s+\d+$/, '').trim();
        // Formater to capitalize first letter
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
        instrumentsSet.add(cleanName);
        
        // Extraire le pattern (les pas) pour ce track s'il existe
        if (Array.isArray(track.steps) && track.steps.length > 0) {
          patterns.push({
            instrumentName: trackName,
            cleanName: cleanName,
            steps: track.steps
          });
        }
      }
    });

    instrumentsPresents = Array.from(instrumentsSet);

    if (hasBacalhau && !baguettes) {
      baguettes = '1 grosse baguette + 1 bacalhau';
    } else if (!baguettes) {
      const sticksCheck = detectAlfaiaSticks(jsonData);
      if (sticksCheck.hasBacalhau) {
        baguettes = '1 grosse mailloche + 1 bacalhau';
      }
    }
  }

  return { baguettes, unisonAlfaias, instrumentsPresents, patterns };
};

/**
 * Détection binaire du matériel et des baguettes d'Alfaia.
 * Analyse la chaîne des pas actifs (activeSteps ou notation texte) des pistes Alfaia du morceau.
 * - Si le caractère 'I' ou 'i' apparaît au moins une fois : bonne réponse « 1 grosse mailloche + 1 bacalhau » (distracteur : « 2 grosses mailloches »)
 * - S'il n'y a aucun 'I' : bonne réponse « 2 grosses mailloches » (distracteur : « 1 grosse mailloche + 1 bacalhau »)
 * Génère automatiquement la question matériel associée pour ce morceau.
 *
 * @param {Object|Array|string} alfaiaTrackData - Données des pistes Alfaia ou objet preset
 * @param {Object} [options] - Options complémentaires (titre, t, pieceId)
 * @returns {{ hasBacalhau: boolean, correctAnswer: string, bonneReponse: string, wrongAnswer: string, distracteur: string, question: Object }}
 */
export const detectAlfaiaSticks = (alfaiaTrackData, options = {}) => {
  let hasI = false;

  const checkStepsValue = (val) => {
    if (val == null) return false;
    if (typeof val === 'string') {
      return /[Ii]/.test(val);
    }
    if (Array.isArray(val)) {
      return val.some(checkStepsValue);
    }
    if (typeof val === 'object') {
      if (val.activeSteps) return checkStepsValue(val.activeSteps);
      if (val.steps) return checkStepsValue(val.steps);
      if (val.patterns) return checkStepsValue(val.patterns);
      if (val.measures) return checkStepsValue(val.measures);
    }
    return false;
  };

  const inspectTrack = (track) => {
    if (!track) return false;
    if (Array.isArray(track)) return checkStepsValue(track);
    if (typeof track === 'string') return /[Ii]/.test(track);
    if (typeof track === 'object') {
      if (track.activeSteps && checkStepsValue(track.activeSteps)) return true;
      if (track.steps && checkStepsValue(track.steps)) return true;
      if (Array.isArray(track.patterns)) {
        for (const pat of track.patterns) {
          if (pat && (checkStepsValue(pat.activeSteps) || checkStepsValue(pat.steps))) return true;
        }
      }
      if (Array.isArray(track.measures)) {
        for (const m of track.measures) {
          if (m && (checkStepsValue(m.steps) || checkStepsValue(m.activeSteps) || checkStepsValue(m))) return true;
        }
      }
      if (track.notation && typeof track.notation === 'string' && /[Ii]/.test(track.notation)) return true;
    }
    return false;
  };

  if (alfaiaTrackData) {
    if (typeof alfaiaTrackData === 'string') {
      hasI = /[Ii]/.test(alfaiaTrackData);
    } else if (Array.isArray(alfaiaTrackData)) {
      const isTrackList = alfaiaTrackData.some(item => item && typeof item === 'object' && (item.name || item.instrument || item.activeSteps || item.steps));
      if (isTrackList) {
        const alfaiaTracks = alfaiaTrackData.filter(t => {
          const name = (t.name || t.instrument || t.customName || t.instrumentId || '').toLowerCase();
          return name.includes('alfaia');
        });
        const targets = alfaiaTracks.length > 0 ? alfaiaTracks : alfaiaTrackData;
        hasI = targets.some(inspectTrack);
      } else {
        hasI = alfaiaTrackData.some(checkStepsValue);
      }
    } else if (typeof alfaiaTrackData === 'object') {
      const tracks = alfaiaTrackData.tracks || alfaiaTrackData.parsedData?.tracks || alfaiaTrackData.parsedSequencerData?.tracks;
      if (Array.isArray(tracks)) {
        const alfaiaTracks = tracks.filter(t => {
          const name = (t.name || t.instrument || t.customName || t.instrumentId || '').toLowerCase();
          return name.includes('alfaia');
        });
        const targets = alfaiaTracks.length > 0 ? alfaiaTracks : tracks;
        hasI = targets.some(inspectTrack);
      } else {
        hasI = inspectTrack(alfaiaTrackData);
      }
    }
  }

  const correctAnswer = hasI ? '1 grosse mailloche + 1 bacalhau' : '2 grosses mailloches';
  const wrongAnswer = hasI ? '2 grosses mailloches' : '1 grosse mailloche + 1 bacalhau';

  const pieceTitle = options.pieceTitle || options.titre || '';
  const questionText = pieceTitle
    ? `Quelles baguettes ou mailloches utilise-t-on pour jouer "${pieceTitle}" à l'Alfaia ?`
    : `Quelles baguettes ou mailloches utilise-t-on pour jouer ce morceau à l'Alfaia ?`;

  const choices = [
    { text: correctAnswer, isCorrect: true },
    { text: wrongAnswer, isCorrect: false }
  ].sort(() => Math.random() - 0.5);

  const question = {
    id: options.id || `qcm_materiel_alfaia_${options.pieceId || 'piece'}`,
    type: 'materiel_alfaia',
    instruction: options.t ? options.t('pedagogyQuiz.alfaiaSticksInstruction', 'Matériel & Baguettes') : 'Matériel & Baguettes',
    questionText: options.t ? options.t('pedagogyQuiz.alfaiaSticksQuestion', questionText, { pieceTitle }) : questionText,
    choices,
    correctAnswer,
    correctAnswerExplanation: `Pour ce morceau, l'Alfaia se joue avec ${correctAnswer.toLowerCase()}.`,
    feedback: `Exact ! Pour ce morceau, l'Alfaia se joue avec ${correctAnswer.toLowerCase()}.`
  };

  return {
    hasBacalhau: hasI,
    correctAnswer,
    bonneReponse: correctAnswer,
    wrongAnswer,
    distracteur: wrongAnswer,
    question
  };
};

