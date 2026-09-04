import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, addDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { getFirstUnreadIndex } from '../utils/forumUnreadUtils';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import RichTextEditor from './RichTextEditor';
import FormattedMessageContent from './FormattedMessageContent';
import MoveThreadModal from './MoveThreadModal';
import MoveReplyModal from './MoveReplyModal';
import PollDisplay from './forum/PollDisplay';
import { useForumModeration } from '../hooks/useForumModeration';
import { getTagId, resolveEffectiveUserTags } from '../utils/tagUtils';
import { isUserModeratorOrAdmin, canUserWriteInForumChannel } from '../utils/permissionUtils';
import { usePresenceContext } from '../context/PresenceContext';
import useConfirm from '../hooks/useConfirm';

const ReactionBar = ({ reactions = {}, currentUserId, onToggle, allUsers = [] }) => {
  const emojis = ['👍', '👎', '❤️', '👏'];
  const getUserName = (uid) => {
    const user = allUsers.find(u => u.id === uid);
    return user ? `${user.prenom} ${user.nom}` : 'Inconnu';
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {emojis.map(emoji => {
        const usersWhoReacted = reactions[emoji] || [];
        const count = usersWhoReacted.length;
        const hasReacted = usersWhoReacted.includes(currentUserId);
        
        if (count === 0) {
           return (
             <button
                key={emoji}
                type="button"
                onClick={() => onToggle(emoji)}
                className="opacity-60 hover:opacity-100 text-[14px] transition-opacity cursor-pointer p-0.5 grayscale hover:grayscale-0"
                title="Réagir"
             >
               {emoji}
             </button>
           );
        }

        const tooltipText = usersWhoReacted.map(getUserName).join(', ');

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[12px] text-[13px] font-black border transition-all cursor-pointer shadow-xs active:translate-y-[0.5px] ${
              hasReacted 
                ? 'bg-[#c05621]/15 border-[#c05621]/40 text-[#c05621]' 
                : 'bg-white/90 border-encre-noire/30 text-encre-noire/80 hover:bg-stone-100'
            }`}
            title={tooltipText}
          >
            <span className="text-[14px]">{emoji}</span>
            <span className="text-[11px] leading-none">{count}</span>
          </button>
        );
      })}
    </div>
  );
};


// Composant ThreadReplyItem mémoïsé pour éviter les rendus inutiles lors de la saisie
const ThreadReplyItem = React.memo(({
  reply,
  index,
  userId,
  profileData,
  isModeratorOrAdmin,
  onDeleteReply,
  onMoveReply,
  onEditReply,
  onReplyToMessage,
  onToggleReaction,
  allUsers,
  t,
  formattedTime
}) => {
  const { onlineUserIds, isPresenceEnabled } = usePresenceContext();
  const isCurrentUser = reply.auteurId === userId;
  const isAuthorOnline = isPresenceEnabled !== false && reply.auteurId && onlineUserIds.has(reply.auteurId);

  // Vérification si le message cible des étiquettes ou des instruments du membre
  const userPlaysInstrument = (profileData?.instrumentsJoues && profileData.instrumentsJoues.includes(reply.targetTag)) ||
                               (profileData?.instrument === reply.targetTag);
  const userHasTag = profileData?.tags && profileData.tags.includes(reply.targetTag);
  const isTargeted = reply.targetTag && (userPlaysInstrument || userHasTag);

  return (
    <div 
      className={`
        flex flex-col w-full max-w-[85%]
        ${isCurrentUser ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}
      `}
    >
      <div 
        className={`
          border-2 p-3 shadow-[2px_2px_0px_0px_#181716] transition-all relative group
          ${isTargeted 
            ? 'theme-bg-jaune border-cordel-wood rounded-[6px_10px_6px_10px] scale-[1.02] shadow-[2.5px_2.5px_0px_0px_#8b2a1a]' 
            : isCurrentUser 
              ? 'theme-bg-vert border-encre-noire rounded-[10px_2px_8px_10px]' 
              : 'bg-[var(--cordel-hover-bg)] border-encre-noire text-encre-noire rounded-[2px_10px_10px_8px]'}
        `}
      >
        {isTargeted && (
          <span className="text-[8px] font-black text-cordel-wood block mb-1 uppercase tracking-wider animate-pulse select-none">
            🗣️ Ce message vous concerne ({reply.targetTag})
          </span>
        )}

        <div className="flex justify-between items-start gap-4 mb-1">
          {!isCurrentUser ? (
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-cordel-wood select-none flex items-center gap-1.5">
              <span>{reply.auteurNom}</span>
              {isAuthorOnline && (
                <span className="relative flex h-2 w-2" title="Membre en ligne">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
              )}
            </span>
          ) : <span />}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReplyToMessage(reply)}
              className="text-[10px] font-black cursor-pointer leading-none select-none opacity-70 hover:opacity-100 p-0.5"
              title="Répondre à ce message"
            >
              💬
            </button>
            {isCurrentUser && (
              <button
                type="button"
                onClick={() => onEditReply(index, reply)}
                className="text-[10px] font-black cursor-pointer leading-none select-none opacity-70 hover:opacity-100 p-0.5"
                title="Éditer le message"
              >
                ✏️
              </button>
            )}
            {isModeratorOrAdmin && (
              <button
                type="button"
                onClick={() => onMoveReply(index, reply)}
                className="text-[10px] font-black cursor-pointer leading-none select-none opacity-70 hover:opacity-100 p-0.5"
                title="Déplacer ce message vers un autre sujet"
              >
                ➡️
              </button>
            )}
            {(isCurrentUser || isModeratorOrAdmin) && (
              <button
                type="button"
                onClick={() => onDeleteReply(index)}
                className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer leading-none select-none p-0.5 ml-0.5"
                title={t('common.delete') || "Supprimer"}
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <FormattedMessageContent content={reply.message} />
        
        <ReactionBar 
          reactions={reply.reactions} 
          currentUserId={userId} 
          onToggle={(emoji) => onToggleReaction(index, emoji)}
          allUsers={allUsers}
        />

        <div className="flex items-center justify-between gap-2 mt-2 select-none">
          {reply.isEdited && (
            <span className="text-[7px] italic font-semibold opacity-50">
              (modifié)
            </span>
          )}
          <span className="text-[7px] font-black opacity-60 block ml-auto">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.index === nextProps.index &&
         prevProps.reply.message === nextProps.reply.message &&
         JSON.stringify(prevProps.reply.reactions) === JSON.stringify(nextProps.reply.reactions) &&
         prevProps.reply.dateCreation === nextProps.reply.dateCreation &&
         prevProps.reply.targetTag === nextProps.reply.targetTag &&
         prevProps.reply.isEdited === nextProps.reply.isEdited &&
         prevProps.userId === nextProps.userId &&
         prevProps.profileData === nextProps.profileData &&
         prevProps.isModeratorOrAdmin === nextProps.isModeratorOrAdmin &&
         prevProps.formattedTime === nextProps.formattedTime &&
         prevProps.onDeleteReply === nextProps.onDeleteReply &&
         prevProps.onMoveReply === nextProps.onMoveReply &&
         prevProps.onEditReply === nextProps.onEditReply &&
         prevProps.onReplyToMessage === nextProps.onReplyToMessage &&
         prevProps.onToggleReaction === nextProps.onToggleReaction;
});

export default function ThreadView({ 
  threadId, 
  user, 
  profileData, 
  channels = [], 
  allThreads = [], 
  allUsers = [], 
  onClose, 
  breakGlassActive = false,
  tagsDisponibles = [],
  effectiveUserTags = []
}) {
  const { t } = useTranslation();
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

  const getCategoryLabel = (cat) => {
    return t(`forum.${cat}`) || cat;
  };

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [internalTagsDisponibles, setInternalTagsDisponibles] = useState([]);
  const [availableTargets, setAvailableTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [lienDepotForum, setLienDepotForum] = useState('');
  const [consignesDepotForum, setConsignesDepotForum] = useState('');

  // Résolution des étiquettes disponibles et des étiquettes effectives du membre
  const activeTagsDisponibles = (tagsDisponibles && tagsDisponibles.length > 0) ? tagsDisponibles : internalTagsDisponibles;

  const activeEffectiveUserTags = useMemo(() => {
    if (effectiveUserTags && effectiveUserTags.length > 0) return effectiveUserTags;
    return resolveEffectiveUserTags(profileData?.tags || [], activeTagsDisponibles);
  }, [effectiveUserTags, profileData?.tags, activeTagsDisponibles]);

  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [isTargetingExpanded, setIsTargetingExpanded] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const unreadSeparatorRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const hasScrolledInitialRef = useRef(false);
  const initialLastReadRef = useRef(null);

  // Modals state
  const [isMoveThreadOpen, setIsMoveThreadOpen] = useState(false);
  const [movingReplyData, setMovingReplyData] = useState(null); // { reply, index }
  const [editingReplyData, setEditingReplyData] = useState(null); // { reply, index, text }

  // Ajouter poll modal state
  const [isAddPollOpen, setIsAddPollOpen] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [newPollAllowMultiple, setNewPollAllowMultiple] = useState(false);
  const [savingNewPoll, setSavingNewPoll] = useState(false);

  const handleAddPollOptionToExisting = () => {
    if (newPollOptions.length < 10) {
      setNewPollOptions(prev => [...prev, '']);
    }
  };

  const handleRemovePollOptionFromExisting = (idx) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChangeExisting = (idx, val) => {
    setNewPollOptions(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleCreatePollOnExistingThread = async (e) => {
    if (e) e.preventDefault();
    if (!thread?.id || !newPollQuestion.trim()) return;

    const validOpts = newPollOptions.filter(o => o.trim() !== '');
    if (validOpts.length < 2) {
      alert("Veuillez saisir au moins 2 choix de réponse.");
      return;
    }

    setSavingNewPoll(true);
    try {
      const pollPayload = {
        question: newPollQuestion.trim(),
        allowMultiple: newPollAllowMultiple,
        isClosed: false,
        options: validOpts.map((label, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          label: label.trim(),
          votes: []
        }))
      };

      const threadRef = doc(db, 'forum', thread.id);
      await updateDoc(threadRef, {
        poll: pollPayload
      });

      setIsAddPollOpen(false);
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setNewPollAllowMultiple(false);
      alert("Sondage ajouté avec succès !");
    } catch (err) {
      console.error("ThreadView - Erreur ajout sondage:", err);
      alert("Erreur lors de la création du sondage.");
    } finally {
      setSavingNewPoll(false);
    }
  };

  const threadChannel = channels.find(c => c.id === thread?.channelId);
  const isModeratorOrAdmin = isUserModeratorOrAdmin(profileData);

  // Vérifie si le membre possède les droits de réponse/publication dans ce salon
  const isReadOnly = useMemo(() => {
    if (!thread) return true;
    return !canUserWriteInForumChannel(
      threadChannel,
      profileData,
      activeTagsDisponibles,
      activeEffectiveUserTags,
      breakGlassActive
    );
  }, [thread, threadChannel, profileData, activeTagsDisponibles, activeEffectiveUserTags, breakGlassActive]);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Écoute en temps réel du document de cette discussion spécifique
  useEffect(() => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const threadRef = doc(db, 'forum', threadId);
    const unsubscribe = onSnapshot(threadRef, (docSnap) => {
      if (docSnap.exists()) {
        setThread({
          id: docSnap.id,
          ...docSnap.data()
        });
      } else {
        setThread(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erreur onSnapshot ThreadView:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [threadId]);

  // Mémoriser l'horodatage de lecture initial au premier montage pour figer la ligne de non-lus
  useEffect(() => {
    if (initialLastReadRef.current === null && threadId) {
      initialLastReadRef.current = profileData?.readThreads?.[threadId] || null;
    }
  }, [threadId, profileData?.readThreads]);

  // Détection du premier message non lu basé sur l'horodatage initial
  const firstUnreadIdx = useMemo(() => {
    if (!thread || !user?.uid) return -1;
    return getFirstUnreadIndex(thread, user.uid, initialLastReadRef.current);
  }, [thread, user?.uid]);

  // Marquer le sujet comme lu en base Firestore (pour acquitter les compteurs en cascade)
  useEffect(() => {
    if (thread && user?.uid) {
      const modStr = thread.derniereModification || thread.dateCreation;
      if (!modStr) return;

      const threadLastMod = new Date(modStr).getTime();
      const userLastReadStr = profileData?.readThreads?.[thread.id];
      const userLastRead = userLastReadStr ? new Date(userLastReadStr).getTime() : 0;
      
      if (threadLastMod > userLastRead) {
        // Anti-horloge-locale-désynchronisée : on prend le max entre l'heure locale et l'heure du message + 1s
        const now = Date.now();
        const safeReadTime = new Date(Math.max(now, threadLastMod + 1000)).toISOString();

        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          [`readThreads.${thread.id}`]: safeReadTime
        }).catch(err => console.error("Erreur mise à jour lecture:", err));
      }
    }
  }, [thread?.id, thread?.derniereModification, thread?.dateCreation, user?.uid, profileData?.readThreads]);

  // Scroll automatique intelligent à l'ouverture du sujet
  useEffect(() => {
    if (thread?.reponses && thread.reponses.length > 0 && !hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      // Laisser le temps au rendu de placer les messages et le séparateur
      setTimeout(() => {
        if (firstUnreadIdx !== -1 && unreadSeparatorRef.current) {
          unreadSeparatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollToBottom();
        }
      }, 120);
    }
  }, [thread?.reponses, firstUnreadIdx]);

  // Détection de la position de défilement pour la pastille de défilement rapide (↓)
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 80;
    setShowScrollBottom(isFarFromBottom);
  };

  // Chargement en temps réel des étiquettes et instruments disponibles
  useEffect(() => {
    if (!profileData?.groupId) return;
    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const tags = data.tagsDisponibles || [];
        setInternalTagsDisponibles(tags);
        const tagLabels = tags.map(t => getTagId(t)).filter(Boolean);
        const instruments = data.instrumentsDisponibles || [];
        const combined = [...new Set([...tagLabels, ...instruments])].filter(Boolean).sort();
        setAvailableTargets(combined);
        setLienDepotForum(data.lienDepotForum || '');
      }
    }, (error) => {
      console.error("ThreadView - Erreur chargement cibles :", error);
    });
    return () => unsubscribe();
  }, [profileData?.groupId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const cleanText = replyText.trim();
    if (!cleanText || !threadId) return;

    setSending(true);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const nowIso = new Date().toISOString();
      const authorName = `${profileData.prenom} ${profileData.nom}`;

      await updateDoc(threadRef, {
        reponses: arrayUnion({
          auteurId: user.uid,
          auteurNom: authorName,
          message: cleanText,
          dateCreation: nowIso,
          targetTag: selectedTarget || null
        }),
        derniereModification: nowIso
      });

      // Détecter les mentions @Badge
      const mentions = availableTargets.filter(tag => {
        const regex = new RegExp(`@${tag}\\b`, 'gi');
        return regex.test(cleanText);
      });

      if (mentions.length > 0) {
        for (const tag of mentions) {
          try {
            await addDoc(collection(db, 'notifications_queue'), {
              groupId: profileData.groupId,
              title: `Mention dans le forum (#${threadChannel?.name || 'Discussion'})`,
              body: `${authorName} vous a mentionné : "${cleanText.slice(0, 100)}${cleanText.length > 100 ? '...' : ''}"`,
              targetTag: tag,
              senderId: user.uid,
              threadId: threadId,
              channelId: thread?.channelId || null,
              createdAt: nowIso
            });
          } catch (err) {
            console.error("Error writing notification queue doc:", err);
          }
        }
      }

      setReplyText('');
      setSelectedTarget('');
    } catch (error) {
      console.error("ThreadView - Erreur updateDoc/arrayUnion :", error);
      alert(t('common.saveError'));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteThread = async () => {
    const ok = await confirm({
      title: "Supprimer la discussion",
      message: "Voulez-vous vraiment supprimer cette discussion ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!ok) return;
    try {
      await deleteThread(threadId);
      onClose();
    } catch (err) {
      console.error("Error deleting thread:", err);
      alert("Erreur lors de la suppression de la discussion.");
    }
  };

  const handleDeleteReply = useCallback(async (indexToDelete) => {
    const ok = await confirm({
      title: "Supprimer le message",
      message: "Voulez-vous vraiment supprimer ce message ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!ok) return;
    try {
      if (!thread) return;
      const updatedReponses = thread.reponses.filter((_, idx) => idx !== indexToDelete);
      const threadRef = doc(db, 'forum', threadId);
      await updateDoc(threadRef, {
        reponses: updatedReponses
      });
    } catch (err) {
      console.error("Error deleting reply:", err);
      alert("Erreur lors de la suppression du message.");
    }
  }, [thread, threadId, confirm]);

  const handleOpenEditReply = useCallback((index, reply) => {
    setEditingReplyData({ index, text: reply.message });
  }, []);

  const handleReplyToMessage = useCallback((reply) => {
    const textQuote = `<blockquote><strong>@${reply.auteurNom}</strong> a écrit :<br/>${reply.message}</blockquote><p></p>`;
    setReplyText(prev => {
      if (!prev || prev === '<p></p>') return textQuote;
      return prev + textQuote;
    });
    // Scroll au bottom pour voir l'éditeur
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleToggleReaction = useCallback(async (replyIndex, emoji) => {
    if (!threadId || !user?.uid) return;
    const threadRef = doc(db, 'forum', threadId);
    try {
      await runTransaction(db, async (transaction) => {
        const threadDoc = await transaction.get(threadRef);
        if (!threadDoc.exists()) return;
        
        const threadData = threadDoc.data();
        
        if (replyIndex === -1) {
          // Réaction sur le sujet principal
          const reactions = threadData.reactions || {};
          const userList = reactions[emoji] || [];
          let newUserList = userList.includes(user.uid) 
            ? userList.filter(id => id !== user.uid)
            : [...userList, user.uid];
          
          let newReactions = { ...reactions, [emoji]: newUserList };
          if (newUserList.length === 0) {
            delete newReactions[emoji];
          }
          
          transaction.update(threadRef, { reactions: newReactions });
        } else {
          // Réaction sur une réponse
          const replies = [...(threadData.reponses || [])];
          if (replyIndex >= 0 && replyIndex < replies.length) {
            const reply = replies[replyIndex];
            const reactions = reply.reactions || {};
            const userList = reactions[emoji] || [];
            let newUserList = userList.includes(user.uid) 
              ? userList.filter(id => id !== user.uid)
              : [...userList, user.uid];
            
            let newReactions = { ...reactions, [emoji]: newUserList };
            if (newUserList.length === 0) {
              delete newReactions[emoji];
            }
            
            replies[replyIndex] = { ...reply, reactions: newReactions };
            transaction.update(threadRef, { reponses: replies });
          }
        }
      });
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  }, [threadId, user?.uid]);

  const handleSaveEditReply = async (e) => {
    e.preventDefault();
    if (!editingReplyData || !editingReplyData.text.trim()) return;
    const ok = await editReply(threadId, editingReplyData.index, editingReplyData.text.trim());
    if (ok) {
      setEditingReplyData(null);
    }
  };

  const handleOpenMoveReply = useCallback((index, reply) => {
    setMovingReplyData({ index, reply });
  }, []);

  const categoryBadges = {
    Général: 'ocre',
    Costumes: 'vert',
    Covoiturage: 'bleu',
    Autre: 'kraft'
  };

  const badgeVariant = thread ? categoryBadges[thread.categorie] || 'default' : 'default';

  return (
    <div className="flex flex-col gap-4 text-left h-full">
      {/* Header bar */}
      <div className="sticky top-0 z-[100] bg-cordel-bg/95 backdrop-blur-sm flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 py-2 select-none">
        <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          {t('forum.discussionHeader')}
        </span>
        <div className="w-12"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 select-none">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ {t('common.loading')}</span>
        </div>
      ) : !thread ? (
        <CordelCard variant="default" className="p-8 text-center select-none">
          <p className="text-xs opacity-75 font-semibold">{t('forum.notFound')}</p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {/* Thread Header details */}
          <CordelCard variant={badgeVariant} useExtremeBorder={true} className="py-4 relative select-none">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {thread.isPinned && (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] flex items-center gap-1">
                  📌 Épinglé
                </span>
              )}
              <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                {getCategoryLabel(thread.categorie)}
              </span>
            </div>

            <h3 className="font-extrabold text-base text-encre-noire leading-tight mt-0.5 mb-2 pr-32">
              {thread.titre}
            </h3>
            <p className="text-[10px] font-bold tracking-wide opacity-75">
              {(t('forum.launchedBy') || "Lancé par {author}").replace('{author}', thread.auteurNom)}
            </p>

            {/* Moderator Toolbar Overlay */}
            {(isModeratorOrAdmin || thread?.auteurId === user?.uid) && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {isModeratorOrAdmin && (
                  <button
                    type="button"
                    onClick={() => togglePinThread(thread.id, thread.isPinned)}
                    disabled={actionLoading}
                    className={`text-[9px] font-black cursor-pointer border rounded px-1.5 py-0.5 shadow-xs ${
                      thread.isPinned
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-encre-noire border-cordel-master-dark/30 hover:bg-amber-50'
                    }`}
                    title={thread.isPinned ? "Désépingler" : "Épingler le sujet"}
                  >
                    📌 {thread.isPinned ? 'Désépingler' : 'Épingler'}
                  </button>
                )}

                {isModeratorOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsMoveThreadOpen(true)}
                    disabled={actionLoading}
                    className="bg-white hover:bg-cordel-bg text-encre-noire border border-cordel-master-dark/30 text-[9px] font-black cursor-pointer rounded px-1.5 py-0.5 shadow-xs"
                    title="Déplacer vers un autre salon"
                  >
                    🚚 Déplacer
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDeleteThread}
                  disabled={actionLoading}
                  className="text-[#8b2a1a] hover:text-white text-[9px] font-black cursor-pointer border border-[#8b2a1a]/30 bg-[#8b2a1a]/10 hover:bg-[#8b2a1a] rounded px-1.5 py-0.5 shadow-xs transition-colors"
                  title={t('common.delete') || "Supprimer"}
                >
                  🗑️
                </button>
              </div>
            )}
          </CordelCard>

          {/* Interactive Poll Component if attached */}
          {thread.poll && (
            <PollDisplay 
              poll={thread.poll} 
              threadId={thread.id} 
              userId={user.uid} 
              allUsers={allUsers}
              isAuthorOrAdmin={user.uid === thread.auteurId || isModeratorOrAdmin}
            />
          )}

          {/* Modal de création de sondage sur sujet existant */}
          {isAddPollOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md bg-cordel-bg p-5 relative select-none">
                <h3 className="font-extrabold text-sm text-encre-noire uppercase tracking-wider mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2">
                  📊 Créer un Sondage pour ce sujet
                </h3>

                <form onSubmit={handleCreatePollOnExistingThread} className="flex flex-col gap-3 text-left">
                  {/* Question */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Question du sondage *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      placeholder="Ex : Quelle date préférez-vous pour le stage ?"
                      disabled={savingNewPoll}
                      className="theme-input w-full text-xs font-bold"
                      autoFocus
                    />
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Choix de réponses (Minimum 2)
                    </label>
                    {newPollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required={idx < 2}
                          value={opt}
                          onChange={(e) => handlePollOptionChangeExisting(idx, e.target.value)}
                          placeholder={`Choix ${idx + 1}...`}
                          disabled={savingNewPoll}
                          className="theme-input text-xs flex-1 font-semibold py-1.5"
                        />
                        {newPollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOptionFromExisting(idx)}
                            disabled={savingNewPoll}
                            className="text-[#8b2a1a] hover:text-white text-xs font-black px-2 py-1 rounded bg-[#8b2a1a]/10 hover:bg-[#8b2a1a] border border-[#8b2a1a]/30 cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    {newPollOptions.length < 10 && (
                      <button
                        type="button"
                        onClick={handleAddPollOptionToExisting}
                        disabled={savingNewPoll}
                        className="text-[9px] font-black uppercase text-cordel-wood hover:underline mt-0.5 self-start cursor-pointer"
                      >
                        ➕ Ajouter un choix
                      </button>
                    )}
                  </div>

                  {/* Autoriser Multiple Choices */}
                  <label className="flex items-center gap-2 cursor-pointer select-none border-t border-dashed border-cordel-master-dark/15 pt-2">
                    <input
                      type="checkbox"
                      checked={newPollAllowMultiple}
                      onChange={(e) => setNewPollAllowMultiple(e.target.checked)}
                      disabled={savingNewPoll}
                      className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-encre-noire">
                      Autoriser les choix multiples
                    </span>
                  </label>

                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
                    <CordelButton
                      type="button"
                      variant="default"
                      onClick={() => setIsAddPollOpen(false)}
                      disabled={savingNewPoll}
                      className="px-3 py-1.5 text-xs font-bold"
                    >
                      Annuler
                    </CordelButton>
                    <CordelButton
                      type="submit"
                      variant="ocre"
                      disabled={savingNewPoll}
                      className="px-4 py-1.5 text-xs font-black uppercase"
                    >
                      {savingNewPoll ? "Création..." : "Ajouter le sondage"}
                    </CordelButton>
                  </div>
                </form>
              </CordelCard>
            </div>
          )}

          {/* Messages Container (Scrollable) avec Séparateur de non-lus et Bouton flottant */}
          <div className="relative flex flex-col flex-1 min-h-0">
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex flex-col gap-3 overflow-y-auto max-h-[460px] min-h-[220px] p-3 bg-cordel-bg-light border-2 border-dashed border-cordel-master-dark/20 rounded-md select-text"
            >
              {(thread.reponses || []).map((reply, index) => {
                const isFirstUnread = index === firstUnreadIdx;
                const dateMsg = new Date(reply.dateCreation);
                const formattedTime = isNaN(dateMsg.getTime())
                  ? ''
                  : (t('forum.atTime') || "{time} le {date}")
                      .replace('{time}', dateMsg.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
                      .replace('{date}', dateMsg.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));

                return (
                  <React.Fragment key={`${reply.dateCreation}-${index}`}>
                    {/* Ligne de repère de nouveaux messages */}
                    {isFirstUnread && (
                      <div 
                        ref={unreadSeparatorRef}
                        className="flex items-center my-3 gap-2 select-none w-full"
                      >
                        <div className="flex-1 h-[1.5px] bg-[#8b2a1a]/40"></div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#8b2a1a] bg-cordel-bg px-2.5 py-0.5 rounded border border-[#8b2a1a]/40 shadow-xs">
                          ── Nouveaux messages ──
                        </span>
                        <div className="flex-1 h-[1.5px] bg-[#8b2a1a]/40"></div>
                      </div>
                    )}

                    <ThreadReplyItem
                      reply={reply}
                      index={index}
                      userId={user.uid}
                      profileData={profileData}
                      isModeratorOrAdmin={isModeratorOrAdmin}
                      onDeleteReply={handleDeleteReply}
                      onMoveReply={handleOpenMoveReply}
                      onEditReply={handleOpenEditReply}
                      onReplyToMessage={handleReplyToMessage}
                      onToggleReaction={handleToggleReaction}
                      allUsers={allUsers}
                      t={t}
                      formattedTime={formattedTime}
                    />
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Pastille flottante de défilement rapide vers le bas (↓) */}
            {showScrollBottom && (
              <div className="sticky bottom-4 flex justify-end pointer-events-none pr-2">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="pointer-events-auto w-8 h-8 rounded-full bg-cordel-bg/95 hover:bg-white text-encre-noire border-2 border-encre-noire flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-all text-xs select-none backdrop-blur-xs"
                  title="Sauter au dernier message"
                >
                  ↓
                </button>
              </div>
            )}
          </div>

          {/* Quick Reply Form docké et dépliable (Bas d'écran façon Discord) */}
          {isReadOnly ? (
            <div className="p-3 text-center border-2 border-dashed border-cordel-wood/30 bg-cordel-bg rounded-md select-none mt-2">
              <span className="text-xs font-black text-cordel-wood">
                🔇 Ce salon est en lecture seule pour votre rôle.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSend} className="sticky bottom-0 bg-cordel-bg z-10 pt-2 pb-1 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2 select-none">
              {!isReplyExpanded ? (
                /* Barre compacte fixée */
                <div className="flex items-center gap-2 p-1.5 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_8px_6px_8px] shadow-[1.5px_1.5px_0px_0px_#181716]">
                  <button
                    type="button"
                    onClick={() => setIsReplyExpanded(true)}
                    className="w-7 h-7 flex items-center justify-center font-black text-xs text-cordel-wood hover:text-encre-noire bg-cordel-bg hover:bg-white rounded border border-cordel-master-dark/30 cursor-pointer shrink-0 transition-all"
                    title="Options de réponse (Groupe cible, mentions, mise en forme)"
                  >
                    ➕
                  </button>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsReplyExpanded(true)}
                    placeholder={t('forum.writeReplyPlaceholder') || "Écrire une réponse... (cliquez pour déplier)"}
                    disabled={sending}
                    className="flex-1 bg-transparent text-xs font-semibold text-encre-noire placeholder:opacity-50 outline-none px-1"
                  />
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    disabled={sending || !replyText.trim()}
                    className="text-xs px-3 py-1 uppercase font-bold tracking-wider shrink-0"
                  >
                    {sending ? "..." : "➤"}
                  </CordelButton>
                </div>
              ) : (
                /* Vue dépliée à la demande */
                <div className="flex flex-col gap-2 bg-cordel-bg-light p-3 border-2 border-encre-noire rounded-[6px_8px_6px_8px] shadow-[2px_2px_0px_0px_#181716]">
                  <div className="flex justify-between items-center pb-1 border-b border-dashed border-cordel-master-dark/20">
                    <span className="text-[9px] font-black uppercase tracking-wider text-cordel-wood">
                      ✍️ {t('forum.writeReplyPlaceholder') || "Rédiger une réponse"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReplyExpanded(false)}
                      className="text-[9px] font-black text-cordel-master-dark/60 hover:text-encre-noire hover:underline cursor-pointer"
                      title="Revenir à la barre compacte"
                    >
                      Réduire ✕
                    </button>
                  </div>

                  {/* Targeting & Mentions (Collapsible) */}
                  <div className="flex flex-col gap-2 pt-1 pb-2 border-b border-dashed border-cordel-master-dark/15 select-none">
                    <button
                      type="button"
                      onClick={() => setIsTargetingExpanded(!isTargetingExpanded)}
                      className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark hover:text-cordel-wood flex items-center gap-1.5 w-fit cursor-pointer transition-colors"
                    >
                      {isTargetingExpanded ? '▼ Masquer les options de ciblage & mentions' : '▶ Afficher les options de ciblage & mentions (Optionnel)'}
                    </button>
                    
                    {isTargetingExpanded && (
                      <div className="flex flex-col gap-2 p-2 bg-cordel-master-light/5 border border-cordel-master-dark/20 rounded">
                        {/* Target Group Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                            🗣️ {t('forum.targetGroup') || "Cibler un groupe (Optionnel)"}
                          </label>
                          <select
                            value={selectedTarget}
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            disabled={sending}
                            className="theme-input w-full disabled:opacity-50 text-[10px] py-1 font-bold bg-cordel-bg"
                          >
                            <option value="">{t('forum.targetAll') || "-- Tout le monde --"}</option>
                            {availableTargets.map((target) => (
                              <option key={target} value={target}>
                                {target}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mentions tags */}
                        {availableTargets.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 select-none mt-1">
                            <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">Mentionner :</span>
                            {availableTargets.map(tag => {
                              const tagLabel = typeof tag === 'string' ? tag : getTagId(tag);
                              return (
                                <button
                                  key={tagLabel}
                                  type="button"
                                  onClick={() => setReplyText(prev => prev + `@${tagLabel} `)}
                                  className="px-2 py-0.5 text-[9px] font-bold bg-cordel-bg border border-cordel-master-dark/20 rounded hover:border-encre-noire transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(24,23,22,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                                >
                                  @{tagLabel}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Éditeur riche */}
                  <RichTextEditor
                    value={replyText}
                    onChange={setReplyText}
                    disabled={sending}
                    placeholder={t('forum.writeReplyPlaceholder')}
                    groupId={profileData?.groupId}
                    lienDepotForum={lienDepotForum}
                    minHeight="85px"
                    onAddPoll={(!thread?.poll && (user?.uid === thread?.auteurId || isModeratorOrAdmin)) ? () => setIsAddPollOpen(true) : null}
                  />

                  <div className="flex justify-between items-center pt-1 border-t border-dashed border-cordel-master-dark/15">
                    <button
                      type="button"
                      onClick={() => setIsReplyExpanded(false)}
                      className="text-[10px] font-bold text-cordel-master-dark hover:underline cursor-pointer"
                    >
                      Mode compact
                    </button>
                    <CordelButton
                      variant="ocre"
                      useExtremeBorder={true}
                      disabled={sending || !replyText.trim()}
                      className="text-xs px-5 py-2 uppercase font-bold tracking-widest"
                    >
                      {sending ? t('forum.sendingMsg') : (t('common.send') || "Envoyer")}
                    </CordelButton>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Move Thread Modal */}
          {isMoveThreadOpen && (
            <MoveThreadModal
              thread={thread}
              channels={channels}
              isSubmitting={actionLoading}
              onClose={() => setIsMoveThreadOpen(false)}
              onConfirm={async (newChannelId, newCategory) => {
                const ok = await moveThread(thread.id, newChannelId, newCategory);
                if (ok) setIsMoveThreadOpen(false);
              }}
            />
          )}

          {/* Move Reply Modal */}
          {movingReplyData && (
            <MoveReplyModal
              reply={movingReplyData.reply}
              replyIndex={movingReplyData.index}
              currentThreadId={thread.id}
              availableThreads={allThreads}
              channels={channels}
              isSubmitting={actionLoading}
              onClose={() => setMovingReplyData(null)}
              onMoveToExisting={async (targetThreadId) => {
                const ok = await moveReplyToThread(thread.id, movingReplyData.index, targetThreadId);
                if (ok) setMovingReplyData(null);
              }}
              onExtractToNew={async (newTitle, newChannelId, newCategory) => {
                const ok = await extractReplyToNewThread(
                  thread.id,
                  movingReplyData.index,
                  newTitle,
                  newChannelId,
                  newCategory,
                  profileData
                );
                if (ok) setMovingReplyData(null);
              }}
            />
          )}

          {/* Edit Reply Modal */}
          {editingReplyData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
              <div className="relative w-full max-w-md">
                <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
                  <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                    <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase">
                      ✏️ Éditer le message
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingReplyData(null)}
                      className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditReply} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                        Message *
                      </label>
                      <RichTextEditor
                        value={editingReplyData.text}
                        onChange={(val) => setEditingReplyData(prev => ({ ...prev, text: val }))}
                        disabled={actionLoading}
                        placeholder="Message..."
                        groupId={profileData?.groupId}
                        minHeight="120px"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                      <CordelButton
                        type="button"
                        variant="default"
                        onClick={() => setEditingReplyData(null)}
                        disabled={actionLoading}
                        className="py-2 px-4 text-xs font-bold uppercase"
                      >
                        Annuler
                      </CordelButton>
                      <CordelButton
                        type="submit"
                        variant="ocre"
                        useExtremeBorder={true}
                        disabled={actionLoading || !editingReplyData.text.trim()}
                        className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                      >
                        {actionLoading ? "Enregistrement..." : "Enregistrer"}
                      </CordelButton>
                    </div>
                  </form>
                </CordelCard>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
