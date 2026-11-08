import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { calculatePauseTimes, extractPupitrePattern, generateDistractors, buildQuizOptions } from '../utils/reflexGameUtils';
import { saveReflexProgress } from '../services/aisanceService';
import { syncComfortAfterPractice } from '../utils/aisanceAutoSync';

export const PUPITRE_DEFINITIONS = [
  { key: 'caixa', defaultLabel: 'Caixa', labelKey: null },
  { key: 'tarol', defaultLabel: 'Tarol', labelKey: null },
  { key: 'gongue', defaultLabel: 'Gonguê', labelKey: 'pedagogy.reflex.gongue' },
  { key: 'alfaia', defaultLabel: 'Alfaia', labelKey: null },
  { key: 'marcante', defaultLabel: 'Alfaia Marcante', labelKey: 'pedagogy.reflex.alfaiaMarcante' },
  { key: 'agbe', defaultLabel: 'Agbe / Shekere', labelKey: 'pedagogy.reflex.agbeShekere' },
  { key: 'mineiro', defaultLabel: 'Mineiro / Ganzá', labelKey: 'pedagogy.reflex.mineiroGanza' },
  { key: 'timbal', defaultLabel: 'Timbal', labelKey: 'pedagogy.reflex.timbal' }
];

/** Hook de session du Défi Réflexe « Temps 1 » (< 140 lignes). */
export function useReflexGameSession({ isOpen, piece, presetData, profileData, groupId, currentComfort = null, onComfortPromoted = null, onScoreSaved = null }) {
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);
  const initialPupitre = useMemo(() => {
    const raw = (profileData?.instrument || profileData?.instrumentPrincipal || profileData?.instrumentsJoues?.[0] || 'caixa').toLowerCase();
    return PUPITRE_DEFINITIONS.find((p) => raw.includes(p.key))?.key || 'caixa';
  }, [profileData]);

  const [selectedPupitre, setSelectedPupitre] = useState(initialPupitre);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSignal, setCurrentSignal] = useState(null);
  const [isPausedForQuiz, setIsPausedForQuiz] = useState(false);
  const [isSignalActive, setIsSignalActive] = useState(false);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [validationState, setValidationState] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const pausedSignalsRef = useRef(new Set());
  const hadErrorOnSignalRef = useRef(false);
  const isPausedForQuizRef = useRef(false);

  const effectivePreset = presetData || piece?.preset?.parsedData || piece?.preset || null;
  const pausePoints = useMemo(() => (piece ? calculatePauseTimes(piece, effectivePreset, selectedPupitre) : []), [piece, effectivePreset, selectedPupitre]);
  const interactiveSignals = useMemo(() => pausePoints.filter((p) => p.isInteractive), [pausePoints]);
  const audioUrl = piece?.activeAudioUrl || piece?.audioUrl || piece?.preset?.audioUrl || effectivePreset?.audioUrl;

  const resetGame = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    pausedSignalsRef.current.clear(); hadErrorOnSignalRef.current = false; isPausedForQuizRef.current = false;
    setCurrentTime(0); setIsPlaying(false); setCurrentSignal(null); setIsPausedForQuiz(false);
    setIsSignalActive(false); setQuizOptions([]); setSelectedOptionId(null); setValidationState(null);
    setFeedback(null); setFeedbackType(null); setScore(0); setGameFinished(false);
  }, []);

  useEffect(() => {
    if (!isOpen && audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, [isOpen]);

  const checkTimeSync = useCallback((time) => {
    if (isPausedForQuizRef.current) return;
    const activeSig = pausePoints.find((p) => time >= p.announcementStartTime && time < p.pauseTime + 0.3);
    setCurrentSignal(activeSig || null);
    setIsSignalActive(Boolean(activeSig && time < activeSig.pauseTime));
    for (const p of pausePoints) {
      if (time >= p.pauseTime - 0.05 && time <= p.pauseTime + 0.35 && !pausedSignalsRef.current.has(p.signalId)) {
        pausedSignalsRef.current.add(p.signalId);
        if (p.isInteractive) {
          if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = p.pauseTime; }
          setIsPlaying(false); setIsPausedForQuiz(true); isPausedForQuizRef.current = true;
          hadErrorOnSignalRef.current = false; setCurrentSignal(p);
          const correctPat = extractPupitrePattern(effectivePreset, selectedPupitre, p.targetMeasureIndex);
          const distractors = generateDistractors(correctPat, effectivePreset, selectedPupitre, [], p.override, p.targetMeasureIndex);
          setQuizOptions(buildQuizOptions(correctPat, distractors));
          setSelectedOptionId(null); setValidationState(null); setFeedback(null); setFeedbackType(null);
          break;
        } else {
          setFeedback(`👁️ Repère visuel : ${p.name}`); setFeedbackType('success');
          setTimeout(() => { setFeedback(null); setFeedbackType(null); }, 2800);
        }
      }
    }
  }, [pausePoints, effectivePreset, selectedPupitre]);

  useEffect(() => {
    if (!isPlaying) { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); return; }
    const tick = () => {
      if (audioRef.current) { setCurrentTime(audioRef.current.currentTime); checkTimeSync(audioRef.current.currentTime); }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, checkTimeSync]);

  const handleSelectOption = (option) => {
    if (validationState === 'success') return;
    setSelectedOptionId(option.id);
    if (option.isCorrect) {
      setValidationState('success'); setFeedback('✅ Bravo ! Convention validée. Reprise sur le temps 1...'); setFeedbackType('success');
      if (!hadErrorOnSignalRef.current) setScore((prev) => prev + 1);
      setTimeout(() => {
        setIsPausedForQuiz(false); isPausedForQuizRef.current = false; setQuizOptions([]); setSelectedOptionId(null); setValidationState(null); setFeedback(null); setFeedbackType(null);
        if (audioRef.current) audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }, 700);
    } else {
      hadErrorOnSignalRef.current = true; setValidationState('error'); setFeedback("⚠️ Ce n'est pas la bonne phrase ! Réessaie..."); setFeedbackType('error');
      setTimeout(() => setValidationState(null), 1100);
    }
  };

  const handleAudioEnded = async () => {
    setIsPlaying(false); setGameFinished(true);
    const userId = profileData?.uid || profileData?.id;
    const effGroupId = groupId || profileData?.groupId || '';
    const totalCount = interactiveSignals.length;
    if (userId && piece?.id) {
      try {
        await saveReflexProgress(userId, { pieceId: piece.id, pieceTitle: piece.titre || 'Morceau', pupitre: selectedPupitre, score, totalSignals: totalCount, perfectScore: totalCount > 0 && score === totalCount, groupId: effGroupId });
        if (totalCount > 0 && score / totalCount >= 0.75) await syncComfortAfterPractice({ db, userId, groupId: effGroupId, pieceId: piece.id, practiceSuccess: true, allStagesCompleted: score === totalCount, currentComfort, onPromoted: onComfortPromoted });
        if (onScoreSaved) onScoreSaved({ score, totalSignals: totalCount, pupitre: selectedPupitre });
      } catch (err) { console.warn('[ReflexGame] Erreur sauvegarde :', err); }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  return {
    audioRef, audioUrl, selectedPupitre, setSelectedPupitre, isPlaying, currentTime, duration, setDuration,
    pausePoints, interactiveSignals, currentSignal, isPausedForQuiz, isSignalActive, quizOptions,
    selectedOptionId, validationState, feedback, feedbackType, score, gameFinished,
    resetGame, handleSelectOption, handleAudioEnded, togglePlayPause
  };
}
