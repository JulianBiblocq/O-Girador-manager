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
