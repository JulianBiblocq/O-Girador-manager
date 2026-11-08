/**
 * Utilitaire d'extraction de la Timeline des Signaux — Conducteur à trous (< 140 lignes).
 * Lit sinaisDoMestre, expandedMeasures, measureBpms et bpm du preset Sequenciador,
 * génère les emplacements (slots) indexés par mesure N et horodatage T_annonce,
 * et construit le « Bac à Signaux » (signaux réels + 2 à 3 leurres plausibles).
 */

import { normalizeString } from './repertoireMatcher.js';

export const DEFAULT_MESTRE_SIGNALS = [
  { id: 'sig_depart', name: 'Appel de départ', labelKey: 'pedagogy.engine.appelDeDepart', gestureType: 'depart', imageUrl: null },
  { id: 'sig_virada_1', name: 'Appel Virada 1', labelKey: 'pedagogy.engine.appelVirada1', gestureType: 'virada', imageUrl: null },
  { id: 'sig_virada_2', name: 'Appel Virada 2', labelKey: 'pedagogy.engine.appelVirada2', gestureType: 'virada', imageUrl: null },
  { id: 'sig_parada', name: 'Parada / Break', labelKey: 'pedagogy.engine.paradaBreak', gestureType: 'parada', imageUrl: null },
  { id: 'sig_reprise', name: 'Reprise de Baque', labelKey: 'pedagogy.engine.repriseDeBaque', gestureType: 'reprise', imageUrl: null },
  { id: 'sig_arret', name: 'Coupure finale', labelKey: 'pedagogy.engine.coupureFinale', gestureType: 'arret', imageUrl: null },
  { id: 'sig_accel', name: 'Accélération', labelKey: 'pedagogy.engine.acceleration', gestureType: 'tempo', imageUrl: null },
  { id: 'sig_coro', name: 'Appel Voix / Toada', labelKey: 'pedagogy.engine.appelVoixToada', gestureType: 'voix', imageUrl: null }
];

