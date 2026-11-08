/**
 * Composants de rétroaction pédagogique immédiate et de bilan final du Quiz (< 140 lignes).
 * Affiche l'explication enrichie (catégorie métier, prononciation PT, vers de Toada) après chaque réponse.
 */

import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

export function QuizAnswerFeedbackBox({ question, selectedChoice }) {
  const { t } = useTranslation();
  if (!question) return null;

  const isCorrect = Boolean(selectedChoice?.isCorrect);
  const correctText = question.choices
    ? question.choices.find((c) => c.isCorrect)?.text
    : question.correctAnswer;
  const explanationText =
    question.explanation || question.correctAnswerExplanation || question.feedback || '';

  return (
    <div
      className={`mt-4 p-4 rounded-lg border-2 flex flex-col gap-2 w-full animate-fadeIn text-left ${
        isCorrect ? 'bg-cordel-vert/10 border-cordel-vert' : 'bg-cordel-ocre/10 border-cordel-ocre'
      }`}
    >
      <h4
        className={`text-sm font-black uppercase tracking-wider ${
          isCorrect ? 'text-cordel-vert' : 'text-cordel-ocre'
        }`}
      >
        {isCorrect ? t('pedagogy.student.bienJoue') : t('pedagogy.student.presque')}
      </h4>
      {!isCorrect && (
        <p className="text-xs font-bold text-encre-noire/85">
          {t('pedagogy.student.laBonneReponseEtait')}{' '}
          <span className="font-black">{correctText}</span>
        </p>
      )}
      {explanationText && (
        <p className="text-xs font-bold text-encre-noire/80 leading-relaxed">
          💡 {explanationText}
        </p>
      )}
    </div>
  );
}

export default function QuizResultSummaryCard({
  score = 0,
  total = 0,
  selectedChoice = null,
  showFeedback = false,
  savingScore = false,
  wrongAnswers = [],
  onExit = null,
  onRestartHome = null
}) {
  const { t } = useTranslation();
  const percentage = total > 0 ? score / total : 0;
  let message = 'Bel effort !';
  let emoji = '💪';
  if (percentage >= 0.8) {
    message = 'Excellent ! Quel talent !';
    emoji = '🏆';
  } else if (percentage >= 0.5) {
    message = 'Pas mal du tout !';
    emoji = '🥁';
  } else {
    message = "Encore un peu d'entraînement !";
    emoji = '🌱';
  }

  const finalScoreDisplay = score + (selectedChoice?.isCorrect && !showFeedback ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-none p-4 select-none">
      <CordelCard className="p-8 flex flex-col gap-6 items-center text-center">
        <div className="text-5xl">{emoji}</div>
        <h2 className="text-3xl font-heading uppercase text-cordel-wood tracking-widest">
          {t('pedagogy.student.bilanDuQuiz')}
        </h2>
        <p className="text-xl font-bold text-encre-noire">
          {finalScoreDisplay} / {total}
        </p>
        <p className="text-sm font-black text-[var(--color-cordel-vert)] uppercase tracking-wider">
          {message}
        </p>

        {savingScore && (
          <span className="text-[10px] animate-pulse">
            {t('pedagogy.student.enregistrementDuScore')}
          </span>
        )}

        {wrongAnswers.length > 0 && (
          <div className="w-full mt-4 flex flex-col gap-3 text-left bg-cordel-rouge/5 border border-cordel-rouge/20 p-4 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-cordel-rouge">
              {t('pedagogy.student.aReviser')}
            </span>
            {wrongAnswers.map((w, i) => (
              <div key={i} className="text-xs border-b border-cordel-rouge/10 pb-2 last:border-0 last:pb-0">
                <p className="font-bold text-encre-noire/80 mb-1">{w.prompt}</p>
                <p className="text-[var(--color-cordel-vert)] font-black">➔ {w.correct}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <CordelButton
            variant="primary"
            onClick={() => (onExit ? onExit() : onRestartHome && onRestartHome())}
            className="px-8 py-3 text-sm"
          >
            {onExit ? t('pedagogy.student.terminer') : t('pedagogy.student.retourALAccueil')}
          </CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}

