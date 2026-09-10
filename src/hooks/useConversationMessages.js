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
 */
export function useConversationMessages(conversationId, groupId, user, profileData, participantIds = []) {
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

  // 2. Envoyer un nouveau message (texte et/ou image Framaspace externe)
  const sendMessage = useCallback(
    async ({ content, replyTo = null, imageUrl = null, thumbnailUrl = null, mediaName = null }) => {
      const trimmed = (content || '').trim();
      const hasImage = Boolean(imageUrl);
      if ((!trimmed && !hasImage) || !conversationId || !groupId || !user?.uid) return null;

      const effectiveContent = trimmed || (hasImage ? '📷 Photo' : '');
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
            senderId: user.uid,
            senderName: senderFullName,
            timestamp: nowIso
          },
          [`readStatus.${user.uid}`]: nowIso
        });

        return msgRef.id;
      } catch (err) {
        console.error('useConversationMessages - Erreur envoi message :', err);
        throw err;
      }
    },
    [conversationId, groupId, user?.uid, profileData, participantIds]
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

  // 4. Supprimer un message (auteur ou administrateur)
  const deleteMessage = useCallback(
    async (messageId) => {
      if (!messageId || !user?.uid) return;

      try {
        await deleteDoc(doc(db, 'conversation_messages', messageId));
      } catch (err) {
        console.error('useConversationMessages - Erreur suppression message :', err);
        throw err;
      }
    },
    [user?.uid]
  );

  return {
    messages,
    loading,
    sendMessage,
    toggleReaction,
    deleteMessage
  };
}
