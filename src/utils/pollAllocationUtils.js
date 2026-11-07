import { resolvePupitreForInstrument } from './tagUtils.js';
import { isMemberArchived } from './memberUtils.js';
import { getEffectiveEventVotes } from './pollVoteUtils.js';

/** Résout le pupitre principal et les pupitres secondaires d'un adhérent */
export function resolveMemberPollPupitres(user, targetPupitres = [], linkedInstruments = []) {
  const rawPrimary = user?.instrumentPrincipal || user?.instrument ||
    (Array.isArray(user?.instrumentsJoues) ? user.instrumentsJoues[0] : '') ||
    (user?.pratiqueDanse ? 'Danse' : '');
  const resolvedPrimary = resolvePupitreForInstrument(rawPrimary, targetPupitres, linkedInstruments);
  const matchedPrimary = (targetPupitres || []).find(
    (p) => p.toLowerCase().trim() === String(resolvedPrimary || '').toLowerCase().trim()
  ) || '';

  const rawSec = [
    user?.instrumentSecondaire,
    ...(Array.isArray(user?.instrumentsJoues) ? user.instrumentsJoues.slice(1) : []),
    ...(user?.pratiqueDanse ? ['Danse'] : [])
  ].filter(Boolean);

  const secondarySet = new Set();
  rawSec.forEach((inst) => {
    const res = resolvePupitreForInstrument(inst, targetPupitres, linkedInstruments);
    const match = (targetPupitres || []).find((p) => p.toLowerCase().trim() === String(res || '').toLowerCase().trim());
    if (match && match !== matchedPrimary) secondarySet.add(match);
  });

  return {
    primaryPupitre: matchedPrimary,
    primaryInstrument: rawPrimary || matchedPrimary,
    secondaryPupitres: Array.from(secondarySet)
  };
}

/** Retourne le pupitre principal résolu d'un adhérent parmi une liste de pupitres cibles */
export function getMemberPrimaryPupitre(user, targetPupitres = [], linkedInstruments = []) {
  const { primaryPupitre, primaryInstrument } = resolveMemberPollPupitres(user, targetPupitres, linkedInstruments);
  return primaryPupitre || primaryInstrument || '';
}

/** Construit la matrice croisée (Dates x Pupitres) avec détails Indispo / Sans réponse */
export function buildPollPupitreMatrix({ pollEvents = [], allUsers = [], targetPupitres = [], linkedInstruments = [] }) {
  const activeMembers = (allUsers || [])
    .filter((u) => u && !isMemberArchived(u))
    .map((u) => {
      const uid = u.id || u.uid;
      const { primaryPupitre, primaryInstrument, secondaryPupitres } = resolveMemberPollPupitres(u, targetPupitres, linkedInstruments);
      return {
        id: uid, uid,
        name: `${u.prenom || ''} ${u.nom || ''}`.trim() || u.displayName || 'Membre',
        prenom: (u.prenom || u.displayName || 'Membre').trim(),
        photoURL: u.photoURL || '',
        primaryPupitre,
        instrumentChoisi: primaryInstrument || primaryPupitre,
        secondaryPupitres
      };
    });

  const validEvents = (pollEvents || []).filter((ev) => ev?.id);
  const votesByEvent = Object.fromEntries(validEvents.map((ev) => [ev.id, getEffectiveEventVotes(ev)]));
  const pupitreStats = {};
  (targetPupitres || []).forEach((p) => {
    const members = activeMembers.filter((m) => m.primaryPupitre === p);
    const totallyUnansweredMembers = members.filter(
      (m) => !validEvents.some((ev) => ['dispo', 'indispo'].includes(votesByEvent[ev.id]?.[m.uid]))
    );
    pupitreStats[p] = {
      members,
      totalPupitre: members.length,
      respondedCount: members.length - totallyUnansweredMembers.length,
      totallyUnansweredMembers
    };
  });

  const matrix = { pupitreStats };
  validEvents.forEach((ev) => {
    const votes = votesByEvent[ev.id] || {};
    matrix[ev.id] = {};
    (targetPupitres || []).forEach((p) => {
      const { members = [], totalPupitre = 0, respondedCount = 0, totallyUnansweredMembers = [] } = pupitreStats[p] || {};
      const availableMembers = members.filter((m) => votes[m.uid] === 'dispo');
      const unavailableMembers = members.filter((m) => votes[m.uid] === 'indispo');
      const unansweredMembers = members.filter((m) => !votes[m.uid]);
      const secondaryAvailableMembers = activeMembers.filter((m) => m.secondaryPupitres.includes(p) && votes[m.uid] === 'dispo');
      const count = availableMembers.length;
      const percentage = Math.round((count / Math.max(1, totalPupitre)) * 100);
      matrix[ev.id][p] = {
        availableMembers, unavailableMembers, unansweredMembers, secondaryAvailableMembers,
        count, totalPupitre, percentage, respondedCount, totallyUnansweredMembers
      };
    });
  });
  return matrix;
}

/** Calcule par backtracking exact l'affectation optimale (1 créneau distinct par pupitre) */
export function computeOptimalPupitreAllocation(matrix = {}, pollEvents = [], targetPupitres = []) {
  const eventIds = (pollEvents || []).map((e) => e.id).filter(Boolean);
  const pupitres = (targetPupitres || []).filter(Boolean);
  if (eventIds.length === 0 || pupitres.length === 0) {
    return { allocation: {}, byEventId: {}, totalPresents: 0, score: 0 };
  }

  let bestScore = -1, bestPresents = 0, bestAllocation = {};
  const currentAlloc = {}, usedDates = new Set();

  const backtrack = (idx, accScore, accPresents) => {
    if (idx === pupitres.length) {
      if (accScore > bestScore) { bestScore = accScore; bestPresents = accPresents; bestAllocation = { ...currentAlloc }; }
      return;
    }
    const p = pupitres[idx];
    const allowReuse = usedDates.size >= eventIds.length;
    for (let i = 0; i < eventIds.length; i++) {
      const evId = eventIds[i];
      if (!allowReuse && usedDates.has(evId)) continue;
      const cell = matrix?.[evId]?.[p] || { count: 0, totalPupitre: 0 };
      const c = cell.count || 0, t = Math.max(1, cell.totalPupitre || 0), wasUsed = usedDates.has(evId);
      usedDates.add(evId);
      currentAlloc[p] = evId;
      backtrack(idx + 1, accScore + c + 0.01 * (c / t), accPresents + c);
      delete currentAlloc[p];
      if (!wasUsed) usedDates.delete(evId);
    }
  };

  backtrack(0, 0, 0);
  const byEventId = Object.fromEntries(eventIds.map((id) => [id, []]));
  Object.entries(bestAllocation).forEach(([p, evId]) => {
    if (!byEventId[evId]) byEventId[evId] = [];
    byEventId[evId].push(p);
  });
  return { allocation: bestAllocation, byEventId, totalPresents: bestPresents, score: Number(bestScore.toFixed(4)) };
}
