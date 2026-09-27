import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { isDemoMode } from '../demo/demoManager';
import { calculateKitStatus, DEFAULT_REGIE_KITS } from '../utils/kitUtils';

export { calculateKitStatus, DEFAULT_REGIE_KITS };

/**
 * Hook de synchronisation temps réel des mallettes et trousses collectives régie.
 *
 * @param {string} groupId - Identifiant de l'association
 */
export function useCollectiveKits(groupId) {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cleanGroupId = (groupId || '').trim().toLowerCase();

  useEffect(() => {
    if (!cleanGroupId) {
      setKits([]);
      setLoading(false);
      return;
    }

    if (isDemoMode()) {
      setKits(DEFAULT_REGIE_KITS.map((k, idx) => ({ ...k, id: `demo-kit-${idx + 1}`, groupId: cleanGroupId })));
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'collective_kits');
    const q = query(colRef, where('groupId', '==', cleanGroupId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedKits = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setKits(loadedKits);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur écoute collective_kits :", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [cleanGroupId]);

  const addKit = async (kitData) => {
    if (!cleanGroupId) return null;
    const colRef = collection(db, 'collective_kits');
    const docData = {
      ...kitData,
      groupId: cleanGroupId,
      createdAt: serverTimestamp(),
      derniereVerification: new Date().toISOString()
    };
    return await addDoc(colRef, docData);
  };

  const updateKit = async (kitId, updateData) => {
    if (!kitId) return;
    const docRef = doc(db, 'collective_kits', kitId);
    return await updateDoc(docRef, { ...updateData, updatedAt: serverTimestamp() });
  };

  const deleteKit = async (kitId) => {
    if (!kitId) return;
    const docRef = doc(db, 'collective_kits', kitId);
    return await deleteDoc(docRef);
  };

  const initDefaultKits = async () => {
    if (!cleanGroupId) return;
    for (const kit of DEFAULT_REGIE_KITS) {
      await addKit(kit);
    }
  };

  return {
    kits,
    loading,
    error,
    addKit,
    updateKit,
    deleteKit,
    initDefaultKits
  };
}
