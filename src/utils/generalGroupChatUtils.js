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
 * Vérifie si une conversation correspond au fil général « 💬 Tout le groupe ».
 * @param {Object} conv
 * @param {string} [groupId='']
 * @returns {boolean}
 */
export function isGeneralGroupConversation(conv, groupId = '') {
  if (!conv) return false;
  if (conv.isGeneralGroup === true) return true;
  const generalId = getGeneralConversationId(groupId || conv.groupId || '');
  return Boolean(generalId && conv.id === generalId);
}

/**
 * Garantit l'existence du canal général `conversations/general_${groupId.toLowerCase()}`
 * et le rattachement automatique de l'adhérent connecté dans `participantIds`.
 */
export async function ensureGeneralGroupConversation({ userId, groupId }) {
  if (!userId || !groupId) return null;
  const generalId = getGeneralConversationId(groupId);
  if (!generalId) return null;

  try {
    const convRef = doc(db, 'conversations', generalId);
    const snap = await getDoc(convRef);

    if (snap.exists()) {
      const data = snap.data();
      const participants = Array.isArray(data.participantIds) ? data.participantIds : [];
      if (!participants.includes(userId) || data.isGeneralGroup !== true) {
        await updateDoc(convRef, {
          participantIds: arrayUnion(userId),
          isGeneralGroup: true,
          type: 'group'
        });
      }
      return generalId;
    }

    // Création initiale : récupérer tous les membres actifs de l'association
    const groupVariants = Array.from(new Set([groupId, groupId.toLowerCase()].filter(Boolean)));
    const usersSnap = await getDocs(
      query(collection(db, 'users'), where('groupId', 'in', groupVariants))
    );
    const activeIds = new Set([userId]);
    const canonicalLower = groupId.trim().toLowerCase();

    usersSnap.forEach((uDoc) => {
      const uData = uDoc.data();
      if (String(uData.groupId || '').trim().toLowerCase() !== canonicalLower) return;
      if (!isMemberArchived(uData) && !uData.isDependent) {
        activeIds.add(uDoc.id);
      }
    });

    const nowIso = new Date().toISOString();
    await setDoc(
      convRef,
      {
        groupId,
        type: 'group',
        isGeneralGroup: true,
        name: '💬 Tout le groupe',
        participantIds: Array.from(activeIds),
        adminIds: [userId],
        createdBy: userId,
        createdAt: nowIso,
        updatedAt: nowIso,
        readStatus: { [userId]: nowIso }
      },
      { merge: true }
    );
    return generalId;
  } catch (err) {
    console.warn('generalGroupChatUtils - Initialisation différée :', err?.message || err);
    return generalId;
  }
}

