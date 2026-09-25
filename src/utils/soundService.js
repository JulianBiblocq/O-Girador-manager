/**
 * Service audio pour la restitution des signatures sonores d'Organizad'Or.
 * Fournit la lecture de la notification sonore (deux frappes douces d'Alfaia)
 * avec gestion de la compatibilité multi-navigateurs et des restrictions d'autoplay.
 */

// Horodatage de la dernière lecture pour éviter les doubles déclenchements simultanés (écouteurs multiples)
let lastPlayedAt = 0;
const DEBOUNCE_INTERVAL_MS = 600;

/**
 * Joue la signature sonore de notification (deux frappes douces d'Alfaia).
 * Utilise le format OGG en priorité avec repli automatique sur MP3 pour Safari / iOS.
 * Volume réglé à 0.5 (frappe feutrée).
 * Intercepte silencieusement les rejets d'autoplay des navigateurs.
 */
export function playNotificationSound() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return;
  }

  // Évite les échos en cas de montages multiples ou d'événements rapprochés
  const now = Date.now();
  if (now - lastPlayedAt < DEBOUNCE_INTERVAL_MS) {
    return;
  }
  lastPlayedAt = now;

  try {
    // Vérification de la prise en charge du format OGG par le navigateur (Chromium, Firefox)
    const testAudio = new Audio();
    const canPlayOgg = Boolean(
      testAudio.canPlayType && testAudio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')
    );

    const primarySrc = canPlayOgg ? '/sounds/notif.ogg' : '/sounds/notif.mp3';
    const fallbackSrc = canPlayOgg ? '/sounds/notif.mp3' : '/sounds/notif.ogg';

    const audio = new Audio(primarySrc);
    audio.volume = 0.5;

    // En cas d'erreur de lecture sur le format principal, basculer sur le format de repli
    audio.onerror = () => {
      try {
        const fallbackAudio = new Audio(fallbackSrc);
        fallbackAudio.volume = 0.5;
        const fallbackPromise = fallbackAudio.play();
        if (fallbackPromise && typeof fallbackPromise.catch === 'function') {
          fallbackPromise.catch(() => {
            // Blocage autoplay silencieux
          });
        }
      } catch {
        // Ignorer les erreurs d'environnement
      }
    };

    // Déclenchement de la lecture avec interception silencieuse de l'autoplay bloqué
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Interception silencieuse : évite de polluer la console avec NotAllowedError
        // si l'utilisateur n'a pas encore interagi avec le document
      });
    }
  } catch {
    // Garde-fou silencieux pour environnements restreints
  }
}
