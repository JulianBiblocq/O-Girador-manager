// Utilitaires Push FCM : Contrat Permanent (`pushOptInContract`), premier plan et badge Alfaia (< 140 lignes).
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { collectClientPushDiagnostics, syncPushDiagnosticsToFirestore } from './pushDiagnosticsUtils';

export const ALFAIA_MONO_BADGE_PATH = '/icons/badge-alfaia-mono.png';
const DEFAULT_NOTIF_ICON = '/icon-192-v2.png';

/** Résout la ServiceWorkerRegistration active contrôlant déjà l'application. */
export async function resolveActiveMessagingSwRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  try {
    const readyReg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(undefined), 3000))]);
    if (readyReg) return readyReg;
    const existingReg = await navigator.serviceWorker.getRegistration();
    return existingReg || (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));
  } catch (err) {
    console.warn('resolveActiveMessagingSwRegistration - Repli SW :', err?.message || err);
    return undefined;
  }
}

/** Obtient le jeton FCM sur le Service Worker actif avec auto-réparation PushManager en cas d'erreur. */
export async function getTokenWithPushManagerAutoRepair(swReg) {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  try {
    return await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
  } catch {
    try {
      const existingSub = await swReg?.pushManager?.getSubscription();
      if (existingSub) await existingSub.unsubscribe();
    } catch (unsubErr) {
      console.warn('getTokenWithPushManagerAutoRepair - Nettoyage SW :', unsubErr?.message || unsubErr);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    return await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
  }
}

/** Demande la permission Push en 1 clic, enregistre le jeton FCM et met à jour `pushDiagnostics`. */
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
    await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token), pushOptInContract: true, pushDiagnostics: diagnostics });
    try {
      localStorage.setItem('push_contract_signed', 'true');
      localStorage.setItem(`girador_device_fcm_token_${uid}`, token);
    } catch { /* Ignorer */ }
    await showPushActivationConfirmation(swReg);
    return { ok: true, token };
  } catch (err) {
    console.error('activateAndPersistPushToken - Erreur :', err);
    await syncPushDiagnosticsToFirestore(uid, null, { lastError: err?.message || 'error', force: true, hasActiveTokenOverride: false });
    return { ok: false, reason: err?.message || 'error' };
  }
}

/** Révoque explicitement le Contrat Permanent lorsque le membre désactive les notifications. */
export async function disablePushContract(uid) {
  if (!uid) return false;
  try {
    let localToken = null;
    try {
      localToken = localStorage.getItem(`girador_device_fcm_token_${uid}`);
      localStorage.setItem('push_contract_signed', 'false');
      localStorage.removeItem(`girador_device_fcm_token_${uid}`);
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

/** Affiche une notification système (confirmation ou premier plan) avec le badge tambour Alfaia monochrome. */
export async function displaySystemNotification(title, options = {}, registration = undefined) {
  try {
    const reg = registration || (await resolveActiveMessagingSwRegistration());
    const merged = { icon: DEFAULT_NOTIF_ICON, ...options, badge: '/icons/badge-alfaia-mono.png' };
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, merged);
      return true;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, merged);
      return true;
    }
  } catch (err) {
    console.warn('displaySystemNotification - Erreur :', err);
  }
  return false;
}

/** Affiche immédiatement une notification locale de confirmation d'activation via le Service Worker. */
export async function showPushActivationConfirmation(registration) {
  return displaySystemNotification('🔔 Notifications activées !', {
    body: 'Super, ton appareil est bien configuré pour recevoir les annonces et feuilles de route.',
    icon: DEFAULT_NOTIF_ICON,
    badge: '/icons/badge-alfaia-mono.png',
    tag: 'activation-confirmation',
    data: { url: '/app/agenda' }
  }, registration);
}

/** Écoute les messages FCM reçus au premier plan et les affiche avec le badge tambour Alfaia monochrome. */
export function subscribeForegroundPushMessages() {
  if (typeof window === 'undefined' || !messaging) return () => {};
  return onMessage(messaging, (payload) => {
    const title = payload?.notification?.title || payload?.data?.title || 'Organizador';
    const body = payload?.notification?.body || payload?.data?.body || '';
    const icon = payload?.notification?.icon || payload?.data?.icon || DEFAULT_NOTIF_ICON;
    const tag = payload?.data?.tag || undefined;
    displaySystemNotification(title, { body, icon, badge: '/icons/badge-alfaia-mono.png', ...(tag ? { tag } : {}), data: payload?.data || {} });
  });
}
