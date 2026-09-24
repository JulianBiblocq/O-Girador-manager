import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { dispatchBulkInAppAndPushNotification, NOTIFICATION_TYPES } from '../utils/inAppNotificationService';

/**
 * Hook personnalisé useConversationMessages
 * Synchronise les messages d'une discussion active (directe ou de groupe) en temps réel.
 * Respecte l'isolation multi-tenant groupId et la dénormalisation de participantIds.
 *
 * @param {string} conversationId - Identifiant de la conversation
 * @param {string} groupId - Identifiant de l'association courante
 * @param {Object} user - Utilisateur connecté
 * @param {Object} profileData - Profil complet de l'utilisateur
 * @param {Array<string>} participantIds - Liste des participants de la conversation
 * @param {Object} [conversation] - Métadonnées de la conversation (type, nom)
 */
export function useConversationMessages(conversationId, groupId, user, profileData, participantIds = [], conversation = null) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Synchronisation temps réel des messages de la conversation
  useEffect(() => {
    if (!conversationId || !groupId || !user?.uid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'conversation_messages');
    const q = query(
      messagesRef,
      where('groupId', '==', groupId),
      where('conversationId', '==', conversationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Tri chronologique des messages
        fetched.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
        setMessages(fetched);
        setLoading(false);
      },
      (err) => {
        console.error('useConversationMessages - Erreur chargement messages :', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, groupId, user?.uid]);

  // 2. Envoyer un nouveau message (texte, image et/ou fichier joint)
  const sendMessage = useCallback(
    async ({ content, replyTo = null, imageUrl = null, thumbnailUrl = null, mediaName = null, fileUrl = null, fileName = null }) => {
      const trimmed = (content || '').trim();
      const hasImage = Boolean(imageUrl);
      const hasFile = Boolean(fileUrl);
      if ((!trimmed && !hasImage && !hasFile) || !conversationId || !groupId || !user?.uid) return null;

      const effectiveContent = trimmed || (hasImage ? '📷 Photo' : (hasFile ? `📎 ${fileName || 'Fichier joint'}` : ''));
      const nowIso = new Date().toISOString();
      const senderFullName = profileData?.prenom
        ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
        : user.displayName || 'Membre';

      const effectiveParticipants = Array.isArray(participantIds) && participantIds.length > 0
        ? participantIds
        : [user.uid];

      const newMsgData = {
        conversationId,
        groupId,
        participantIds: effectiveParticipants,
        senderId: user.uid,
        senderName: senderFullName,
        senderAvatar: profileData?.photoURL || user.photoURL || '',
        content: effectiveContent,
        imageUrl: imageUrl || null,
        thumbnailUrl: thumbnailUrl || imageUrl || null,
        mediaName: mediaName || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        timestamp: nowIso,
        replyTo: replyTo ? {
          id: replyTo.id,
          senderName: replyTo.senderName || 'Membre',
          content: (replyTo.content || '').slice(0, 120)
        } : null,
        reactions: {}
      };

      try {
        // Enregistrer le message dans Firestore
        const msgRef = await addDoc(collection(db, 'conversation_messages'), newMsgData);

        // Mettre à jour l'en-tête de la conversation et acquitter la lecture pour l'expéditeur
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          updatedAt: nowIso,
          lastMessage: {
            content: effectiveContent,
            imageUrl: imageUrl || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            senderId: user.uid,
            senderName: senderFullName,
            timestamp: nowIso
          },
          [`readStatus.${user.uid}`]: nowIso
        });

        // 3. Diffuser les notifications aux autres participants
        try {
          const otherParticipants = effectiveParticipants.filter((uid) => uid !== user.uid);
          if (otherParticipants.length > 0) {
            const isGroup = conversation?.type === 'group';
            const cleanSnippet = effectiveContent.length > 80 
              ? `${effectiveContent.slice(0, 80)}...` 
              : effectiveContent;

            const notifType = isGroup ? NOTIFICATION_TYPES.CHAT_GROUP : NOTIFICATION_TYPES.CHAT_DIRECT;
            const notifTitle = isGroup 
              ? `👥 ${conversation?.name || 'Groupe'} : ${senderFullName}`
              : `✉️ ${senderFullName}`;
            const targetUrl = isGroup
              ? `/forum?tab=groups&conversationId=${conversationId}`
              : `/forum?tab=inbox&conversationId=${conversationId}`;

            await dispatchBulkInAppAndPushNotification({
              recipientIds: otherParticipants,
              groupId,
              type: notifType,
              titre: notifTitle,
              message: `"${cleanSnippet}"`,
              targetUrl,
              sendPush: true
            });
          }
        } catch (notifErr) {
          console.warn('useConversationMessages - Erreur envoi notifications participants :', notifErr);
        }

        return msgRef.id;
      } catch (err) {
        console.error('useConversationMessages - Erreur envoi message :', err);
        throw err;
      }
    },
    [conversationId, groupId, user?.uid, profileData, participantIds, conversation]
  );

  // 3. Basculer une réaction emoji sur un message
  const toggleReaction = useCallback(
    async (messageId, emoji) => {
      if (!messageId || !emoji || !user?.uid) return;

      const targetMsg = messages.find((m) => m.id === messageId);
      if (!targetMsg) return;

      const currentReactions = { ...(targetMsg.reactions || {}) };
      const userList = Array.isArray(currentReactions[emoji]) ? [...currentReactions[emoji]] : [];

      const userIndex = userList.indexOf(user.uid);
      if (userIndex > -1) {
        // Retirer la réaction
        userList.splice(userIndex, 1);
      } else {
        // Ajouter la réaction
        userList.push(user.uid);
      }

      if (userList.length === 0) {
        delete currentReactions[emoji];
      } else {
        currentReactions[emoji] = userList;
      }

      try {
        const msgRef = doc(db, 'conversation_messages', messageId);
        await updateDoc(msgRef, {
          reactions: currentReactions
        });
      } catch (err) {
        console.error('useConversationMessages - Erreur bascule réaction emoji :', err);
      }
    },
    [messages, user?.uid]
  );

  // 4. Modifier un message existant (auteur uniquement)
  const editMessage = useCallback(
    async (messageId, newContent) => {
      const trimmed = (newContent || '').trim();
      if (!messageId || !user?.uid || !trimmed) return;

      const targetMsg = messages.find((m) => m.id === messageId);
      if (!targetMsg || targetMsg.senderId !== user.uid) {
        throw new Error("Action non autorisée : vous ne pouvez modifier que vos propres messages.");
      }

      try {
        const nowIso = new Date().toISOString();
        const msgRef = doc(db, 'conversation_messages', messageId);
        await updateDoc(msgRef, {
          content: trimmed,
          isEdited: true,
          editedAt: nowIso
        });

        // Mettre à jour l'aperçu du dernier message de la conversation s'il s'agissait du dernier message
        if (conversationId && messages.length > 0 && messages[messages.length - 1]?.id === messageId) {
          const convRef = doc(db, 'conversations', conversationId);
          await updateDoc(convRef, {
            'lastMessage.content': trimmed
          }).catch(() => {});
        }
      } catch (err) {
        console.error('useConversationMessages - Erreur modification message :', err);
        throw err;
      }
    },
    [conversationId, messages, user?.uid]
  );

  // 5. Supprimer un message (auteur uniquement pour les messages privés et de groupe)
  const deleteMessage = useCallback(
    async (messageId) => {
      if (!messageId || !user?.uid) return;

      const targetMsg = messages.find((m) => m.id === messageId);
      if (targetMsg && targetMsg.senderId !== user.uid) {
        throw new Error("Action non autorisée : vous ne pouvez supprimer que vos propres messages.");
      }

      try {
        await deleteDoc(doc(db, 'conversation_messages', messageId));

        // Mettre à jour l'aperçu si le message supprimé était le dernier de la conversation
        if (conversationId && messages.length > 0 && messages[messages.length - 1]?.id === messageId) {
          const remaining = messages.filter((m) => m.id !== messageId);
          const prevMsg = remaining.length > 0 ? remaining[remaining.length - 1] : null;
          const convRef = doc(db, 'conversations', conversationId);
          if (prevMsg) {
            await updateDoc(convRef, {
              lastMessage: {
                content: prevMsg.content || (prevMsg.imageUrl ? '📷 Photo' : (prevMsg.fileUrl ? `📎 ${prevMsg.fileName || 'Fichier'}` : '')),
                senderId: prevMsg.senderId,
                senderName: prevMsg.senderName,
                timestamp: prevMsg.timestamp
              }
            }).catch(() => {});
          } else {
            await updateDoc(convRef, {
              lastMessage: null
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('useConversationMessages - Erreur suppression message :', err);
        throw err;
      }
    },
    [conversationId, messages, user?.uid]
  );

  return {
    messages,
    loading,
    sendMessage,
    toggleReaction,
    deleteMessage,
    editMessage
  };
}
