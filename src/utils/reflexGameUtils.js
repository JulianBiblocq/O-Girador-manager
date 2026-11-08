/**
 * Moteur algorithmique du Défi Réflexe « Temps 1 » (< 130 lignes).
 * Calcule T_pause au temps 1 de la mesure N+1, respecte signalOverrides (mode 'cueOnly' / 'repere'),
 * ignore l'arrêt si le motif du pupitre à N+1 est vide et génère 3 leurres plausibles.
 */

import {
  CANONICAL_PUPITRE_PATTERNS,
  arePatternsEqual,
  getCanonicalPupitrePattern,
  normalizeStepsArray,
  findExplicitTrackSteps
} from './reflexPatternCatalog.js';

export { CANONICAL_PUPITRE_PATTERNS, arePatternsEqual, getCanonicalPupitrePattern, normalizeStepsArray };

export function isPupitreMeasureEmpty(presetData, instrumentKey = 'caixa', measureIndex = 0) {
  const { hasTrack, steps } = findExplicitTrackSteps(presetData, instrumentKey, measureIndex);
  if (!hasTrack || !Array.isArray(steps)) return false;
  return steps.every((s) => s === '-');
}

export function extractPupitrePattern(presetData, instrumentKey = 'caixa', measureIndex = 0) {
  const { hasTrack, steps } = findExplicitTrackSteps(presetData, instrumentKey, measureIndex);
  if (hasTrack && Array.isArray(steps) && steps.some((s) => s !== '-')) return steps;
  return getCanonicalPupitrePattern(instrumentKey, measureIndex);
}

/**
 * Calcule T_pause = sum_{m=1..N} ((60 / BPM_m) * temps par mesure) pour chaque signal.
 * Ignore l'arrêt si signalOverrides marque mode: 'cueOnly' / 'repere' ou si le motif N+1 du pupitre est vide.
 */
export function calculatePauseTimes(pieceData, presetData, pupitre = null) {
  const rawSinais = (Array.isArray(presetData?.sinaisDoMestre) && presetData.sinaisDoMestre.length > 0)
    ? presetData.sinaisDoMestre
    : (presetData?.parsedData?.sinaisDoMestre || pieceData?.sinaisDoMestre || pieceData?.activeSinaisDoMestre || []);
  if (!Array.isArray(rawSinais) || rawSinais.length === 0) return [];

  const sortedSignals = [...rawSinais].sort((a, b) => Number(a.mesure ?? a.bar ?? a.barIndex ?? 1) - Number(b.mesure ?? b.bar ?? b.barIndex ?? 1));
  const nominalBpm = Number(presetData?.bpm || presetData?.parsedData?.bpm || pieceData?.bpm || 120) || 120;
  const beatsPerMeasure = Number(presetData?.beatsPerMeasure || presetData?.parsedData?.beatsPerMeasure || 4) || 4;
  const measureBpms = presetData?.measureBpms || presetData?.parsedData?.measureBpms || {};
  const expandedMeasures = presetData?.expandedMeasures || presetData?.parsedData?.expandedMeasures || [];
  const overrides = pieceData?.signalOverrides || {};

  const getMeasureDuration = (measure1Based) => {
    const idx0 = measure1Based - 1;
    const rawBpm = Array.isArray(measureBpms) ? measureBpms[idx0] : (measureBpms[measure1Based] ?? measureBpms[idx0]);
    const bpm = Number(rawBpm ?? expandedMeasures[idx0]?.bpm ?? nominalBpm) || 120;
    return (60 / bpm) * beatsPerMeasure;
  };

  const sumMeasuresUntil = (countMeasures) => {
    let acc = 0;
    for (let m = 1; m <= countMeasures; m++) acc += getMeasureDuration(m);
    return Number(acc.toFixed(4));
  };

  return sortedSignals.map((s, idx) => {
    const n = Math.max(1, parseInt(s.mesure ?? s.bar ?? s.barIndex ?? (idx + 1), 10));
    const signalId = s.id || s.signalId || `mesure_${n}`;
    const override = overrides[signalId] || {};
    const announcementStartTime = sumMeasuresUntil(n - 1);
    const pauseTime = sumMeasuresUntil(n);

    const isCueOnly = override.mode === 'cueOnly' || override.mode === 'repere' || override.isInteractive === false;
    const emptyPupitre = pupitre ? isPupitreMeasureEmpty(presetData, pupitre, n) : false;
    const isInteractive = !isCueOnly && !emptyPupitre;

    return {
      signalId,
      name: s.nom || s.name || s.signe || `Signal Mesure ${n}`,
      mesure: n,
      targetMeasure: n + 1,
      targetMeasureIndex: n,
      announcementStartTime,
      pauseTime,
      isInteractive,
      mode: isCueOnly ? 'cueOnly' : 'interactive',
      skippedEmptyPupitre: emptyPupitre,
      override,
      signal: s
    };
  }).filter((p) => !(pupitre && p.skippedEmptyPupitre));
}

