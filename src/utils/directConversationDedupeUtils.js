import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Génère l'identifiant déterministe unique d'une conversation directe (1-à-1) entre deux membres.
 */
export function getDeterministicDirectId(groupId, userIdA, userIdB) {
  const cleanGroup = String(groupId || 'samambaia').trim().toLowerCase() || 'samambaia';
  const sortedPair = [String(userIdA || '').trim(), String(userIdB || '').trim()].sort().join('_');
  return `dm_${cleanGroup}_${sortedPair}`;
}

/**
 * Indique si une conversation possède un dernier message réel non vide.
 */
export function hasNonEmptyLastMessage(conv) {
  return Boolean(conv?.lastMessage && String(conv.lastMessage.content || '').trim().length > 0);
}

/**
 * Retourne l'horodatage numérique le plus pertinent d'une conversation pour le tri.
 */
export function getConversationTimestampMs(conv) {
  const raw = conv?.lastMessage?.timestamp || conv?.updatedAt || conv?.createdAt || 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Compare deux conversations directes afin de privilégier celle ayant un lastMessage non vide,
 * puis à défaut la plus récente.
 */
export function compareDirectConversationPriority(a, b) {
  const hasMsgA = hasNonEmptyLastMessage(a);
  const hasMsgB = hasNonEmptyLastMessage(b);
  if (hasMsgA && !hasMsgB) return -1;
  if (!hasMsgA && hasMsgB) return 1;
  return getConversationTimestampMs(b) - getConversationTimestampMs(a);
}

/**
 * Sélectionne la meilleure conversation directe parmi une liste de candidats entre deux membres.
 */
export function pickBestDirectConversation(candidates = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  return [...candidates].sort(compareDirectConversationPriority)[0];
}

/**
 * Vérifie si un document conversation est un fil direct (1-à-1) réunissant exactement userIdA et userIdB.
 */
export function isDirectPairConversation(conv, userIdA, userIdB) {
  if (!conv || conv.type === 'group' || conv.isGeneralGroup) return false;
  const ids = Array.isArray(conv.participantIds) ? conv.participantIds : [];
  if (ids.length !== 2) return false;
  return ids.includes(userIdA) && ids.includes(userIdB);
}

/**
 * Dédoublonne les conversations directes par interlocuteur (`otherUserId`) :
 * - Conserve uniquement la discussion active (ayant un `lastMessage` non vide, sinon la plus récente).
 * - Supprime silencieusement de Firestore les doublons vides (`!lastMessage`).
 */
export function deduplicateDirectConversations(conversations = [], currentUserId, deletedEmptyIdsSet = new Set()) {
  if (!currentUserId || !Array.isArray(conversations)) return conversations;

  const groupsAndGeneral = [];
  const directByOtherUser = new Map();

  conversations.forEach((conv) => {
    const isDirect =
      conv.type !== 'group' &&
      !conv.isGeneralGroup &&
      Array.isArray(conv.participantIds) &&
      conv.participantIds.length === 2 &&
      conv.participantIds.includes(currentUserId);

    if (!isDirect) {
      groupsAndGeneral.push(conv);
      return;
    }

    const otherUserId = conv.participantIds.find((id) => id !== currentUserId) || currentUserId;
    if (!directByOtherUser.has(otherUserId)) {
      directByOtherUser.set(otherUserId, []);
    }
    directByOtherUser.get(otherUserId).push(conv);
  });

  const deduplicatedDirects = [];

  directByOtherUser.forEach((candidates) => {
    const sorted = [...candidates].sort(compareDirectConversationPriority);
    const winner = sorted[0];
    if (winner) {
      deduplicatedDirects.push(winner);
    }

    // Nettoyage silencieux des doublons écartés s'ils sont vides (!lastMessage)
    for (let i = 1; i < sorted.length; i += 1) {
      const duplicate = sorted[i];
      if (duplicate?.id && !hasNonEmptyLastMessage(duplicate) && !deletedEmptyIdsSet.has(duplicate.id)) {
        deletedEmptyIdsSet.add(duplicate.id);
        deleteDoc(doc(db, 'conversations', duplicate.id)).catch(() => {});
      }
    }
  });

  return [...groupsAndGeneral, ...deduplicatedDirects];
}

