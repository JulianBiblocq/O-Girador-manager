/**
 * calendarUtils.js — Utilitaires centralisés pour l'export Google Calendar et ICS.
 *
 * Résout le RangeError (Maximum call stack size exceeded) en garantissant :
 * 1. Un parsing linéaire et défensif des dates (pas de récursion mutuelle).
 * 2. Aucune sérialisation récursive d'objet DOM ou SyntheticEvent.
 * 3. Une construction d'URL propre avec encodeURIComponent.
 */

// ────────────────────────────────────────────
// 1. Parsing linéaire et sécurisé des dates
// ────────────────────────────────────────────

/**
 * Convertit de manière défensive toute valeur de date en objet Date natif.
 * Gère les cas : Timestamp Firestore, Date native, chaîne ISO, null/undefined.
 * Aucune récursion ni rebond de secours en boucle.
 *
 * @param {*} dateVal - La valeur brute (Timestamp Firestore, Date, string, etc.)
 * @returns {Date} Un objet Date valide (repli sur now si invalide)
 */
export const parseDateLinear = (dateVal) => {
  // Cas nul ou indéfini → date actuelle par défaut
  if (!dateVal) return new Date();

  // Cas Timestamp Firestore (possède la méthode .toDate())
  if (typeof dateVal?.toDate === 'function') {
    const converted = dateVal.toDate();
    return isNaN(converted.getTime()) ? new Date() : converted;
  }

  // Cas Date native déjà instanciée
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  }

  // Cas chaîne de caractères ou nombre (timestamp epoch)
  if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  // Repli ultime pour tout type non reconnu
  return new Date();
};

// ────────────────────────────────────────────
// 2. Formatage UTC ISO 8601 pour Google Calendar
// ────────────────────────────────────────────

/**
 * Formate une date en chaîne UTC compacte attendue par Google Calendar.
 * Résultat de la forme : 20261015T140000Z
 *
 * @param {*} dateVal - Toute valeur de date acceptée par parseDateLinear
 * @returns {string} Chaîne ISO 8601 compacte (ex: "20261015T140000Z")
 */
export const formatGoogleCalendarDate = (dateVal) => {
  const d = parseDateLinear(dateVal);
  // Supprime les tirets, les deux-points et les millisecondes de l'ISO string
  return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
};

// ────────────────────────────────────────────
// 3. Construction propre de l'URL Google Calendar
// ────────────────────────────────────────────

/**
 * Construit l'URL complète d'ajout d'un événement à Google Calendar.
 * Chaque paramètre est échappé individuellement via encodeURIComponent.
 * Aucune sérialisation JSON ni copie profonde récursive de l'objet événement.
 *
 * @param {Object} eventData - Objet métier de l'événement (PAS un SyntheticEvent React)
 * @param {Object} [options] - Options supplémentaires
 * @param {string} [options.titlePrefix] - Préfixe à ajouter au titre (ex: "Bénévolat : ")
 * @param {string} [options.customDetails] - Description personnalisée (remplace celle de l'événement)
 * @param {number} [options.defaultDurationMs] - Durée par défaut en ms si pas de date de fin (défaut : 2h)
 * @returns {string} URL complète pour Google Calendar
 */
export const buildGoogleCalendarUrl = (eventData, options = {}) => {
  const {
    titlePrefix = '',
    customDetails = null,
    defaultDurationMs = 2 * 60 * 60 * 1000, // 2 heures par défaut
  } = options;

  // Résolution des dates de début et de fin
  const startRaw = eventData.dateDebut || eventData.date;
  const startDate = parseDateLinear(startRaw);

  let endDate;
  if (eventData.dateFin) {
    const parsedEnd = parseDateLinear(eventData.dateFin);
    // Vérification que la date de fin est postérieure au début
    endDate = parsedEnd.getTime() > startDate.getTime()
      ? parsedEnd
      : new Date(startDate.getTime() + defaultDurationMs);
  } else {
    endDate = new Date(startDate.getTime() + defaultDurationMs);
  }

  // Formatage des dates en UTC compacte
  const start = formatGoogleCalendarDate(startDate);
  const end = formatGoogleCalendarDate(endDate);

  // Construction des paramètres (valeurs brutes échappées individuellement)
  const title = encodeURIComponent(
    (titlePrefix ? titlePrefix : '') + (eventData.titre || eventData.title || 'Événement')
  );
  const details = encodeURIComponent((customDetails ?? eventData.description) || eventData.notes || '');
  const location = encodeURIComponent(eventData.lieu || eventData.adresse || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};

// ────────────────────────────────────────────
// 4. Ouverture sécurisée dans un nouvel onglet
// ────────────────────────────────────────────

/**
 * Ouvre l'URL Google Calendar dans un nouvel onglet de manière sécurisée.
 * Empêche les attaques de type reverse tabnapping (noopener, noreferrer).
 *
 * @param {Object} eventData - Objet métier de l'événement
 * @param {Object} [options] - Options passées à buildGoogleCalendarUrl
 */
export const openGoogleCalendar = (eventData, options = {}) => {
  const url = buildGoogleCalendarUrl(eventData, options);
  window.open(url, '_blank', 'noopener,noreferrer');
};
