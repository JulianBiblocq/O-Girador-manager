import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé pour récupérer les Signes de commandement du Mestre.
 * Cloisonne les signaux par organisation (groupId) avec repli vers les signaux globaux si nécessaire.
 *
 * @param {string|null} groupId - Identifiant de l'association/groupe (optionnel)
 * @returns {{ signals: Array, loading: boolean, error: Error|null }}
 */
export default function useMestreSignals(groupId = null) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true);
      try {
        const signalsMap = new Map();

        // 1. Signaux spécifiques au groupe
        if (groupId) {
          const groupQuery = query(
            collection(db, 'mestre_signals'),
            where('groupId', '==', groupId)
          );
          const groupSnap = await getDocs(groupQuery);
          groupSnap.forEach((docSnap) => {
            signalsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        }

        // 2. Repli vers les signaux globaux partagés
        const globalQuery = query(
          collection(db, 'mestre_signals'),
          where('groupId', '==', 'global')
        );
        const globalSnap = await getDocs(globalQuery);
        globalSnap.forEach((docSnap) => {
          if (!signalsMap.has(docSnap.id)) {
            signalsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          }
        });

        const data = Array.from(signalsMap.values());
        // Tri alphabétique par libellé
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setSignals(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des signaux du mestre :", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [groupId]);

  return { signals, loading, error };
}
