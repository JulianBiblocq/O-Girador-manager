import { resolvePupitreForInstrument } from './tagUtils.js';
import { getEffectiveEventVotes } from './pollVoteUtils.js';

/** Politiques SaaS de gestion des votants hors-pupitre sur les ateliers par pupitre. */
export const WORKSHOP_OTHER_PUPITRES_POLICIES = { RECONFIRM: 'reconfirm', STRICT: 'strict' };

/** Normalise la politique SaaS hors-pupitre ('reconfirm' par défaut | 'strict'). */
export function normalizeWorkshopPolicy(rawPolicy) {
  return rawPolicy === 'strict' ? 'strict' : 'reconfirm';
}

/** Normalise un libellé de pupitre/instrument (sans accents, minuscule, tolérant au pluriel). */
export function normalizePupitreToken(val) {
  if (!val || typeof val !== 'string') return '';
  return val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/s$/i, '');
}

/** Extrait l'instrument principal d'un adhérent avec repli sur son vote/inscription. */
export function resolveMemberPrimaryInstrument(user, fallbackEntry = null) {
  const isInvalid = (v) => !v || typeof v !== 'string' || ['autre', 'en attente', 'en_attente', 'aucun'].includes(v.trim().toLowerCase());
  const candidates = [
    user?.instrumentPrincipal, user?.instrument,
    Array.isArray(user?.instrumentsJoues) ? user.instrumentsJoues[0] : '',
    user?.pratiqueDanse && !user?.pratiquePercussion ? 'Danse' : '',
    fallbackEntry?.instrument, fallbackEntry?.instrumentChoisi
  ];
  const found = candidates.find((c) => !isInvalid(c));
  return found ? String(found).trim() : '';
}

/** Résout la liste des pupitres cibles attribués à un événement d'atelier. */
export function resolveEventTargetPupitres(event, pupitresList = [], linkedInstruments = []) {
  if (!event || typeof event !== 'object') return [];
  if (Array.isArray(event.pollAssignedPupitres) && event.pollAssignedPupitres.length > 0) {
    return event.pollAssignedPupitres.filter(Boolean);
  }
  if (event.pollRestrictionType === 'instrument' && event.pollTarget) return [event.pollTarget];
  if (event.targetPupitre) return [event.targetPupitre];
  if (event.type === 'atelier' && typeof event.titre === 'string' && event.titre.includes(' — ')) {
    const suffix = event.titre.split(' — ').slice(1).join(' — ').trim();
    if (suffix && !/^option\s*\d+/i.test(suffix)) {
      const parts = suffix.split(/\s*(?:&|\+|\/|,)\s*/).map((s) => s.trim()).filter(Boolean);
      const matched = parts.filter((part) => {
        const resolved = resolvePupitreForInstrument(part, pupitresList, linkedInstruments);
        return (pupitresList || []).some((p) => normalizePupitreToken(p) === normalizePupitreToken(resolved || part));
      });
      if (matched.length > 0) return matched;
    }
  }
  return [];
}

/** Vérifie si le pupitre principal d'un membre correspond à l'un des pupitres cibles (avec pupitres liés). */
export function doesMemberMatchTargetPupitres(user, targetPupitres = [], pupitresList = [], linkedInstruments = [], fallbackEntry = null) {
  if (!Array.isArray(targetPupitres) || targetPupitres.length === 0) return true;
  const rawPrimary = resolveMemberPrimaryInstrument(user, fallbackEntry);
  if (!rawPrimary) return false;
  const pool = Array.from(new Set([...(pupitresList || []), ...targetPupitres]));
  const memberToken = normalizePupitreToken(resolvePupitreForInstrument(rawPrimary, pool, linkedInstruments) || rawPrimary);
  const rawToken = normalizePupitreToken(rawPrimary);
  return targetPupitres.some((target) => {
    const targetToken = normalizePupitreToken(resolvePupitreForInstrument(target, pool, linkedInstruments) || target);
    const rawTargetToken = normalizePupitreToken(target);
    return (memberToken && (memberToken === targetToken || memberToken === rawTargetToken)) ||
      (rawToken && (rawToken === targetToken || rawToken === rawTargetToken));
  });
}

