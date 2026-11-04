import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  getGeneralConversationId,
  isGeneralGroupConversation,
  ensureGeneralGroupConversation
} from '../utils/generalGroupChatUtils';
import { isPushCooldownActive } from '../utils/forumThreadSyncUtils';

/**
 * Hook personnalisé useConversationMessages
 * Synchronise les messages d'une discussion active (directe ou de groupe) en temps réel.
 * Normalise systématiquement `general_${groupId}` en minuscules et assure le repli
 * sur `participantIds` pour éviter tout blocage de permission sur les anciens messages.
 */
export function useConversationMessages(conversationId, groupId, user, profileData, participantIds = [], conversation = null) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizedGroupId = useMemo(
    () => String(groupId || profileData?.groupId || conversation?.groupId || 'samambaia').trim().toLowerCase() || 'samambaia',
    [groupId, profileData?.groupId, conversation?.groupId]
  );

  const isGeneralGroup = useMemo(
    () =>
      isGeneralGroupConversation(conversation, normalizedGroupId) ||
      isGeneralGroupConversation(conversationId, normalizedGroupId),
    [conversation, conversationId, normalizedGroupId]
  );

  const effectiveConversationId = useMemo(() => {
    if (!conversationId) return '';
    return isGeneralGroup ? getGeneralConversationId(normalizedGroupId) : conversationId;
  }, [conversationId, isGeneralGroup, normalizedGroupId]);

  // 1. Synchronisation temps réel des messages de la conversation
  useEffect(() => {
    if (!effectiveConversationId || !user?.uid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'conversation_messages');
    let fallbackUnsub = null;

    const applySnapshot = (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      fetched.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      setMessages(fetched);
      setLoading(false);
    };

    const subscribeWithParticipantFilter = () => {
      const qFallback = query(
        messagesRef,
        where('conversationId', '==', effectiveConversationId),
        where('participantIds', 'array-contains', user.uid)
      );
      fallbackUnsub = onSnapshot(
        qFallback,
        applySnapshot,
        (err) => {
          console.warn('useConversationMessages - Repli lecture messages :', err?.message || err);
          setLoading(false);
        }
      );
    };

    if (isGeneralGroup) {
      const qGeneral = query(
        messagesRef,
        where('conversationId', '==', effectiveConversationId)
      );
      const unsubPrimary = onSnapshot(
        qGeneral,
        applySnapshot,
        () => {
          // Si les règles Firestore exigent `user.uid in participantIds`, basculer instantanément
          subscribeWithParticipantFilter();
        }
      );
      return () => {
        unsubPrimary();
        if (fallbackUnsub) fallbackUnsub();
      };
    }

    subscribeWithParticipantFilter();
    return () => {
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [effectiveConversationId, isGeneralGroup, user?.uid]);

  // 2. Envoyer un nouveau message (texte, image et/ou fichier joint)
  const sendMessage = useCallback(
    async ({ content, replyTo = null, imageUrl = null, thumbnailUrl = null, mediaName = null, fileUrl = null, fileName = null }) => {
      const trimmed = (content || '').trim();
      const hasImage = Boolean(imageUrl);
      const hasFile = Boolean(fileUrl);
      if ((!trimmed && !hasImage && !hasFile) || !effectiveConversationId || !user?.uid) return null;

      const effectiveContent = trimmed || (hasImage ? '📷 Photo' : (hasFile ? `📎 ${fileName || 'Fichier joint'}` : ''));
      const nowIso = new Date().toISOString();
      const senderFullName = profileData?.prenom
        ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
        : user.displayName || 'Membre';

      let effectiveParticipants = Array.isArray(participantIds) && participantIds.length > 0
        ? Array.from(new Set([user.uid, ...participantIds]))
        : [user.uid];

      if (isGeneralGroup && effectiveParticipants.length <= 1) {
        const resolvedParticipants = await ensureGeneralGroupConversation({
          userId: user.uid,
          groupId: normalizedGroupId,
          returnParticipants: true
        });
        if (Array.isArray(resolvedParticipants) && resolvedParticipants.length > 0) {
          effectiveParticipants = Array.from(new Set([user.uid, ...resolvedParticipants]));
        }
      }

      const isGroup = conversation?.type === 'group' || isGeneralGroup;
      const hasDirectMention = /@[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/.test(effectiveContent);
      const shouldSendPush = hasDirectMention
        ? true
        : !(isGroup && isPushCooldownActive(conversation?.lastPushSentAt));

      const newMsgData = {
        conversationId: effectiveConversationId,
        groupId: normalizedGroupId,
        participantIds: effectiveParticipants,
        senderId: user.uid,
        senderName: senderFullName,
        senderAvatar: profileData?.photoURL || user?.photoURL || '',
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

      const msgRef = await addDoc(collection(db, 'conversation_messages'), newMsgData);

      const convRef = doc(db, 'conversations', effectiveConversationId);
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
        [`readStatus.${user.uid}`]: nowIso,
        ...(shouldSendPush ? { lastPushSentAt: nowIso } : {})
      }).catch(() => {});

      try {
        const otherParticipants = effectiveParticipants.filter((uid) => uid !== user.uid);
        if (otherParticipants.length > 0) {
          const cleanSnippet = effectiveContent.length > 80
            ? `${effectiveContent.slice(0, 80)}...`
            : effectiveContent;
          const notifType = isGroup ? NOTIFICATION_TYPES.CHAT_GROUP : NOTIFICATION_TYPES.CHAT_DIRECT;
          const notifTitle = isGroup
            ? `👥 ${conversation?.name || (isGeneralGroup ? '💬 Tout le groupe' : 'Groupe')} : ${senderFullName}`
            : `✉️ ${senderFullName}`;
          const targetUrl = isGroup
            ? `/forum?tab=groups&conversationId=${effectiveConversationId}`
            : `/forum?tab=inbox&conversationId=${effectiveConversationId}`;

          await dispatchBulkInAppAndPushNotification({
            recipientIds: otherParticipants,
            groupId: normalizedGroupId,
            type: notifType,
            titre: notifTitle,
            message: `"${cleanSnippet}"`,
            targetUrl,
            sendPush: shouldSendPush
          });
        }
      } catch (notifErr) {
        console.warn('useConversationMessages - Erreur envoi notifications participants :', notifErr);
      }

      return msgRef.id;
    },
    [effectiveConversationId, normalizedGroupId, isGeneralGroup, user, profileData, participantIds, conversation]
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
      if (userIndex > -1) userList.splice(userIndex, 1);
      else userList.push(user.uid);

      if (userList.length === 0) delete currentReactions[emoji];
      else currentReactions[emoji] = userList;

      try {
        await updateDoc(doc(db, 'conversation_messages', messageId), { reactions: currentReactions });
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
      const isAuthor = targetMsg && (
        targetMsg.senderId === user.uid ||
        targetMsg.authorId === user.uid ||
        targetMsg.userId === user.uid ||
        targetMsg.auteurId === user.uid
      );
      if (!isAuthor) throw new Error("Action non autorisée : vous ne pouvez modifier que vos propres messages.");

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
    },
    [effectiveConversationId, messages, user?.uid]
  );

  // 5. Supprimer un message (auteur uniquement)
  const deleteMessage = useCallback(
    async (messageId) => {
      if (!messageId || !user?.uid) return;
      const targetMsg = messages.find((m) => m.id === messageId);
      const isAuthor = targetMsg && (
        targetMsg.senderId === user.uid ||
        targetMsg.authorId === user.uid ||
        targetMsg.userId === user.uid ||
        targetMsg.auteurId === user.uid
      );
      if (!isAuthor) throw new Error("Action non autorisée : vous ne pouvez supprimer que vos propres messages.");

      await deleteDoc(doc(db, 'conversation_messages', messageId));
      if (effectiveConversationId && messages.length > 0 && messages[messages.length - 1]?.id === messageId) {
        const remaining = messages.filter((m) => m.id !== messageId);
        const prevMsg = remaining.length > 0 ? remaining[remaining.length - 1] : null;
        await updateDoc(doc(db, 'conversations', effectiveConversationId), {
          lastMessage: prevMsg ? {
            content: prevMsg.content || (prevMsg.imageUrl ? '📷 Photo' : (prevMsg.fileUrl ? `📎 ${prevMsg.fileName || 'Fichier'}` : '')),
            senderId: prevMsg.senderId,
            senderName: prevMsg.senderName,
            timestamp: prevMsg.timestamp
          } : null
        }).catch(() => {});
      }
    },
    [effectiveConversationId, messages, user?.uid]
  );

  return { messages, loading, sendMessage, toggleReaction, deleteMessage, editMessage };
}
