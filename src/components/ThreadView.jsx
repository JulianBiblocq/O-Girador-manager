import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

export default function ThreadView({ threadId, user, profileData, onClose }) {
  const { t } = useTranslation();

  const getCategoryLabel = (cat) => {
    return t(`forum.${cat}`) || cat;
  };

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages container
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !threadId) return;

    setSending(true);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const nowIso = new Date().toISOString();
      const authorName = `${profileData.prenom} ${profileData.nom}`;

      // Atomic updateDoc adding the new message using arrayUnion and updating the latest modification time
      await updateDoc(threadRef, {
        reponses: arrayUnion({
          auteurId: user.uid,
          auteurNom: authorName,
          message: replyText,
          dateCreation: nowIso
        }),
        derniereModification: nowIso
      });

      setReplyText('');
    } catch (error) {
      console.error("ThreadView - Erreur updateDoc/arrayUnion :", error);
      alert(t('common.saveError'));
    } finally {
      setSending(false);
    }
  };

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
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ {t('common.loading')}</span>
        </div>
      ) : !thread ? (
        <CordelCard variant="default" className="p-8 text-center">
          <p className="text-xs opacity-75 font-semibold">{t('forum.notFound')}</p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {/* Thread Header details */}
          <CordelCard variant={badgeVariant} useExtremeBorder={true} className="py-4 relative">
            <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
              {getCategoryLabel(thread.categorie)}
            </span>
            <h3 className="font-extrabold text-base text-encre-noire leading-tight mt-0.5 mb-2">
              {thread.titre}
            </h3>
            <p className="text-[10px] font-bold tracking-wide opacity-75">
              {(t('forum.launchedBy') || "Lancé par {author}").replace('{author}', thread.auteurNom)}
            </p>
          </CordelCard>

          {/* Messages Container (Scrollable) */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[360px] p-2 bg-cordel-bg-light border-2 border-dashed border-cordel-master-dark/20 rounded-md">
            {(thread.reponses || []).map((reply, index) => {
              const isCurrentUser = reply.auteurId === user.uid;
              const dateMsg = new Date(reply.dateCreation);
              const formattedTime = isNaN(dateMsg.getTime())
                ? ''
                : (t('forum.atTime') || "{time} le {date}")
                    .replace('{time}', dateMsg.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
                    .replace('{date}', dateMsg.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));

              return (
                <div 
                  key={index} 
                  className={`
                    flex flex-col w-full max-w-[85%]
                    ${isCurrentUser ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}
                  `}
                >
                  <div 
                    className={`
                      border-2 border-encre-noire p-3 shadow-[2px_2px_0px_0px_#181716]
                      ${isCurrentUser 
                        ? 'theme-bg-vert rounded-[10px_2px_8px_10px]' 
                        : 'bg-[var(--cordel-hover-bg)] text-encre-noire rounded-[2px_10px_10px_8px]'}
                    `}
                  >
                    {/* Message author (only if not current user) */}
                    {!isCurrentUser && (
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-cordel-wood block mb-1">
                        {reply.auteurNom}
                      </span>
                    )}

                    {/* Message text */}
                    <p className="text-xs leading-relaxed font-semibold text-left whitespace-pre-wrap break-words">
                      {reply.message}
                    </p>

                    {/* Message Date */}
                    <span className="text-[7px] font-black opacity-60 block mt-2 text-right">
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Form */}
          <form onSubmit={handleSend} className="flex flex-col gap-2 mt-auto">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={sending}
              required
              placeholder={t('forum.writeReplyPlaceholder')}
              rows="2"
              className="theme-input w-full resize-none disabled:opacity-50 text-xs py-2"
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
        </div>
      )}
    </div>
  );
}
