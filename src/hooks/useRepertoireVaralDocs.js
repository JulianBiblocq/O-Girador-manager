import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé réactif pour écouter les documents du Varal liés au Répertoire :
 * - Chants / Toadas (`type === 'song'`)
 * - Fiches Culturelles & Pédagogiques (`type === 'culture_fiche'` ou `type === 'fiche_pedagogique'`)
 *
 * Fournit les listes triées et les tables de correspondance (Map) pour un accès direct O(1).
 *
 * @param {string} groupId - Identifiant de l'association / groupe courant
 * @returns {Object} { toadasList, toadasMap, cultureDocsList, cultureMap, loadingDocs, errorDocs }
 */
export function useRepertoireVaralDocs(groupId) {
  const [toadasList, setToadasList] = useState([]);
  const [cultureDocsList, setCultureDocsList] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [errorDocs, setErrorDocs] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setToadasList([]);
      setCultureDocsList([]);
      setLoadingDocs(false);
      return;
    }

    setLoadingDocs(true);
    setErrorDocs(null);

    const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(
      qDocs,
      (snapshot) => {
        const fetchedSongs = [];
        const fetchedCulture = [];

        snapshot.forEach((d) => {
          const data = d.data() || {};
          if (data.type === 'song') {
            fetchedSongs.push({ id: d.id, ...data });
          } else if (
            data.type === 'culture_fiche' ||
            data.type === 'fiche_pedagogique' ||
            data.type === 'culture' ||
            (typeof data.categorie === 'string' && data.categorie.toLowerCase().includes('culture'))
          ) {
            fetchedCulture.push({ id: d.id, ...data });
          }
        });

        // Tri alphabétique par titre
        fetchedSongs.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        fetchedCulture.sort((a, b) => (a.titre || a.name || '').localeCompare(b.titre || b.name || ''));

        setToadasList(fetchedSongs);
        setCultureDocsList(fetchedCulture);
        setLoadingDocs(false);
      },
      (err) => {
        console.warn("useRepertoireVaralDocs - Erreur de lecture des documents :", err);
        setErrorDocs(err);
        setLoadingDocs(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Tables de correspondance mémoïsées pour une résolution instantanée
  const toadasMap = useMemo(() => new Map(toadasList.map((t) => [t.id, t])), [toadasList]);
  const cultureMap = useMemo(() => new Map(cultureDocsList.map((c) => [c.id, c])), [cultureDocsList]);

  return {
    toadasList,
    toadasMap,
    cultureDocsList,
    cultureMap,
    loadingDocs,
    errorDocs
  };
}
