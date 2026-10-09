import { useEffect } from 'react';

/**
 * Hook d'accessibilité pour écouter la touche Échap (Escape)
 * et déclencher la fermeture d'une modale ou d'un tiroir d'interface.
 *
 * @param {Function} onClose Fonction de fermeture appelée lors de l'appui sur Échap
 * @param {boolean} [isActive=true] Condition d'activation de l'écouteur
 */
export function useModalEscape(arg1, arg2, arg3) {
  // Supporte les signatures (onClose, isActive) et (isOpen, onClose, isSaving)
  const onClose = typeof arg1 === 'function' ? arg1 : (typeof arg2 === 'function' ? arg2 : null);
  const isActive = typeof arg1 === 'boolean' ? (arg1 && !arg3) : Boolean(arg2 ?? true);

  useEffect(() => {
    if (!isActive || typeof onClose !== 'function') return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        console.trace("⚠️ FERMETURE MODALE DÉCLENCHÉE PAR : useModalEscape (touche Échap)");
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
