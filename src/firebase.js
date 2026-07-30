import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Forcer la persistance locale du navigateur pour maintenir la session hors-ligne
setPersistence(auth, browserLocalPersistence)
  .catch((err) => {
    console.error("Firebase Auth - Erreur de persistance :", err);
  });

export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});
export const storage = getStorage(app);

// Initialiser le service de messagerie push uniquement côté client
import { getMessaging } from 'firebase/messaging';
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
