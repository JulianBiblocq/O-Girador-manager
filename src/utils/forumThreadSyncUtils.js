/**
 * Utilitaires de synchronisation des lectures du Porte-Voix, de calcul des lecteurs
 * par message et de gestion du Cooldown Anti-Rafale (5 min) sur les notifications Push.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toTimestamp, getLocalReadThreads, saveLocalReadThread } from './forumUnreadUtils';
import { canUserReadForumChannel, checkUserAccessToList } from './permissionUtils';
import { canonicalizeGroupId } from './tenantUtils';
import { dispatchInAppAndPushNotification, NOTIFICATION_TYPES } from './inAppNotificationService';

export const PUSH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Vérifie si un Push a déjà été envoyé dans ce fil il y a moins de 5 minutes.
 * Accepte soit un horodatage ISO direct, soit l'objet thread complet (auquel cas
 * il inspecte la dernière réponse dans `thread.reponses` ou `thread.lastPushSentAt`).
 */
export function isPushCooldownActive(threadOrTimestamp, cooldownMs = PUSH_COOLDOWN_MS) {
  if (!threadOrTimestamp) return false;
  let refTimestamp = threadOrTimestamp;
  if (typeof threadOrTimestamp === 'object') {
    const replies = Array.isArray(threadOrTimestamp.reponses) ? threadOrTimestamp.reponses : [];
    const lastReplyDate = replies.length > 0 ? replies[replies.length - 1]?.dateCreation : null;
    refTimestamp = lastReplyDate || threadOrTimestamp.lastPushSentAt || null;
  }
  if (!refTimestamp) return false;
  const lastMs = toTimestamp(refTimestamp);
  return lastMs > 0 && Date.now() - lastMs < cooldownMs;
}

/**
 * Nettoie récursivement un objet ou tableau pour éliminer toute valeur `undefined`
 * (formellement rejetée par Firestore à l'intérieur d'un `arrayUnion`).
 */
export function sanitizeFirestoreObject(input) {
  if (input === undefined) return null;
  if (input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreObject(item));
  }
  const cleaned = {};
  Object.entries(input).forEach(([key, val]) => {
    if (val !== undefined) {
      cleaned[key] = sanitizeFirestoreObject(val);
    }
  });
  return cleaned;
}

/**
 * Enregistre de manière idempotente la lecture d'un sujet sur `users/{uid}`
 * ET sur `forum/{threadId}.lectures.{uid}` dès l'ouverture du sujet.
 */
export function syncThreadReadStatus({ thread, threadId, user, profileData }) {
  const currentUserId = user?.uid || profileData?.uid || profileData?.id || auth?.currentUser?.uid;
  const currentThreadId = thread?.id || threadId;
  if (!thread || !currentUserId || !currentThreadId) return;

  const modStr = thread.derniereModification || thread.dateCreation;
  if (!modStr) return;

  const threadLastMod = toTimestamp(modStr);
  const localReads = getLocalReadThreads(currentUserId);
  const userLastReadStr = profileData?.readThreads?.[currentThreadId] || localReads[currentThreadId];
  const userLastRead = toTimestamp(userLastReadStr);

  const nowIso = new Date(Math.max(Date.now(), threadLastMod + 1000)).toISOString();
  saveLocalReadThread(currentUserId, currentThreadId, nowIso);

  if (!userLastRead || threadLastMod >= userLastRead) {
    updateDoc(doc(db, 'users', currentUserId), {
      [`readThreads.${currentThreadId}`]: nowIso
    }).catch((err) => console.warn('forumThreadSyncUtils - Lecture user :', err));
  }

  const existingLecture = thread.lectures?.[currentUserId];
  const existingLectureMs = toTimestamp(existingLecture?.luLe || existingLecture);
  if (!existingLecture || (threadLastMod > 0 && threadLastMod > existingLectureMs)) {
    const currentUserName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || user?.email || 'Membre';
    updateDoc(doc(db, 'forum', currentThreadId), {
      [`lectures.${currentUserId}`]: { luLe: nowIso, nom: currentUserName }
    }).catch((err) => console.warn('forumThreadSyncUtils - Lecture forum :', err));
  }
}

/**
 * Calcule les lectures effectives d'un message (initial ou réponse) à partir de `thread.lectures`
 * en retenant tous les lecteurs dont `luLe >= dateCreation du message`, fusionné avec `reply.lectures`.
 */
export function resolveEffectiveMessageLectures(thread, reply) {
  const merged = { ...(reply?.lectures && typeof reply.lectures === 'object' ? reply.lectures : {}) };
  const threadLectures = thread?.lectures && typeof thread.lectures === 'object' ? thread.lectures : {};
  const msgCreatedMs = toTimestamp(reply?.dateCreation || thread?.dateCreation);

  Object.entries(threadLectures).forEach(([uid, entry]) => {
    const luLeMs = toTimestamp(entry?.luLe || entry);
    if (!msgCreatedMs || !luLeMs || luLeMs >= msgCreatedMs) {
      merged[uid] = entry;
    }
  });
  return merged;
}

/**
 * Diffuse les notifications In-App et Push (avec respect du cooldown de 5 min sauf mention @Prénom)
 * lors de l'envoi d'une réponse dans un sujet du Porte-Voix.
 */
export async function dispatchThreadReplyNotifications({
  thread, threadId, threadChannel, user, profileData,
  allUsers = [], activeTagsDisponibles = [], replyText = '',
  selectedTarget = '', detectedMentionIds = [], allowChannelPush = true
}) {
  const notifRecipientIds = new Set();
  (allUsers || []).forEach((u) => {
    if (!u.id || u.id === user?.uid) return;
    if (threadChannel && !canUserReadForumChannel(threadChannel, u, activeTagsDisponibles, u.tags || [], false)) return;
    notifRecipientIds.add(u.id);
  });

  detectedMentionIds.forEach((uid) => {
    if (uid !== user?.uid) notifRecipientIds.add(uid);
  });

  if (selectedTarget) {
    (allUsers || []).forEach((u) => {
      if (u.id === user?.uid) return;
      const playsInst = (u.instrumentsJoues && u.instrumentsJoues.includes(selectedTarget)) || u.instrument === selectedTarget;
      const hasTag = checkUserAccessToList([selectedTarget], u, u.tags || []);
      if (playsInst || hasTag) notifRecipientIds.add(u.id);
    });
  }

  const senderName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 'Un membre';
  const cleanMsg = (replyText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const snippet = cleanMsg.length > 80 ? `${cleanMsg.slice(0, 80)}...` : cleanMsg;
  const effectiveGroupId = canonicalizeGroupId(profileData?.groupId || thread?.groupId);

  const notifPromises = Array.from(notifRecipientIds).map((recipientId) => {
    const isMentioned = detectedMentionIds.includes(recipientId);
    const notifTitle = isMentioned ? `🗣️ ${senderName} vous a mentionné(e)` : `💬 ${senderName} dans "${thread?.titre || 'Discussion'}"`;
    return dispatchInAppAndPushNotification({
      recipientId,
      groupId: effectiveGroupId,
      type: isMentioned ? NOTIFICATION_TYPES.FORUM_MENTION : NOTIFICATION_TYPES.FORUM_MESSAGE,
      titre: notifTitle,
      message: `"${snippet}"`,
      targetUrl: `/app/forum?threadId=${threadId}`,
      sendPush: isMentioned ? true : allowChannelPush
    });
  });

  if (notifPromises.length > 0) await Promise.allSettled(notifPromises);
}
