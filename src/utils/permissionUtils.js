/**
 * Utilitaires centralisés pour la vérification des permissions et droits d'accès de l'application.
 * Prend en charge le Mode Strict (Navigation Normale quotidienne selon les étiquettes effectives)
 * et le Mode Intervention (Break-Glass / Passe-partout technique complet pour Super-Admin).
 */
import { getTagId, findTagObject } from './tagUtils.js';

/**
 * Vérifie si une étiquette utilisateur correspond à un mot-clé d'accès autorisé.
 * Prévient strictement les faux positifs où 'super-admin' ou 'superadmin' matcherait le mot-clé 'admin'.
 *
 * @param {string} tagString - Étiquette textuelle du membre
 * @param {string} keyword - Mot-clé autorisé pour le pôle ou l'onglet
 * @returns {boolean} true si correspondance exacte ou préfixe/suffixe légitime sans faux positif
 */
export function matchesAllowedKeyword(tagString, keyword) {
  if (!tagString || !keyword) return false;
  const t = String(tagString).toLowerCase().trim();
  const kw = String(keyword).toLowerCase().trim();

  // Règle stricte anti-faux-positif pour 'admin' :
  // Ne jamais accorder l'accès si le libellé contient 'super-admin' ou 'superadmin'
  if (kw === 'admin') {
    if (t.includes('super-admin') || t.includes('superadmin')) {
      return false;
    }
    return t === 'admin' || t === 'administrateur' || t === 'administratrice' ||
           t.startsWith('admin ') || t.endsWith(' admin') || t.includes('administrateur') || t.includes('administratrice');
  }

  // Règle anti-faux-positif pour 'bureau' : le tag 'ca' ne doit jamais matcher 'bureau'
  if (kw === 'bureau') {
    if (t === 'ca' || t.startsWith('ca ') || t.endsWith(' ca')) {
      return false;
    }
    return t === 'bureau' || t.includes('bureau') || t.includes('président') || t.includes('présidente') || t.includes('présidence');
  }

  return t === kw || t.includes(kw);
}

/**
 * Détermine si le profil correspond à un Super-Administrateur racine de l'application.
 *
 * @param {Object} profileData - Profil utilisateur
 * @returns {boolean} true si super-admin
 */
export function isSuperAdminProfile(profileData) {
  if (!profileData) return false;
  // En mode simulation, le statut de Super-Administrateur racine est strictement désactivé
  if (profileData.isSimulated === true) return false;
  const role = (profileData.role || '').toLowerCase();
  return (
    profileData.isSystemAdmin === true ||
    role === 'super-admin' ||
    role === 'mestre' ||
    profileData.uid === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' ||
    profileData.id === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1'
  );
}

/**
 * Vérifie si l'utilisateur possède les droits de gestion de l'Agenda (création, modification, suppression d'événements).
 * 
 * @param {Object} profileData Profil de l'utilisateur (role, isSystemAdmin, tags, etc.)
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Liste des étiquettes effectives de l'utilisateur
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'utilisateur peut gérer les événements de l'agenda
 */
export function canManageEvents(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  // Mode Intervention : déverrouillage pour super-admin
  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  // Rôle Mestre artistique ou Administrateur d'association
  const systemRole = (profileData.role || '').toLowerCase();
  if (systemRole === 'mestre' || systemRole === 'admin') {
    return true;
  }

  // Badges de direction / bureau / CA
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => matchesAllowedKeyword(ut, kw)))) {
    return true;
  }

  // Matrice des permissions de l'association (clés : 'agenda', 'studio-events', 'mestre-events', 'events')
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
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'utilisateur est autorisé à consulter la vitrine non publiée
 */
