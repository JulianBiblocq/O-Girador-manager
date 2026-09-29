import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  calculateCommissionProgress,
  calculateGlobalCommissionStats,
  prepareCommissionData,
  NEXT_JALON_STATUS
} from '../components/event-details/commissions/commissionUtils';
import {
  notifyBudgetApprovalRequest,
  notifyBudgetVerdict
} from '../utils/commissionNotificationService';

/**
 * Hook personnalisé gérant la sous-collection des Commissions d'un Événement (Bloc 1 & 2)
 * Chemin Firestore : events/{eventId}/commissions/{commissionId}
 *
 * @param {string} eventId Identifiant unique de l'événement
 * @param {Object} [eventData] Métadonnées optionnelles de l'événement (groupId, titre, etc.)
 * @returns {Object} États, statistiques mémoïsées et méthodes CRUD
 */
export function useEventCommissions(eventId, eventData = null) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [error, setError] = useState(null);

  // 1. Abonnement temps réel à la sous-collection
  useEffect(() => {
    if (!eventId) {
      setCommissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const commissionsRef = collection(db, 'events', eventId, 'commissions');

    const unsubscribe = onSnapshot(
      commissionsRef,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCommissions(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur écoute commissions événement:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  // 2. Calcul du taux de progression d'une commission
  const getCommissionProgress = useCallback((commission) => {
    return calculateCommissionProgress(commission);
  }, []);

  // 3. Calculs statistiques et baromètre de santé global mémoïsés
  const stats = useMemo(() => {
    return calculateGlobalCommissionStats(commissions);
  }, [commissions]);

  // 4. Méthodes CRUD
  const addCommission = useCallback(async (targetEventId, commissionData) => {
    const eid = targetEventId || eventId;
    if (!eid) throw new Error("ID d'événement manquant");

    const docData = prepareCommissionData(commissionData);
    const colRef = collection(db, 'events', eid, 'commissions');
    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  }, [eventId]);

  const updateCommission = useCallback(async (targetEventId, commissionId, partialData) => {
    const eid = targetEventId || eventId;
    if (!eid || !commissionId) throw new Error("Identifiants manquants");

    const docRef = doc(db, 'events', eid, 'commissions', commissionId);
    const updatePayload = {
      ...partialData,
      derniereModif: new Date().toISOString()
    };
    await updateDoc(docRef, updatePayload);
  }, [eventId]);

  const deleteCommission = useCallback(async (targetEventId, commissionId) => {
    const eid = targetEventId || eventId;
    if (!eid || !commissionId) throw new Error("Identifiants manquants");

    const docRef = doc(db, 'events', eid, 'commissions', commissionId);
    await deleteDoc(docRef);
  }, [eventId]);

  const toggleJalonStatus = useCallback(async (targetEventId, commissionId, jalonId) => {
    const eid = targetEventId || eventId;
    const comm = commissions.find((c) => c.id === commissionId);
    if (!eid || !comm) return;

    const updatedJalons = (comm.jalons || []).map((j) => {
      if (j.id === jalonId) {
        return { ...j, status: NEXT_JALON_STATUS[j.status] || 'a_faire' };
      }
      return j;
    });

    await updateCommission(eid, commissionId, { jalons: updatedJalons });
  }, [eventId, commissions, updateCommission]);

  const submitBudgetForApproval = useCallback(async (targetEventId, commissionId, montantDemande, meta = {}) => {
    const eid = targetEventId || eventId;
    const comm = commissions.find((c) => c.id === commissionId);
    if (!eid || !comm) return;

    const updatedBudget = {
      ...(comm.budget || {}),
      demande: Number(montantDemande) || 0,
      statusArbitrage: 'en_attente'
    };

    await updateCommission(eid, commissionId, { budget: updatedBudget });

    const effectiveGroupId = meta.groupId || eventData?.groupId;
    const effectiveEventTitle = meta.eventTitle || eventData?.titre || eventData?.title || 'Événement';
    if (effectiveGroupId) {
      notifyBudgetApprovalRequest({
        eventId: eid,
        eventTitle: effectiveEventTitle,
        commission: { ...comm, budget: updatedBudget },
        montantDemande,
        groupId: effectiveGroupId
      }).catch((e) => console.warn('Avertissement notification arbitrage :', e));
    }
  }, [eventId, commissions, updateCommission, eventData]);

  const arbitrateBudget = useCallback(async (targetEventId, commissionId, { alloue, approuve, motifRefus = '', groupId }) => {
    const eid = targetEventId || eventId;
    const comm = commissions.find((c) => c.id === commissionId);
    if (!eid || !comm) return;

    const updatedBudget = {
      ...(comm.budget || {}),
      alloue: Number(alloue) || 0,
      statusArbitrage: approuve ? 'valide' : 'rejete',
      motifRefus: motifRefus || ''
    };

    await updateCommission(eid, commissionId, { budget: updatedBudget });

    const effectiveGroupId = groupId || eventData?.groupId;
    if (effectiveGroupId) {
      notifyBudgetVerdict({
        eventId: eid,
        commission: { ...comm, budget: updatedBudget },
        alloue,
        approuve,
        motifRefus,
        groupId: effectiveGroupId
      }).catch((e) => console.warn('Avertissement notification verdict :', e));
    }
  }, [eventId, commissions, updateCommission, eventData]);

  return {
    commissions,
    loading,
    error,
    stats,
    getCommissionProgress,
    addCommission,
    updateCommission,
    deleteCommission,
    toggleJalonStatus,
    submitBudgetForApproval,
    arbitrateBudget
  };
}

export default useEventCommissions;
