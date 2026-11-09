/**
 * Service de notifications internes (Cloche 🔔) dans `users/{uid}/in_app_notifications`
 * et résolution unifiée des membres actifs du groupe (`getActiveGroupMemberUids`).
 */

import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { isMemberArchived } from './memberUtils';
import { queuePushNotification, queueBulkPushNotification } from './pushQueueService';

export { queuePushNotification, queueBulkPushNotification };

/**
 * Constantes de types de notifications et icônes par défaut.
 */
export const NOTIFICATION_TYPES = {
  FORUM_MESSAGE: 'forum_message',
  FORUM_MENTION: 'forum_mention',
  FORUM_NEW_THREAD: 'forum_new_thread',
  PRIVATE_MESSAGE: 'private_message',
  CHAT_DIRECT: 'chat_direct',
  CHAT_GROUP: 'chat_group',
  CARPOOL_PROPOSAL: 'carpool_proposal',
  CARPOOL_PASSENGER: 'carpool_passenger',
  ROLE_VALIDATION: 'role_validation',
  EXPENSE_REPORT: 'expense_report',
  AGENDA_NEW_EVENT: 'agenda_new_event',
  AGENDA_NEW_POLL: 'agenda_new_poll',
  SYSTEM: 'system'
};

const DEFAULT_ICONS = {
  [NOTIFICATION_TYPES.FORUM_MESSAGE]: '💬',
  [NOTIFICATION_TYPES.FORUM_MENTION]: '🗣️',
  [NOTIFICATION_TYPES.FORUM_NEW_THREAD]: '📢',
  [NOTIFICATION_TYPES.PRIVATE_MESSAGE]: '✉️',
  [NOTIFICATION_TYPES.CHAT_DIRECT]: '✉️',
  [NOTIFICATION_TYPES.CHAT_GROUP]: '👥',
  [NOTIFICATION_TYPES.CARPOOL_PROPOSAL]: '🚗',
  [NOTIFICATION_TYPES.CARPOOL_PASSENGER]: '🙋',
  [NOTIFICATION_TYPES.ROLE_VALIDATION]: '✅',
  [NOTIFICATION_TYPES.EXPENSE_REPORT]: '🧾',
  [NOTIFICATION_TYPES.AGENDA_NEW_EVENT]: '📅',
  [NOTIFICATION_TYPES.AGENDA_NEW_POLL]: '📊',
  [NOTIFICATION_TYPES.SYSTEM]: '🔔'
};

/**
 * Construit les variantes de casse d'un `groupId` (`['Samambaia', 'samambaia']`).
 */
export function buildGroupIdCaseVariants(groupId) {
  const raw = String(groupId || '').trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const cap = lower.charAt(0).toUpperCase() + lower.slice(1);
  return Array.from(new Set([raw, lower, cap])).filter(Boolean);
}

/**
 * Résout 100 % des profils des membres actifs d'une association (insensible à la casse de `groupId`).
 */
export async function getActiveGroupMembers(groupId, excludeUid = null) {
  const variants = buildGroupIdCaseVariants(groupId);
  if (variants.length === 0) return [];
  try {
    const q = query(collection(db, 'users'), where('groupId', 'in', variants));
    const snap = await getDocs(q);
    const members = [];
    snap.forEach((docSnap) => {
      if (excludeUid && docSnap.id === excludeUid) return;
      const u = docSnap.data();
      if (isMemberArchived(u) || u.isDependent) return;
      members.push({ id: docSnap.id, ...u });
    });
    return members;
  } catch (err) {
    console.warn('getActiveGroupMembers - Erreur résolution membres :', err);
    return [];
  }
}

/**
 * Résout 100 % des UIDs des membres actifs d'une association (hors expéditeur éventuel).
 */
export async function getActiveGroupMemberUids(groupId, excludeUid = null) {
  const members = await getActiveGroupMembers(groupId, excludeUid);
  return members.map((m) => m.id);
}

/**
 * Crée une notification interne dans `users/{recipientId}/in_app_notifications`
 * avec les deux champs `isRead: false` et `read: false` pour une compatibilité totale.
 */
