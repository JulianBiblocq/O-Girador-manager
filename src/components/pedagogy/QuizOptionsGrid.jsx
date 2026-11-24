/**
 * Grille de propositions QCM Cordel & vignette d'énoncé pour les Signes du Mestre (< 130 lignes).
 * Rend une grille 2×2 de vignettes <img> avec repli 🖐️ (zéro URL brute affichée) pour les gestes.
 */

import React, { useState } from 'react';
import SeloAxeStamp from '../SeloAxeStamp';
import PatternVisualizer from './PatternVisualizer';
import { isQuizMediaUrl, normalizeQuizMediaUrl } from '../../utils/quizTextValidator';
import { useTranslation } from '../LanguageContext';

/** Détermine si un choix correspond à une vignette d'image (Storage /sinais, extension image ou flag isImage). */
export function isQuizChoiceImage(choice, questionType = '') {
  if (!choice) return false;
  if (choice.isImage || questionType === 'image_options') return true;
  const raw = normalizeQuizMediaUrl(choice.imageUrl || choice.text || '');
  if (!/^(?:https?:\/\/|\/|data:image\/)/i.test(raw)) return false;
  return /^data:image\//i.test(raw) || /\/sinais(?:%2F|\/)/i.test(raw) || /firebasestorage\.googleapis\.com/i.test(raw) || /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(raw);
}

/** Retourne le libellé lisible de la bonne réponse sans jamais exposer d'URL brute dans le bloc feedback. */
export function resolveCorrectChoiceLabel(question) {
  if (!question) return '';
  const correctChoice = Array.isArray(question.choices) ? question.choices.find((c) => c?.isCorrect) : null;
  if (correctChoice?.label && !isQuizMediaUrl(correctChoice.label)) return correctChoice.label;
  if (question.correctAnswer && !isQuizMediaUrl(question.correctAnswer)) return question.correctAnswer;
  if (correctChoice?.text && !isQuizMediaUrl(correctChoice.text)) return correctChoice.text;
  return '';
}

/** Vignette centrée dans l'énoncé lorsque le geste du Mestre illustre une question à choix textuels. */
export function QuestionSignalImage({ src, alt }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const normSrc = normalizeQuizMediaUrl(src || '');
  if (!normSrc) return null;
  return (
    <div className="w-full flex justify-center my-2">
      {failedSrc === normSrc ? (
        <div className="h-32 w-32 rounded-lg border-2 border-dashed border-cordel-master-dark/30 bg-cordel-bg-light flex items-center justify-center text-4xl shadow-xs">
          <span role="img" aria-label={alt || 'Signe'}>🖐️</span>
        </div>
      ) : (
        <img src={normSrc} alt={alt || ''} loading="lazy" onError={() => setFailedSrc(normSrc)} className="max-h-44 rounded-lg shadow-md border-2 border-cordel-master-dark/20 object-contain bg-white/80 p-2" />
      )}
    </div>
  );
}

export default function QuizOptionsGrid({
  question, choices = [], selectedChoice = null, showFeedback = false, onSelectChoice, columnsClass = 'flex flex-col gap-2'
}) {
  const { t } = useTranslation();
  const [brokenUrls, setBrokenUrls] = useState({});
  const list = Array.isArray(choices) ? choices : [];
  const hasImageOptions = question?.type === 'image_options' || list.some((c) => isQuizChoiceImage(c, question?.type));

  if (hasImageOptions) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-1 w-full">
        {list.map((choice, idx) => {
          const imgSrc = normalizeQuizMediaUrl(choice?.imageUrl || choice?.text || '');
          const isSelected = selectedChoice === choice || Boolean(selectedChoice?.text && selectedChoice.text === choice?.text);
          const isBroken = !imgSrc || Boolean(brokenUrls[imgSrc]);
          const altLabel = t('pedagogyQuiz.gestureOptionAlt', { index: idx + 1 }) || `Option ${idx + 1}`;
          const stateCls = showFeedback
            ? (choice.isCorrect ? 'border-[var(--color-cordel-vert)] bg-[var(--color-cordel-vert)]/10 ring-2 ring-[var(--color-cordel-vert)]/35 shadow-md' : (isSelected ? 'border-[var(--color-cordel-rouge)] bg-[var(--color-cordel-rouge)]/10 opacity-85' : 'border-encre-noire/10 bg-white/60 opacity-45 grayscale'))
            : 'border-encre-noire/20 bg-white hover:border-[var(--color-cordel-ocre)] hover:shadow-md cursor-pointer';

          return (
            <button key={idx} type="button" disabled={showFeedback} onClick={() => onSelectChoice?.(choice)} aria-label={altLabel} className={`relative p-2.5 rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden ${stateCls}`}>
              {isBroken ? (
                <div className="h-28 max-h-32 w-full flex items-center justify-center rounded-md bg-cordel-bg-light text-4xl">
                  <span aria-hidden="true">🖐️</span>
                </div>
              ) : (
                <img src={imgSrc} alt={altLabel} loading="lazy" onError={() => setBrokenUrls((prev) => ({ ...prev, [imgSrc]: true }))} className="w-full h-28 max-h-32 object-contain rounded-md mx-auto" />
              )}
              {showFeedback && (choice.isCorrect || isSelected) && (
                <span className="absolute top-1.5 right-1.5 text-lg drop-shadow-sm select-none">{choice.isCorrect ? '✅' : '❌'}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={columnsClass}>
      {list.map((choice, idx) => {
        const isSelected = selectedChoice === choice || Boolean(selectedChoice?.text && selectedChoice.text === choice?.text);
        const btnCls = showFeedback
          ? (choice.isCorrect ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire shadow-md' : (isSelected ? 'bg-[var(--color-cordel-rouge)] text-white border-encre-noire opacity-85' : 'bg-white border-encre-noire/10 text-encre-noire/40 opacity-50'))
          : 'bg-white border-encre-noire/20 text-encre-noire hover:bg-neutral-100 cursor-pointer';

        return (
          <button key={idx} type="button" disabled={showFeedback} onClick={() => onSelectChoice?.(choice)} className={`text-left px-4 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-between gap-3 ${btnCls}`}>
            <span className="text-sm">{choice.text}</span>
            {choice.visualElement?.type === 'orixaBadge' && <SeloAxeStamp size="sm" stampKey={choice.visualElement.stampKey} couleurs={choice.visualElement.couleurs} />}
            {choice.visualElement?.type === 'pattern' && <PatternVisualizer patternArray={choice.visualElement.patternData} />}
          </button>
        );
      })}
    </div>
  );
}
