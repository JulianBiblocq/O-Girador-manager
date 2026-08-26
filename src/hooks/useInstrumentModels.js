import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useInstrumentModels(groupId) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setModels([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'instrument_models'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Trier par nom alphabétique
      fetched.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setModels(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Erreur lors du chargement des modèles d'instruments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const addModel = async (modelData) => {
    try {
      const docRef = await addDoc(collection(db, 'instrument_models'), {
        ...modelData,
        groupId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        parts: modelData.parts || []
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout du modèle:", error);
      throw error;
    }
  };

  const updateModel = async (modelId, modelData) => {
    try {
      const docRef = doc(db, 'instrument_models', modelId);
      await updateDoc(docRef, {
        ...modelData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du modèle:", error);
      throw error;
    }
  };

  const deleteModel = async (modelId) => {
    try {
      await deleteDoc(doc(db, 'instrument_models', modelId));
    } catch (error) {
      console.error("Erreur lors de la suppression du modèle:", error);
      throw error;
    }
  };

  return {
    models,
    loading,
    addModel,
    updateModel,
    deleteModel
  };
}