export function canPreviewVitrineDraft(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  const systemRole = (profileData.role || '').toLowerCase();
  if (systemRole === 'mestre' || systemRole === 'bureau' || systemRole === 'ca' || systemRole === 'admin') {
    return true;
  }

  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => matchesAllowedKeyword(ut, kw)))) {
    return true;
  }

  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const allowedTags = [
      ...(permissionsMatrice['vitrine-preview'] || []),
      ...(permissionsMatrice['vitrine'] || []),
      ...(permissionsMatrice['vitrine-edit'] || []),
      ...(permissionsMatrice['public-theme'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (allowedTags.length > 0 && userTagsList.some(ut => allowedTags.includes(ut))) {
      return true;
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
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'utilisateur peut configurer et administrer la vitrine
 */
export function canEditVitrine(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  const systemRole = (profileData.role || '').toLowerCase();
  if (systemRole === 'mestre' || systemRole === 'bureau' || systemRole === 'ca' || systemRole === 'admin') {
    return true;
  }

  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca', 'vitrine', 'webmaster'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => matchesAllowedKeyword(ut, kw)))) {
    return true;
  }

  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const allowedTags = [
      ...(permissionsMatrice['vitrine-edit'] || []),
      ...(permissionsMatrice['vitrine'] || []),
      ...(permissionsMatrice['public-theme'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (allowedTags.length > 0 && userTagsList.some(ut => allowedTags.includes(ut))) {
      return true;
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
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'utilisateur peut accéder au Pôle Diffusion
 */
export function canAccessDiffusion(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  const systemRole = (profileData.role || '').toLowerCase();
  if (systemRole === 'mestre' || systemRole === 'bureau' || systemRole === 'ca' || systemRole === 'admin') {
    return true;
  }

  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  const DEFAULT_ALLOWED_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca', 'diffusion', 'booking', 'trésorier', 'secrétaire'];
  if (userTagsList.some(ut => DEFAULT_ALLOWED_KEYWORDS.some(kw => matchesAllowedKeyword(ut, kw)))) {
    return true;
  }

  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const allowedTags = [
      ...(permissionsMatrice['diffusion'] || []),
      ...(permissionsMatrice['gigs-pipeline'] || [])
    ].map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));

    if (allowedTags.length > 0 && userTagsList.some(ut => allowedTags.includes(ut))) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie si l'utilisateur possède les droits d'accès au Pôle Mestria (Direction artistique).
 * 
 * Règles :
 * 1. Mode Intervention (Break-Glass) : accès total garanti pour super-admin.
 * 2. Rôle Mestre artistique direct (role === 'mestre') : accès toujours garanti.
 * 3. Mode Normal pour Super-Admin ou autres membres : accès accordé UNIQUEMENT si le membre
 *    possède un badge artistique effectif ou une autorisation explicite dans la matrice.
 * 
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Étiquettes effectives de l'utilisateur
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'accès à la Mestria est accordé
 */
export function canAccessMestre(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  // 1. Mode Intervention (Break-Glass) : Passe-partout complet pour Super-Admin
  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  // 2. Le rôle 'mestre' ou 'admin' conserve son accès direct légitime à sa direction artistique
  const systemRole = (profileData.role || '').toLowerCase();
  if (systemRole === 'mestre' || systemRole === 'admin') {
    return true;
  }

  // 3. Badges de l'utilisateur (mots-clés artistiques : mestre, mestria, chef de pupitre...)
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  const MESTRE_ALLOWED_KEYWORDS = ['mestre', 'direction', 'artistique', 'scène', 'scene', 'chef de pupitre', 'mestria'];
  if (userTagsList.some(ut => MESTRE_ALLOWED_KEYWORDS.some(kw => matchesAllowedKeyword(ut, kw)))) {
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
 * Table de correspondance entre onglets d'administration et leurs pôles parents respectifs.
 */
export const TAB_TO_POLE_MAP = {
  // Mon Espace
  repertoire: 'mon-espace',

  // Logistique
  inventory: 'logistique',
  'logistics-pupitres': 'logistique',
  'logistics-kits': 'logistique',
  'logistics-carpool': 'logistique',
  orders: 'logistique',
  'orders-manager': 'logistique',

  // Trésorerie
  'dashboard-finance': 'tresorerie',
  cotisations: 'tresorerie',
  'events-finances': 'tresorerie',
  'operations-diverses': 'tresorerie',
  'frais-km': 'tresorerie',
  'reports-exports': 'tresorerie',

  // Lutherie
  'inventory-projects': 'lutherie',
  'instrument-models': 'lutherie',
  'inventory-parts': 'lutherie',
  'inventory-supplies': 'lutherie',
  'workshop-tools': 'lutherie',
  'varal-lutherie': 'lutherie',
  canValidateWorkshopSteps: 'lutherie',

  // Costumerie
  'wardrobe-projects': 'costumerie',
  'wardrobe-models': 'costumerie',
  'wardrobe-pieces': 'costumerie',
  'wardrobe-supplies': 'costumerie',
  'wardrobe-tools': 'costumerie',
  'wardrobe-sizes': 'costumerie',
  'varal-costumerie': 'costumerie',

  // Diffusion
  'gigs-pipeline': 'diffusion',

  // Secrétariat
  'export-annu': 'secretariat',
  'reunion-manager': 'secretariat',
  'activity-reports': 'secretariat',
  'mestre-forum-channels': 'secretariat',
  'studio-events': 'secretariat',
  'varal-secretariat': 'secretariat',
  'secretariat-documents': 'secretariat',
  'secretariat-lieux': 'secretariat',

  // Gouvernance / CA
  'ca-reunions': 'gouvernance',
  'ca-reports': 'gouvernance',
  'ca-documents': 'gouvernance',
  'ca-finances': 'gouvernance',
  'ca-prestations': 'gouvernance',

  // Studio
  'annonces-publish': 'studio',
  'studio-social': 'studio',
  'studio-lexique': 'studio',
  newsletter: 'studio',
  'studio-communication': 'studio',
  'varal-photos': 'studio',

  // Pédagogie
  'varal-manager': 'pedagogie',
  'mestre-pedagogy-qcm': 'pedagogie',
  'mestre-pedagogy-dashboard': 'pedagogie',

  // Mestria
  'mestre-repertoire': 'mestre',
  'mestre-categories': 'mestre',
  'mestre-orientation': 'mestre',
  'mestre-events': 'mestre',
  'mestre-stage-layout': 'mestre',
  'mestre-sequenceur': 'mestre',
  'mestre-mot-mestre': 'mestre'
};

/**
 * Mots-clés d'étiquettes/badges autorisant les pôles d'administration par défaut.
 */
export const POLE_ALLOWED_KEYWORDS = {
  diffusion: ['diffusion', 'booking', 'communication', 'admin', 'bureau', 'direction'],
  tresorerie: ['trésorier', 'trésorière', 'trésorerie', 'comptable', 'finance', 'admin', 'bureau', 'direction', 'président', 'présidente'],
  secretariat: ['secrétaire', 'secretaire', 'secrétariat', 'secretariat', 'bureau', 'direction', 'admin'],
  gouvernance: ['gouvernance', 'ca', 'conseil', 'bureau', 'direction', 'admin'],
  logistique: ['logistique', 'matériel', 'inventaire', 'instruments', 'commandes', 'trésorier', 'trésorière', 'admin', 'bureau', 'direction'],
  lutherie: ['lutherie', 'atelier', 'artisan', 'fabrication', 'matériel', 'admin', 'bureau', 'direction', 'logistique'],
  costumerie: ['costume', 'costumes', 'costumière', 'couture', 'couturier', 'tailleur', 'habillage', 'vestiaire', 'admin', 'bureau', 'direction'],
  studio: ['studio', 'communication', 'porte-voix', 'newsletter', 'admin', 'bureau', 'direction'],
  mestre: ['mestre', 'mestria', 'direction', 'artistique', 'scène', 'scene', 'chef de pupitre'],
  vitrine: ['vitrine', 'communication', 'webmaster', 'admin', 'bureau'],
  pedagogie: ['mestre', 'pédagogie', 'direction'],
  config: ['config', 'sécurité', 'secrétaire', 'admin', 'bureau', 'direction']
};

/**
 * Vérifie si l'utilisateur possède les droits d'accès à un Pôle d'Administration spécifié.
 * En Mode Normal (breakGlassActive === false), aucun accès automatique n'est accordé à isSystemAdmin ou super-admin.
 *
 * @param {string} poleId Identifiant du pôle ('tresorerie', 'logistique', 'studio', 'diffusion', 'config', etc.)
 * @param {Object} profileData Profil de l'utilisateur (role, isSystemAdmin, tags)
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Étiquettes effectives
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'accès au pôle est déverrouillé pour ce membre
 */
export function canAccessPole(poleId, profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  // Pôles publics Espace Membre : toujours déverrouillés
  if (poleId === 'accueil' || poleId === 'mon-espace') return true;

  // Mode Intervention (Break-Glass) : Passe-partout technique complet pour le Super-Admin
  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  // Rôle Administrateur ou Bureau de l'association, ou Fondateur (ignoré en simulation)
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'admin' ||
    systemRole === 'bureau' ||
    (!profileData.isSimulated && (
      profileData.uid === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' ||
      profileData.id === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1'
    ))
  ) {
    return true;
  }

  // Traitement spécifique Mestria
  if (poleId === 'mestre') {
    return canAccessMestre(profileData, permissionsMatrice, effectiveUserTags, breakGlassActive);
  }

  // En Mode Normal, les étiquettes effectives sont filtrées pour exclure tout tag 'super-admin'
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  // 1. Matrice des permissions Firestore de l'association (clé globale du pôle)
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const poleTags = permissionsMatrice[poleId];
    if (Array.isArray(poleTags) && poleTags.length > 0) {
      const formattedPoleTags = poleTags.map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomF || t.nomM || '').toLowerCase()));
      if (userTagsList.some(ut => formattedPoleTags.includes(ut))) {
        return true;
      }
      return false;
    }
  }

  // 2. Badges / Étiquettes autorisées par mots-clés par défaut (fallback si aucune matrice)
  const allowedKeywords = POLE_ALLOWED_KEYWORDS[poleId] || [];
  if (allowedKeywords.length > 0 && userTagsList.some(ut => allowedKeywords.some(kw => matchesAllowedKeyword(ut, kw)))) {
    return true;
  }

  return false;
}

/**
 * Vérifie si l'utilisateur possède les droits d'accès à un Onglet / Sous-Menu d'administration spécifique.
 * 
 * @param {string} tabId Identifiant de l'onglet (ex: 'gigs-pipeline', 'cotisations', 'inventory', etc.)
 * @param {string|Object} poleIdOrProfile Identifiant du pôle parent ou directement le profil utilisateur
 * @param {Object|null} profileDataArg Profil de l'utilisateur (si poleId passé en 2e arg) ou matrice de permissions
 * @param {Object|Array|null} permissionsMatriceArg Matrice des permissions ou tags effectifs
 * @param {Array|boolean} effectiveUserTagsArg Étiquettes effectives ou drapeau breakGlassActive
 * @param {boolean} breakGlassActiveArg Mode intervention d'urgence actif
 * @returns {boolean} true si l'accès à l'onglet est autorisé
 */
export function canAccessTabPermission(tabId, poleIdOrProfile, profileDataArg = null, permissionsMatriceArg = null, effectiveUserTagsArg = [], breakGlassActiveArg = false) {
  let poleId = poleIdOrProfile;
  let profileData = profileDataArg;
  let permissionsMatrice = permissionsMatriceArg;
  let effectiveUserTags = effectiveUserTagsArg;
  let breakGlassActive = breakGlassActiveArg;

  // Surcharge : si le 2e argument est un objet profil (poleId omis par l'appelant)
  if (poleIdOrProfile && typeof poleIdOrProfile === 'object' && !Array.isArray(poleIdOrProfile)) {
    profileData = poleIdOrProfile;
    permissionsMatrice = profileDataArg;
    effectiveUserTags = Array.isArray(permissionsMatriceArg) ? permissionsMatriceArg : (profileData?.tags || []);
    breakGlassActive = Boolean(effectiveUserTagsArg);
    poleId = TAB_TO_POLE_MAP[tabId] || null;
  }

  if (!profileData) return false;

  // Onglets publics Espace Membre : toujours autorisés
  if (['profil', 'agenda', 'atelier', 'materiel', 'vestiaire', 'trombinoscope', 'forum', 'dashboard', 'varal', 'repertoire'].includes(tabId)) {
    return true;
  }

  // Mode Intervention (Break-Glass) : Passe-partout complet pour Super-Admin
  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  // Rôle Administrateur ou Bureau de l'association, ou Fondateur (ignoré en simulation)
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'admin' ||
    systemRole === 'bureau' ||
    (!profileData.isSimulated && (
      profileData.uid === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' ||
      profileData.id === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1'
    ))
  ) {
    return true;
  }

  // Si c'est le pôle mestre ou un onglet de direction artistique, vérifier canAccessMestre
  if (poleId === 'mestre' || tabId.startsWith('mestre-')) {
    if (canAccessMestre(profileData, permissionsMatrice, effectiveUserTags, breakGlassActive)) {
      return true;
    }
  }

  // Si c'est le pôle gouvernance ou un sous-onglet délibératif du CA
  if (poleId === 'gouvernance' || tabId.startsWith('ca-')) {
    if (canAccessPole('gouvernance', profileData, permissionsMatrice, effectiveUserTags, breakGlassActive)) {
      return true;
    }
  }

  // 1. Si l'utilisateur possède les droits d'administration globaux sur le pôle parent, accorder l'accès
  if (poleId && canAccessPole(poleId, profileData, permissionsMatrice, effectiveUserTags, breakGlassActive)) {
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
      )
        .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
        .filter(t => t !== 'super-admin' && t !== 'superadmin');

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
 *
 * @param {Object} profileData Profil de l'utilisateur
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si le membre est modérateur ou administrateur
 */
export function isUserModeratorOrAdmin(profileData, breakGlassActive = false) {
  if (!profileData) return false;

  // Mode Intervention : Super-Admin dispose des droits de modération technique
  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  const role = (profileData.role || '').toLowerCase();
  if (role === 'bureau' || role === 'admin' || role === 'mestre') {
    return true;
  }

  const rawTags = Array.isArray(profileData.tags) ? profileData.tags : [];
  const tagStrings = rawTags
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

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
    'trésorier',
    'trésorière',
    'secrétaire',
    'admin',
    'administrateur',
    'administratrice'
  ];

  return tagStrings.some(t => MODERATION_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw)));
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
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si le membre est autorisé
 */
export function checkUserAccessToList(allowedList = ['all'], userRole = 'membre', userTags = [], tagsAvailable = [], breakGlassActive = false) {
  // Mode intervention (Break-Glass) : déverrouillage pour super-admin
  if (breakGlassActive && (userRole === 'super-admin' || userRole === 'admin')) {
    return true;
  }

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
      if (lower !== 'super-admin' && lower !== 'superadmin') {
        allUserTagVariants.add(lower);
        allUserTagVariants.add(lower.replace(/[.\-_]/g, '').trim());
      }
    }
    if (typeof t === 'object') {
      if (t.id) {
        const idLower = String(t.id).toLowerCase().trim();
        if (idLower !== 'super-admin' && idLower !== 'superadmin') {
          allUserTagVariants.add(idLower);
          allUserTagVariants.add(idLower.replace(/[.\-_]/g, '').trim());
        }
      }
      if (t.nomM && !String(t.nomM).toLowerCase().includes('super-admin') && !String(t.nomM).toLowerCase().includes('superadmin')) {
        allUserTagVariants.add(String(t.nomM).toLowerCase().trim());
      }
      if (t.nomF && !String(t.nomF).toLowerCase().includes('super-admin') && !String(t.nomF).toLowerCase().includes('superadmin')) {
        allUserTagVariants.add(String(t.nomF).toLowerCase().trim());
      }
      if (t.name && !String(t.name).toLowerCase().includes('super-admin') && !String(t.name).toLowerCase().includes('superadmin')) {
        allUserTagVariants.add(String(t.name).toLowerCase().trim());
      }
    }

    // Résolution via tagsAvailable (nomM, nomF, id, inheritsFrom)
    const tagObj = findTagObject(t, tagsAvailable);
    if (tagObj && typeof tagObj === 'object') {
      if (tagObj.id) {
        const idLower = String(tagObj.id).toLowerCase().trim();
        if (idLower !== 'super-admin' && idLower !== 'superadmin') {
          allUserTagVariants.add(idLower);
          allUserTagVariants.add(idLower.replace(/[.\-_]/g, '').trim());
        }
      }
      if (tagObj.nomM && !String(tagObj.nomM).toLowerCase().includes('super-admin') && !String(tagObj.nomM).toLowerCase().includes('superadmin')) {
        allUserTagVariants.add(String(tagObj.nomM).toLowerCase().trim());
      }
      if (tagObj.nomF && !String(tagObj.nomF).toLowerCase().includes('super-admin') && !String(tagObj.nomF).toLowerCase().includes('superadmin')) {
        allUserTagVariants.add(String(tagObj.nomF).toLowerCase().trim());
      }
      if (tagObj.name && !String(tagObj.name).toLowerCase().includes('super-admin') && !String(tagObj.name).toLowerCase().includes('superadmin')) {
        allUserTagVariants.add(String(tagObj.name).toLowerCase().trim());
      }
      if (Array.isArray(tagObj.inheritsFrom)) {
        tagObj.inheritsFrom.forEach(p => {
          const pId = getTagId(p);
          if (pId) {
            const pLower = String(pId).toLowerCase().trim();
            if (pLower !== 'super-admin' && pLower !== 'superadmin') {
              allUserTagVariants.add(pLower);
              allUserTagVariants.add(pLower.replace(/[.\-_]/g, '').trim());
            }
          }
        });
      }
    }
  });

  const tagVariantsArray = Array.from(allUserTagVariants);

  // Mots-clés stricts du Bureau (exécutif restreint) : NE JAMAIS INCLURE 'ca' !
  const BUREAU_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'trésorier', 'trésorière', 'secrétaire'];
  const hasBureauTag = tagVariantsArray.some(t => BUREAU_KEYWORDS.some(kw => matchesAllowedKeyword(t, kw))) || cleanRole === 'bureau';

  // Rôles et étiquettes du Conseil d'Administration (CA) :
  // Le CA comprend les membres du Bureau et les membres élus du CA (badges 'CA', 'C.A.', 'Conseil d'administration', rôle 'ca').
  const isCaRole = cleanRole === 'ca';
  const hasCaTag = isCaRole || hasBureauTag || tagVariantsArray.some(t => {
    return t === 'ca' ||
      t.startsWith('ca ') ||
      t.endsWith(' ca') ||
      t.includes('conseil');
  });

  // 1. Règle pour le salon 'Bureau' :
  // Seuls les membres possédant un badge ou rôle du Bureau sont autorisés.
  // Les membres du CA non-membres du bureau en sont strictement exclus.
  const isBureauChannel = allowedList.some(r => {
    const s = String(r).toLowerCase().trim();
    return s === 'bureau' || s.endsWith('_bureau') || s.startsWith('bureau ') || s.startsWith('bureau -') || s.startsWith('bureau :');
  });
  if (isBureauChannel) {
    return hasBureauTag;
  }

  // 2. Règle pour le salon 'CA' :
  // Accessible aux membres du CA et aux membres du Bureau.
  const isCaChannel = allowedList.some(r => {
    const s = String(r).toLowerCase().trim();
    return s === 'ca' || s.endsWith('_ca') || s === 'c.a.' || s.startsWith('ca ') || s.startsWith('ca -') || s.startsWith('ca :') || s.startsWith('c.a. ') || s.includes('conseil');
  });
  if (isCaChannel) {
    return hasCaTag;
  }

  // Assimilation des variantes de rôles adhérent / élève au rôle 'membre'
  const isMemberRole = ['membre', 'adherent', 'adhérent', 'adherente', 'adhérente', 'eleve', 'élève', 'batuqueiro'].includes(cleanRole);

  // 3. Correspondance directe de rôle système (en mode normal, super-admin n'accorde pas d'accès automatique)
  if (cleanRole !== 'super-admin' && cleanRole !== 'superadmin') {
    if (allowedList.some(r => {
      const target = String(r).toLowerCase().trim();
      if (target === cleanRole) return true;
      if (target === 'membre' && isMemberRole) return true;
      return false;
    })) {
      return true;
    }
  }

  // 4. Vérification générique pour les autres salons (pupitres, groupes de travail...)
  return allowedList.some(allowedItem => {
    const targetLower = String(allowedItem).toLowerCase().trim();
    if (targetLower === 'admin') {
      return tagVariantsArray.some(t => matchesAllowedKeyword(t, 'admin'));
    }
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
  if (breakGlassActive && isSuperAdminProfile(profileData)) return true;

  // L'utilisateur doit obligatoirement avoir accès en lecture au salon pour pouvoir y écrire
  if (!canUserReadForumChannel(channel, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive)) {
    return false;
  }

  const isModOrAdmin = isUserModeratorOrAdmin(profileData, breakGlassActive);

  // Si le salon est réservé en lecture seule pour les membres, seuls les modérateurs/bureau peuvent écrire
  if (channel.readOnlyForMembers === true) {
    return isModOrAdmin;
  }

  const userRole = profileData?.role || 'membre';
  const userTags = (effectiveUserTags && effectiveUserTags.length > 0)
    ? effectiveUserTags
    : (profileData?.tags || []);

  const writeList = channel.writeRoles || channel.allowedRoles || ['all'];
  return checkUserAccessToList(writeList, userRole, userTags, tagsDisponibles, breakGlassActive);
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
  if (breakGlassActive && isSuperAdminProfile(profileData)) return true;

  const channelNameLower = (channel.name || '').toLowerCase().trim();
  const channelIdLower = (channel.id || '').toLowerCase().trim();

  const userRole = profileData?.role || 'membre';
  const userTags = (effectiveUserTags && effectiveUserTags.length > 0)
    ? effectiveUserTags
    : (profileData?.tags || []);

  // Sécurité absolue pour le salon Bureau : strictement restreint aux membres du Bureau
  const isBureau = channelNameLower === 'bureau' || 
                   channelNameLower === '#bureau' ||
                   channelNameLower.startsWith('bureau ') || 
                   channelNameLower.startsWith('bureau -') || 
                   channelNameLower.startsWith('bureau :') || 
                   channelIdLower.endsWith('_bureau') || 
                   channelIdLower === 'bureau';

  if (isBureau) {
    return checkUserAccessToList(['bureau'], userRole, userTags, tagsDisponibles, breakGlassActive);
  }

  // Sécurité pour le salon CA : restreint aux membres du CA et du Bureau
  // Seuls les salons explicitement nommés CA / C.A. / Conseil d'administration sont réservés.
  // Les salons publics commençant par 'ca' comme Carnaval, Covoiturage, Calendrier ne doivent JAMAIS être bloqués !
  const isCa = channelNameLower === 'ca' || 
               channelNameLower === '#ca' ||
               channelNameLower === 'c.a.' ||
               channelNameLower === 'conseil d\'administration' ||
               channelNameLower.startsWith('ca ') || 
               channelNameLower.startsWith('ca -') || 
               channelNameLower.startsWith('ca :') || 
               channelNameLower.startsWith('c.a. ') || 
               channelIdLower.endsWith('_ca') || 
               channelIdLower === 'ca';

  if (isCa) {
    return checkUserAccessToList(['ca'], userRole, userTags, tagsDisponibles, breakGlassActive);
  }

  if (channel.isTransparent === true) return true;

  const readList = channel.readRoles || channel.allowedRoles || channel.allowedTags || ['all'];
  if (!readList || readList.length === 0 || readList.includes('all')) return true;

  return checkUserAccessToList(readList, userRole, userTags, tagsDisponibles, breakGlassActive);
}

/**
 * Vérifie si l'utilisateur possède les droits de validation et de contrôle d'atelier (Pôle Lutherie).
 * Permet de valider les étapes d'usinage sur l'établi ou de demander une retouche.
 *
 * @param {Object} profileData Profil de l'utilisateur (role, isSystemAdmin, tags)
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Liste des étiquettes effectives du membre
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si l'utilisateur est autorisé à valider les étapes d'atelier
 */
export function canValidateWorkshop(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  const systemRole = (profileData.role || '').toLowerCase();
  if (systemRole === 'mestre' || systemRole === 'admin') {
    return true;
  }

  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase() : (t.id || t.nomM || t.nomF || '').toLowerCase()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const configuredTags = (permissionsMatrice.canValidateWorkshopSteps || []).map(t =>
      (typeof t === 'string' ? t.toLowerCase().trim() : (t.id || t.nomM || t.nomF || '').toLowerCase().trim())
    );

    if (configuredTags.length > 0) {
      return userTagsList.some(ut => configuredTags.includes(ut));
    }
  }

  const DEFAULT_WORKSHOP_KEYWORDS = [
    "maître d'atelier",
    "maitre d'atelier",
    "luthier",
    "référent lutherie",
    "referent lutherie",
    "artisan"
  ];

  return userTagsList.some(ut => DEFAULT_WORKSHOP_KEYWORDS.some(kw => matchesAllowedKeyword(ut, kw)));
}

