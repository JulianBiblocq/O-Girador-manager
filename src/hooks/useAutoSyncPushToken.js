import { useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { resolveActiveMessagingSwRegistration } from '../utils/pushNotificationHelper';

/** Délai anti-rebond en mémoire entre deux vérifications au retour au premier plan (5 minutes). */
const FOREGROUND_SYNC_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Hook d'auto-synchronisation silencieuse du jeton FCM :
 * - S'exécute dès l'ouverture de session si `Notification.permission === 'granted'`.
 * - Se ré-exécute automatiquement au retour au premier plan (`visibilitychange` visible et `focus`)
 *   avec un anti-rebond de 5 minutes en mémoire, permettant aux membres gardant la PWA ouverte
 *   en tâche de fond de récupérer leur `fcmToken` dans `users/{uid}.fcmTokens` sans aucun clic.
 */
export function useAutoSyncPushToken(user, profileData, onTokenSynced) {
  const lastSyncTimeByUidRef = useRef({});
  const isSyncingRef = useRef(false);
  const latestProfileRef = useRef(profileData);
  const onTokenSyncedRef = useRef(onTokenSynced);

  useEffect(() => {
    latestProfileRef.current = profileData;
    onTokenSyncedRef.current = onTokenSynced;
  }, [profileData, onTokenSynced]);

  const uid = user?.uid || profileData?.uid || profileData?.id;
  const hasProfile = Boolean(profileData);

  useEffect(() => {
    if (!uid || !hasProfile) return;
    if (typeof window === 'undefined' || !('Notification' in window) || !messaging) return;

    const state = { cancelled: false };

    const syncTokenIfPermitted = async () => {
      if (state.cancelled || isSyncingRef.current) return;
      if (Notification.permission !== 'granted') return;

      const currentProfile = latestProfileRef.current;
      const existingTokens = Array.isArray(currentProfile?.fcmTokens) ? currentProfile.fcmTokens : [];
      const now = Date.now();
      const lastSyncAt = lastSyncTimeByUidRef.current[uid] || 0;

      // Respecter le délai anti-rebond de 5 minutes (sauf si la liste Firestore est vide)
      if (existingTokens.length > 0 && now - lastSyncAt < FOREGROUND_SYNC_THROTTLE_MS) {
        return;
      }

      isSyncingRef.current = true;
      lastSyncTimeByUidRef.current[uid] = now;

      try {
        const swReg = await resolveActiveMessagingSwRegistration();
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg
        });
        if (state.cancelled || !currentToken) return;

        const latestTokens = Array.isArray(latestProfileRef.current?.fcmTokens)
          ? latestProfileRef.current.fcmTokens
          : existingTokens;

        const localTokenKey = `girador_device_fcm_token_${uid}`;
        let prevLocalToken = null;
        try {
          prevLocalToken = localStorage.getItem(localTokenKey);
        } catch {}

        // Si l'ancien jeton de cet appareil a tourné, on le retire avant d'ajouter le nouveau
        if (prevLocalToken && prevLocalToken !== currentToken && latestTokens.includes(prevLocalToken)) {
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayRemove(prevLocalToken)
          });
        }

        if (!latestTokens.includes(currentToken)) {
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(currentToken)
          });
        }

        try {
          localStorage.setItem(localTokenKey, currentToken);
        } catch {}

        if (onTokenSyncedRef.current) {
          onTokenSyncedRef.current(currentToken);
        }
      } catch (err) {
        // En cas d'échec réseau temporaire, réinitialiser le timestamp pour permettre un nouvel essai au prochain focus
        lastSyncTimeByUidRef.current[uid] = 0;
        console.warn('AutoSyncPushToken - Synchronisation différée :', err?.message || err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // 1. Synchronisation immédiate à l'ouverture de l'application
    syncTokenIfPermitted();

    // 2. Réactivation silencieuse au retour au premier plan (PWA en tâche de fond ou retour d'onglet)
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncTokenIfPermitted();
      }
    };

    const handleWindowFocus = () => {
      syncTokenIfPermitted();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      state.cancelled = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [uid, hasProfile]);
}
