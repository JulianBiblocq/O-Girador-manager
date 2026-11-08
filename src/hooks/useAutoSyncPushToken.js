import { useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { resolveActiveMessagingSwRegistration } from '../utils/pushNotificationHelper';
import { collectClientPushDiagnostics, syncPushDiagnosticsToFirestore } from '../utils/pushDiagnosticsUtils';

const FOREGROUND_SYNC_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Hook d'auto-synchronisation silencieuse du jeton FCM et du télé-diagnostic Push :
 * - Ne bloque jamais la resynchronisation par un verrou sessionStorage si `fcmTokens` est vide.
 * - S'exécute à l'ouverture de session et au retour au premier plan (`visibilitychange` visible & `focus`).
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
  const tokensCount = Array.isArray(profileData?.fcmTokens) ? profileData.fcmTokens.length : 0;

  useEffect(() => {
    if (!uid || !hasProfile || typeof window === 'undefined') return;
    const state = { cancelled: false };

    const syncTokenAndDiagnostics = async () => {
      if (state.cancelled || isSyncingRef.current) return;
      const currentProfile = latestProfileRef.current;

      if (currentProfile?.pushOptInContract === false) {
        await syncPushDiagnosticsToFirestore(uid, currentProfile);
        return;
      }

      const permission = 'Notification' in window ? Notification.permission : 'unsupported';
      if (permission !== 'granted' || !messaging) {
        await syncPushDiagnosticsToFirestore(uid, currentProfile);
        return;
      }

      const existingTokens = Array.isArray(currentProfile?.fcmTokens) ? currentProfile.fcmTokens : [];
      const now = Date.now();
      const lastSyncAt = lastSyncTimeByUidRef.current[uid] || 0;

      if (
        existingTokens.length > 0 &&
        currentProfile?.pushOptInContract === true &&
        currentProfile?.pushDiagnostics?.blockerReason === 'OK' &&
        now - lastSyncAt < FOREGROUND_SYNC_THROTTLE_MS
      ) {
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
        if (state.cancelled) return;

        if (!currentToken) {
          await syncPushDiagnosticsToFirestore(uid, latestProfileRef.current, {
            lastError: 'empty_token_from_fcm',
            hasActiveTokenOverride: existingTokens.length > 0
          });
          return;
        }

        const latestProfile = latestProfileRef.current;
        const latestTokens = Array.isArray(latestProfile?.fcmTokens) ? latestProfile.fcmTokens : existingTokens;
        const localTokenKey = `girador_device_fcm_token_${uid}`;
        let prevLocalToken = null;
        try { prevLocalToken = localStorage.getItem(localTokenKey); } catch { /* Ignorer */ }

        if (prevLocalToken && prevLocalToken !== currentToken && latestTokens.includes(prevLocalToken)) {
          await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(prevLocalToken) });
        }

        if (!latestTokens.includes(currentToken) || latestProfile?.pushOptInContract !== true || latestProfile?.pushDiagnostics?.blockerReason !== 'OK') {
          const diagnostics = collectClientPushDiagnostics({ hasActiveTokenInDb: true });
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(currentToken),
            pushOptInContract: true,
            pushDiagnostics: diagnostics
          });
        }

        try {
          localStorage.setItem('push_contract_signed', 'true');
          localStorage.setItem(localTokenKey, currentToken);
        } catch { /* Ignorer */ }

        if (onTokenSyncedRef.current) onTokenSyncedRef.current(currentToken);
      } catch (err) {
        lastSyncTimeByUidRef.current[uid] = 0;
        await syncPushDiagnosticsToFirestore(uid, latestProfileRef.current, {
          lastError: err?.message || 'sync_error',
          hasActiveTokenOverride: existingTokens.length > 0
        });
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncTokenAndDiagnostics();
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') syncTokenAndDiagnostics();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncTokenAndDiagnostics);

    return () => {
      state.cancelled = true;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncTokenAndDiagnostics);
    };
  }, [uid, hasProfile, tokensCount]);
}