/**
 * Vérifie si l'utilisateur possède les droits de rédaction et de publication pour le Mégaphone (Annonces).
 *
 * @param {Object} profileData Profil de l'utilisateur
 * @param {Object} permissionsMatrice Matrice des permissions de l'association
 * @param {Array} effectiveUserTags Liste effective des étiquettes du membre
 * @param {boolean} breakGlassActive Mode intervention d'urgence actif
 * @returns {boolean} true si le membre peut publier des annonces
 */
export function canPublishAnnonces(profileData, permissionsMatrice = null, effectiveUserTags = [], breakGlassActive = false) {
  if (!profileData) return false;

  // 1. Mode Intervention (Break-Glass) : Passe-partout complet pour Super-Admin
  if (breakGlassActive && isSuperAdminProfile(profileData)) {
    return true;
  }

  // 2. Administrateur système technique
  if (profileData.isSystemAdmin === true) {
    return true;
  }

  // 3. Rôles directeurs par défaut (Mestre, Super-Admin, Admin ou Bureau, ignoré pour fondateur en simulation)
  const systemRole = (profileData.role || '').toLowerCase();
  if (
    systemRole === 'mestre' ||
    systemRole === 'super-admin' ||
    systemRole === 'admin' ||
    systemRole === 'bureau' ||
    (!profileData.isSimulated && (
      profileData.uid === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' ||
      profileData.id === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1'
    ))
  ) {
    return true;
  }

  // 4. Liste des étiquettes effectives de l'utilisateur
  const userTagsList = (
    effectiveUserTags && effectiveUserTags.length > 0
      ? effectiveUserTags
      : profileData.tags || []
  )
    .map(t => (typeof t === 'string' ? t.toLowerCase().trim() : (t.id || t.nomM || t.nomF || '').toLowerCase().trim()))
    .filter(t => t !== 'super-admin' && t !== 'superadmin');

  // 5. Vérification dans la matrice des permissions configurées par l'association
  if (permissionsMatrice && typeof permissionsMatrice === 'object') {
    const configuredTags = (
      permissionsMatrice['annonces-publish'] ||
      permissionsMatrice['annonces'] ||
      []
    ).map(t =>
      (typeof t === 'string' ? t.toLowerCase().trim() : (t.id || t.nomM || t.nomF || '').toLowerCase().trim())
    );

    if (configuredTags.length > 0) {
      if (userTagsList.some(ut => configuredTags.includes(ut))) {
        return true;
      }
    }
  }

  return false;
}
