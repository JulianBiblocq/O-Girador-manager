import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { buildGroupVariants } from '../utils/tenantUtils';

/**
 * Hook personnalisé pour récupérer les Signes de commandement du Mestre.
 * Cloisonne strictement les signaux par association (`groupId` + variantes de casse) et signaux `'global'`.
 *
 * @param {string|null} groupId - Identifiant de l'association active
 * @returns {{ signals: Array, loading: boolean, error: Error|null }}
 */
export default function useMestreSignals(groupId = null) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [error, setError] = useState(null);

  useEffect(() => {
    const cleanGroup = String(groupId || '').trim();
    if (!cleanGroup) {
      setSignals([]);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchSignals = async () => {
      setLoading(true);
      try {
        const signalsMap = new Map();
        const colRef = collection(db, 'mestre_signals');

        // 1. Signaux spécifiques au groupe (exact + variantes de casse éventuelles)
        const groupQuery = query(colRef, where('groupId', '==', groupId));
        const extraVariants = buildGroupVariants(cleanGroup).filter((v) => v !== groupId).slice(0, 9);
        const queries = [
          getDocs(groupQuery),
          extraVariants.length > 0 ? getDocs(query(colRef, where('groupId', 'in', extraVariants))) : Promise.resolve(null),
          getDocs(query(colRef, where('groupId', '==', 'global')))
        ];

        const results = await Promise.allSettled(queries);
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value) {
            res.value.forEach((docSnap) => {
              if (!signalsMap.has(docSnap.id)) {
                signalsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
              }
            });
          }
        });

        const data = Array.from(signalsMap.values());
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

