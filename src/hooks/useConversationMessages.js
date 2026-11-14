import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  dispatchBulkInAppAndPushNotification,
  getActiveGroupMemberUids,
  NOTIFICATION_TYPES
} from '../utils/inAppNotificationService';
import {
  getGeneralConversationId,
  isGeneralGroupConversation,
  ensureGeneralGroupConversation,
  resolveZapDisplayName
} from '../utils/generalGroupChatUtils';
import { isPushCooldownActive } from '../utils/forumThreadSyncUtils';
import {
  toggleConversationReaction,
  editConversationMessage,
  deleteConversationMessage
} from '../utils/conversationMessageActions';

/**
 * Hook personnalisé useConversationMessages
 * Synchronise les messages d'une discussion active (directe ou de groupe) en temps réel.
 * Pour « 💬 Le Zap », résout systématiquement 100 % des membres actifs afin que
 * chaque membre reçoive la cloche interne (🔔) et la notification Push.
 */
export function useConversationMessages(
  conversationId,
  groupId,
  user,
  profileData,
  participantIds = [],
  conversation = null
) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizedGroupId = useMemo(
    () =>
      String(groupId || profileData?.groupId || conversation?.groupId || 'samambaia')
        .trim()
        .toLowerCase() || 'samambaia',
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

  useEffect(() => {
    if (!effectiveConversationId || !user?.uid) {
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
      fallbackUnsub = onSnapshot(qFallback, applySnapshot, (err) => {
        console.warn('useConversationMessages - Repli lecture messages :', err?.message || err);
        setLoading(false);
      });
    };

    if (isGeneralGroup) {
      const qGeneral = query(messagesRef, where('conversationId', '==', effectiveConversationId));
      const unsubPrimary = onSnapshot(qGeneral, applySnapshot, () => {
        subscribeWithParticipantFilter();
      });
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

  const sendMessage = useCallback(
    async ({
      content,
      replyTo = null,
      imageUrl = null,
      thumbnailUrl = null,
      mediaName = null,
      fileUrl = null,
      fileName = null
    }) => {
      const trimmed = (content || '').trim();
      const hasImage = Boolean(imageUrl);
      const hasFile = Boolean(fileUrl);
      if ((!trimmed && !hasImage && !hasFile) || !effectiveConversationId || !user?.uid) return null;

      const effectiveContent =
        trimmed || (hasImage ? '📷 Photo' : hasFile ? `📎 ${fileName || 'Fichier joint'}` : '');
      const nowIso = new Date().toISOString();
      const senderFullName = profileData?.prenom
        ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
        : user.displayName || 'Membre';

      let effectiveParticipants =
        Array.isArray(participantIds) && participantIds.length > 0
          ? Array.from(new Set([user.uid, ...participantIds]))
          : [user.uid];

      // Pour « 💬 Le Zap », toujours fusionner avec 100 % des membres actifs du groupe
      if (isGeneralGroup) {
        const [ensuredParticipants, allActiveUids] = await Promise.all([
          ensureGeneralGroupConversation({
            userId: user.uid,
            groupId: normalizedGroupId,
            returnParticipants: true
          }),
          getActiveGroupMemberUids(normalizedGroupId, null)
        ]);
        effectiveParticipants = Array.from(
          new Set([
            user.uid,
            ...effectiveParticipants,
            ...(Array.isArray(ensuredParticipants) ? ensuredParticipants : []),
            ...(Array.isArray(allActiveUids) ? allActiveUids : [])
          ].filter(Boolean))
        );
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
        replyTo: replyTo
          ? {
              id: replyTo.id,
              senderName: replyTo.senderName || 'Membre',
              content: (replyTo.content || '').slice(0, 120)
            }
          : null,
        reactions: {}
      };

      const msgRef = await addDoc(collection(db, 'conversation_messages'), newMsgData);

      const convRef = doc(db, 'conversations', effectiveConversationId);
      await updateDoc(convRef, {
        updatedAt: nowIso,
        ...(isGeneralGroup ? { participantIds: effectiveParticipants } : {}),
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
        const otherParticipants = effectiveParticipants.filter((uid) => uid && uid !== user.uid);
        if (otherParticipants.length > 0) {
          const cleanSnippet =
            effectiveContent.length > 80 ? `${effectiveContent.slice(0, 80)}...` : effectiveContent;
          const notifType = isGroup ? NOTIFICATION_TYPES.CHAT_GROUP : NOTIFICATION_TYPES.CHAT_DIRECT;
          const groupDisplayName = isGeneralGroup
            ? resolveZapDisplayName(conversation?.name, '💬 Le Zap')
            : (conversation?.name || 'Groupe');
          const notifTitle = isGroup
            ? `👥 ${groupDisplayName} : ${senderFullName}`
            : `✉️ ${senderFullName}`;
          const targetUrl = isGroup
            ? `/app/forum?tab=groups&conversationId=${effectiveConversationId}`
            : `/app/forum?tab=inbox&conversationId=${effectiveConversationId}`;

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

  const toggleReaction = useCallback(
    (messageId, emoji) => toggleConversationReaction({ messageId, emoji, uid: user?.uid, messages }),
    [messages, user?.uid]
  );

  const editMessage = useCallback(
    (messageId, newContent) =>
      editConversationMessage({ messageId, newContent, uid: user?.uid, messages, effectiveConversationId }),
    [effectiveConversationId, messages, user?.uid]
  );

  const deleteMessage = useCallback(
    (messageId) =>
      deleteConversationMessage({ messageId, uid: user?.uid, messages, effectiveConversationId }),
    [effectiveConversationId, messages, user?.uid]
  );

  const isReady = Boolean(effectiveConversationId && user?.uid);
  return {
    messages: isReady ? messages : [],
    loading: isReady ? loading : false,
    sendMessage,
    toggleReaction,
    deleteMessage,
    editMessage
  };
}
