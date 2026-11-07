/**
 * Utilitaire pour vider tous les caches du navigateur, mettre à jour les service workers (sans les désinscrire) et forcer le rechargement.
 * Préserve l'abonnement Web Push actif de l'appareil tout en purgeant les fichiers mis en cache.
 */
export const forceUpdateAndClearCache = async () => {
  // 1. Mettre à jour tous les Service Workers actifs sans jamais appeler unregister() afin de préserver les jetons Web Push
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => {
        return registration.update();
      }));
    } catch (err) {
      console.error("PWA Utils - Erreur lors de la mise à jour des service workers :", err);
    }
  }

  // 2. Supprimer tous les espaces de stockage en cache
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

  // 3. Nettoyer les clés résiduelles de mise à jour dans localStorage et sessionStorage
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('update_dismissed_')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('update_reloaded_')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}

  // 4. Temporisation brève pour laisser le navigateur libérer les verrous I/O des caches
  await new Promise(resolve => setTimeout(resolve, 200));

  // 5. Forcer le rechargement sans cache par timestamping d'URL
  try {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.set('_upd', Date.now().toString());
    window.location.replace(cleanUrl.toString());
  } catch {
    window.location.reload();
  }
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
          } catch {
            // Ignorer
          }
        }
        window.location.reload();
      }
      throw error;
    }
  });
}
