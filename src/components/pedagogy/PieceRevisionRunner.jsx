/**
 * Exécuteur du parcours « Réviser un Morceau du Répertoire » (< 140 lignes).
 * Combine Toada, caractéristiques musicales et fiches Culture, et synchronise le confort si >= 75%.
 */

import React, { useMemo, useState } from 'react';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import SeloAxeStamp from '../SeloAxeStamp';
import PatternVisualizer from './PatternVisualizer';
import { generateQuizFromRepertoirePiece } from '../../utils/quizGenerator';
import { isCantadorValidated } from '../../utils/repertoireMatcher';
import { launchCantador, launchTrainingStage, resolveUserSequencerRole } from '../../utils/trainingLauncher';
import { syncComfortAfterPractice } from '../../utils/aisanceAutoSync';
import { useTranslation } from '../LanguageContext';

export default function PieceRevisionRunner({
  piece, profileData, songs = [], educationalSheets = [], currentComfort = null,
  rhythms = [], rhythmsJsonData = {}, mestreSignals = [], sequenceurUrl, onExit, onComfortPromoted = null
}) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [promotedToast, setPromotedToast] = useState(null);

  const activeToada = useMemo(
    () => piece?.activeToada || songs.find((s) => s.id === (piece?.toadaDocId || piece?.toadaId)) || null,
    [piece, songs]
  );

  const questions = useMemo(() => {
    if (!piece) return [];
    const presetData = (piece.sequenceurId && rhythmsJsonData[piece.sequenceurId]) || piece.parsedSequencerData || piece.preset?.parsedData || null;
    const userInstrument = resolveUserSequencerRole(profileData) || 'alfaia';
    return generateQuizFromRepertoirePiece(
      { ...piece, activeToada },
      { presetData, allPresets: rhythms, toadaDoc: activeToada, allSongs: songs, allSheetsData: educationalSheets, catalogSignals: mestreSignals, userInstrument, t },
      { t }
    );
  }, [piece, activeToada, rhythmsJsonData, rhythms, songs, educationalSheets, mestreSignals, profileData, t]);

  const canOpenCantador = useMemo(() => isCantadorValidated({ ...piece, activeToada }), [piece, activeToada]);
  const hasSequencer = Boolean(piece?.sequenceurId);

  const handlePracticeCantador = () => launchCantador({
    mode: 'eleve', songId: piece?.toadaDocId || activeToada?.id || piece?.id,
    toadaId: piece?.cantadorToadaId || activeToada?.cantadorToadaId || undefined, groupId: profileData?.groupId
  });

  const handlePracticeSequencer = () => launchTrainingStage(piece.sequenceurId, undefined, 0, {
    role: resolveUserSequencerRole(profileData) || undefined, tocarJunto: 1, baseOnly: 1, baseUrl: sequenceurUrl
  });

  const handleSelectChoice = (choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);
    if (choice.isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedChoice(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setIsFinished(true);
      syncComfortAfterPractice({
        db, userId: profileData?.uid || profileData?.id, groupId: profileData?.groupId,
        pieceId: piece?.id, currentComfort, quizScorePct: questions.length > 0 ? score / questions.length : 0,
        onPromoted: (newComfort) => { setPromotedToast(newComfort); onComfortPromoted?.(newComfort, piece?.id); }
      }).catch(() => {});
    }
  };

  if (questions.length === 0 || isFinished) {
    return (
      <CordelCard className="p-6 md:p-8 flex flex-col items-center text-center gap-4 bg-[#fdfaf2]">
        <div className="text-4xl">{questions.length === 0 ? '🎼' : '🏆'}</div>
        <h3 className="text-2xl font-heading uppercase tracking-widest text-cordel-wood">{piece?.titre || t('pedagogy.student.bilanDuQuiz')}</h3>
        {questions.length > 0 && <p className="text-lg font-black text-encre-noire">{score} / {questions.length}</p>}
        {promotedToast && (
          <div className="px-3.5 py-2 rounded border border-[var(--color-cordel-vert)] bg-[var(--color-cordel-vert)]/10 text-xs font-black text-[var(--color-cordel-vert)]">
            🌿 {t('pedagogy.carnet.toastAutoPromotedPratique')}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
          {canOpenCantador && <button type="button" onClick={handlePracticeCantador} className="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-[var(--color-cordel-ocre)] text-white border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] cursor-pointer">{t('pedagogy.btnPracticeCantador')}</button>}
          {hasSequencer && <button type="button" onClick={handlePracticeSequencer} className="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-[var(--color-cordel-vert)] text-white border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] cursor-pointer">{t('pedagogy.btnPracticeSequenciador')}</button>}
          <CordelButton variant="default" onClick={onExit} className="px-5 py-2.5 text-xs font-black uppercase">{t('pedagogy.backToWorkshop')}</CordelButton>
        </div>
      </CordelCard>
    );
  }

  const q = questions[currentIndex];
  const explanationText = q.explanation || q.correctAnswerExplanation || q.feedback || '';

  return (
    <CordelCard className="p-6 flex flex-col gap-5 bg-[#fdfaf2] text-left">
      <div className="flex items-center justify-between border-b border-dashed border-encre-noire/20 pb-3">
        <span className="text-xs font-black uppercase tracking-widest text-cordel-wood">🎼 {piece?.titre} — {t('pedagogy.questionProgress', { current: currentIndex + 1, total: questions.length })}</span>
        <button type="button" onClick={onExit} className="text-xs font-bold underline cursor-pointer">{t('pedagogy.btnQuitTraining')}</button>
      </div>
      <h4 className="text-base md:text-lg font-black text-encre-noire">{q.questionText || q.prompt}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(q.choices || []).map((choice, idx) => (
          <button key={idx} type="button" disabled={showFeedback} onClick={() => handleSelectChoice(choice)} className={`p-3.5 rounded-xl border-2 font-bold text-left flex items-center justify-between gap-3 cursor-pointer ${showFeedback ? (choice.isCorrect ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire' : (selectedChoice?.text === choice.text ? 'bg-[var(--color-cordel-rouge)] text-white border-encre-noire' : 'bg-white opacity-45 border-encre-noire/15')) : 'bg-white hover:bg-neutral-100 border-encre-noire/25'}`}>
            <span className="text-sm">{choice.text}</span>
            {choice.visualElement?.type === 'orixaBadge' && <SeloAxeStamp size="sm" stampKey={choice.visualElement.stampKey} couleurs={choice.visualElement.couleurs} />}
            {choice.visualElement?.type === 'pattern' && <PatternVisualizer patternArray={choice.visualElement.patternData} />}
          </button>
        ))}
      </div>
      {showFeedback && (
        <div className="p-3.5 rounded-lg border-2 border-cordel-wood/40 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-bold text-encre-noire">{explanationText}</p>
          <CordelButton variant="ocre" onClick={handleNext} className="px-4 py-1.5 text-xs font-black uppercase shrink-0">
            {currentIndex < questions.length - 1 ? t('pedagogy.progress.questionSuivante') : t('pedagogy.progress.voirLeResultat')}
          </CordelButton>
        </div>
      )}
    </CordelCard>
  );
}
