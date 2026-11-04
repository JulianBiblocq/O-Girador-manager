import { doc, writeBatch } from 'firebase/firestore';
import { getMemberPrimaryPupitre } from './pollAllocationUtils';
import { getEffectiveEventVotes } from './pollVoteUtils';
import { isMemberArchived } from './memberUtils';
import { notifyMembersByTag } from './inAppNotificationService';

/**
 * Normalise une clé de pupitre pour construire un champ booléen sûr dans Firestore.
 */
function buildPupitreNotifiedFieldKey(pupitre = '') {
  const slug = String(pupitre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  return `pollFullPupitreNotified_${slug}`;
}

/**
 * Vérifie après un vote sur un sondage 'pupitre_dispatch' si 100 % des membres actifs
 * du pupitre du votant ont répondu ('dispo' ou 'indispo') et notifie immédiatement le Mestre.
 */
export async function checkAndNotifyFullPupitreParticipation({
  db,
  pollOptions = [],
  event = {},
  voterUid,
  updatedOptionId,
  updatedVotesForOption,
  effectiveAllUsers = [],
  pupitresList = [],
  linkedInstruments = [],
  formatDate
}) {
  try {
    if (!db || !voterUid || !Array.isArray(pollOptions) || pollOptions.length === 0) return false;
    const isDispatch = (event.pollMode || pollOptions[0]?.pollMode) === 'pupitre_dispatch';
    if (!isDispatch) return false;

    const targetPupitres = Array.isArray(event.pollTargetPupitres) && event.pollTargetPupitres.length > 0
      ? event.pollTargetPupitres
      : (Array.isArray(pollOptions[0]?.pollTargetPupitres) && pollOptions[0].pollTargetPupitres.length > 0
          ? pollOptions[0].pollTargetPupitres
          : pupitresList);

    const voterProfile = effectiveAllUsers.find((u) => (u.id || u.uid) === voterUid);
    if (!voterProfile) return false;

    const voterPupitre = getMemberPrimaryPupitre(voterProfile, targetPupitres, linkedInstruments);
    if (!voterPupitre || !targetPupitres.includes(voterPupitre)) return false;

    const notifiedKey = buildPupitreNotifiedFieldKey(voterPupitre);
    const alreadyNotified = Boolean(
      event[notifiedKey] || pollOptions.some((opt) => opt && opt[notifiedKey] === true)
    );
    if (alreadyNotified) return false;

    const activePupitreMembers = effectiveAllUsers.filter((u) => {
      if (!u || isMemberArchived(u)) return false;
      const uid = u.id || u.uid;
      if (!uid) return false;
      return getMemberPrimaryPupitre(u, targetPupitres, linkedInstruments) === voterPupitre;
    });

    const totalMembers = activePupitreMembers.length;
    if (totalMembers === 0) return false;

    const openOptions = pollOptions.filter((opt) => !opt.status || opt.status === 'sondage');
    if (openOptions.length === 0) return false;

    const getVotesForOpt = (opt) => {
      if (opt.id === updatedOptionId && updatedVotesForOption) return updatedVotesForOption;
      return getEffectiveEventVotes(opt);
    };

    const allHaveVoted = activePupitreMembers.every((member) => {
      const uid = member.id || member.uid;
      return openOptions.some((opt) => {
        const v = getVotesForOpt(opt)?.[uid];
        return v === 'dispo' || v === 'indispo';
      });
    });

    if (!allHaveVoted) return false;

    let bestOpt = openOptions[0];
    let bestCount = -1;
    openOptions.forEach((opt) => {
      const votes = getVotesForOpt(opt);
      const count = activePupitreMembers.filter((m) => votes?.[m.id || m.uid] === 'dispo').length;
      if (count > bestCount) {
        bestCount = count;
        bestOpt = opt;
      }
    });

    const bestDateLabel = typeof formatDate === 'function'
      ? formatDate(bestOpt.dateDebut || bestOpt.date)
      : (bestOpt.dateDebut || bestOpt.date || 'Créneau');

    const batch = writeBatch(db);
    openOptions.forEach((opt) => {
      batch.update(doc(db, 'events', opt.id), { [notifiedKey]: true });
    });
    await batch.commit();

    const groupId = event.groupId || pollOptions[0]?.groupId;
    if (groupId) {
      await notifyMembersByTag({
        groupId,
        targetTags: ['Mestre', 'mestre', 'CA', 'Bureau'],
        title: `🎯 Pupitre ${voterPupitre} : 100 % ont voté !`,
        message: `Tous les joueurs de ${voterPupitre} (${totalMembers}/${totalMembers}) ont répondu sur ${event.titre || 'le sondage'}. Meilleur créneau : ${bestDateLabel} (${bestCount} dispo). Clique pour valider ce créneau.`,
        type: 'poll_pupitre_100',
        targetUrl: `/app/agenda?eventId=${event.id}`
      });
    }
    return true;
  } catch (err) {
    console.warn('checkAndNotifyFullPupitreParticipation - Erreur non bloquante :', err);
    return false;
  }
}
