/**
 * dashboardCacheUtils.js
 * Utilitaires de mise en cache locale (SWR - Stale-While-Revalidate) pour le Tableau de bord.
 * Permet d'éliminer les saccades de mise en page (CLS) et d'optimiser le Largest Contentful Paint (LCP)
 * en pré-remplissant le DOM dès la première trame avant la résolution Firestore.
 */

const PREFIX = 'og_dash_';

/**
 * Récupère une valeur typée depuis le stockage local sécurisé.
 *
 * @param {string} groupId - Identifiant de l'association
 * @param {string} key - Clé de la métrique
 * @param {*} defaultValue - Valeur de repli si absente ou invalide
 * @returns {*}
 */
export function getCachedDashboardItem(groupId, key, defaultValue = null) {
  if (typeof window === 'undefined' || !groupId) return defaultValue;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${groupId.trim().toLowerCase()}_${key}`);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Enregistre une valeur dans le stockage local de session.
 *
 * @param {string} groupId - Identifiant de l'association
 * @param {string} key - Clé de la métrique
 * @param {*} value - Valeur sérialisable en JSON
 */
export function setCachedDashboardItem(groupId, key, value) {
  if (typeof window === 'undefined' || !groupId) return;
  try {
    sessionStorage.setItem(
      `${PREFIX}${groupId.trim().toLowerCase()}_${key}`,
      JSON.stringify(value)
    );
  } catch {
    // Ignorer les erreurs d'espace ou de quota navigateur
  }
}

/**
 * Récupère les annonces mémorisées pour affichage immédiat au premier rendu.
 *
 * @param {string} groupId - Identifiant de l'association
 * @returns {Array} Liste des annonces en cache
 */
export function getCachedAnnouncements(groupId) {
  const cached = getCachedDashboardItem(groupId, 'announcements', []);
  return Array.isArray(cached) ? cached : [];
}

/**
 * Met en cache les annonces fraîches reçues depuis Firestore.
 *
 * @param {string} groupId - Identifiant de l'association
 * @param {Array} announcements - Liste des annonces
 */
export function setCachedAnnouncements(groupId, announcements) {
  if (!Array.isArray(announcements)) return;
  // Ne conserver que les 10 annonces les plus récentes pour limiter le stockage
  setCachedDashboardItem(groupId, 'announcements', announcements.slice(0, 10));
}

/**
 * Récupère l'ordre d'agencement de la grille mémorisé.
 *
 * @param {string} groupId - Identifiant de l'association
 * @param {Array<string>} defaultLayout - Ordre standard par défaut
 * @returns {Array<string>}
 */
export function getCachedDashboardLayout(groupId, defaultLayout) {
  const cached = getCachedDashboardItem(groupId, 'layout', null);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return defaultLayout;
}

/**
 * Sauvegarde l'ordre d'agencement de la grille.
 *
 * @param {string} groupId - Identifiant de l'association
 * @param {Array<string>} layout - Ordre actif
 */
export function setCachedDashboardLayout(groupId, layout) {
  if (!Array.isArray(layout)) return;
  setCachedDashboardItem(groupId, 'layout', layout);
}
