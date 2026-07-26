/**
 * Utility to clear all browser caches, unregister service workers, and force reload the page.
 * Used for emergency manual update / cache clearing by users.
 */
export const forceUpdateAndClearCache = async () => {
  // 1. Delete all cache storages
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => {
        return caches.delete(key);
      }));
    } catch (err) {
      console.error("PWA Utils - Error deleting caches:", err);
    }
  }

  // 2. Unregister all active Service Workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => {
        return registration.unregister();
      }));
    } catch (err) {
      console.error("PWA Utils - Error unregistering service workers:", err);
    }
  }

  // 3. Force reload the page (true bypasses browser cache)
  window.location.reload(true);
};

/**
 * Robust wrapper around React.lazy to auto-recover when dynamic chunk imports fail after new deployments.
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
            // ignore
          }
        }
        window.location.reload();
      }
      throw error;
    }
  });
}
