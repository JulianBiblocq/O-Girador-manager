/**
 * Centre de Notifications Internes (In-App) avec indicateur dynamique et tiroir interactif.
 * Conforme à la charte visuelle Cordel et aux directives d'accessibilité mobile/desktop.
 * Intègre un positionnement adaptatif via Portal garantissant qu'aucune partie du panneau ne sorte de l'écran.
 */

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useInAppNotifications } from '../../hooks/useInAppNotifications';
import NotificationItem from './NotificationItem';

export default function NotificationCenter({
  currentUser,
  groupId,
  onNavigateToUrl,
  className = ''
}) {
  const userId = currentUser?.uid || currentUser?.id;
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useInAppNotifications(userId, groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

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
    // Largeur du panneau adaptée aux écrans moyens et grands (384px max)
    const panelWidth = Math.min(384, window.innerWidth - 24);

    // Positionnement horizontal avec marge de sécurité de 12px
    let left;
    if (rect.left + panelWidth <= window.innerWidth - 12) {
      // Aligné sur le bord gauche du bouton (très adapté à la barre latérale gauche)
      left = Math.max(12, rect.left);
    } else {
      // Aligné sur le bord droit du bouton (très adapté aux barres supérieures droites)
      left = Math.max(12, rect.right - panelWidth);
    }
    // Clamping strict dans les limites du viewport horizontal
    left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12));

    // Positionnement vertical intelligent (évite le débordement bas/haut)
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    let top;
    let maxHeight;

    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
      // Espace insuffisant en bas : affichage au-dessus du bouton
      maxHeight = Math.min(560, spaceAbove);
      top = Math.max(12, rect.top - 8 - maxHeight);
    } else {
      // Affichage par défaut sous le bouton déclencheur
      top = rect.bottom + 8;
      maxHeight = Math.min(560, spaceBelow);
    }

    setPanelStyle({
      position: 'fixed',
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${Math.round(panelWidth)}px`,
      maxHeight: `${Math.round(maxHeight)}px`,
    });
  }, []);

  // Bascule d'ouverture avec recalcul immédiat des coordonnées
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Mise à jour de la position lors de l'ouverture et lors du redimensionnement / défilement
  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  // Fermeture lors d'un clic en dehors du panneau ou de l'appui sur Echap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
        return;
      }
      if (panelRef.current && panelRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Clic sur une notification : marquer comme lu, fermer et naviguer
  const handleSelectNotification = useCallback((notification) => {
    if (!notification) return;

    // 1. Marquer immédiatement comme lue (supporte read et isRead)
    const isUnread = notification.read !== undefined ? !notification.read : !notification.isRead;
    if (isUnread) {
      markAsRead(notification.notifId || notification.id);
    }

    // 2. Fermer le panneau interactif
    setIsOpen(false);

    // 3. Déclencher la navigation SPA
    if (onNavigateToUrl && notification.targetUrl) {
      onNavigateToUrl(notification.targetUrl, notification);
    }
  }, [markAsRead, onNavigateToUrl]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bouton Déclencheur Cloche avec pastille dynamique */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`relative p-2 border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-amber-100 text-encre-noire'
            : unreadCount > 0
            ? 'bg-white hover:bg-amber-50 text-encre-noire'
            : 'bg-cordel-bg hover:bg-white text-encre-noire/80'
        }`}
        title={unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : "Notifications"}
        aria-label="Centre de notifications"
        aria-expanded={isOpen}
      >
        <span className={`text-base leading-none select-none ${unreadCount > 0 ? 'animate-bounce' : ''}`}>
          🔔
        </span>

        {/* Badge numérique des alertes non lues */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse select-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Tiroir Mobile / Popover Desktop rendu dans document.body via Portal */}
      {isOpen && typeof document !== 'undefined' && document.body && createPortal(
        <>
          {/* Backdrop mobile pour fermeture tactile */}
          {!isDesktop && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9998] md:hidden animate-fade-in"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            ref={panelRef}
            style={isDesktop ? panelStyle : undefined}
            className={`fixed z-[9999] flex flex-col bg-cordel-bg-light overflow-hidden select-none ${
              isDesktop
                ? 'border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[4px_4px_0px_0px_#181716] animate-fade-in'
                : 'inset-y-0 right-0 w-full max-w-sm sm:max-w-md border-l-4 border-cordel-master-dark max-h-screen shadow-2xl animate-slide-in-right'
            }`}
            role="dialog"
            aria-label="Centre de notifications"
          >
            {/* En-tête Cordel */}
            <div className="p-3.5 bg-cordel-bg border-b-2 border-encre-noire flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-encre-noire">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-[var(--color-cordel-rouge,#8b2a1a)] text-white">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wide bg-white hover:bg-neutral-100 text-encre-noire border border-encre-noire rounded shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
                    title="Marquer toutes les alertes comme lues"
                  >
                    Tout lire
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-encre-noire/70 hover:text-encre-noire hover:bg-encre-noire/10 rounded cursor-pointer transition-colors"
                  title="Fermer le panneau"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corps de la liste déroulante */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-cordel-bg-light/50">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-5 h-5 border-2 border-[var(--color-cordel-ocre,#c05621)] border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold text-encre-noire/60">
                    Chargement des alertes...
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl mb-2 opacity-50">📭</span>
                  <p className="text-xs font-bold text-encre-noire/75">
                    Aucune notification pour le moment.
                  </p>
                  <p className="text-[10px] text-encre-noire/50 mt-1">
                    Les convocations, mentions et statuts financiers apparaîtront ici.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.notifId || notif.id}
                    notification={notif}
                    onSelect={handleSelectNotification}
                  />
                ))
              )}
            </div>

            {/* Pied de panneau discret */}
            {notifications.length > 0 && (
              <div className="p-2 border-t border-dashed border-encre-noire/15 bg-cordel-bg text-center shrink-0">
                <span className="text-[9px] font-extrabold text-encre-noire/50 uppercase tracking-wider">
                  {notifications.length} notification{notifications.length > 1 ? 's' : ''} récente{notifications.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
