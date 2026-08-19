// Rechargement automatique en cas d'erreur de module obsolète après un nouveau déploiement
const handleStaleChunkError = (reason) => {
  const msg = String(reason?.message || reason || '');
  const isChunkError = 
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('MIME type') ||
    msg.includes('text/html');
  
  if (isChunkError) {
    const key = 'chunk_reload_retry';
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
  }
};

window.addEventListener('error', (e) => handleStaleChunkError(e?.error || e?.message));
window.addEventListener('unhandledrejection', (e) => handleStaleChunkError(e?.reason));

const BUILD_TIME = String(Date.now());
const storedBuildTime = localStorage.getItem('app_build_timestamp');

if (storedBuildTime !== BUILD_TIME) {
  localStorage.setItem('app_build_timestamp', BUILD_TIME);
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    }).catch(err => console.error("Error clearing cache:", err));
  }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './components/LanguageContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { TenantProvider } from './context/TenantContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TenantProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </TenantProvider>
  </StrictMode>,
)
