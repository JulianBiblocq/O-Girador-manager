/**
 * Utilitaires pour la gestion et la confirmation des notifications Push FCM.
 * Déclencheurs locaux via le Service Worker et assistants de configuration.
 */

/**
 * Affiche immédiatement une notification locale de bienvenue / confirmation via le Service Worker
 * dès que le membre a accordé la permission et que le jeton FCM a été persisté avec succès.
 * 
 * @param {ServiceWorkerRegistration} [registration] Instance active du Service Worker (optionnelle)
 * @returns {Promise<boolean>} Vrai si la notification a pu être affichée avec succès
 */
export async function showPushActivationConfirmation(registration) {
  try {
    let reg = registration;
    if (!reg && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      reg = await navigator.serviceWorker.ready;
    }

    const title = "🔔 Notifications activées !";
    const options = {
      body: "Super, ton appareil est bien configuré pour recevoir les annonces et feuilles de route.",
      icon: 'https://organizador.o-girador.com/icon-192.png',
      badge: 'https://organizador.o-girador.com/favicon.svg',
      tag: 'activation-confirmation',
      data: {
        url: '/agenda'
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
