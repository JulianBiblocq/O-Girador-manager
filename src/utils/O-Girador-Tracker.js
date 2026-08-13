/**
 * SDK Lightweight de Télémétrie O Girador
 * Captation globale des erreurs non interceptées (RGPD-compliant, aucune donnée PII).
 */
const API_URL = import.meta.env.VITE_OGIRADOR_HUB_API_URL || 'http://127.0.0.1:5001/o-girador-dev/us-central1/telemetry/submit';
const API_KEY = import.meta.env.VITE_OGIRADOR_HUB_API_KEY || 'o-girador-telemetry-secret-key-2026';

class OGiradorTracker {
  constructor() {
    this.appId = 'manager'; // 'manager' | 'sequencer' | 'vitrine'
    this.groupId = null;
    this.appVersion = '1.0.0';
    this.isInitialized = false;
  }

  init({ appId, groupId, appVersion }) {
    this.appId = appId;
    this.groupId = groupId || 'anonymous';
    this.appVersion = appVersion || '1.0.0';
    this.isInitialized = true;

    // Interception des erreurs JS globales
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError({
        message,
        source,
        lineno,
        colno,
        stack: error?.stack || null,
        type: 'uncaught_error'
      });
    };

    // Interception des promesses rejetées non gérées
    window.onunhandledrejection = (event) => {
      this.captureError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || null,
        type: 'unhandled_rejection'
      });
    };
  }

  async captureError(errorDetails) {
    if (!this.isInitialized) return;

    try {
      const payload = {
        collectionType: 'crash',
        data: {
          appId: this.appId,
          groupId: this.groupId,
          appVersion: this.appVersion,
          errorMessage: errorDetails.message,
          stackTrace: errorDetails.stack,
          type: errorDetails.type || 'manual',
          route: window.location.pathname,
          userAgent: navigator.userAgent
        }
      };

      this._sendPayload(payload);
    } catch (err) {
      console.warn('Échec de l’envoi de la télémétrie:', err);
    }
  }

  async trackEvent(eventName, eventData = {}) {
    if (!this.isInitialized) return;

    try {
      const payload = {
        collectionType: 'telemetry',
        data: {
          appId: this.appId,
          groupId: this.groupId,
          eventName,
          eventData
        }
      };
      
      this._sendPayload(payload);
    } catch (err) {
      // Silence silencieux pour ne pas impacter l'expérience utilisateur
    }
  }

  async submitTicket(ticketData) {
    if (!this.isInitialized) return;
    const payload = {
      collectionType: 'ticket',
      data: {
        appSource: this.appId,
        groupId: this.groupId,
        appVersion: this.appVersion,
        pageUrl: window.location.href,
        ...ticketData
      }
    };
    return this._sendPayload(payload, true);
  }

  async submitReview(reviewData) {
    if (!this.isInitialized) return;
    const payload = {
      collectionType: 'review',
      data: {
        appSource: this.appId,
        ...reviewData
      }
    };
    return this._sendPayload(payload, true);
  }

  async _sendPayload(payload, awaitResponse = false) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      };

      if (!awaitResponse && navigator.sendBeacon) {
        // navigator.sendBeacon ne supporte pas facilement les headers personnalisés 
        // avec application/json (requiert Blob). On utilise récupérer keepalive.
        fetch(API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
        return;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      console.warn('Tracker SDK Network error:', err);
    }
  }
}

export const tracker = new OGiradorTracker();
