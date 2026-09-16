/**
 * Adaptateur d'interception Firebase Storage pour le Mode Démo
 *
 * Règle impérative : Toutes les importations d'origine se font EXCLUSIVEMENT
 * depuis '@firebase/storage' afin d'éviter toute récursion infinie causée par l'alias Vite.
 *
 * En mode Démo (isDemoMode() === true) :
 * - Simule les téléversements sans aucun transfert réseau.
 * - Renvoie des URLs locales statiques existantes dans le projet.
 *
 * Hors mode Démo :
 * - Délégation stricte aux fonctions officielles de @firebase/storage.
 */

import * as realStorage from '@firebase/storage';
import { isDemoMode } from './demoManager';

// Réexportation intégrale de l'API Storage originale
export * from '@firebase/storage';

/**
 * Interception de uploadBytes()
 */
export const uploadBytes = async (storageRef, fileOrBlob, metadata) => {
  if (isDemoMode()) {
    console.log("[Mode Démo Storage] Simulation téléversement réussie :", fileOrBlob?.name || 'fichier_demo');
    return Promise.resolve({
      ref: storageRef,
      metadata: { ...metadata, name: fileOrBlob?.name || 'fichier_demo' }
    });
  }

  return realStorage.uploadBytes(storageRef, fileOrBlob, metadata);
};

/**
 * Interception de getDownloadURL()
 */
export const getDownloadURL = async (storageRef) => {
  if (isDemoMode()) {
    return Promise.resolve('/Pictures/tambour.png');
  }

  return realStorage.getDownloadURL(storageRef);
};
