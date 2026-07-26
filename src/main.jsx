// Auto-reload on stale chunk failure after a new deployment
window.addEventListener('error', (e) => {
  const msg = e?.message || e?.error?.message || '';
  const isChunkError = 
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Expected a JavaScript-or-Wasm module script');
  
  if (isChunkError) {
    const key = 'chunk_reload_retry';
    const lastReload = sessionStorage.getItem(key);
    if (!lastReload || Date.now() - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  }
});

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ErrorBoundary>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
)
