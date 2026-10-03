import { useEffect } from 'react';

/**
 * Hook d'accessibilité pour écouter la touche Échap (Escape)
 * et déclencher la fermeture d'une modale ou d'un tiroir d'interface.
 *
 * @param {Function} onClose Fonction de fermeture appelée lors de l'appui sur Échap
 * @param {boolean} [isActive=true] Condition d'activation de l'écouteur
 */
export function useModalEscape(onClose, isActive = true) {
  useEffect(() => {
    if (!isActive || typeof onClose !== 'function') return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isActive]);
}

export default useModalEscape;
