import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, addDoc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getFirstUnreadIndex } from '../utils/forumUnreadUtils';
import { useForumModeration } from './useForumModeration';
import { getTagId, resolveEffectiveUserTags } from '../utils/tagUtils';
import {
  isUserModeratorOrAdmin,
  canUserWriteInForumChannel,
  canUserReadForumChannel,
  checkUserAccessToList
} from '../utils/permissionUtils';
import useConfirm from './useConfirm';
import { extractMentionedUserIds } from '../components/forum/MentionAutocomplete';

/**
 * Hook personnalisé encapsulant toute la logique d'état, les écoutes temps réel,
 * la gestion du défilement et les mutations Firestore d'un sujet de discussion.
 *
 * @param {Object} params
 * @param {string} params.threadId Identifiant du sujet
 * @param {Object} params.user Utilisateur Firebase auth connecté
 * @param {Object} params.profileData Profil de l'utilisateur connecté
 * @param {Array} params.channels Liste des salons autorisés
 * @param {Array} params.allUsers Liste de tous les membres pour la détection de mentions
 * @param {boolean} params.breakGlassActive Mode passe-partout administratif
 * @param {Array} params.tagsDisponibles Liste des étiquettes configurées pour le groupe
 * @param {Array} params.effectiveUserTags Étiquettes effectives du membre
 * @param {Function} params.onClose Callback de fermeture (ex. lors d'une suppression)
 * @param {Function} params.t Fonction de traduction
 */
