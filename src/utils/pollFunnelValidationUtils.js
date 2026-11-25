import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { getEffectiveEventVotes } from './pollVoteUtils';
import { cleanFirestorePayload } from './firestoreUtils';
import { normalizeWorkshopPolicy, partitionWorkshopParticipants } from './workshopSanctuaryUtils';

function enrichUsersWithMatrix(allUsersMap, matrix, slotId, pupitres) {
  const enriched = { ...allUsersMap };
  (pupitres || []).forEach((p) => {
    (matrix?.[slotId]?.[p]?.availableMembers || []).forEach((m) => {
      if (m?.uid && !enriched[m.uid]) {
        enriched[m.uid] = { id: m.uid, name: m.name || m.prenom || 'Membre', instrumentPrincipal: m.instrumentChoisi || p };
      }
    });
  });
  return enriched;
}

/** Valide unitairement un créneau de sondage pour un pupitre donné ("En entonnoir") avec tri par pupitre. */
export async function confirmSinglePupitrePollSlot({
  db, pupitre, targetEventId, allowLatecomers = true, otherPupitresPolicy = 'reconfirm',
  matrix = {}, pollOptions = [], event = {}, allUsersMap = {}, pupitresList = [], linkedInstruments = []
}) {
  if (!db || !pupitre || !targetEventId) throw new Error('Paramètres manquants.');
  const slotEv = pollOptions.find((ev) => ev.id === targetEventId);
  if (!slotEv) throw new Error('Créneau cible introuvable.');

  const cleanPolicy = normalizeWorkshopPolicy(otherPupitresPolicy);
  const baseTitre = String(event.titre || slotEv.titre || 'Atelier').replace(/\s*—\s*.*$/, '').trim();
  const mergedAssigned = Array.from(new Set([...(Array.isArray(slotEv.pollAssignedPupitres) ? slotEv.pollAssignedPupitres : []), pupitre]));
  const finalTitre = `${baseTitre} — ${mergedAssigned.join(' & ')}`;
  const enrichedUsers = enrichUsersWithMatrix(allUsersMap, matrix, targetEventId, mergedAssigned);
  const triaged = partitionWorkshopParticipants({
    event: slotEv, targetPupitres: mergedAssigned, policy: cleanPolicy, allUsersMap: enrichedUsers, pupitresList, linkedInstruments, mode: 'poll_validation'
  });

  const slotDateDebut = slotEv.dateDebut || slotEv.date || '';
  const batch = writeBatch(db);
  batch.update(doc(db, 'events', targetEventId), cleanFirestorePayload({
    status: 'confirme', isPoll: false, requiresValidation: false, titre: finalTitre,
    pollAssignedPupitres: mergedAssigned, inscriptions: triaged.inscriptions,
    allowLatecomersForAssignedPupitres: Boolean(allowLatecomers), workshopPollOtherPupitresPolicy: cleanPolicy,
    ...(allowLatecomers && slotDateDebut ? { dateLimiteInscription: slotDateDebut } : {})
  }));

  const historyEntry = { pupitre, eventId: targetEventId, date: slotDateDebut, titre: finalTitre };
  pollOptions.forEach((opt) => {
    if (opt.id === targetEventId || (opt.status && opt.status !== 'sondage')) return;
    const curTargets = Array.isArray(opt.pollTargetPupitres) ? opt.pollTargetPupitres : (event.pollTargetPupitres || []);
    const prevHist = Array.isArray(opt.pollValidatedHistory) ? opt.pollValidatedHistory : (event.pollValidatedHistory || []);
    batch.update(doc(db, 'events', opt.id), {
      pollTargetPupitres: curTargets.filter((p) => p !== pupitre),
      pollValidatedHistory: [...prevHist.filter((h) => h && h.pupitre !== pupitre), historyEntry]
    });
  });

  await batch.commit();
  return { validatedSlot: slotEv, finalTitre, reconfirmRecipients: triaged.reconfirmRecipients, mergedAssigned };
}

