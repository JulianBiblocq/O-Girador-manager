import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook réactif de récupération des événements publics.
 * Retourne séparément :
 * - `upcomingEvents` : Événements publics à venir (date >= aujourd'hui), triés chronologiquement.
 * - `pastEvents` : Événements passés récents (< 15 jours, ou au minimum les 3 derniers passés si aucun sur 15 jours).
 * - `events` : Ensemble des événements filtrés (à venir + passés récents).
 */
export function usePublicEvents(groupId = null) {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    let q;
    if (groupId) {
      q = query(
        collection(db, 'events'),
        where('groupId', '==', groupId),
        where('isPublic', '==', true)
      );
    } else {
      q = query(
        collection(db, 'events'),
        where('isPublic', '==', true)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const nowMs = Date.now();
        const fifteenDaysAgoMs = nowMs - (15 * 24 * 60 * 60 * 1000);
        const fetchedEvents = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.date) {
            fetchedEvents.push({
              id: docSnap.id,
              ...data
            });
          }
        });

        // 1. Événements publics à venir (aujourd'hui et futurs)
        const upcoming = fetchedEvents
          .filter((evt) => (evt.date >= todayStr || (evt.endDate && evt.endDate >= todayStr)))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. Événements publics passés (date < aujourd'hui)
        const allPast = fetchedEvents
          .filter((evt) => (evt.date < todayStr && (!evt.endDate || evt.endDate < todayStr)))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Les plus récents d'abord

        // Filtrage des prestations des 15 derniers jours
        let recentPast = allPast.filter((evt) => {
          const evtDateStr = evt.endDate || evt.date;
          const evtMs = new Date(evtDateStr).getTime();
          return !isNaN(evtMs) && evtMs >= fifteenDaysAgoMs;
        });

        // Si moins de 3 prestations passées sur les 15 derniers jours, prendre au minimum les 3 dernières prestations passées
        if (recentPast.length < 3 && allPast.length > 0) {
          recentPast = allPast.slice(0, 3);
        }

        setUpcomingEvents(upcoming);
        setPastEvents(recentPast);
        setEvents([...upcoming, ...recentPast]);
        setLoading(false);
      },
      (err) => {
        console.error("usePublicEvents - Erreur de lecture :", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { events, upcomingEvents, pastEvents, loading, error };
}
