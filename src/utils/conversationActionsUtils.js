import {
  collection,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Actions d'écriture Firestore pour les conversations directes et de groupe.
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

  try {
    const existing = (conversations || []).find(
      (c) =>
        c.type === 'direct' &&
        Array.isArray(c.participantIds) &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(user.uid) &&
        c.participantIds.includes(targetUserId)
    );

    const nowIso = new Date().toISOString();
    const senderFullName = profileData?.prenom
      ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
      : user.displayName || 'Membre';

    if (existing) {
      if (initialMessage && initialMessage.trim()) {
        await addDoc(collection(db, 'conversation_messages'), {
          conversationId: existing.id,
          groupId: normalizedGroupId,
          participantIds: existing.participantIds,
          senderId: user.uid,
          senderName: senderFullName,
          senderAvatar: profileData?.photoURL || user?.photoURL || '',
          content: initialMessage.trim(),
          timestamp: nowIso,
          reactions: {}
        });
        await updateDoc(doc(db, 'conversations', existing.id), {
          updatedAt: nowIso,
          lastMessage: {
            content: initialMessage.trim(),
            senderId: user.uid,
            senderName: senderFullName,
            timestamp: nowIso
          },
          [`readStatus.${user.uid}`]: nowIso
        });
      }
      return existing.id;
    }

    const participants = [user.uid, targetUserId];
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

    if (initialMessage && initialMessage.trim()) {
      newConvData.lastMessage = {
        content: initialMessage.trim(),
        senderId: user.uid,
        senderName: senderFullName,
        timestamp: nowIso
      };
    } else {
      try {
        const pmRef = collection(db, 'private_messages');
        const [snapSent, snapRecv] = await Promise.all([
          getDocs(query(pmRef, where('senderId', '==', user.uid), where('recipientId', '==', targetUserId))),
          getDocs(query(pmRef, where('recipientId', '==', user.uid), where('senderId', '==', targetUserId)))
        ]);
        const allPms = [];
        snapSent.forEach((d) => allPms.push(d.data()));
        snapRecv.forEach((d) => allPms.push(d.data()));
        if (allPms.length > 0) {
          allPms.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
          const latest = allPms[0];
          newConvData.lastMessage = {
            content: latest.content || '',
            senderId: latest.senderId,
            timestamp: latest.timestamp || nowIso
          };
          newConvData.updatedAt = latest.timestamp || nowIso;
        }
      } catch {}
    }

    const convRef = await addDoc(collection(db, 'conversations'), newConvData);
    if (initialMessage && initialMessage.trim()) {
      await addDoc(collection(db, 'conversation_messages'), {
        conversationId: convRef.id,
        groupId: normalizedGroupId,
        participantIds: participants,
        senderId: user.uid,
        senderName: senderFullName,
        senderAvatar: profileData?.photoURL || user?.photoURL || '',
        content: initialMessage.trim(),
        timestamp: nowIso,
        reactions: {}
      });
    }
    return convRef.id;
  } catch (err) {
    console.warn('conversationActionsUtils - Erreur création conversation directe :', err?.message || err);
    return null;
  }
}

export const addConversationParticipants = (id, ids = []) =>
  id && ids.length > 0 ? updateDoc(doc(db, 'conversations', id), { participantIds: arrayUnion(...ids), updatedAt: new Date().toISOString() }) : undefined;

export const removeConversationParticipant = (id, memberId) =>
  id && memberId ? updateDoc(doc(db, 'conversations', id), { participantIds: arrayRemove(memberId), adminIds: arrayRemove(memberId), updatedAt: new Date().toISOString() }) : undefined;