export function useThreadData({
  threadId,
  user,
  profileData,
  channels = [],
  allUsers = [],
  breakGlassActive = false,
  tagsDisponibles = [],
  effectiveUserTags = [],
  onClose,
  t
}) {
  const { confirm } = useConfirm();
  const {
    actionLoading,
    moveThread,
    togglePinThread,
    deleteThread,
    editReply,
    moveReplyToThread,
    extractReplyToNewThread
  } = useForumModeration(profileData?.groupId);

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(Boolean(threadId));
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [internalTagsDisponibles, setInternalTagsDisponibles] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [lienDepotForum, setLienDepotForum] = useState('');

  // Gestion de la modale d'ajout de sondage
  const [isAddPollOpen, setIsAddPollOpen] = useState(false);
  const [savingNewPoll, setSavingNewPoll] = useState(false);

  // Pastille et défilement
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [initialLastRead, setInitialLastRead] = useState(null);
  const initialSetRef = useRef(false);

  const unreadSeparatorRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasScrolledInitialRef = useRef(false);

  // Résolution des étiquettes disponibles et effectives
  const activeTagsDisponibles = useMemo(() => {
    return (tagsDisponibles && tagsDisponibles.length > 0) ? tagsDisponibles : internalTagsDisponibles;
  }, [tagsDisponibles, internalTagsDisponibles]);

  const activeEffectiveUserTags = useMemo(() => {
    if (effectiveUserTags && effectiveUserTags.length > 0) return effectiveUserTags;
    return resolveEffectiveUserTags(profileData?.tags || [], activeTagsDisponibles);
  }, [effectiveUserTags, profileData?.tags, activeTagsDisponibles]);

  // Résolution asynchrone du salon si thread.channelId existe
  const channelId = thread?.channelId;
  const matchedChannel = useMemo(() => {
    if (!channelId) return null;
    return channels.find((c) => c.id === channelId) || null;
  }, [channelId, channels]);

  const [fetchedChannel, setFetchedChannel] = useState(null);

  useEffect(() => {
    if (!channelId || matchedChannel) {
      return;
    }

    let isMounted = true;
    const fetchChannel = async () => {
      try {
        const snap = await getDoc(doc(db, 'forum_channels', channelId));
        if (snap.exists() && isMounted) {
          setFetchedChannel({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("useThreadData - Erreur récupération salon:", err);
      }
    };

    fetchChannel();
    return () => {
      isMounted = false;
    };
  }, [channelId, matchedChannel]);

  const threadChannel = matchedChannel || fetchedChannel;

  // Droits modérateur / admin
  const isModeratorOrAdmin = useMemo(() => {
    return Boolean(breakGlassActive || isUserModeratorOrAdmin(profileData));
  }, [breakGlassActive, profileData]);

  // Vérification de l'interdiction de lecture
  const isAccessForbidden = useMemo(() => {
    if (!threadChannel) return false;
    if (breakGlassActive) return false;
    return !canUserReadForumChannel(threadChannel, profileData, activeEffectiveUserTags);
  }, [threadChannel, breakGlassActive, profileData, activeEffectiveUserTags]);

  // Salon en lecture seule pour l'utilisateur
  const isReadOnly = useMemo(() => {
    if (!threadChannel) return false;
    if (breakGlassActive) return false;
    return !canUserWriteInForumChannel(threadChannel, profileData, activeEffectiveUserTags);
  }, [threadChannel, breakGlassActive, profileData, activeEffectiveUserTags]);

  // Récupération des étiquettes du groupe
  useEffect(() => {
    if (!profileData?.groupId || (tagsDisponibles && tagsDisponibles.length > 0)) return;

    const fetchTags = async () => {
      try {
        const groupRef = doc(db, 'groups', profileData.groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const gData = groupSnap.data();
          if (Array.isArray(gData.tags) && gData.tags.length > 0) {
            setInternalTagsDisponibles(gData.tags);
          }
        }
      } catch (err) {
        console.error("useThreadData - Erreur chargement tags:", err);
      }
    };

    fetchTags();
  }, [profileData?.groupId, tagsDisponibles]);

  // Calcul dynamique des cibles disponibles
  const availableTargets = useMemo(() => {
    const list = [];
    const pushIfNew = (item) => {
      if (item && !list.includes(item)) list.push(item);
    };

    const insts = profileData?.instrumentsParametrables || [
      'Agogô', 'Alfaia', 'Caixa', 'Gonguê', 'Mineiro', 'Timbal', 'Abê', 'Danse', 'Chant'
    ];
    insts.forEach((inst) => {
      const name = typeof inst === 'object' ? inst.nom || inst.id : inst;
      pushIfNew(name);
    });

    if (activeTagsDisponibles && activeTagsDisponibles.length > 0) {
      activeTagsDisponibles.forEach((tag) => {
        const tagLabel = typeof tag === 'string' ? tag : getTagId(tag);
        pushIfNew(tagLabel);
      });
    }

    return list;
  }, [profileData?.instrumentsParametrables, activeTagsDisponibles]);

  // Lien de dépôt configuré sur le groupe
  useEffect(() => {
    if (!profileData?.groupId) return;
    const fetchLienDepot = async () => {
      try {
        const groupSnap = await getDoc(doc(db, 'groups', profileData.groupId));
        if (groupSnap.exists()) {
          const gData = groupSnap.data();
          if (gData.lienDepotForum) {
            setLienDepotForum(gData.lienDepotForum);
          }
        }
      } catch (err) {
        console.error("useThreadData - Erreur lien dépôt forum:", err);
      }
    };
    fetchLienDepot();
  }, [profileData?.groupId]);

  // Mémorisation de la date de dernière lecture initiale lors du premier affichage
  useEffect(() => {
    if (threadId && user?.uid && !initialSetRef.current) {
      initialSetRef.current = true;
      setInitialLastRead(profileData?.readThreads?.[threadId] || null);
    }
  }, [threadId, user?.uid, profileData?.readThreads]);

  // Écoute en temps réel de la discussion
  useEffect(() => {
    if (!threadId) return;

    const unsubscribe = onSnapshot(doc(db, 'forum', threadId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setThread(data);
      } else {
        setThread(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("useThreadData - Erreur écoute sujet forum:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [threadId]);

  // Repère du premier message non-lu
  const firstUnreadIdx = useMemo(() => {
    if (!thread || !user?.uid) return -1;
    return getFirstUnreadIndex(thread, user.uid, initialLastRead);
  }, [thread, user, initialLastRead]);

  // Marquage automatique comme lu lorsque le sujet est ouvert
  useEffect(() => {
    if (thread && user?.uid) {
      const modStr = thread.derniereModification || thread.dateCreation;
      if (!modStr) return;

      const threadLastMod = new Date(modStr).getTime();
      const userLastReadStr = profileData?.readThreads?.[thread.id];
      const userLastRead = userLastReadStr ? new Date(userLastReadStr).getTime() : 0;

      if (threadLastMod > userLastRead) {
        const now = Date.now();
        const safeReadTime = new Date(Math.max(now, threadLastMod + 1000)).toISOString();

        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          [`readThreads.${thread.id}`]: safeReadTime
        }).catch((err) => console.error("useThreadData - Erreur mise à jour lecture:", err));
      }
    }
  }, [thread, user, profileData?.readThreads]);

  // Gestion du défilement initial vers le séparateur ou le bas
  useEffect(() => {
    if (!loading && thread && !hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      setTimeout(() => {
        if (unreadSeparatorRef.current) {
          unreadSeparatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [loading, thread]);

  // Gestion du défilement manuel pour afficher la pastille flottante
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Envoi d'une nouvelle réponse
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || sending) return;

    if (isReadOnly) {
      alert("Ce salon est en lecture seule pour votre rôle.");
      return;
    }

    setSending(true);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const now = new Date().toISOString();
      const detectedMentionIds = extractMentionedUserIds(replyText, allUsers);

      const newReply = {
        message: replyText.trim(),
        auteurId: user?.uid || 'anonyme',
        auteurNom: `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.email || 'Membre',
        dateCreation: now,
        targetTag: selectedTarget || null,
        reactions: {},
        mentionedUserIds: detectedMentionIds
      };

      await updateDoc(threadRef, {
        reponses: arrayUnion(newReply),
        derniereModification: now,
        nombreReponses: (thread?.nombreReponses || 0) + 1
      });

      // Notification pour les utilisateurs ciblés ou mentionnés
      try {
        const notifRecipientIds = new Set();

        if (detectedMentionIds.length > 0) {
          detectedMentionIds.forEach((uid) => {
            if (uid !== user?.uid) notifRecipientIds.add(uid);
          });
        }

        if (selectedTarget) {
          allUsers.forEach((u) => {
            if (u.id === user?.uid) return;
            const playsInst = (u.instrumentsJoues && u.instrumentsJoues.includes(selectedTarget)) || (u.instrument === selectedTarget);
            const hasTag = checkUserAccessToList([selectedTarget], u, u.tags || []);
            if (playsInst || hasTag) {
              notifRecipientIds.add(u.id);
            }
          });
        }

        const senderName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 'Un membre';
        const cleanMsg = replyText.replace(/<[^>]*>?/gm, '').trim();
        const snippet = cleanMsg.length > 80 ? `${cleanMsg.slice(0, 80)}...` : cleanMsg;

        const notifPromises = Array.from(notifRecipientIds).map((recipientId) => {
          const isMentioned = detectedMentionIds.includes(recipientId);
          const notifTitle = isMentioned
            ? `🗣️ ${senderName} vous a mentionné(e)`
            : `🎯 Nouveau message pour ${selectedTarget}`;

          return addDoc(collection(db, 'notifications'), {
            userId: recipientId,
            title: notifTitle,
            body: `"${snippet}" dans "${thread?.titre || 'le forum'}"`,
            type: 'forum_target',
            link: `/forum?threadId=${threadId}`,
            threadId,
            read: false,
            createdAt: now
          });
        });

        if (notifPromises.length > 0) {
          await Promise.allSettled(notifPromises);
        }
      } catch (notifErr) {
        console.error("useThreadData - Erreur envoi notifications ciblées :", notifErr);
      }

      setReplyText('');
      setSelectedTarget('');
      scrollToBottom();
    } catch (err) {
      console.error("useThreadData - Erreur envoi réponse forum :", err);
      alert((t && t('forum.errorSending')) || "Erreur lors de l'envoi de la réponse");
    } finally {
      setSending(false);
    }
  };

  // Suppression d'une réponse
  const handleDeleteReply = async (replyIndex) => {
    const isOk = await confirm({
      title: (t && t('common.delete')) || "Supprimer",
      message: (t && t('forum.deleteReplyConfirm')) || "Êtes-vous sûr de vouloir supprimer cette réponse ?",
      confirmVariant: "danger"
    });
    if (!isOk) return;

    try {
      const threadRef = doc(db, 'forum', threadId);
      const replies = [...(thread?.reponses || [])];
      replies.splice(replyIndex, 1);

      await updateDoc(threadRef, {
        reponses: replies,
        nombreReponses: replies.length
      });
    } catch (err) {
      console.error("useThreadData - Erreur suppression réponse forum :", err);
      alert((t && t('forum.errorDeletingReply')) || "Erreur lors de la suppression de la réponse");
    }
  };

  // Bascule de réaction emoji (sujet principal ou réponse)
  const currentUserId = user?.uid;
  const handleToggleReaction = useCallback(async (replyIndex, emoji) => {
    if (!threadId || !currentUserId) return;
    const threadRef = doc(db, 'forum', threadId);
    try {
      await runTransaction(db, async (transaction) => {
        const threadDoc = await transaction.get(threadRef);
        if (!threadDoc.exists()) return;

        const threadData = threadDoc.data();

        if (replyIndex === -1) {
          const reactions = threadData.reactions || {};
          const userList = reactions[emoji] || [];
          const newUserList = userList.includes(currentUserId)
            ? userList.filter((id) => id !== currentUserId)
            : [...userList, currentUserId];

          const newReactions = { ...reactions, [emoji]: newUserList };
          if (newUserList.length === 0) {
            delete newReactions[emoji];
          }

          transaction.update(threadRef, { reactions: newReactions });
        } else {
          const replies = [...(threadData.reponses || [])];
          if (replyIndex >= 0 && replyIndex < replies.length) {
            const reply = replies[replyIndex];
            const reactions = reply.reactions || {};
            const userList = reactions[emoji] || [];
            const newUserList = userList.includes(currentUserId)
              ? userList.filter((id) => id !== currentUserId)
              : [...userList, currentUserId];

            const newReactions = { ...reactions, [emoji]: newUserList };
            if (newUserList.length === 0) {
              delete newReactions[emoji];
            }

            replies[replyIndex] = { ...reply, reactions: newReactions };
            transaction.update(threadRef, { reponses: replies });
          }
        }
      });
    } catch (err) {
      console.error("useThreadData - Erreur réaction :", err);
    }
  }, [threadId, currentUserId]);

  // Suppression du sujet complet
  const handleDeleteThread = async () => {
    const isOk = await confirm({
      title: (t && t('common.delete')) || "Supprimer",
      message: (t && t('forum.deleteThreadConfirm')) || "Êtes-vous sûr de vouloir supprimer définitivement ce sujet ?",
      confirmVariant: "danger"
    });
    if (!isOk) return;

    const ok = await deleteThread(threadId);
    if (ok && onClose) {
      onClose();
    }
  };

  // Citation d'un message dans la réponse
  const handleReplyToMessage = useCallback((reply) => {
    if (!reply) return;
    const authorName = reply.auteurNom || 'Membre';
    const cleanText = (reply.message || '').replace(/<[^>]*>?/gm, '').trim();
    const snippet = cleanText.length > 80 ? `${cleanText.slice(0, 80)}...` : cleanText;
    const quoteHtml = `<blockquote><strong>@${authorName}</strong> a écrit :<br /><em>"${snippet}"</em></blockquote><p></p>`;
    setReplyText((prev) => (prev ? `${prev}<br />${quoteHtml}` : quoteHtml));
  }, []);

  // Ajout d'un sondage sur le sujet existant
  const currentThreadId = thread?.id;
  const handleCreatePoll = useCallback(async ({ question, options, allowMultiple }) => {
    if (!currentThreadId || !question?.trim()) return false;
    const validOpts = (options || []).filter((o) => o.trim() !== '');
    if (validOpts.length < 2) {
      alert("Veuillez saisir au moins 2 choix de réponse.");
      return false;
    }

    setSavingNewPoll(true);
    try {
      const pollPayload = {
        question: question.trim(),
        allowMultiple: Boolean(allowMultiple),
        isClosed: false,
        options: validOpts.map((label, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          label: label.trim(),
          votes: []
        }))
      };

      const threadRef = doc(db, 'forum', currentThreadId);
      await updateDoc(threadRef, {
        poll: pollPayload
      });

      setIsAddPollOpen(false);
      alert("Sondage ajouté avec succès !");
      return true;
    } catch (err) {
      console.error("useThreadData - Erreur ajout sondage:", err);
      alert("Erreur lors de la création du sondage.");
      return false;
    } finally {
      setSavingNewPoll(false);
    }
  }, [currentThreadId]);

  const getCategoryLabel = useCallback((cat) => {
    return (t && t(`forum.${cat}`)) || cat || '';
  }, [t]);

  return {
    thread,
    loading,
    replyText,
    setReplyText,
    sending,
    availableTargets,
    selectedTarget,
    setSelectedTarget,
    lienDepotForum,
    threadChannel,
    isModeratorOrAdmin,
    isAccessForbidden,
    isReadOnly,
    firstUnreadIdx,
    showScrollBottom,
    isAddPollOpen,
    setIsAddPollOpen,
    savingNewPoll,
    actionLoading,

    // Refs
    unreadSeparatorRef,
    messagesContainerRef,
    messagesEndRef,

    // Handlers
    scrollToBottom,
    handleScroll,
    handleSend,
    handleDeleteReply,
    handleToggleReaction,
    handleDeleteThread,
    handleReplyToMessage,
    handleCreatePoll,
    getCategoryLabel,

    // Modération déléguée
    moveThread,
    togglePinThread,
    editReply,
    moveReplyToThread,
    extractReplyToNewThread
  };
}
