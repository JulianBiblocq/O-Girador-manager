import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'mock-auth-domain',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'mock-sender-id',
  appId: env.VITE_FIREBASE_APP_ID || 'mock-app-id'
};

import { isDemoMode, getDemoAuthUser } from './demo/demoManager.js';

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

