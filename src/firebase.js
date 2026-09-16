import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

import { isDemoMode, getDemoAuthUser } from './demo/demoManager';

export const app = initializeApp(firebaseConfig);
const baseAuth = getAuth(app);

// Proxy transparent sur l'instance Auth pour fournir le profil démo Mestre sans appel réseau
export const auth = new Proxy(baseAuth, {
  get(target, prop) {
    if (isDemoMode() && prop === 'currentUser') {
      return getDemoAuthUser();
    }
    const val = target[prop];
    if (typeof val === 'function') {
      return val.bind(target);
    }
    return val;
  }
});

// Forcer la persistance locale du navigateur pour maintenir la session hors-ligne (uniquement hors démo)
if (!isDemoMode()) {
  setPersistence(baseAuth, browserLocalPersistence)
    .catch((err) => {
      console.error("Firebase Auth - Erreur de persistance :", err);
    });
}

export const googleProvider = new GoogleAuthProvider();

// Configuration Firestore avec persistance locale IndexedDB multi-onglets et tolérance aux champs undefined
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialiser le service de messagerie push uniquement côté client
import { getMessaging } from 'firebase/messaging';
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

