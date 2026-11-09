/**
 * Service de notifications temps réel :
 * - Diffusion des notifications internes (Cloche 🔔) et Push FCM lors d'un nouveau message
 *   dans la discussion d'un événement.
 * - Écoute temps réel et marquage comme lu.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getEventDiscussionRecipients,
  buildEventDiscussionNotificationPayload
} from '../utils/eventDiscussionNotificationUtils';
import {
  dispatchBulkInAppAndPushNotification,
  getActiveGroupMembers,
  NOTIFICATION_TYPES
} from '../utils/inAppNotificationService';
import { canUserSeeReunionInAgenda } from '../utils/reunionPrivacyUtils';
import { getEffectiveMemberTags } from '../utils/memberUtils';

export { getEventDiscussionRecipients, buildEventDiscussionNotificationPayload };

/**
 * Envoie les notifications internes (users/{uid}/in_app_notifications) ET Push (notifications_queue)
 * à l'ensemble des membres actifs concernés par l'événement (hors auteur du message).
 */
export async function sendEventDiscussionNotifications({
  event,
  authorName,
  text,
  currentUserId,
  groupId
}) {
  if (!event?.id || !text || !currentUserId) return [];

  const resolvedGroupId = groupId || event.groupId || null;
  const recipientSet = new Set(getEventDiscussionRecipients(event, currentUserId));

  // Ajout de 100 % des membres actifs du groupe ayant visibilité sur l'événement
  if (resolvedGroupId) {
    const activeMembers = await getActiveGroupMembers(resolvedGroupId, currentUserId);
    activeMembers.forEach((member) => {
      const memberTags = getEffectiveMemberTags(member);
      if (canUserSeeReunionInAgenda(event, member, memberTags)) {
        recipientSet.add(member.id);
      }
    });
  }

  const recipientIds = Array.from(recipientSet).filter((uid) => uid && uid !== currentUserId);
  if (recipientIds.length === 0) return [];

  const eventTitle = event.titre || event.nom || 'Événement';
  const cleanText = String(text || '').trim();
  const excerpt = cleanText.length > 90 ? `${cleanText.slice(0, 87)}...` : cleanText;
  const senderLabel = authorName || 'Un membre';
  const targetUrl = `/app?eventId=${event.id}&tab=discussion`;

  try {
    await dispatchBulkInAppAndPushNotification({
      recipientIds,
      groupId: resolvedGroupId,
      type: NOTIFICATION_TYPES.FORUM_MESSAGE,
      titre: `💬 ${senderLabel} dans "${eventTitle}"`,
      message: `"${excerpt}"`,
      targetUrl,
      icon: '💬',
      sendPush: true
    });
    return recipientIds;
  } catch (err) {
    console.warn('notificationService - Erreur envoi notifications discussion :', err);
    return [];
  }
}

/**
 * Souscrit en temps réel aux notifications non-lues d'un utilisateur dans `users/{userId}/in_app_notifications`.
 */
export function subscribeToUserNotifications(userId, callback, options = {}) {
  if (!userId || typeof callback !== 'function') return () => {};
  const dbRef = options.dbInstance || db;
  const maxItems = options.maxItems || 30;

  const q = query(
    collection(dbRef, 'users', userId, 'in_app_notifications'),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(items);
    },
    (error) => {
      console.warn('notificationService - Erreur écoute notifications :', error);
    }
  );
}

/**
 * Marque une notification comme lue (`isRead: true` et `read: true`).
 */
export async function markNotificationAsRead(notificationId, userId = null, dbInstance = db) {
  if (!notificationId || !userId) return;
  try {
    await updateDoc(doc(dbInstance, 'users', userId, 'in_app_notifications', notificationId), {
      isRead: true,
      read: true
    });
  } catch (err) {
    console.warn('notificationService - Erreur markNotificationAsRead :', err);
  }
}

/**
 * Marque un lot de notifications comme lues.
 */
export async function markMultipleNotificationsAsRead(notificationIds = [], userId = null, dbInstance = db) {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0 || !userId) return;
  try {
    const batch = writeBatch(dbInstance);
    notificationIds.forEach((id) => {
      if (id) {
        batch.update(doc(dbInstance, 'users', userId, 'in_app_notifications', id), {
          isRead: true,
          read: true
        });
      }
    });
    await batch.commit();
  } catch (err) {
    console.warn('notificationService - Erreur markMultipleNotificationsAsRead :', err);
  }
}
