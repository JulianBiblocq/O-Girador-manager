import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelButton from './CordelButton';
import CordelCard from './CordelCard';
import XiloAvatar from './XiloAvatar';
import { useTerminologie } from '../hooks/useTerminologie';
import useConfirm from '../hooks/useConfirm';
import EmojiPickerPopover, { EmojiQuickRow } from './forum/EmojiPickerPopover';
import GroupMembersModal from './forum/GroupMembersModal';
import ChatFramaspaceImageModal from './forum/ChatFramaspaceImageModal';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { uploadChatAttachment } from '../utils/attachmentUploadUtils';
import { dispatchInAppAndPushNotification, NOTIFICATION_TYPES } from '../utils/inAppNotificationService';

/**
 * Composant PrivateChatView
 * Vue complète pour les échanges de discussion privée (Tête-à-tête direct ou Boucle de groupe).
 * Intègre les citations de réponse, les réactions emojis, le partage de photos Framaspace et la gestion des participants pour les groupes.
 */
export default function PrivateChatView({ 
  user, 
  conversation, 
  recipientId, 
  otherUser, 
  profileData, 
  usersMap = {}, 
  initialText = '', 
  onClose, 
  onBack,
  onMarkAsRead,
  onAddParticipants,
  onRemoveParticipant,
  onRenameGroup,
  onLeaveGroup,
  isSystemAdmin = false
}) {
  const { tRole } = useTerminologie();
  const { confirm } = useConfirm();
  const [inputText, setInputText] = useState(initialText || '');
  const [sending, setSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isFramaspaceModalOpen, setIsFramaspaceModalOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const messagesEndRef = useRef(null);
  const attachmentInputRef = useRef(null);


  const isGroup = conversation?.type === 'group';

  // 1. Détermination du partenaire direct ou du groupe
  const effectiveOtherUser = useMemo(() => {
    if (isGroup) return null;
    if (otherUser?.id) return otherUser;
    if (recipientId) return usersMap[recipientId] || { id: recipientId };
    if (conversation?.participantIds) {
      const otherId = conversation.participantIds.find(id => id !== user?.uid);
      return usersMap[otherId] || { id: otherId };
    }
    return null;
  }, [isGroup, otherUser, recipientId, usersMap, conversation?.participantIds, user?.uid]);

  const headerTitle = useMemo(() => {
    if (isGroup) {
      return conversation?.name || 'Groupe Privé';
    }
    return `${effectiveOtherUser?.prenom || ''} ${effectiveOtherUser?.nom || ''}`.trim() || effectiveOtherUser?.email || "Membre";
  }, [isGroup, conversation?.name, effectiveOtherUser]);

  // 2. Gestion des messages via le hook useConversationMessages
  const conversationId = conversation?.id;
  const groupId = profileData?.groupId || conversation?.groupId || '';

  const { 
    messages: convMessages, 
    sendMessage: sendConvMessage, 
    toggleReaction: toggleConvReaction,
    deleteMessage: deleteConvMessage,
    editMessage: editConvMessage
  } = useConversationMessages(
    conversationId,
    groupId,
    user,
    profileData,
    conversation?.participantIds || [],
    conversation
  );

  // Suppression d'un de ses propres messages
  const handleDeleteMessage = async (msg) => {
    if (!msg || msg.senderId !== user?.uid) return;

    const ok = await confirm({
      title: "Supprimer le message",
      message: "Êtes-vous sûr de vouloir supprimer définitivement ce message ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      confirmVariant: "danger"
    });
    if (!ok) return;

    try {
      if (msg.isLegacy || !conversationId) {
        await deleteDoc(doc(db, 'private_messages', msg.id));
      } else {
        await deleteConvMessage(msg.id);
      }
    } catch (err) {
      console.error("PrivateChatView - Erreur lors de la suppression du message :", err);
      alert("Erreur lors de la suppression du message : " + (err.message || err));
    }
  };

  // Début d'édition d'un de ses propres messages
  const handleStartEdit = (msg) => {
    if (!msg || msg.senderId !== user?.uid) return;
    setEditingMessage(msg);
    setEditText(msg.content || '');
  };

  // Enregistrement de l'édition
  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = editText.trim();
    if (!editingMessage || !trimmed || isSubmittingEdit) return;

    setIsSubmittingEdit(true);
    try {
      const nowIso = new Date().toISOString();
      if (editingMessage.isLegacy || !conversationId) {
        await updateDoc(doc(db, 'private_messages', editingMessage.id), {
          content: trimmed,
          isEdited: true,
          editedAt: nowIso
        });
      } else {
        await editConvMessage(editingMessage.id, trimmed);
      }
      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      console.error("PrivateChatView - Erreur lors de la modification du message :", err);
      alert("Erreur lors de la modification du message : " + (err.message || err));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 3. Récupération résiliente des messages privés historiques (1-à-1 legacy)
  const [legacyMessages, setLegacyMessages] = useState([]);
  useEffect(() => {
    // Si c'est un groupe ou si les identifiants d'interlocuteurs sont indisponibles, ignorer l'historique direct 1-à-1
    if (isGroup || !user?.uid || !effectiveOtherUser?.id) {
      setLegacyMessages([]);
      return;
    }

    const messagesRef = collection(db, 'private_messages');
    let sentList = [];
    let receivedList = [];

    const syncCombinedLegacy = () => {
      const map = new Map();
      sentList.forEach((m) => map.set(m.id, m));
      receivedList.forEach((m) => map.set(m.id, m));
      const list = Array.from(map.values());
      list.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      setLegacyMessages(list);

      // Acquittement des messages reçus non lus
      list.forEach((msg) => {
        if (msg.recipientId === user.uid && msg.senderId === effectiveOtherUser.id && !msg.read) {
          updateDoc(doc(db, 'private_messages', msg.id), { read: true }).catch(() => {});
        }
      });
    };

    // Écoute des messages envoyés par l'utilisateur connecté à cet interlocuteur
    const qSent = query(
      messagesRef,
      where('senderId', '==', user.uid),
      where('recipientId', '==', effectiveOtherUser.id)
    );
    const unsubSent = onSnapshot(
      qSent,
      (snap) => {
        sentList = [];
        snap.forEach((d) => sentList.push({ id: d.id, ...d.data() }));
        syncCombinedLegacy();
      },
      (error) => {
        console.warn('PrivateChatView - Erreur écoute messages historiques envoyés :', error);
      }
    );

    // Écoute des messages reçus par l'utilisateur connecté depuis cet interlocuteur
    const qRecv = query(
      messagesRef,
      where('recipientId', '==', user.uid),
      where('senderId', '==', effectiveOtherUser.id)
    );
    const unsubRecv = onSnapshot(
      qRecv,
      (snap) => {
        receivedList = [];
        snap.forEach((d) => receivedList.push({ id: d.id, ...d.data() }));
        syncCombinedLegacy();
      },
      (error) => {
        console.warn('PrivateChatView - Erreur écoute messages historiques reçus :', error);
      }
    );

    return () => {
      unsubSent();
      unsubRecv();
    };
  }, [isGroup, user?.uid, effectiveOtherUser?.id]);

  // Acquittement de lecture de la conversation moderne
  useEffect(() => {
    if (conversationId && onMarkAsRead) {
      onMarkAsRead(conversationId);
    }
  }, [conversationId, convMessages.length, onMarkAsRead]);

  // 4. Fusion unifiée des messages modernes et historiques (sans doublons, tri chronologique)
  const activeMessages = useMemo(() => {
    if (isGroup) {
      return convMessages;
    }

    // Pour une discussion 1-à-1, combiner les messages de conversation_messages et private_messages
    const combined = [...convMessages];
    const modernLegacyIds = new Set(
      convMessages.map((m) => m.legacyMessageId || m.id).filter(Boolean)
    );
    const modernSignatures = new Set(
      convMessages.map((m) => `${m.senderId}_${m.timestamp}_${m.content}`)
    );

    legacyMessages.forEach((legacyMsg) => {
      const sig = `${legacyMsg.senderId}_${legacyMsg.timestamp}_${legacyMsg.content}`;
      if (!modernLegacyIds.has(legacyMsg.id) && !modernSignatures.has(sig)) {
        combined.push({
          ...legacyMsg,
          isLegacy: true,
          senderName:
            legacyMsg.senderName ||
            (legacyMsg.senderId === user?.uid
              ? (profileData?.prenom ? `${profileData.prenom} ${profileData.nom || ''}`.trim() : user.displayName || 'Membre')
              : (effectiveOtherUser?.prenom
                  ? `${effectiveOtherUser.prenom} ${effectiveOtherUser.nom || ''}`.trim()
                  : effectiveOtherUser?.email || 'Membre')),
          senderAvatar:
            legacyMsg.senderAvatar ||
            (legacyMsg.senderId === user?.uid
              ? (profileData?.photoURL || user.photoURL || '')
              : (effectiveOtherUser?.photoURL || ''))
        });
      }
    });

    combined.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
    return combined;
  }, [isGroup, convMessages, legacyMessages, user?.uid, profileData, effectiveOtherUser]);

  // Défilement automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Notification Push et In-App pour les messages legacy 1-à-1
  const notifyLegacyRecipient = async (textSnippet) => {
    if (!effectiveOtherUser?.id) return;
    try {
      const senderFullName = profileData?.prenom
        ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
        : user.displayName || 'Membre';
      const cleanSnippet = (textSnippet || '').length > 80 ? `${textSnippet.slice(0, 80)}...` : (textSnippet || '');
      await dispatchInAppAndPushNotification({
        recipientId: effectiveOtherUser.id,
        groupId: groupId || profileData?.groupId || '',
        type: NOTIFICATION_TYPES.CHAT_DIRECT,
        titre: `✉️ ${senderFullName}`,
        message: `"${cleanSnippet}"`,
        targetUrl: `/app/forum?tab=inbox&chatUserId=${user.uid}`,
        sendPush: true
      });
    } catch (notifErr) {
      console.warn("PrivateChatView - Erreur envoi notification legacy :", notifErr);
    }
  };

  // Gestion de l'envoi d'un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      if (conversationId) {
        // Envoi dans la conversation moderne (groupe ou direct)
        await sendConvMessage({
          content: trimmed,
          replyTo: replyingTo
        });
      } else {
        // Fallback envoi legacy 1-à-1
        await addDoc(collection(db, 'private_messages'), {
          senderId: user.uid,
          recipientId: effectiveOtherUser.id,
          content: trimmed,
          timestamp: new Date().toISOString(),
          read: false,
          groupId
        });
        await notifyLegacyRecipient(trimmed);
      }
      setInputText('');
      setReplyingTo(null);
    } catch (err) {
      console.error("PrivateChatView - Erreur lors de l'envoi du message :", err);
      alert("Erreur lors de l'envoi du message : " + (err.message || err));
    } finally {
      setSending(false);
    }
  };

  // Envoi d'une photo issue du cloud externe Framaspace
  const handleSendFramaspaceImage = async ({ imageUrl, thumbnailUrl, mediaName, caption }) => {
    if (!imageUrl || sending) return;

    setSending(true);
    try {
      if (conversationId) {
        await sendConvMessage({
          content: caption,
          imageUrl,
          thumbnailUrl,
          mediaName,
          replyTo: replyingTo
        });
      } else {
        // Fallback envoi legacy 1-à-1
        await addDoc(collection(db, 'private_messages'), {
          senderId: user.uid,
          recipientId: effectiveOtherUser.id,
          content: caption || '📷 Photo',
          imageUrl,
          thumbnailUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          read: false,
          groupId
        });
        await notifyLegacyRecipient(caption || '📷 Photo');
      }
      setReplyingTo(null);
    } catch (err) {
      console.error("PrivateChatView - Erreur lors du partage de l'image Framaspace :", err);
      alert("Erreur lors du partage de l'image : " + (err.message || err));
    } finally {
      setSending(false);
    }
  };

  // Envoi d'une photo ou d'un document directement depuis l'appareil de l'utilisateur
  const handleDirectFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (maximum 30 Mo).");
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const effectiveGroupId = groupId || profileData?.groupId || 'Samambaia';
      const result = await uploadChatAttachment({
        file,
        groupId: effectiveGroupId
      });

      if (result?.success && result?.url) {
        if (result.isImage) {
          if (conversationId) {
            await sendConvMessage({
              imageUrl: result.url,
              thumbnailUrl: result.url,
              mediaName: result.fileName,
              replyTo: replyingTo
            });
          } else {
            // Fallback envoi legacy 1-à-1
            await addDoc(collection(db, 'private_messages'), {
              senderId: user.uid,
              recipientId: effectiveOtherUser.id,
              content: '📷 Photo',
              imageUrl: result.url,
              thumbnailUrl: result.url,
              mediaName: result.fileName,
              timestamp: new Date().toISOString(),
              read: false,
              groupId: effectiveGroupId
            });
            await notifyLegacyRecipient('📷 Photo');
          }
        } else {
          // Document / Fichier joint (PDF, tableur, archive, etc.)
          if (conversationId) {
            await sendConvMessage({
              content: `📎 ${result.fileName}`,
              fileUrl: result.url,
              fileName: result.fileName,
              replyTo: replyingTo
            });
          } else {
            // Fallback envoi legacy 1-à-1
            await addDoc(collection(db, 'private_messages'), {
              senderId: user.uid,
              recipientId: effectiveOtherUser.id,
              content: `📎 ${result.fileName}`,
              fileUrl: result.url,
              fileName: result.fileName,
              timestamp: new Date().toISOString(),
              read: false,
              groupId: effectiveGroupId
            });
            await notifyLegacyRecipient(`📎 ${result.fileName}`);
          }
        }
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("PrivateChatView - Erreur lors de l'envoi de la pièce jointe :", err);
      alert("Erreur lors de l'envoi du fichier : " + (err.message || err));
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };


  const formatMessageTime = (isoString) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleBackClick = () => {
    if (onBack) onBack();
    else if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-[560px] border-2 border-encre-noire rounded-[8px_12px_10px_9px] shadow-[4px_4px_0px_0px_#181716] overflow-hidden bg-cordel-bg text-left select-none">
      
      {/* 1. En-tête de la discussion */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-encre-noire/20 p-3 bg-white/40 dark:bg-black/10">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button" 
            onClick={handleBackClick} 
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center shrink-0"
            title="Retour à la liste"
          >
            ⬅️
          </button>
          
          <div className="flex items-center gap-2.5 min-w-0">
            {isGroup ? (
              <div className="w-9 h-9 rounded-full bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center text-sm shadow-xs shrink-0 select-none">
                👥
              </div>
            ) : (
              <XiloAvatar src={effectiveOtherUser?.photoURL} name={headerTitle} size={36} />
            )}
            
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-xs text-encre-noire truncate">
                {headerTitle}
              </span>
              {isGroup ? (
                <span className="text-[9px] font-bold text-cordel-wood">
                  {conversation?.participantIds?.length || 0} participants
                </span>
              ) : (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-dashed mt-0.5 self-start scale-90 origin-left">
                  {tRole(effectiveOtherUser?.role || 'membre', effectiveOtherUser?.genre)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action pour les groupes : Ouvrir la gestion des membres */}
        {isGroup && (
          <button
            type="button"
            onClick={() => setIsMembersModalOpen(true)}
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-cordel-bg hover:bg-white border border-encre-noire rounded shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
            title="Gérer les membres du groupe"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Membres</span>
          </button>
        )}
      </div>

      {/* 2. Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-cordel-bg-light/40 scrollbar-thin">
        {activeMessages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center opacity-50 select-none">
            <span className="text-xl mb-2">{isGroup ? '👥' : '✉️'}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isGroup ? 'Boucle créée ! Envoyez le premier message au groupe.' : 'Aucun message. Lancez la discussion !'}
            </span>
          </div>
        ) : (
          activeMessages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            const senderProfile = usersMap[msg.senderId] || { prenom: msg.senderName || 'Membre' };
            const senderDisplayName = msg.senderName || `${senderProfile.prenom || ''} ${senderProfile.nom || ''}`.trim() || 'Membre';

            return (
              <div 
                key={msg.id}
                className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Nom et avatar de l'expéditeur dans les groupes pour les messages reçus */}
                {isGroup && !isMe && (
                  <div className="flex items-center gap-1.5 mb-1 pl-1">
                    <XiloAvatar src={msg.senderAvatar || senderProfile.photoURL} name={senderDisplayName} size={18} />
                    <span className="text-[10px] font-extrabold text-cordel-wood">
                      {senderDisplayName}
                    </span>
                  </div>
                )}

                <div className="relative group max-w-[80%] flex flex-col">
                  {/* Bulle de message principale */}
                  <div 
                    className={`px-3.5 py-2.5 rounded-[8px_12px_10px_9px] border-2 border-encre-noire flex flex-col gap-1 ${
                      isMe 
                        ? 'bg-cordel-wood text-cordel-bg-light shadow-[2.5px_2.5px_0px_0px_rgba(24,23,22,0.15)] rounded-tr-none' 
                        : 'bg-white text-encre-noire shadow-[2.5px_2.5px_0px_0px_rgba(24,23,22,0.15)] rounded-tl-none'
                    }`}
                  >
                    {/* Encadré de citation si le message répond à un autre */}
                    {msg.replyTo && (
                      <div className={`p-1.5 mb-1 rounded text-[10px] border-l-2 ${
                        isMe 
                          ? 'bg-black/20 border-white/80 text-white/90' 
                          : 'bg-amber-50 border-cordel-wood text-encre-noire'
                      }`}>
                        <span className="font-bold block text-[9px] opacity-80">
                          {msg.replyTo.senderName} :
                        </span>
                        <p className="truncate italic">
                          {msg.replyTo.content}
                        </p>
                      </div>
                    )}

                    {/* Image partagée depuis Framaspace Cloud ou Firebase Storage */}
                    {msg.imageUrl && (
                      <div 
                        className="mt-1 mb-1 rounded-[6px_8px_6px_7px] overflow-hidden border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] cursor-pointer bg-black/10 group/img relative max-w-[240px] sm:max-w-[300px]"
                        onClick={() => setLightboxUrl(msg.imageUrl)}
                        title="Cliquer pour afficher la photo en grand format"
                      >
                        <img
                          src={msg.thumbnailUrl || msg.imageUrl}
                          alt={msg.mediaName || "Photo partagée"}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            if (msg.imageUrl && e.target.src !== msg.imageUrl) {
                              e.target.src = msg.imageUrl;
                            }
                          }}
                          className="w-full max-h-60 object-cover object-center block group-hover/img:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 select-none">
                          <span>🔍 Agrandir</span>
                        </div>
                      </div>
                    )}

                    {/* Pièce jointe / Document joint (PDF, tableur, etc.) */}
                    {msg.fileUrl && (
                      <div className="mt-1 mb-1">
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-[6px] border-2 text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                            isMe
                              ? 'bg-amber-100/25 text-cordel-bg-light border-white/60 hover:bg-amber-100/35'
                              : 'bg-cordel-bg text-encre-noire border-encre-noire hover:bg-amber-50'
                          }`}
                          title="Télécharger / Ouvrir la pièce jointe"
                        >
                          <span className="text-sm shrink-0">📄</span>
                          <span className="truncate max-w-[190px] underline decoration-dashed">
                            {msg.fileName || 'Document joint'}
                          </span>
                          <span className="text-[10px] opacity-75 shrink-0 font-mono">↗</span>
                        </a>
                      </div>
                    )}

                    {msg.content && msg.content !== '📷 Photo' && (!msg.fileUrl || msg.content !== `📎 ${msg.fileName}`) && (
                      <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed select-text">
                        {msg.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      {/* Actions sur le message */}
                      <div className="flex items-center gap-1.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setReplyingTo({
                            id: msg.id,
                            senderName: isMe ? 'Vous' : senderDisplayName,
                            content: msg.content || (msg.imageUrl ? '📷 Photo' : (msg.fileUrl ? `📎 ${msg.fileName || 'Fichier'}` : ''))
                          })}
                          className={`text-[9px] font-bold cursor-pointer ${
                            isMe ? 'text-white/80 hover:text-white' : 'text-cordel-master-dark/70 hover:text-encre-noire'
                          }`}
                          title="Répondre à ce message"
                        >
                          ↩️ Répondre
                        </button>

                        {/* Édition et suppression réservées exclusivement à l'auteur du message */}
                        {isMe && (
                          <>
                            {msg.content && msg.content !== '📷 Photo' && (!msg.fileUrl || msg.content !== `📎 ${msg.fileName}`) && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                className="text-[9px] font-bold cursor-pointer text-amber-200 hover:text-white transition-colors"
                                title="Modifier ce message"
                              >
                                ✏️ Éditer
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg)}
                              className="text-[9px] font-bold cursor-pointer text-red-200 hover:text-red-100 transition-colors"
                              title="Supprimer ce message"
                            >
                              🗑️ Supprimer
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {msg.isEdited && (
                          <span className={`text-[7px] italic font-semibold ${isMe ? 'text-white/70' : 'text-encre-noire/60'}`}>
                            (modifié)
                          </span>
                        )}
                        <span className={`text-[8px] font-black uppercase text-right opacity-60 ${
                          isMe ? 'text-cordel-bg-light' : 'text-encre-noire'
                        }`}>
                          {formatMessageTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rangée des réactions emojis existantes */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(msg.reactions).map(([emoji, uids]) => {
                        if (!Array.isArray(uids) || uids.length === 0) return null;
                        const hasReacted = uids.includes(user.uid);

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleConvReaction && toggleConvReaction(msg.id, emoji)}
                            className={`px-1.5 py-0.5 text-[10px] rounded-full border flex items-center gap-1 cursor-pointer transition-all ${
                              hasReacted
                                ? 'bg-amber-200 border-encre-noire font-black shadow-xs scale-105'
                                : 'bg-white/80 border-cordel-master-dark/20 text-encre-noire hover:bg-amber-50'
                            }`}
                            title={`${uids.length} réaction(s)`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[8px]">{uids.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Accès rapide pour réagir au message */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {['👍', '❤️', '👏', '😂'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleConvReaction && toggleConvReaction(msg.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                        title={`Réagir avec ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Zone de saisie et d'envoi */}
      <div className="flex flex-col border-t-2 border-dashed border-encre-noire/20 p-2.5 bg-white/40 dark:bg-black/10 select-none">
        
        {/* Bandeau de réponse / citation active */}
        {replyingTo && (
          <div className="mb-2 p-1.5 bg-amber-100/90 border border-encre-noire rounded flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-bold text-cordel-wood shrink-0">↩️ En réponse à {replyingTo.senderName} :</span>
              <span className="truncate italic text-cordel-master-dark">{replyingTo.content}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-xs font-bold text-cordel-wood hover:text-red-700 px-1 cursor-pointer shrink-0"
              title="Annuler la réponse"
            >
              ✕
            </button>
          </div>
        )}

        {/* Ligne d'accès direct aux émoticônes fréquents */}
        <div className="flex items-center gap-1.5 px-1 pb-1.5">
          <span className="text-[8px] font-black uppercase text-cordel-wood opacity-75 shrink-0">
            Émojis :
          </span>
          <EmojiQuickRow
            onSelectEmoji={(emoji) => setInputText(prev => (prev || '') + emoji)}
            onOpenFullPicker={() => setIsEmojiPickerOpen(prev => !prev)}
            className="flex-1"
          />
        </div>

        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center gap-2"
        >
          {isEmojiPickerOpen && (
            <EmojiPickerPopover
              onSelectEmoji={(emoji) => {
                setInputText(prev => (prev || '') + emoji);
                setIsEmojiPickerOpen(false);
              }}
              onClose={() => setIsEmojiPickerOpen(false)}
            />
          )}

          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(prev => !prev)}
            className={`w-9 h-[38px] flex items-center justify-center text-sm rounded border-2 transition-all cursor-pointer shrink-0 ${
              isEmojiPickerOpen
                ? 'bg-cordel-wood text-white border-encre-noire'
                : 'bg-cordel-bg hover:bg-white border-encre-noire/40'
            }`}
            title="Choisir un émoticône"
          >
            😀
          </button>

          {/* Sélecteur de fichier direct depuis l'appareil (photo ou document) */}
          <input
            ref={attachmentInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp3,.ogg,.wav"
            onChange={handleDirectFileUpload}
            disabled={sending || isUploadingAttachment}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            disabled={sending || isUploadingAttachment}
            className="w-9 h-[38px] flex items-center justify-center text-sm rounded border-2 bg-cordel-bg hover:bg-white border-encre-noire/40 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Joindre une photo ou un fichier depuis votre appareil"
          >
            {isUploadingAttachment ? (
              <span className="inline-block animate-spin text-xs">⏳</span>
            ) : (
              <span>📎</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFramaspaceModalOpen(true)}
            disabled={sending || isUploadingAttachment}
            className="w-9 h-[38px] flex items-center justify-center text-sm rounded border-2 bg-cordel-bg hover:bg-white border-encre-noire/40 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Partager une photo du Cloud Framaspace (0 Mo sur Firebase)"
          >
            📸
          </button>

          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isGroup ? `Message au groupe ${conversation?.name || ''}...` : "Rédiger un message..."}
            disabled={sending}
            className="theme-input text-xs font-bold py-2 bg-cordel-bg-light flex-grow"
          />
          <CordelButton
            type="submit"
            variant="vert"
            useExtremeBorder={true}
            disabled={sending || !inputText.trim()}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider min-h-[38px] shrink-0"
          >
            Envoyer
          </CordelButton>
        </form>
      </div>

      {/* Modale de gestion des membres pour les discussions de groupe */}
      {isGroup && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          conversation={conversation}
          currentUserId={user?.uid}
          isSystemAdmin={isSystemAdmin}
          allMembers={Object.values(usersMap)}
          onAddParticipants={onAddParticipants}
          onRemoveParticipant={onRemoveParticipant}
          onRenameGroup={onRenameGroup}
          onLeaveGroup={onLeaveGroup}
        />
      )}

      {/* Modale de sélection de photos du Cloud Framaspace */}
      <ChatFramaspaceImageModal
        isOpen={isFramaspaceModalOpen}
        onClose={() => setIsFramaspaceModalOpen(false)}
        onSelectImage={handleSendFramaspaceImage}
        groupId={groupId}
      />

      {/* Lightbox d'agrandissement d'une photo partagée */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img 
              src={lightboxUrl} 
              alt="Photo en grand format" 
              className="max-w-full max-h-[82vh] object-contain rounded border-2 border-white shadow-2xl" 
            />
            <div className="flex items-center gap-3 mt-3">
              <a 
                href={lightboxUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded border border-white/40"
                onClick={(e) => e.stopPropagation()}
              >
                Ouvrir l'original ↗
              </a>
              <button 
                type="button" 
                onClick={() => setLightboxUrl(null)}
                className="text-xs font-bold text-white bg-[var(--color-cordel-rouge,#8b2a1a)] hover:brightness-110 px-3 py-1.5 rounded border border-white/40 cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modale d'édition d'un message */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-md">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase">
                  ✏️ Modifier mon message
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessage(null);
                    setEditText('');
                  }}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Nouveau texte *
                  </label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    disabled={isSubmittingEdit}
                    placeholder="Votre message..."
                    rows={4}
                    className="theme-input text-xs font-medium p-2.5 bg-cordel-bg-light resize-none w-full"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => {
                      setEditingMessage(null);
                      setEditText('');
                    }}
                    disabled={isSubmittingEdit}
                    className="py-2 px-4 text-xs font-bold uppercase"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={isSubmittingEdit || !editText.trim()}
                    className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {isSubmittingEdit ? "Enregistrement..." : "Enregistrer"}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}
    </div>
  );
}
