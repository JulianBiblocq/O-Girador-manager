import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import RichTextEditor from './RichTextEditor';
import FormattedMessageContent from './FormattedMessageContent';

// Memoized ThreadReplyItem component to avoid re-rendering comments when typing
const ThreadReplyItem = React.memo(({
  reply,
  index,
  userId,
  profileData,
  isModeratorOrAdmin,
  onDeleteReply,
  t,
  formattedTime
}) => {
  const isCurrentUser = reply.auteurId === userId;

  // Check if message targets user tags/instruments
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
          border-2 p-3 shadow-[2px_2px_0px_0px_#181716] transition-all
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
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-cordel-wood select-none">
              {reply.auteurNom}
            </span>
          ) : <span />}
          {isModeratorOrAdmin && (
            <button
              type="button"
              onClick={() => onDeleteReply(index)}
              className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer leading-none select-none"
              title={t('common.delete') || "Supprimer"}
            >
              🗑️
            </button>
          )}
        </div>

        <FormattedMessageContent content={reply.message} />

        <span className="text-[7px] font-black opacity-60 block mt-2 text-right select-none">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.index === nextProps.index &&
         prevProps.reply.message === nextProps.reply.message &&
         prevProps.reply.dateCreation === nextProps.reply.dateCreation &&
         prevProps.reply.targetTag === nextProps.reply.targetTag &&
         prevProps.userId === nextProps.userId &&
         prevProps.profileData === nextProps.profileData &&
         prevProps.isModeratorOrAdmin === nextProps.isModeratorOrAdmin &&
         prevProps.formattedTime === nextProps.formattedTime &&
         prevProps.onDeleteReply === nextProps.onDeleteReply;
});

export default function ThreadView({ threadId, user, profileData, channels = [], onClose }) {
  const { t } = useTranslation();

  const getCategoryLabel = (cat) => {
    return t(`forum.${cat}`) || cat;
  };

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [availableTargets, setAvailableTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  
  const threadChannel = channels.find(c => c.id === thread?.channelId);
  const isModeratorOrAdmin = profileData?.role === 'mestre' || 
                             profileData?.role === 'super-admin' || 
                             profileData?.isSystemAdmin === true || 
                             (profileData?.tags && (profileData.tags.includes('Modérateur') || profileData.tags.includes('Modérateur Forum')));

  const isReadOnly = (() => {
    if (isModeratorOrAdmin) return false;
    if (!thread) return true;
    if (!thread.channelId) return false;
    if (!threadChannel) return false;

    const userRole = profileData?.role || 'membre';
    const userTags = profileData?.tags || [];

    const write = threadChannel.writeRoles || ['all'];
    if (write.includes('all')) return false;
    if (write.includes(userRole)) return false;
    if (userTags.some(tag => write.includes(tag))) return false;

    // Rétrocompatibilité
    if (threadChannel.allowedRoles) {
      return !(threadChannel.allowedRoles.includes('all') || threadChannel.allowedRoles.includes(userRole));
    }
    return true;
  })();
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Listen to this specific thread document in real-time
  useEffect(() => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const threadRef = doc(db, 'forum', threadId);
    const unsubscribe = onSnapshot(threadRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setThread({
          id: docSnap.id,
          ...data
        });
      } else {
        setThread(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("ThreadView - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [threadId]);

  // Scroll down when thread messages update
  useEffect(() => {
    if (thread?.reponses) {
      scrollToBottom();
    }
  }, [thread?.reponses]);

  // Load available tags and instruments from association document
  useEffect(() => {
    if (!profileData?.groupId) return;
    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const tags = data.tagsDisponibles || [];
        const instruments = data.instrumentsDisponibles || [];
        const combined = [...new Set([...tags, ...instruments])].filter(Boolean).sort();
        setAvailableTargets(combined);
      }
    }, (error) => {
      console.error("ThreadView - Error fetching targets:", error);
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
    if (!window.confirm("Voulez-vous vraiment supprimer cette discussion ?")) return;
    try {
      await deleteDoc(doc(db, 'forum', threadId));
      onClose();
    } catch (err) {
      console.error("Error deleting thread:", err);
      alert("Erreur lors de la suppression de la discussion.");
    }
  };

  const handleDeleteReply = useCallback(async (indexToDelete) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce message ?")) return;
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
  }, [thread, threadId]);

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
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
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
            {isModeratorOrAdmin && (
              <button
                type="button"
                onClick={handleDeleteThread}
                className="absolute top-3 right-3 text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 rounded px-1.5 py-0.5 shadow-sm"
                title={t('common.delete') || "Supprimer"}
              >
                🗑️ {t('common.delete') || "Supprimer"}
              </button>
            )}
            <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
              {getCategoryLabel(thread.categorie)}
            </span>
            <h3 className="font-extrabold text-base text-encre-noire leading-tight mt-0.5 mb-2 pr-24">
              {thread.titre}
            </h3>
            <p className="text-[10px] font-bold tracking-wide opacity-75">
              {(t('forum.launchedBy') || "Lancé par {author}").replace('{author}', thread.auteurNom)}
            </p>
          </CordelCard>

          {/* Messages Container (Scrollable) */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[360px] p-2 bg-cordel-bg-light border-2 border-dashed border-cordel-master-dark/20 rounded-md">
            {(thread.reponses || []).map((reply, index) => {
              const dateMsg = new Date(reply.dateCreation);
              const formattedTime = isNaN(dateMsg.getTime())
                ? ''
                : (t('forum.atTime') || "{time} le {date}")
                    .replace('{time}', dateMsg.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
                    .replace('{date}', dateMsg.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));

              return (
                <ThreadReplyItem
                  key={`${reply.dateCreation}-${index}`}
                  reply={reply}
                  index={index}
                  userId={user.uid}
                  profileData={profileData}
                  isModeratorOrAdmin={isModeratorOrAdmin}
                  onDeleteReply={handleDeleteReply}
                  t={t}
                  formattedTime={formattedTime}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Form or Read-Only Banner */}
          {isReadOnly ? (
            <div className="p-4 text-center border-2 border-dashed border-cordel-wood/30 bg-cordel-bg rounded-md select-none mt-2">
              <span className="text-xs font-black text-cordel-wood">
                🔇 Ce salon est en lecture seule pour votre rôle.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex flex-col gap-2 mt-auto select-none">
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

              {availableTargets.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 my-1.5 select-none">
                  <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">Mentionner :</span>
                  {availableTargets.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setReplyText(prev => prev + `@${tag} `)}
                      className="px-2 py-0.5 text-[9px] font-bold bg-cordel-bg border border-cordel-master-dark/20 rounded hover:border-encre-noire transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(24,23,22,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                    >
                      @{tag}
                    </button>
                  ))}
                </div>
              )}

              <RichTextEditor
                value={replyText}
                onChange={setReplyText}
                disabled={sending}
                placeholder={t('forum.writeReplyPlaceholder')}
                groupId={profileData?.groupId}
                minHeight="90px"
              />
              <div className="flex justify-end">
                <CordelButton
                  variant="ocre"
                  useExtremeBorder={true}
                  disabled={sending || !replyText.trim()}
                  className="text-xs px-5 py-2 uppercase font-bold tracking-widest"
                >
                  {sending ? t('forum.sendingMsg') : (t('common.send') || "Envoyer")}
                </CordelButton>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
