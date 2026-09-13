import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../firebase';

/**
 * Lance une application de la suite O Girador avec authentification SSO transparente.
 * 
 * - Si l'utilisateur est authentifié, génère un customToken via la Cloud Function getCrossAppAuthToken.
 * - Gère de manière robuste et élégante les bloqueurs de fenêtres pop-up (Safari iOS, Chrome Mobile) :
 *   1) Pré-ouvre un onglet synchrone avec un écran d'attente soigné aux couleurs Cordel.
 *   2) Si la pop-up est bloquée ou sur petit écran interdisant les pop-ups,
 *      bascule automatiquement en redirection directe dans le même onglet (window.location.href).
 *   3) En cas d'indisponibilité temporaire de la fonction Cloud, ouvre l'application cible en direct.
 * 
 * @param {string} targetUrl - URL brute de destination (ex: https://sequenciador.o-girador.com)
 * @param {Object} [options] - Paramètres optionnels de lancement
 * @param {string} [options.appLabel] - Nom convivial de l'application (ex: "le Séquenceur")
 * @param {boolean} [options.forceSameTab] - Forcer la navigation dans le même onglet
 */
export async function launchCrossApp(targetUrl, options = {}) {
  const { appLabel = "l'application", forceSameTab = false } = options;

  if (!targetUrl) return;

  // Si l'utilisateur n'est pas connecté, ouverture directe
  if (!auth.currentUser) {
    if (forceSameTab) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  // Pré-ouverture synchrone pour contourner les bloqueurs de pop-ups navigateurs
  let newTab = null;
  if (!forceSameTab) {
    try {
      newTab = window.open('', '_blank');
      if (newTab) {
        try {
          newTab.document.write(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>O Girador - Connexion en cours...</title>
              <style>
                body {
                  margin: 0;
                  background-color: #fdfaf2;
                  color: #181716;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  text-align: center;
                  padding: 24px;
                  box-sizing: border-box;
                }
                .card {
                  background: #fdfaf2;
                  border: 2px solid #181716;
                  border-radius: 8px;
                  padding: 32px 24px;
                  box-shadow: 4px 4px 0px 0px #181716;
                  max-width: 380px;
                  width: 100%;
                }
                .spinner {
                  width: 40px;
                  height: 40px;
                  border: 3px solid rgba(24, 23, 22, 0.15);
                  border-top-color: #8b2a1a;
                  border-radius: 50%;
                  animation: spin 0.8s linear infinite;
                  margin: 0 auto 20px auto;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                h2 { margin: 0 0 10px 0; font-size: 1.15rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
                p { margin: 0; opacity: 0.75; font-size: 0.88rem; line-height: 1.4; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="spinner"></div>
                <h2>Redirection vers ${appLabel}</h2>
                <p>Authentification sécurisée de votre session en cours...</p>
              </div>
            </body>
            </html>
          `);
        } catch (_) {
          // Tolérance aux contextes de sécurité stricts
        }
      }
    } catch (_) {
      newTab = null;
    }
  }

  try {
    const getSSOToken = httpsCallable(functions, 'getCrossAppAuthToken');
    const res = await getSSOToken();
    const customToken = res.data?.customToken;

    const urlObj = new URL(targetUrl, window.location.origin);
    if (customToken) {
      urlObj.searchParams.set('ssoToken', customToken);
    }
    const finalDestination = urlObj.toString();

    if (newTab && !newTab.closed) {
      try {
        newTab.location.href = finalDestination;
      } catch (_) {
        window.location.href = finalDestination;
      }
    } else {
      // Bloqueur de pop-up actif ou forceSameTab : redirection directe transparente
      window.location.href = finalDestination;
    }
  } catch (error) {
    console.warn("[CrossApp SSO] Impossible de forger le jeton SSO, ouverture directe de secours :", error);
    if (newTab && !newTab.closed) {
      try {
        newTab.location.href = targetUrl;
      } catch (_) {
        window.location.href = targetUrl;
      }
    } else {
      window.location.href = targetUrl;
    }
  }
}
