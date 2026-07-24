const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'v1.0.1';
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
  localStorage.setItem('app_version', APP_VERSION);
  
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
)
