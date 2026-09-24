/**
 * Moteur algorithmique du Défi Réflexe « Temps 1 » (Simulateur de Conventions).
 * Gère le calcul des temps d'arrêt précis au temps 1 de la mesure N+1,
 * l'extraction de la tablature pour chaque pupitre et la génération
 * dynamique de leurres rythmiques réalistes.
 */

import { normalizeString } from './repertoireMatcher.js';

/**
 * Motifs canoniques de référence pour chaque pupitre du Maracatu de Baque Virado.
 * Utilisés en repli et pour la génération de leurres alternatifs cohérents.
 */
export const CANONICAL_PUPITRE_PATTERNS = {
  caixa: [
    ['X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X', '-', 'X', 'X', '-', 'X', 'X', '-'],
    ['X', 'X', 'X', 'X', '-', '-', 'X', 'X', 'X', 'X', '-', '-', 'X', '-', 'X', '-'],
    ['-', 'X', '-', 'X', 'X', '-', 'X', '-', '-', 'X', '-', 'X', 'X', '-', 'X', '-']
  ],
  tarol: [
    ['X', 'X', '-', 'X', 'X', '-', 'X', 'X', 'X', 'X', '-', 'X', 'X', '-', 'X', 'X'],
    ['X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X', '-', 'X', 'X', '-', 'X', 'X', '-'],
    ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-', '-', 'X', 'X', 'X', '-', 'X', '-']
  ],
  gongue: [
    ['X', '-', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', '-', '-'],
    ['X', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', 'X', '-', '-', 'X', '-', '-'],
    ['X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', 'X', '-']
  ],
  alfaia: [
    ['X', '-', '-', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', '-', '-'],
    ['X', '-', 'X', '-', '-', '-', 'X', '-', 'X', '-', 'X', '-', '-', '-', 'X', '-'],
    ['-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', 'X', '-', 'X', '-']
  ],
  marcante: [
    ['X', '-', '-', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', '-', '-'],
    ['X', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', '-', '-'],
    ['X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-']
  ],
  agbe: [
    ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    ['X', '-', 'X', 'X', 'X', '-', 'X', 'X', 'X', '-', 'X', 'X', 'X', '-', 'X', 'X'],
    ['-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X']
  ],
  mineiro: [
    ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    ['X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-'],
    ['X', 'X', '-', 'X', 'X', 'X', '-', 'X', 'X', 'X', '-', 'X', 'X', 'X', '-', 'X']
  ],
  timbal: [
    ['X', '-', 'X', '-', '-', 'X', 'X', '-', 'X', '-', 'X', '-', '-', 'X', 'X', '-'],
    ['X', 'X', '-', 'X', '-', 'X', '-', '-', 'X', 'X', '-', 'X', '-', 'X', '-', '-'],
    ['X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', 'X', '-']
  ],
  default: [
    ['X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-'],
    ['X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-'],
    ['-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X']
  ]
};

/**
 * Compare l'égalité de deux séquences rythmiques.
 */
export const arePatternsEqual = (p1, p2) => {
  if (!Array.isArray(p1) || !Array.isArray(p2)) return false;
  if (p1.length !== p2.length) return false;
  for (let i = 0; i < p1.length; i++) {
    const v1 = p1[i] === 0 || p1[i] === '0' || p1[i] === '' || p1[i] == null ? '-' : String(p1[i]);
    const v2 = p2[i] === 0 || p2[i] === '0' || p2[i] === '' || p2[i] == null ? '-' : String(p2[i]);
    if (v1 !== v2) return false;
  }
  return true;
};

/**
 * Renvoie un motif canonique pour un instrument donné.
 */
export function getCanonicalPupitrePattern(instrumentKey, variant = 0) {
  const norm = normalizeString(instrumentKey);
  const foundKey = Object.keys(CANONICAL_PUPITRE_PATTERNS).find((k) => norm.includes(k));
  const list = foundKey ? CANONICAL_PUPITRE_PATTERNS[foundKey] : CANONICAL_PUPITRE_PATTERNS.default;
  const idx = Math.abs(variant) % list.length;
  return [...list[idx]];
}

/**
 * Calcule avec précision chronométrique les points d'arrêt au temps 1
 * pour chaque signal du Mestre présent dans le morceau.
 *
 * @param {Object} pieceData - Données du morceau du Répertoire
 * @param {Object} presetData - Données techniques vivantes du Preset Séquenceur
 * @returns {Array<Object>} Liste des points d'arrêt et de quiz
 */
export function calculatePauseTimes(pieceData, presetData) {
  const rawSinais = (Array.isArray(presetData?.sinaisDoMestre) && presetData.sinaisDoMestre.length > 0)
    ? presetData.sinaisDoMestre
    : (presetData?.parsedData?.sinaisDoMestre || pieceData?.sinaisDoMestre || pieceData?.activeSinaisDoMestre || []);

  if (!Array.isArray(rawSinais) || rawSinais.length === 0) {
    return [];
  }

  // Tri chronologique des signaux par numéro de mesure
  const sortedSignals = [...rawSinais].sort((a, b) => {
    const ma = Number(a.mesure ?? a.bar ?? a.barIndex ?? 1);
    const mb = Number(b.mesure ?? b.bar ?? b.barIndex ?? 1);
    return ma - mb;
  });

  const nominalBpm = Number(presetData?.bpm || presetData?.parsedData?.bpm || pieceData?.bpm || 120);
  const beatsPerMeasure = 4;
  const measureBpms = presetData?.measureBpms || presetData?.parsedData?.measureBpms || {};
  const overrides = pieceData?.signalOverrides || {};

  // Calculateur de durée d'une mesure (en secondes)
  const getMeasureDuration = (mIndex) => {
    const bpm = Number(measureBpms[mIndex] || nominalBpm) || 120;
    return (beatsPerMeasure * 60) / bpm;
  };

  // Somme cumulative des durées de la mesure 1 à la mesure targetIndex
  const getTimestampAtMeasureStart = (targetMeasureIndex) => {
    let acc = 0;
    for (let m = 0; m < targetMeasureIndex; m++) {
      acc += getMeasureDuration(m);
    }
    return acc;
  };

  return sortedSignals.map((s, idx) => {
    const n = Math.max(1, parseInt(s.mesure ?? s.bar ?? s.barIndex ?? (idx + 1), 10));
    const signalId = s.id || `mesure_${n}`;
    const override = overrides[signalId] || {};

    // Début de l'annonce du geste (mesure N, soit index n - 1)
    const announcementStartTime = getTimestampAtMeasureStart(n - 1);

    // Début de la mesure N+1 (temps 1 où l'audio doit se couper, soit index n)
    const pauseTime = getTimestampAtMeasureStart(n);

    // Mode : interactif (pause + quiz) ou simple repère visuel
    const isInteractive = override.isInteractive !== undefined 
      ? Boolean(override.isInteractive) 
      : override.mode ? override.mode !== 'repere' : true;

    return {
      signalId,
      name: s.nom || s.name || s.signe || `Signal Mesure ${n}`,
      mesure: n,
      targetMeasure: n + 1,
      targetMeasureIndex: n, // 0-indexed pour la mesure N+1
      announcementStartTime,
      pauseTime,
      isInteractive,
      override,
      signal: s
    };
  });
}

/**
 * Isole la séquence de 16 frappes (activeSteps) pour un instrument donné
 * sur la mesure ciblée (measureIndex, 0-indexed).
 *
 * @param {Object} presetData - Objet preset ou parsedData
 * @param {string} instrumentKey - Nom ou clé de l'instrument (ex: "caixa", "alfaia")
 * @param {number} measureIndex - Index de la mesure (0-indexed)
 * @returns {Array<string>} Tableau de 16 pas formatés (ex: ['X', '-', 'X', ...])
 */
export function extractPupitrePattern(presetData, instrumentKey = 'caixa', measureIndex = 0) {
  const normKey = normalizeString(instrumentKey);
  const tracks = presetData?.tracks || presetData?.parsedData?.tracks || [];

  let matchedTrack = null;
  if (Array.isArray(tracks) && tracks.length > 0) {
    matchedTrack = tracks.find((t) => {
      const tName = normalizeString(t.name || t.customName || t.instrument);
      const tId = normalizeString(t.instrumentId || t.id);
      return tName.includes(normKey) || tId.includes(normKey);
    });
  }

  if (matchedTrack) {
    // 1. Recherche dans les motifs assignés par mesure
    if (Array.isArray(matchedTrack.patterns)) {
      const activePat = matchedTrack.patterns.find((p) => {
        if (!p || !p.measureAssignments) return false;
        return Boolean(p.measureAssignments[measureIndex]);
      });
      if (activePat && (activePat.activeSteps || activePat.steps)) {
        const raw = activePat.activeSteps || activePat.steps;
        return normalizeStepsArray(raw);
      }
    }

    // 2. Recherche dans le tableau des mesures
    if (Array.isArray(matchedTrack.measures) && matchedTrack.measures[measureIndex]) {
      const raw = matchedTrack.measures[measureIndex].steps || matchedTrack.measures[measureIndex];
      return normalizeStepsArray(raw);
    }

    // 3. Recherche dans le flux continu de pas (16 pas par mesure)
    if (Array.isArray(matchedTrack.steps) && matchedTrack.steps.length > 0) {
      const sliceStart = measureIndex * 16;
      const raw = matchedTrack.steps.slice(sliceStart, sliceStart + 16);
      if (raw.length > 0) {
        return normalizeStepsArray(raw);
      }
    }
  }

  // Repli intelligent : motif canonique de l'instrument
  return getCanonicalPupitrePattern(instrumentKey, measureIndex);
}

/**
 * Normalise un tableau de pas brut en tableau strict de 16 caractères ('X' ou '-').
 */
function normalizeStepsArray(rawSteps) {
  const safe = Array.isArray(rawSteps) ? rawSteps : [];
  const result = [];
  const len = Math.min(16, safe.length || 16);

  for (let i = 0; i < 16; i++) {
    if (i < safe.length) {
      const v = Array.isArray(safe[i]) ? safe[i][0] : safe[i];
      if (v === 0 || v === '0' || v === '' || v == null || v === '-') {
        result.push('-');
      } else {
        result.push(String(v));
      }
    } else {
      result.push('-');
    }
  }
  return result;
}

/**
 * Génère 3 leurres rythmiques réalistes et plausibles pour le quiz :
 * 1) La phrase de la mesure précédente (piège d'inattention classique).
 * 2) Une phrase alternative du même pupitre issue du catalogue.
 * 3) Une micro-variation rythmique (décalage subtil d'une frappe).
 *
 * @param {Array<string>} correctPattern - Bonne tablature attendue
 * @param {Object} presetData - Données du preset
 * @param {string} instrumentKey - Pupitre sélectionné
 * @param {Array} [allPatterns] - Catalogue de motifs existants
 * @param {Object} [overrides] - Surcharge Mestre éventuelle
 * @param {number} [measureIndex] - Index de la mesure ciblée
 * @returns {Array<Array<string>>} Tableau des 3 leurres
 */
export function generateDistractors(
  correctPattern,
  presetData,
  instrumentKey = 'caixa',
  allPatterns = [],
  overrides = null,
  measureIndex = 0
) {
  // Respect des leurres verrouillés par le Mestre
  if (Array.isArray(overrides?.distractors) && overrides.distractors.length === 3) {
    return overrides.distractors.map(normalizeStepsArray);
  }

  const safeCorrect = normalizeStepsArray(correctPattern);
  const distractors = [];

  // --- LEURRE 1 : Phrase de la mesure précédente (Piège d'inattention) ---
  let d1 = null;
  if (measureIndex > 0) {
    const prevPattern = extractPupitrePattern(presetData, instrumentKey, measureIndex - 1);
    if (!arePatternsEqual(prevPattern, safeCorrect)) {
      d1 = prevPattern;
    }
  }
  if (!d1) {
    // Si identique ou mesure 0, prendre une variante canonique
    d1 = getCanonicalPupitrePattern(instrumentKey, 1);
    if (arePatternsEqual(d1, safeCorrect)) {
      d1 = getCanonicalPupitrePattern(instrumentKey, 2);
    }
  }
  distractors.push(d1);

  // --- LEURRE 2 : Phrase alternative du même pupitre dans le catalogue ---
  let d2 = null;
  if (Array.isArray(allPatterns) && allPatterns.length > 0) {
    const candidate = allPatterns.find((p) => {
      const pSteps = normalizeStepsArray(p.steps || p.activeSteps || p);
      return !arePatternsEqual(pSteps, safeCorrect) && !arePatternsEqual(pSteps, d1);
    });
    if (candidate) {
      d2 = normalizeStepsArray(candidate.steps || candidate.activeSteps || candidate);
    }
  }
  if (!d2) {
    d2 = getCanonicalPupitrePattern(instrumentKey, 2);
    if (arePatternsEqual(d2, safeCorrect) || arePatternsEqual(d2, d1)) {
      // Inverser les temps 1 et 3
      d2 = [...safeCorrect];
      d2[0] = d2[0] === '-' ? 'X' : '-';
      d2[8] = d2[8] === '-' ? 'X' : '-';
    }
  }
  distractors.push(d2);

  // --- LEURRE 3 : Micro-variation rythmique (décalage subtil de frappe) ---
  const d3 = [...safeCorrect];
  let mutated = false;
  // Chercher une frappe active et la décaler d'une double-croche
  for (let i = 1; i < 15; i++) {
    if (d3[i] !== '-' && d3[i + 1] === '-') {
      d3[i] = '-';
      d3[i + 1] = 'X';
      mutated = true;
      break;
    }
  }
  if (!mutated) {
    // Décaler le temps 2 ou 4
    d3[4] = d3[4] === '-' ? 'X' : '-';
    d3[12] = d3[12] === '-' ? 'X' : '-';
  }
  // S'assurer que d3 est bien distinct
  if (arePatternsEqual(d3, safeCorrect) || arePatternsEqual(d3, d1) || arePatternsEqual(d3, d2)) {
    d3[0] = d3[0] === '-' ? 'X' : '-';
    d3[2] = d3[2] === '-' ? 'X' : '-';
  }
  distractors.push(d3);

  return distractors;
}

/**
 * Construit et mélange les 4 propositions pour le quiz réflexe (1 bonne + 3 leurres).
 *
 * @param {Array<string>} correctPattern - Bonne tablature
 * @param {Array<Array<string>>} distractors - Les 3 leurres
 * @returns {Array<Object>} 4 cartes mélangées prêtes à l'affichage
 */
export function buildQuizOptions(correctPattern, distractors = []) {
  const options = [
    { id: 'correct', pattern: correctPattern, isCorrect: true },
    { id: 'distractor_0', pattern: distractors[0] || getCanonicalPupitrePattern('default', 1), isCorrect: false },
    { id: 'distractor_1', pattern: distractors[1] || getCanonicalPupitrePattern('default', 2), isCorrect: false },
    { id: 'distractor_2', pattern: distractors[2] || getCanonicalPupitrePattern('default', 0), isCorrect: false }
  ];

  // Mélange aléatoire (Fisher-Yates)
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}
