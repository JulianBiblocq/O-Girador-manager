/**
 * Centre de Notifications Internes (In-App) avec indicateur dynamique et tiroir interactif.
 * Raccordé au routeur interne unifié (handleNotificationNavigate) d'Organizad'Or.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useInAppNotifications } from '../../hooks/useInAppNotifications';
import { useNotificationPanelPosition } from '../../hooks/useNotificationPanelPosition';
import useConfirm from '../../hooks/useConfirm';
import NotificationItem from './NotificationItem';

export default function NotificationCenter({
  currentUser,
  groupId,
  onNavigateToUrl,
  onNotificationNavigate,
  unreadPrivateMessagesCount = 0,
  className = ''
}) {
  const userId = currentUser?.uid || currentUser?.id;
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useInAppNotifications(userId, groupId);

  // Synchronisation de la pastille rouge sur l'icône du téléphone (App Badging API)
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const totalBadge = (unreadCount || 0) + (unreadPrivateMessagesCount || 0);
    if (totalBadge > 0) {
      navigator.setAppBadge?.(totalBadge)?.catch(() => {});
    } else {
      navigator.clearAppBadge?.()?.catch(() => {});
    }
  }, [unreadCount, unreadPrivateMessagesCount]);

  const confirm = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const { panelStyle, isDesktop, updatePosition } = useNotificationPanelPosition({
    isOpen,
    setIsOpen,
    buttonRef,
    panelRef
  });

  // Bascule d'ouverture avec recalcul immédiat des coordonnées
  const handleToggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen((prev) => !prev);
  };

  // Clic sur une notification : marquer comme lue sur sa référence exacte, fermer et naviguer
  const handleSelectNotification = useCallback((notif) => {
    if (!notif) return;

    // 1. Marquer immédiatement comme lue sur la référence exacte docId (supporte read et isRead)
    const isUnread = notif.isRead !== true && notif.read !== true;
    const exactDocId = notif.docId || notif.notifId || notif.id;
    if (isUnread && exactDocId) {
      markAsRead(exactDocId);
    }

    // 2. Fermer le panneau interactif
    setIsOpen(false);

    // 3. Déclencher la navigation SPA vers la cible interne ou externe
    const target = notif.targetUrl || notif.link;
    const navigateHandler = onNotificationNavigate || onNavigateToUrl;
    if (navigateHandler && target) {
      navigateHandler(target, notif);
    }
  }, [markAsRead, onNotificationNavigate, onNavigateToUrl]);

  // Purge collective de l'historique après confirmation
  const handleClearAll = useCallback(async () => {
    if (notifications.length === 0) return;
    const confirmed = await confirm({
      title: 'Effacer les notifications ?',
      message: "Voulez-vous vraiment effacer tout l'historique de vos notifications internes ?",
      confirmLabel: 'Tout effacer',
      cancelLabel: 'Annuler',
      variant: 'danger'
    });
    if (confirmed && clearAllNotifications) {
      clearAllNotifications();
    }
  }, [notifications.length, confirm, clearAllNotifications]);

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
        title={unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Notifications'}
        aria-label="Centre de notifications"
        aria-expanded={isOpen}
      >
        <span className={`text-base leading-none select-none ${unreadCount > 0 ? 'animate-bounce' : ''}`}>
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse select-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Tiroir Mobile / Popover Desktop rendu dans document.body via Portal */}
      {isOpen && typeof document !== 'undefined' && document.body && createPortal(
        <>
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
                : 'inset-y-0 right-0 w-full max-w-sm sm:max-w-md border-l-4 border-cordel-master-dark h-[100dvh] max-h-[100dvh] shadow-2xl animate-slide-in-right'
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

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wide bg-white hover:bg-red-50 text-[var(--color-cordel-rouge,#8b2a1a)] border border-[var(--color-cordel-rouge,#8b2a1a)]/40 hover:border-[var(--color-cordel-rouge,#8b2a1a)] rounded shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
                    title="Supprimer toutes les notifications de l'historique"
                  >
                    Tout effacer
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
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2.5 bg-cordel-bg-light/50">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-5 h-5 border-2 border-[var(--color-cordel-ocre,#c05621)] border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold text-encre-noire/60">Chargement des alertes...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl mb-2 opacity-50">📭</span>
                  <p className="text-xs font-bold text-encre-noire/75">Aucune notification pour le moment.</p>
                  <p className="text-[10px] text-encre-noire/50 mt-1">
                    Les convocations, mentions et statuts financiers apparaîtront ici.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.docId || notif.notifId || notif.id}
                    notification={notif}
                    onSelect={handleSelectNotification}
                    onDelete={deleteNotification}
                  />
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-2 pb-safe border-t border-dashed border-encre-noire/15 bg-cordel-bg text-center shrink-0">
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
