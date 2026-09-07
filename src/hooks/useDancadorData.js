import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Importation de l'instance Firebase

/**
 * Hook pour récupérer le catalogue des pas de danse (steps) du groupe courant en temps réel.
 * 
 * @param {string} groupId - L'ID du groupe courant
 * @returns {Object} - { steps, loading, error }
 */
export function useDancadorSteps(groupId) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'steps'),
      where('tenantId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Extraction des données demandées : id, nom, vignetteUrl, videoUrl, famille
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setSteps(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.warn("useDancadorSteps - Lecture non disponible pour ce groupe :", err?.message || err);
        setError(err);
        setSteps([]);
        setLoading(false);
      }
    );

    // Nettoyage de l'écouteur
    return () => unsubscribe();
  }, [groupId]);

  return { steps, loading, error };
}

/**
 * Hook pour récupérer le catalogue des chorégraphies publiées du groupe courant en temps réel.
 * 
 * @param {string} groupId - L'ID du groupe courant
 * @returns {Object} - { choreographies, loading, error }
 */
export function useDancadorChoreographies(groupId) {
  const [choreographies, setChoreographies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'choreographies'),
      where('tenantId', '==', groupId),
      where('isPublished', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setChoreographies(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.warn("useDancadorChoreographies - Lecture non disponible pour ce groupe :", err?.message || err);
        setError(err);
        setChoreographies([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { choreographies, loading, error };
}

/**
 * Hook pour récupérer le catalogue des dessins de scène (formations) du groupe courant en temps réel.
 * 
 * @param {string} groupId - L'ID du groupe courant
 * @returns {Object} - { formations, loading, error }
 */
export function useDancadorFormations(groupId) {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'formations_catalogue'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setFormations(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.error("useDancadorFormations - Erreur de lecture :", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { formations, loading, error };
}
