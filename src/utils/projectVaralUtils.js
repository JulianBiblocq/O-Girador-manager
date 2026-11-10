import { isMemberCaOrBureau } from './memberUtils.js';

/**
 * Utilitaires dédiés aux cordes dynamiques de Projet (`projet_${eventId}`) sur le Varal.
 * Gère les permissions de dépôt/édition (Admin, Mestre, Bureau/CA, Référents, Auteur)
 * ainsi que le tri prioritaire en tête de corde (`isPinnedFirst` / `projet_presentation`).
 */

/**
 * Vérifie si une catégorie ou son identifiant correspond à une corde de projet.
 */
export function isProjectRopeCategory(categoryOrId) {
  if (!categoryOrId) return false;
  if (typeof categoryOrId === 'string') return categoryOrId.startsWith('projet_');
  const id = String(categoryOrId.id || categoryOrId.nom || '');
  return id.startsWith('projet_') || Boolean(categoryOrId.isProjectRope);
}

/**
 * Vérifie si un document est un livret éditorial de présentation globale du projet.
 */
export function isProjectPresentationDoc(docItem) {
  if (!docItem) return false;
  return docItem.type === 'projet_presentation' || docItem.typeDoc === 'projet_presentation';
}

/**
 * Vérifie si un document doit être épinglé tout à gauche de la corde projet.
 */
export function isPinnedFirstOnProjectRope(docItem) {
  if (!docItem) return false;
  if (docItem.isPinnedFirst === true) return true;
  if (isProjectPresentationDoc(docItem) && docItem.isPinnedFirst !== false) return true;
  return false;
}

/**
 * Trie les documents d'une corde projet :
 * 1. Livrets épinglés en tête (`isPinnedFirst === true` ou `type === 'projet_presentation'` non désépinglé)
 * 2. Livrets de commissions (`type === 'cordel_commission'`)
 * 3. Documents PDF/Photos et Albums Cloud annexes
 */
export function sortProjectRopeDocuments(docs = []) {
  if (!Array.isArray(docs) || docs.length <= 1) return docs || [];

  const getPriorityRank = (item) => {
    if (isPinnedFirstOnProjectRope(item)) return 0;
    if (item?.type === 'cordel_commission' || item?.typeDoc === 'cordel_commission') return 1;
    return 2;
  };

  return [...docs].sort((a, b) => {
    const rankA = getPriorityRank(a);
    const rankB = getPriorityRank(b);
    if (rankA !== rankB) return rankA - rankB;

    if (a?.order !== undefined && b?.order !== undefined && a.order !== b.order) {
      return a.order - b.order;
    }
    return 0;
  });
}

/**
 * Détermine si l'utilisateur courant a le droit de déposer un document sur une corde `projet_${eventId}`.
 * Autorisé pour : Admin, Mestre, Super-Admin, membre du Bureau/CA, ou référent d'au moins une commission de l'événement.
 */
export function canUserDepositOnProjectRope({
  categoryId = '',
  isAuthorized = false,
  canAccessCa = false,
  role = '',
  isSystemAdmin = false,
  profileData = null,
  userTags = [],
  user = null,
  docsOnRope = null,
  projectDocs = null,
  event = null,
  allEventsMap = null,
  eventReferentsIds = []
} = {}) {
  if (isAuthorized || canAccessCa || isSystemAdmin) return true;

  const cleanRole = String(role || profileData?.role || '').toLowerCase().trim();
  if (['admin', 'mestre', 'super-admin', 'bureau', 'ca', 'president', 'tresorier', 'secretaire'].includes(cleanRole)) {
    return true;
  }
  if (isMemberCaOrBureau(profileData, userTags)) return true;

  const effectiveDocs = Array.isArray(docsOnRope) ? docsOnRope : (Array.isArray(projectDocs) ? projectDocs : []);
  const eventId = String(categoryId || '').replace(/^projet_/, '');
  const effectiveEvent = event || (eventId && allEventsMap ? allEventsMap[eventId] : null);

  const uid = user?.uid || profileData?.uid || profileData?.id || null;
  const fullName = (
    [profileData?.prenom, profileData?.nom].filter(Boolean).join(' ').trim() ||
    profileData?.displayName ||
    user?.displayName ||
    ''
  ).toLowerCase().trim();

  if (uid) {
    if (Array.isArray(eventReferentsIds) && eventReferentsIds.includes(uid)) return true;
    if (Array.isArray(effectiveEvent?.referentsIds) && effectiveEvent.referentsIds.includes(uid)) return true;
    if (
      Array.isArray(effectiveEvent?.commissions) &&
      effectiveEvent.commissions.some((c) => {
        if ((c?.referentsIds || []).includes(uid)) return true;
        return (c?.referents || []).some((r) => (typeof r === 'string' ? r === uid : (r?.uid === uid || r?.id === uid)));
      })
    ) {
      return true;
    }
    if (
      effectiveDocs.some((d) => {
        const refs = d?.referentsIds || d?.commissionData?.referentsIds || [];
        return Array.isArray(refs) && refs.includes(uid);
      })
    ) {
      return true;
    }
  }

  if (fullName) {
    const isNamedReferent = effectiveDocs.some(
      (d) =>
        (d?.type === 'cordel_commission' || d?.typeDoc === 'cordel_commission') &&
        typeof d?.auteur === 'string' &&
        d.auteur.toLowerCase().includes(fullName)
    );
    if (isNamedReferent) return true;
  }

  return false;
}

/**
 * Détermine si l'utilisateur peut modifier (crayon) ou supprimer (corbeille) un document manuel
 * sur une corde `projet_${eventId}` (Auteur du document, Bureau/CA, Mestre ou Admin).
 */
export function canUserManageProjectDoc({
  docItem,
  category,
  role = '',
  isAuthorized = false,
  canAccessCa = false,
  profileData = null,
  userTags = [],
  user = null
} = {}) {
  if (!docItem) return false;

  const isProjectCat = isProjectRopeCategory(category) || isProjectRopeCategory(docItem.categoryId || docItem.categorie);
  if (!isProjectCat) return Boolean(isAuthorized || canAccessCa);

  const cleanRole = String(role || profileData?.role || '').toLowerCase().trim();
  const isAdminOrBureau =
    isAuthorized ||
    canAccessCa ||
    ['admin', 'mestre', 'super-admin', 'bureau', 'ca', 'president', 'tresorier', 'secretaire'].includes(cleanRole) ||
    isMemberCaOrBureau(profileData, userTags);

  if (isAdminOrBureau) return true;

  // Les livrets automatiques de commissions ne sont pas modifiables librement par un simple auteur hors Bureau
  if (docItem.type === 'cordel_commission' || docItem.typeDoc === 'cordel_commission') return false;

  const uid = user?.uid || profileData?.uid || profileData?.id || null;
  if (uid && (docItem.authorId === uid || docItem.createdBy === uid || docItem.auteurId === uid)) {
    return true;
  }

  const fullName = (
    [profileData?.prenom, profileData?.nom].filter(Boolean).join(' ').trim() ||
    profileData?.displayName ||
    user?.displayName ||
    ''
  ).toLowerCase().trim();

  if (fullName && typeof docItem.auteur === 'string' && docItem.auteur.toLowerCase().trim() === fullName) {
    return true;
  }

  return false;
}
