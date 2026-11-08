/**
 * Catalogue des motifs canoniques par pupitre et utilitaires de normalisation de pas (< 130 lignes).
 */

import { normalizeString } from './repertoireMatcher.js';

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

export const arePatternsEqual = (p1, p2) => {
  if (!Array.isArray(p1) || !Array.isArray(p2) || p1.length !== p2.length) return false;
  for (let i = 0; i < p1.length; i++) {
    const v1 = p1[i] === 0 || p1[i] === '0' || p1[i] === '' || p1[i] == null ? '-' : String(p1[i]);
    const v2 = p2[i] === 0 || p2[i] === '0' || p2[i] === '' || p2[i] == null ? '-' : String(p2[i]);
    if (v1 !== v2) return false;
  }
  return true;
};

export function getCanonicalPupitrePattern(instrumentKey, variant = 0) {
  const norm = normalizeString(instrumentKey);
  const foundKey = Object.keys(CANONICAL_PUPITRE_PATTERNS).find((k) => norm.includes(k));
  const list = foundKey ? CANONICAL_PUPITRE_PATTERNS[foundKey] : CANONICAL_PUPITRE_PATTERNS.default;
  return [...list[Math.abs(variant) % list.length]];
}

export function normalizeStepsArray(rawSteps) {
  const safe = Array.isArray(rawSteps) ? rawSteps : [];
  const result = [];
  for (let i = 0; i < 16; i++) {
    if (i < safe.length) {
      const v = Array.isArray(safe[i]) ? safe[i][0] : safe[i];
      result.push(v === 0 || v === '0' || v === '' || v == null || v === '-' ? '-' : String(v));
    } else result.push('-');
  }
  return result;
}

/** Recherche le motif brut d'une piste explicite pour un pupitre à la mesure measureIndex (0-indexed). */
export function findExplicitTrackSteps(presetData, instrumentKey = 'caixa', measureIndex = 0) {
  const normKey = normalizeString(instrumentKey);
  const expMeasures = presetData?.expandedMeasures || presetData?.parsedData?.expandedMeasures || [];
  const expTracks = expMeasures[measureIndex]?.tracks;
  if (expTracks && typeof expTracks === 'object' && !Array.isArray(expTracks)) {
    const matchedEntry = Object.entries(expTracks).find(([k]) => normalizeString(k).includes(normKey) || normKey.includes(normalizeString(k)));
    if (matchedEntry) {
      const val = matchedEntry[1];
      const raw = Array.isArray(val) ? val : (val?.activeSteps || val?.steps || []);
      return { hasTrack: true, steps: normalizeStepsArray(raw) };
    }
  }

  const tracks = presetData?.tracks || presetData?.parsedData?.tracks || (Array.isArray(expTracks) ? expTracks : []);
  if (!Array.isArray(tracks) || tracks.length === 0) return { hasTrack: false, steps: null };

  const matchedTrack = tracks.find((t) => {
    const tName = normalizeString(t.name || t.customName || t.instrument);
    const tId = normalizeString(t.instrumentId || t.id);
    return (tName && tName.includes(normKey)) || (tId && tId.includes(normKey));
  });
  if (!matchedTrack) return { hasTrack: false, steps: null };

  if (Array.isArray(matchedTrack.patterns)) {
    const activePat = matchedTrack.patterns.find((p) => p?.measureAssignments && Boolean(p.measureAssignments[measureIndex]));
    if (activePat && (activePat.activeSteps || activePat.steps)) {
      return { hasTrack: true, steps: normalizeStepsArray(activePat.activeSteps || activePat.steps) };
    }
  }
  if (Array.isArray(matchedTrack.measures) && matchedTrack.measures[measureIndex]) {
    const raw = matchedTrack.measures[measureIndex].steps || matchedTrack.measures[measureIndex].activeSteps || matchedTrack.measures[measureIndex];
    return { hasTrack: true, steps: normalizeStepsArray(raw) };
  }
  if (Array.isArray(matchedTrack.steps) && matchedTrack.steps.length > 0) {
    const slice = matchedTrack.steps.slice(measureIndex * 16, measureIndex * 16 + 16);
    return { hasTrack: true, steps: normalizeStepsArray(slice) };
  }
  return { hasTrack: true, steps: Array(16).fill('-') };
}
