import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { getGeneralConversationId, ensureGeneralGroupConversation } from '../../utils/generalGroupChatUtils';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { uploadChatAttachment } from '../../utils/attachmentUploadUtils';
import { extractFirstYouTubeIdFromText } from './ChatYouTubePreview';

/**
 * Sous-composant WidgetZapPanel (Accueil) :
 * Mini-tchat interactif branché en temps réel sur « 💬 Le Zap » (`general_${groupId}`).
 * Affiche 3 bulles en flux statique sur mobile (< 1024px) et 5 sur PC (`lg:h-[240px]`), avec barre de réponse directe.
 */
export default function WidgetZapPanel({
  groupId,
  user,
  profileData,
  isMobile = false,
  onOpenZap,
  onUnreadCountChange,
  t
}) {
  const effectiveUser = useMemo(
    () => user || auth?.currentUser || (profileData?.uid ? { uid: profileData.uid } : null),
    [user, profileData]
  );
  const currentUserId = effectiveUser?.uid || profileData?.id || '';
  const generalConvId = useMemo(() => getGeneralConversationId(groupId), [groupId]);

  const [convDoc, setConvDoc] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const desktopListRef = useRef(null);

  useEffect(() => {
    if (!generalConvId || !currentUserId) return;
    ensureGeneralGroupConversation({ userId: currentUserId, groupId });
    const unsub = onSnapshot(doc(db, 'conversations', generalConvId), (snap) => {
      if (snap.exists()) setConvDoc({ id: snap.id, ...snap.data() });
    }, () => {});
    return () => unsub();
  }, [generalConvId, currentUserId, groupId]);

  const { messages, sendMessage } = useConversationMessages(
    generalConvId, groupId, effectiveUser, profileData, convDoc?.participantIds || [], convDoc
  );

  const unreadZapCount = useMemo(() => {
    if (!currentUserId) return 0;
    const lastReadMs = convDoc?.readStatus?.[currentUserId] ? new Date(convDoc.readStatus[currentUserId]).getTime() : 0;
    if (messages.length > 0) {
      return messages.filter((m) => m.senderId && m.senderId !== currentUserId && (lastReadMs <= 0 || new Date(m.timestamp || 0).getTime() > lastReadMs)).length;
    }
    if (convDoc?.lastMessage && convDoc.lastMessage.senderId !== currentUserId) {
      return lastReadMs <= 0 || new Date(convDoc.lastMessage.timestamp || 0).getTime() > lastReadMs ? 1 : 0;
    }
    return 0;
  }, [messages, convDoc, currentUserId]);

  useEffect(() => {
    if (onUnreadCountChange) onUnreadCountChange(unreadZapCount);
  }, [unreadZapCount, onUnreadCountChange]);

  const displayedMessages = useMemo(() => messages.slice(isMobile ? -3 : -5), [messages, isMobile]);

  useEffect(() => {
    if (!isMobile && desktopListRef.current) {
      desktopListRef.current.scrollTop = desktopListRef.current.scrollHeight;
    }
  }, [displayedMessages.length, isMobile]);

  const handleOpen = () => { if (onOpenZap && generalConvId) onOpenZap(generalConvId); };

  const handleSendText = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = inputText.trim();
    if (!trimmed || sending || uploadingPhoto) return;
    setSending(true);
    try {
      setInputText('');
      await sendMessage({ content: trimmed });
    } finally {
      setSending(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file || uploadingPhoto || sending) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadChatAttachment({ file, groupId: groupId || profileData?.groupId || 'Samambaia' });
      if (res?.success && res?.url) {
        const caption = inputText.trim();
        setInputText('');
        await sendMessage({
          content: caption,
          imageUrl: res.isImage ? res.url : null,
          thumbnailUrl: res.isImage ? res.url : null,
          mediaName: res.isImage ? res.fileName : null,
          fileUrl: !res.isImage ? res.url : null,
          fileName: !res.isImage ? res.fileName : null
        });
      }
    } catch (err) {
      console.error('WidgetZapPanel - Erreur envoi photo :', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const formatTimeDiscrete = (isoStr) => {
    const d = isoStr ? new Date(isoStr) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  };

  return (
    <div className="flex flex-col justify-between gap-2.5 w-full h-full text-left select-none">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-cordel-master-dark/20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isMobile && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--color-cordel-vert)] text-white border-2 border-encre-noire flex items-center justify-center text-sm shrink-0 shadow-[1px_1px_0px_0px_#181716]">💬</div>
          )}
          <div className="min-w-0">
            {!isMobile && (
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs uppercase font-black tracking-wider text-encre-noire truncate">{t?.('widgetForum.zapTitle') || 'Le Zap'}</h3>
                {unreadZapCount > 0 && <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-red-600 text-white animate-pulse">{unreadZapCount}</span>}
              </div>
            )}
            <p className="text-[10px] font-bold text-cordel-master-dark/75 truncate">{t?.('widgetForum.zapSubtitle') || "Le tchat de toute l'asso"}</p>
          </div>
        </div>
        <CordelButton type="button" variant="default" onClick={handleOpen} className="text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider shrink-0">
          {t?.('widgetForum.openBtn') || 'Ouvrir →'}
        </CordelButton>
      </div>

      <div
        ref={isMobile ? null : desktopListRef}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } }}
        className={`w-full flex flex-col justify-end gap-2 cursor-pointer rounded-[6px_8px_6px_8px] p-2 bg-cordel-bg-light/60 border border-encre-noire/15 hover:border-encre-noire/35 transition-colors ${isMobile ? '' : 'lg:h-[240px] lg:overflow-y-auto'}`}
      >
        {displayedMessages.length === 0 ? (
          <p className="text-[11px] font-semibold text-cordel-master-dark/70 italic text-center py-6">
            {t?.('widgetForum.liveGeneralEmpty') || 'Aucun message pour le moment. Écrivez le premier mot sur le Zap !'}
          </p>
        ) : (
          displayedMessages.map((msg) => {
            const isMe = Boolean(currentUserId && msg.senderId === currentUserId);
            const shortName = (msg.senderName || 'Membre').trim().split(/\s+/)[0];
            const ytId = extractFirstYouTubeIdFromText(msg.content);
            const hasUrl = !ytId && /(https?:\/\/[^\s]+)/i.test(msg.content || '');
            return (
              <div key={msg.id} className={`flex items-end gap-1.5 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <XiloAvatar src={msg.senderAvatar} name={msg.senderName || shortName} size={22} />}
                <div className={`max-w-[85%] px-2.5 py-1.5 border text-[11px] shadow-2xs flex flex-col gap-0.5 ${isMe ? 'bg-[var(--color-cordel-vert)]/15 border-[var(--color-cordel-vert)]/45 rounded-[10px_2px_10px_8px] text-encre-noire' : 'bg-cordel-bg border-encre-noire/25 rounded-[2px_10px_8px_10px] text-encre-noire'}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-[9.5px] font-black ${isMe ? 'text-[var(--color-cordel-vert)]' : 'text-cordel-wood'}`}>{shortName}</span>
                    <span className="text-[8px] font-bold opacity-60 shrink-0">{formatTimeDiscrete(msg.timestamp)}</span>
                  </div>
                  {(msg.thumbnailUrl || msg.imageUrl) && <img src={msg.thumbnailUrl || msg.imageUrl} alt={msg.mediaName || 'Photo'} loading="lazy" className="mt-0.5 max-h-16 w-auto rounded border border-encre-noire/25 object-cover self-start" />}
                  {ytId && <span className="text-[9.5px] font-extrabold text-cordel-wood">🎥 YouTube</span>}
                  {hasUrl && <span className="text-[9.5px] font-extrabold text-cordel-wood">🔗 Lien</span>}
                  {msg.content && <p className="font-semibold leading-snug line-clamp-2 break-words">{msg.content}</p>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendText} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 pt-1 w-full">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        <button type="button" disabled={uploadingPhoto || sending} onClick={() => fileInputRef.current?.click()} title={t?.('widgetForum.sendPhotoTitle') || 'Envoyer une photo sur le Zap'} className="w-8 h-8 rounded-[5px_7px_4px_6px] border-2 border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover flex items-center justify-center text-xs shadow-[1px_1px_0px_0px_#181716] cursor-pointer shrink-0 disabled:opacity-50">
          {uploadingPhoto ? '⏳' : '📷'}
        </button>
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={sending || uploadingPhoto} placeholder={t?.('widgetForum.zapPlaceholder') || 'Écrire sur le Zap...'} className="theme-input text-xs font-semibold py-1.5 px-2.5 flex-1 min-w-0 h-8 bg-cordel-bg-light" />
        <CordelButton type="submit" variant="vert" disabled={sending || uploadingPhoto || !inputText.trim()} title={t?.('widgetForum.sendBtnTitle') || 'Envoyer'} className="h-8 px-2.5 text-xs font-black flex items-center justify-center shrink-0">
          {sending ? '⏳' : '➤'}
        </CordelButton>
      </form>
    </div>
  );
}
