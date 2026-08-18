import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useConfirm from './useConfirm';

/**
 * Hook personnalisé pour piloter l'inventaire du matériel et des instruments d'une association.
 *
 * @param {string} groupId Identifiant du groupe/association
 * @param {boolean} isAuthorized Indique si l'utilisateur possède les droits de gestion logistique
 * @param {Function} t Fonction de traduction
 */
export function useInventoryData(groupId, isAuthorized, t) {
  const { confirm } = useConfirm();
  const [instruments, setInstruments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nom: '',
    type: 'Alfaia',
    etat: 'Bon',
    proprietaire: 'Association',
    localisationPhysique: 'Local',
    assignations: [],
    status: 'En stock',
    borrowedBy: '',
    etuiFourni: false,
    kit: ''
  });

  // Synchronisation en temps réel de la liste des membres du groupe
  useEffect(() => {
    if (!isAuthorized || !groupId) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedUsers = [];
        querySnapshot.forEach((docSnap) => {
          fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetchedUsers.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        setUsersList(fetchedUsers);
      },
      (error) => {
        console.error("useInventoryData - Erreur snapshot membres :", error);
      }
    );

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // Synchronisation en temps réel de l'inventaire du matériel
  useEffect(() => {
    if (!isAuthorized || !groupId) {
      setLoading(false);
      return;
    }

    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedInstruments = [];
        querySnapshot.forEach((docSnap) => {
          fetchedInstruments.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetchedInstruments.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        setInstruments(fetchedInstruments);
        setLoading(false);
      },
      (error) => {
        console.error("useInventoryData - Erreur snapshot inventaire :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // Carte de résolution O(1) des noms d'utilisateurs
  const usersMap = useMemo(() => {
    return usersList.reduce((acc, u) => {
      acc[u.id] = `${u.prenom} ${u.nom}`;
      return acc;
    }, {});
  }, [usersList]);

  const handleOpenAdd = useCallback(() => {
    setFormData({
      nom: '',
      type: 'Alfaia',
      etat: 'Bon',
      proprietaire: 'Association',
      localisationPhysique: 'Local',
      assignations: [],
      status: 'En stock',
      borrowedBy: '',
      etuiFourni: false,
      kit: ''
    });
    setEditingId(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((inst) => {
    setFormData({
      nom: inst.nom || '',
      type: inst.type || 'Alfaia',
      etat: inst.etat || 'Bon',
      proprietaire: inst.proprietaire || 'Association',
      localisationPhysique: inst.localisationPhysique || 'Local',
      assignations: inst.assignations || [],
      status: inst.status || 'En stock',
      borrowedBy: inst.borrowedBy || '',
      etuiFourni: inst.etuiFourni || false,
      kit: inst.kit || ''
    });
    setEditingId(inst.id);
    setIsFormOpen(true);
  }, []);

  const handleSave = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!groupId || !formData.nom.trim()) return;

    setSaving(true);
    try {
      const payload = {
        nom: formData.nom.trim(),
        type: formData.type,
        etat: formData.etat,
        proprietaire: formData.proprietaire,
        localisationPhysique: formData.localisationPhysique,
        assignations: formData.assignations,
        status: formData.status || 'En stock',
        borrowedBy: formData.borrowedBy || null,
        etuiFourni: formData.etuiFourni || false,
        kit: formData.kit || '',
        groupId: groupId
      };

      if (editingId) {
        await updateDoc(doc(db, 'inventory', editingId), payload);
      } else {
        await addDoc(collection(db, 'inventory'), payload);
      }

      setIsFormOpen(false);
    } catch (err) {
      console.error("useInventoryData - Erreur sauvegarde inventaire :", err);
      alert("Erreur lors de la sauvegarde du matériel.");
    } finally {
      setSaving(false);
    }
  }, [groupId, formData, editingId]);

  const handleDelete = useCallback(async (id) => {
    const ok = await confirm({
      title: t('common.deleteConfirmTitle') || "Supprimer l'élément",
      message: t('common.deleteConfirmMessage') || "Êtes-vous sûr de vouloir supprimer cet élément de l'inventaire ?",
      confirmText: t('common.delete') || "Supprimer",
      cancelText: t('common.cancel') || "Annuler",
      variant: "danger"
    });

    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      console.error("useInventoryData - Erreur suppression inventaire :", err);
      alert("Erreur lors de la suppression du matériel.");
    }
  }, [confirm, t]);

  const handleToggleBorrowStatus = useCallback(async (inst, newStatus, borrowerUid = '') => {
    try {
      const payload = {
        status: newStatus,
        borrowedBy: newStatus === 'Emprunté' ? borrowerUid : null
      };
      await updateDoc(doc(db, 'inventory', inst.id), payload);
    } catch (err) {
      console.error("useInventoryData - Erreur changement statut emprunt :", err);
      alert("Erreur lors du changement de statut du matériel.");
    }
  }, []);

  const handleApproveMovement = useCallback(async (inst) => {
    if (!inst.pendingMovement) return;
    try {
      const { type, toUserId } = inst.pendingMovement;
      let payload = {};
      if (type === 'return_to_local') {
        payload = {
          status: 'En stock',
          borrowedBy: null,
          localisationPhysique: 'Local',
          pendingMovement: null
        };
      } else if (type === 'transfer' && toUserId) {
        payload = {
          status: 'Emprunté',
          borrowedBy: toUserId,
          localisationPhysique: toUserId,
          pendingMovement: null
        };
      } else {
        payload = { pendingMovement: null };
      }
      await updateDoc(doc(db, 'inventory', inst.id), payload);
    } catch (err) {
      console.error("useInventoryData - Erreur lors de l'approbation du mouvement :", err);
      alert("Erreur lors de l'approbation du mouvement.");
    }
  }, []);

  const handleRejectMovement = useCallback(async (inst) => {
    if (!inst.pendingMovement) return;
    try {
      await updateDoc(doc(db, 'inventory', inst.id), { pendingMovement: null });
    } catch (err) {
      console.error("useInventoryData - Erreur lors du rejet du mouvement :", err);
      alert("Erreur lors du rejet du mouvement.");
    }
  }, []);

  return {
    instruments,
    usersList,
    usersMap,
    loading,
    saving,
    isFormOpen,
    setIsFormOpen,
    editingId,
    formData,
    setFormData,
    handleOpenAdd,
    handleOpenEdit,
    handleSave,
    handleDelete,
    handleToggleBorrowStatus,
    handleApproveMovement,
    handleRejectMovement
  };
}
