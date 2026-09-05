/**
 * Utilitaires centralisés pour la vérification des permissions et droits d'accès de l'application.
 */
import { getTagId, findTagObject } from './tagUtils.js';

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
 * Vérifie si l'utilisateur possède les droits d'accès au Pôle Mestria (Direction artistique).
 * 
 * Sont autorisés immédiatement :
 * 1. Les rôles système : isSystemAdmin === true, role === 'super-admin', role === 'admin', role === 'mestre'
 * 2. Les porteurs des badges/étiquettes contenant les mots-clés : ['mestre', 'direction', 'artistique', 'chef de pupitre', 'mestria']
 * 3. Les membres autorisés via la matrice de sécurité (clé 'mestre' ou sous-onglets artistiques)
 * 
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Étiquettes effectives de l'utilisateur
 * @returns {boolean} true si l'accès à la Mestria est accordé
 */
export function canAccessMestre(profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // 1. Rôles système autorisés immédiatement
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    profileData.isSystemAdmin === true ||
    systemRole === 'super-admin' ||
    systemRole === 'admin' ||
    systemRole === 'mestre'
  ) {
    return true;
  }

  // 2. Badges de l'utilisateur (insensible à la casse)
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  // 3. Mots-clés de direction artistique autorisés d'office
  const MESTRE_ALLOWED_KEYWORDS = ['mestre', 'direction', 'artistique', 'scène', 'scene', 'chef de pupitre', 'mestria'];
  if (userTagsList.some(ut => MESTRE_ALLOWED_KEYWORDS.some(kw => ut.includes(kw)))) {
    return true;
  }

  // 4. Matrice des permissions Firestore de l'association
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const mestreTags = [
      ...(permissionsMatrice['mestre'] || []),
      ...(permissionsMatrice['mestre-repertoire'] || []),
      ...(permissionsMatrice['mestre-orientation'] || []),
      ...(permissionsMatrice['mestre-stage-layout'] || []),
      ...(permissionsMatrice['mestre-sequenceur'] || []),
      ...(permissionsMatrice['mestre-events'] || []),
      ...(permissionsMatrice['mestre-mot-mestre'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (mestreTags.length > 0 && userTagsList.some(ut => mestreTags.includes(ut))) {
      return true;
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
  secretariat: ['secrétariat', 'secretaire', 'bureau', 'ca', 'direction', 'admin'],
  logistique: ['logistique', 'matériel', 'inventaire', 'instruments', 'commandes'],
  lutherie: ['lutherie', 'atelier', 'artisan', 'fabrication', 'matériel'],
  costumerie: ['costume', 'costumes', 'costumière', 'couture', 'couturier', 'tailleur', 'habillage', 'vestiaire'],
  studio: ['studio', 'communication', 'porte-voix', 'newsletter'],
  mestre: ['mestre', 'mestria', 'direction', 'artistique', 'scène', 'scene', 'chef de pupitre'],
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

  // Traitement spécifique Mestria
  if (poleId === 'mestre') {
    return canAccessMestre(profileData, permissionsMatrice, effectiveUserTags);
  }

  // Rôles système globaux autorisés d'office
  const systemRole = (profileData.role || '').toLowerCase();
  if (profileData.isSystemAdmin === true || systemRole === 'super-admin' || systemRole === 'admin') {
    return true;
  }

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

  // Si c'est le pôle mestre ou un onglet de direction artistique, vérifier canAccessMestre
  if (poleId === 'mestre' || tabId.startsWith('mestre-')) {
    if (canAccessMestre(profileData, permissionsMatrice, effectiveUserTags)) {
      return true;
    }
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

/**
 * Vérifie si l'utilisateur possède les privilèges d'administration ou de modération pour le Forum / Porte-voix.
 * Sont reconnus comme modérateurs/administrateurs :
 * 1. Rôles système : 'mestre', 'admin', 'super-admin', ou isSystemAdmin === true.
 * 2. Étiquettes explicites de modération : 'Modérateur', 'Modérateur Forum', 'Gestionnaire Porte-voix', 'Porte-voix'.
 * 3. Étiquettes de direction / présidence : 'bureau', 'président', 'présidente', 'présidence', 'direction'.
 *
 * NOTE : Le statut 'CA' (Conseil d'Administration) ne confère pas de modération globale du forum.
 *
 * @param {Object} profileData Profil de l'utilisateur
 * @returns {boolean} true si le membre est modérateur ou administrateur
 */
export function isUserModeratorOrAdmin(profileData) {
  if (!profileData) return false;

  const role = (profileData.role || '').toLowerCase();
  if (
    role === 'mestre' ||
    role === 'admin' ||
    role === 'super-admin' ||
    role === 'bureau' ||
    profileData.isSystemAdmin === true
  ) {
    return true;
  }

  const rawTags = Array.isArray(profileData.tags) ? profileData.tags : [];
  const tagStrings = rawTags.map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()));

  const MODERATION_KEYWORDS = [
    'modérateur',
    'modérateur forum',
    'gestionnaire porte-voix',
    'porte-voix',
    'bureau',
    'président',
    'présidente',
    'présidence',
    'direction',
    'admin'
  ];

  return tagStrings.some(t => MODERATION_KEYWORDS.some(kw => t.includes(kw)));
}

/**
 * Vérifie si le rôle ou les étiquettes du membre correspondent à la liste des rôles/étiquettes autorisés d'un salon.
 *
 * Respecte strictement la hiérarchie associative :
 * 1. Salon 'all' : public à tous les membres.
 * 2. Salon 'bureau' : STRICTEMENT réservé aux membres du Bureau (badges 'Bureau', 'Président', 'Présidente',
 *    'Trésorier', 'Secrétaire'...). Les membres du CA non-membres du Bureau sont STRICTEMENT EXCLUS.
 * 3. Salon 'ca' : accessible aux membres du CA ('ca') et aux membres du Bureau (le Bureau faisant partie du CA).
 * 4. Les autres salons respectent leurs étiquettes et héritages respectifs.
 *
 * @param {Array<string>} allowedList Liste des identifiants autorisés ('all', 'membre', 'bureau', 'ca', id de tag...)
 * @param {string} userRole Rôle système du membre
 * @param {Array<string|object>} userTags Liste des étiquettes (effectives ou directes) du membre
 * @param {Array<object|string>} tagsAvailable Liste des étiquettes disponibles de l'association
 * @returns {boolean} true si le membre est autorisé
 */
export function checkUserAccessToList(allowedList = ['all'], userRole = 'membre', userTags = [], tagsAvailable = []) {
  if (!Array.isArray(allowedList) || allowedList.length === 0) return true;
  if (allowedList.includes('all')) return true;

  const cleanRole = (userRole || '').toLowerCase().trim();

  // Résolution exhaustive de toutes les variantes textuelles des étiquettes de l'utilisateur
  const allUserTagVariants = new Set();
  (userTags || []).forEach(t => {
    if (!t) return;
    const directStr = typeof t === 'string' ? t : getTagId(t);
    if (directStr) {
      const lower = directStr.toLowerCase().trim();
      allUserTagVariants.add(lower);
      allUserTagVariants.add(lower.replace(/[\.\-_]/g, '').trim());
    }
    if (typeof t === 'object') {
      if (t.id) {
        const idLower = String(t.id).toLowerCase().trim();
        allUserTagVariants.add(idLower);
        allUserTagVariants.add(idLower.replace(/[\.\-_]/g, '').trim());
      }
      if (t.nomM) allUserTagVariants.add(String(t.nomM).toLowerCase().trim());
      if (t.nomF) allUserTagVariants.add(String(t.nomF).toLowerCase().trim());
      if (t.name) allUserTagVariants.add(String(t.name).toLowerCase().trim());
    }

    // Résolution via tagsAvailable (nomM, nomF, id, inheritsFrom)
    const tagObj = findTagObject(t, tagsAvailable);
    if (tagObj && typeof tagObj === 'object') {
      if (tagObj.id) {
        const idLower = String(tagObj.id).toLowerCase().trim();
        allUserTagVariants.add(idLower);
        allUserTagVariants.add(idLower.replace(/[\.\-_]/g, '').trim());
      }
      if (tagObj.nomM) allUserTagVariants.add(String(tagObj.nomM).toLowerCase().trim());
      if (tagObj.nomF) allUserTagVariants.add(String(tagObj.nomF).toLowerCase().trim());
      if (tagObj.name) allUserTagVariants.add(String(tagObj.name).toLowerCase().trim());
      if (Array.isArray(tagObj.inheritsFrom)) {
        tagObj.inheritsFrom.forEach(p => {
          const pId = getTagId(p);
          if (pId) {
            const pLower = String(pId).toLowerCase().trim();
            allUserTagVariants.add(pLower);
            allUserTagVariants.add(pLower.replace(/[\.\-_]/g, '').trim());
          }
        });
      }
    }
  });

  const tagVariantsArray = Array.from(allUserTagVariants);

  // Mots-clés stricts du Bureau (exécutif restreint) : NE JAMAIS INCLURE 'ca' !
  const BUREAU_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'trésorier', 'trésorière', 'secrétaire'];
  const hasBureauTag = tagVariantsArray.some(t => BUREAU_KEYWORDS.some(kw => t.includes(kw))) || cleanRole === 'bureau';

  // Rôles et étiquettes du Conseil d'Administration (CA) :
  // Le CA comprend :
  // 1. Les membres du Bureau (Président, Trésorier, Secrétaire...).
  // 2. Les membres élus du CA (badges 'CA', 'C.A.', 'Conseil d\'administration', rôle 'ca').
  // 3. Les administrateurs de l'association / système ('admin', 'super-admin', 'mestre', 'administrateur', 'administratrice').
  const isCaRole = cleanRole === 'ca' || cleanRole === 'admin' || cleanRole === 'super-admin' || cleanRole === 'mestre';
  const hasCaTag = isCaRole || hasBureauTag || tagVariantsArray.some(t => {
    return t === 'ca' ||
      t.startsWith('ca ') ||
      t.endsWith(' ca') ||
      t.includes('conseil') ||
      t.includes('administrateur') ||
      t.includes('administratrice') ||
      t.includes('admin');
  });

  // 1. Règle pour le salon 'Bureau' :
  // Seuls les membres possédant un badge ou rôle du Bureau sont autorisés.
  // Les membres du CA non-membres du bureau en sont strictement exclus.
  const isBureauChannel = allowedList.some(r => {
    const s = String(r).toLowerCase().trim();
    return s === 'bureau' || s.endsWith('_bureau');
  });
  if (isBureauChannel) {
    return hasBureauTag;
  }

  // 2. Règle pour le salon 'CA' :
  // Accessible à tous les membres du CA (administrateurs, mestre, membres du CA et membres du Bureau).
  const isCaChannel = allowedList.some(r => {
    const s = String(r).toLowerCase().trim();
    return s === 'ca' || s.endsWith('_ca') || s.includes('conseil');
  });
  if (isCaChannel) {
    return hasCaTag;
  }

  // 3. Correspondance directe de rôle système (pour les autres salons)
  if (allowedList.some(r => String(r).toLowerCase().trim() === cleanRole)) return true;

  // 4. Vérification générique pour les autres salons (pupitres, groupes de travail...)
  return allowedList.some(allowedItem => {
    const targetLower = String(allowedItem).toLowerCase().trim();
    if (tagVariantsArray.includes(targetLower)) return true;
    return tagVariantsArray.some(t => t.includes(targetLower));
  });
}

/**
 * Vérifie si l'utilisateur possède les droits d'écriture et de réponse dans un salon du forum.
 *
 * @param {Object} channel Objet salon (readOnlyForMembers, writeRoles, allowedRoles, etc.)
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Array} tagsDisponibles Liste des étiquettes disponibles de l'association
 * @param {Array} effectiveUserTags Liste des étiquettes effectives du membre
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si le membre peut publier ou répondre
 */
export function canUserWriteInForumChannel(
  channel,
  profileData,
  tagsDisponibles = [],
  effectiveUserTags = [],
  breakGlassActive = false
) {
  if (!channel) return true;
  if (breakGlassActive) return true;

  // L'utilisateur doit d'abord obligatoirement avoir accès en lecture au salon pour pouvoir y écrire
  if (!canUserReadForumChannel(channel, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive)) {
    return false;
  }

  const isModOrAdmin = isUserModeratorOrAdmin(profileData);

  // Si le salon est réservé en lecture seule pour les membres (annonces, informations officielles),
  // seuls les modérateurs et administrateurs peuvent y publier ou répondre.
  if (channel.readOnlyForMembers === true) {
    return isModOrAdmin;
  }

  const userRole = profileData?.role || 'membre';
  const userTags = (effectiveUserTags && effectiveUserTags.length > 0)
    ? effectiveUserTags
    : (profileData?.tags || []);

  const writeList = channel.writeRoles || channel.allowedRoles || ['all'];
  return checkUserAccessToList(writeList, userRole, userTags, tagsDisponibles);
}

/**
 * Vérifie si l'utilisateur possède les droits de lecture / visibilité sur un salon du forum.
 *
 * @param {Object} channel Objet salon (readRoles, allowedRoles, isTransparent, etc.)
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Array} tagsDisponibles Liste des étiquettes disponibles de l'association
 * @param {Array} effectiveUserTags Liste des étiquettes effectives du membre
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si le membre a accès en lecture au salon
 */
export function canUserReadForumChannel(
  channel,
  profileData,
  tagsDisponibles = [],
  effectiveUserTags = [],
  breakGlassActive = false
) {
  if (!channel) return true;
  if (breakGlassActive) return true;

  const channelNameLower = (channel.name || '').toLowerCase().trim();
  const channelIdLower = (channel.id || '').toLowerCase().trim();

  const userRole = profileData?.role || 'membre';
  const userTags = (effectiveUserTags && effectiveUserTags.length > 0)
    ? effectiveUserTags
    : (profileData?.tags || []);

  // Sécurité absolue pour le salon Bureau : toujours strictement restreint aux membres du Bureau
  if (channelNameLower === 'bureau' || channelIdLower.endsWith('_bureau') || channelIdLower === 'bureau') {
    return checkUserAccessToList(['bureau'], userRole, userTags, tagsDisponibles);
  }

  // Sécurité pour le salon CA : restreint aux membres du CA et du Bureau
  if (channelNameLower === 'ca' || channelIdLower.endsWith('_ca') || channelIdLower === 'ca') {
    return checkUserAccessToList(['ca'], userRole, userTags, tagsDisponibles);
  }

  if (channel.isTransparent === true) return true;

  const readList = channel.readRoles || channel.allowedRoles || channel.allowedTags || ['all'];
  if (!readList || readList.length === 0 || readList.includes('all')) return true;

  return checkUserAccessToList(readList, userRole, userTags, tagsDisponibles);
}

/**
 * Vérifie si l'utilisateur possède les droits de validation et de contrôle d'atelier (Pôle Lutherie).
 * Permet de valider les étapes d'usinage sur l'établi ou de demander une retouche.
 *
 * Sont autorisés :
 * 1. Les rôles système prioritaires : isSystemAdmin === true, 'mestre', 'super-admin', 'admin'.
 * 2. Les membres dont un badge figure dans permissionsMatrice.canValidateWorkshopSteps.
 * 3. À défaut de configuration explicite, les membres portant des badges artisanaux de secours :
 *    ('maître d'atelier', 'maitre d'atelier', 'luthier', 'référent lutherie', 'referent lutherie', 'artisan').
 *
 * @param {Object} profileData Profil de l'utilisateur (role, isSystemAdmin, tags)
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Liste des étiquettes effectives du membre
 * @returns {boolean} true si l'utilisateur est autorisé à valider les étapes d'atelier
 */
export function canValidateWorkshop(profileData, permissionsMatrice = null, effectiveUserTags = []) {
  if (!profileData) return false;

  // 1. Bypass pour les rôles système d'office
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    profileData.isSystemAdmin === true ||
    systemRole === 'mestre' ||
    systemRole === 'super-admin' ||
    systemRole === 'admin'
  ) {
    return true;
  }

  // 2. Préparation de la liste des badges de l'utilisateur (identifiants et libellés en minuscules)
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  ).flatMap(t => {
    if (!t) return [];
    if (typeof t === 'string') return [t.toLowerCase().trim()];
    return [
      t.id?.toLowerCase()?.trim(),
      t.nomM?.toLowerCase()?.trim(),
      t.nomF?.toLowerCase()?.trim()
    ].filter(Boolean);
  });

  // 3. Vérification dans la matrice des permissions (clé 'canValidateWorkshopSteps')
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const configuredTags = (permissionsMatrice.canValidateWorkshopSteps || []).flatMap(t => {
      if (!t) return [];
      if (typeof t === 'string') return [t.toLowerCase().trim()];
      return [
        t.id?.toLowerCase()?.trim(),
        t.nomM?.toLowerCase()?.trim(),
        t.nomF?.toLowerCase()?.trim()
      ].filter(Boolean);
    });

    if (configuredTags.length > 0) {
      return userTagsList.some(ut => configuredTags.includes(ut));
    }
  }

  // 4. Mots-clés de secours si aucune règle spécifique n'est configurée dans la matrice
  const DEFAULT_WORKSHOP_KEYWORDS = [
    "maître d'atelier",
    "maitre d'atelier",
    "luthier",
    "référent lutherie",
    "referent lutherie",
    "artisan"
  ];

  return userTagsList.some(ut => DEFAULT_WORKSHOP_KEYWORDS.some(kw => ut.includes(kw)));
}
