/**
 * Utilitaires pour la « Fiche de la semaine » exclusive à la corde Culture du Varal.
 * Garantit une sélection hebdomadaire déterministe (chaque lundi à 00h00),
 * la priorité à l'épinglage manuel du Mestre, et un tri d'affichage 100 % non-destructif.
 */

/**
 * Calcule l'année et le numéro de semaine ISO-8601 en heure locale.
 * Le numéro de semaine bascule exactement chaque lundi à 00h00.
 *
 * @param {Date} [date=new Date()] Date de référence
 * @returns {{ isoYear: number, isoWeek: number, weekKey: string }}
 */
export function getIsoWeekYearAndNumber(date = new Date()) {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // En norme ISO-8601, la semaine commence le lundi (1..7, dimanche = 7)
  const dayNum = localDate.getDay() || 7;
  // Se caler sur le jeudi de la semaine courante pour déterminer l'année ISO
  localDate.setDate(localDate.getDate() + 4 - dayNum);
  const isoYear = localDate.getFullYear();
  const yearStart = new Date(isoYear, 0, 1);
  const isoWeek = Math.ceil((((localDate - yearStart) / 86400000) + 1) / 7);

  return {
    isoYear,
    isoWeek,
    weekKey: `${isoYear}-W${String(isoWeek).padStart(2, '0')}`
  };
}

/**
 * Résout l'identifiant de la « Fiche de la semaine » pour la corde Culture :
 * 1. Priorité à `pinnedWeeklyDocId` s'il correspond à une fiche présente sur la corde Culture.
 * 2. Sinon, rotation automatique chaque lundi à 00h00 sur la liste triée de manière stable par ID.
 * 3. Si la fiche auto-sélectionnée porte déjà le badge global `✨ NOUVEAU` (`newestDocumentId`),
 *    sélectionne la fiche Culture suivante dans la liste.
 *
 * @param {Array<Object>} cultureDocs Liste des documents de la corde Culture
 * @param {string|null} pinnedWeeklyDocId ID épinglé manuellement dans `associations/{groupId}`
 * @param {string|null} newestDocumentId ID du document portant le badge global `✨ NOUVEAU`
 * @param {Date} [now=new Date()] Date courante
 * @returns {{ weeklyCultureDocId: string|null, isWeeklyManuallyPinned: boolean }}
 */
export function resolveWeeklyCultureDocId(
  cultureDocs = [],
  pinnedWeeklyDocId = null,
  newestDocumentId = null,
  now = new Date()
) {
  const eligibleDocs = (Array.isArray(cultureDocs) ? cultureDocs : []).filter(
    (docItem) => docItem && docItem.id && !docItem.isHidden && !docItem.isArchived && !docItem.isVirtualEventMedia
  );

  if (eligibleDocs.length === 0) {
    return { weeklyCultureDocId: null, isWeeklyManuallyPinned: false };
  }

  // 1. Vérifier si une fiche Culture existante est épinglée manuellement par le Mestre / Admin
  if (pinnedWeeklyDocId && eligibleDocs.some((docItem) => docItem.id === pinnedWeeklyDocId)) {
    return { weeklyCultureDocId: pinnedWeeklyDocId, isWeeklyManuallyPinned: true };
  }

  // 2. Rotation hebdomadaire automatique déterministe (stable par ID)
  const sortedById = [...eligibleDocs].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const { isoYear, isoWeek } = getIsoWeekYearAndNumber(now);
  const weekCounter = isoYear * 53 + isoWeek;
  const baseIndex = Math.abs(weekCounter) % sortedById.length;

  let selectedDoc = sortedById[baseIndex];

  // 3. Éviter le cumul avec le badge global « ✨ NOUVEAU » en prenant la fiche suivante
  if (selectedDoc.id === newestDocumentId && sortedById.length > 1) {
    selectedDoc = sortedById[(baseIndex + 1) % sortedById.length];
  }

  return {
    weeklyCultureDocId: selectedDoc.id,
    isWeeklyManuallyPinned: false
  };
}

/**
 * Construit une copie d'affichage non-destructive des documents de la corde Culture :
 * extrait uniquement la fiche `weeklyCultureDocId` pour la placer en tête de corde
 * (en 1ère position à gauche, ou en 2ème position juste après la fiche `✨ NOUVEAU`
 * si celle-ci est en tête de la corde Culture).
 * Dès que `weeklyCultureDocId` change, l'ancienne fiche retrouve immédiatement sa place d'origine.
 *
 * @param {Array<Object>} docList Liste triée d'origine de la corde Culture
 * @param {string|null} weeklyCultureDocId ID de la Fiche de la semaine
 * @param {string|null} newestDocumentId ID du document `✨ NOUVEAU`
 * @returns {Array<Object>} Copie ordonnée pour l'affichage uniquement
 */
export function buildCultureDisplayList(docList = [], weeklyCultureDocId = null, newestDocumentId = null) {
  if (!Array.isArray(docList) || docList.length <= 1 || !weeklyCultureDocId) {
    return docList;
  }

  const weeklyIndex = docList.findIndex((docItem) => docItem && docItem.id === weeklyCultureDocId);
  if (weeklyIndex === -1) {
    return docList;
  }

  const weeklyDoc = docList[weeklyIndex];
  const remainingDocs = docList.filter((_, index) => index !== weeklyIndex);

  // Si la fiche « ✨ NOUVEAU » est en tête de la corde Culture, placer la Fiche de la semaine juste après (2ème position)
  if (newestDocumentId && remainingDocs[0]?.id === newestDocumentId) {
    return [remainingDocs[0], weeklyDoc, ...remainingDocs.slice(1)];
  }

  // Sinon, placer la Fiche de la semaine en 1ère position à gauche
  return [weeklyDoc, ...remainingDocs];
}

