import { isProjectRopeActive } from './commissionVaralAdapter';

/**
 * Filtre les cordes du Varal en masquant par défaut les cordes vides ou désactivées
 * pour tous les profils (y compris Admin/Mestre), tout en retournant le compteur
 * de cordes masquées activables à la demande par un profil autorisé.
 */
export function filterVaralCategoriesWithHiddenToggle({
  visibleCategories = [],
  groupedDocs = {},
  allEventsMap = {},
  targetEventId = null,
  isAuthorized = false,
  showHiddenCords = false
}) {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlEventId = searchParams?.get('eventId');
  const effectiveTargetEventId =
    targetEventId ||
    searchParams?.get('ropeId')?.replace(/^projet_/, '') ||
    searchParams?.get('varalCat')?.replace(/^projet_/, '') ||
    urlEventId;

  let hiddenCordsCount = 0;

  const displayedCategories = visibleCategories.filter((category) => {
    // Règle spécifique aux cordes de projet (Passerelle Commissions ➔ Varal)
    if (category.id.startsWith('projet_')) {
      const docs = groupedDocs[category.id] || [];
      if (docs.length === 0) return false;

      const eventId = category.id.replace(/^projet_/, '');
      if (effectiveTargetEventId && (effectiveTargetEventId === eventId || effectiveTargetEventId === category.id)) {
        return true;
      }

      const ev = allEventsMap?.[eventId];
      return isProjectRopeActive({ category, docs, event: ev });
    }

    const isInactive = category.actif === false;
    const docs = groupedDocs[category.id] || [];
    const hasValidPublicUpload = Boolean(
      category.activerUploadPublic &&
      category.lienUploadPublic &&
      category.lienUploadPublic.trim() !== ''
    );
    const isEmpty = docs.length === 0 && !hasValidPublicUpload;

    if (isInactive || isEmpty) {
      hiddenCordsCount += 1;
      return Boolean(isAuthorized && showHiddenCords);
    }

    return true;
  });

  return { displayedCategories, hiddenCordsCount };
}

