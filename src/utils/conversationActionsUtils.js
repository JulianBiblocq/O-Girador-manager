import {
  collection,
  query,
  where,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getDeterministicDirectId,
  isDirectPairConversation,
  pickBestDirectConversation
} from './directConversationDedupeUtils';

/** Verrou en mémoire pour éviter toute création concurrente en cas de double clic rapide */
const inFlightDirectLocks = new Map();

/**
 * Envoie un message initial optionnel sur une conversation directe existante et met à jour son en-tête.
 */
async function appendInitialDirectMessage(convId, participantIds, groupId, user, senderFullName, profileData, initialMessage, nowIso) {
  if (!initialMessage || !initialMessage.trim()) return;
  const trimmed = initialMessage.trim();
  await addDoc(collection(db, 'conversation_messages'), {
    conversationId: convId,
    groupId,
    participantIds,
    senderId: user.uid,
    senderName: senderFullName,
    senderAvatar: profileData?.photoURL || user?.photoURL || '',
    content: trimmed,
    timestamp: nowIso,
    reactions: {}
  });
  await updateDoc(doc(db, 'conversations', convId), {
    updatedAt: nowIso,
    lastMessage: {
      content: trimmed,
      senderId: user.uid,
      senderName: senderFullName,
      timestamp: nowIso
    },
    [`readStatus.${user.uid}`]: nowIso
  });
}

/**
 * Ouvre ou crée une conversation directe (1-à-1) avec garantie d'unicité stricte :
 * 1. Recherche en mémoire (priorité au fil ayant un lastMessage non vide).
 * 2. Vérification Firestore (`getDocs`) avant création si non trouvé en mémoire.
 * 3. Création via ID déterministe `dm_${groupId}_${sortedUids}` avec `setDoc(..., { merge: true })`.
 */
export async function createOrOpenDirectConversation({
  user,
  groupId,
  profileData,
  conversations,
  targetUserId,
  initialMessage = ''
}) {
  if (!user?.uid || !targetUserId) return null;
  const normalizedGroupId = String(groupId || profileData?.groupId || 'samambaia').trim().toLowerCase() || 'samambaia';
  const deterministicId = getDeterministicDirectId(normalizedGroupId, user.uid, targetUserId);

  if (inFlightDirectLocks.has(deterministicId)) {
    return inFlightDirectLocks.get(deterministicId);
  }

  const taskPromise = (async () => {
    try {
      const nowIso = new Date().toISOString();
      const senderFullName = profileData?.prenom
        ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
        : user.displayName || 'Membre';

      // a) Recherche en mémoire parmi les conversations directes chargées
      const memoryMatches = (conversations || []).filter((c) =>
        isDirectPairConversation(c, user.uid, targetUserId)
      );
      const bestInMemory = pickBestDirectConversation(memoryMatches);
      if (bestInMemory) {
        await appendInitialDirectMessage(bestInMemory.id, bestInMemory.participantIds, normalizedGroupId, user, senderFullName, profileData, initialMessage, nowIso);
        return bestInMemory.id;
      }

      // b) Vérification Firestore avant toute création
      const convSnap = await getDocs(
        query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid))
      );
      const firestoreMatches = [];
      convSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const docGroup = String(data.groupId || 'samambaia').trim().toLowerCase();
        if (docGroup === normalizedGroupId && isDirectPairConversation(data, user.uid, targetUserId)) {
          firestoreMatches.push({ id: docSnap.id, ...data });
        }
      });
      const bestInFirestore = pickBestDirectConversation(firestoreMatches);
      if (bestInFirestore) {
        await appendInitialDirectMessage(bestInFirestore.id, bestInFirestore.participantIds, normalizedGroupId, user, senderFullName, profileData, initialMessage, nowIso);
        return bestInFirestore.id;
      }

      // c) Création avec ID déterministe via setDoc (merge: true)
      const participants = [user.uid, targetUserId].sort();
      const newConvData = {
        groupId: normalizedGroupId,
        type: 'direct',
        name: null,
        participantIds: participants,
        adminIds: participants,
        createdBy: user.uid,
        createdAt: nowIso,
        updatedAt: nowIso,
        readStatus: { [user.uid]: nowIso }
      };

      await setDoc(doc(db, 'conversations', deterministicId), newConvData, { merge: true });
      await appendInitialDirectMessage(deterministicId, participants, normalizedGroupId, user, senderFullName, profileData, initialMessage, nowIso);
      return deterministicId;
    } catch (err) {
      console.warn('conversationActionsUtils - Erreur ouverture/création conversation directe :', err?.message || err);
      return null;
    } finally {
      inFlightDirectLocks.delete(deterministicId);
    }
  })();

  inFlightDirectLocks.set(deterministicId, taskPromise);
  return taskPromise;
}

export async function createGroupConversationDoc({
  user,
  groupId,
  profileData,
  name,
  participantIds = [],
  initialMessage = ''
}) {
  if (!user?.uid || !name?.trim()) return null;
  const trimmedName = name.trim();
  const allParticipants = Array.from(new Set([user.uid, ...participantIds]));
  const nowIso = new Date().toISOString();
  const senderFullName = profileData?.prenom
    ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
    : user.displayName || 'Membre';

  const groupData = {
    groupId,
    type: 'group',
    name: trimmedName,
    participantIds: allParticipants,
    adminIds: [user.uid],
    createdBy: user.uid,
    createdAt: nowIso,
    updatedAt: nowIso,
    readStatus: { [user.uid]: nowIso }
  };

  if (initialMessage && initialMessage.trim()) {
    groupData.lastMessage = {
      content: initialMessage.trim(),
      senderId: user.uid,
      senderName: senderFullName,
      timestamp: nowIso
    };
  }

  const convRef = await addDoc(collection(db, 'conversations'), groupData);
  if (initialMessage && initialMessage.trim()) {
    await addDoc(collection(db, 'conversation_messages'), {
      conversationId: convRef.id,
      groupId,
      participantIds: allParticipants,
      senderId: user.uid,
      senderName: senderFullName,
      senderAvatar: profileData?.photoURL || user?.photoURL || '',
      content: initialMessage.trim(),
      timestamp: nowIso,
      reactions: {}
    });
  }
  return convRef.id;
}

export const addConversationParticipants = (id, ids = []) =>
  id && ids.length > 0 ? updateDoc(doc(db, 'conversations', id), { participantIds: arrayUnion(...ids), updatedAt: new Date().toISOString() }) : undefined;

export const removeConversationParticipant = (id, memberId) =>
  id && memberId ? updateDoc(doc(db, 'conversations', id), { participantIds: arrayRemove(memberId), adminIds: arrayRemove(memberId), updatedAt: new Date().toISOString() }) : undefined;
