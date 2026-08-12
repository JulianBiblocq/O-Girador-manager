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

/**
 * Vérifie si l'utilisateur possède les droits de prévisualisation du site vitrine en mode brouillon.
 * 
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions
 * @param {Array} effectiveUserTags Étiquettes effectives
 * @returns {boolean} true si l'utilisateur est autorisé à consulter la vitrine non publiée
 */
export function canPreviewVitrineDraft(profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // 1. Rôles système autorisés d'office
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'mestre' ||
    systemRole === 'admin' ||
    systemRole === 'super-admin' ||
    systemRole === 'bureau' ||
    systemRole === 'ca' ||
    profileData.isSystemAdmin === true
  ) {
    return true;
  }

  // 2. Badges de secours/direction
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => ut.includes(kw)))) {
    return true;
  }

  // 3. Matrice des permissions (clés : 'vitrine-preview', 'vitrine', 'vitrine-edit', 'public-theme')
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const allowedTags = [
      ...(permissionsMatrice['vitrine-preview'] || []),
      ...(permissionsMatrice['vitrine'] || []),
      ...(permissionsMatrice['vitrine-edit'] || []),
      ...(permissionsMatrice['public-theme'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (allowedTags.length > 0) {
      if (userTagsList.some(ut => allowedTags.includes(ut))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Vérifie si l'utilisateur possède les droits d'accès et d'édition du Back-Office Vitrine.
 * 
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions
 * @param {Array} effectiveUserTags Étiquettes effectives
 * @returns {boolean} true si l'utilisateur peut configurer et administrer la vitrine
 */
export function canEditVitrine(profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // 1. Rôles système autorisés d'office
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'mestre' ||
    systemRole === 'admin' ||
    systemRole === 'super-admin' ||
    systemRole === 'bureau' ||
    systemRole === 'ca' ||
    profileData.isSystemAdmin === true
  ) {
    return true;
  }

  // 2. Badges de secours/direction
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => ut.includes(kw)))) {
    return true;
  }

  // 3. Matrice des permissions (clés : 'vitrine-edit', 'vitrine', 'public-theme')
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const allowedTags = [
      ...(permissionsMatrice['vitrine-edit'] || []),
      ...(permissionsMatrice['vitrine'] || []),
      ...(permissionsMatrice['public-theme'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (allowedTags.length > 0) {
      if (userTagsList.some(ut => allowedTags.includes(ut))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Vérifie si l'utilisateur possède les droits d'accès au Pôle Diffusion (Suivi des Prestations).
 * 
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions
 * @param {Array} effectiveUserTags Étiquettes effectives
 * @returns {boolean} true si l'utilisateur peut accéder au Pôle Diffusion
 */
export function canAccessDiffusion(profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // 1. Rôles système autorisés d'office
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'mestre' ||
    systemRole === 'admin' ||
    systemRole === 'super-admin' ||
    systemRole === 'bureau' ||
    systemRole === 'ca' ||
    profileData.isSystemAdmin === true
  ) {
    return true;
  }

  // 2. Badges de secours/direction, trésorerie et diffusion
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca', 'diffusion', 'booking', 'trésorier', 'secrétaire'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => ut.includes(kw)))) {
    return true;
  }

  // 3. Matrice des permissions (clés : 'diffusion', 'gigs-pipeline')
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const allowedTags = [
      ...(permissionsMatrice['diffusion'] || []),
      ...(permissionsMatrice['gigs-pipeline'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (allowedTags.length > 0) {
      if (userTagsList.some(ut => allowedTags.includes(ut))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Mots-clés d'étiquettes/badges autorisant les pôles d'administration par défaut.
 */
const POLE_ALLOWED_KEYWORDS = {
  diffusion: ['diffusion', 'booking', 'communication'],
  tresorerie: ['trésorier', 'trésorière', 'trésorerie', 'comptable', 'finance'],
  logistique: ['logistique', 'matériel', 'inventaire', 'instruments', 'commandes', 'vestiaire', 'costumes', 'couture'],
  studio: ['studio', 'communication', 'secrétaire', 'porte-voix', 'newsletter'],
  mestre: ['mestre', 'mestria', 'chef de pupitre', 'direction'],
  vitrine: ['vitrine', 'communication', 'webmaster'],
  pedagogie: ['mestre', 'pédagogie'],
  config: ['config', 'sécurité', 'secrétaire']
};

/**
 * Vérifie si l'utilisateur possède les droits d'accès à un Pôle d'Administration spécifié.
 * 
 * @param {string} poleId Identifiant du pôle ('tresorerie', 'logistique', 'studio', 'diffusion', 'config', etc.)
 * @param {Object} profileData Profil de l'utilisateur (role, isSystemAdmin, tags)
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Étiquettes effectives
 * @returns {boolean} true si l'accès au pôle est déverrouillé pour ce membre
 */
export function canAccessPole(poleId, profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // Pôles publics Espace Membre : toujours déverrouillés
  if (poleId === 'accueil' || poleId === 'mon-espace') return true;



  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  // 2. Matrice des permissions Firestore de l'association (clé globale du pôle)
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const poleTags = permissionsMatrice[poleId];
    if (Array.isArray(poleTags) && poleTags.length > 0) {
      const formattedPoleTags = poleTags.map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
      if (userTagsList.some(ut => formattedPoleTags.includes(ut))) {
        return true;
      }
      // Si une configuration explicite est définie pour ce pôle mais que l'utilisateur ne l'a pas,
      // il ne faut pas qu'il hérite des accès par défaut.
      return false;
    }
  }

  // 3. Badges / Étiquettes autorisées par mots-clés par défaut (fallback si aucune matrice)
  const allowedKeywords = POLE_ALLOWED_KEYWORDS[poleId] || [];
  if (allowedKeywords.length > 0 && userTagsList.some(ut => allowedKeywords.some(kw => ut.includes(kw)))) {
    return true;
  }

  return false;
}

/**
 * Vérifie si l'utilisateur possède les droits d'accès à un Onglet / Sous-Menu d'administration spécifique.
 * 
 * @param {string} tabId Identifiant de l'onglet (ex: 'gigs-pipeline', 'cotisations', 'inventory', etc.)
 * @param {string} poleId Identifiant du pôle parent
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions
 * @param {Array} effectiveUserTags Étiquettes effectives
 * @returns {boolean} true si l'accès à l'onglet est autorisé
 */
export function canAccessTabPermission(tabId, poleId, profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // Onglets publics Espace Membre : toujours autorisés
  if (['profil', 'agenda', 'materiel', 'vestiaire', 'trombinoscope', 'forum', 'dashboard', 'varal'].includes(tabId)) {
    return true;
  }

  // 1. Si l'utilisateur possède les droits d'administration globaux sur le pôle parent, accorder l'accès
  if (canAccessPole(poleId, profileData, permissionsMatrice, effectiveUserTags)) {
    return true;
  }

  // 2. Vérification spécifique par onglet dans la matrice de permissions
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const tabTags = permissionsMatrice[tabId];
    if (Array.isArray(tabTags) && tabTags.length > 0) {
      const userTagsList = (
        effectiveUserTags && effectiveUserTags.length > 0
          ? effectiveUserTags
          : profileData.tags || []
      ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

      const formattedTabTags = tabTags.map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
      if (userTagsList.some(ut => formattedTabTags.includes(ut))) {
        return true;
      }
    }
  }

  return false;
}



