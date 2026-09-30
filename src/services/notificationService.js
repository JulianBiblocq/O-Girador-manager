/**
 * Service de gestion des notifications in-app et de diffusion pour les discussions d'événements.
 * Conforme aux règles d'architecture et de gouvernance du projet O-Girador-manager.
 */

import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  formatMessageExcerpt,
  getEventDiscussionRecipients,
  buildEventDiscussionNotificationPayload
} from '../utils/eventDiscussionNotificationUtils';

export {
  formatMessageExcerpt,
  getEventDiscussionRecipients,
  buildEventDiscussionNotificationPayload
};

/**
 * Diffuse par lot (writeBatch Firestore) les notifications in-app aux participants d'un événement.
 * Écrit à la fois dans la collection racine 'notifications' et dans 'users/{userId}/in_app_notifications'
 * pour assurer une compatibilité totale avec le centre de notifications (cloche) et les règles de sécurité.
 *
 * @param {Object} params Paramètres de la notification
 * @param {Object} params.event Objet événement complet
 * @param {string} params.authorName Nom de l'auteur du message
 * @param {string} params.text Texte du message
 * @param {string} params.currentUserId UID de l'auteur (exclu des notifications)
 * @param {string} [params.groupId] Identifiant du groupe/association
 * @returns {Promise<{ success: boolean, count: number, recipientIds: string[] }>}
 */
export async function sendEventDiscussionNotifications({
  event,
  authorName = 'Un membre',
  text = '',
  currentUserId,
  groupId = ''
}) {
  if (!event || !event.id) {
    return { success: false, count: 0, recipientIds: [] };
  }

  const cleanText = (text || '').trim();
  if (!cleanText) {
    return { success: false, count: 0, recipientIds: [] };
  }

  const recipientIds = getEventDiscussionRecipients(event, currentUserId);
  if (recipientIds.length === 0) {
    return { success: true, count: 0, recipientIds: [] };
  }

  const effectiveGroupId = groupId || event.groupId || '';
  const nowIso = new Date().toISOString();

  try {
    // Découpage en blocs de 200 destinataires maximum (Firestore limite les batchs à 500 opérations au total)
    const chunkSize = 200;
    for (let i = 0; i < recipientIds.length; i += chunkSize) {
      const chunk = recipientIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((recipientUid) => {
        const payload = buildEventDiscussionNotificationPayload({
          recipientUid,
          event,
          authorName,
          text: cleanText,
          groupId: effectiveGroupId,
          createdAtIso: nowIso
        });

        // 1. Écriture dans la collection racine 'notifications'
        const rootNotifRef = doc(collection(db, 'notifications'));
        const notifId = rootNotifRef.id;

        batch.set(rootNotifRef, {
          ...payload,
          id: notifId,
          notifId: notifId
        });

        // 2. Écriture synchrone dans la sous-collection 'users/{recipientUid}/in_app_notifications'
        // garantissant la réception immédiate par le centre de notifications (cloche)
        const userNotifRef = doc(db, 'users', recipientUid, 'in_app_notifications', notifId);
        batch.set(userNotifRef, {
          ...payload,
          id: notifId,
          notifId: notifId,
          icon: '💬',
          priority: 'normal',
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
    }

    return {
      success: true,
      count: recipientIds.length,
      recipientIds
    };
  } catch (err) {
    console.error("sendEventDiscussionNotifications - Erreur lors de l'envoi groupé :", err);
    return {
      success: false,
      count: 0,
      recipientIds,
      error: err.message || err
    };
  }
}

/**
 * Marque une notification comme lue de manière idempotente dans les collections concernées.
 *
 * @param {string} notifId Identifiant de la notification
 * @param {string} userId Identifiant de l'utilisateur
 */
export async function markNotificationAsRead(notifId, userId) {
  if (!notifId) return;

  // 1. Mise à jour dans la sous-collection de l'utilisateur
  if (userId) {
    try {
      const userNotifRef = doc(db, 'users', userId, 'in_app_notifications', notifId);
      await updateDoc(userNotifRef, { read: true, isRead: true });
    } catch {
      // Ignorer si déjà lu ou document inexistant
    }
  }

  // 2. Mise à jour dans la collection racine 'notifications' si applicable
  try {
    const rootNotifRef = doc(db, 'notifications', notifId);
    await updateDoc(rootNotifRef, { read: true, isRead: true });
  } catch {
    // Ignorer si les règles interdisent l'écriture directe ou si le document n'existe pas
  }
}
