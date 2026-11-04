import { doc, updateDoc } from 'firebase/firestore';
import { getEffectiveEventVotes } from './pollVoteUtils';
import { notifyMembersByTag } from './inAppNotificationService';
import { checkRegistrationDeadlinePassed } from '../hooks/useEventRSVP';

/**
 * Construit le résumé chiffré des inscrits (ou votes 'dispo' d'un sondage) par pupitre.
 */
export function buildEventRegistrationSummary(ev = {}, activeUsers = []) {
  const usersById = new Map();
  activeUsers.forEach((u) => {
    const uid = u.id || u.uid;
    if (uid) usersById.set(uid, u);
  });

  const byPupitre = {};
  let totalCount = 0;

  if (ev.status === 'sondage' || ev.isPoll) {
    const votes = getEffectiveEventVotes(ev);
    Object.entries(votes).forEach(([uid, choice]) => {
      if (choice !== 'dispo') return;
      totalCount++;
      const u = usersById.get(uid);
      const pup = u?.instrumentPrincipal || u?.instrument || u?.instrumentsJoues?.[0] || 'Autre';
      byPupitre[pup] = (byPupitre[pup] || 0) + 1;
    });
  } else {
    const presents = (ev.inscriptions || []).filter((ins) => ins.status === 'present');
    presents.forEach((ins) => {
      totalCount++;
      const u = usersById.get(ins.userId);
      const pup = ins.instrumentChoisi || ins.instrument || u?.instrumentPrincipal || u?.instrument || 'Autre';
      byPupitre[pup] = (byPupitre[pup] || 0) + 1;
    });
  }

  const resumePupitres = Object.entries(byPupitre)
    .map(([p, c]) => `${c} ${p}`)
    .join(', ') || 'Aucun inscrit';

  return { totalInscrits: totalCount, resumePupitres };
}

/**
 * Évalue et exécute une règle 'on_registration_deadline_summary' pour un événement donné.
 */
export async function evaluateDeadlineSummaryForEvent({
  db,
  groupId,
  rule,
  ev,
  activeUsers = [],
  isSimulation = false,
  details = []
}) {
  if (!ev?.dateLimiteInscription || ev.deadlineSummarySent === true) {
    return 0;
  }
  if (!checkRegistrationDeadlinePassed(ev.dateLimiteInscription, ev.dateDebut || ev.date)) {
    return 0;
  }

  const eventName = ev.titre || ev.nom || 'Événement';
  const { totalInscrits, resumePupitres } = buildEventRegistrationSummary(ev, activeUsers);
  const targetTags = Array.isArray(rule.targetTags) && rule.targetTags.length > 0
    ? rule.targetTags
    : ['Mestre', 'CA', 'Bureau'];

  const notifTitle = (rule.titreNotification || `📊 Clôture des inscriptions : ${eventName}`)
    .replace(/\{\{nomEvenement\}\}/g, eventName);
  const notifBody = `${totalInscrits} inscrit(s) (${resumePupitres}). Clique pour consulter ou valider.`;
  const targetUrl = `/app/agenda?eventId=${ev.id}`;

  details.push(
    `📊 [Règle "${rule.titre}"] : Bilan clôture envoyé aux badges [${targetTags.join(', ')}] pour "${eventName}" -> ${notifBody}`
  );

  if (!isSimulation) {
    await updateDoc(doc(db, 'events', ev.id), {
      deadlineSummarySent: true,
      deadlineSummarySentAt: new Date().toISOString()
    });
    const res = await notifyMembersByTag({
      groupId,
      targetTags,
      title: notifTitle,
      message: notifBody,
      type: 'registration_deadline_summary',
      targetUrl
    });
    return res?.notifiedCount || 1;
  }

  return 1;
}
