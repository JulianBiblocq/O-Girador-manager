/**
 * Service de gestion et synchronisation des notifications internes (In-App)
 * et de leur couplage avec la file d'attente Push FCM (notifications_queue).
 */

import { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Types de notifications supportés par le système in-app.
 */
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
 * Crée un document de notification interne dans users/{userId}/in_app_notifications.
 * 
 * @param {Object} params Paramètres de la notification
 * @param {string} params.userId Identifiant de l'utilisateur destinataire
 * @param {string} params.groupId Identifiant de l'association/groupe
 * @param {string} [params.type='announcement'] Type de notification
 * @param {string} params.titre Titre de la notification
 * @param {string} params.message Corps du message explicatif
 * @param {string} [params.targetUrl='/'] URL interne SPA de destination pour le deep linking
 * @param {boolean} [params.isRead=false] État de lecture initial
 * @param {Timestamp|Date} [params.createdAt] Horodatage de création
 * @returns {Promise<string>} Identifiant du document créé (notifId)
 */
export async function createInAppNotification({
  userId,
  groupId,
  type = NOTIFICATION_TYPES.ANNOUNCEMENT,
  titre,
  message,
  targetUrl = '/',
  isRead = false,
  createdAt = null
}) {
  if (!userId) {
    console.warn("createInAppNotification : userId manquant, notification abandonnée.");
    return null;
  }

  try {
    const notifsColRef = collection(db, 'users', userId, 'in_app_notifications');
    const newDocRef = doc(notifsColRef);
    const notifId = newDocRef.id;

    // Résolution de l'horodatage Firestore
    const resolvedTimestamp = createdAt instanceof Timestamp
      ? createdAt
      : (createdAt instanceof Date ? Timestamp.fromDate(createdAt) : serverTimestamp());

    const notifPayload = {
      notifId,
      groupId: groupId || '',
      type: type || NOTIFICATION_TYPES.ANNOUNCEMENT,
      titre: titre || 'Notification',
      message: message || '',
      targetUrl: targetUrl || '/',
      isRead: Boolean(isRead),
      createdAt: resolvedTimestamp
    };

    await setDoc(newDocRef, notifPayload);
    return notifId;
  } catch (err) {
    console.error(`Erreur lors de la création de la notification in-app pour l'utilisateur ${userId} :`, err);
    return null;
  }
}

/**
 * Diffuse une notification à la fois dans le centre de notifications in-app du membre
 * et dans la file d'attente Push FCM (notifications_queue) pour les appareils externes.
 * 
 * @param {Object} params Paramètres de la notification combinée
 * @param {string} params.recipientId Identifiant du membre destinataire
 * @param {string} params.groupId Identifiant de l'association
 * @param {string} [params.type='announcement'] Type de notification
 * @param {string} params.titre Titre affiché
 * @param {string} params.message Corps du texte
 * @param {string} [params.targetUrl='/'] URL interne pour la redirection
 * @param {boolean} [params.sendPush=true] Si true, pousse également dans notifications_queue
 * @returns {Promise<{ notifId: string|null, pushQueued: boolean }>}
 */
export async function dispatchInAppAndPushNotification({
  recipientId,
  groupId,
  type = NOTIFICATION_TYPES.ANNOUNCEMENT,
  titre,
  message,
  targetUrl = '/',
  sendPush = true
}) {
  if (!recipientId) return { notifId: null, pushQueued: false };

  let notifId = null;
  let pushQueued = false;

  // 1. Notification In-App instantanée
  try {
    notifId = await createInAppNotification({
      userId: recipientId,
      groupId,
      type,
      titre,
      message,
      targetUrl
    });
  } catch (inAppErr) {
    console.warn("Échec création in_app_notification :", inAppErr);
  }

  // 2. Notification Push externe via notifications_queue
  if (sendPush && groupId) {
    try {
      const nowIso = new Date().toISOString();
      await addDoc(collection(db, 'notifications_queue'), {
        groupId,
        recipientId,
        userId: recipientId,
        title: titre,
        body: message,
        url: targetUrl,
        type,
        createdAt: nowIso
      });
      pushQueued = true;
    } catch (pushErr) {
      console.warn("Échec mise en file notifications_queue :", pushErr);
    }
  }

  return { notifId, pushQueued };
}

/**
 * Diffuse une notification à un groupe de membres destinataires en parallèle.
 * Envoie à la fois dans le centre in-app et dans la file d'attente Push FCM.
 * 
 * @param {Object} params Paramètres de diffusion groupée
 * @param {Array<string>} params.recipientIds Liste des identifiants des membres destinataires
 * @param {string} params.groupId Identifiant de l'association
 * @param {string} [params.type] Type de notification
 * @param {string} params.titre Titre affiché
 * @param {string} params.message Corps du texte
 * @param {string} [params.targetUrl='/'] URL interne pour la redirection
 * @param {boolean} [params.sendPush=true] Si true, pousse également dans notifications_queue
 * @returns {Promise<Array<PromiseSettledResult>>}
 */
export async function dispatchBulkInAppAndPushNotification({
  recipientIds = [],
  groupId,
  type = NOTIFICATION_TYPES.ANNOUNCEMENT,
  titre,
  message,
  targetUrl = '/',
  sendPush = true
}) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return [];
  const uniqueRecipients = Array.from(new Set(recipientIds)).filter(Boolean);

  return Promise.allSettled(
    uniqueRecipients.map((recipientId) =>
      dispatchInAppAndPushNotification({
        recipientId,
        groupId,
        type,
        titre,
        message,
        targetUrl,
        sendPush
      })
    )
  );
}
