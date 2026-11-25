import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { buildPublicCommissionShifts } from '../utils/publicVolunteerUtils';

/**
 * Synchronise la projection publique épurée `publicCommissionShifts` sur `events/{eventId}`
 * à partir de la sous-collection `events/{eventId}/commissions` (zéro budget ni note interne).
 */
export async function syncEventPublicCommissionShifts(eventId, preloadedCommissions = null) {
  const eid = String(eventId || '').trim();
  if (!eid) return [];
  try {
    const eventRef = doc(db, 'events', eid);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) return [];

    const evtData = eventSnap.data() || {};
    const rawDate = String(evtData.date || evtData.dateDebut || '');
    const eventDateJour = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : '';

    let comms = preloadedCommissions;
    if (!Array.isArray(comms)) {
      const commSnap = await getDocs(collection(db, 'events', eid, 'commissions'));
      comms = [];
      commSnap.forEach((d) => comms.push({ id: d.id, ...d.data() }));
    }

    const publicCommissionShifts = buildPublicCommissionShifts(comms, eventDateJour);
    await updateDoc(eventRef, { publicCommissionShifts });
    return publicCommissionShifts;
  } catch (err) {
    console.warn('Synchronisation publicCommissionShifts ignorée :', err?.message || err);
    return [];
  }
}
