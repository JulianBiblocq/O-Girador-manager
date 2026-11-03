import {
  collection,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import { isMemberArchived } from './memberUtils';

/**
 * Retourne l'identifiant déterministe du fil de discussion général d'une association.
 * @param {string} groupId
 * @returns {string}
 */
export function getGeneralConversationId(groupId) {
  if (!groupId || typeof groupId !== 'string') return '';
  return `general_${groupId.trim().toLowerCase()}`;
}

/**
 * Vérifie si une conversation (objet ou identifiant) correspond au fil général « 💬 Tout le groupe ».
 * @param {Object|string} convOrId
 * @param {string} [groupId='']
 * @returns {boolean}
 */
export function isGeneralGroupConversation(convOrId, groupId = '') {
  if (!convOrId) return false;
  if (typeof convOrId === 'string') {
    const generalId = getGeneralConversationId(groupId);
    return Boolean((generalId && convOrId === generalId) || convOrId.startsWith('general_'));
  }
  if (convOrId.isGeneralGroup === true) return true;
  const generalId = getGeneralConversationId(groupId || convOrId.groupId || '');
  return Boolean(generalId && convOrId.id === generalId);
}

/**
 * Récupère la liste des identifiants des membres actifs de l'association.
 */
async function fetchActiveGroupMemberIds(groupId, fallbackUserId) {
  const activeIds = new Set(fallbackUserId ? [fallbackUserId] : []);
  if (!groupId) return Array.from(activeIds);
  const groupVariants = Array.from(new Set([groupId, groupId.toLowerCase()].filter(Boolean)));
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('groupId', 'in', groupVariants))
  );
  const canonicalLower = groupId.trim().toLowerCase();
  usersSnap.forEach((uDoc) => {
    const uData = uDoc.data();
    if (String(uData.groupId || '').trim().toLowerCase() !== canonicalLower) return;
    if (!isMemberArchived(uData) && !uData.isDependent) {
      activeIds.add(uDoc.id);
    }
  });
  return Array.from(activeIds);
}

/**
 * Garantit l'existence du canal général `conversations/general_${groupId.toLowerCase()}`
 * et le rattachement automatique de tous les membres actifs dans `participantIds`.
 * Retourne l'identifiant du canal (ou la liste des participants si `returnParticipants === true`).
 */
export async function ensureGeneralGroupConversation({ userId, groupId, returnParticipants = false }) {
  if (!userId || !groupId) return returnParticipants ? [] : null;
  const generalId = getGeneralConversationId(groupId);
  if (!generalId) return returnParticipants ? [] : null;

  try {
    const convRef = doc(db, 'conversations', generalId);
    const snap = await getDoc(convRef);

    if (snap.exists()) {
      const data = snap.data();
      const participants = Array.isArray(data.participantIds) ? data.participantIds : [];
      if (participants.length <= 1) {
        const activeIds = await fetchActiveGroupMemberIds(groupId, userId);
        const merged = Array.from(new Set([...participants, ...activeIds]));
        await updateDoc(convRef, {
          participantIds: merged,
          isGeneralGroup: true,
          type: 'group'
        });
        return returnParticipants ? merged : generalId;
      }
      if (!participants.includes(userId) || data.isGeneralGroup !== true) {
        await updateDoc(convRef, {
          participantIds: arrayUnion(userId),
          isGeneralGroup: true,
          type: 'group'
        });
        const nextList = participants.includes(userId) ? participants : [...participants, userId];
        return returnParticipants ? nextList : generalId;
      }
      return returnParticipants ? participants : generalId;
    }

    const activeIds = await fetchActiveGroupMemberIds(groupId, userId);
    const nowIso = new Date().toISOString();
    await setDoc(
      convRef,
      {
        groupId,
        type: 'group',
        isGeneralGroup: true,
        name: '💬 Tout le groupe',
        participantIds: activeIds,
        adminIds: [userId],
        createdBy: userId,
        createdAt: nowIso,
        updatedAt: nowIso,
        readStatus: { [userId]: nowIso }
      },
      { merge: true }
    );
    return returnParticipants ? activeIds : generalId;
  } catch (err) {
    console.warn('generalGroupChatUtils - Initialisation différée :', err?.message || err);
    return returnParticipants ? [userId] : generalId;
  }
}
