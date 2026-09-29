import { useEffect, useRef } from 'react';

/**
 * Hook personnalisé garantissant l'alignement fluide (auto-scroll centré)
 * sur l'onglet actif dans un ruban défilant horizontal (Mobile & Tablette).
 *
 * @param {string|number} activeTabId Identifiant de l'onglet actif
 * @returns {React.RefObject} Référence à attacher au conteneur défilant (overflow-x-auto)
 */
export function useTabRibbonAutoScroll(activeTabId) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Sur grand écran (desktop où les onglets sont repliés en multiligne), l'auto-scroll horizontal n'est pas nécessaire
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 1024px)').matches) {
      return;
    }

    // Recherche de l'élément d'onglet actif par attribut data
    const activeEl = containerRef.current.querySelector(
      `[data-tab-active="true"], [data-tab-id="${activeTabId}"]`
    );

    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTabId]);

  return containerRef;
}

export default useTabRibbonAutoScroll;
