import { dispatchBulkInAppAndPushNotification, NOTIFICATION_TYPES } from './inAppNotificationService';
import { getEffectiveEventVotes } from './pollVoteUtils';

/**
 * Envoie une relance In-App + Push FCM aux membres n'ayant voté sur aucun créneau du sondage.
 */
export async function sendPollUnansweredReminder({
  groupId,
  firstPollEventId,
  eventTitle = 'Atelier',
  pupitreLabel = 'Tous les pupitres',
  unansweredMembers = []
}) {
  const recipientIds = Array.from(
    new Set((unansweredMembers || []).map((m) => m?.uid || m?.id).filter(Boolean))
  );
  if (!groupId || recipientIds.length === 0) return 0;

  const cleanTitle = String(eventTitle || 'Atelier').replace(/\s*—\s*Option\s*\d+.*$/i, '').trim() || 'Atelier';
  const targetUrl = firstPollEventId ? `/app/agenda?eventId=${firstPollEventId}` : '/app/agenda';

  await dispatchBulkInAppAndPushNotification({
    recipientIds,
    groupId,
    type: NOTIFICATION_TYPES.EVENT_NEW,
    title: '⏳ Sondage de date : ton avis est attendu',
    message: `Pense à indiquer tes disponibilités pour « ${cleanTitle} » (${pupitreLabel}).`,
    targetUrl,
    icon: '⏳',
    sendPush: true
  });

  return recipientIds.length;
}

/**
 * Notifie automatiquement les membres intéressés (présents + sans-réponse si retardataires autorisés,
 * en excluant les indisponibles) lorsqu'un créneau est validé pour un ou plusieurs pupitres.
 */
export async function notifyInterestedMembersOnPupitreSlotValidated({
  groupId,
  targetEventId,
  validatedEventTitle = 'Atelier',
  formattedDate = '',
  pupitreLabel = '',
  availableMembers = [],
  unansweredMembers = [],
  allowLatecomers = true
}) {
  const interestedPool = [
    ...(availableMembers || []),
    ...(allowLatecomers ? (unansweredMembers || []) : [])
  ];
  const recipientIds = Array.from(
    new Set(interestedPool.map((m) => m?.uid || m?.id).filter(Boolean))
  );
  if (!groupId || recipientIds.length === 0) return 0;

  const targetUrl = targetEventId ? `/app/agenda?eventId=${targetEventId}` : '/app/agenda';
  const suffix = allowLatecomers
    ? ' Les inscriptions restent ouvertes aux retardataires jusqu’au jour de l’atelier.'
    : '';

  await dispatchBulkInAppAndPushNotification({
    recipientIds,
    groupId,
    type: NOTIFICATION_TYPES.EVENT_NEW,
    title: `📅 Date retenue : ${validatedEventTitle}`,
    message: `Le créneau du ${formattedDate} est retenu pour ${pupitreLabel || validatedEventTitle}.${suffix}`,
    targetUrl,
    icon: '📅',
    sendPush: true
  });

  return recipientIds.length;
}

/**
 * Notifie les membres intéressés pour chaque créneau retenu lors d'une validation groupée par lot.
 */
export async function notifyInterestedMembersOnBatchDispatch({
  groupId,
  pollEvents = [],
  allocation = {},
  matrix = {},
  targetPupitres = [],
  allowLatecomers = true,
  baseTitre = 'Atelier',
  formatDate
}) {
  if (!groupId) return 0;
  let totalNotified = 0;

  for (const slotEv of pollEvents) {
    if (slotEv.status && slotEv.status !== 'sondage') continue;
    const assignedPupitres = (targetPupitres || []).filter((p) => allocation[p] === slotEv.id);
    if (assignedPupitres.length === 0) continue;

    const availableMembers = [];
    const unansweredMembers = [];
    assignedPupitres.forEach((p) => {
      const cell = matrix?.[slotEv.id]?.[p] || {};
      availableMembers.push(...(cell.availableMembers || []));
      unansweredMembers.push(...(cell.unansweredMembers || []));
    });

    const pupitreLabel = assignedPupitres.join(' & ');
    const validatedEventTitle = `${baseTitre} — ${pupitreLabel}`;
    const rawDate = slotEv.dateDebut || slotEv.date || '';
    const formattedDate = typeof formatDate === 'function' ? formatDate(rawDate) : rawDate;

    totalNotified += await notifyInterestedMembersOnPupitreSlotValidated({
      groupId,
      targetEventId: slotEv.id,
      validatedEventTitle,
      formattedDate,
      pupitreLabel,
      availableMembers,
      unansweredMembers,
      allowLatecomers
    });
  }
  return totalNotified;
}

/**
 * Notifie les membres ayant voté disponible lors de la validation d'une option gagnante unique.
 */
export async function notifyInterestedMembersOnSingleWinner({
  groupId,
  winningOptionEvent = {},
  formattedDate = ''
}) {
  if (!groupId || !winningOptionEvent?.id) return 0;
  const votes = getEffectiveEventVotes(winningOptionEvent);
  const dispoIds = Object.keys(votes).filter((uid) => votes[uid] === 'dispo');
  if (dispoIds.length === 0) return 0;

  const validatedEventTitle = String(winningOptionEvent.titre || 'Réunion')
    .replace(/\s*—\s*Option\s*\d+.*$/i, '')
    .trim();

  await dispatchBulkInAppAndPushNotification({
    recipientIds: dispoIds,
    groupId,
    type: NOTIFICATION_TYPES.EVENT_NEW,
    title: `📅 Date retenue : ${validatedEventTitle}`,
    message: `Le créneau du ${formattedDate} est retenu et confirmé dans l'agenda.`,
    targetUrl: `/app/agenda?eventId=${winningOptionEvent.id}`,
    icon: '📅',
    sendPush: true
  });

  return dispoIds.length;
}

