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
 * Vérifie si un événement est passé (strictement antérieur à aujourd'hui 00:00:00).
 * Utilise dans l'ordre de priorité : dateFin, dateDebut ou date.
 * 
 * @param {Object} event Événement à tester
 * @returns {boolean} true si l'événement est passé (< aujourd'hui)
 */
export const isPastEvent = (event) => {
  if (!event) return false;
  
  const targetDateStr = (typeof event === 'string' || event instanceof Date || (typeof event === 'object' && typeof event?.toDate === 'function'))
    ? event
    : (event.dateFin || event.dateDebut || event.date);
  if (!targetDateStr) return false;

  let eventDate;
  if (typeof targetDateStr === 'string') {
    const clean = targetDateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length >= 3) {
      eventDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      eventDate = new Date(targetDateStr);
    }
  } else if (targetDateStr instanceof Date) {
    eventDate = new Date(targetDateStr.getFullYear(), targetDateStr.getMonth(), targetDateStr.getDate());
  } else if (typeof targetDateStr === 'object' && typeof targetDateStr.toDate === 'function') {
    const d = targetDateStr.toDate();
    eventDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } else {
    eventDate = new Date(targetDateStr);
  }

  if (!eventDate || isNaN(eventDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return eventDate.getTime() < today.getTime();
};

/**
 * Trie les événements à venir par ordre chronologique croissant (ASC - les plus proches en premier).
 * ex: 15 oct, 22 oct, 01 nov...
 * 
 * @param {Array} events Liste des événements
 * @returns {Array} Liste triée chronologiquement
 */
export const sortUpcomingEvents = (events = []) => {
  return [...events].sort((a, b) => {
    const strA = a.dateDebut || a.date || '';
    const strB = b.dateDebut || b.date || '';
    const timeA = strA ? new Date(strA).getTime() : 0;
    const timeB = strB ? new Date(strB).getTime() : 0;
    return timeA - timeB;
  });
};

/**
 * Trie les événements passés par ordre antéchronologique décroissant (DESC - les plus récents en premier).
 * ex: Hier, La semaine dernière, Le mois dernier...
 * 
 * @param {Array} events Liste des événements
 * @returns {Array} Liste triée antéchronologiquement
 */
export const sortPastEvents = (events = []) => {
  return [...events].sort((a, b) => {
    const strA = a.dateFin || a.dateDebut || a.date || '';
    const strB = b.dateFin || b.dateDebut || b.date || '';
    const timeA = strA ? new Date(strA).getTime() : 0;
    const timeB = strB ? new Date(strB).getTime() : 0;
    return timeB - timeA;
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
