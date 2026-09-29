import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { notifyMembersByTag } from './inAppNotificationService.js';
import { dispatchInAppAndPushNotification } from './pushQueueService.js';

/**
 * Service de notifications pour le circuit d'arbitrage budgétaire des commissions (Bloc 2).
 * Gère les alertes in-app et les enregistrements dans notifications_queue pour FCM push.
 */

/**
 * Alerte le Trésorier et le Bureau lorsqu'une commission soumet une demande de budget.
 *
 * @param {Object} params
 * @param {string} params.eventId Identifiant de l'événement
 * @param {string} [params.eventTitle] Titre de l'événement
 * @param {Object} params.commission Données de la commission
 * @param {number|string} params.montantDemande Montant prévisionnel demandé en €
 * @param {string} params.groupId Identifiant du groupe de l'association
 */
export async function notifyBudgetApprovalRequest({
  eventId,
  eventTitle = 'Événement',
  commission,
  montantDemande,
  groupId
}) {
  if (!eventId || !commission || !groupId) return { success: false };

  const commTitre = commission.titre || 'Commission';
  const displayTitle = `💰 Arbitrage budget — ${commTitre}`;
  const displayMessage = `Budget prévisionnel soumis : ${montantDemande} € pour ${eventTitle}`;
  const targetUrl = `/events/${eventId}?hub=commissions`;

  try {
    // 1. Notification ciblée par étiquettes Trésorier & Bureau
    const res = await notifyMembersByTag({
      groupId,
      tags: ['Trésorier', 'tresorier', 'Bureau', 'bureau'],
      title: displayTitle,
      message: displayMessage,
      targetUrl,
      icon: '💰',
      priority: 'high'
    });

    // 2. Inscription dans la file FCM push notifications_queue pour chaque destinataire trouvé
    if (res?.recipientIds && res.recipientIds.length > 0) {
      await Promise.allSettled(
        res.recipientIds.map((userId) =>
          addDoc(collection(db, 'notifications_queue'), {
            groupId,
            recipientId: userId,
            userId,
            title: displayTitle,
            body: displayMessage,
            url: targetUrl.startsWith('/app') ? targetUrl : `/app${targetUrl}`,
            type: 'announcement',
            icon: '💰',
            createdAt: new Date().toISOString()
          })
        )
      );
    } else {
      // Inscription générique pour le groupe
      await addDoc(collection(db, 'notifications_queue'), {
        groupId,
        targetRole: 'tresorier',
        title: displayTitle,
        body: displayMessage,
        url: targetUrl.startsWith('/app') ? targetUrl : `/app${targetUrl}`,
        type: 'announcement',
        icon: '💰',
        createdAt: new Date().toISOString()
      }).catch((e) => console.warn('Avertissement queue push générique :', e));
    }

    return { success: true, count: res?.count || 0 };
  } catch (err) {
    console.warn('Erreur notification demande budget commission :', err);
    return { success: false, error: err };
  }
}

/**
 * Notifie directement les référents d'une commission du verdict d'arbitrage du trésorier.
 *
 * @param {Object} params
 * @param {string} params.eventId Identifiant de l'événement
 * @param {Object} params.commission Données de la commission
 * @param {number|string} params.alloue Montant alloué retenu
 * @param {boolean} params.approuve Indique si le budget est validé ou rejeté
 * @param {string} [params.motifRefus] Motif éventuel en cas de révision ou rejet
 * @param {string} params.groupId Identifiant du groupe
 */
export async function notifyBudgetVerdict({
  eventId,
  commission,
  alloue,
  approuve,
  motifRefus = '',
  groupId
}) {
  if (!eventId || !commission || !groupId) return { success: false };

  const referentsIds = (commission.referentsIds || []).filter(Boolean);
  if (referentsIds.length === 0) return { success: false, count: 0 };

  const commTitre = commission.titre || 'Commission';
  const targetUrl = `/events/${eventId}?hub=commissions`;

  const title = approuve
    ? `✅ Budget validé (${alloue} €)`
    : `⚠️ Budget à réviser (${commTitre})`;

  const message = approuve
    ? `Votre enveloppe pour ${commTitre} a été validée.`
    : `Motif : ${motifRefus || 'Révision demandée par la trésorerie'}`;

  const icon = approuve ? '✅' : '⚠️';

  try {
    const promises = referentsIds.map((userId) =>
      dispatchInAppAndPushNotification({
        recipientId: userId,
        groupId,
        type: 'expense_status',
        title,
        message,
        targetUrl,
        icon,
        sendPush: true
      })
    );

    await Promise.allSettled(promises);
    return { success: true, count: referentsIds.length };
  } catch (err) {
    console.warn('Erreur notification verdict arbitrage budget :', err);
    return { success: false, error: err };
  }
}
