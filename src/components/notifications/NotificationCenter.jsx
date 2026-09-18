/**
 * Centre de Notifications Internes (In-App) avec indicateur dynamique et tiroir interactif.
 * Conforme à la charte visuelle Cordel et aux directives d'accessibilité mobile/desktop.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const containerRef = useRef(null);

  // Fermeture lors d'un clic en dehors du panneau (Desktop popover)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Clic sur une notification : marquer comme lu, fermer et naviguer
  const handleSelectNotification = useCallback((notification) => {
    if (!notification) return;

    // 1. Marquer immédiatement comme lue
    if (!notification.isRead) {
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
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Bouton Déclencheur Cloche avec pastille dynamique */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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

      {/* Tiroir Mobile / Popover Desktop */}
      {isOpen && (
        <>
          {/* Backdrop mobile pour fermeture tactile */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[110] md:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-y-0 right-0 w-full max-w-sm sm:max-w-md md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-cordel-bg-light border-l-4 md:border-2 border-cordel-master-dark md:border-encre-noire md:rounded-[8px_12px_9px_11px] shadow-[4px_4px_0px_0px_#181716] z-[120] flex flex-col max-h-screen md:max-h-[85vh] overflow-hidden select-none animate-slide-in-right md:animate-fade-in"
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
        </>
      )}
    </div>
  );
}
