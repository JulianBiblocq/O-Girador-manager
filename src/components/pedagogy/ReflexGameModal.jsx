import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CordelButton from '../CordelButton';
import ReflexSignalBanner from './reflex/ReflexSignalBanner';
import ReflexGameBoard from './reflex/ReflexGameBoard';
import {
  calculatePauseTimes,
  extractPupitrePattern,
  generateDistractors,
  buildQuizOptions
} from '../../utils/reflexGameUtils';
import { saveReflexProgress } from '../../services/aisanceService';
import { normalizeString } from '../../utils/repertoireMatcher';

const AVAILABLE_PUPITRES = [
  { key: 'caixa', label: 'Caixa' },
  { key: 'tarol', label: 'Tarol' },
  { key: 'gongue', label: 'Gonguê' },
  { key: 'alfaia', label: 'Alfaia' },
  { key: 'marcante', label: 'Alfaia Marcante' },
  { key: 'agbe', label: 'Agbê / Shekere' },
  { key: 'mineiro', label: 'Mineiro / Ganzá' },
  { key: 'timbal', label: 'Timbal' }
];

/**
 * Modale immersive du Défi Réflexe « Temps 1 ».
 * Entraînement interactif aux conventions et signaux du Mestre.
 * Coupe l'audio au temps 1 de la mesure N+1 et teste les réflexes de l'élève.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modale
 * @param {Function} props.onClose - Fermeture
 * @param {Object} props.piece - Morceau sélectionné
 * @param {Object} props.presetData - Données du preset séquenceur associé
 * @param {Object} props.profileData - Profil de l'élève connecté
 * @param {string} props.groupId - Identifiant du groupe
 */
