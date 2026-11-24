import { matchesAllowedKeyword, canAccessPole } from './permissionUtils';

/**
 * Détermine si l'utilisateur courant dispose du statut Gestionnaire / Mestre
 * sur le pôle ou l'onglet actif pour commuter automatiquement la Double Vue de `InfoPoleBanner`.
 */
export function computeIsUserPoleManager({
  isManager,
  isSystemOrSuperAdminOrMestre = false,
  activeProfile,
  activeUserTags = [],
  effectiveKey = '',
  currentTab = '',
  currentPole = '',
  permissionsMatrice
}) {
  if (typeof isManager === 'boolean') return isManager;
  if (isSystemOrSuperAdminOrMestre) return true;
  if (!activeProfile) return false;
  if (activeProfile.isSystemAdmin === true && !activeProfile.isSimulated) return true;

  const role = String(activeProfile.role || '').toLowerCase();
  if (['super-admin', 'mestre', 'admin', 'bureau'].includes(role)) return true;

  const normalizeTags = (arr) =>
    (arr || [])
      .map((tag) => (typeof tag === 'string' ? tag.toLowerCase() : String(tag?.id || tag?.nomM || tag?.nomF || '').toLowerCase()))
      .filter((tag) => tag && tag !== 'super-admin' && tag !== 'superadmin');

  const tagsList = normalizeTags(activeUserTags);
  const hasKeyword = (keywords) => tagsList.some((tag) => keywords.some((kw) => matchesAllowedKeyword(tag, kw)));
  const hasMatrixAccess = (matrixKeys) => {
    if (!permissionsMatrice || typeof permissionsMatrice !== 'object') return false;
    const allowed = normalizeTags(matrixKeys.flatMap((k) => permissionsMatrice[k] || []));
    return tagsList.some((tag) => allowed.includes(tag));
  };

  if (hasKeyword(['bureau', 'président', 'présidente', 'présidence', 'admin', 'direction', 'ca'])) {
    return true;
  }

  if (effectiveKey === 'agenda' || currentTab === 'agenda' || currentPole === 'agenda' || currentTab === 'studio-events') {
    if (hasKeyword(['secrétaire', 'secretaire', 'secretariat', 'secrétariat', 'logistique', 'mestre', 'bureau', 'direction', 'admin', 'ca'])) return true;
    if (hasMatrixAccess(['agenda', 'studio-events'])) return true;
  }

  if (
    ['pedagogie', 'repertoire', 'mestre-repertoire', 'mestre-pedagogy-qcm', 'mestre-pedagogy-dashboard', 'varal-manager'].includes(effectiveKey) ||
    ['pedagogie', 'repertoire'].includes(currentTab) ||
    ['pedagogie', 'mestre'].includes(currentPole)
  ) {
    if (hasKeyword(['mestre', 'mestria', 'direction', 'artistique', 'formateur', 'formatrice', 'pédagogie', 'pedagogie', 'chef de pupitre', 'admin', 'bureau'])) return true;
    if (hasMatrixAccess(['pedagogie', 'mestre', 'mestre-repertoire'])) return true;
  }

  if (effectiveKey === 'forum' || currentTab === 'forum' || currentPole === 'forum') {
    if (hasKeyword(['modérateur', 'modératrice', 'moderateur', 'moderatrice', 'modération', 'moderation', 'bureau', 'direction', 'admin', 'ca', 'conseil'])) return true;
    if (hasMatrixAccess(['forum', 'moderation'])) return true;
  }

  if (effectiveKey === 'tresorerie' || currentTab === 'tresorerie' || currentPole === 'tresorerie') {
    if (hasKeyword(['trésorier', 'trésorière', 'tresorier', 'tresoriere', 'trésorerie', 'tresorerie', 'comptable', 'comptabilité', 'finance', 'finances', 'bureau', 'direction', 'admin', 'président', 'présidente'])) return true;
    if (hasMatrixAccess(['tresorerie', 'treasury'])) return true;
  }

  if (effectiveKey === 'secretariat' || currentTab === 'secretariat' || currentPole === 'secretariat') {
    if (hasKeyword(['secrétaire', 'secretaire', 'secretariat', 'secrétariat', 'bureau', 'direction', 'admin', 'ca', 'conseil'])) return true;
    if (hasMatrixAccess(['secretariat'])) return true;
  }

  if (
    ['studio', 'studio-social', 'newsletter', 'varal-photos', 'studio-communication', 'studio-lexique'].includes(effectiveKey) ||
    ['studio', 'studio-social', 'newsletter', 'varal-photos', 'studio-communication', 'studio-lexique'].includes(currentTab) ||
    currentPole === 'studio'
  ) {
    if (hasKeyword(['communication', 'com', 'presse', 'webmaster', 'médias', 'medias', 'photo', 'bureau', 'direction', 'admin'])) return true;
    if (hasMatrixAccess(['studio', 'communication'])) return true;
  }

  if (currentPole && currentPole !== 'mon-espace' && currentPole !== 'accueil') {
    return canAccessPole(currentPole, activeProfile, permissionsMatrice, tagsList);
  }

  return false;
}
