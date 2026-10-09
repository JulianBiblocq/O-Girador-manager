import { useEffect, useRef } from 'react';

/**
 * Hook d'interception du bouton retour matériel / navigateur.
 * Sécurisé pour éviter toute fermeture intempestive au montage ou lors des re-renders.
 * Supporte de manière transparente les deux signatures :
 * 1) useHardwareBack(callback, isEnabled)
 * 2) useHardwareBack(isOpen, onClose)
 *
 * @param {Function|boolean} param1 - Fonction de callback ou booléen d'ouverture
 * @param {boolean|Function} [param2] - Booléen d'activation ou fonction de callback
 */
export function useHardwareBack(param1, param2) {
  // Détection polymorphe pour compatibilité ascendante et descendante
  const isEnabled = typeof param1 === 'function' ? (param2 ?? true) : Boolean(param1);
  const callback = typeof param1 === 'function' ? param1 : param2;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!isEnabled) return;

    const handlePopState = (event) => {
      if (callbackRef.current && typeof callbackRef.current === 'function') {
        callbackRef.current(event);
      }
    };

    // Empêcher l'exécution immédiate : passer la référence sans parenthèses
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isEnabled]); // Dépendance UNIQUE : isEnabled
}

export default useHardwareBack;
