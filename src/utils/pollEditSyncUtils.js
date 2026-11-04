import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { resolveSlotRegistrationDeadline, extractDayPart, extractTimePart } from './eventScheduleUtils';

/**
 * Normalise et trie les documents frères d'un sondage par optionIndex ou par date.
 */
export function normalizePollSlotsFromDocs(siblingDocs = []) {
  const sorted = [...siblingDocs].sort((a, b) => {
    const idxA = Number(a?.optionIndex);
    const idxB = Number(b?.optionIndex);
    if (!Number.isNaN(idxA) && !Number.isNaN(idxB) && idxA !== idxB) {
      return idxA - idxB;
    }
    return String(a?.dateDebut || a?.date || '').localeCompare(String(b?.dateDebut || b?.date || ''));
  });

  return {
    sortedDocs: sorted,
    pollOptionIds: sorted.map((d) => d.id),
    pollDates: sorted.map((d) => String(d.dateDebut || d.date || '').slice(0, 16))
  };
}

/**
 * Charge depuis Firestore toutes les dates existantes d'un sondage (pollGroupId) pour l'édition.
 */
export async function fetchPollSiblingsForEdit(db, event) {
  if (!db || !event?.pollGroupId) return null;
  const constraints = [where('pollGroupId', '==', event.pollGroupId)];
  if (event.groupId) {
    constraints.push(where('groupId', '==', event.groupId));
  }
  const snap = await getDocs(query(collection(db, 'events'), ...constraints));
  if (snap.empty) return null;

  const rawDocs = [];
  snap.forEach((docSnap) => rawDocs.push({ id: docSnap.id, ...docSnap.data() }));
  const { sortedDocs, pollOptionIds, pollDates } = normalizePollSlotsFromDocs(rawDocs);
  const firstWithPupitres = sortedDocs.find((d) => Array.isArray(d.pollTargetPupitres) && d.pollTargetPupitres.length > 0);

  return {
    siblingDocs: sortedDocs,
    pollOptionIds,
    pollDates,
    pollMode: sortedDocs[0]?.pollMode || event.pollMode || 'single_winner',
    pollTargetPupitres: firstWithPupitres?.pollTargetPupitres || (Array.isArray(event.pollTargetPupitres) ? event.pollTargetPupitres : [])
  };
}

/**
 * Synchronise en writeBatch les créneaux modifiés, ajoutés ou supprimés d'un sondage sans écraser les votes.
 */
export async function syncPollGroupOnSave({ db, event, editForm, sharedUpdates, resolvedGroupId }) {
  const rawDates = Array.isArray(editForm.pollDates) ? editForm.pollDates : [];
  const rawIds = Array.isArray(editForm.pollOptionIds) ? editForm.pollOptionIds : [];
  const validEntries = [];

  rawDates.forEach((d, idx) => {
    const trimmed = String(d || '').trim();
    if (trimmed) {
      validEntries.push({ date: trimmed, docId: rawIds[idx] || null });
    }
  });

  if (validEntries.length < 2) {
    throw new Error('POLL_MIN_TWO_DATES');
  }

  const constraints = [where('pollGroupId', '==', event.pollGroupId)];
  if (event.groupId) constraints.push(where('groupId', '==', event.groupId));
  const pollSnapshot = await getDocs(query(collection(db, 'events'), ...constraints));
  const existingIdsInDb = new Set();
  pollSnapshot.forEach((docSnap) => existingIdsInDb.add(docSnap.id));

  const batch = writeBatch(db);
  const totalOptions = validEntries.length;
  const keptIds = new Set();
  const finalSlotIds = [];

  const slotEndTime = extractTimePart(editForm.dateFin) || '22:00';

  validEntries.forEach((entry, idx) => {
    const optionIndex = idx + 1;
    const slotDeadline = resolveSlotRegistrationDeadline(entry.date, editForm);
    const slotDateFin = entry.date ? `${extractDayPart(entry.date)}T${slotEndTime}` : (sharedUpdates.dateFin || '');

    if (entry.docId && existingIdsInDb.has(entry.docId)) {
      keptIds.add(entry.docId);
      finalSlotIds.push(entry.docId);
      batch.update(doc(db, 'events', entry.docId), {
        ...sharedUpdates,
        date: entry.date,
        dateDebut: entry.date,
        dateFin: slotDateFin,
        dateLimiteInscription: slotDeadline,
        status: 'sondage',
        isPoll: true,
        pollGroupId: event.pollGroupId,
        optionIndex,
        totalOptions
      });
    } else {
      const newSlotRef = doc(collection(db, 'events'));
      finalSlotIds.push(newSlotRef.id);
      batch.set(newSlotRef, {
        ...sharedUpdates,
        groupId: event.groupId || resolvedGroupId,
        date: entry.date,
        dateDebut: entry.date,
        dateFin: slotDateFin,
        dateLimiteInscription: slotDeadline,
        status: 'sondage',
        isPoll: true,
        pollGroupId: event.pollGroupId,
        optionIndex,
        totalOptions,
        pollRestrictionType: event.pollRestrictionType || 'aucun',
        pollTarget: event.pollTarget || '',
        votes: {},
        inscriptions: [],
        covoiturage: { voitures: [], cherchePlace: [] },
        createdAt: event.createdAt || new Date().toISOString()
      });
    }
  });

  const explicitDeleted = Array.isArray(editForm.deletedPollOptionIds) ? editForm.deletedPollOptionIds.filter(Boolean) : [];
  const deletedSet = new Set(explicitDeleted);
  existingIdsInDb.forEach((existingId) => {
    if (!keptIds.has(existingId)) deletedSet.add(existingId);
  });

  const deletedIds = [];
  deletedSet.forEach((delId) => {
    if (!keptIds.has(delId)) {
      deletedIds.push(delId);
      batch.delete(doc(db, 'events', delId));
    }
  });

  const currentEventWasDeleted = deletedIds.includes(event.id);
  const firstRemainingId = finalSlotIds[0] || null;
  if (currentEventWasDeleted && firstRemainingId && typeof window !== 'undefined') {
    const url = new URL(window.location);
    url.searchParams.set('eventId', firstRemainingId);
    window.history.replaceState({ ...window.history.state, eventId: firstRemainingId }, '', url.toString());
  }

  await batch.commit();
  return { currentEventWasDeleted, firstRemainingId, finalSlotIds, validDates: validEntries.map((e) => e.date) };
}
