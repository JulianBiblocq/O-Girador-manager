import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getActiveSeasonPieces } from '../utils/cadavreExquisGenerator';

/**
 * Hook pour charger le répertoire actif et les fiches varal du groupe pour les jeux multijoueurs.
 * Écoute le classeur de répertoire ainsi que les documents du Varal (collection 'documents' et sous-collection 'varal').
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

    const cleanGroupId = groupId.trim().toLowerCase();
    const repRef = collection(db, 'associations', cleanGroupId, 'repertoire');
    const varalSubRef = collection(db, 'associations', cleanGroupId, 'varal');
    const docsRef = query(collection(db, 'documents'), where('groupId', '==', groupId));

    const unsubRep = onSnapshot(repRef, (snap) => {
      const pieces = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRepertoireList(pieces.length > 0 ? pieces : getActiveSeasonPieces([]));
      setLoading(false);
    }, (err) => {
      console.warn('[useGameRepertoire] Erreur répertoire :', err);
      setRepertoireList(getActiveSeasonPieces([]));
      setLoading(false);
    });

    let subVaralDocs = [];
    let rootVaralDocs = [];

    const syncVaralList = () => {
      const combined = new Map();
      rootVaralDocs.forEach(d => combined.set(d.id, d));
      subVaralDocs.forEach(d => combined.set(d.id, d));
      setVaralList(Array.from(combined.values()));
    };

    const unsubSubVaral = onSnapshot(varalSubRef, (snap) => {
      subVaralDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncVaralList();
    }, (err) => {
      console.warn('[useGameRepertoire] Erreur sous-collection varal :', err);
    });

    const unsubDocs = onSnapshot(docsRef, (snap) => {
      rootVaralDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncVaralList();
    }, (err) => {
      console.warn('[useGameRepertoire] Erreur collection documents varal :', err);
    });

    return () => {
      unsubRep();
      unsubSubVaral();
      unsubDocs();
    };
  }, [groupId, isEnabled]);

  return { repertoireList, varalList, loading };
}

