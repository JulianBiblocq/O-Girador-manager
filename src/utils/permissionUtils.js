/**
 * Utilitaires centralisés pour la vérification des permissions et droits d'accès de l'application.
 */

/**
 * Vérifie si l'utilisateur possède les droits de gestion de l'Agenda (création, modification, suppression d'événements).
 * 
 * Sont autorisés :
 * 1. Les rôles système : 'mestre', 'admin', 'super-admin' ou isSystemAdmin === true.
 * 2. Les membres possédant des étiquettes de présidence / bureau (ex: "Bureau", "Président", "Présidente", "Présidence", "CA", "Direction").
 * 3. Les membres possédant des étiquettes autorisées dans la matrice de sécurité de l'association.
 *
 * @param {Object} profileData Profil de l'utilisateur (role, isSystemAdmin, tags, etc.)
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Liste des étiquettes effectives de l'utilisateur
 * @returns {boolean} true si l'utilisateur peut gérer les événements de l'agenda
 */
export function canManageEvents(profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // 1. Rôles système autorisés d'office
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'mestre' ||
    systemRole === 'admin' ||
    systemRole === 'super-admin' ||
    profileData.isSystemAdmin === true
  ) {
    return true;
  }

  // 2. Badges de secours/mots-clés de direction (Bureau, Présidence, Président, Présidente, Admin, Direction, CA)
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => ut.includes(kw)))) {
    return true;
  }

  // 3. Matrice des permissions de l'association (clés : 'agenda', 'studio-events', 'mestre-events', 'events')
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const agendaAllowedTags = [
      ...(permissionsMatrice['agenda'] || []),
      ...(permissionsMatrice['studio-events'] || []),
      ...(permissionsMatrice['mestre-events'] || []),
      ...(permissionsMatrice['events'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (agendaAllowedTags.length > 0) {
      if (userTagsList.some(ut => agendaAllowedTags.includes(ut))) {
        return true;
      }
    }
  }

  return false;
}
