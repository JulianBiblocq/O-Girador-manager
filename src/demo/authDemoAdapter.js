/**
 * Adaptateur d'interception Firebase Auth pour le Mode Démo
 *
 * Règle impérative : Toutes les importations d'origine se font EXCLUSIVEMENT
 * depuis '@firebase/auth' afin d'éviter toute récursion infinie causée par l'alias Vite.
 *
 * En mode Démo (isDemoMode() === true) :
 * - Fournit immédiatement l'utilisateur connecté Mestre da Ria.
 * - Court-circuite toute requête réseau vers Firebase Authentication.
 *
 * Hors mode Démo :
 * - Délégation stricte aux fonctions officielles de @firebase/auth.
 */

import * as realAuth from '@firebase/auth';
import { isDemoMode, getDemoAuthUser, exitDemoMode } from './demoManager';

// Réexportation intégrale de l'API Auth originale
export * from '@firebase/auth';

/**
 * Interception de onAuthStateChanged()
 */
export const onAuthStateChanged = (authInstance, callback, ...rest) => {
  if (isDemoMode()) {
    const demoUser = getDemoAuthUser();
    const timer = setTimeout(() => {
      if (typeof callback === 'function') {
        callback(demoUser);
      } else if (callback && typeof callback.next === 'function') {
        callback.next(demoUser);
      }
    }, 0);

    return () => clearTimeout(timer);
  }

  return realAuth.onAuthStateChanged(authInstance, callback, ...rest);
};

/**
 * Interception de signOut()
 */
export const signOut = async (authInstance) => {
  if (isDemoMode()) {
    exitDemoMode();
    return Promise.resolve();
  }

  return realAuth.signOut(authInstance);
};

/**
 * Interception de signInWithCustomToken()
 */
export const signInWithCustomToken = async (authInstance, token) => {
  if (isDemoMode()) {
    return Promise.resolve({ user: getDemoAuthUser() });
  }

  return realAuth.signInWithCustomToken(authInstance, token);
};

/**
 * Interception de signInWithEmailAndPassword()
 */
export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  if (isDemoMode()) {
    return Promise.resolve({ user: getDemoAuthUser() });
  }

  return realAuth.signInWithEmailAndPassword(authInstance, email, password);
};

/**
 * Interception de signInWithPopup()
 */
export const signInWithPopup = async (authInstance, provider) => {
  if (isDemoMode()) {
    return Promise.resolve({ user: getDemoAuthUser() });
  }

  return realAuth.signInWithPopup(authInstance, provider);
};