export async function createInAppNotification({
  recipientId,
  groupId,
  type = NOTIFICATION_TYPES.SYSTEM,
  titre,
  title,
  message = '',
  targetUrl = '/app',
  icon
}) {
  if (!recipientId) return null;

  const resolvedTitle = titre || title || 'Notification';
  const resolvedIcon = icon || DEFAULT_ICONS[type] || '🔔';

  try {
    const notifRef = collection(db, 'users', recipientId, 'in_app_notifications');
    const docRef = await addDoc(notifRef, {
      groupId: groupId || null,
      type,
      titre: resolvedTitle,
      title: resolvedTitle,
      message,
      targetUrl,
      icon: resolvedIcon,
      read: false,
      isRead: false,
      dateCreation: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.warn('createInAppNotification - Erreur création notification interne :', err);
    return null;
  }
}

/**
 * Pipeline unifié : Crée la notification interne (cloche 🔔) ET déclenche le Push FCM.
 */
export async function dispatchInAppAndPushNotification({
  recipientId,
  groupId,
  type = NOTIFICATION_TYPES.SYSTEM,
  titre,
  title,
  message = '',
  targetUrl = '/app',
  icon,
  sendPush = true
}) {
  if (!recipientId) return null;
  const resolvedTitle = titre || title || 'Notification';

  const [inAppId] = await Promise.allSettled([
    createInAppNotification({
      recipientId, groupId, type, titre: resolvedTitle, title: resolvedTitle, message, targetUrl, icon
    }),
    sendPush
      ? queuePushNotification({
          recipientId, groupId, title: resolvedTitle, body: message, url: targetUrl
        })
      : Promise.resolve(null)
  ]);

  return inAppId.status === 'fulfilled' ? inAppId.value : null;
}

/**
 * Pipeline groupé : Envoie la cloche 🔔 à tous les destinataires ET met en file le Push FCM.
 */
export async function dispatchBulkInAppAndPushNotification({
  recipientIds = [],
  groupId,
  type = NOTIFICATION_TYPES.SYSTEM,
  titre,
  title,
  message = '',
  targetUrl = '/app',
  icon,
  sendPush = true
}) {
  const uniqueIds = Array.from(new Set((recipientIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return [];
  const resolvedTitle = titre || title || 'Notification';

  const inAppPromises = uniqueIds.map((uid) =>
    createInAppNotification({
      recipientId: uid, groupId, type, titre: resolvedTitle, title: resolvedTitle, message, targetUrl, icon
    })
  );

  await Promise.allSettled([
    ...inAppPromises,
    sendPush
      ? queueBulkPushNotification({
          recipientIds: uniqueIds, groupId, title: resolvedTitle, body: message, url: targetUrl
        })
      : Promise.resolve(null)
  ]);

  return uniqueIds;
}

/**
 * Envoie une notification interne à tous les membres possédant l'une des étiquettes ou rôles ciblés.
 */
export async function notifyMembersByTag({ groupId, tags = [], title, titre, message = '', targetUrl = '/app', icon = '🔔' }) {
  if (!groupId || !Array.isArray(tags) || tags.length === 0) return;
  try {
    const members = await getActiveGroupMembers(groupId);
    const normalizedTargets = tags.map((t) => t.toLowerCase().trim());
    const promises = [];

    members.forEach((u) => {
      const userTags = [
        ...(Array.isArray(u.userTags) ? u.userTags : []),
        ...(Array.isArray(u.tags) ? u.tags : []),
        ...(u.role ? [u.role] : [])
      ].map((t) => (typeof t === 'string' ? t.toLowerCase().trim() : (t?.nom || t?.name || t?.id || '').toLowerCase().trim()));

      if (normalizedTargets.some((target) => userTags.includes(target))) {
        promises.push(createInAppNotification({ recipientId: u.id, groupId, titre: titre || title, message, targetUrl, icon }));
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.warn('notifyMembersByTag - Erreur notification par tag :', err);
  }
}
