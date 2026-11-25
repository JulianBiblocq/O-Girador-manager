import { doc, updateDoc } from 'firebase/firestore';
import { createInAppNotification, NOTIFICATION_TYPES, queuePushNotification } from './inAppNotificationService.js';
import { cleanFirestorePayload } from './firestoreUtils.js';
import {
  normalizeWorkshopPolicy,
  partitionWorkshopParticipants,
  resolveEventTargetPupitres
} from './workshopSanctuaryUtils.js';

/** Construit le message unitaire officiel d'invitation à re-confirmer hors pupitre. */
export function buildWorkshopReconfirmMessage(formattedDate, pupitreLabel) {
  return `🥁 L'atelier du ${formattedDate} est attribué au pupitre ${pupitreLabel}. Tu avais indiqué être dispo : confirme sur la fiche si tu souhaites quand même y participer !`;
}

/**
 * Notifie les membres passés en `pending_reconfirm` avec anti-spam strict :
 * - 1 notification interne (cloche 🔔) par atelier pointant vers `/app/agenda?eventId=...`
 * - Au maximum 1 SEULE notification Push FCM récapitulative par adhérent même si 3 ou 4 dates
 *   d'un même `pollGroupId` sont validées simultanément.
 */
export async function notifyWorkshopReconfirmMembersGrouped({ groupId, slots = [] }) {
  if (!groupId || !Array.isArray(slots) || slots.length === 0) return 0;

  const slotsByUser = new Map();
  slots.forEach((slot) => {
    if (!slot?.eventId || !Array.isArray(slot.recipientIds)) return;
    const uniqueSlotUids = Array.from(new Set(slot.recipientIds.filter(Boolean)));
    uniqueSlotUids.forEach((uid) => {
      if (!slotsByUser.has(uid)) slotsByUser.set(uid, []);
      slotsByUser.get(uid).push({
        eventId: slot.eventId,
        formattedDate: slot.formattedDate || slot.date || '',
        pupitreLabel: slot.pupitreLabel || 'Atelier'
      });
    });
  });

  if (slotsByUser.size === 0) return 0;
  const tasks = [];

  slotsByUser.forEach((userSlots, uid) => {
    // 1. Cloche interne : un lien direct vers chaque atelier à re-confirmer
    userSlots.forEach((s) => {
      tasks.push(
        createInAppNotification({
          recipientId: uid,
          groupId,
          type: NOTIFICATION_TYPES.AGENDA_NEW_EVENT,
          titre: `🥁 Atelier ${s.pupitreLabel} — À re-confirmer`,
          message: buildWorkshopReconfirmMessage(s.formattedDate, s.pupitreLabel),
          targetUrl: `/app/agenda?eventId=${s.eventId}`,
          icon: '🥁'
        })
      );
    });

    // 2. Push FCM anti-spam : strictement 1 seul envoi Push par adhérent
    if (userSlots.length === 1) {
      const only = userSlots[0];
      tasks.push(
        queuePushNotification({
          recipientId: uid,
          groupId,
          title: `🥁 Atelier ${only.pupitreLabel} — À re-confirmer`,
          body: buildWorkshopReconfirmMessage(only.formattedDate, only.pupitreLabel),
          url: `/app/agenda?eventId=${only.eventId}`,
          type: NOTIFICATION_TYPES.AGENDA_NEW_EVENT
        })
      );
    } else {
      const recap = userSlots.map((s) => `${s.formattedDate} (${s.pupitreLabel})`).join(', ');
      tasks.push(
        queuePushNotification({
          recipientId: uid,
          groupId,
          title: `🥁 Ateliers par pupitre (${userSlots.length} dates à re-confirmer)`,
          body: `🥁 Ateliers attribués : ${recap}. Tu avais indiqué être dispo : confirme sur chaque fiche si tu souhaites quand même y participer !`,
          url: `/app/agenda?eventId=${userSlots[0].eventId}`,
          type: NOTIFICATION_TYPES.AGENDA_NEW_EVENT
        })
      );
    }
  });

  await Promise.allSettled(tasks);
  return slotsByUser.size;
}

/**
 * Outil de rattrapage immédiat en production : sanctuarise un atelier déjà confirmé
 * en conservant les titulaires en `present` et en basculant/relançant les hors-pupitre.
 */
export async function sanctuarizeConfirmedWorkshopEvent({
  db, event, policy = 'reconfirm', allUsersMap = {}, pupitresList = [], linkedInstruments = [], formattedDate = ''
}) {
  if (!db || !event?.id) throw new Error('Événement invalide.');
  const targetPupitres = resolveEventTargetPupitres(event, pupitresList, linkedInstruments);
  if (targetPupitres.length === 0) throw new Error('Aucun pupitre cible associé à cet atelier.');

  const cleanPolicy = normalizeWorkshopPolicy(policy);
  const result = partitionWorkshopParticipants({
    event,
    targetPupitres,
    policy: cleanPolicy,
    allUsersMap,
    pupitresList,
    linkedInstruments,
    mode: 'catchup'
  });

  await updateDoc(
    doc(db, 'events', event.id),
    cleanFirestorePayload({
      inscriptions: result.inscriptions,
      pollAssignedPupitres: targetPupitres,
      workshopPollOtherPupitresPolicy: cleanPolicy
    })
  );

  let notifiedCount = 0;
  if (cleanPolicy === 'reconfirm' && result.reconfirmRecipients.length > 0 && event.groupId) {
    notifiedCount = await notifyWorkshopReconfirmMembersGrouped({
      groupId: event.groupId,
      slots: [{
        eventId: event.id,
        formattedDate: formattedDate || event.date || '',
        pupitreLabel: targetPupitres.join(' & '),
        recipientIds: result.reconfirmRecipients.map((r) => r.uid)
      }]
    });
  }

  return { ...result, targetPupitres, notifiedCount };
}
