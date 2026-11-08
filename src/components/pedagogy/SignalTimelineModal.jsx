import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelButton from '../CordelButton';
import ConductorAudioPlayer from './conductor/ConductorAudioPlayer';
import SignalTimelineBoard from './conductor/SignalTimelineBoard';
import useMestreSignals from '../../hooks/useMestreSignals';
import { buildSignalTimelineChallenge } from '../../utils/signalTimelineUtils';
import { saveConductorProgress } from '../../services/aisanceService';
import { syncComfortAfterPractice } from '../../utils/aisanceAutoSync';
import { normalizeString } from '../../utils/repertoireMatcher';
import { useTranslation } from '../LanguageContext';

/**
 * Modale interactive du Conducteur à trous — Timeline des Signaux (< 135 lignes).
 * Synchronise l'audio par mesure, supporte le clic-clic mobile et le drag-and-drop PC,
 * sauvegarde piecesProgress[pieceId].timelineValidated = true et déclenche syncComfortAfterPractice.
 */
export default function SignalTimelineModal({
  isOpen, onClose, piece, presetData = null, profileData = null,
  currentComfort = null, onComfortPromoted = null, onValidated = null
}) {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const groupId = profileData?.groupId || piece?.groupId || '';
  const userId = profileData?.uid || profileData?.id || '';
  const { signals: catalogSignals } = useMestreSignals(groupId);

  const challenge = useMemo(() => {
    if (!piece) return { slots: [], slotsByMeasure: {}, signalTray: [], totalMeasures: 16, nominalBpm: 120, measureTimestamps: {}, audioUrl: null };
    return buildSignalTimelineChallenge(piece, presetData || piece.preset?.parsedData || piece.preset, catalogSignals);
  }, [piece, presetData, catalogSignals]);

  const [userSlots, setUserSlots] = useState({});
  const [validationResults, setValidationResults] = useState(null);
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [selectedTraySignal, setSelectedTraySignal] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAllCorrect, setIsAllCorrect] = useState(false);

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isOpen]);

  const effectiveSelectedMeasure = selectedMeasure ?? (challenge.slots[0]?.mesure || null);
  const currentPlayheadMeasure = (!isPlaying && currentTime === 0) ? null : Math.floor(currentTime / ((4 * 60) / (challenge.nominalBpm || 120))) + 1;

  const assignSignalToMeasure = (measure, signal) => {
    if (!measure || !signal) return;
    setUserSlots((prev) => ({ ...prev, [measure]: signal }));
    if (validationResults) setValidationResults((prev) => ({ ...prev, [measure]: null }));
    const nextEmpty = challenge.slots.find((s) => s.mesure !== measure && !userSlots[s.mesure]);
    setSelectedMeasure(nextEmpty ? nextEmpty.mesure : null);
    setSelectedTraySignal(null);
  };

  const handleClickSlot = (measure, assigned) => {
    if (assigned) {
      setUserSlots((prev) => { const next = { ...prev }; delete next[measure]; return next; });
      if (validationResults) setValidationResults((prev) => ({ ...prev, [measure]: null }));
      setSelectedMeasure(measure);
    } else if (selectedTraySignal) assignSignalToMeasure(measure, selectedTraySignal);
    else setSelectedMeasure(measure);
  };

  const handleClickTraySignal = (signal) => {
    const targetM = effectiveSelectedMeasure || challenge.slots.find((s) => !userSlots[s.mesure])?.mesure;
    if (targetM) assignSignalToMeasure(targetM, signal);
    else setSelectedTraySignal((prev) => (prev?.id === signal.id ? null : signal));
  };

  const handleSeekMeasure = (measure) => {
    if (!audioRef.current) return;
    const targetSec = challenge.measureTimestamps?.[measure] ?? ((measure - 1) * (240 / (challenge.nominalBpm || 120)));
    audioRef.current.currentTime = targetSec;
    setCurrentTime(targetSec);
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handleValidate = async () => {
    const results = {};
    const correctCount = challenge.slots.reduce((acc, slot) => {
      const chosen = userSlots[slot.mesure];
      const ok = Boolean(chosen && ((slot.targetSignal.id && chosen.id === slot.targetSignal.id) || normalizeString(chosen.name) === normalizeString(slot.targetSignal.name)));
      results[slot.mesure] = ok;
      return acc + (ok ? 1 : 0);
    }, 0);
    setValidationResults(results);
    const allGood = challenge.slots.length > 0 && correctCount === challenge.slots.length;
    setIsAllCorrect(allGood);
    if (allGood && userId && piece?.id) {
      try {
        if (groupId) {
          const pRef = doc(db, 'users', userId, 'parcours', groupId);
          try { await updateDoc(pRef, { [`piecesProgress.${piece.id}.timelineValidated`]: true }); }
          catch { await setDoc(pRef, { piecesProgress: { [piece.id]: { timelineValidated: true } } }, { merge: true }); }
        }
        await saveConductorProgress(userId, { pieceId: piece.id, pieceTitle: piece.titre || 'Morceau', totalSignals: challenge.slots.length, perfectScore: true, groupId });
        await syncComfortAfterPractice({ db, userId, groupId, pieceId: piece.id, practiceSuccess: true, allStagesCompleted: false, currentComfort, onPromoted: onComfortPromoted });
        if (onValidated) onValidated(piece.id);
      } catch (err) { console.warn('[SignalTimelineModal] Erreur sauvegarde :', err); }
    }
  };

  if (!isOpen || !piece) return null;
  const isComplete = challenge.slots.length > 0 && challenge.slots.every((s) => userSlots[s.mesure]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl border-2 border-encre-noire overflow-hidden text-left">
        <div className="flex justify-between items-center gap-3 px-4 py-3 bg-[#fdfaf2] border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider">🗺️ {t('pedagogy.reflex.conducteurATrous')} — {piece.titre}</h2>
            <p className="text-[10px] font-bold text-encre-noire/70">{t('pedagogy.reflex.placezLesBonsSignauxSur')}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white hover:bg-red-700 cursor-pointer">✕</button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
          <ConductorAudioPlayer audioUrl={challenge.audioUrl} audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} currentTime={currentTime} setCurrentTime={setCurrentTime} duration={duration} setDuration={setDuration} currentPlayheadMeasure={currentPlayheadMeasure} />
          {isAllCorrect && <div className="p-3 bg-emerald-100 border-2 border-[var(--color-cordel-vert,#2d6a4f)] text-[var(--color-cordel-vert,#2d6a4f)] rounded-lg text-center text-xs font-black uppercase">🏆 {t('pedagogy.reflex.conducteurValideSansFauteStructure')}</div>}
          <SignalTimelineBoard totalMeasures={challenge.totalMeasures} slotsByMeasure={challenge.slotsByMeasure} signalTray={challenge.signalTray} userSlots={userSlots} validationResults={validationResults} currentPlayheadMeasure={currentPlayheadMeasure} selectedMeasure={effectiveSelectedMeasure} selectedTraySignal={selectedTraySignal} onClickSlot={handleClickSlot} onDropSignalOnMeasure={assignSignalToMeasure} onClickTraySignal={handleClickTraySignal} onSeekMeasure={handleSeekMeasure} />
        </div>

        <div className="flex justify-between items-center px-4 py-3 bg-[#fdfaf2] border-t-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <button type="button" onClick={() => { setUserSlots({}); setValidationResults(null); setIsAllCorrect(false); }} className="text-xs font-black uppercase text-stone-500 hover:text-stone-800 underline cursor-pointer">{t('pedagogy.reflex.reinitialiser')}</button>
          <CordelButton type="button" variant="vert" disabled={!isComplete || isAllCorrect} onClick={handleValidate} className="py-1.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <span>📜</span><span>{t('pedagogy.reflex.validerLeConducteur')}</span>
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
