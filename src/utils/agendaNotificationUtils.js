import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import {
  dispatchBulkInAppAndPushNotification,
  getActiveGroupMembers,
  NOTIFICATION_TYPES
} from './inAppNotificationService';
import { getEffectiveMemberTags } from './memberUtils';
import { canUserSeeReunionInAgenda } from './reunionPrivacyUtils';

/**
 * Notifie les membres actifs éligibles lors de la création d'un événement ou d'un sondage multi-dates.
 * Crée 100 % du temps la notification dans la cloche interne (`in_app_notifications`)
 * et déclenche l'envoi Push FCM si `sendPush !== false`.
 */
export async function notifyNewAgendaEventOrPoll({
  groupId,
  creatorId,
  titre,
  description = '',
  isPoll = false,
  validDatesCount = 0,
  dateStr = '',
  firstCreatedEventId = null,
  audience = 'publique',
  targetGroup = 'all',
  reunionPrivacyMode = 'public',
  hideAgendaFromNonTarget = false,
  pollRestrictionType = 'aucun',
  pollTarget = '',
  sendPush = true
}) {
  if (!groupId || !firstCreatedEventId) return;
  try {
    const activeMembers = await getActiveGroupMembers(groupId, creatorId);
    const recipientIds = [];

    activeMembers.forEach((u) => {
      const userTags = getEffectiveMemberTags(u);
      const canSeeReunion = canUserSeeReunionInAgenda(
        { audience, portee: audience, targetGroup, reunionPrivacyMode, hideAgendaFromNonTarget },
        u,
        userTags
      );
      if (!canSeeReunion) return;

      if (isPoll && pollRestrictionType === 'badge' && pollTarget) {
        const targetNorm = pollTarget.toLowerCase().trim();
        const hasBadge = userTags.some((t) => String(t).toLowerCase().trim() === targetNorm);
        const isHighRole =
          u.role === 'mestre' || u.role === 'super-admin' || u.isSystemAdmin === true;
        if (!hasBadge && !isHighRole) return;
      }

      if (isPoll && pollRestrictionType === 'instrument' && pollTarget) {
        const targetNorm = pollTarget.toLowerCase().trim();
        const userInsts = [
          ...(Array.isArray(u.instrumentsJoues) ? u.instrumentsJoues : []),
          ...(Array.isArray(u.instruments) ? u.instruments : []),
          ...(u.instrument ? [u.instrument] : [])
        ].map((inst) =>
          (typeof inst === 'string' ? inst : inst?.nom || inst?.id || '').toLowerCase().trim()
        );
        const isHighRole =
          u.role === 'mestre' || u.role === 'super-admin' || u.isSystemAdmin === true;
        if (!userInsts.some((i) => i.includes(targetNorm) || targetNorm.includes(i)) && !isHighRole) {
          return;
        }
      }

      recipientIds.push(u.id);
    });

    if (recipientIds.length === 0) return;

    if (isPoll) {
      await dispatchBulkInAppAndPushNotification({
        recipientIds,
        groupId,
        type: NOTIFICATION_TYPES.AGENDA_NEW_POLL,
        titre: `📊 Sondage : ${titre}`,
        message: `${validDatesCount} créneaux proposés — Votez pour vos disponibilités !`,
        targetUrl: `/app?eventId=${firstCreatedEventId}`,
        icon: '📊',
        sendPush: Boolean(sendPush)
      });
    } else {
      const formattedDate = dateStr
        ? new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '';
      await dispatchBulkInAppAndPushNotification({
        recipientIds,
        groupId,
        type: NOTIFICATION_TYPES.AGENDA_NEW_EVENT,
        titre: `📅 Nouvel événement : ${titre}`,
        message: formattedDate || description || "Consultez l'agenda pour vous inscrire.",
        targetUrl: `/app?eventId=${firstCreatedEventId}`,
        icon: '📅',
        sendPush: Boolean(sendPush)
      });
    }
  } catch (notifErr) {
    console.warn('agendaNotificationUtils - Erreur envoi notifications Agenda :', notifErr);
  }
}

/**
 * Notifie l'ensemble des membres actifs lors de la création d'une série de répétitions en lot.
 */
export async function notifyBatchRehearsalsCreated({
  groupId,
  creatorId = null,
  titre = 'Répétition',
  count = 1,
  firstDateStr = '',
  firstCreatedEventId = null,
  sendPush = true
}) {
  if (!groupId || count <= 0) return;
  try {
    const activeMembers = await getActiveGroupMembers(groupId, creatorId);
    const recipientIds = activeMembers.map((m) => m.id);
    if (recipientIds.length === 0) return;

    const firstDateLabel = firstDateStr
      ? new Date(`${firstDateStr}T12:00:00`).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short'
        })
      : '';
    const targetUrl = firstCreatedEventId ? `/app?eventId=${firstCreatedEventId}` : '/app/agenda';

    await dispatchBulkInAppAndPushNotification({
      recipientIds,
      groupId,
      type: NOTIFICATION_TYPES.AGENDA_NEW_EVENT,
      titre: `📅 ${count} ${count > 1 ? 'dates ajoutées' : 'date ajoutée'} : ${titre}`,
      message: firstDateLabel
        ? `À partir du ${firstDateLabel} — Indiquez vos présences dans l'Agenda !`
        : "Consultez l'Agenda pour indiquer vos présences.",
      targetUrl,
      icon: '📅',
      sendPush: Boolean(sendPush)
    });
  } catch (err) {
    console.warn('notifyBatchRehearsalsCreated - Erreur notification lot répétitions :', err);
  }
}

/**
 * Provisionne de manière non-bloquante le dossier Framaspace (Nextcloud) d'un événement.
 */
export function triggerFramaspaceEventProvisioning({
  eventId,
  groupId,
  titre,
  type,
  dateVal,
  publierSurVaral
}) {
  if (!eventId || !groupId) return;
  try {
    const createFramaspaceFn = httpsCallable(functions, 'createFramaspaceEventFolder');
    createFramaspaceFn({
      eventId,
      groupId,
      eventTitle: titre,
      eventType: type || 'prestation',
      eventDate: dateVal || new Date().toISOString(),
      publierSurVaral: publierSurVaral !== undefined ? Boolean(publierSurVaral) : true
    }).catch((framaErr) => {
      console.warn('Avertissement : Provisioning Framaspace différé ou non configuré :', framaErr?.message);
    });
  } catch (callErr) {
    console.warn("Impossible d'appeler createFramaspaceEventFolder :", callErr);
  }
}
