import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import {
  activateAndPersistPushToken,
  disablePushContract,
  resolveActiveMessagingSwRegistration
} from '../utils/pushNotificationHelper';
import { collectClientPushDiagnostics } from '../utils/pushDiagnosticsUtils';

/**
 * Hook dédié à la gestion des notifications Push et du Contrat Permanent
 * (`pushOptInContract`) depuis la fiche Profil Utilisateur.
 */
export function useProfilePushActions(user, profileData) {
  const uid = user?.uid || profileData?.uid || profileData?.id;
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  const handleEnableNotifications = useCallback(async () => {
    if (!messaging) {
      alert('Les notifications Push ne sont pas prises en charge par ce navigateur.');
      return;
    }
    if (!uid) return;
    setIsSubscribingPush(true);
    try {
      const result = await activateAndPersistPushToken(uid);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
      if (result.ok) {
        alert('Notifications activées avec succès !');
      } else if (result.reason === 'denied') {
        alert("La permission d'envoi de notifications a été refusée.");
      } else {
        alert('Impossible de générer le jeton de notification sur cet appareil.');
      }
    } catch (err) {
      console.error('useProfilePushActions - Erreur activation :', err);
      alert("Erreur lors de l'activation des notifications.");
    } finally {
      setIsSubscribingPush(false);
    }
  }, [uid]);

  const handleDisableNotifications = useCallback(async () => {
    if (!uid) return;
    setIsSubscribingPush(true);
    try {
      await disablePushContract(uid);
      alert('Les notifications ont été désactivées pour votre compte.');
    } finally {
      setIsSubscribingPush(false);
    }
  }, [uid]);

  // Synchronisation automatique si l'autorisation est accordée et que le contrat n'est pas révoqué
  useEffect(() => {
    if (!messaging || !uid || profileData?.pushOptInContract === false) return;

    const checkAndAutoSubscribe = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        setNotificationPermission('granted');
        try {
          const registration = await resolveActiveMessagingSwRegistration();
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
            serviceWorkerRegistration: registration
          });
          if (token) {
            const currentTokens = Array.isArray(profileData?.fcmTokens) ? profileData.fcmTokens : [];
            if (!currentTokens.includes(token) || profileData?.pushOptInContract !== true) {
              const diagnostics = collectClientPushDiagnostics({ hasActiveTokenInDb: true });
              await updateDoc(doc(db, 'users', uid), {
                fcmTokens: arrayUnion(token),
                pushOptInContract: true,
                pushDiagnostics: diagnostics
              });
            }
          }
        } catch (err) {
          console.warn("useProfilePushActions - Auto-inscription différée :", err?.message || err);
        }
      }
    };

    checkAndAutoSubscribe();
  }, [uid, profileData?.fcmTokens, profileData?.pushOptInContract]);

  return {
    notificationPermission,
    isSubscribingPush,
    handleEnableNotifications,
    handleDisableNotifications
  };
}

