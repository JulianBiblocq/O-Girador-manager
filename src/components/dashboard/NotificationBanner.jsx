import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../../firebase';
import { resolveActiveMessagingSwRegistration } from '../../utils/pushNotificationHelper';
import { useAutoSyncPushToken } from '../../hooks/useAutoSyncPushToken';

/**
 * Détecte si l'appareil est un iPhone/iPad ouvert dans un navigateur classique hors écran d'accueil.
 */
function isIosOutsideStandalone() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
  return Boolean(isIos && !isStandalone);
}

/**
 * Bannière Cordel compacte d'activation des notifications Push en 1 clic sur l'Accueil.
 * Assure également la resynchronisation automatique du jeton FCM à chaque démarrage de session.
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
  const [showHelpBox, setShowHelpBox] = useState(false);

  // Resynchronisation systématique du jeton dès que Notification.permission === 'granted'
  useAutoSyncPushToken(user, profileData, () => {
    setSyncedInSession(true);
  });

  if (typeof window === 'undefined' || !uid || !profileData || dismissed || syncedInSession) {
    return null;
  }

  const isIosNotStandalone = isIosOutsideStandalone();
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';
  const existingTokens = Array.isArray(profileData.fcmTokens) ? profileData.fcmTokens : [];
  const hasActiveToken = existingTokens.length > 0 && permission === 'granted';

  if (hasActiveToken) return null;

  const isBlockedOrIosWeb = permission === 'denied' || isIosNotStandalone;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch {}
  };

  const handleOneClickActivate = async () => {
    if (isBlockedOrIosWeb || !('Notification' in window) || !messaging) {
      setShowHelpBox(true);
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setShowHelpBox(true);
        return;
      }
      const swReg = await resolveActiveMessagingSwRegistration();
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg
      });
      if (token) {
        await updateDoc(doc(db, 'users', uid), {
          fcmTokens: arrayUnion(token)
        });
        try {
          localStorage.setItem(`girador_device_fcm_token_${uid}`, token);
        } catch {}
        setSyncedInSession(true);
      }
    } catch (err) {
      console.warn('NotificationBanner - Activation interrompue :', err?.message || err);
      setShowHelpBox(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-cordel-ocre)]/10 border-2 border-dashed border-[var(--color-cordel-ocre)] rounded-[var(--theme-border-radius)] px-3 py-2 flex flex-col gap-1.5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-encre-noire leading-snug flex-1 min-w-[200px]">
          🔔 Les alertes de l&apos;association sont désactivées sur cet appareil.
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={handleOneClickActivate}
            className="px-2.5 py-1 bg-[var(--color-cordel-vert)] text-white border border-encre-noire rounded-[var(--theme-border-radius-sm)] shadow-[1.5px_1.5px_0px_0px_#181716] text-[10px] font-black uppercase tracking-wider cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all disabled:opacity-60"
          >
            {loading ? '⏳ Activation...' : 'Activer en 1 clic'}
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

      {(showHelpBox || isBlockedOrIosWeb) && (
        <div className="text-[10px] font-semibold text-encre-noire/85 bg-cordel-bg-light/90 border border-encre-noire/20 rounded-[var(--theme-border-radius-sm)] px-2.5 py-1.5 leading-snug">
          {isIosNotStandalone ? (
            <p>📱 <strong>Safari iPhone :</strong> appuyez sur <strong>Partager [↑]</strong> puis <strong>« Sur l&apos;écran d&apos;accueil ➕ »</strong> et ouvrez l&apos;application depuis votre écran d&apos;accueil pour activer les alertes.</p>
          ) : (
            <p>🔓 <strong>Notifications bloquées :</strong> cliquez sur l&apos;icône <strong>🔒 cadenas / réglages</strong> à gauche de l&apos;adresse web, autorisez les <strong>Notifications</strong> puis rechargez la page.</p>
          )}
        </div>
      )}
    </div>
  );
}
