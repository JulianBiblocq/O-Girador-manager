import React, { useState } from 'react';
import { messaging } from '../../firebase';
import { activateAndPersistPushToken } from '../../utils/pushNotificationHelper';
import { useAutoSyncPushToken } from '../../hooks/useAutoSyncPushToken';

/**
 * Détecte l'environnement navigateur client pour orienter précisément le membre.
 */
function detectClientPushEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIosNotStandalone: false, isWebView: false, isBraveBrowser: false };
  }
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true
  );
  const isWebView = /WhatsApp|FBAN|FBAV|Instagram|FB_IAB|Messenger|Line\//i.test(ua);
  const isBraveBrowser = Boolean(navigator.brave) || /Brave/i.test(ua);
  return {
    isIosNotStandalone: Boolean(isIos && !isStandalone),
    isWebView,
    isBraveBrowser
  };
}

/**
 * Bannière Cordel compacte d'activation des notifications Push en 1 clic sur l'Accueil.
 * Assure également la resynchronisation automatique (avec auto-réparation PushManager)
 * et affiche la marche à suivre exacte si le navigateur bloque le service Push.
 */
export default function NotificationBanner({ user, profileData }) {
  const uid = user?.uid || profileData?.uid || profileData?.id;
  const dismissKey = uid ? `notif_banner_dismissed_${uid}` : 'notif_banner_dismissed';

  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(dismissKey) === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [syncedInSession, setSyncedInSession] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [showHelpBox, setShowHelpBox] = useState(false);

  // Resynchronisation systématique du jeton et du télé-diagnostic dès l'ouverture
  useAutoSyncPushToken(
    user,
    profileData,
    () => {
      setSyncError(null);
      setSyncedInSession(true);
    },
    (errMsg) => {
      setSyncError(errMsg || 'token_error');
      setShowHelpBox(true);
    }
  );

  if (
    typeof window === 'undefined' ||
    !uid ||
    !profileData ||
    profileData.pushOptInContract === false ||
    dismissed ||
    syncedInSession
  ) {
    return null;
  }

  const { isIosNotStandalone, isWebView, isBraveBrowser } = detectClientPushEnvironment();
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';
  const existingTokens = Array.isArray(profileData.fcmTokens) ? profileData.fcmTokens : [];
  const diagStatus = profileData.pushDiagnostics?.status || '';
  const diagError = syncError || profileData.pushDiagnostics?.lastError || profileData.pushDiagnostics?.label || '';
  const hasTokenOrSwError =
    Boolean(syncError) ||
    diagStatus === 'token_error' ||
    /subscription failed|pushmanager|erreur de jeton|erreur navigateur|aborterror/i.test(diagError);

  const hasActiveToken = existingTokens.length > 0 && permission === 'granted' && !hasTokenOrSwError;
  if (hasActiveToken) return null;

  const isSpecialEnvironment =
    hasTokenOrSwError || isWebView || isIosNotStandalone || permission === 'denied' || isBraveBrowser;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch { /* Ignorer */ }
  };

  const handleOneClickActivate = async () => {
    if (isWebView || isIosNotStandalone || permission === 'denied' || !('Notification' in window) || !messaging) {
      setShowHelpBox(true);
      return;
    }
    setLoading(true);
    try {
      const result = await activateAndPersistPushToken(uid);
      if (result.ok) {
        setSyncError(null);
        setSyncedInSession(true);
      } else {
        setSyncError(result.reason || 'token_error');
        setShowHelpBox(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-cordel-ocre)]/10 border-2 border-dashed border-[var(--color-cordel-ocre)] rounded-[var(--theme-border-radius)] px-3 py-2 flex flex-col gap-1.5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-encre-noire leading-snug flex-1 min-w-[200px]">
          {hasTokenOrSwError
            ? '⚠️ Les notifications sont autorisées mais le service Push du navigateur est bloqué.'
            : "🔔 Les alertes de l'association sont désactivées sur cet appareil."}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={handleOneClickActivate}
            className="px-2.5 py-1 bg-[var(--color-cordel-vert)] text-white border border-encre-noire rounded-[var(--theme-border-radius-sm)] shadow-[1.5px_1.5px_0px_0px_#181716] text-[10px] font-black uppercase tracking-wider cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all disabled:opacity-60"
          >
            {loading ? '⏳ Activation...' : hasTokenOrSwError ? '🔄 Réessayer' : 'Activer en 1 clic'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-1.5 py-0.5 text-[10px] font-black text-encre-noire/60 hover:text-encre-noire cursor-pointer"
            title="Masquer pour cette session"
          >
            ✕
          </button>
        </div>
      </div>

      {(showHelpBox || isSpecialEnvironment) && (
        <div className="text-[10px] font-semibold text-encre-noire/90 bg-cordel-bg-light/95 border border-encre-noire/20 rounded-[var(--theme-border-radius-sm)] px-2.5 py-1.5 leading-snug flex flex-col gap-1">
          {isWebView ? (
            <p>
              💬 Vous êtes dans le navigateur interne d&apos;une application. Appuyez sur les 3 points (⋮) ou la boussole en haut/bas de l&apos;écran et choisissez « Ouvrir dans Chrome / Safari » pour recevoir les notifications.
            </p>
          ) : isIosNotStandalone ? (
            <p>
              🍎 Sur iPhone/iPad, appuyez sur le bouton Partager (carré avec flèche) en bas de Safari puis sur « Sur l&apos;écran d&apos;accueil » pour activer les notifications.
            </p>
          ) : permission === 'denied' ? (
            <p>
              🔒 Les alertes sont bloquées dans votre navigateur. Cliquez sur l&apos;icône de cadenas/réglages à gauche de l&apos;adresse web ➔ Autorisations ➔ Autoriser les Notifications.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex-1 min-w-[200px]">
                ⚠️ Votre navigateur (ex: Brave ou navigation privée) bloque le service Google Push. Ouvrez l&apos;application dans Chrome ou Safari, ou activez « Utiliser les services Google pour les messages push » dans les réglages de Brave, puis cliquez sur Réessayer.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleOneClickActivate}
                className="px-2 py-0.5 bg-[var(--color-cordel-ocre)] text-white border border-encre-noire rounded text-[9.5px] font-black uppercase tracking-wider cursor-pointer shrink-0"
              >
                {loading ? '⏳...' : '🔄 Réessayer'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