export function shuffleArray(arr) {
  const result = [...(arr || [])];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Construit le défi du Conducteur à trous (slots, T_annonce, Bac à Signaux et leurres).
 */
export function buildSignalTimelineChallenge(pieceData = {}, presetData = null, allSignalsCatalog = []) {
  const rawSinais = (Array.isArray(presetData?.sinaisDoMestre) && presetData.sinaisDoMestre.length > 0)
    ? presetData.sinaisDoMestre
    : (presetData?.parsedData?.sinaisDoMestre || pieceData?.sinaisDoMestre || pieceData?.activeSinaisDoMestre || []);
  const safeSignals = (Array.isArray(rawSinais) ? rawSinais : []).filter((s) => s && s.active !== false && !s.deleted);

  const nominalBpm = Number(presetData?.bpm || presetData?.parsedData?.bpm || pieceData?.bpm || 120) || 120;
  const beatsPerMeasure = Number(presetData?.beatsPerMeasure || presetData?.parsedData?.beatsPerMeasure || 4) || 4;
  const measureBpms = presetData?.measureBpms || presetData?.parsedData?.measureBpms || {};
  const expandedMeasures = presetData?.expandedMeasures || presetData?.parsedData?.expandedMeasures || [];

  const getMeasureDuration = (measureNum1Based) => {
    const idx0 = measureNum1Based - 1;
    const rawBpm = Array.isArray(measureBpms) ? measureBpms[idx0] : (measureBpms[measureNum1Based] ?? measureBpms[idx0]);
    const mBpm = Number(rawBpm ?? expandedMeasures[idx0]?.bpm ?? nominalBpm) || nominalBpm;
    return (60 / mBpm) * beatsPerMeasure;
  };

  const getAnnouncementTime = (measureNum1Based) => {
    let totalSec = 0;
    for (let m = 1; m < measureNum1Based; m++) totalSec += getMeasureDuration(m);
    return Number(totalSec.toFixed(3));
  };

  const signalMap = new Map();
  (allSignalsCatalog || []).forEach((sig) => {
    if (sig && (sig.id || sig.name || sig.nom)) {
      const key = sig.id || normalizeString(sig.name || sig.nom);
      signalMap.set(key, { id: sig.id || key, name: sig.name || sig.nom || 'Signal', imageUrl: sig.imageUrl || null });
    }
  });
  DEFAULT_MESTRE_SIGNALS.forEach((sig) => { if (!signalMap.has(sig.id)) signalMap.set(sig.id, sig); });
  const fullCatalog = Array.from(signalMap.values());

  const signalsByMeasureMap = new Map();
  safeSignals.forEach((s, idx) => {
    const m = Math.max(1, parseInt(s.mesure ?? s.bar ?? s.barIndex ?? (idx + 1), 10));
    if (!signalsByMeasureMap.has(m)) {
      const sName = s.nom || s.name || s.signe || s.label || `Signal Mesure ${m}`;
      const normName = normalizeString(sName);
      const matched = fullCatalog.find((cat) => (s.id && cat.id === s.id) || (s.signalId && cat.id === s.signalId) || normalizeString(cat.name) === normName);
      signalsByMeasureMap.set(m, { id: matched?.id || s.id || s.signalId || `sig_m${m}`, name: matched?.name || sName, imageUrl: matched?.imageUrl || s.imageUrl || null });
    }
  });

  const sortedMeasures = Array.from(signalsByMeasureMap.keys()).sort((a, b) => a - b);
  const slots = sortedMeasures.map((mesure) => {
    const targetSignal = signalsByMeasureMap.get(mesure);
    const announcementTime = getAnnouncementTime(mesure);
    const candidates = fullCatalog.filter((c) => c.id !== targetSignal.id && normalizeString(c.name) !== normalizeString(targetSignal.name));
    const slotDistractors = shuffleArray(candidates).slice(0, 3);
    return { slotId: `slot_m${mesure}`, mesure, announcementTime, timestamp: announcementTime, targetSignal, options: shuffleArray([targetSignal, ...slotDistractors]) };
  });

  const realSignalsMap = new Map();
  slots.forEach((sl) => realSignalsMap.set(sl.targetSignal.id, sl.targetSignal));
  const realSignals = Array.from(realSignalsMap.values());
  const usedNames = new Set(realSignals.map((r) => normalizeString(r.name)));
  const distractorPool = fullCatalog.filter((c) => !realSignalsMap.has(c.id) && !usedNames.has(normalizeString(c.name)));
  const distractors = shuffleArray(distractorPool).slice(0, 3);
  const signalTray = slots.length > 0 ? shuffleArray([...realSignals, ...distractors]) : [];

  const slotsByMeasure = {};
  slots.forEach((s) => { slotsByMeasure[s.mesure] = s; });

  const tracks = presetData?.tracks || presetData?.parsedData?.tracks || [];
  let trackMax = Array.isArray(expandedMeasures) ? expandedMeasures.length : 0;
  tracks.forEach((t) => {
    if (Array.isArray(t.patterns)) {
      t.patterns.forEach((p) => Object.keys(p?.measureAssignments || {}).forEach((idx) => { if (Number(idx) + 1 > trackMax) trackMax = Number(idx) + 1; }));
    }
    if (Array.isArray(t.measures) && t.measures.length > trackMax) trackMax = t.measures.length;
    if (Array.isArray(t.steps) && Math.ceil(t.steps.length / 16) > trackMax) trackMax = Math.ceil(t.steps.length / 16);
  });
  const maxSigM = sortedMeasures.length > 0 ? sortedMeasures[sortedMeasures.length - 1] : 0;
  const totalMeasures = Math.max(16, maxSigM > 0 ? maxSigM + 2 : 16, trackMax);

  const measureTimestamps = {};
  for (let m = 1; m <= totalMeasures; m++) measureTimestamps[m] = getAnnouncementTime(m);

  return {
    slots, slotsByMeasure, signalTray, distractors, totalMeasures, totalSignals: slots.length, nominalBpm, measureTimestamps,
    audioUrl: pieceData?.activeAudioUrl || pieceData?.audioUrl || pieceData?.preset?.audioUrl || presetData?.audioUrl || null
  };
}

export const extractConductorChallenge = buildSignalTimelineChallenge;
