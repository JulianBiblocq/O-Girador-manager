import React from 'react';
import CordelButton from '../CordelButton';
import { XiloMegaphone } from '../XiloIcons';
import { countThreadUnreadMessages } from '../../utils/forumUnreadUtils';

/**
 * Sous-composant WidgetPorteVoixPanel (Accueil) :
 * Affiche les 3 ou 4 derniers sujets actifs des salons du Porte-Voix sous forme de cartes condensées
 * (badge du salon, titre en gras + pastille si non lu, dernier intervenant et compteur X rép. →).
 */
export default function WidgetPorteVoixPanel({
  threads = [],
  channels = [],
  loading = false,
  isMobile = false,
  currentUserId = '',
  effectiveReadThreads = {},
  unreadThreadsCount = 0,
  onOpenForum,
  onOpenThread,
  t
}) {
  const recentThreads = threads.slice(0, isMobile ? 3 : 4);
  const displayCount = threads.length;

  const resolveChannelBadgeName = (thread) => {
    if (thread.channelId) {
      const ch = channels.find((c) => c.id === thread.channelId);
      if (ch?.name) return ch.name;
    }
    return thread.channelName || thread.categorie || (t?.('forum.defaultChannelGeneral') || 'Général');
  };

  const resolveLastResponder = (thread) => {
    if (Array.isArray(thread.reponses) && thread.reponses.length > 0) {
      const lastRep = thread.reponses[thread.reponses.length - 1];
      return lastRep?.auteurNom || lastRep?.authorName || thread.auteurNom || '';
    }
    return thread.dernierAuteurNom || thread.auteurNom || '';
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col justify-between gap-2.5 w-full h-full text-left select-none">
      {/* En-tête du panneau Porte-Voix */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-cordel-master-dark/20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isMobile && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-cordel-master-dark text-cordel-bg-light border border-encre-noire flex items-center justify-center rounded-[6px_4px_8px_5px] shrink-0 shadow-[1px_1px_0px_0px_#181716]">
              <XiloMegaphone size={15} className="text-cordel-bg-light" />
            </div>
          )}
          <div className="min-w-0">
            {!isMobile && (
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs uppercase font-black tracking-wider text-cordel-wood truncate">
                  {t?.('widgetForum.title') || 'Le Porte-Voix'}
                </h3>
                <span className="opacity-70 text-[10px] font-bold shrink-0">
                  ({displayCount} {t?.('widgetForum.subjectCountLabel') || 'sujet'}{displayCount > 1 ? 's' : ''})
                </span>
                {unreadThreadsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-red-600 text-white animate-pulse">
                    {unreadThreadsCount}
                  </span>
                )}
              </div>
            )}
            <p className="text-[10px] font-bold text-cordel-master-dark/75 truncate">
              {t?.('widgetForum.subtitle') || 'Dernières discussions & sujets de la communauté'}
            </p>
          </div>
        </div>

        <CordelButton
          type="button"
          variant="default"
          onClick={() => onOpenForum && onOpenForum()}
          className="text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider shrink-0"
        >
          {t?.('widgetForum.openBtn') || 'Ouvrir →'}
        </CordelButton>
      </div>

      {/* Liste des 3 ou 4 derniers sujets actifs des salons */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : recentThreads.length === 0 ? (
        <div
          onClick={() => onOpenForum && onOpenForum()}
          className="flex-1 p-4 border-2 border-dashed border-cordel-master-dark/20 rounded-[6px_10px_6px_8px] bg-cordel-bg-light/50 text-center cursor-pointer hover:bg-cordel-hover transition-colors flex flex-col items-center justify-center"
        >
          <p className="text-xs font-bold text-cordel-master-dark/70">
            {t?.('widgetForum.noThreads') || 'Aucun sujet dans le Porte-Voix pour le moment.'}
          </p>
          <span className="text-[10px] text-cordel-wood font-extrabold uppercase mt-1 inline-block">
            {t?.('widgetForum.startFirst') || '+ Lancer la première discussion'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full flex-1 justify-start">
          {recentThreads.map((thread) => {
            const replyCount = Array.isArray(thread.reponses) ? thread.reponses.length : 0;
            const channelBadge = resolveChannelBadgeName(thread);
            const lastResponder = resolveLastResponder(thread);
            const dateFormatted = formatDateShort(thread.derniereModification || thread.dateCreation);
            const unreadMsgs = countThreadUnreadMessages(thread, currentUserId, effectiveReadThreads?.[thread.id]);
            const isUnread = unreadMsgs > 0;

            return (
              <div
                key={thread.id}
                onClick={() => onOpenThread && onOpenThread(thread.id)}
                className="p-2.5 border-2 border-encre-noire rounded-[6px_10px_6px_8px] bg-cordel-bg-light shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:bg-cordel-hover transition-all flex flex-col gap-1"
                title={thread.titre}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-cordel-wood bg-cordel-wood/10 border border-cordel-wood/25 px-1.5 py-0.5 rounded truncate max-w-[110px] shrink-0">
                      📁 {channelBadge}
                    </span>
                    {thread.isPinned && (
                      <span className="text-[8px] font-black uppercase text-cordel-wood shrink-0">📌</span>
                    )}
                    <h4 className="text-xs font-black text-encre-noire truncate flex-1">
                      {thread.titre}
                    </h4>
                    {isUnread && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shrink-0 animate-pulse"
                        title="Nouveaux messages non lus"
                      />
                    )}
                  </div>

                  <span className="bg-cordel-wood/15 text-cordel-wood text-[8.5px] font-black px-2 py-0.5 rounded-full border border-cordel-wood/30 shrink-0">
                    {replyCount} {t?.('widgetForum.replyCountSuffix') || 'rép.'} →
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[9.5px] font-semibold text-cordel-master-dark/75">
                  <span className="truncate">
                    {lastResponder ? `✍️ ${lastResponder}` : ''}
                  </span>
                  {dateFormatted && <span className="text-[8.5px] font-bold opacity-70 shrink-0">{dateFormatted}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
