/**
 * dateUtils.js - Helper functions for event temporal filtering & sorting.
 */

/**
 * Checks whether an event is in the past (before today at 00:00:00).
 * Uses dateFin if present, otherwise date.
 * 
 * @param {Object} event
 * @returns {boolean} true if past event
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
 * Sorts upcoming events in ascending chronological order (nearest first).
 * e.g. Oct 15, Oct 22, Nov 01...
 */
export const sortUpcomingEvents = (events = []) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
};

/**
 * Sorts past events in descending antichronological order (most recent past first).
 * e.g. Yesterday, Last week, Last month...
 */
export const sortPastEvents = (events = []) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.dateFin || a.date);
    const dateB = new Date(b.dateFin || b.date);
    return dateB - dateA;
  });
};

/**
 * Splits a list of events into upcoming and past events with appropriate sorting.
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
