import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { getEffectiveEventVotes } from './pollVoteUtils';

/** Valide unitairement un créneau de sondage pour un pupitre donné ("En entonnoir"). */
export async function confirmSinglePupitrePollSlot({
  db, pupitre, targetEventId, allowLatecomers = true, matrix = {}, pollOptions = [], event = {}
}) {
  if (!db || !pupitre || !targetEventId) throw new Error('Paramètres manquants.');
  const slotEv = pollOptions.find((ev) => ev.id === targetEventId);
  if (!slotEv) throw new Error('Créneau cible introuvable.');

  const baseTitre = String(event.titre || slotEv.titre || 'Atelier').replace(/\s*—\s*.*$/, '').trim();
  const existingAssigned = Array.isArray(slotEv.pollAssignedPupitres) ? slotEv.pollAssignedPupitres : [];
  const mergedAssigned = Array.from(new Set([...existingAssigned, pupitre]));
  const finalTitre = `${baseTitre} — ${mergedAssigned.join(' & ')}`;

  const existingMap = new Map((slotEv.inscriptions || []).map((ins) => [ins.userId, ins]));
  const members = matrix?.[targetEventId]?.[pupitre]?.availableMembers || [];
  members.forEach((m) => {
    if (!m.uid) return;
    existingMap.set(m.uid, {
      ...(existingMap.get(m.uid) || {}),
      userId: m.uid,
      userName: m.name || m.prenom || 'Membre',
      instrument: m.instrument || m.instrumentChoisi || pupitre,
      instrumentChoisi: m.instrumentChoisi || m.instrument || pupitre,
      status: 'present',
      timestamp: new Date().toISOString()
    });
  });

  const slotDateDebut = slotEv.dateDebut || slotEv.date || '';
  const batch = writeBatch(db);
  const targetUpdate = {
    status: 'confirme', isPoll: false, requiresValidation: false, titre: finalTitre,
    pollAssignedPupitres: mergedAssigned, inscriptions: Array.from(existingMap.values()),
    allowLatecomersForAssignedPupitres: Boolean(allowLatecomers)
  };
  if (allowLatecomers && slotDateDebut) targetUpdate.dateLimiteInscription = slotDateDebut;
  batch.update(doc(db, 'events', targetEventId), targetUpdate);

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
  return { validatedSlot: slotEv, finalTitre };
}

/** Valide globalement la répartition par pupitre (tous les pupitres restants d'un coup). */
export async function executeBatchPupitreDispatch({
  db, pollEvents = [], allocation = {}, matrix = {}, targetPupitres = [], allowLatecomers = true, baseTitre = 'Atelier'
}) {
  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  pollEvents.forEach((slotEv) => {
    if (slotEv.status && slotEv.status !== 'sondage') return;
    const assignedPupitres = (targetPupitres || []).filter((p) => allocation[p] === slotEv.id);
    const slotRef = doc(db, 'events', slotEv.id);
    if (assignedPupitres.length === 0) { batch.delete(slotRef); return; }

    const updatedInscriptions = [...(slotEv.inscriptions || [])];
    assignedPupitres.forEach((p) => {
      (matrix?.[slotEv.id]?.[p]?.availableMembers || []).forEach((m) => {
        const idx = updatedInscriptions.findIndex((i) => i.userId === m.uid);
        const entry = {
          userId: m.uid, userName: m.name || 'Membre', status: 'present',
          instrumentChoisi: m.instrumentChoisi || p || 'Autre', timestamp: nowIso
        };
        if (idx >= 0) updatedInscriptions[idx] = { ...updatedInscriptions[idx], ...entry };
        else updatedInscriptions.push(entry);
      });
    });

    const slotDateDebut = slotEv.dateDebut || slotEv.date || '';
    const payload = {
      titre: `${baseTitre} — ${assignedPupitres.join(' & ')}`,
      status: 'confirme', isPoll: false, requiresValidation: false,
      pollAssignedPupitres: assignedPupitres, inscriptions: updatedInscriptions,
      allowLatecomersForAssignedPupitres: Boolean(allowLatecomers)
    };
    if (allowLatecomers && slotDateDebut) payload.dateLimiteInscription = slotDateDebut;
    batch.update(slotRef, payload);
  });

  await batch.commit();
}

/** Valide définitivement l'option gagnante unique d'un sondage classique et supprime les autres options. */
export async function executeSingleWinningPollOption({ db, winningOptionEvent, allUsersMap = {}, groupId }) {
  const batch = writeBatch(db);
  const votes = getEffectiveEventVotes(winningOptionEvent);
  const dispoUserIds = Object.keys(votes).filter((uid) => votes[uid] === 'dispo');
  const updatedInscriptions = [...(winningOptionEvent.inscriptions || [])];

  dispoUserIds.forEach((uid) => {
    const existingIdx = updatedInscriptions.findIndex((i) => i.userId === uid);
    const uInfo = allUsersMap[uid];
    if (existingIdx >= 0) updatedInscriptions[existingIdx] = { ...updatedInscriptions[existingIdx], status: 'present' };
    else updatedInscriptions.push({ userId: uid, userName: uInfo?.name || 'Membre', status: 'present', timestamp: new Date().toISOString() });
  });

  batch.update(doc(db, 'events', winningOptionEvent.id), {
    status: 'confirme', isPoll: false, inscriptions: updatedInscriptions, requiresValidation: false
  });
  if (winningOptionEvent.pollGroupId && groupId) {
    const snap = await getDocs(query(collection(db, 'events'), where('pollGroupId', '==', winningOptionEvent.pollGroupId), where('groupId', '==', groupId)));
    snap.forEach((docSnap) => {
      if (docSnap.id !== winningOptionEvent.id && docSnap.data()?.status === 'sondage') batch.delete(docSnap.ref);
    });
  }
  await batch.commit();
}
