import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useInventoryProjects(groupId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'inventory_projects'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Trier par date de création descendante
      fetched.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      setProjects(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Erreur lors du chargement des projets d'inventaire:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const addProject = async (projectData) => {
    try {
      const docRef = await addDoc(collection(db, 'inventory_projects'), {
        ...projectData,
        groupId,
        artisanId: projectData.artisanId || null,
        artisanNom: projectData.artisanNom || null,
        statut: 'En cours',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        piecesAssignees: projectData.piecesAssignees || [] // [{ modelPartId, inventoryPartId }]
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout du projet:", error);
      throw error;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const docRef = doc(db, 'inventory_projects', projectId);
      await updateDoc(docRef, {
        ...projectData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await deleteDoc(doc(db, 'inventory_projects', projectId));
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      throw error;
    }
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject
  };
}