export default function ReflexGameModal({
  isOpen,
  onClose,
  piece,
  presetData,
  profileData,
  groupId
}) {
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);

  // Détection du pupitre par défaut de l'élève
  const initialPupitre = useMemo(() => {
    const raw = (
      profileData?.instrument ||
      profileData?.instrumentPrincipal ||
      profileData?.instrumentsJoues?.[0] ||
      'caixa'
    ).toLowerCase();
    const found = AVAILABLE_PUPITRES.find((p) => raw.includes(p.key));
    return found ? found.key : 'caixa';
  }, [profileData]);

  const [selectedPupitre, setSelectedPupitre] = useState(initialPupitre);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Points d'arrêts calculés
  const pausePoints = useMemo(() => {
    if (!piece) return [];
    return calculatePauseTimes(piece, presetData);
  }, [piece, presetData]);

  // État du signal en cours
  const [currentSignal, setCurrentSignal] = useState(null);
  const [isPausedForQuiz, setIsPausedForQuiz] = useState(false);
  const [isSignalActive, setIsSignalActive] = useState(false);

  // État du quiz actif
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [validationState, setValidationState] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null);

  // Gestion du score
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  // Références d'état pour éviter les fermetures obsolètes dans la boucle d'animation
  const pausedSignalsRef = useRef(new Set());
  const hadErrorOnSignalRef = useRef(false);
  const currentSignalRef = useRef(null);
  const isPausedForQuizRef = useRef(false);

  const interactiveSignals = useMemo(() => {
    return pausePoints.filter((p) => p.isInteractive);
  }, [pausePoints]);

  const audioUrl = piece?.activeAudioUrl || piece?.audioUrl || piece?.preset?.audioUrl || presetData?.audioUrl;

  // Réinitialisation de la partie
  const resetGame = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    pausedSignalsRef.current.clear();
    hadErrorOnSignalRef.current = false;
    currentSignalRef.current = null;
    isPausedForQuizRef.current = false;

    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentSignal(null);
    setIsPausedForQuiz(false);
    setIsSignalActive(false);
    setQuizOptions([]);
    setSelectedOptionId(null);
    setValidationState(null);
    setFeedback(null);
    setFeedbackType(null);
    setScore(0);
    setGameFinished(false);
  }, []);

  // Fermeture propre
  useEffect(() => {
    if (!isOpen) {
      resetGame();
    }
  }, [isOpen, resetGame]);

  // Synchronisation temporelle fine haute fréquence
  const checkTimeSync = useCallback((time) => {
    if (isPausedForQuizRef.current) return;

    // 1. Détection du signal actif en cours
    const activeSig = pausePoints.find(
      (p) => time >= p.announcementStartTime && time < p.pauseTime + 0.3
    );

    if (activeSig) {
      setCurrentSignal(activeSig);
      currentSignalRef.current = activeSig;
      setIsSignalActive(time < activeSig.pauseTime);
    } else {
      if (!isPausedForQuizRef.current) {
        setCurrentSignal(null);
        currentSignalRef.current = null;
        setIsSignalActive(false);
      }
    }

    // 2. Détection de l'arrivée au temps 1 (pauseTime)
    for (const p of pausePoints) {
      if (
        time >= p.pauseTime - 0.05 &&
        time <= p.pauseTime + 0.35 &&
        !pausedSignalsRef.current.has(p.signalId)
      ) {
        pausedSignalsRef.current.add(p.signalId);

        if (p.isInteractive) {
          // Arrêt net au temps 1
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = p.pauseTime;
          }
          setIsPlaying(false);
          setIsPausedForQuiz(true);
          isPausedForQuizRef.current = true;
          hadErrorOnSignalRef.current = false;
          setCurrentSignal(p);
          currentSignalRef.current = p;

          // Génération des 4 tablatures pour le pupitre
          const correctPattern = extractPupitrePattern(presetData, selectedPupitre, p.targetMeasureIndex);
          const distractors = generateDistractors(
            correctPattern,
            presetData,
            selectedPupitre,
            [],
            p.override,
            p.targetMeasureIndex
          );
          const options = buildQuizOptions(correctPattern, distractors);

          setQuizOptions(options);
          setSelectedOptionId(null);
          setValidationState(null);
          setFeedback(null);
          setFeedbackType(null);
          break;
        } else {
          // Simple repère : pas d'arrêt audio
          setFeedback(`👁️ Repère visuel : ${p.name}`);
          setFeedbackType('success');
          setTimeout(() => {
            setFeedback(null);
            setFeedbackType(null);
          }, 3000);
        }
      }
    }
  }, [pausePoints, presetData, selectedPupitre]);

  // Boucle de suivi temporelle en cours de lecture
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const tick = () => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime;
        setCurrentTime(t);
        checkTimeSync(t);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, checkTimeSync]);

  // Gestion du choix d'une tablature
  const handleSelectOption = (option) => {
    if (validationState === 'success') return;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      // Bonne réponse
      setValidationState('success');
      setFeedback('✅ Bravo ! Convention validée. Reprise sur le temps 1...');
      setFeedbackType('success');

      if (!hadErrorOnSignalRef.current) {
        setScore((prev) => prev + 1);
      }

      // Relance immédiate de l'audio
      setTimeout(() => {
        setIsPausedForQuiz(false);
        isPausedForQuizRef.current = false;
        setQuizOptions([]);
        setSelectedOptionId(null);
        setValidationState(null);
        setFeedback(null);
        setFeedbackType(null);

        if (audioRef.current) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.warn('[ReflexGame] Impossible de relancer la lecture automatique :', err);
          });
        }
      }, 700);
    } else {
      // Mauvaise réponse
      hadErrorOnSignalRef.current = true;
      setValidationState('error');
      setFeedback("⚠️ Ce n'est pas la bonne phrase ! Réessaie...");
      setFeedbackType('error');

      // Vibration haptique sur mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 60, 100]);
      }

      // Réinitialisation de l'état d'erreur après un court délai pour permettre un nouveau clic
      setTimeout(() => {
        setValidationState(null);
      }, 1200);
    }
  };

  // Fin du morceau
  const handleAudioEnded = async () => {
    setIsPlaying(false);
    setGameFinished(true);

    const userId = profileData?.uid || profileData?.id;
    const totalCount = interactiveSignals.length;
    const isPerfect = totalCount > 0 && score === totalCount;

    if (userId && piece?.id) {
      try {
        await saveReflexProgress(userId, {
          pieceId: piece.id,
          pieceTitle: piece.titre || 'Morceau',
          pupitre: selectedPupitre,
          score,
          totalSignals: totalCount,
          perfectScore: isPerfect,
          groupId: groupId || profileData?.groupId || ''
        });
      } catch (err) {
        console.error('[ReflexGame] Erreur lors de la sauvegarde de la progression :', err);
      }
    }
  };

  // Contrôles Audio Manuels
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('[ReflexGame] Erreur play :', e);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl border-2 border-encre-noire overflow-hidden text-left">
        {/* Audio caché */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={() => {
              if (audioRef.current) setDuration(audioRef.current.duration);
            }}
            onEnded={handleAudioEnded}
            preload="auto"
          />
        )}

        {/* En-tête Cordel */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#fdfaf2] border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider flex items-center gap-2">
                <span>Défi Réflexe « Temps 1 »</span>
                <span className="text-[10px] font-bold text-encre-noire/60 lowercase">
                  — {piece?.titre}
                </span>
              </h2>
              <p className="text-[10px] font-bold text-encre-noire/70">
                Arrêt automatique au Temps 1 • Clique sur la bonne phrase pour relancer l'audio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center hover:bg-red-700 cursor-pointer shadow-xs"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Vérification présence audio */}
          {!audioUrl ? (
            <div className="p-6 bg-red-50 border-2 border-[var(--color-cordel-rouge,#8b2a1a)] text-[var(--color-cordel-rouge,#8b2a1a)] rounded-lg text-center flex flex-col gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-black">Aucun enregistrement audio rattaché à ce morceau.</p>
              <p className="text-xs text-encre-noire/70">
                Pour lancer le simulateur de conventions, liez un Preset Séquenceur avec audio ou ajoutez une piste audio au morceau dans le Répertoire.
              </p>
            </div>
          ) : pausePoints.length === 0 ? (
            <div className="p-6 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-lg text-center flex flex-col gap-2">
              <span className="text-2xl">🖐️</span>
              <p className="text-sm font-black">Aucun signal du Mestre n'a été détecté pour ce morceau.</p>
              <p className="text-xs text-encre-noire/70">
                Le Mestre peut configurer les signaux et conventions depuis le panneau « Mestria &gt; Répertoire ».
              </p>
            </div>
          ) : gameFinished ? (
            /* Écran de Bilan de Fin de Partie */
            <div className="p-6 bg-[#fdfaf2] border-2 border-encre-noire rounded-lg text-center flex flex-col items-center gap-3">
              <span className="text-4xl">🏆</span>
              <h3 className="text-base font-black text-cordel-wood uppercase">
                Morceau Terminé !
              </h3>
              <p className="text-xs font-bold text-encre-noire">
                Score sans faute au pupitre <strong>{AVAILABLE_PUPITRES.find(p => p.key === selectedPupitre)?.label}</strong> :
              </p>
              <div className="text-3xl font-black text-[var(--color-cordel-vert,#2d6a4f)]">
                {score} / {interactiveSignals.length}
              </div>
              <p className="text-[11px] font-bold text-encre-noire/70 italic">
                {score === interactiveSignals.length
                  ? '👑 Score Parfait ! Toutes les conventions ont été jouées dès le premier essai.'
                  : '🌿 Belle session de réflexe ! Continue de pratiquer pour automatiser tes départs.'}
              </p>
              <div className="flex gap-2 mt-3">
                <CordelButton
                  type="button"
                  variant="ocre"
                  onClick={resetGame}
                  className="py-1.5 px-4 text-xs font-black uppercase"
                >
                  🔄 Rejouer le Morceau
                </CordelButton>
                <CordelButton
                  type="button"
                  variant="default"
                  onClick={onClose}
                  className="py-1.5 px-4 text-xs font-black uppercase"
                >
                  Fermer
                </CordelButton>
              </div>
            </div>
          ) : (
            <>
              {/* Barre de configuration : Choix du Pupitre & Score */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#fdfaf2] p-3 rounded-lg border border-encre-noire/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                    Mon Pupitre :
                  </span>
                  <select
                    value={selectedPupitre}
                    disabled={isPlaying || isPausedForQuiz}
                    onChange={(e) => setSelectedPupitre(e.target.value)}
                    className="theme-input text-xs font-bold py-1 px-2.5 bg-white border border-encre-noire/40 rounded cursor-pointer"
                  >
                    {AVAILABLE_PUPITRES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black uppercase text-encre-noire">
                    Score : <strong className="text-[var(--color-cordel-vert,#2d6a4f)]">{score}</strong> / {interactiveSignals.length}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {interactiveSignals.length} défi{interactiveSignals.length > 1 ? 's' : ''} « Temps 1 »
                  </span>
                </div>
              </div>

              {/* Bannière visuelle du Mestre */}
              <ReflexSignalBanner
                currentSignal={currentSignal}
                isPausedForQuiz={isPausedForQuiz}
                isSignalActive={isSignalActive}
                feedback={feedback}
                feedbackType={feedbackType}
              />

              {/* Plateau de jeu si quiz actif au Temps 1 */}
              {isPausedForQuiz && quizOptions.length > 0 && (
                <div className="mt-2 animate-fadeIn">
                  <ReflexGameBoard
                    options={quizOptions}
                    selectedOptionId={selectedOptionId}
                    validationState={validationState}
                    onSelectOption={handleSelectOption}
                    disabled={validationState === 'success'}
                  />
                </div>
              )}

              {/* Lecteur de suivi temporel */}
              <div className="p-3 bg-[#fdfaf2] rounded-lg border border-encre-noire/20 flex flex-col gap-2 mt-auto">
                <div className="flex items-center justify-between text-xs font-bold text-encre-noire/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPausedForQuiz}
                      onClick={togglePlayPause}
                      className={`px-3 py-1 rounded text-xs font-black uppercase cursor-pointer transition-all ${
                        isPausedForQuiz
                          ? 'opacity-40 bg-stone-200 text-stone-600 cursor-not-allowed'
                          : isPlaying
                            ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white hover:brightness-110'
                            : 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:brightness-110 shadow-xs'
                      }`}
                    >
                      {isPlaying ? '⏸ Pause' : '▶ Lancer l\'écoute'}
                    </button>
                    <span className="text-[11px] font-mono">
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span>Prochain arrêt :</span>
                    <strong className="text-cordel-wood">
                      {(() => {
                        const next = pausePoints.find(p => p.pauseTime > currentTime && p.isInteractive);
                        return next ? `Mesure ${next.targetMeasure} (${next.name})` : 'Fin du morceau';
                      })()}
                    </strong>
                  </div>
                </div>

                {/* Barre de progression avec marqueurs de signaux */}
                <div className="relative w-full h-3 bg-stone-300 rounded overflow-hidden">
                  <div
                    className="h-full bg-cordel-wood transition-all duration-100"
                    style={{
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                    }}
                  />
                  {duration > 0 && pausePoints.map((p) => {
                    const posPct = (p.pauseTime / duration) * 100;
                    return (
                      <div
                        key={p.signalId}
                        style={{ left: `${posPct}%` }}
                        className={`absolute top-0 bottom-0 w-1 ${p.isInteractive ? 'bg-amber-600' : 'bg-blue-400'}`}
                        title={`Signal Mesure ${p.mesure} ➔ Arrêt Mesure ${p.targetMeasure}`}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
