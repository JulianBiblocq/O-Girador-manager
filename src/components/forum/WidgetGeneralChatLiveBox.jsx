import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelButton from '../CordelButton';
import { getGeneralConversationId } from '../../utils/generalGroupChatUtils';
import { extractFirstYouTubeIdFromText } from './ChatYouTubePreview';

/**
 * Encart prioritaire « 💬 En direct — Tout le groupe » en haut de WidgetForum (Accueil).
 * Affiche les 3 derniers messages ou médias partagés dans la discussion générale
 * et permet d'y accéder en un clic.
 */
export default function WidgetGeneralChatLiveBox({ groupId, onOpenGeneralChat, t }) {
  const [recentMessages, setRecentMessages] = useState([]);
  const generalConvId = getGeneralConversationId(groupId);

  useEffect(() => {
    if (!generalConvId) return;

    const q = query(
      collection(db, 'conversation_messages'),
      where('conversationId', '==', generalConvId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort(
          (a, b) =>
            new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
        );
        setRecentMessages(list.slice(-3));
      },
      () => {
        // Ignorer silencieusement si la collection est en attente d'initialisation
      }
    );

    return () => unsub();
  }, [generalConvId]);

  if (!generalConvId) return null;

  const formatTimeShort = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={() => onOpenGeneralChat && onOpenGeneralChat(generalConvId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onOpenGeneralChat) onOpenGeneralChat(generalConvId);
        }
      }}
      className="w-full p-3 rounded-[6px_10px_6px_8px] border-2 border-encre-noire bg-[#fffaf0] dark:bg-amber-950/30 shadow-[2px_2px_0px_0px_#181716] hover:bg-amber-50/90 transition-all cursor-pointer flex flex-col gap-2.5 text-left"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-xs border border-encre-noire shadow-xs">
            💬
          </span>
          <h4 className="text-xs font-black uppercase tracking-wider text-encre-noire">
            {t?.('widgetForum.liveGeneralTitle') || '💬 En direct — Tout le groupe'}
          </h4>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Canal général actif" />
        </div>

        <CordelButton
          type="button"
          variant="vert"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenGeneralChat) onOpenGeneralChat(generalConvId);
          }}
          className="text-[9.5px] px-2.5 py-1 font-black uppercase tracking-wider"
        >
          {t?.('widgetForum.participateGeneralBtn') || '💬 Participer / Partager une photo ou un lien'}
        </CordelButton>
      </div>

      {recentMessages.length === 0 ? (
        <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 italic py-1">
          {t?.('widgetForum.liveGeneralEmpty') ||
            'Lancez la conversation générale : partagez une info, une photo ou une vidéo YouTube avec tout le groupe !'}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recentMessages.map((msg) => {
            const hasYt = Boolean(extractFirstYouTubeIdFromText(msg.content));
            return (
              <div
                key={msg.id}
                className="flex items-baseline justify-between gap-2 text-[11px] bg-white/75 dark:bg-stone-900/50 px-2.5 py-1.5 rounded border border-encre-noire/15"
              >
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-black text-cordel-wood mr-1.5">
                    {msg.senderName || 'Membre'} :
                  </span>
                  {msg.imageUrl && <span className="mr-1 font-bold text-emerald-800">📷 [Photo]</span>}
                  {hasYt && <span className="mr-1 font-bold text-red-800">🎥 [Vidéo YouTube]</span>}
                  <span className="font-semibold text-encre-noire">{msg.content}</span>
                </div>
                <span className="text-[8.5px] font-bold text-stone-500 shrink-0">
                  {formatTimeShort(msg.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

