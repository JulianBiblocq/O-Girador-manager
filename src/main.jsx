import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LanguageProvider } from './components/LanguageContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import { TenantProvider } from './context/TenantContext.jsx';

// ✂️ Nettoyage silencieux et immédiat du paramètre de cache-busting (_upd) dans l'URL
if (typeof window !== 'undefined') {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_upd')) {
      url.searchParams.delete('_upd');
      const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (_) {}
}

// Rechargement automatique en cas d'erreur de module obsolète après un nouveau déploiement
const handleStaleChunkError = (reason) => {
  const msg = String(reason?.message || reason || '');
  const isChunkError = 
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('MIME type') ||
    msg.includes('text/html');
  
  if (isChunkError && typeof window !== 'undefined') {
    const key = 'chunk_reload_retry';
    try {
      const lastReload = sessionStorage.getItem(key);
      if (!lastReload || Date.now() - parseInt(lastReload, 10) > 8000) {
        sessionStorage.setItem(key, String(Date.now()));
        if ('caches' in window) {
          caches.keys().then((keys) => Promise.all(keys.map(k => caches.delete(k))))
            .finally(() => window.location.reload());
        } else {
          window.location.reload();
        }
      }
    } catch (_) {
      window.location.reload();
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => handleStaleChunkError(e?.error || e?.message));
  window.addEventListener('unhandledrejection', (e) => handleStaleChunkError(e?.reason));

  // Purge ciblée du cache du Service Worker uniquement en cas de montée de version réelle
  try {
    const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
    const storedVersion = localStorage.getItem('app_build_version');

    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        }).catch(err => console.error("Erreur vidage cache PWA :", err));
      }
    }
    localStorage.setItem('app_build_version', CURRENT_VERSION);
    localStorage.removeItem('app_build_timestamp');
  } catch (_) {}
}

// Montage résilient de l'application React enveloppée au sommet par l'ErrorBoundary global
const rootElement = typeof document !== 'undefined' ? document.getElementById('root') : null;

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary title="Initialisation de l'application">
        <TenantProvider>
          <LanguageProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </LanguageProvider>
        </TenantProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error("Élément racine #root introuvable dans le DOM.");
}

