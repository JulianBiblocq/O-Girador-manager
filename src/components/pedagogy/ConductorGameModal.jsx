import React, { useState, useEffect, useRef, useMemo } from 'react';
import CordelButton from '../CordelButton';
import ConductorTimeline from './conductor/ConductorTimeline';
import ConductorSignalPickerSheet from './conductor/ConductorSignalPickerSheet';
import ConductorAudioPlayer from './conductor/ConductorAudioPlayer';
import useMestreSignals from '../../hooks/useMestreSignals';
import { extractConductorChallenge } from '../../utils/conductorGameUtils';
import { saveConductorProgress } from '../../services/aisanceService';
import { normalizeString } from '../../utils/repertoireMatcher';

/**
 * Modale immersive du jeu du « Conducteur à trous ».
 * Mémorisation tactile de la structure des signaux d'un morceau sur une timeline interactive.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modale
 * @param {Function} props.onClose - Fermeture
 * @param {Object} props.piece - Morceau concerné du Répertoire
 * @param {Object} props.presetData - Preset vivant associé
 * @param {Object} props.profileData - Profil de l'élève connecté
 */
export default function ConductorGameModal({
  isOpen,
  onClose,
  piece,
  presetData,
  profileData
}) {
  const audioRef = useRef(null);
  const { signals: catalogSignals } = useMestreSignals(profileData?.groupId);

  const challenge = useMemo(() => {
    if (!piece) return { slots: [], slotsByMeasure: {}, totalMeasures: 16, nominalBpm: 120, audioUrl: null };
    return extractConductorChallenge(piece, presetData, catalogSignals);
  }, [piece, presetData, catalogSignals]);

  const [userSlots, setUserSlots] = useState({});
  const [validationResults, setValidationResults] = useState(null);
  const [activeSlotToPick, setActiveSlotToPick] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAllCorrect, setIsAllCorrect] = useState(false);

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setUserSlots({});
      setValidationResults(null);
      setActiveSlotToPick(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setIsAllCorrect(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen, piece?.id]);

  // Calcul de la mesure active en lecture audio
  const currentPlayheadMeasure = useMemo(() => {
    if (!isPlaying && currentTime === 0) return null;
    const bpm = challenge.nominalBpm || 120;
    const measureDuration = (4 * 60) / bpm;
    return Math.floor(currentTime / measureDuration) + 1;
  }, [currentTime, isPlaying, challenge.nominalBpm]);

  // Affectation d'un signal à une mesure
  const handleAssignSignal = (signal) => {
    if (!activeSlotToPick) return;
    setUserSlots((prev) => ({
      ...prev,
      [activeSlotToPick.mesure]: signal
    }));
    // Réinitialise la validation partielle si modification
    if (validationResults) {
      setValidationResults((prev) => ({ ...prev, [activeSlotToPick.mesure]: null }));
    }
  };

  // Retrait d'un signal
  const handleRemoveSignal = () => {
    if (!activeSlotToPick) return;
    setUserSlots((prev) => {
      const next = { ...prev };
      delete next[activeSlotToPick.mesure];
      return next;
    });
    if (validationResults) {
      setValidationResults((prev) => ({ ...prev, [activeSlotToPick.mesure]: null }));
    }
  };

  // Validation du conducteur complet
  const handleValidate = async () => {
    const results = {};
    let correctCount = 0;

    challenge.slots.forEach((slot) => {
      const chosen = userSlots[slot.mesure];
      if (!chosen) {
        results[slot.mesure] = false;
        return;
      }
      const isMatch =
        (slot.targetSignal.id && chosen.id && slot.targetSignal.id === chosen.id) ||
        normalizeString(chosen.name) === normalizeString(slot.targetSignal.name);

      results[slot.mesure] = isMatch;
      if (isMatch) correctCount++;
    });

    setValidationResults(results);

    const allGood = correctCount === challenge.slots.length;
    setIsAllCorrect(allGood);

    if (allGood) {
      // Vibration haptique de succès
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80, 50, 150]);
      }
      // Sauvegarde dans users/{uid}/aisance/conducteurs
      const userId = profileData?.uid || profileData?.id;
      if (userId && piece?.id) {
        try {
          await saveConductorProgress(userId, {
            pieceId: piece.id,
            pieceTitle: piece.titre || 'Morceau',
            totalSignals: challenge.slots.length,
            perfectScore: true,
            groupId: profileData?.groupId || ''
          });
        } catch (err) {
          console.error('[ConductorGame] Erreur enregistrement :', err);
        }
      }
    }
  };

  const isFormComplete = challenge.slots.length > 0 && challenge.slots.every((s) => userSlots[s.mesure]);

  if (!isOpen || !piece) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl border-2 border-encre-noire overflow-hidden text-left">
        {/* En-tête Cordel */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#fdfaf2] border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider flex items-center gap-2">
                <span>Conducteur à trous</span>
                <span className="text-[10px] font-bold text-encre-noire/60 lowercase">— {piece.titre}</span>
              </h2>
              <p className="text-[10px] font-bold text-encre-noire/70">
                Placez les bons signaux sur la frise chronologique pour mémoriser l'enchaînement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center hover:bg-red-700 cursor-pointer shadow-xs"
          >
            ✕
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Lecteur audio compact de repérage */}
          <ConductorAudioPlayer
            audioUrl={challenge.audioUrl}
            audioRef={audioRef}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            setDuration={setDuration}
            currentPlayheadMeasure={currentPlayheadMeasure}
          />

          {/* Bannière de célébration si 100% de réussite */}
          {isAllCorrect && (
            <div className="p-3 bg-emerald-100 border-2 border-[var(--color-cordel-vert,#2d6a4f)] text-[var(--color-cordel-vert,#2d6a4f)] rounded-lg text-center flex items-center justify-center gap-2 animate-bounce">
              <span className="text-xl">🏆</span>
              <span className="text-xs font-black uppercase tracking-wider">
                Conducteur validé sans faute ! Structure parfaitement mémorisée.
              </span>
            </div>
          )}

          {/* Frise chronologique (Timeline) */}
          <ConductorTimeline
            totalMeasures={challenge.totalMeasures}
            slotsByMeasure={challenge.slotsByMeasure}
            userSlots={userSlots}
            validationResults={validationResults}
            currentPlayheadMeasure={currentPlayheadMeasure}
            onClickSlot={(slot) => setActiveSlotToPick(slot)}
          />
        </div>

        {/* Volet contextuel au tap sur une case */}
        <ConductorSignalPickerSheet
          isOpen={Boolean(activeSlotToPick)}
          onClose={() => setActiveSlotToPick(null)}
          slot={activeSlotToPick}
          currentAssignedSignal={activeSlotToPick ? userSlots[activeSlotToPick.mesure] : null}
          onSelectSignal={handleAssignSignal}
          onRemoveSignal={handleRemoveSignal}
        />

        {/* Pied de modale avec validation */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#fdfaf2] border-t-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <button
            type="button"
            onClick={() => {
              setUserSlots({});
              setValidationResults(null);
              setIsAllCorrect(false);
            }}
            className="text-xs font-black uppercase text-stone-500 hover:text-stone-800 underline cursor-pointer"
          >
            Réinitialiser
          </button>

          <CordelButton
            type="button"
            variant="vert"
            disabled={!isFormComplete || isAllCorrect}
            onClick={handleValidate}
            className="py-1.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>📜</span>
            <span>Valider le conducteur</span>
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
