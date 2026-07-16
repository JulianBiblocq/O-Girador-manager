/**
 * Utility to clear all browser caches, unregister service workers, and force reload the page.
 * Used for emergency manual update / cache clearing by users.
 */
export const forceUpdateAndClearCache = async () => {
  console.log("PWA Utils - Starting emergency cache clearing and service worker unregistration...");

  // 1. Delete all cache storages
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => {
        console.log(`PWA Utils - Deleting cache key: ${key}`);
        return caches.delete(key);
      }));
      console.log("PWA Utils - All caches deleted successfully.");
    } catch (err) {
      console.error("PWA Utils - Error deleting caches:", err);
    }
  }

  // 2. Unregister all active Service Workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => {
        console.log("PWA Utils - Unregistering service worker:", registration);
        return registration.unregister();
      }));
      console.log("PWA Utils - All Service Workers unregistered successfully.");
    } catch (err) {
      console.error("PWA Utils - Error unregistering service workers:", err);
    }
  }

  // 3. Force reload the page (true bypasses browser cache)
  console.log("PWA Utils - Reloading application...");
  window.location.reload(true);
};
