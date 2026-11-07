import { useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { resolveActiveMessagingSwRegistration } from '../utils/pushNotificationHelper';

/**
 * Hook léger d'auto-synchronisation du jeton FCM à chaque démarrage de session.
 * Dès que `Notification.permission === 'granted'`, attend `navigator.serviceWorker.ready`,
 * appelle systématiquement `getToken()` (même si `profileData.fcmTokens` n'est pas vide)
 * et met à jour `users/{uid}.fcmTokens` si le jeton de l'appareil est absent ou a été renouvelé.
 */
export function useAutoSyncPushToken(user, profileData, onTokenSynced) {
  const syncedUidRef = useRef(null);

  useEffect(() => {
    const uid = user?.uid || profileData?.uid || profileData?.id;
    if (!uid || !profileData) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted' || !messaging) return;

    // Exécuter la resynchronisation une fois par démarrage de session pour l'utilisateur connecté
    if (syncedUidRef.current === uid) return;
    syncedUidRef.current = uid;

    const existingTokens = Array.isArray(profileData.fcmTokens) ? profileData.fcmTokens : [];
    const state = { cancelled: false };

    const syncToken = async () => {
      try {
        const swReg = await resolveActiveMessagingSwRegistration();
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg
        });
        if (state.cancelled || !currentToken) return;

        const localTokenKey = `girador_device_fcm_token_${uid}`;
        let prevLocalToken = null;
        try {
          prevLocalToken = localStorage.getItem(localTokenKey);
        } catch {}

        // Si l'ancien jeton de cet appareil a tourné, on le retire avant d'ajouter le nouveau
        if (prevLocalToken && prevLocalToken !== currentToken && existingTokens.includes(prevLocalToken)) {
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayRemove(prevLocalToken)
          });
        }

        if (!existingTokens.includes(currentToken)) {
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(currentToken)
          });
        }

        try {
          localStorage.setItem(localTokenKey, currentToken);
        } catch {}

        if (onTokenSynced) onTokenSynced(currentToken);
      } catch (err) {
        // Ignorer silencieusement en arrière-plan (ex: mode navigation privée ou réseau hors-ligne)
        console.warn('AutoSyncPushToken - Synchronisation différée :', err?.message || err);
      }
    };

    syncToken();

    return () => {
      state.cancelled = true;
    };
  }, [user?.uid, profileData, onTokenSynced]);
}
