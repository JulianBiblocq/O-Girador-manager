/**
 * dateUtils.js - Fonctions utilitaires pour le filtrage temporel et le tri des événements.
 */

/**
 * Vérifie si un événement est passé (antérieur à aujourd'hui 00:00:00).
 * Utilise dateFin si présent, sinon date.
 * 
 * @param {Object} event
 * @returns {boolean} true si l'événement est passé
 */
/**
 * Vérifie avec précision si un événement est strictement terminé dans le temps.
 * Reconstitue le timestamp exact (${event.dateFin || event.date}T${event.heureFin || '23:59'})
 * afin d'éviter qu'un événement du jour ne soit considéré comme passé dès minuit.
 *
 * @param {Object} event - L'événement à tester
 * @param {Date} [referenceDate=new Date()] - Date de comparaison (défaut: maintenant)
 * @returns {boolean} true si l'événement est strictement passé
 */
export const isEventStrictlyPassed = (event, referenceDate = new Date()) => {
  if (!event) return false;
  const baseDate = event.dateFin || event.date;
  if (!baseDate) return false;

  // Si la chaîne ISO contient déjà une heure
  if (baseDate.includes('T')) {
    const parsed = new Date(baseDate);
    return !isNaN(parsed.getTime()) && parsed < referenceDate;
  }

  // Sinon, reconstitution avec heureFin ou par défaut 23:59:59
  const timeEnd = event.heureFin || '23:59';
  const fullEndIso = `${baseDate}T${timeEnd.length === 5 ? timeEnd + ':00' : timeEnd}`;
  const parsedEnd = new Date(fullEndIso);
  if (!isNaN(parsedEnd.getTime())) {
    return parsedEnd < referenceDate;
  }

  return new Date(baseDate) < referenceDate;
};

/**
 * Vérifie si un événement est passé (antérieur à aujourd'hui 00:00:00).
 * Utilise dateFin si présent, sinon date.
 * 
 * @param {Object} event
 * @returns {boolean} true si l'événement est passé
 */
export const isPastEvent = (event) => {
  if (!event || (!event.date && !event.dateFin)) return false;
  
  const targetDateStr = event.dateFin || event.date;
  const eventDate = new Date(targetDateStr);
  if (isNaN(eventDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return eventDate < today;
};

/**
 * Trie les événements à venir par ordre chronologique croissant (les plus proches en premier).
 * ex: 15 oct, 22 oct, 01 nov...
 */
export const sortUpcomingEvents = (events = []) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
};

/**
 * Trie les événements passés par ordre antichronologique décroissant (les plus récents en premier).
 * ex: Hier, La semaine dernière, Le mois dernier...
 */
export const sortPastEvents = (events = []) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.dateFin || a.date);
    const dateB = new Date(b.dateFin || b.date);
    return dateB - dateA;
  });
};

/**
 * Sépare une liste d'événements en événements à venir et événements passés avec leur tri respectif.
 * 
 * @param {Array} events 
 * @returns {{ upcomingEvents: Array, pastEvents: Array }}
 */
export const splitEventsByTime = (events = []) => {
  const upcoming = [];
  const past = [];

  events.forEach((event) => {
    if (isPastEvent(event)) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  });

  return {
    upcomingEvents: sortUpcomingEvents(upcoming),
    pastEvents: sortPastEvents(past)
  };
};
