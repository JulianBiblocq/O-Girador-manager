/**
 * Actions unitaires de réaction, modification et suppression de messages
 * pour une discussion directe ou de groupe (`conversation_messages`).
 */

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

function isMessageAuthor(msg, uid) {
  if (!msg || !uid) return false;
  return (
    msg.senderId === uid ||
    msg.authorId === uid ||
    msg.userId === uid ||
    msg.auteurId === uid
  );
}

/**
 * Bascule une réaction emoji sur un message de conversation.
 */
export async function toggleConversationReaction({ messageId, emoji, uid, messages = [] }) {
  if (!messageId || !emoji || !uid) return;
  const targetMsg = messages.find((m) => m.id === messageId);
  if (!targetMsg) return;

  const currentReactions = { ...(targetMsg.reactions || {}) };
  const userList = Array.isArray(currentReactions[emoji]) ? [...currentReactions[emoji]] : [];
  const userIndex = userList.indexOf(uid);
  if (userIndex > -1) userList.splice(userIndex, 1);
  else userList.push(uid);

  if (userList.length === 0) delete currentReactions[emoji];
  else currentReactions[emoji] = userList;

  try {
    await updateDoc(doc(db, 'conversation_messages', messageId), { reactions: currentReactions });
  } catch (err) {
    console.error('conversationMessageActions - Erreur bascule réaction emoji :', err);
  }
}

/**
 * Modifie le contenu d'un message de conversation (auteur uniquement).
 */
export async function editConversationMessage({
  messageId,
  newContent,
  uid,
  messages = [],
  effectiveConversationId
}) {
  const trimmed = (newContent || '').trim();
  if (!messageId || !uid || !trimmed) return;
  const targetMsg = messages.find((m) => m.id === messageId);
  if (!isMessageAuthor(targetMsg, uid)) {
    throw new Error('Action non autorisée : vous ne pouvez modifier que vos propres messages.');
  }

  await updateDoc(doc(db, 'conversation_messages', messageId), {
    content: trimmed,
    isEdited: true,
    editedAt: new Date().toISOString()
  });

  if (effectiveConversationId && messages.length > 0 && messages[messages.length - 1]?.id === messageId) {
    await updateDoc(doc(db, 'conversations', effectiveConversationId), {
      'lastMessage.content': trimmed
    }).catch(() => {});
  }
}

/**
 * Supprime un message de conversation (auteur uniquement) et synchronise `lastMessage`.
 */
export async function deleteConversationMessage({
  messageId,
  uid,
  messages = [],
  effectiveConversationId
}) {
  if (!messageId || !uid) return;
  const targetMsg = messages.find((m) => m.id === messageId);
  if (!isMessageAuthor(targetMsg, uid)) {
    throw new Error('Action non autorisée : vous ne pouvez supprimer que vos propres messages.');
  }

  await deleteDoc(doc(db, 'conversation_messages', messageId));
  if (effectiveConversationId && messages.length > 0 && messages[messages.length - 1]?.id === messageId) {
    const remaining = messages.filter((m) => m.id !== messageId);
    const prevMsg = remaining.length > 0 ? remaining[remaining.length - 1] : null;
    await updateDoc(doc(db, 'conversations', effectiveConversationId), {
      lastMessage: prevMsg
        ? {
            content:
              prevMsg.content ||
              (prevMsg.imageUrl ? '📷 Photo' : prevMsg.fileUrl ? `📎 ${prevMsg.fileName || 'Fichier'}` : ''),
            senderId: prevMsg.senderId,
            senderName: prevMsg.senderName,
            timestamp: prevMsg.timestamp
          }
        : null
    }).catch(() => {});
  }
}

