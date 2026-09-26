import React from 'react';
import CordelCard from '../CordelCard';
import { formatThemeTitle, formatThemeIcon } from '../../utils/gameUtils';

/**
 * En-tête et carte de la question avec barre de progression du temps restant (10s)
 * et affichage des médias éventuels.
 *
 * @param {Object} question Question active
 * @param {number} questionIndex Index actuel (0 à 4)
 * @param {number} totalQuestions Total des questions (5)
 * @param {string} theme Thème de la partie ('rythme' | 'culture')
 * @param {number} remainingRatio Ratio de temps restant (1 à 0)
 * @param {number} remainingSeconds Secondes restantes
 * @param {string} phase Phase en cours ('question' | 'reveal')
 */
export default function GameQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  theme,
  remainingRatio = 1,
  remainingSeconds = 10,
  phase = 'question'
}) {
  if (!question) return null;

  // Calcul de la couleur de la jauge selon le temps restant
  const getProgressColor = () => {
    if (phase === 'reveal') return 'bg-[var(--color-cordel-vert)]';
    if (remainingRatio > 0.4) return 'bg-[var(--color-cordel-vert)]';
    if (remainingRatio > 0.2) return 'bg-[var(--color-cordel-ocre)]';
    return 'bg-[var(--color-cordel-rouge)]';
  };

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="p-4 bg-cordel-bg-light border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] text-left"
    >
      {/* Barre supérieure : Index et thème */}
      <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-cordel-master-dark/20 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl select-none">{formatThemeIcon(theme)}</span>
          <span className="text-[11px] font-black uppercase tracking-wider text-cordel-wood">
            {formatThemeTitle(theme)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-encre-noire/30 shadow-2xs">
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          {phase === 'question' && (
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded border border-encre-noire ${
                remainingSeconds <= 3
                  ? 'bg-red-100 text-[var(--color-cordel-rouge)] animate-pulse'
                  : 'bg-white text-encre-noire'
              }`}
            >
              ⏱️ {remainingSeconds}s
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression fluide du temps (10s) */}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden border border-encre-noire/30 mb-4">
        <div
          className={`h-full transition-all duration-100 ease-linear ${getProgressColor()}`}
          style={{ width: `${Math.max(0, Math.min(100, remainingRatio * 100))}%` }}
        />
      </div>

      {/* Intitulé de la question */}
      <h3 className="text-sm sm:text-base font-black text-encre-noire leading-snug my-2">
        {question.questionText}
      </h3>

      {/* Média éventuel (image ou extrait) */}
      {question.mediaUrl && question.mediaType === 'image' && (
        <div className="my-3 flex justify-center">
          <img
            src={question.mediaUrl}
            alt="Illustration de la question"
            className="max-h-40 rounded-lg border-2 border-encre-noire object-contain shadow-xs"
          />
        </div>
      )}

      {question.mediaUrl && question.mediaType === 'audio' && (
        <div className="my-3 p-2 bg-white rounded border border-encre-noire/30 flex justify-center">
          <audio controls src={question.mediaUrl} className="w-full max-w-sm" autoPlay />
        </div>
      )}
    </CordelCard>
  );
}
