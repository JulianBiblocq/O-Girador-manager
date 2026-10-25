/**
 * announcementUtils.js
 * 
 * Fonctions utilitaires pour le filtrage de visibilité et le ciblage des annonces / pancartes.
 * Gère le ciblage global (Tous, rôles), par étiquettes/pupitres, et nominatif (targetUserIds).
 */

/**
 * Détermine si une annonce doit être visible pour un utilisateur donné.
 *
 * Règles de visibilité :
 * 1. Si publishOnApp === false : masquée sur le tableau de bord.
 * 2. Exception Admin / Auteur : L'auteur et les administrateurs/modérateurs voient toujours l'annonce.
 * 3. Si targetUserIds contient des membres :
 *    - Si aucun rôle/tag n'est ciblé (et pas 'Tous') : visible uniquement si userId est dans targetUserIds.
 *    - Si combiné avec des étiquettes/pupitres : visible si membre possède l'étiquette OU est dans targetUserIds.
 * 4. Si aucun membre nominatif : logique standard (Tous ou correspondance avec les étiquettes/rôles).
 *
 * @param {Object} params
 * @param {Object} params.announcement - Document d'annonce
 * @param {string} params.userId - UID de l'utilisateur connecté
 * @param {Array<string>} [params.userTags] - Étiquettes de l'utilisateur
 * @param {string} [params.userRole] - Rôle de l'utilisateur ('mestre', 'admin', 'membre', etc.)
 * @param {boolean} [params.isSystemAdmin] - Vrai si super-administrateur système
 * @param {boolean} [params.canPublish] - Vrai si l'utilisateur a les droits de publication
 * @returns {boolean}
 */
export function isAnnouncementVisibleForUser({
  announcement,
  userId,
  userTags = [],
  userRole = 'membre',
  isSystemAdmin = false,
  canPublish = false
}) {
  if (!announcement) return false;

  // 1. Si non publiée sur l'application, masquer du tableau de bord
  if (announcement.publishOnApp === false) return false;

  // 2. Exception Admin / Auteur : ils voient toujours la pancarte pour pouvoir la gérer
  const isAuthor = Boolean(announcement.auteurId && userId && announcement.auteurId === userId);
  const isManager = Boolean(
    canPublish ||
    userRole === 'mestre' ||
    userRole === 'super-admin' ||
    isSystemAdmin === true
  );

  if (isAuthor || isManager) {
    return true;
  }

  // 3. Analyse des cibles
  const targetUserIds = Array.isArray(announcement.targetUserIds) ? announcement.targetUserIds : [];
  const cibles = Array.isArray(announcement.cibles) ? announcement.cibles : [];

  const hasTargetUsers = targetUserIds.length > 0;
  const isTargetUser = Boolean(userId && targetUserIds.includes(userId));

  const hasCibleTous = cibles.includes('Tous');
  const matchesTagOrRole = (
    (cibles.includes('role:admin') && (userRole === 'mestre' || userRole === 'super-admin' || isSystemAdmin === true)) ||
    cibles.some((t) => t !== 'Tous' && userTags.includes(t))
  );

  // Cas avec membres nominatifs
  if (hasTargetUsers) {
    if (hasCibleTous) return true;
    return isTargetUser || matchesTagOrRole;
  }

  // Cas sans membre nominatif (historique)
  if (cibles.length === 0 || hasCibleTous) {
    return true;
  }

  return matchesTagOrRole;
}

/**
 * Calcule l'ensemble des identifiants (UIDs) uniques des destinataires d'une annonce.
 * Dédoublonne systématiquement via Set et exclut l'auteur si spécifié.
 *
 * @param {Object} params
 * @param {Object} params.announcement - Document d'annonce
 * @param {Array<Object>} [params.allMembers] - Liste complète des membres
 * @param {string} [params.authorId] - UID de l'auteur à exclure des notifications
 * @returns {Array<string>}
 */
export function resolveTargetRecipientIds({
  announcement,
  allMembers = [],
  authorId = null
}) {
  if (!announcement) return [];

  const recipientSet = new Set();
  const targetUserIds = Array.isArray(announcement.targetUserIds) ? announcement.targetUserIds : [];
  const cibles = Array.isArray(announcement.cibles) ? announcement.cibles : [];
  const isCibleTous = cibles.includes('Tous') || (cibles.length === 0 && targetUserIds.length === 0);

  if (isCibleTous) {
    allMembers.forEach((m) => {
      if (m?.id && m.statutActuel !== 'inactive' && m.statutActuel !== 'archived') {
        recipientSet.add(m.id);
      }
    });
  } else {
    // 1. Ajouter les membres nominatifs ciblés
    targetUserIds.forEach((uid) => {
      if (uid) recipientSet.add(uid);
    });

    // 2. Ajouter les membres correspondant aux tags ou au rôle admin
    allMembers.forEach((m) => {
      if (!m?.id || m.statutActuel === 'inactive' || m.statutActuel === 'archived') return;

      const mRole = m.role || 'membre';
      const mTags = Array.isArray(m.tags) ? m.tags : [];
      const isAdmin = mRole === 'mestre' || mRole === 'super-admin' || m.isSystemAdmin === true;

      const matches = cibles.some((c) => {
        if (c === 'role:admin') return isAdmin;
        return mTags.includes(c);
      });

      if (matches) {
        recipientSet.add(m.id);
      }
    });
  }

  // Ne pas notifier l'auteur lui-même
  if (authorId) {
    recipientSet.delete(authorId);
  }

  return Array.from(recipientSet);
}

/**
 * Résout les noms complets des membres ciblés nominativement pour les infobulles et badges.
 *
 * @param {Array<string>} targetUserIds - Liste des UIDs ciblés
 * @param {Array<Object>} allMembers - Liste des membres
 * @returns {Array<string>}
 */
export function resolveTargetUserDisplayNames(targetUserIds = [], allMembers = []) {
  if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) return [];

  const memberMap = new Map();
  (allMembers || []).forEach((m) => {
    if (m?.id) memberMap.set(m.id, m);
  });

  return targetUserIds.map((uid) => {
    const member = memberMap.get(uid);
    if (!member) return 'Membre';
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim();
    return fullName || member.surnom || member.email || 'Membre';
  });
}