/** Valide globalement la répartition par pupitre (tous les pupitres restants d'un coup) avec tri SaaS. */
export async function executeBatchPupitreDispatch({
  db, pollEvents = [], allocation = {}, matrix = {}, targetPupitres = [],
  allowLatecomers = true, otherPupitresPolicy = 'reconfirm', baseTitre = 'Atelier',
  allUsersMap = {}, pupitresList = [], linkedInstruments = []
}) {
  const batch = writeBatch(db);
  const cleanPolicy = normalizeWorkshopPolicy(otherPupitresPolicy);
  const reconfirmSlots = [];

  pollEvents.forEach((slotEv) => {
    if (slotEv.status && slotEv.status !== 'sondage') return;
    const assignedPupitres = (targetPupitres || []).filter((p) => allocation[p] === slotEv.id);
    const slotRef = doc(db, 'events', slotEv.id);
    if (assignedPupitres.length === 0) { batch.delete(slotRef); return; }

    const enrichedUsers = enrichUsersWithMatrix(allUsersMap, matrix, slotEv.id, assignedPupitres);
    const triaged = partitionWorkshopParticipants({
      event: slotEv, targetPupitres: assignedPupitres, policy: cleanPolicy, allUsersMap: enrichedUsers, pupitresList, linkedInstruments, mode: 'poll_validation'
    });
    const slotDateDebut = slotEv.dateDebut || slotEv.date || '';
    const pupitreLabel = assignedPupitres.join(' & ');
    batch.update(slotRef, cleanFirestorePayload({
      titre: `${baseTitre} — ${pupitreLabel}`, status: 'confirme', isPoll: false, requiresValidation: false,
      pollAssignedPupitres: assignedPupitres, inscriptions: triaged.inscriptions,
      allowLatecomersForAssignedPupitres: Boolean(allowLatecomers), workshopPollOtherPupitresPolicy: cleanPolicy,
      ...(allowLatecomers && slotDateDebut ? { dateLimiteInscription: slotDateDebut } : {})
    }));
    if (cleanPolicy === 'reconfirm' && triaged.reconfirmRecipients.length > 0) {
      reconfirmSlots.push({ eventId: slotEv.id, rawDate: slotDateDebut, pupitreLabel, recipientIds: triaged.reconfirmRecipients.map((r) => r.uid) });
    }
  });

  await batch.commit();
  return { reconfirmSlots, policy: cleanPolicy };
}

/** Valide définitivement l'option gagnante unique d'un sondage classique et supprime les autres options. */
export async function executeSingleWinningPollOption({ db, winningOptionEvent, allUsersMap = {}, groupId }) {
  const batch = writeBatch(db);
  const votes = getEffectiveEventVotes(winningOptionEvent);
  const updatedInscriptions = [...(winningOptionEvent.inscriptions || [])];
  Object.keys(votes).filter((uid) => votes[uid] === 'dispo').forEach((uid) => {
    const idx = updatedInscriptions.findIndex((i) => i.userId === uid);
    if (idx >= 0) updatedInscriptions[idx] = { ...updatedInscriptions[idx], status: 'present' };
    else updatedInscriptions.push({ userId: uid, userName: allUsersMap[uid]?.name || 'Membre', status: 'present', timestamp: new Date().toISOString() });
  });
  const preserved = {};
  ['targetGroup', 'reunionPrivacyMode', 'hideAgendaFromNonTarget', 'audience', 'portee'].forEach((k) => {
    if (winningOptionEvent[k] !== undefined) preserved[k] = winningOptionEvent[k];
  });
  batch.update(doc(db, 'events', winningOptionEvent.id), { status: 'confirme', isPoll: false, inscriptions: updatedInscriptions, requiresValidation: false, ...preserved });
  if (winningOptionEvent.pollGroupId && groupId) {
    const snap = await getDocs(query(collection(db, 'events'), where('pollGroupId', '==', winningOptionEvent.pollGroupId), where('groupId', '==', groupId)));
    snap.forEach((d) => { if (d.id !== winningOptionEvent.id && d.data()?.status === 'sondage') batch.delete(d.ref); });
  }
  await batch.commit();
}
