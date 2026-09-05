import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Composant : PoleTourOverlay
 * 
 * Visite guidée interactive pas-à-pas aux couleurs du Cordel.
 * Met en valeur les éléments interactifs de la vue active via un spotlight découpé dynamiquement,
 * et propose une infobulle pédagogique permettant de progresser dans les étapes de travail.
 * 
 * Caractéristiques :
 * - Montage dans document.body via createPortal avec un z-index élevé (z-[9999]).
 * - Spotlight avec halo d'assombrissement (box-shadow 9999px) et liseré en pointillés ocre (#c05621).
 * - Repli gracieux au centre en modale si l'élément cible est absent du DOM.
 * - Navigation clavier (Échap, Flèche Gauche, Flèche Droite) et scroll automatique fluide.
 * - Bouton "Terminer ✓" en Vert Validation officiel (#2d6a4f).
 * - Sauvegarde de complétion dans localStorage ('pole_tour_completed_${tabId}').
 * 
 * @param {Object} guide - Objet du guide issu de poleGuides.js ({ titre, description, etapes, targets })
 * @param {string} tabId - Identifiant de l'onglet actif (utilisé pour mémoriser la complétion)
 * @param {boolean} isOpen - Indique si la visite guidée est active
 * @param {Function} onClose - Callback invoqué à la fermeture ou à l'achèvement de la visite
 * @param {Function} [onComplete] - Callback optionnel d'achèvement
 */
export default function PoleTourOverlay({ guide, tabId, isOpen, onClose, onComplete }) {
  // Index de l'étape active (0-indexed)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Coordonnées rect de l'élément cible
  const [targetRect, setTargetRect] = useState(null);
  // Indique si la cible a été trouvée pour l'étape active
  const [targetFound, setTargetFound] = useState(false);

  const popoverRef = useRef(null);

  // Normalisation des étapes et cibles
  const steps = guide?.etapes || guide?.steps || [];
  const targets = guide?.targets || [];
  const totalSteps = steps.length;
  const currentStepText = steps[currentStepIndex] || '';
  const currentTargetKey = targets[currentStepIndex] || null;

  // Réinitialisation à la première étape lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen, tabId]);

  /**
   * Calcul dynamique et détection du positionnement de l'élément cible
   */
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || totalSteps === 0) return;

    let element = null;

    // 1. Recherche par clé de cible déclarée dans le guide
    if (currentTargetKey) {
      element = document.querySelector(`[data-tour="${currentTargetKey}"]`);
    }

    // 2. Recherche par convention de secours tabId-step-${index+1}
    if (!element && tabId) {
      element = document.querySelector(`[data-tour="${tabId}-step-${currentStepIndex + 1}"]`);
    }

    // 3. Traitement selon présence de l'élément
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });
      setTargetFound(true);
    } else {
      setTargetRect(null);
      setTargetFound(false);
    }
  }, [isOpen, totalSteps, currentTargetKey, tabId, currentStepIndex]);

  // Défilement automatique fluide vers l'élément et recalcul
  useEffect(() => {
    if (!isOpen || totalSteps === 0) return;

    let element = null;
    if (currentTargetKey) {
      element = document.querySelector(`[data-tour="${currentTargetKey}"]`);
    }
    if (!element && tabId) {
      element = document.querySelector(`[data-tour="${tabId}-step-${currentStepIndex + 1}"]`);
    }

    if (element) {
      // Défilement centré fluide
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      
      // Recalcul immédiat puis ajustement après animation de défilement
      updateTargetPosition();
      const timer = setTimeout(updateTargetPosition, 320);
      return () => clearTimeout(timer);
    } else {
      setTargetRect(null);
      setTargetFound(false);
    }
  }, [isOpen, currentStepIndex, currentTargetKey, tabId, updateTargetPosition, totalSteps]);

  // Écouteurs de redimensionnement et défilement pour maintenir le calage du halo
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateTargetPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateTargetPosition]);

  /**
   * Clôture et enregistrement de complétion dans le stockage local
   */
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
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  }, [currentStepIndex, totalSteps, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Support des touches clavier (Échap, Flèche Gauche, Flèche Droite)
  useEffect(() => {
    if (!isOpen) return;

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

  // Si le tour n'est pas ouvert ou que le guide ne contient aucune étape, ne rien afficher
  if (!isOpen || !guide || totalSteps === 0) {
    return null;
  }

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const guideTitle = guide.titre || guide.title || "Visite guidée";

  // Marge de dégagement autour de l'élément cible
  const PADDING = 6;

  // Calcul du positionnement adaptatif de l'infobulle (popover)
  let popoverStyle = {};
  let placementClass = "";

  if (targetFound && targetRect) {
    const popoverWidth = Math.min(390, window.innerWidth - 24);
    // Espace disponible sous l'élément
    const spaceBelow = window.innerHeight - (targetRect.bottom + PADDING);
    // Espace disponible au-dessus de l'élément
    const spaceAbove = targetRect.top - PADDING;

    // Centrage horizontal calé sur la cible, borné par les bords de l'écran
    let idealLeft = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
    idealLeft = Math.max(12, Math.min(idealLeft, window.innerWidth - popoverWidth - 12));

    // Si l'espace dessous est suffisant (> 220px) ou plus grand que l'espace dessus, placer en-dessous
    if (spaceBelow >= 220 || spaceBelow > spaceAbove) {
      popoverStyle = {
        position: 'fixed',
        top: `${Math.min(targetRect.bottom + PADDING + 12, window.innerHeight - 240)}px`,
        left: `${idealLeft}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999
      };
      placementClass = "popover-below";
    } else {
      // Sinon placer au-dessus
      popoverStyle = {
        position: 'fixed',
        bottom: `${Math.max(12, window.innerHeight - (targetRect.top - PADDING) + 12)}px`,
        left: `${idealLeft}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999
      };
      placementClass = "popover-above";
    }
  } else {
    // Mode modale centrée (repli gracieux si cible introuvable)
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${Math.min(420, window.innerWidth - 32)}px`,
      zIndex: 9999
    };
    placementClass = "popover-centered";
  }

  // Rendu dans document.body via Portal
  return createPortal(
    <div className="fixed inset-0 select-none z-[9999] pointer-events-auto">
      {/* 1. Halo découpé Cordel (Spotlight) ou fond assombri uni */}
      {targetFound && targetRect ? (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - PADDING}px`,
            left: `${targetRect.left - PADDING}px`,
            width: `${targetRect.width + PADDING * 2}px`,
            height: `${targetRect.height + PADDING * 2}px`,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(18, 14, 12, 0.74)',
            border: '2px dashed #c05621',
            pointerEvents: 'none',
            zIndex: 9998,
            transition: 'top 0.22s ease-out, left 0.22s ease-out, width 0.22s ease-out, height 0.22s ease-out'
          }}
        />
      ) : (
        <div 
          className="fixed inset-0 bg-[#120e0c]/74 z-[9998] transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* 2. Infobulle Cordel (Popover pédagogique) */}
      <div
        ref={popoverRef}
        style={popoverStyle}
        className={`bg-[#f4ecd8] text-[#120e0c] border-2 border-[#120e0c] rounded-[6px_14px_8px_12px] shadow-[3.5px_3.5px_0px_0px_#120e0c] p-4 sm:p-5 flex flex-col gap-3.5 transition-all duration-200 animate-fade-in ${placementClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={guideTitle}
      >
        {/* En-tête Cordel : titre de la visite, jauge d'étape et bouton fermer */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-[#120e0c]/20 pb-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-5 h-5 rounded-full bg-[#8b2a1a] text-[#f4ecd8] text-[10px] font-black flex items-center justify-center shrink-0">
              {currentStepIndex + 1}
            </span>
            <div className="truncate">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8b2a1a] block leading-none">
                Étape {currentStepIndex + 1} sur {totalSteps}
              </span>
              <h4 className="text-xs font-black uppercase tracking-wide text-[#120e0c] truncate mt-0.5">
                {guideTitle}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded border border-[#120e0c]/40 hover:border-[#120e0c] bg-[#f4ecd8] hover:bg-amber-100 text-[#120e0c] text-xs font-black flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Fermer la visite (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Corps de l'étape active */}
        <div className="flex flex-col gap-2">
          {/* Note explicative globale sur la première étape */}
          {isFirstStep && guide.description && (
            <p className="text-[11px] text-[#120e0c]/70 italic leading-snug border-l-2 border-[#c05621] pl-2 mb-1">
              {guide.description}
            </p>
          )}

          {/* Consigne précise de l'étape courante */}
          <div className="flex items-start gap-2.5 bg-[#fdfaf2] p-3 rounded-[4px_6px_3px_5px] border border-[#120e0c]/20">
            <span className="text-base shrink-0 leading-none mt-0.5">
              {isLastStep ? '🎯' : '👉'}
            </span>
            <p className="text-xs sm:text-[13px] font-bold text-[#120e0c] leading-relaxed">
              {currentStepText}
            </p>
          </div>

          {/* Message informatif si la cible visuelle n'est pas encore présente à l'écran */}
          {!targetFound && (
            <span className="text-[10px] text-[#8b2a1a] font-medium italic">
              ℹ️ Vue d'ensemble du module
            </span>
          )}
        </div>

        {/* Indicateurs de progression (petits rectangles ou ronds Cordel) */}
        <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#120e0c]/15">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-5 bg-[#c05621]'
                    : idx < currentStepIndex
                    ? 'w-2 bg-[#2d6a4f]'
                    : 'w-2 bg-[#120e0c]/20'
                }`}
                title={`Aller à l'étape ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-wider text-[#120e0c]/60 hover:text-[#120e0c] cursor-pointer"
          >
            Passer
          </button>
        </div>

        {/* Barre de navigation : Précédent / Suivant / Terminer */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all flex items-center gap-1 ${
              isFirstStep
                ? 'opacity-40 cursor-not-allowed border-[#120e0c]/20 text-[#120e0c]/40'
                : 'bg-[#f4ecd8] hover:bg-amber-100 text-[#120e0c] border-[#120e0c] shadow-[1.5px_1.5px_0px_0px_#120e0c] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer'
            }`}
          >
            <span>←</span>
            <span>Précédent</span>
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-950 bg-[#2d6a4f] hover:bg-emerald-800 text-white shadow-[1.5px_1.5px_0px_0px_#120e0c] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 animate-pulse"
            >
              <span>Terminer</span>
              <span>✓</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-[#120e0c] bg-amber-300 hover:bg-amber-200 text-[#120e0c] shadow-[1.5px_1.5px_0px_0px_#120e0c] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1"
            >
              <span>Suivant</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
