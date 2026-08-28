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

// Écoute des clics sur les notifications push FCM (Deep Linking & Redirection)
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Clic sur la notification :', event.notification);
  event.notification.close();

  // Extraction de l'URL de destination transmise dans les données de notification
  const data = event.notification.data || {};
  const targetUrl = data.url || data.link || data.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Si l'application est déjà ouverte en arrière-plan, basculer vers la fenêtre active et naviguer
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }

      // 2. Sinon, ouvrir directement l'application sur l'URL cible
      if (clients.openWindow && targetUrl) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
