import { useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';

/**
 * Hook léger d'auto-synchronisation du jeton FCM au chargement de l'application.
 * Si l'adhérent a déjà accordé la permission de notification sur son navigateur
 * mais que son jeton FCM actuel est absent de `profileData.fcmTokens`,
 * ce hook l'enregistre silencieusement dans Firestore dès l'arrivée sur l'Accueil.
 */
export function useAutoSyncPushToken(user, profileData, onTokenSynced) {
  const syncedUidRef = useRef(null);

  useEffect(() => {
    const uid = user?.uid || profileData?.uid || profileData?.id;
    if (!uid || !profileData) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted' || !messaging) return;

    // Éviter de relancer la synchronisation en boucle dans la même session pour le même utilisateur
    const existingTokens = Array.isArray(profileData.fcmTokens) ? profileData.fcmTokens : [];
    const sessionKey = `${uid}_${existingTokens.length}`;
    if (syncedUidRef.current === sessionKey) return;
    syncedUidRef.current = sessionKey;

    const state = { cancelled: false };

    const syncToken = async () => {
      try {
        let swReg;
        if ('serviceWorker' in navigator) {
          swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          if (!swReg) {
            swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }
        }
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg
        });
        if (state.cancelled || !currentToken) return;

        if (!existingTokens.includes(currentToken)) {
          await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(currentToken)
          });
        }
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
