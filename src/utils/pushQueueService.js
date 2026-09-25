/**
 * Service d'intégration de la file d'attente Push FCM (notifications_queue)
 * pour la diffusion externe en parallèle des alertes in-app.
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createInAppNotification, NOTIFICATION_TYPES } from './inAppNotificationService';

/**
 * Diffuse une notification in-app et l'enregistre dans notifications_queue pour FCM push.
 */
export async function dispatchInAppAndPushNotification({
  recipientId,
  groupId,
  type = NOTIFICATION_TYPES.ANNOUNCEMENT,
  titre,
  title,
  message,
  targetUrl = '/app',
  icon = '🔔',
  sendPush = true
}) {
  if (!recipientId) return { notifId: null, pushQueued: false };
  let notifId = null;
  let pushQueued = false;
  const displayTitle = title || titre || 'Notification';

  // Normalisation pour toujours diriger vers l'espace membre /app
  const resolvedUrl = (!targetUrl.startsWith('http') && !targetUrl.startsWith('/app'))
    ? (targetUrl.startsWith('/') ? `/app${targetUrl}` : `/app/${targetUrl}`)
    : targetUrl;

  try {
    notifId = await createInAppNotification({
      userId: recipientId,
      groupId,
      type,
      titre: displayTitle,
      title: displayTitle,
      message,
      targetUrl: resolvedUrl,
      icon
    });
  } catch (err) {
    console.warn('Échec création in_app_notification :', err);
  }

  if (sendPush && groupId) {
    try {
      await addDoc(collection(db, 'notifications_queue'), {
        groupId,
        recipientId,
        userId: recipientId,
        title: displayTitle,
        body: message,
        url: resolvedUrl,
        type,
        createdAt: new Date().toISOString()
      });
      pushQueued = true;
    } catch (err) {
      console.warn('Échec mise en file notifications_queue :', err);
    }
  }

  return { notifId, pushQueued };
}

/**
 * Diffusion groupée in-app et push FCM.
 */
export async function dispatchBulkInAppAndPushNotification({
  recipientIds = [],
  groupId,
  type = NOTIFICATION_TYPES.ANNOUNCEMENT,
  titre,
  title,
  message,
  targetUrl = '/app',
  icon = '🔔',
  sendPush = true
}) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return [];
  const uniqueRecipients = Array.from(new Set(recipientIds)).filter(Boolean);
  return Promise.allSettled(
    uniqueRecipients.map((recipientId) =>
      dispatchInAppAndPushNotification({ recipientId, groupId, type, titre, title, message, targetUrl, icon, sendPush })
    )
  );
}