export function generateDistractors(correctPattern, presetData, instrumentKey = 'caixa', allPatterns = [], overrides = null, measureIndex = 0) {
  if (Array.isArray(overrides?.distractors) && overrides.distractors.length === 3) {
    return overrides.distractors.map(normalizeStepsArray);
  }
  const safeCorrect = normalizeStepsArray(correctPattern);
  let d1 = measureIndex > 0 ? extractPupitrePattern(presetData, instrumentKey, measureIndex - 1) : null;
  if (!d1 || arePatternsEqual(d1, safeCorrect)) {
    d1 = getCanonicalPupitrePattern(instrumentKey, 1);
    if (arePatternsEqual(d1, safeCorrect)) d1 = getCanonicalPupitrePattern(instrumentKey, 2);
  }

  const cand = (allPatterns || []).find((p) => {
    const s = normalizeStepsArray(p.steps || p.activeSteps || p);
    return !arePatternsEqual(s, safeCorrect) && !arePatternsEqual(s, d1);
  });
  let d2 = cand ? normalizeStepsArray(cand.steps || cand.activeSteps || cand) : getCanonicalPupitrePattern(instrumentKey, 2);
  if (arePatternsEqual(d2, safeCorrect) || arePatternsEqual(d2, d1)) {
    d2 = [...safeCorrect];
    d2[0] = d2[0] === '-' ? 'X' : '-';
    d2[8] = d2[8] === '-' ? 'X' : '-';
  }

  const d3 = [...safeCorrect];
  const shiftIdx = d3.findIndex((v, i) => i > 0 && i < 15 && v !== '-' && d3[i + 1] === '-');
  if (shiftIdx !== -1) { d3[shiftIdx] = '-'; d3[shiftIdx + 1] = 'X'; }
  else { d3[4] = d3[4] === '-' ? 'X' : '-'; d3[12] = d3[12] === '-' ? 'X' : '-'; }
  if (arePatternsEqual(d3, safeCorrect) || arePatternsEqual(d3, d1) || arePatternsEqual(d3, d2)) {
    d3[0] = d3[0] === '-' ? 'X' : '-'; d3[2] = d3[2] === '-' ? 'X' : '-';
  }
  return [d1, d2, d3];
}

export function buildQuizOptions(correctPattern, distractors = []) {
  const options = [
    { id: 'correct', pattern: correctPattern, isCorrect: true },
    { id: 'distractor_0', pattern: distractors[0] || getCanonicalPupitrePattern('default', 1), isCorrect: false },
    { id: 'distractor_1', pattern: distractors[1] || getCanonicalPupitrePattern('default', 2), isCorrect: false },
    { id: 'distractor_2', pattern: distractors[2] || getCanonicalPupitrePattern('default', 0), isCorrect: false }
  ];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
