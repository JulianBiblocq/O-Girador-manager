/**
 * Utilitaires pour la gestion et la confirmation des notifications Push FCM.
 * Déclencheurs locaux via le Service Worker et assistants de configuration.
 */

import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';

/**
 * Résout la ServiceWorkerRegistration active contrôlant déjà l'application
 * (qui importe `/firebase-messaging-sw.js`), avec repli sur `getRegistration()`
 * pour éviter tout conflit sur un worker en état `installing`.
 *
 * @returns {Promise<ServiceWorkerRegistration|undefined>}
 */
export async function resolveActiveMessagingSwRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }
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
 * Demande la permission Push en 1 clic, obtient le jeton FCM sur le SW actif,
 * l'enregistre dans `users/{uid}.fcmTokens` et affiche une confirmation locale.
 *
 * @param {string} uid Identifiant Firebase Auth du membre
 * @returns {Promise<{ ok: boolean, reason?: string, token?: string }>}
 */
export async function activateAndPersistPushToken(uid) {
  if (!uid) return { ok: false, reason: 'missing_uid' };
  if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, reason: permission };
    }
    const swReg = await resolveActiveMessagingSwRegistration();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg
    });
    if (!token) {
      return { ok: false, reason: 'empty_token' };
    }
    await updateDoc(doc(db, 'users', uid), {
      fcmTokens: arrayUnion(token)
    });
    await showPushActivationConfirmation(swReg);
    return { ok: true, token };
  } catch (err) {
    console.error('activateAndPersistPushToken - Erreur :', err);
    return { ok: false, reason: err?.message || 'error' };
  }
}

/**
 * Affiche immédiatement une notification locale de bienvenue / confirmation via le Service Worker
 * dès que le membre a accordé la permission et que le jeton FCM a été persisté avec succès.
 * 
 * @param {ServiceWorkerRegistration} [registration] Instance active du Service Worker (optionnelle)
 * @returns {Promise<boolean>} Vrai si la notification a pu être affichée avec succès
 */
export async function showPushActivationConfirmation(registration) {
  try {
    const reg = registration || (await resolveActiveMessagingSwRegistration());

    const title = "🔔 Notifications activées !";
    const options = {
      body: "Super, ton appareil est bien configuré pour recevoir les annonces et feuilles de route.",
      icon: 'https://organizador.o-girador.com/icon-192.png',
      badge: 'https://organizador.o-girador.com/favicon.svg',
      tag: 'activation-confirmation',
      data: {
        url: '/app/agenda'
      }
    };

    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, options);
      return true;
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      // Repli natif si l'instance du Service Worker n'est pas directement disponible
      new Notification(title, options);
      return true;
    }
  } catch (err) {
    console.warn("showPushActivationConfirmation - Erreur lors de l'affichage de la notification :", err);
  }
  return false;
}
