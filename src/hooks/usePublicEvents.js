import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook réactif de récupération des événements publics à venir.
 * Interroge Firestore pour trouver les documents de la collection `events`
 * ayant `isPublic == true`, puis filtre et trie par date les événements à venir.
 * 
 * @param {string} [groupId] - ID optionnel du groupe/association pour filtrer par association.
 * @returns {{ events: Array, loading: boolean, error: Error|null }}
 */
export function usePublicEvents(groupId = null) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Construction de la requête Firestore pour les événements publics
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
        const todayStr = new Date().toISOString().split('T')[0]; // Date du jour au format YYYY-MM-DD
        const fetchedEvents = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedEvents.push({
            id: docSnap.id,
            ...data
          });
        });

        // Filtrage des événements passés et tri par date chronologique
        const upcomingPublicEvents = fetchedEvents
          .filter((evt) => {
            if (!evt.date) return false;
            // Garde les événements d'aujourd'hui et futurs
            return evt.date >= todayStr;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 4); // Limite aux 4 prochains événements

        setEvents(upcomingPublicEvents);
        setLoading(false);
      },
      (err) => {
        console.error("usePublicEvents - Erreur de lecture des événements publics :", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return {
    events,
    loading,
    error
  };
}
