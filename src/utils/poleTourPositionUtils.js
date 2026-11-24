/**
 * Utilitaires de détection DOM et de calcul géométrique du parcours guidé (`PoleTourOverlay`)
 * respectant les variables sémantiques du Design System Cordel (< 120 lignes).
 */

export const TOUR_SPOTLIGHT_PADDING = 6;

/**
 * Recherche dans le DOM l'élément porteur de l'attribut `data-tour` de l'étape courante,
 * avec repli sur la convention `${tabId}-step-${stepIndex + 1}`.
 */
export function findPoleTourTargetElement(targetKey, tabId, stepIndex) {
  if (typeof document === 'undefined') return null;
  let element = null;
  if (targetKey) {
    element = document.querySelector(`[data-tour="${targetKey}"]`);
  }
  if (!element && tabId) {
    element = document.querySelector(`[data-tour="${tabId}-step-${stepIndex + 1}"]`);
  }
  return element;
}

/**
 * Mesure les coordonnées visibles d'un élément DOM ; retourne `null` s'il est masqué ou replié.
 */
export function measureVisibleTargetRect(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right
  };
}

/**
 * Calcule le style du halo découpé (spotlight) et le placement adaptatif de l'infobulle Cordel.
 */
export function computePoleTourLayout({ targetFound, targetRect, padding = TOUR_SPOTLIGHT_PADDING }) {
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;

  if (!targetFound || !targetRect) {
    return {
      spotlightStyle: null,
      placementClass: 'popover-centered',
      popoverStyle: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${Math.min(420, viewportW - 32)}px`,
        zIndex: 9999
      }
    };
  }

  const spotlightStyle = {
    position: 'fixed',
    top: `${targetRect.top - padding}px`,
    left: `${targetRect.left - padding}px`,
    width: `${targetRect.width + padding * 2}px`,
    height: `${targetRect.height + padding * 2}px`,
    borderRadius: '8px',
    boxShadow: '0 0 0 9999px color-mix(in srgb, var(--color-encre-noire, #181716) 74%, transparent)',
    border: '2px dashed var(--color-cordel-ocre)',
    pointerEvents: 'none',
    zIndex: 9998,
    transition: 'top 0.22s ease-out, left 0.22s ease-out, width 0.22s ease-out, height 0.22s ease-out'
  };

  const popoverWidth = Math.min(390, viewportW - 24);
  const spaceBelow = viewportH - (targetRect.bottom + padding);
  const spaceAbove = targetRect.top - padding;
  let idealLeft = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
  idealLeft = Math.max(12, Math.min(idealLeft, viewportW - popoverWidth - 12));

  if (spaceBelow >= 220 || spaceBelow > spaceAbove) {
    return {
      spotlightStyle,
      placementClass: 'popover-below',
      popoverStyle: {
        position: 'fixed',
        top: `${Math.min(targetRect.bottom + padding + 12, viewportH - 240)}px`,
        left: `${idealLeft}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999
      }
    };
  }

  return {
    spotlightStyle,
    placementClass: 'popover-above',
    popoverStyle: {
      position: 'fixed',
      bottom: `${Math.max(12, viewportH - (targetRect.top - padding) + 12)}px`,
      left: `${idealLeft}px`,
      width: `${popoverWidth}px`,
      zIndex: 9999
    }
  };
}
