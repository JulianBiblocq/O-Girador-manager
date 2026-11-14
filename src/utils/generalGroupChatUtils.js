/**
 * Utilitaires de gestion de la discussion générale de groupe (« 💬 Le Zap »).
 * Garantit l'existence d'un salon de discussion instantanée façon messagerie
 * réunissant automatiquement tous les membres actifs de l'association.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import { isMemberArchived } from './memberUtils';
import { fetchAssociationMembersOnce } from '../hooks/useAssociationMembers';

const initInFlightByGroup = new Map();

/**
 * Construit l'identifiant déterministe de la conversation générale d'une association
 * normalisé systématiquement en minuscules.
 */
export function getGeneralConversationId(groupId) {
  const clean = String(groupId || 'samambaia').trim().toLowerCase() || 'samambaia';
  return `general_${clean}`;
}

/**
 * Vérifie si une conversation correspond au Zap général de l'association.
 */
export function isGeneralGroupConversation(convOrId, groupId = '') {
  if (!convOrId) return false;
  const generalId = getGeneralConversationId(groupId);
  if (typeof convOrId === 'string') {
    const cleanId = convOrId.trim().toLowerCase();
    return cleanId === generalId || cleanId.startsWith('general_');
  }
  const targetGenId = getGeneralConversationId(groupId || convOrId.groupId || 'samambaia');
  const docId = String(convOrId.id || '').trim().toLowerCase();
  return Boolean(convOrId.isGeneralGroup || docId === targetGenId || docId.startsWith('general_'));
}

/**
 * Surcharge propre à l'affichage pour remplacer les anciens titres (« 💬 Tout le groupe », etc.)
 * par « 💬 Le Zap » sans casser les documents existants en base.
 */
export function resolveZapDisplayName(rawName, fallback = '💬 Le Zap') {
  if (!rawName || typeof rawName !== 'string') return fallback;
  const lower = rawName.toLowerCase();
  if (
    lower.includes('tout le groupe') ||
    lower.includes('todo o grupo') ||
    lower.includes('discussion générale') ||
    lower.includes('discussão geral') ||
    lower.includes('fil général') ||
    lower.includes('en direct')
  ) {
    return fallback;
  }
  return rawName;
}

/**
 * Récupère la liste des identifiants de tous les membres actifs de l'association
 * (insensible à la casse et incluant les profils historiques de Samambaia).
 */
async function fetchGroupParticipantIds(groupId, currentUserId) {
  const normalizedGroupId = String(groupId || 'samambaia').trim().toLowerCase() || 'samambaia';
  const ids = new Set();
  if (currentUserId) ids.add(currentUserId);
  try {
    const tenantMembers = await fetchAssociationMembersOnce(normalizedGroupId);
    tenantMembers.forEach((m) => {
      if (!isMemberArchived(m) && (m.id || m.uid)) ids.add(m.id || m.uid);
    });
  } catch {
    // Repli sécurisé si la lecture globale est restreinte
  }
  return Array.from(ids);
}

/**
 * Garantit que le document `conversations/general_${groupId}` existe et que
 * l'utilisateur courant ainsi que tous les membres du groupe figurent dans `participantIds`.
 */
export async function ensureGeneralGroupConversation({ userId, groupId, returnParticipants = false }) {
  if (!userId) return returnParticipants ? [] : null;
  const normalizedGroupId = String(groupId || 'samambaia').trim().toLowerCase() || 'samambaia';
  const generalId = getGeneralConversationId(normalizedGroupId);
  const lockKey = `${generalId}_${userId}`;
  if (initInFlightByGroup.has(lockKey) && !returnParticipants) {
    return initInFlightByGroup.get(lockKey);
  }

  const task = (async () => {
    try {
      const convRef = doc(db, 'conversations', generalId);
      const allParticipants = await fetchGroupParticipantIds(normalizedGroupId, userId);
      try {
        const snap = await getDoc(convRef);
        if (!snap.exists()) {
          const nowIso = new Date().toISOString();
          await setDoc(convRef, {
            groupId: normalizedGroupId,
            type: 'group',
            isGeneralGroup: true,
            name: '💬 Le Zap',
            participantIds: allParticipants,
            adminIds: [userId],
            createdBy: userId,
            createdAt: nowIso,
            updatedAt: nowIso,
            readStatus: { [userId]: nowIso }
          }, { merge: true });
        } else {
          const data = snap.data() || {};
          const existingIds = Array.isArray(data.participantIds) ? data.participantIds : [];
          const missingIds = allParticipants.filter((id) => !existingIds.includes(id));
          if (missingIds.length > 0 || !data.isGeneralGroup || data.groupId !== normalizedGroupId) {
            await updateDoc(convRef, {
              groupId: normalizedGroupId,
              isGeneralGroup: true,
              name: resolveZapDisplayName(data.name, '💬 Le Zap'),
              participantIds: arrayUnion(...(missingIds.length > 0 ? missingIds : [userId]))
            });
          }
        }
      } catch {
        // Ignorer silencieusement si la lecture directe est temporairement restreinte
      }

      try {
        const msgSnap = await getDocs(
          query(collection(db, 'conversation_messages'), where('conversationId', '==', generalId))
        );
        msgSnap.forEach((mDoc) => {
          const mIds = Array.isArray(mDoc.data()?.participantIds) ? mDoc.data().participantIds : [];
          const missing = allParticipants.filter((id) => !mIds.includes(id));
          if (missing.length > 0) {
            updateDoc(mDoc.ref, { participantIds: arrayUnion(...missing) }).catch(() => {});
          }
        });
      } catch {
        // Ignorer silencieusement pour les membres standards
      }
      return returnParticipants ? allParticipants : generalId;
    } finally {
      initInFlightByGroup.delete(lockKey);
    }
  })();

  initInFlightByGroup.set(lockKey, task);
  return task;
}
