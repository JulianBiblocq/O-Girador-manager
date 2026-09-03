// -----------------------------------------------------------------------------
// IMPORTANT : Écouteur de clic personnalisé DOIT être déclaré AVANT l'initialisation de Firebase
// Sinon, Firebase SDK intercepte l'événement, appelle event.stopImmediatePropagation()
// et notre gestionnaire n'est jamais exécuté !
// -----------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  // On arrête la propagation pour être sûr que Firebase ne prendra pas le dessus si jamais il l'interceptait
  event.stopImmediatePropagation();
  
  console.log('[firebase-messaging-sw.js] Clic sur la notification :', event.notification);
  event.notification.close();

  // Extraction de l'URL de destination depuis les données de notification
  // Les données peuvent être à différents niveaux selon comment Firebase SDK structure le message :
  // 1. Directement dans event.notification.data (webpush.notification.data côté backend)
  // 2. Imbriquées dans FCM_MSG.data (structure interne Firebase SDK)
  // 3. Imbriquées dans FCM_MSG.notification.data
  let data = event.notification.data || {};

  // Firebase SDK imbrique souvent les données dans FCM_MSG lors de la création automatique de la notification
  if (data.FCM_MSG) {
    // Fusionner les données du payload FCM avec les données de notification
    const fcmData = data.FCM_MSG.data || {};
    const fcmNotifData = (data.FCM_MSG.notification && data.FCM_MSG.notification.data) || {};
    data = Object.assign({}, data, fcmData, fcmNotifData);
  }

  // Construction de l'URL cible complète à partir du chemin relatif
  const targetPath = data.url || data.link || data.click_action || '/app';
  const baseOrigin = self.location.origin;
  const targetUrl = targetPath.startsWith('http') ? targetPath : baseOrigin + targetPath;
  console.log('[firebase-messaging-sw.js] Redirection vers :', targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Si l'application est déjà ouverte en arrière-plan, basculer vers la fenêtre active et naviguer
      for (const client of clientList) {
        // Vérifier que le client appartient bien à la même origine
        if (new URL(client.url).origin === baseOrigin) {
          return client.focus().then((focusedClient) => {
            // Envoyer un message au client pour déclencher la navigation interne React
            if (focusedClient) {
              focusedClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: targetPath
              });
            }
            return focusedClient;
          });
        }
      }

      // 2. Sinon, ouvrir directement l'application sur l'URL cible
      return clients.openWindow(targetUrl);
    })
  );
});

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
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // On ne fait PAS de self.registration.showNotification() ici
  // car Firebase s'en occupe déjà automatiquement quand on envoie un objet "notification".
  // L'appeler ici provoquerait une notification en double !
});

