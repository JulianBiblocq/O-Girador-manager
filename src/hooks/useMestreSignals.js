import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé pour récupérer les Signes de commandement du Mestre.
 * Cloisonne les signaux par organisation (groupId) avec repli vers les signaux globaux et historiques.
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

        if (groupId) {
          // 1. Signaux spécifiques au groupe
          const groupQuery = query(
            collection(db, 'mestre_signals'),
            where('groupId', '==', groupId)
          );
          const groupSnap = await getDocs(groupQuery);
          groupSnap.forEach((docSnap) => {
            signalsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });

          // 2. Repli vers les signaux globaux partagés
          try {
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
          } catch (globalErr) {
            console.warn("Signaux globaux non disponibles :", globalErr);
          }

          // 3. Repli si la base n'a pas encore de champ groupId sur les données historiques
          if (signalsMap.size === 0) {
            const snapAll = await getDocs(collection(db, 'mestre_signals'));
            snapAll.forEach((docSnap) => {
              const val = docSnap.data();
              const valGroupId = val.groupId;
              const isUniversal = !valGroupId || String(valGroupId).toLowerCase() === 'global';
              const isCurrent = valGroupId && String(valGroupId).toLowerCase() === String(groupId).toLowerCase();
              if (isUniversal || isCurrent) {
                if (!signalsMap.has(docSnap.id)) {
                  signalsMap.set(docSnap.id, { id: docSnap.id, ...val });
                }
              }
            });
          }
        } else {
          // Sans groupId spécifié (chargement direct de toute la bibliothèque)
          const querySnapshot = await getDocs(collection(db, 'mestre_signals'));
          querySnapshot.forEach((docSnap) => {
            signalsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        }

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

