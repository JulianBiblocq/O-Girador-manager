import { useEffect } from 'react';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';

export const CURRENT_VERSION = (import.meta.env.VITE_APP_VERSION || 'v1.0.0').replace(/^v/, '');

/**
 * Hook de détection de version et purge de cache PWA pour Organizad'Or.
 * Désactivé en développement. En production, sonde /version.json au montage
 * et lors du retour au premier plan de l'onglet avec un délai de temporisation.
 */
export function useAppUpdate() {
  useEffect(() => {
    // 🛡️ Garde de développement : ne pas sonder en local
    if (import.meta.env.DEV) return;

    let hasChecked = false;

    const checkVersion = async () => {
      if (hasChecked || !navigator.onLine) return;
      hasChecked = true;
      // Temporisation de 10 minutes entre deux vérifications
      setTimeout(() => { hasChecked = false; }, 10 * 60 * 1000);

      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        if (!response.ok) return;

        const data = await response.json();
        if (data && typeof data === 'object' && data.version) {
          const latestVersion = String(data.version);
          if (latestVersion !== CURRENT_VERSION) {
            // Protection contre les boucles infinies : temporisation de 15 secondes entre deux tentatives
            const lastAttempt = parseInt(sessionStorage.getItem('last_update_reload_ts') || '0', 10);
            const now = Date.now();
            if (now - lastAttempt < 15000) return;
            sessionStorage.setItem('last_update_reload_ts', String(now));

            // Purge immédiate des caches et désinscription des Service Workers
            await forceUpdateAndClearCache();
          }
        }
      } catch (_) {}
    };

    checkVersion();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', checkVersion);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', checkVersion);
    };
  }, []);
}
