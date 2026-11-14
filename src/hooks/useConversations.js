import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getGeneralConversationId,
  isGeneralGroupConversation,
  ensureGeneralGroupConversation,
  resolveZapDisplayName
} from '../utils/generalGroupChatUtils';
import {
  createOrOpenDirectConversation,
  createGroupConversationDoc,
  addConversationParticipants,
  removeConversationParticipant
} from '../utils/conversationActionsUtils';
import { deduplicateDirectConversations } from '../utils/directConversationDedupeUtils';

/**
 * Hook personnalisé useConversations
 * Synchronise en temps réel les discussions directes et de groupes multi-membres.
 * Garantit que le canal « 💬 Le Zap » (`general_${groupId}`) est toujours présent en tête de liste.
 */
export function useConversations(user, groupId, profileData) {
  const [conversations, setConversations] = useState([]);
  const [generalConvDoc, setGeneralConvDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const deletedDuplicateIdsRef = useRef(new Set());
  const userUid = user?.uid || '';

  const normalizedGroupId = useMemo(
    () => String(groupId || profileData?.groupId || 'samambaia').trim().toLowerCase() || 'samambaia',
    [groupId, profileData?.groupId]
  );

  // 1. Synchronisation temps réel des conversations de l'utilisateur au sein du groupe
  useEffect(() => {
    if (!userUid) return;

    const generalId = getGeneralConversationId(normalizedGroupId);
    ensureGeneralGroupConversation({ userId: userUid, groupId: normalizedGroupId });

    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participantIds', 'array-contains', userUid));

    const unsubscribeList = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docGroup = String(data.groupId || 'samambaia').trim().toLowerCase();
          if (docGroup === normalizedGroupId || docSnap.id.toLowerCase() === generalId) {
            list.push({ id: docSnap.id, ...data });
          }
        });

        // Dédoublonnage strict des fils 1-à-1 par interlocuteur et suppression silencieuse des doublons vides
        const deduplicatedList = deduplicateDirectConversations(list, userUid, deletedDuplicateIdsRef.current);

        deduplicatedList.sort((a, b) => {
          const isGenA = isGeneralGroupConversation(a, normalizedGroupId);
          const isGenB = isGeneralGroupConversation(b, normalizedGroupId);
          if (isGenA && !isGenB) return -1;
          if (!isGenA && isGenB) return 1;
          const timeA = new Date(a.updatedAt || a.lastMessage?.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.lastMessage?.timestamp || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setConversations(deduplicatedList);
        setLoading(false);
      },
      (err) => {
        console.warn('useConversations - Écoute conversations restreinte :', err?.message || err);
        setLoading(false);
      }
    );

    // Écoute directe du document general_${groupId} pour les membres dont participantIds est en cours de synchro
    const unsubscribeGeneral = onSnapshot(
      doc(db, 'conversations', generalId),
      (snap) => {
        if (snap.exists()) {
          setGeneralConvDoc({ id: snap.id, ...snap.data() });
        }
      },
      () => {
        // Ignorer silencieusement si la lecture directe attend encore participantIds
      }
    );

    return () => {
      unsubscribeList();
      unsubscribeGeneral();
    };
  }, [userUid, normalizedGroupId]);

  // 2. Calcul des statuts de lecture et garantie de présence du canal général en 1re position
  const { conversationsWithUnread, totalUnreadCount, unreadDirectCount, unreadGroupsCount } = useMemo(() => {
    if (!userUid) {
      return {
        conversationsWithUnread: [],
        totalUnreadCount: 0,
        unreadDirectCount: 0,
        unreadGroupsCount: 0
      };
    }

    const generalId = getGeneralConversationId(normalizedGroupId);
    const mergedRaw = Array.isArray(conversations) ? [...conversations] : [];
    if (generalConvDoc && !mergedRaw.some((c) => c.id === generalConvDoc.id || isGeneralGroupConversation(c, normalizedGroupId))) {
      mergedRaw.unshift(generalConvDoc);
    }

    let totalUnread = 0;
    let directUnread = 0;
    let groupsUnread = 0;

    const list = mergedRaw.map((conv) => {
      const lastMsg = conv.lastMessage;
      const lastReadIso = conv.readStatus?.[userUid];
      let isUnread = false;
      if (lastMsg && lastMsg.senderId !== userUid) {
        isUnread = !lastReadIso || new Date(lastMsg.timestamp) > new Date(lastReadIso);
      }

      const isGen = isGeneralGroupConversation(conv, normalizedGroupId);
      const normalizedType = conv.type === 'group' || isGen ? 'group' : 'direct';

      if (isUnread) {
        totalUnread += 1;
        if (normalizedType === 'group') groupsUnread += 1;
        else directUnread += 1;
      }

      return {
        ...conv,
        id: isGen ? generalId : conv.id,
        groupId: normalizedGroupId,
        type: normalizedType,
        isGeneralGroup: isGen,
        name: isGen ? resolveZapDisplayName(conv.name, '💬 Le Zap') : conv.name,
        isUnread
      };
    });

    // Toujours garantir l'affichage du Zap en tête du Porte-Voix pour 100 % des membres connectés
    if (generalId && !list.some((c) => c.id === generalId || c.isGeneralGroup)) {
      list.unshift({
        id: generalId,
        groupId: normalizedGroupId,
        type: 'group',
        isGeneralGroup: true,
        name: '💬 Le Zap',
        participantIds: [userUid],
        isUnread: false
      });
    } else {
      list.sort((a, b) => {
        if (a.isGeneralGroup && !b.isGeneralGroup) return -1;
        if (!a.isGeneralGroup && b.isGeneralGroup) return 1;
        return 0;
      });
    }

    return {
      conversationsWithUnread: list,
      totalUnreadCount: totalUnread,
      unreadDirectCount: directUnread,
      unreadGroupsCount: groupsUnread
    };
  }, [conversations, generalConvDoc, userUid, normalizedGroupId]);

  const createDirectConversation = useCallback(
    (targetUserId, initialMessage = '') =>
      createOrOpenDirectConversation({
        user,
        groupId: normalizedGroupId,
        profileData,
        conversations: conversationsWithUnread,
        targetUserId,
        initialMessage
      }),
    [user, normalizedGroupId, profileData, conversationsWithUnread]
  );

  const createGroupConversation = useCallback(
    ({ name, participantIds = [], initialMessage = '' }) =>
      createGroupConversationDoc({
        user,
        groupId: normalizedGroupId,
        profileData,
        name,
        participantIds,
        initialMessage
      }),
    [user, normalizedGroupId, profileData]
  );

  const markConversationAsRead = useCallback(
    async (conversationId) => {
      if (!userUid || !conversationId) return;
      try {
        await updateDoc(doc(db, 'conversations', conversationId), {
          [`readStatus.${userUid}`]: new Date().toISOString()
        });
      } catch {}
    },
    [userUid]
  );

  const addParticipantsToGroup = useCallback(
    (conversationId, newMemberIds = []) => addConversationParticipants(conversationId, newMemberIds),
    []
  );

  const removeParticipantFromGroup = useCallback(
    (conversationId, memberId) => removeConversationParticipant(conversationId, memberId),
    []
  );

  const leaveGroup = useCallback(
    async (conversationId) => {
      if (!userUid || !conversationId || String(conversationId).toLowerCase().startsWith('general_')) return;
      await updateDoc(doc(db, 'conversations', conversationId), {
        participantIds: arrayRemove(userUid),
        adminIds: arrayRemove(userUid),
        updatedAt: new Date().toISOString()
      });
    },
    [userUid]
  );

  const renameGroup = useCallback(
    async (conversationId, newName) => {
      if (!conversationId || !newName?.trim()) return;
      await updateDoc(doc(db, 'conversations', conversationId), {
        name: newName.trim(),
        updatedAt: new Date().toISOString()
      });
    },
    []
  );

  return {
    conversations: conversationsWithUnread,
    totalUnreadCount,
    unreadDirectCount,
    unreadGroupsCount,
    loading,
    createDirectConversation,
    createGroupConversation,
    markConversationAsRead,
    addParticipantsToGroup,
    removeParticipantFromGroup,
    leaveGroup,
    renameGroup
  };
}
