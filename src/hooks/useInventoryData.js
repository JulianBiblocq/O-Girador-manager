import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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

  // Nouvel état pour les pièces détachées
  const [inventoryParts, setInventoryParts] = useState([]);
  const [instrumentModels, setInstrumentModels] = useState([]);
  const [isPartFormOpen, setIsPartFormOpen] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  
  const [partFormData, setPartFormData] = useState({
    nom: '',
    typePiece: '',
    etat: 'Neuf',
    status: 'En stock',
    instrumentAssocie_id: null,
    modelId: '',
    partId: '',
    notesAtelier: '',
    currentStepIndex: 0,
    quantite: 1,
    statutEtape: 'en_cours',
    historiqueControles: []
  });

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
    kit: '',
    modelId: '',
    brokenParts: []
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

    // Synchronisation des pièces détachées
    const partsRef = collection(db, 'inventory_parts');
    const qParts = query(partsRef, where('groupId', '==', groupId));

    const unsubscribeParts = onSnapshot(
      qParts,
      (querySnapshot) => {
        const fetchedParts = [];
        querySnapshot.forEach((docSnap) => {
          fetchedParts.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetchedParts.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        setInventoryParts(fetchedParts);
      },
      (error) => {
        console.error("useInventoryData - Erreur snapshot inventory_parts :", error);
      }
    );

    // Synchronisation des Modèles d'instruments
    const modelsRef = collection(db, 'instrument_models');
    const qModels = query(modelsRef, where('groupId', '==', groupId));
    const unsubscribeModels = onSnapshot(
      qModels,
      (querySnapshot) => {
        const fetchedModels = [];
        querySnapshot.forEach((docSnap) => {
          fetchedModels.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetchedModels.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        setInstrumentModels(fetchedModels);
      },
      (error) => {
        console.error("useInventoryData - Erreur snapshot models :", error);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeParts();
      unsubscribeModels();
    };
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
      kit: '',
      nomenclature: []
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
      kit: inst.kit || '',
      nomenclature: inst.nomenclature || []
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
        nomenclature: formData.nomenclature || [],
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

  // Fonctions pour les pièces détachées
  const handleOpenPartAdd = useCallback(() => {
    setPartFormData({
      nom: '',
      typePiece: '',
      etat: 'Neuf',
      status: 'En stock',
      instrumentAssocie_id: null,
      modelId: '',
      partId: '',
      notesAtelier: '',
      currentStepIndex: 0,
      quantite: 1,
      statutEtape: 'en_cours',
      historiqueControles: []
    });
    setEditingPartId(null);
    setIsPartFormOpen(true);
  }, []);

  const handleOpenPartEdit = useCallback((part) => {
    setPartFormData({
      nom: part.nom || '',
      typePiece: part.typePiece || '',
      etat: part.etat || 'Neuf',
      status: part.status || 'En stock',
      instrumentAssocie_id: part.instrumentAssocie_id || null,
      modelId: part.modelId || '',
      partId: part.partId || '',
      notesAtelier: part.notesAtelier || '',
      currentStepIndex: part.currentStepIndex || 0,
      quantite: part.quantite || 1,
      statutEtape: part.statutEtape || 'en_cours',
      historiqueControles: part.historiqueControles || []
    });
    setEditingPartId(part.id);
    setIsPartFormOpen(true);
  }, []);

  const handleSavePart = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!groupId || !partFormData.nom.trim()) return;

    setSaving(true);
    try {
      const baseNom = partFormData.nom.trim();
      const qty = Math.max(1, parseInt(partFormData.quantite, 10) || 1);

      const basePayload = {
        typePiece: partFormData.typePiece,
        etat: partFormData.etat,
        status: partFormData.status || 'En stock',
        instrumentAssocie_id: partFormData.instrumentAssocie_id || null,
        groupId: groupId,
        modelId: partFormData.modelId || null,
        partId: partFormData.partId || null,
        notesAtelier: partFormData.notesAtelier || '',
        currentStepIndex: partFormData.currentStepIndex || 0,
        quantite: 1, // Chaque pièce enregistrée est unitaire et autonome
        statutEtape: partFormData.statutEtape || 'en_cours',
        historiqueControles: partFormData.historiqueControles || []
      };

      if (editingPartId) {
        // Mise à jour d'une pièce individuelle existante
        await updateDoc(doc(db, 'inventory_parts', editingPartId), {
          ...basePayload,
          nom: baseNom
        });
      } else {
        if (qty === 1) {
          // Création d'une pièce unique
          await addDoc(collection(db, 'inventory_parts'), {
            ...basePayload,
            nom: baseNom
          });
        } else {
          // Création de N pièces indépendantes et numérotées
          const explicitMatch = baseNom.match(/^(.*?)\s*#(\d+)$/);
          let cleanBase = baseNom;
          let startNumber = 1;

          if (explicitMatch) {
            cleanBase = explicitMatch[1].trim();
            startNumber = parseInt(explicitMatch[2], 10);
          } else {
            // Recherche de la numérotation la plus élevée existante pour ce même nom
            const existingMatchingNumbers = (inventoryParts || [])
              .filter(p => p.nom && p.nom.startsWith(`${baseNom} #`))
              .map(p => {
                const match = p.nom.slice(`${baseNom} #`.length).match(/^(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
              });
            const maxExisting = existingMatchingNumbers.length > 0 ? Math.max(...existingMatchingNumbers) : 0;
            startNumber = maxExisting > 0 ? maxExisting + 1 : 1;
          }

          const batch = writeBatch(db);
          const partsRef = collection(db, 'inventory_parts');

          for (let i = 0; i < qty; i++) {
            const num = startNumber + i;
            const newDocRef = doc(partsRef);
            batch.set(newDocRef, {
              ...basePayload,
              nom: `${cleanBase} #${num}`
            });
          }

          await batch.commit();
        }
      }

      setIsPartFormOpen(false);
    } catch (err) {
      console.error("useInventoryData - Erreur sauvegarde pièce détachée :", err);
      alert("Erreur lors de la sauvegarde de la pièce.");
    } finally {
      setSaving(false);
    }
  }, [groupId, partFormData, editingPartId, inventoryParts]);

  // Scinder une pièce existante ayant une quantité > 1 en pièces unitaires indépendantes
  const handleSplitPart = useCallback(async (part) => {
    const qty = parseInt(part.quantite, 10) || 1;
    if (qty <= 1) return;

    const ok = await confirm({
      title: "Scinder la pièce en unités indépendantes",
      message: `La référence « ${part.nom} » compte actuellement ${qty} unités.\n\nSouhaitez-vous la diviser en ${qty} pièces indépendantes afin de pouvoir affecter chaque exemplaire à un projet spécifique ?`,
      confirmText: `Scinder en ${qty} pièces`,
      cancelText: "Annuler",
      variant: "default"
    });

    if (!ok) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const baseNom = part.nom.trim();
      const explicitMatch = baseNom.match(/^(.*?)\s*#(\d+)$/);
      let cleanBase = baseNom;
      let startNumber = 1;

      if (explicitMatch) {
        cleanBase = explicitMatch[1].trim();
        startNumber = parseInt(explicitMatch[2], 10);
      } else {
        cleanBase = baseNom;
        startNumber = 1;
      }

      // 1. Mettre à jour la pièce initiale pour la transformer en exemplaire #1
      const currentDocRef = doc(db, 'inventory_parts', part.id);
      batch.update(currentDocRef, {
        nom: `${cleanBase} #${startNumber}`,
        quantite: 1
      });

      // 2. Créer les (qty - 1) exemplaires supplémentaires indépendants
      const partsRef = collection(db, 'inventory_parts');
      const { id: _ignoreId, ...restPart } = part;

      for (let i = 1; i < qty; i++) {
        const num = startNumber + i;
        const newDocRef = doc(partsRef);
        batch.set(newDocRef, {
          ...restPart,
          nom: `${cleanBase} #${num}`,
          quantite: 1
        });
      }

      await batch.commit();
    } catch (err) {
      console.error("useInventoryData - Erreur lors de la scission de la pièce :", err);
      alert("Erreur lors de la scission de la pièce.");
    } finally {
      setSaving(false);
    }
  }, [confirm]);

  const handleDeletePart = useCallback(async (id) => {
    const ok = await confirm({
      title: t('common.deleteConfirmTitle') || "Supprimer la pièce",
      message: t('common.deleteConfirmMessage') || "Êtes-vous sûr de vouloir supprimer cette pièce détachée ?",
      confirmText: t('common.delete') || "Supprimer",
      cancelText: t('common.cancel') || "Annuler",
      variant: "danger"
    });

    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'inventory_parts', id));
      setIsPartFormOpen(false);
    } catch (err) {
      console.error("useInventoryData - Erreur suppression pièce :", err);
      alert("Erreur lors de la suppression de la pièce.");
    }
  }, [confirm, t]);

  const updatePartWorkflow = useCallback(async (partId, updates) => {
    try {
      await updateDoc(doc(db, 'inventory_parts', partId), updates);
    } catch (err) {
      console.error("useInventoryData - Erreur updatePartWorkflow :", err);
      throw err;
    }
  }, []);

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
    instrumentModels,
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
    handleRejectMovement,

    // Parts
    inventoryParts,
    isPartFormOpen,
    setIsPartFormOpen,
    editingPartId,
    partFormData,
    setPartFormData,
    handleOpenPartAdd,
    handleOpenPartEdit,
    handleSavePart,
    handleDeletePart,
    handleSplitPart,
    updatePartWorkflow
  };
}
