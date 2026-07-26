import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook for managing dependent child accounts ("comptes rattachés")
 * for a parent user.
 */
export function useFamilyMembers(user, groupId) {
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setDependents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('managedBy', '==', user.uid),
      where('isDependent', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          fetched.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        setDependents(fetched);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useFamilyMembers - Erreur chargement dépendants :", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const addDependent = async (dependentData) => {
    if (!user?.uid) throw new Error("Utilisateur non connecté");

    const insts = dependentData.instrumentsJoues || [];
    const primaryInst = dependentData.instrument || insts[0] || '';

    const payload = {
      isDependent: true,
      managedBy: user.uid,
      groupId: groupId || null,
      prenom: (dependentData.prenom || '').trim(),
      nom: (dependentData.nom || '').trim(),
      dateNaissance: dependentData.dateNaissance || '',
      instrumentsJoues: insts,
      instrument: primaryInst,
      niveau: dependentData.niveau || 'debutant',
      niveauDanse: dependentData.niveauDanse || 'aucun',
      role: 'membre',
      statutActuel: 'active',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'users'), payload);
    return docRef.id;
  };

  const updateDependent = async (dependentId, dependentData) => {
    if (!dependentId) throw new Error("ID dépendant requis");

    const insts = dependentData.instrumentsJoues || [];
    const primaryInst = dependentData.instrument || insts[0] || '';

    const payload = {
      prenom: (dependentData.prenom || '').trim(),
      nom: (dependentData.nom || '').trim(),
      dateNaissance: dependentData.dateNaissance || '',
      instrumentsJoues: insts,
      instrument: primaryInst,
      niveau: dependentData.niveau || 'debutant',
      niveauDanse: dependentData.niveauDanse || 'aucun'
    };

    if (groupId) {
      payload.groupId = groupId;
    }

    const depRef = doc(db, 'users', dependentId);
    await updateDoc(depRef, payload);
  };

  const deleteDependent = async (dependentId) => {
    if (!dependentId) throw new Error("ID dépendant requis");
    const depRef = doc(db, 'users', dependentId);
    await deleteDoc(depRef);
  };

  return {
    dependents,
    loading,
    error,
    addDependent,
    updateDependent,
    deleteDependent
  };
}
