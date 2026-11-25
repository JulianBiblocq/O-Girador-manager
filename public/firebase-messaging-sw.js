// -----------------------------------------------------------------------------
// IMPORTANT : Écouteur de clic personnalisé DOIT être déclaré AVANT l'initialisation de Firebase
// Sinon, Firebase SDK intercepte l'événement, appelle event.stopImmediatePropagation()
// et notre gestionnaire n'est jamais exécuté !
// -----------------------------------------------------------------------------
const ALFAIA_MONO_BADGE_PATH = '/icons/badge-alfaia-mono.png';
const ORGANIZADOR_ALFAIA_TAG = 'organizador-alfaia';

self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();

  let data = event.notification.data || {};
  if (data.FCM_MSG) {
    const fcmData = data.FCM_MSG.data || {};
    const fcmNotifData = (data.FCM_MSG.notification && data.FCM_MSG.notification.data) || {};
    data = Object.assign({}, data, fcmData, fcmNotifData);
  }

  const rawTargetPath = data.url || data.link || data.click_action || '/app';
  let targetPath = rawTargetPath;
  if (
    !targetPath.startsWith('http') &&
    !targetPath.startsWith('/app') &&
    targetPath !== '/' &&
    !targetPath.startsWith('/login') &&
    !targetPath.startsWith('/setup') &&
    !targetPath.startsWith('/demo')
  ) {
    targetPath = targetPath.startsWith('/') ? `/app${targetPath}` : `/app/${targetPath}`;
  }

  const baseOrigin = self.location.origin;
  const targetUrl = targetPath.startsWith('http') ? targetPath : baseOrigin + targetPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === baseOrigin) {
          return client.focus().then((focusedClient) => {
            if (focusedClient) {
              focusedClient.postMessage({ type: 'NOTIFICATION_CLICK', url: targetPath });
            }
            return focusedClient;
          });
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// Garantit que tout appel à showNotification (y compris l'affichage natif interne du SDK Firebase)
// utilise systématiquement la silhouette monochrome du tambour Alfaia et le tag unique `organizador-alfaia`
// avec `renotify: true` pour empêcher tout regroupement Android (`GroupSummary` carré translucide).
if (self.registration && typeof self.registration.showNotification === 'function') {
  const nativeShowNotification = self.registration.showNotification.bind(self.registration);
  self.registration.showNotification = async (title, options = {}) => {
    const rawBadge = options && typeof options.badge === 'string' ? options.badge : '';
    const effectiveBadge = rawBadge.includes('badge-alfaia-mono.png') ? rawBadge : ALFAIA_MONO_BADGE_PATH;
    const latestBody = options && typeof options.body === 'string' ? options.body : '';
    let hadUnreadNotification = false;

    if (typeof self.registration.getNotifications === 'function') {
      try {
        const existingNotifs = await self.registration.getNotifications({ tag: ORGANIZADOR_ALFAIA_TAG });
        hadUnreadNotification = Array.isArray(existingNotifs) && existingNotifs.length > 0;
      } catch (_) {
        // Ignorer si l'API getNotifications n'est pas disponible sur cet environnement
      }
    }

    // Conserve le dernier message reçu en corps principal (les alertes détaillées restent dans la cloche interne)
    const nextData = Object.assign({}, (options && options.data) || {}, {
      replacedUnread: hadUnreadNotification
    });

    return nativeShowNotification(
      title,
      Object.assign({}, options, {
        body: latestBody,
        badge: effectiveBadge,
        tag: ORGANIZADOR_ALFAIA_TAG,
        renotify: true,
        data: nextData
      })
    );
  };
}

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY",
  authDomain: "o-girador-7828c.firebaseapp.com",
  projectId: "o-girador-7828c",
  storageBucket: "o-girador-7828c.firebasestorage.app",
  messagingSenderId: "488703864701",
  appId: "1:488703864701:web:50b8cbcd1ca4038e15e614"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if ('setAppBadge' in self.navigator) {
    self.navigator.setAppBadge().catch(() => {});
  }

  // ANTI-DOUBLON : si `payload.notification` est présent, le SDK Firebase affiche déjà l'alerte
  // (enrichie de webpush.notification.badge et sécurisée par le wrapper showNotification ci-dessus).
  if (payload.notification) {
    return;
  }

  const notificationTitle = payload.data?.title || 'Organizador';
  const iconUrl = payload.data?.icon || '/icon-192-v2.png';
  const badgeUrl = '/icons/badge-alfaia-mono.png';

  const rawNotifUrl = payload.data?.url || payload.fcmOptions?.link || '/app';
  const resolvedNotifUrl = (
    !rawNotifUrl.startsWith('http') &&
    !rawNotifUrl.startsWith('/app') &&
    rawNotifUrl !== '/' &&
    !rawNotifUrl.startsWith('/login') &&
    !rawNotifUrl.startsWith('/setup') &&
    !rawNotifUrl.startsWith('/demo')
  )
    ? (rawNotifUrl.startsWith('/') ? `/app${rawNotifUrl}` : `/app/${rawNotifUrl}`)
    : rawNotifUrl;

  const notificationOptions = {
    body: payload.data?.body || '',
    icon: iconUrl,
    badge: badgeUrl,
    sound: '/sounds/notif.ogg',
    tag: ORGANIZADOR_ALFAIA_TAG,
    renotify: true,
    data: Object.assign({}, payload.data, { url: resolvedNotifUrl, icon: iconUrl })
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
