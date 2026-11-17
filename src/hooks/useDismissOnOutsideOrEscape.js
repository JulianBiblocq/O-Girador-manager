import { useEffect } from 'react';

/**
 * Hook : ferme un menu flottant au clic (ou toucher) extérieur et à la touche Échap.
 *
 * @param {React.RefObject} rootRef - Conteneur du menu (bouton + panneau)
 * @param {boolean} isOpen - Le menu est ouvert
 * @param {Function} onClose - Callback de fermeture
 */
export default function useDismissOnOutsideOrEscape(rootRef, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (e) => {
      if (rootRef.current && e.target?.isConnected && !rootRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [rootRef, isOpen, onClose]);
}
