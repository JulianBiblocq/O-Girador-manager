import { useState, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé gérant le positionnement adaptatif du panneau de notifications
 * (clamping viewport Desktop / tiroir Mobile) ainsi que la fermeture au clic extérieur ou touche Échap.
 */
export function useNotificationPanelPosition({ isOpen, setIsOpen, buttonRef, panelRef }) {
  const [panelStyle, setPanelStyle] = useState({});
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Recalcul précis de la géométrie et du positionnement du panneau
  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const desktop = window.innerWidth >= 768;
    setIsDesktop(desktop);

    if (!desktop || !buttonRef.current) {
      setPanelStyle({});
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const panelWidth = Math.min(384, window.innerWidth - 24);

    let left;
    if (rect.left + panelWidth <= window.innerWidth - 12) {
      left = Math.max(12, rect.left);
    } else {
      left = Math.max(12, rect.right - panelWidth);
    }
    left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12));

    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    let top;
    let maxHeight;

    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
      maxHeight = Math.min(560, spaceAbove);
      top = Math.max(12, rect.top - 8 - maxHeight);
    } else {
      top = rect.bottom + 8;
      maxHeight = Math.min(560, spaceBelow);
    }

    setPanelStyle({
      position: 'fixed',
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${Math.round(panelWidth)}px`,
      maxHeight: `${Math.round(maxHeight)}px`
    });
  }, [buttonRef]);

  // Mise à jour de la position lors du redimensionnement ou du défilement
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updatePosition();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  // Fermeture lors d'un clic en dehors du panneau ou de l'appui sur Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!event?.target?.isConnected) return;
      if (buttonRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen, buttonRef, panelRef]);

  return { panelStyle, isDesktop, updatePosition };
}
