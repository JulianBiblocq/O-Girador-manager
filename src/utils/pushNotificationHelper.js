/**
 * Utilitaires pour la gestion, le Contrat Permanent (`pushOptInContract`)
 * et la confirmation des notifications Push FCM.
 */

import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { collectClientPushDiagnostics, syncPushDiagnosticsToFirestore } from './pushDiagnosticsUtils';

/**
 * Résout la ServiceWorkerRegistration active contrôlant déjà l'application.
 */
export async function resolveActiveMessagingSwRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  try {
    const readyReg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(undefined), 3000))
    ]);
    if (readyReg) return readyReg;
    const existingReg = await navigator.serviceWorker.getRegistration();
    if (existingReg) return existingReg;
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (err) {
    console.warn('resolveActiveMessagingSwRegistration - Repli SW :', err?.message || err);
    return undefined;
  }
}

/**
 * Obtient le jeton FCM sur le Service Worker actif.
 * En cas d'erreur `Subscription failed` ou `AbortError` sur `PushManager`,
 * purge automatiquement l'abonnement corrompu (`unsubscribe()`), patiente 300 ms et réessaie une seconde fois.
 */
export async function getTokenWithPushManagerAutoRepair(swReg) {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  try {
    return await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg
    });
  } catch {
    try {
      const existingSub = await swReg?.pushManager?.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }
    } catch (unsubErr) {
      console.warn('getTokenWithPushManagerAutoRepair - Nettoyage abonnement SW :', unsubErr?.message || unsubErr);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    return await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg
    });
  }
}

/**
 * Demande la permission Push en 1 clic, obtient le jeton FCM sur le SW actif (avec auto-réparation PushManager),
 * l'enregistre dans `users/{uid}.fcmTokens`, signe `pushOptInContract: true` et met à jour `pushDiagnostics`.
 */
export async function activateAndPersistPushToken(uid) {
  if (!uid) return { ok: false, reason: 'missing_uid' };
  if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
    await syncPushDiagnosticsToFirestore(uid, null, { force: true, hasActiveTokenOverride: false });
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      await syncPushDiagnosticsToFirestore(uid, null, { force: true, hasActiveTokenOverride: false });
      return { ok: false, reason: permission };
    }
    const swReg = await resolveActiveMessagingSwRegistration();
    const token = await getTokenWithPushManagerAutoRepair(swReg);
    if (!token) {
      await syncPushDiagnosticsToFirestore(uid, null, { lastError: 'empty_token', force: true, hasActiveTokenOverride: false });
      return { ok: false, reason: 'empty_token' };
    }

    const diagnostics = collectClientPushDiagnostics({ hasActiveTokenInDb: true });
    await updateDoc(doc(db, 'users', uid), {
      fcmTokens: arrayUnion(token),
      pushOptInContract: true,
      pushDiagnostics: diagnostics
    });

    try {
      localStorage.setItem('push_contract_signed', 'true');
      localStorage.setItem(`girador_device_fcm_token_${uid}`, token);
    } catch { /* Ignorer */ }

    await showPushActivationConfirmation(swReg);
    return { ok: true, token };
  } catch (err) {
    console.error('activateAndPersistPushToken - Erreur :', err);
    await syncPushDiagnosticsToFirestore(uid, null, {
      lastError: err?.message || 'error',
      force: true,
      hasActiveTokenOverride: false
    });
    return { ok: false, reason: err?.message || 'error' };
  }
}

/**
 * Révoque explicitement le Contrat Permanent lorsque le membre clique sur
 * « Désactiver les notifications » dans son profil.
 */
export async function disablePushContract(uid) {
  if (!uid) return false;
  try {
    const localTokenKey = `girador_device_fcm_token_${uid}`;
    let localToken = null;
    try {
      localToken = localStorage.getItem(localTokenKey);
      localStorage.setItem('push_contract_signed', 'false');
      localStorage.removeItem(localTokenKey);
    } catch { /* Ignorer */ }

    const payload = { pushOptInContract: false };
    if (localToken) payload.fcmTokens = arrayRemove(localToken);
    await updateDoc(doc(db, 'users', uid), payload);
    return true;
  } catch (err) {
    console.warn('disablePushContract - Erreur :', err?.message || err);
    return false;
  }
}

/**
 * Affiche immédiatement une notification locale de confirmation via le Service Worker.
 */
export async function showPushActivationConfirmation(registration) {
  try {
    const reg = registration || (await resolveActiveMessagingSwRegistration());
    const title = '🔔 Notifications activées !';
    const options = {
      body: 'Super, ton appareil est bien configuré pour recevoir les annonces et feuilles de route.',
      icon: 'https://organizador.o-girador.com/icon-192.png',
      badge: 'https://organizador.o-girador.com/favicon.svg',
      tag: 'activation-confirmation',
      data: { url: '/app/agenda' }
    };
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, options);
      return true;
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, options);
      return true;
    }
  } catch (err) {
    console.warn('showPushActivationConfirmation - Erreur :', err);
  }
  return false;
}
