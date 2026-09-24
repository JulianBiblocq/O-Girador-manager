import React from 'react';

/**
 * Bannière d'affichage et d'animation du geste du Mestre.
 * S'anime à la mesure N lors de l'annonce du signal,
 * puis alerte visuellement au Temps 1 de la mesure N+1 lors de l'arrêt audio.
 *
 * @param {Object} props
 * @param {Object|null} props.currentSignal - Signal actif
 * @param {boolean} props.isPausedForQuiz - Vrai lorsque l'audio est coupé au temps 1
 * @param {boolean} props.isSignalActive - Vrai pendant la mesure N d'annonce
 * @param {string|null} props.feedback - Message de rétroaction
 * @param {'success'|'error'|null} props.feedbackType - Type de retour
 */
export default function ReflexSignalBanner({
  currentSignal,
  isPausedForQuiz,
  isSignalActive,
  feedback,
  feedbackType
}) {
  if (!currentSignal && !feedback) {
    return (
      <div className="w-full p-3 rounded-lg border-2 border-dashed border-cordel-master-dark/20 bg-[#fdfaf2] text-center">
        <p className="text-xs font-bold text-cordel-master-dark/60 italic">
          🎧 Écoute attentivement... Le Mestre prépare son premier signal.
        </p>
      </div>
    );
  }

  const signalName = currentSignal?.name || 'Signal du Mestre';
  const mesureNum = currentSignal?.mesure || 1;
  const isRepereOnly = currentSignal && !currentSignal.isInteractive;

  return (
    <div
      className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 shadow-[2px_2px_0px_0px_#181716] ${
        feedbackType === 'success'
          ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-[#1b4332]'
          : feedbackType === 'error'
            ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white border-[#5c1c11] animate-shake'
            : isPausedForQuiz
              ? 'bg-amber-100 border-[var(--color-cordel-ocre,#c05621)] text-amber-950 animate-pulse'
              : isSignalActive
                ? 'bg-[#fdfaf2] border-[var(--color-cordel-ocre,#c05621)] text-cordel-wood'
                : 'bg-[#fdfaf2] border-cordel-master-dark/30 text-encre-noire'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-stone-900/10 flex items-center justify-center text-xl shrink-0 border border-current">
            {feedbackType === 'success' ? (
              '✅'
            ) : feedbackType === 'error' ? (
              '❌'
            ) : isPausedForQuiz ? (
              '⏸️'
            ) : (
              '✋'
            )}
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                {isPausedForQuiz
                  ? '🎯 TEMPS 1 — CONVENTION À JOUER'
                  : isSignalActive
                    ? `✋ ANNONCE MESTRE (Mesure ${mesureNum})`
                    : `Repère Mesure ${mesureNum}`}
              </span>
              {isRepereOnly && (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-stone-200 text-stone-800">
                  Simple Repère
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black leading-tight">
              {feedback || signalName}
            </h3>
          </div>
        </div>

        {/* Indication contextuelle */}
        <div className="shrink-0 text-right">
          {isPausedForQuiz ? (
            <span className="inline-block px-3 py-1 rounded text-xs font-black uppercase bg-[var(--color-cordel-ocre,#c05621)] text-white shadow-xs">
              Clique sur la bonne tablature
            </span>
          ) : isSignalActive ? (
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
              Prépare-toi pour le temps 1
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
