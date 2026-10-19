import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  normalizeGroupNomenclature,
  normalizeGroupNomenclatureAbbr,
  DEFAULT_NOMENCLATURE,
  DEFAULT_NOMENCLATURE_ABBR
} from '../constants/nomenclature';

/**
 * Hook d'abonnement en temps réel à la nomenclature et aux abréviations d'un groupe.
 * Rétrocompatible : supporte nomenclature (noms complets) et nomenclatureAbbr (codes 2 lettres).
 *
 * @param {string|null} groupId Identifiant de l'association/structure
 * @returns {{ nomenclature: object, nomenclatureAbbr: object, loading: boolean }}
 */
export function useGroupNomenclature(groupId) {
  const [nomenclature, setNomenclature] = useState(DEFAULT_NOMENCLATURE);
  const [nomenclatureAbbr, setNomenclatureAbbr] = useState(DEFAULT_NOMENCLATURE_ABBR);
  const [loading, setLoading] = useState(Boolean(groupId));

  useEffect(() => {
    if (!groupId) {
      setNomenclature(DEFAULT_NOMENCLATURE);
      setNomenclatureAbbr(DEFAULT_NOMENCLATURE_ABBR);
      setLoading(false);
      return;
    }

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const normalized = normalizeGroupNomenclature(data?.nomenclature, 'maracatu');
        const normalizedAbbr = normalizeGroupNomenclatureAbbr(data?.nomenclatureAbbr, 'maracatu');
        setNomenclature({
          ...DEFAULT_NOMENCLATURE,
          ...normalized
        });
        setNomenclatureAbbr({
          ...DEFAULT_NOMENCLATURE_ABBR,
          ...normalizedAbbr
        });
      } else {
        setNomenclature(DEFAULT_NOMENCLATURE);
        setNomenclatureAbbr(DEFAULT_NOMENCLATURE_ABBR);
      }
      setLoading(false);
    }, (error) => {
      console.error("useGroupNomenclature - Erreur de lecture de l'association :", error);
      setNomenclature(DEFAULT_NOMENCLATURE);
      setNomenclatureAbbr(DEFAULT_NOMENCLATURE_ABBR);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  return { nomenclature, nomenclatureAbbr, loading };
}
