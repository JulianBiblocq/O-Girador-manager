import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getActiveSeasonPieces } from '../utils/cadavreExquisGenerator';

/**
 * Hook pour charger le répertoire actif et les fiches varal du groupe pour les jeux multijoueurs.
 */
export function useGameRepertoire(groupId, isEnabled = true) {
  const [repertoireList, setRepertoireList] = useState([]);
  const [varalList, setVaralList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !isEnabled) {
      setRepertoireList(getActiveSeasonPieces([]));
      setLoading(false);
      return;
    }

    const repRef = collection(db, 'associations', groupId.trim().toLowerCase(), 'repertoire');
    const varalRef = collection(db, 'associations', groupId.trim().toLowerCase(), 'varal');

    const unsubRep = onSnapshot(repRef, (snap) => {
      const pieces = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRepertoireList(pieces.length > 0 ? pieces : getActiveSeasonPieces([]));
      setLoading(false);
    }, (err) => {
      console.warn('[useGameRepertoire] Erreur répertoire :', err);
      setRepertoireList(getActiveSeasonPieces([]));
      setLoading(false);
    });

    const unsubVaral = onSnapshot(varalRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVaralList(items);
    }, (err) => {
      console.warn('[useGameRepertoire] Erreur varal :', err);
    });

    return () => {
      unsubRep();
      unsubVaral();
    };
  }, [groupId, isEnabled]);

  return { repertoireList, varalList, loading };
}
