import { useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import {
  resolveActiveMessagingSwRegistration,
  getTokenWithPushManagerAutoRepair
} from '../utils/pushNotificationHelper';
import { collectClientPushDiagnostics, syncPushDiagnosticsToFirestore } from '../utils/pushDiagnosticsUtils';

const FOREGROUND_SYNC_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Hook d'auto-synchronisation silencieuse du jeton FCM et d'enregistrement inconditionnel de `pushDiagnostics` :
 * - Calcule et enregistre `pushDiagnostics` AVANT tout `return` lié à `!messaging` ou `!('Notification' in window)`.
 * - Tente une auto-réparation `PushManager` (`unsubscribe()` + nouvel essai à +300 ms) en cas d'erreur d'abonnement.
 * - S'exécute à l'ouverture de session et au retour au premier plan (`visibilitychange` visible & `focus`).
 */
export function useAutoSyncPushToken(user, profileData, onTokenSynced, onTokenError) {
  const lastSyncTimeByUidRef = useRef({});
  const isSyncingRef = useRef(false);
  const latestProfileRef = useRef(profileData);
  const onTokenSyncedRef = useRef(onTokenSynced);
  const onTokenErrorRef = useRef(onTokenError);

  useEffect(() => {
    latestProfileRef.current = profileData;
    onTokenSyncedRef.current = onTokenSynced;
    onTokenErrorRef.current = onTokenError;
  }, [profileData, onTokenSynced, onTokenError]);

  const uid = user?.uid || profileData?.uid || profileData?.id;
  const hasProfile = Boolean(profileData);
  const tokensCount = Array.isArray(profileData?.fcmTokens) ? profileData.fcmTokens.length : 0;

  useEffect(() => {
    if (!uid || !hasProfile || typeof window === 'undefined') return;
    const state = { cancelled: false };

    const syncTokenAndDiagnostics = async () => {
      if (state.cancelled || isSyncingRef.current) return;
      const currentProfile = latestProfileRef.current;
      const existingTokens = Array.isArray(currentProfile?.fcmTokens) ? currentProfile.fcmTokens : [];

      // 1. Calcul inconditionnel du diagnostic AVANT tout return sur !messaging ou !('Notification' in window)
      const preDiag = collectClientPushDiagnostics({
        hasActiveTokenInDb: existingTokens.length > 0,
        isMessagingSupported: Boolean(messaging)
      });

      const permission = 'Notification' in window ? Notification.permission : 'unsupported';
      if (
        preDiag.status === 'webview_blocked' ||
        preDiag.status === 'ios_not_installed' ||
        preDiag.status === 'unsupported' ||
        permission !== 'granted' ||
        !messaging ||
        currentProfile?.pushOptInContract === false
      ) {
        await syncPushDiagnosticsToFirestore(uid, currentProfile);
        return;
      }

      const now = Date.now();
      const lastSyncAt = lastSyncTimeByUidRef.current[uid] || 0;
      if (
        existingTokens.length > 0 &&
        currentProfile?.pushOptInContract === true &&
        currentProfile?.pushDiagnostics?.status === 'active' &&
        now - lastSyncAt < FOREGROUND_SYNC_THROTTLE_MS
      ) {
        return;
      }

      isSyncingRef.current = true;
      lastSyncTimeByUidRef.current[uid] = now;

      try {
        const swReg = await resolveActiveMessagingSwRegistration();
        const currentToken = await getTokenWithPushManagerAutoRepair(swReg);
        if (state.cancelled) return;

        if (!currentToken) {
          await syncPushDiagnosticsToFirestore(uid, latestProfileRef.current, {
            lastError: 'Jeton vide retourné par FCM', force: true, hasActiveTokenOverride: false
          });
          if (onTokenErrorRef.current) onTokenErrorRef.current('Jeton vide retourné par FCM');
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

        if (!latestTokens.includes(currentToken) || latestProfile?.pushOptInContract !== true || latestProfile?.pushDiagnostics?.status !== 'active') {
          const activeDiag = collectClientPushDiagnostics({ hasActiveTokenInDb: true, isMessagingSupported: true });
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(currentToken), pushOptInContract: true, pushDiagnostics: activeDiag
          });
        }

        try {
          localStorage.setItem('push_contract_signed', 'true');
          localStorage.setItem(localTokenKey, currentToken);
        } catch { /* Ignorer */ }

        if (onTokenSyncedRef.current) onTokenSyncedRef.current(currentToken);
      } catch (err) {
        const errMsg = err?.message || 'Erreur getToken SW';
        lastSyncTimeByUidRef.current[uid] = 0;
        await syncPushDiagnosticsToFirestore(uid, latestProfileRef.current, {
          lastError: errMsg, force: true, hasActiveTokenOverride: false
        });
        if (onTokenErrorRef.current) onTokenErrorRef.current(errMsg);
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
