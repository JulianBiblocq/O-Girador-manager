import React, { useMemo } from 'react';
import CordelButton from '../CordelButton';
import ReflexSignalBanner from './reflex/ReflexSignalBanner';
import ReflexGameBoard from './reflex/ReflexGameBoard';
import { useReflexGameSession, PUPITRE_DEFINITIONS } from '../../hooks/useReflexGameSession';
import { useTranslation } from '../LanguageContext';

/**
 * Modale immersive du Défi Réflexe « Temps 1 » (< 140 lignes).
 * Coupe l'audio au temps 1 de la mesure N+1 (en respectant cueOnly et les mesures muettes du pupitre)
 * et synchronise automatiquement le confort (syncComfortAfterPractice).
 */
export default function ReflexGameModal({
  isOpen, onClose, piece, presetData, profileData, groupId,
  currentComfort = null, onComfortPromoted = null, onScoreSaved = null
}) {
  const { t } = useTranslation();
  const availablePupitres = useMemo(
    () => PUPITRE_DEFINITIONS.map((p) => ({ key: p.key, label: p.labelKey ? t(p.labelKey) : p.defaultLabel })),
    [t]
  );

  const {
    audioRef, audioUrl, selectedPupitre, setSelectedPupitre, isPlaying, currentTime, duration, setDuration,
    pausePoints, interactiveSignals, currentSignal, isPausedForQuiz, isSignalActive, quizOptions,
    selectedOptionId, validationState, feedback, feedbackType, score, gameFinished,
    resetGame, handleSelectOption, handleAudioEnded, togglePlayPause
  } = useReflexGameSession({
    isOpen, piece, presetData, profileData, groupId,
    currentComfort, onComfortPromoted, onScoreSaved
  });

  if (!isOpen) return null;

  const nextStop = pausePoints.find((p) => p.pauseTime > currentTime && p.isInteractive);
  const fmtTime = (sec) => `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl border-2 border-encre-noire overflow-hidden text-left">
        {audioUrl && (
          <audio
            ref={audioRef} src={audioUrl} preload="auto" onEnded={handleAudioEnded}
            onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
          />
        )}

        <div className="flex justify-between items-center gap-3 px-4 py-3 bg-[#fdfaf2] border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider">🎯 {t('pedagogy.reflex.defiReflexeTemps1')} — {piece?.titre}</h2>
            <p className="text-[10px] font-bold text-encre-noire/70">{t('pedagogy.reflex.arretAutomatiqueAuTemps1')}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white hover:bg-red-700 cursor-pointer" title={t('pedagogy.reflex.fermerBouton')}>✕</button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
          {!audioUrl ? (
            <div className="p-6 bg-red-50 border-2 border-[var(--color-cordel-rouge,#8b2a1a)] text-[var(--color-cordel-rouge,#8b2a1a)] rounded-lg text-center flex flex-col gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-black">{t('pedagogy.reflex.aucunEnregistrementAudioRattacheA')}</p>
              <p className="text-xs text-encre-noire/70">{t('pedagogy.reflex.pourLancerLeSimulateurDe')}</p>
            </div>
          ) : pausePoints.length === 0 ? (
            <div className="p-6 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-lg text-center flex flex-col gap-2">
              <span className="text-2xl">🖐️</span>
              <p className="text-sm font-black">{t('pedagogy.reflex.aucunSignalDuMestreN')}</p>
              <p className="text-xs text-encre-noire/70">{t('pedagogy.reflex.leMestrePeutConfigurer')}</p>
            </div>
          ) : gameFinished ? (
            <div className="p-6 bg-[#fdfaf2] border-2 border-encre-noire rounded-lg text-center flex flex-col items-center gap-3">
              <span className="text-4xl">🏆</span>
              <h3 className="text-base font-black text-cordel-wood uppercase">{t('pedagogy.reflex.morceauTermine')}</h3>
              <p className="text-xs font-bold text-encre-noire">{t('pedagogy.reflex.scoreSansFauteAuPupitre')}<strong>{availablePupitres.find((p) => p.key === selectedPupitre)?.label}</strong> :</p>
              <div className="text-3xl font-black text-[var(--color-cordel-vert,#2d6a4f)]">{score} / {interactiveSignals.length}</div>
              <p className="text-[11px] font-bold text-encre-noire/70 italic">
                {score === interactiveSignals.length ? t('pedagogy.reflex.scoreParfaitToutesLesConventions') : t('pedagogy.reflex.belleSessionDeReflexeContinue')}
              </p>
              <div className="flex gap-2 mt-3">
                <CordelButton type="button" variant="ocre" onClick={resetGame} className="py-1.5 px-4 text-xs font-black uppercase">{t('pedagogy.reflex.rejouerLeMorceau')}</CordelButton>
                <CordelButton type="button" variant="default" onClick={onClose} className="py-1.5 px-4 text-xs font-black uppercase">{t('pedagogy.reflex.fermerBouton')}</CordelButton>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#fdfaf2] p-3 rounded-lg border border-encre-noire/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">{t('pedagogy.reflex.monPupitre')}</span>
                  <select value={selectedPupitre} disabled={isPlaying || isPausedForQuiz} onChange={(e) => setSelectedPupitre(e.target.value)} className="theme-input text-xs font-bold py-1 px-2.5 bg-white border border-encre-noire/40 rounded cursor-pointer">
                    {availablePupitres.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black uppercase text-encre-noire">{t('pedagogy.reflex.score')}<strong className="text-[var(--color-cordel-vert,#2d6a4f)]">{score}</strong> / {interactiveSignals.length}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">{interactiveSignals.length} {t('pedagogy.reflex.defi')}{interactiveSignals.length > 1 ? 's' : ''} {t('pedagogy.reflex.temps1')}</span>
                </div>
              </div>

              <ReflexSignalBanner currentSignal={currentSignal} isPausedForQuiz={isPausedForQuiz} isSignalActive={isSignalActive} feedback={feedback} feedbackType={feedbackType} />

              {isPausedForQuiz && quizOptions.length > 0 && (
                <div className="mt-2 animate-fadeIn">
                  <ReflexGameBoard options={quizOptions} selectedOptionId={selectedOptionId} validationState={validationState} onSelectOption={handleSelectOption} disabled={validationState === 'success'} />
                </div>
              )}

              <div className="p-3 bg-[#fdfaf2] rounded-lg border border-encre-noire/20 flex flex-col gap-2 mt-auto">
                <div className="flex items-center justify-between text-xs font-bold text-encre-noire/80">
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={isPausedForQuiz} onClick={togglePlayPause} className={`px-3 py-1 rounded text-xs font-black uppercase cursor-pointer transition-all ${isPausedForQuiz ? 'opacity-40 bg-stone-200 text-stone-600 cursor-not-allowed' : isPlaying ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white' : 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-xs'}`}>
                      {isPlaying ? t('pedagogy.reflex.pause') : t('pedagogy.reflex.lancerLEcoute')}
                    </button>
                    <span className="text-[11px] font-mono">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span>{t('pedagogy.reflex.prochainArret')}</span>
                    <strong className="text-cordel-wood">{nextStop ? `Mesure ${nextStop.targetMeasure} (${nextStop.name})` : 'Fin du morceau'}</strong>
                  </div>
                </div>

                <div className="relative w-full h-3 bg-stone-300 rounded overflow-hidden">
                  <div className="h-full bg-cordel-wood transition-all duration-100" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }} />
                  {duration > 0 && pausePoints.map((p) => (
                    <div key={p.signalId} style={{ left: `${(p.pauseTime / duration) * 100}%` }} className={`absolute top-0 bottom-0 w-1 ${p.isInteractive ? 'bg-amber-600' : 'bg-blue-400'}`} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