/** Trie les participants d'un créneau d'atelier selon le pupitre cible et la politique SaaS ('reconfirm' | 'strict'). */
export function partitionWorkshopParticipants({
  event = {}, targetPupitres = [], policy = 'reconfirm', allUsersMap = {}, pupitresList = [], linkedInstruments = [], mode = 'poll_validation'
}) {
  const cleanPolicy = normalizeWorkshopPolicy(policy);
  const nowIso = new Date().toISOString();
  const votes = getEffectiveEventVotes(event);
  const rawVotesObj = event?.votes && typeof event.votes === 'object' ? event.votes : {};
  const existingIns = Array.isArray(event?.inscriptions) ? event.inscriptions : [];
  const insByUid = new Map(existingIns.filter((i) => i?.userId).map((i) => [i.userId, i]));
  const candidateUids = new Set([
    ...insByUid.keys(),
    ...(mode === 'poll_validation' ? Object.keys(votes).filter((uid) => votes[uid] === 'dispo') : [])
  ]);

  const nextInscriptions = [], titulairesPresent = [], reconfirmRecipients = [], removedStrictUsers = [];
  candidateUids.forEach((uid) => {
    const prev = insByUid.get(uid) || null;
    const rawVote = rawVotesObj[uid] && typeof rawVotesObj[uid] === 'object' ? rawVotesObj[uid] : null;
    const u = allUsersMap[uid] || null;
    const userName = prev?.userName || u?.name || `${u?.prenom || rawVote?.prenom || ''} ${u?.nom || rawVote?.nom || ''}`.trim() || 'Membre';
    const primaryInst = resolveMemberPrimaryInstrument(u, prev || rawVote);
    const isTitular = doesMemberMatchTargetPupitres(u, targetPupitres, pupitresList, linkedInstruments, prev || rawVote);
    const isDispoOrPresent = mode === 'poll_validation'
      ? (votes[uid] === 'dispo' || prev?.status === 'present')
      : (prev?.status === 'present' || prev?.status === 'pending_reconfirm');

    if (isDispoOrPresent) {
      if (isTitular) {
        const entry = { ...(prev || {}), userId: uid, userName, status: 'present', isTargetPupitreMember: true, horsPupitre: false, instrumentChoisi: primaryInst || targetPupitres[0] || 'Autre', timestamp: prev?.timestamp || nowIso };
        nextInscriptions.push(entry);
        titulairesPresent.push(entry);
      } else if (prev?.status === 'present' && prev?.reconfirmedAt && cleanPolicy === 'reconfirm') {
        nextInscriptions.push({ ...prev, isTargetPupitreMember: false, horsPupitre: true });
      } else if (cleanPolicy === 'strict') {
        removedStrictUsers.push({ uid, userName, instrument: primaryInst });
      } else {
        const entry = { ...(prev || {}), userId: uid, userName, status: 'pending_reconfirm', isTargetPupitreMember: false, horsPupitre: false, instrumentChoisi: primaryInst || 'Autre', pendingReconfirmAt: prev?.pendingReconfirmAt || nowIso };
        nextInscriptions.push(entry);
        reconfirmRecipients.push({ uid, userName, instrument: primaryInst });
      }
      return;
    }
    if (prev && !(mode === 'poll_validation' && prev.pollVote === 'indispo' && !isTitular)) nextInscriptions.push(prev);
  });
  return { inscriptions: nextInscriptions, titulairesPresent, reconfirmRecipients, removedStrictUsers, policy: cleanPolicy };
}

/** Calcule la ventilation Titulaires / Autres pupitres / En attente de re-confirmation pour l'affichage fiche. */
export function computeWorkshopAttendanceBreakdown({ event = {}, allUsersMap = {}, pupitresList = [], linkedInstruments = [] }) {
  const targetPupitres = resolveEventTargetPupitres(event, pupitresList, linkedInstruments);
  const titulairesPresents = [], autresPupitresPresents = [], pendingReconfirmList = [];
  (Array.isArray(event?.inscriptions) ? event.inscriptions : []).forEach((ins) => {
    if (!ins?.userId) return;
    const u = allUsersMap[ins.userId] || null;
    if (ins.status === 'pending_reconfirm') { pendingReconfirmList.push({ ins, user: u }); return; }
    if (ins.status !== 'present') return;
    const isTitular = targetPupitres.length > 0 ? (!ins.horsPupitre && doesMemberMatchTargetPupitres(u, targetPupitres, pupitresList, linkedInstruments, ins)) : true;
    if (isTitular) titulairesPresents.push({ ins, user: u });
    else autresPupitresPresents.push({ ins, user: u });
  });
  return { targetPupitres, targetPupitreLabel: targetPupitres.join(' & '), titulairesPresents, autresPupitresPresents, pendingReconfirmList, unconfirmedHorsPupitrePresents: autresPupitresPresents.filter((x) => !x.ins?.reconfirmedAt) };
}
