/**
 * Moteur algorithmique du jeu du « Conducteur à trous ».
 * Prépare la frise chronologique, résout les signaux du Mestre par mesure
 * et génère pour chaque case un ensemble équilibré de 4 choix (le bon signal + 3 leurres).
 */

import { normalizeString } from './repertoireMatcher.js';

/**
 * Signaux de référence universels du Maracatu de Baque Virado
 * utilisés pour compléter la bibliothèque et garantir un pool suffisant de leurres.
 */
export const DEFAULT_MESTRE_SIGNALS = [
  { id: 'sig_depart', name: 'Appel de départ', gestureType: 'depart', imageUrl: null },
  { id: 'sig_virada_1', name: 'Appel Virada 1', gestureType: 'virada', imageUrl: null },
  { id: 'sig_virada_2', name: 'Appel Virada 2', gestureType: 'virada', imageUrl: null },
  { id: 'sig_parada', name: 'Parada / Break', gestureType: 'parada', imageUrl: null },
  { id: 'sig_reprise', name: 'Reprise de Baque', gestureType: 'reprise', imageUrl: null },
  { id: 'sig_arret', name: 'Coupure finale', gestureType: 'arret', imageUrl: null },
  { id: 'sig_accel', name: 'Accélération', gestureType: 'tempo', imageUrl: null },
  { id: 'sig_coro', name: 'Appel Voix / Toada', gestureType: 'voix', imageUrl: null }
];

/**
 * Mélange aléatoire d'un tableau (Fisher-Yates).
 */
export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Extrait le défi du conducteur pour un morceau et prépare les slots de la timeline.
 *
 * @param {Object} pieceData - Morceau du Répertoire
 * @param {Object} presetData - Preset vivant associé (optionnel)
 * @param {Array<Object>} allSignalsCatalog - Catalogue des signaux mestre_signals
 * @returns {Object} Défi prêt pour le composant de jeu
 */
export function extractConductorChallenge(pieceData, presetData, allSignalsCatalog = []) {
  // 1. Récupération des signaux chronologiques
  const rawSinais = (Array.isArray(presetData?.sinaisDoMestre) && presetData.sinaisDoMestre.length > 0)
    ? presetData.sinaisDoMestre
    : (presetData?.parsedData?.sinaisDoMestre || pieceData?.sinaisDoMestre || pieceData?.activeSinaisDoMestre || []);

  const safeSignals = Array.isArray(rawSinais) ? rawSinais : [];

  // 2. Fusion du catalogue de signaux avec les fallbacks Maracatu
  const signalMap = new Map();
  (allSignalsCatalog || []).forEach((sig) => {
    if (sig && (sig.id || sig.name)) {
      const key = sig.id || normalizeString(sig.name);
      signalMap.set(key, {
        id: sig.id || key,
        name: sig.name || sig.nom || 'Signal',
        imageUrl: sig.imageUrl || null,
        description: sig.description || ''
      });
    }
  });

  DEFAULT_MESTRE_SIGNALS.forEach((sig) => {
    const key = sig.id;
    if (!signalMap.has(key) && !signalMap.has(normalizeString(sig.name))) {
      signalMap.set(key, sig);
    }
  });

  const fullCatalog = Array.from(signalMap.values());

  // 3. Normalisation et dédoublonnage des signaux par mesure
  const signalsByMeasureMap = new Map();
  safeSignals.forEach((s, idx) => {
    const m = Math.max(1, parseInt(s.mesure ?? s.bar ?? s.barIndex ?? (idx + 1), 10));
    if (!signalsByMeasureMap.has(m)) {
      const sName = s.nom || s.name || s.signe || s.label || `Signal Mesure ${m}`;
      const normName = normalizeString(sName);

      // Résolution du signal dans le catalogue pour récupérer l'imageUrl si dispo
      const matchedFromCatalog = fullCatalog.find((cat) => {
        if (s.id && cat.id === s.id) return true;
        if (s.signalId && cat.id === s.signalId) return true;
        return normalizeString(cat.name) === normName;
      });

      const targetSignal = {
        id: matchedFromCatalog?.id || s.id || `sig_m${m}`,
        name: matchedFromCatalog?.name || sName,
        imageUrl: matchedFromCatalog?.imageUrl || s.imageUrl || null
      };

      signalsByMeasureMap.set(m, targetSignal);
    }
  });

  // Tri chronologique des mesures
  const sortedMeasures = Array.from(signalsByMeasureMap.keys()).sort((a, b) => a - b);

  // 4. Pour chaque mesure cible, construction des 4 choix (1 vrai + 3 leurres)
  const slots = sortedMeasures.map((mesure) => {
    const targetSignal = signalsByMeasureMap.get(mesure);
    const targetNorm = normalizeString(targetSignal.name);

    // Candidats leurres : signaux distincts du bon signal
    const candidates = fullCatalog.filter((c) => {
      if (c.id === targetSignal.id) return false;
      if (normalizeString(c.name) === targetNorm) return false;
      return true;
    });

    const shuffledCandidates = shuffleArray(candidates);
    const distractors = shuffledCandidates.slice(0, 3);

    // Si moins de 3 candidats, compléter avec des signaux de repli
    while (distractors.length < 3) {
      const filler = DEFAULT_MESTRE_SIGNALS.find(
        (f) => f.id !== targetSignal.id && !distractors.some((d) => d.id === f.id)
      );
      if (filler) distractors.push(filler);
      else break;
    }

    const options = shuffleArray([targetSignal, ...distractors]);

    return {
      slotId: `slot_m${mesure}`,
      mesure,
      targetSignal,
      options
    };
  });

  // Indexation par mesure pour un accès direct O(1)
  const slotsByMeasure = {};
  slots.forEach((s) => {
    slotsByMeasure[s.mesure] = s;
  });

  // 5. Calcul de l'envergure totale de la timeline (en nombre de mesures)
  // Analyse des pistes du preset pour connaître la longueur réelle du morceau
  const tracks = presetData?.tracks || presetData?.parsedData?.tracks || [];
  let trackMaxMeasure = 0;
  tracks.forEach((t) => {
    if (Array.isArray(t.patterns)) {
      t.patterns.forEach((p) => {
        if (p?.measureAssignments) {
          Object.keys(p.measureAssignments).forEach((mIdx) => {
            const mNum = Number(mIdx) + 1;
            if (mNum > trackMaxMeasure) trackMaxMeasure = mNum;
          });
        }
      });
    }
    if (Array.isArray(t.measures)) {
      if (t.measures.length > trackMaxMeasure) trackMaxMeasure = t.measures.length;
    }
    if (Array.isArray(t.steps) && t.steps.length > 0) {
      const stepsCount = Math.ceil(t.steps.length / 16);
      if (stepsCount > trackMaxMeasure) trackMaxMeasure = stepsCount;
    }
  });

  const maxMeasureFound = sortedMeasures.length > 0 ? sortedMeasures[sortedMeasures.length - 1] : 0;
  const totalMeasures = Math.max(16, maxMeasureFound > 0 ? maxMeasureFound + 2 : 16, trackMaxMeasure);
  const nominalBpm = Number(presetData?.bpm || presetData?.parsedData?.bpm || pieceData?.bpm || 120);

  return {
    slots,
    slotsByMeasure,
    totalMeasures,
    totalSignals: slots.length,
    nominalBpm,
    audioUrl: pieceData?.activeAudioUrl || pieceData?.audioUrl || pieceData?.preset?.audioUrl || presetData?.audioUrl || null
  };
}
