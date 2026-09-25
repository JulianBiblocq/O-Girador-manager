/**
 * Service de notifications internes (In-App) et de diffusion ciblée par badges/étiquettes.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export {
  dispatchInAppAndPushNotification,
  dispatchBulkInAppAndPushNotification
} from './pushQueueService';

export const NOTIFICATION_TYPES = {
  FORUM_MENTION: 'forum_mention',
  FORUM_REPLY: 'forum_reply',
  FORUM_NEW_THREAD: 'forum_new_thread',
  FORUM_MESSAGE: 'forum_message',
  CHAT_DIRECT: 'chat_direct',
  CHAT_GROUP: 'chat_group',
  EVENT_NEW: 'event_new',
  EVENT_ROADMAP: 'event_roadmap',
  EXPENSE_STATUS: 'expense_status',
  ANNOUNCEMENT: 'announcement'
};

/**
 * Crée un document de notification dans users/{userId}/in_app_notifications.
 */
export async function createInAppNotification({
  userId,
  groupId = '',
  type = NOTIFICATION_TYPES.ANNOUNCEMENT,
  titre,
  title,
  message = '',
  targetUrl = '/',
  icon = '🔔',
  priority = 'normal',
  isRead = false,
  read = false,
  createdAt = null
}) {
  if (!userId) return null;
  try {
    const notifsCol = collection(db, 'users', userId, 'in_app_notifications');
    const newDocRef = doc(notifsCol);
    const resolvedTimestamp = createdAt instanceof Timestamp
      ? createdAt
      : (createdAt instanceof Date ? Timestamp.fromDate(createdAt) : serverTimestamp());

    const displayTitle = title || titre || 'Notification';
    await setDoc(newDocRef, {
      id: newDocRef.id,
      notifId: newDocRef.id,
      groupId,
      type,
      title: displayTitle,
      titre: displayTitle,
      message,
      targetUrl,
      icon,
      priority,
      read: Boolean(read || isRead),
      isRead: Boolean(read || isRead),
      createdAt: resolvedTimestamp
    });
    return newDocRef.id;
  } catch (err) {
    console.error(`Erreur création notification in-app (${userId}) :`, err);
    return null;
  }
}

/**
 * Diffuse une notification in-app ciblée aux membres possédant au moins l'un des tags/rôles spécifiés.
 */
export async function notifyMembersByTag({
  groupId,
  tags = [],
  title,
  message,
  targetUrl = '/',
  icon = '🔔',
  priority = 'normal'
}) {
  if (!groupId || !Array.isArray(tags) || tags.length === 0) {
    return { success: false, count: 0, recipientIds: [] };
  }

  const normalizedTargets = tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean);
  if (normalizedTargets.length === 0) return { success: false, count: 0, recipientIds: [] };

  try {
    const usersRef = collection(db, 'users');
    let snapshot = await getDocs(query(usersRef, where('groupId', '==', groupId)));
    if (snapshot.empty && groupId !== groupId.toLowerCase()) {
      snapshot = await getDocs(query(usersRef, where('groupId', '==', groupId.toLowerCase())));
    }

    const recipientIds = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.statutActuel === 'archived') return;

      const userTagList = [
        ...(Array.isArray(data.userTags) ? data.userTags : []),
        ...(Array.isArray(data.tags) ? data.tags : []),
        ...(data.role ? [data.role] : []),
        ...(data.profilRole ? [data.profilRole] : [])
      ]
        .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : (t?.nom || t?.name || t?.label || t?.id || '').trim().toLowerCase()))
        .filter(Boolean);

      if (normalizedTargets.some((target) => userTagList.includes(target))) {
        recipientIds.push(docSnap.id);
      }
    });

    if (recipientIds.length > 0) {
      const batchSize = 400;
      for (let i = 0; i < recipientIds.length; i += batchSize) {
        const chunk = recipientIds.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach((userId) => {
          const notifCol = collection(db, 'users', userId, 'in_app_notifications');
          const newDocRef = doc(notifCol);
          batch.set(newDocRef, {
            id: newDocRef.id,
            notifId: newDocRef.id,
            title: title || '',
            titre: title || '',
            message: message || '',
            targetUrl: targetUrl || '/',
            icon: icon || '🔔',
            priority,
            read: false,
            isRead: false,
            groupId,
            createdAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
    }

    return { success: true, count: recipientIds.length, recipientIds };
  } catch (err) {
    console.error('notifyMembersByTag - Erreur lors de la diffusion :', err);
    return { success: false, count: 0, recipientIds: [], error: err.message };
  }
}
