import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, doc, getDoc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  calculateCommissionProgress,
  calculateGlobalCommissionStats,
  prepareCommissionData,
  NEXT_JALON_STATUS
} from '../components/event-details/commissions/commissionUtils';
import { notifyBudgetApprovalRequest, notifyBudgetVerdict } from '../utils/commissionNotificationService';
import { syncCommissionToVaral } from '../utils/commissionVaralAdapter';

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
    const unsubscribe = onSnapshot(commissionsRef, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setCommissions(items);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Erreur écoute commissions événement:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // 2. Progression & statistiques mémoïsées
  const getCommissionProgress = useCallback((comm) => calculateCommissionProgress(comm), []);
  const stats = useMemo(() => calculateGlobalCommissionStats(commissions), [commissions]);

  // 3. Méthodes CRUD
  const addCommission = useCallback(async (targetEventId, commissionData) => {
    const eid = targetEventId || eventId;
    if (!eid) throw new Error("ID d'événement manquant");
    const docData = prepareCommissionData(commissionData);
    const docRef = await addDoc(collection(db, 'events', eid, 'commissions'), docData);
    return docRef.id;
  }, [eventId]);

  const updateCommission = useCallback(async (targetEventId, commissionId, partialData) => {
    const eid = targetEventId || eventId;
    if (!eid || !commissionId) throw new Error("Identifiants manquants");
    await updateDoc(doc(db, 'events', eid, 'commissions', commissionId), {
      ...partialData,
      derniereModif: new Date().toISOString()
    });
  }, [eventId]);

  const deleteCommission = useCallback(async (targetEventId, commissionId) => {
    const eid = targetEventId || eventId;
    if (!eid || !commissionId) throw new Error("Identifiants manquants");
    await deleteDoc(doc(db, 'events', eid, 'commissions', commissionId));
  }, [eventId]);

  const toggleJalonStatus = useCallback(async (targetEventId, commissionId, jalonId) => {
    const eid = targetEventId || eventId;
    const comm = commissions.find((c) => c.id === commissionId);
    if (!eid || !comm) return;

    const updatedJalons = (comm.jalons || []).map((j) => (
      j.id === jalonId ? { ...j, status: NEXT_JALON_STATUS[j.status] || 'a_faire' } : j
    ));
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

    const effGroupId = meta.groupId || eventData?.groupId;
    const effEventTitle = meta.eventTitle || eventData?.titre || eventData?.title || 'Événement';
    if (effGroupId) {
      notifyBudgetApprovalRequest({
        eventId: eid, eventTitle: effEventTitle,
        commission: { ...comm, budget: updatedBudget },
        montantDemande, groupId: effGroupId
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

    const effGroupId = groupId || eventData?.groupId;
    if (effGroupId) {
      notifyBudgetVerdict({
        eventId: eid, commission: { ...comm, budget: updatedBudget },
        alloue, approuve, motifRefus, groupId: effGroupId
      }).catch((e) => console.warn('Avertissement notification verdict :', e));
    }
  }, [eventId, commissions, updateCommission, eventData]);

  // 4. Action de publication d'une commission sur le Varal (Passerelle Commissions ➔ Varal)
  const publishCommissionToVaral = useCallback(async (targetEventId, commissionId, options = {}) => {
    let eid = eventId;
    let cid = targetEventId;
    let opts = options;

    if (typeof targetEventId === 'string' && typeof commissionId === 'string') {
      eid = targetEventId;
      cid = commissionId;
    } else if (typeof commissionId === 'object' && commissionId !== null) {
      opts = commissionId;
    }

    if (!eid || !cid) throw new Error("Identifiants eventId et commissionId requis pour publier au Varal");

    let comm = commissions.find((c) => c.id === cid);
    if (!comm) {
      const snap = await getDoc(doc(db, 'events', eid, 'commissions', cid));
      if (snap.exists()) comm = { id: snap.id, ...snap.data() };
    }
    if (!comm) throw new Error(`Commission introuvable : ${cid}`);

    let ev = eventData;
    if (!ev || !ev.id) {
      const evSnap = await getDoc(doc(db, 'events', eid));
      ev = evSnap.exists() ? { id: evSnap.id, ...evSnap.data() } : { id: eid, titre: 'Événement' };
    }

    const effGroupId = opts.groupId || ev.groupId || 'default';
    return await syncCommissionToVaral({
      event: ev, commission: comm,
      referentsNames: opts.referentsNames || [],
      usersMap: opts.usersMap || {},
      groupId: effGroupId
    });
  }, [eventId, eventData, commissions]);

  return {
    commissions, loading, error, stats,
    getCommissionProgress, addCommission, updateCommission, deleteCommission,
    toggleJalonStatus, submitBudgetForApproval, arbitrateBudget,
    publishCommissionToVaral
  };
}

export default useEventCommissions;
