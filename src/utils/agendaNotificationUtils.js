/**
 * Utilitaires de notification automatique (In-App + Push FCM) et de provisionnement
 * lors de la création d'un événement ou d'un sondage de dates dans l'Agenda / Réunions.
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { isMemberArchived, isMemberCaOrBureau, getEffectiveMemberTags } from './memberUtils';
import { dispatchBulkInAppAndPushNotification, NOTIFICATION_TYPES } from './inAppNotificationService';

/**
 * Formate une date ISO d'événement de manière lisible pour le corps d'une notification.
 */
function formatEventDateForNotif(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Résout les destinataires actifs de l'association concernés par un nouvel événement ou sondage
 * (hors créateur) et déclenche `dispatchBulkInAppAndPushNotification`.
 */
export async function notifyNewAgendaEventOrPoll({
  groupId, creatorId, titre, description = '', isPoll = false, validDatesCount = 0,
  dateStr = '', firstCreatedEventId, audience = 'publique', pollRestrictionType = 'aucun', pollTarget = ''
}) {
  if (!groupId || !firstCreatedEventId || !titre) return;

  try {
    const groupVariants = Array.from(new Set([groupId, groupId.toLowerCase()].filter(Boolean)));
    const snap = await getDocs(query(collection(db, 'users'), where('groupId', 'in', groupVariants)));
    const canonicalLower = groupId.trim().toLowerCase();
    const recipientIds = [];

    snap.forEach((docSnap) => {
      if (docSnap.id === creatorId) return;
      const u = { id: docSnap.id, ...docSnap.data() };
      if (String(u.groupId || '').trim().toLowerCase() !== canonicalLower) return;
      if (isMemberArchived(u) || u.isDependent) return;

      const roleLower = String(u.role || '').toLowerCase();
      const isPrivileged = ['mestre', 'super-admin', 'admin'].includes(roleLower) || u.isSystemAdmin === true;

      if (audience === 'ca' && !isPrivileged && !isMemberCaOrBureau(u)) {
        return;
      }

      if (isPoll && pollRestrictionType === 'badge' && pollTarget && !isPrivileged) {
        const targetLower = pollTarget.trim().toLowerCase();
        const memberTags = getEffectiveMemberTags(u).map((t) => String(t).toLowerCase());
        if (!memberTags.includes(targetLower)) return;
      }

      recipientIds.push(docSnap.id);
    });

    if (recipientIds.length === 0) return;

    const cleanTitle = titre.trim();
    const cleanDesc = (description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const targetUrl = `/app/agenda?eventId=${firstCreatedEventId}`;

    if (isPoll) {
      await dispatchBulkInAppAndPushNotification({
        recipientIds,
        groupId,
        type: NOTIFICATION_TYPES.EVENT_NEW,
        titre: `📊 Nouveau sondage : ${cleanTitle} (${validDatesCount} dates proposées)`,
        message: cleanDesc ? cleanDesc.slice(0, 110) : "Indiquez vos disponibilités dans l'Agenda.",
        targetUrl,
        sendPush: true
      });
    } else {
      const formattedDate = formatEventDateForNotif(dateStr);
      const bodyMsg = formattedDate
        ? `📅 ${formattedDate}${cleanDesc ? ` — ${cleanDesc.slice(0, 80)}` : ''}`
        : cleanDesc.slice(0, 110) || "Un nouvel événement a été ajouté à l'agenda.";

      await dispatchBulkInAppAndPushNotification({
        recipientIds,
        groupId,
        type: NOTIFICATION_TYPES.EVENT_NEW,
        titre: `📅 Nouvel événement : ${cleanTitle}`,
        message: bodyMsg,
        targetUrl,
        sendPush: true
      });
    }
  } catch (err) {
    console.warn('agendaNotificationUtils - Erreur notification création événement :', err);
  }
}

/**
 * Déclenche en arrière-plan le provisionnement Framaspace d'un événement créé.
 */
export function triggerFramaspaceEventProvisioning({ eventId, groupId, titre, type, dateVal, publierSurVaral }) {
  if (!eventId || !groupId) return;
  try {
    const provisionFn = httpsCallable(functions, 'provisionFramaspaceEventFolders');
    provisionFn({
      eventId,
      groupId,
      eventData: {
        id: eventId,
        titre,
        type,
        date: dateVal,
        dateDebut: dateVal,
        groupId,
        activerRecolteMedias: true,
        publierSurVaral: publierSurVaral !== false
      }
    }).catch((provErr) => {
      console.warn('agendaNotificationUtils - Auto-provision Framaspace différé :', provErr?.message);
    });
  } catch (fnErr) {
    console.warn('agendaNotificationUtils - Exception provisionFramaspaceEventFolders :', fnErr?.message);
  }
}
