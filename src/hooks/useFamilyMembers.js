import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook pour la gestion des comptes enfants ou dépendants rattachés
 * au profil d'un membre parent.
 */
export function useFamilyMembers(user, groupId) {
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid || !groupId) {
      setDependents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const constraints = [
      where('managedBy', '==', user.uid),
      where('isDependent', '==', true)
    ];
    if (groupId) {
      constraints.push(where('groupId', '==', groupId));
    }
    const q = query(usersRef, ...constraints);

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
        const isPermErr = err?.code === 'permission-denied' || err?.message?.toLowerCase().includes('permission');
        if (isPermErr) {
          console.warn("useFamilyMembers - Accès restreint ou en attente d'initialisation des dépendants.");
        } else {
          console.error("useFamilyMembers - Erreur chargement dépendants :", err);
        }
        setDependents([]);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, groupId]);

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
      niveauxParInstrument: dependentData.niveauxParInstrument || {},
      role: 'membre',
      isNew: true,
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
      niveauDanse: dependentData.niveauDanse || 'aucun',
      niveauxParInstrument: dependentData.niveauxParInstrument || {}
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
