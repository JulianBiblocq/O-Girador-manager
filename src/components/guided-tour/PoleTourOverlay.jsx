import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../LanguageContext';
import { resolveLocalizedGuideText, resolveLocalizedGuideSteps } from '../../config/poleGuides';
import {
  findPoleTourTargetElement,
  measureVisibleTargetRect,
  computePoleTourLayout
} from '../../utils/poleTourPositionUtils';

/**
 * Visite guidée interactive pas-à-pas bilingue (FR / PT-BR) aux variables sémantiques Cordel.
 */
export default function PoleTourOverlay({ guide, tabId, isOpen, onClose, onComplete }) {
  const { t, locale, i18n } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [targetFound, setTargetFound] = useState(false);
  const popoverRef = useRef(null);

  const activeLang = (typeof i18n !== 'undefined' && i18n?.language) || locale || 'fr';
  const isPt = activeLang === 'pt' || String(activeLang).toLowerCase().startsWith('pt');

  const steps = useMemo(
    () => resolveLocalizedGuideSteps(guide?.steps || guide?.etapes, isPt),
    [guide, isPt]
  );
  const targets = guide?.targets || [];
  const totalSteps = steps.length;
  const currentStepText = steps[currentStepIndex] || '';
  const currentTargetKey = targets[currentStepIndex] || null;

  useEffect(() => {
    if (isOpen) setCurrentStepIndex(0);
  }, [isOpen, tabId]);

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || totalSteps === 0) return;
    const element = findPoleTourTargetElement(currentTargetKey, tabId, currentStepIndex);
    const rect = measureVisibleTargetRect(element);
    setTargetRect(rect);
    setTargetFound(Boolean(rect));
  }, [isOpen, totalSteps, currentTargetKey, tabId, currentStepIndex]);

  useEffect(() => {
    if (!isOpen || totalSteps === 0) return undefined;
    const element = findPoleTourTargetElement(currentTargetKey, tabId, currentStepIndex);
    const rect = measureVisibleTargetRect(element);
    if (element && rect) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
    updateTargetPosition();
    const timer = setTimeout(updateTargetPosition, 320);
    return () => clearTimeout(timer);
  }, [isOpen, currentStepIndex, currentTargetKey, tabId, updateTargetPosition, totalSteps]);

  useEffect(() => {
    if (!isOpen) return undefined;
    window.addEventListener('scroll', updateTargetPosition, { passive: true, capture: true });
    window.addEventListener('resize', updateTargetPosition, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateTargetPosition, { capture: true });
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [isOpen, updateTargetPosition]);

  const handleFinish = useCallback(() => {
    if (tabId) {
      try {
        localStorage.setItem(`pole_tour_completed_${tabId}`, 'true');
      } catch (e) {
        console.warn("Impossible d'enregistrer la complétion du tour :", e);
      }
    }
    if (onComplete) onComplete();
    if (onClose) onClose();
  }, [tabId, onComplete, onClose]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  }, [currentStepIndex, totalSteps, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
  }, [currentStepIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !guide || totalSteps === 0) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const guideTitle = resolveLocalizedGuideText(guide.title || guide.titre, isPt) || t('poleGuides.tourDefaultTitle');
  const guideDescription = resolveLocalizedGuideText(guide.description, isPt);
  const { spotlightStyle, popoverStyle, placementClass } = computePoleTourLayout({ targetFound, targetRect });

  return createPortal(
    <div className="fixed inset-0 select-none z-[9999] pointer-events-auto">
      {spotlightStyle ? (
        <div style={spotlightStyle} />
      ) : (
        <div className="fixed inset-0 bg-encre-noire/75 z-[9998] transition-opacity duration-200" onClick={onClose} />
      )}

      <div
        ref={popoverRef}
        style={popoverStyle}
        className={`bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_14px_8px_12px] shadow-[3.5px_3.5px_0px_0px_var(--color-encre-noire)] p-4 sm:p-5 flex flex-col gap-3.5 transition-all duration-200 animate-fade-in ${placementClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={guideTitle}
      >
        <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-encre-noire/20 pb-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-5 h-5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-bg)] text-[10px] font-black flex items-center justify-center shrink-0">
              {currentStepIndex + 1}
            </span>
            <div className="truncate">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-primary)] block leading-none">
                {t('poleGuides.tourStepCounter', { current: currentStepIndex + 1, total: totalSteps })}
              </span>
              <h4 className="text-xs font-black uppercase tracking-wide text-encre-noire truncate mt-0.5">
                {guideTitle}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded border border-encre-noire/40 hover:border-encre-noire bg-cordel-bg-light hover:bg-cordel-bg text-encre-noire text-xs font-black flex items-center justify-center cursor-pointer transition-all shrink-0"
            title={t('poleGuides.tourCloseTooltip')}
            aria-label={t('poleGuides.tourCloseTooltip')}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {isFirstStep && guideDescription && (
            <p className="text-[11px] text-encre-noire/75 italic leading-snug border-l-2 border-[var(--color-cordel-ocre)] pl-2 mb-1">
              {guideDescription}
            </p>
          )}

          <div className="flex items-start gap-2.5 bg-cordel-bg-light p-3 rounded-[4px_6px_3px_5px] border border-encre-noire/20">
            <span className="text-base shrink-0 leading-none mt-0.5">{isLastStep ? '🎯' : '👉'}</span>
            <p className="text-xs sm:text-[13px] font-bold text-encre-noire leading-relaxed">{currentStepText}</p>
          </div>

          {!targetFound && (
            <span className="text-[10px] text-[var(--theme-primary)] font-medium italic">
              {t('poleGuides.tourOverviewNotice')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-dashed border-encre-noire/15">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-5 bg-[var(--color-cordel-ocre)]'
                    : idx < currentStepIndex
                      ? 'w-2 bg-[var(--color-cordel-vert)]'
                      : 'w-2 bg-encre-noire/20'
                }`}
                title={t('poleGuides.tourGoToStep', { step: idx + 1 })}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-wider text-encre-noire/60 hover:text-encre-noire cursor-pointer"
          >
            {t('poleGuides.tourSkipBtn')}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all flex items-center gap-1 ${
              isFirstStep
                ? 'opacity-40 cursor-not-allowed border-encre-noire/20 text-encre-noire/40'
                : 'bg-cordel-bg-light hover:bg-cordel-bg text-encre-noire border-encre-noire shadow-[1.5px_1.5px_0px_0px_var(--color-encre-noire)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer'
            }`}
          >
            <span>←</span>
            <span>{t('poleGuides.tourPrevBtn')}</span>
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-[var(--color-cordel-vert)] hover:brightness-110 text-white shadow-[1.5px_1.5px_0px_0px_var(--color-encre-noire)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 animate-pulse"
            >
              <span>{t('poleGuides.tourFinishBtn')}</span>
              <span>✓</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire theme-bg-ocre hover:brightness-105 text-encre-noire shadow-[1.5px_1.5px_0px_0px_var(--color-encre-noire)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1"
            >
              <span>{t('poleGuides.tourNextBtn')}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
