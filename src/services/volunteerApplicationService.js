import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import {
  normalizeVolunteerApplication,
  applyExternalAssignmentsToBenevolatMap
} from '../utils/volunteerApplicationUtils';

/**
 * Opérations transactionnelles Firestore atomiques entre `volunteer_applications`
 * et `events/{eventId}.covoiturage.benevolatInscrits` (zéro fuite de données sensibles).
 */
function buildCovoituragePayload(rawCovoit = {}, benevolatInscrits = {}) {
  return {
    ...rawCovoit,
    voitures: Array.isArray(rawCovoit.voitures) ? rawCovoit.voitures : [],
    recherchePlace: Array.isArray(rawCovoit.recherchePlace) ? rawCovoit.recherchePlace : [],
    benevolatInscrits
  };
}

export async function acceptVolunteerApplicationTx({ groupId, eventId, app, shiftIds = [], validatorMeta = {} }) {
  if (!groupId || !eventId || !app?.id) return false;
  const cleanIds = Array.from(new Set((shiftIds || []).map((s) => String(s || '').trim()).filter(Boolean)));
  if (cleanIds.length === 0) return false;

  const eventRef = doc(db, 'events', eventId);
  const appRef = doc(db, 'volunteer_applications', app.id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(eventRef);
    if (!snap.exists()) throw new Error('EVENT_NOT_FOUND');
    const rawCovoit = snap.data().covoiturage || {};
    const nextMap = applyExternalAssignmentsToBenevolatMap(rawCovoit.benevolatInscrits || {}, app.id, app, cleanIds);
    tx.update(appRef, { status: 'accepted', assignedShiftIds: cleanIds, updatedAt: new Date().toISOString(), ...validatorMeta });
    tx.update(eventRef, { covoiturage: buildCovoituragePayload(rawCovoit, nextMap) });
  });
  return true;
}

export async function rejectVolunteerApplicationTx({ groupId, eventId, app, validatorMeta = {} }) {
  if (!groupId || !eventId || !app?.id) return false;
  const eventRef = doc(db, 'events', eventId);
  const appRef = doc(db, 'volunteer_applications', app.id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(eventRef);
    tx.update(appRef, { status: 'rejected', assignedShiftIds: [], updatedAt: new Date().toISOString(), ...validatorMeta });
    if (snap.exists()) {
      const rawCovoit = snap.data().covoiturage || {};
      const nextMap = applyExternalAssignmentsToBenevolatMap(rawCovoit.benevolatInscrits || {}, app.id, app, []);
      tx.update(eventRef, { covoiturage: buildCovoituragePayload(rawCovoit, nextMap) });
    }
  });
  return true;
}

export async function createManualExternalVolunteerTx({ groupId, eventId, formPayload, shiftIds = [], validatorMeta = {} }) {
  if (!groupId || !eventId) return false;
  const cleanIds = Array.from(new Set((shiftIds || []).map((s) => String(s || '').trim()).filter(Boolean)));
  if (cleanIds.length === 0 || !String(formPayload?.prenom || '').trim()) return false;

  const nowIso = new Date().toISOString();
  const newAppRef = doc(collection(db, 'volunteer_applications'));
  const eventRef = doc(db, 'events', eventId);
  const docData = normalizeVolunteerApplication({
    ...formPayload, groupId, eventId, status: 'accepted', source: 'manual_internal',
    isFlexible: false, requestedShiftIds: cleanIds, assignedShiftIds: cleanIds, createdAt: nowIso, updatedAt: nowIso, ...validatorMeta
  }, { groupId, eventId, nowIso });

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(eventRef);
    if (!snap.exists()) throw new Error('EVENT_NOT_FOUND');
    const rawCovoit = snap.data().covoiturage || {};
    const nextMap = applyExternalAssignmentsToBenevolatMap(rawCovoit.benevolatInscrits || {}, newAppRef.id, docData, cleanIds);
    tx.set(newAppRef, docData);
    tx.update(eventRef, { covoiturage: buildCovoituragePayload(rawCovoit, nextMap) });
  });
  return true;
}

export async function removeExternalFromShiftTx({ groupId, eventId, shiftId, inscrit }) {
  if (!groupId || !eventId || !shiftId || !inscrit) return false;
  const appId = String(inscrit.applicationId || '').trim();
  const eventRef = doc(db, 'events', eventId);
  const appRef = appId ? doc(db, 'volunteer_applications', appId) : null;

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    const appSnap = appRef ? await tx.get(appRef) : null;
    if (!eventSnap.exists()) throw new Error('EVENT_NOT_FOUND');
    const rawCovoit = eventSnap.data().covoiturage || {};
    const currentMap = rawCovoit.benevolatInscrits || {};
    const filtered = (Array.isArray(currentMap[shiftId]) ? currentMap[shiftId] : [])
      .filter((it) => !(it?.id === inscrit.id || (appId && it?.applicationId === appId)));
    if (appSnap && appSnap.exists()) {
      const nextAssigned = (appSnap.data().assignedShiftIds || []).filter((id) => id !== shiftId);
      tx.update(appRef, { assignedShiftIds: nextAssigned, updatedAt: new Date().toISOString() });
    }
    tx.update(eventRef, { covoiturage: buildCovoituragePayload(rawCovoit, { ...currentMap, [shiftId]: filtered }) });
  });
  return true;
}
