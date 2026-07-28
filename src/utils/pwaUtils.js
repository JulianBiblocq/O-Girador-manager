/**
 * Utilitaire pour vider tous les caches du navigateur, désinscrire les service workers et forcer le rechargement.
 * Utilisé pour les mises à jour manuelles d'urgence et le nettoyage du cache par les membres.
 */
export const forceUpdateAndClearCache = async () => {
  // 1. Supprimer tous les espaces de stockage en cache
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => {
        return caches.delete(key);
      }));
    } catch (err) {
      console.error("PWA Utils - Erreur lors de la suppression des caches :", err);
    }
  }

  // 2. Désinscrire tous les Service Workers actifs
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => {
        return registration.unregister();
      }));
    } catch (err) {
      console.error("PWA Utils - Erreur lors de la désinscription des service workers :", err);
    }
  }

  // 3. Forcer le rechargement de la page (contourne le cache du navigateur)
  window.location.reload(true);
};

/**
 * Enveloppe robuste autour de React.lazy pour récupérer automatiquement les échecs d'importation de modules dynamiques lors de nouveaux déploiements.
 */
import React from 'react';

export function lazyWithRetry(componentImport) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn("PWA Utils - Erreur de chargement du module dynamique, purge du cache...", error);
      const key = 'chunk_lazy_retry_timestamp';
      const lastReload = sessionStorage.getItem(key);
      if (!lastReload || Date.now() - parseInt(lastReload, 10) > 8000) {
        sessionStorage.setItem(key, String(Date.now()));
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch (e) {
            // Ignorer
          }
        }
        window.location.reload();
      }
      throw error;
    }
  });
}
