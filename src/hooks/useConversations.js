import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook personnalisé useConversations
 * Gère la synchronisation en temps réel des discussions directes et des groupes privés multi-membres.
 * Garantit une stricte isolation multi-tenant par groupId.
 *
 * @param {Object} user - Objet utilisateur authentifié Firebase Auth
 * @param {string} groupId - Identifiant de l'association courante
 * @param {Object} profileData - Profil complet de l'utilisateur
 */
export function useConversations(user, groupId, profileData) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Synchronisation temps réel des conversations de l'utilisateur au sein du groupe
  useEffect(() => {
    if (!user?.uid || !groupId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convRef = collection(db, 'conversations');
    const q = query(
      convRef,
      where('groupId', '==', groupId),
      where('participantIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Trier par date de dernière activité (mise à jour ou création) décroissante
        list.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.lastMessage?.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.lastMessage?.timestamp || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setConversations(list);
        setLoading(false);
      },
      (err) => {
        console.warn('useConversations - Écoute conversations non disponible ou restreinte (repli messages legacy actif) :', err?.message || err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, groupId]);

  // 2. Calcul des statuts de lecture et ventilation des compteurs de non-lus
  const { conversationsWithUnread, totalUnreadCount, unreadDirectCount, unreadGroupsCount } = useMemo(() => {
    if (!user?.uid || !conversations || !Array.isArray(conversations)) {
      return {
        conversationsWithUnread: [],
        totalUnreadCount: 0,
        unreadDirectCount: 0,
        unreadGroupsCount: 0
      };
    }

    let totalUnread = 0;
    let directUnread = 0;
    let groupsUnread = 0;

    const list = conversations.map((conv) => {
      const lastMsg = conv.lastMessage;
      const lastReadIso = conv.readStatus?.[user.uid];

      // Une conversation a un message non lu si le dernier message existe,
      // n'a pas été envoyé par l'utilisateur connecté, et est postérieur au dernier acquittement
      let isUnread = false;
      if (lastMsg && lastMsg.senderId !== user.uid) {
        if (!lastReadIso) {
          isUnread = true;
        } else {
          isUnread = new Date(lastMsg.timestamp) > new Date(lastReadIso);
        }
      }

      // Règle de rétrocompatibilité : toute conversation sans type 'group' est considérée comme 'direct'
      const normalizedType = conv.type === 'group' ? 'group' : 'direct';

      if (isUnread) {
        totalUnread += 1;
        if (normalizedType === 'group') {
          groupsUnread += 1;
        } else {
          directUnread += 1;
        }
      }

      return {
        ...conv,
        type: normalizedType,
        isUnread
      };
    });

    return {
      conversationsWithUnread: list,
      totalUnreadCount: totalUnread,
      unreadDirectCount: directUnread,
      unreadGroupsCount: groupsUnread
    };
  }, [conversations, user?.uid]);

  // 3. Créer ou retrouver une discussion directe 1-à-1
  const createDirectConversation = useCallback(
    async (targetUserId, initialMessage = '') => {
      if (!user?.uid || !groupId || !targetUserId) return null;

      try {
        // Vérifier si une discussion directe existe déjà entre ces deux membres dans ce groupe
        const existing = conversations.find(
          (c) =>
            c.type === 'direct' &&
            Array.isArray(c.participantIds) &&
            c.participantIds.length === 2 &&
            c.participantIds.includes(user.uid) &&
            c.participantIds.includes(targetUserId)
        );

        if (existing) {
          // Si un message initial est fourni, l'envoyer dans la conversation existante
          if (initialMessage && initialMessage.trim()) {
            const nowIso = new Date().toISOString();
            const senderFullName = profileData?.prenom
              ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
              : user.displayName || 'Membre';

            await addDoc(collection(db, 'conversation_messages'), {
              conversationId: existing.id,
              groupId,
              participantIds: existing.participantIds,
              senderId: user.uid,
              senderName: senderFullName,
              senderAvatar: profileData?.photoURL || user.photoURL || '',
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

        // Sinon, créer un nouveau document de conversation directe
        const nowIso = new Date().toISOString();
        const senderFullName = profileData?.prenom
          ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
          : user.displayName || 'Membre';

        const participants = [user.uid, targetUserId];

        const newConvData = {
          groupId,
          type: 'direct',
          name: null,
          participantIds: participants,
          adminIds: participants,
          createdBy: user.uid,
          createdAt: nowIso,
          updatedAt: nowIso,
          readStatus: {
            [user.uid]: nowIso
          }
        };

        if (initialMessage && initialMessage.trim()) {
          newConvData.lastMessage = {
            content: initialMessage.trim(),
            senderId: user.uid,
            senderName: senderFullName,
            timestamp: nowIso
          };
        }

        const convRef = await addDoc(collection(db, 'conversations'), newConvData);

        if (initialMessage && initialMessage.trim()) {
          await addDoc(collection(db, 'conversation_messages'), {
            conversationId: convRef.id,
            groupId,
            participantIds: participants,
            senderId: user.uid,
            senderName: senderFullName,
            senderAvatar: profileData?.photoURL || user.photoURL || '',
            content: initialMessage.trim(),
            timestamp: nowIso,
            reactions: {}
          });
        }

        return convRef.id;
      } catch (err) {
        console.warn('useConversations - Impossible de créer/ouvrir la conversation dans Firestore (repli legacy actif) :', err?.message || err);
        return null;
      }
    },
    [user?.uid, groupId, profileData, conversations]
  );

  // 4. Créer une boucle de discussion de groupe privée
  const createGroupConversation = useCallback(
    async ({ name, participantIds = [], initialMessage = '' }) => {
      if (!user?.uid || !groupId || !name?.trim()) return null;

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
        adminIds: [user.uid], // Le créateur est automatiquement administrateur du groupe
        createdBy: user.uid,
        createdAt: nowIso,
        updatedAt: nowIso,
        readStatus: {
          [user.uid]: nowIso
        }
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
          senderAvatar: profileData?.photoURL || user.photoURL || '',
          content: initialMessage.trim(),
          timestamp: nowIso,
          reactions: {}
        });
      }

      return convRef.id;
    },
    [user?.uid, groupId, profileData]
  );

  // 5. Acquitter la lecture d'une conversation
  const markConversationAsRead = useCallback(
    async (conversationId) => {
      if (!user?.uid || !conversationId) return;

      const nowIso = new Date().toISOString();
      try {
        await updateDoc(doc(db, 'conversations', conversationId), {
          [`readStatus.${user.uid}`]: nowIso
        });
      } catch (err) {
        console.error('useConversations - Erreur marquage comme lu :', err);
      }
    },
    [user?.uid]
  );

  // 6. Ajouter un ou plusieurs participants à un groupe
  const addParticipantsToGroup = useCallback(
    async (conversationId, newMemberIds = []) => {
      if (!conversationId || !Array.isArray(newMemberIds) || newMemberIds.length === 0) return;

      try {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          participantIds: arrayUnion(...newMemberIds),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('useConversations - Erreur ajout de participants :', err);
        throw err;
      }
    },
    []
  );

  // 7. Retirer un participant d'un groupe (réservé admin ou modérateur)
  const removeParticipantFromGroup = useCallback(
    async (conversationId, memberId) => {
      if (!conversationId || !memberId) return;

      try {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          participantIds: arrayRemove(memberId),
          adminIds: arrayRemove(memberId),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('useConversations - Erreur retrait de participant :', err);
        throw err;
      }
    },
    []
  );

  // 8. Quitter volontairement un groupe
  const leaveGroup = useCallback(
    async (conversationId) => {
      if (!user?.uid || !conversationId) return;

      try {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          participantIds: arrayRemove(user.uid),
          adminIds: arrayRemove(user.uid),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('useConversations - Erreur lors de la sortie du groupe :', err);
        throw err;
      }
    },
    [user?.uid]
  );

  // 9. Renommer un groupe de discussion
  const renameGroup = useCallback(
    async (conversationId, newName) => {
      if (!conversationId || !newName?.trim()) return;

      try {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          name: newName.trim(),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('useConversations - Erreur renommage du groupe :', err);
        throw err;
      }
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
