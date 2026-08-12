import React from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  sendTelemetry = (errorType, error, errorInfo = null) => {
    try {
      const payload = {
        type: 'crash',
        errorType,
        message: error?.message || String(error),
        stack: error?.stack || null,
        componentStack: errorInfo?.componentStack || null,
        context: {
          pageUrl: window.location.href,
          appVersion: import.meta.env.VITE_APP_VERSION || 'N/A',
          userAgent: navigator.userAgent
        },
        timestamp: new Date().toISOString()
      };

      const hubUrl = import.meta.env.VITE_ECOSYSTEM_HUB_URL || 'https://hook.eu2.make.com/placeholder-feedback';
      
      if (navigator.sendBeacon) {
        // Blob is required for sendBeacon to set application/json content type correctly if accepted by server, 
        // but text/plain is safer for CORS. We'll use fetch with keepalive as primary since it supports headers.
        fetch(hubUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      } else {
        fetch(hubUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch (e) {
      // Ignorer silencieusement les erreurs de télémétrie
    }
  };

  componentDidMount() {
    this.handleGlobalError = (event) => {
      this.sendTelemetry('window.onerror', event.error || event.message);
    };
    this.handleGlobalPromiseRejection = (event) => {
      this.sendTelemetry('unhandledrejection', event.reason);
    };

    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalPromiseRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalPromiseRejection);
  }

  componentDidCatch(error, errorInfo) {
    console.error(`ErrorBoundary [${this.props.title || 'Global'}] a intercepté une erreur :`, error, errorInfo);
    
    // Télémétrie silencieuse
    this.sendTelemetry('react_error_boundary', error, errorInfo);
    
    // Auto-recover if error is caused by stale lazy-loaded chunk after a new deploy
    const msg = String(error?.message || error || '');
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
  }

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map(k => caches.delete(k))))
        .finally(() => window.location.reload());
    } else {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const sectionTitle = this.props.title || "Oups, un problème est survenu";
      const isCompact = this.props.compact || Boolean(this.props.title);

      if (isCompact) {
        return (
          <div className="w-full p-3 my-2 select-none">
            <CordelCard variant="ocre" useExtremeBorder={true} className="w-full p-4 text-center flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">⚠️</span>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood">
                  Erreur : {sectionTitle}
                </h4>
              </div>
              <p className="text-[11px] leading-relaxed font-semibold opacity-85">
                Un problème est survenu lors de l'affichage de ce bloc. Vos données restent sécurisées.
              </p>
              {this.state.error?.message && (
                <div className="p-2 bg-black/10 dark:bg-white/10 rounded font-mono text-[9px] text-left overflow-x-auto select-text">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex gap-2 justify-center mt-1">
                <CordelButton 
                  variant="default" 
                  onClick={this.handleReset}
                  useExtremeBorder={true}
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1"
                >
                  🔄 Réessayer
                </CordelButton>
                <CordelButton 
                  variant="outline" 
                  onClick={this.handleReload}
                  useExtremeBorder={true}
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1"
                >
                  🌐 Recharger
                </CordelButton>
              </div>
            </CordelCard>
          </div>
        );
      }

      return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-cordel-bg-light text-encre-noire font-sans select-none">
          <CordelCard variant="ocre" useExtremeBorder={true} className="max-w-md w-full p-6 text-center flex flex-col gap-4">
            <span className="text-3xl animate-bounce">⚠️</span>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-cordel-wood">
              {sectionTitle}
            </h3>
            <p className="text-xs leading-relaxed font-semibold opacity-85">
              Une erreur inattendue est survenue lors du rendu de cette page. Pas de panique, vos données Firebase sont en sécurité !
            </p>
            {this.state.error?.message && (
              <div className="p-2 bg-black/10 dark:bg-white/10 rounded font-mono text-[9px] text-left overflow-x-auto select-text">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2.5 justify-center mt-2">
              <CordelButton 
                variant="default" 
                onClick={this.handleReset}
                useExtremeBorder={true}
                className="text-xs font-black uppercase tracking-wider"
              >
                🔄 Réessayer
              </CordelButton>
              <CordelButton 
                variant="outline" 
                onClick={this.handleReload}
                useExtremeBorder={true}
                className="text-xs font-black uppercase tracking-wider"
              >
                🌐 Recharger la page
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      );
    }

    return this.props.children;
  }
}

