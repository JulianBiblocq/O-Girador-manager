import { collection, doc, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import {
  dispatchBulkInAppAndPushNotification,
  getActiveGroupMembers,
  NOTIFICATION_TYPES
} from './inAppNotificationService';
import { getEffectiveMemberTags } from './memberUtils';
import { canUserSeeReunionInAgenda } from './reunionPrivacyUtils';

/**
 * Supprime un événement (ou l'intégralité des créneaux d'un sondage partageant le même `pollGroupId`)
 * et envoie, uniquement si `sendPush === true`, une notification d'annulation aux membres concernés.
 */
export async function executeEventOrPollDeletion({
  db,
  event,
  actorUid = null,
  sendPush = false
}) {
  if (!db || !event?.id) return { deletedCount: 0 };

  const groupId = event.groupId || null;
  const isPoll = Boolean(event.pollGroupId);

  // 1. Suppression atomique en base Firestore (sondage complet ou date unitaire)
  let deletedCount = 0;
  if (isPoll && groupId) {
    const q = query(
      collection(db, 'events'),
      where('groupId', '==', groupId),
      where('pollGroupId', '==', event.pollGroupId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(doc(db, 'events', docSnap.id));
        deletedCount += 1;
      });
      await batch.commit();
    }
  }

  if (deletedCount === 0) {
    await deleteDoc(doc(db, 'events', event.id));
    deletedCount = 1;
  }

  // 2. Notification optionnelle aux membres actifs éligibles (si sendPush === true)
  if (sendPush && groupId) {
    try {
      const activeMembers = await getActiveGroupMembers(groupId, actorUid);
      const recipientIds = [];

      activeMembers.forEach((u) => {
        const userTags = getEffectiveMemberTags(u);
        if (event.type === 'reunion' && !canUserSeeReunionInAgenda(event, u, userTags)) {
          return;
        }
        recipientIds.push(u.id);
      });

      if (recipientIds.length > 0) {
        const titleStr = event.titre || event.title || 'Événement';
        const rawDate = event.dateDebut || event.date || '';
        const formattedDate = rawDate
          ? new Date(rawDate).toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        const notifTitle = isPoll
          ? `🗑️ Sondage supprimé : ${titleStr}`
          : `🗑️ Événement supprimé : ${titleStr}`;
        const notifBody = isPoll
          ? `Le sondage "${titleStr}" a été retiré de l'agenda.`
          : formattedDate
            ? `La date du ${formattedDate} a été retirée de l'agenda.`
            : `"${titleStr}" a été retiré de l'agenda.`;

        await dispatchBulkInAppAndPushNotification({
          recipientIds,
          groupId,
          type: NOTIFICATION_TYPES.SYSTEM,
          titre: notifTitle,
          message: notifBody,
          targetUrl: '/app/agenda',
          icon: '🗑️',
          sendPush: true
        });
      }
    } catch (notifErr) {
      console.warn('eventDeletionUtils - Erreur notification suppression événement :', notifErr);
    }
  }

  return { deletedCount };
}
