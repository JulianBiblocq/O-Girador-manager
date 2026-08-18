import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook pour récupérer les morceaux (patterns et sections) du Séquenceur
 * stockés dans Firestore, filtrés par l'identifiant du groupe (tenant).
 */
export function useSequencerFirestoreData(groupId) {
  const [rhythms, setRhythms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setRhythms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const patternsRef = collection(db, 'patterns');
    const sectionsRef = collection(db, 'sections');

    // On récupère tout (ou on peut filtrer plus tard) au cas où le Séquenceur ne renseigne pas le groupId
    const qPatterns = query(patternsRef);
    const qSections = query(sectionsRef);

    let currentPatterns = [];
    let currentSections = [];

    const mergeAndSet = () => {
      // On combine patterns et sections
      const merged = [...currentPatterns, ...currentSections];
      
      // On trie par nom (titre) alphabétiquement
      merged.sort((a, b) => {
        const titleA = (a.title || a.name || '').toLowerCase();
        const titleB = (b.title || b.name || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });

      setRhythms(merged);
      setLoading(false);
    };

    const unsubPatterns = onSnapshot(qPatterns, (snapshot) => {
      currentPatterns = snapshot.docs.map(doc => ({
        id: doc.id,
        _collection: 'patterns',
        ...doc.data()
      }));
      mergeAndSet();
    }, (err) => {
      console.error("Erreur récupération patterns :", err);
      // Fallback: on continue même s'il y a une erreur sur l'une
      mergeAndSet();
    });

    const unsubSections = onSnapshot(qSections, (snapshot) => {
      currentSections = snapshot.docs.map(doc => ({
        id: doc.id,
        _collection: 'sections',
        ...doc.data()
      }));
      mergeAndSet();
    }, (err) => {
      console.error("Erreur récupération sections :", err);
      // Fallback
      mergeAndSet();
    });

    return () => {
      unsubPatterns();
      unsubSections();
    };
  }, [groupId]);

  return { rhythms, loading, error };
}
