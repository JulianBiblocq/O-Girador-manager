import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeGroupNomenclature, DEFAULT_NOMENCLATURE } from '../constants/nomenclature';

/**
 * Hook d'abonnement en temps réel à la nomenclature instrumentale d'un groupe.
 * Rétrocompatible : supporte le format imbriqué { nomenclature: { maracatu: { ... } } }
 * et le format plat historique { nomenclature: { alfaia_grave: "..." } }.
 * Fallback silencieux vers DEFAULT_NOMENCLATURE si aucun groupId n'est fourni.
 *
 * @param {string|null} groupId Identifiant de l'association/structure
 * @returns {{ nomenclature: object, loading: boolean }}
 */
export function useGroupNomenclature(groupId) {
  const [nomenclature, setNomenclature] = useState(DEFAULT_NOMENCLATURE);
  const [loading, setLoading] = useState(Boolean(groupId));

  useEffect(() => {
    if (!groupId) {
      setNomenclature(DEFAULT_NOMENCLATURE);
      setLoading(false);
      return;
    }

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const normalized = normalizeGroupNomenclature(data?.nomenclature, 'maracatu');
        setNomenclature({
          ...DEFAULT_NOMENCLATURE,
          ...normalized
        });
      } else {
        setNomenclature(DEFAULT_NOMENCLATURE);
      }
      setLoading(false);
    }, (error) => {
      console.error("useGroupNomenclature - Erreur de lecture de l'association :", error);
      setNomenclature(DEFAULT_NOMENCLATURE);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  return { nomenclature, loading };
}
