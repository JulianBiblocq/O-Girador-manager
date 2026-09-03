import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé pour piloter l'inventaire des fournitures (matières premières) et de l'outillage.
 * Gère les collections 'inventory_supplies' et 'workshop_tools'.
 *
 * @param {string} groupId Identifiant du groupe/association
 * @param {string} domainFilter Filtre optionnel par domaine ('lutherie' | 'costumerie' | null)
 */
export function useSuppliesData(groupId, domainFilter = null) {
  const [supplies, setSupplies] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Écoute temps réel de la collection 'inventory_supplies'
  useEffect(() => {
    if (!groupId) {
      setSupplies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'inventory_supplies'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupplies(data);
      setLoading(false);
    }, (error) => {
      console.error("Erreur lors de la récupération des fournitures :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Écoute temps réel de la collection 'workshop_tools'
  useEffect(() => {
    if (!groupId) {
      setTools([]);
      return;
    }

    const q = query(
      collection(db, 'workshop_tools'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTools(data);
    }, (error) => {
      console.error("Erreur lors de la récupération de l'outillage :", error);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Filtrage local par domaine (avec repli sur 'lutherie' pour les données historiques)
  const filteredSupplies = useMemo(() => {
    if (!domainFilter) return supplies;
    return supplies.filter(s => (s.domaine || 'lutherie') === domainFilter);
  }, [supplies, domainFilter]);

  const filteredTools = useMemo(() => {
    if (!domainFilter) return tools;
    return tools.filter(t => (t.domaine || 'lutherie') === domainFilter);
  }, [tools, domainFilter]);

  // Actions CRUD pour Fournitures
  const addSupply = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'inventory_supplies'), {
        ...data,
        domaine: data.domaine || domainFilter || 'lutherie',
        groupId,
        quantiteStock: Number(data.quantiteStock) || 0,
        seuilCritique: Number(data.seuilCritique) || 0,
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une fourniture :", error);
      return false;
    }
  }, [groupId, domainFilter]);

  const updateSupply = useCallback(async (id, data) => {
    try {
      const docRef = doc(db, 'inventory_supplies', id);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error("Erreur lors de la modification d'une fourniture :", error);
      return false;
    }
  }, []);

  const deleteSupply = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'inventory_supplies', id));
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression d'une fourniture :", error);
      return false;
    }
  }, []);

  const adjustSupplyStock = useCallback(async (id, amount) => {
    try {
      const docRef = doc(db, 'inventory_supplies', id);
      await updateDoc(docRef, {
        quantiteStock: increment(amount)
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajustement du stock :", error);
      return false;
    }
  }, []);

  // Actions CRUD pour Outils
  const addTool = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'workshop_tools'), {
        ...data,
        domaine: data.domaine || domainFilter || 'lutherie',
        groupId,
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un outil :", error);
      return false;
    }
  }, [groupId, domainFilter]);

  const updateTool = useCallback(async (id, data) => {
    try {
      const docRef = doc(db, 'workshop_tools', id);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error("Erreur lors de la modification d'un outil :", error);
      return false;
    }
  }, []);

  const deleteTool = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'workshop_tools', id));
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression d'un outil :", error);
      return false;
    }
  }, []);

  return {
    supplies: filteredSupplies,
    tools: filteredTools,
    loading,
    addSupply,
    updateSupply,
    deleteSupply,
    adjustSupplyStock,
    addTool,
    updateTool,
    deleteTool
  };
}
