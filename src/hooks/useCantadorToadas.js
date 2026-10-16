import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé réactif pour écouter le catalogue des packs de Toadas
 * publiés depuis l'Atelier Vocal / Cantador (collection racine 'toada_packs').
 *
 * Fournit la liste triée par ordre alphabétique pour l'association avec les fiches Répertoire.
 *
 * @returns {{ toadaPacks: Array, loadingToadaPacks: boolean, errorToadaPacks: any }}
 */
export function useCantadorToadas() {
  const [toadaPacks, setToadaPacks] = useState([]);
  const [loadingToadaPacks, setLoadingToadaPacks] = useState(true);
  const [errorToadaPacks, setErrorToadaPacks] = useState(null);

  useEffect(() => {
    setLoadingToadaPacks(true);
    setErrorToadaPacks(null);

    const collRef = collection(db, 'toada_packs');
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        const packs = [];
        snapshot.forEach((d) => {
          const data = d.data() || {};
          const title = data.title || data.metadata?.title || data.metadata?.toada || data.project?.title || d.id;
          const bpm = data.project?.bpm || data.metadata?.bpm || null;
          const timeSignature = data.project?.timeSignature || data.metadata?.timeSignature || null;
          const patternsCount = Array.isArray(data.patterns) ? data.patterns.length : 0;

          packs.push({
            id: d.id,
            ...data,
            title,
            bpm,
            timeSignature,
            patternsCount,
          });
        });

        // Tri alphabétique par titre
        packs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

        setToadaPacks(packs);
        setLoadingToadaPacks(false);
      },
      (err) => {
        console.warn('[useCantadorToadas] Écoute toada_packs différée (permissions ou hors ligne) :', err);
        setErrorToadaPacks(err);
        setLoadingToadaPacks(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    toadaPacks,
    loadingToadaPacks,
    errorToadaPacks,
  };
}
