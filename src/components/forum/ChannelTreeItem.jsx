import React, { useState, useEffect, useMemo } from 'react';
import { XiloMegaphone } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';
import { countThreadUnreadMessages } from '../../utils/forumUnreadUtils';

/**
 * Élément d'arborescence d'un salon du Porte-Voix (replié par défaut sur mobile < 768px).
 */
export default function ChannelTreeItem(props) {
  const {
    channel, channels, allThreads, activeChannelId, onSelectChannel, onSelectThread,
    selectedThreadId, hasWriteAccess, effectiveReadThreads = {}, currentUserId, channelStatsMap = {}, level = 0
  } = props;
  const { t } = useTranslation();

  const children = useMemo(() => channels.filter((c) => c.parentId === channel.id), [channels, channel.id]);
  const channelThreads = useMemo(
    () => allThreads.filter((th) => (th.channelId ? th.channelId === channel.id : (th.categorie || 'Général') === channel.name)),
    [allThreads, channel.id, channel.name]
  );

  const hasChildren = children.length > 0 || channelThreads.length > 0;
  const isActive = channel.id === activeChannelId;
  const isReadOnly = !hasWriteAccess(channel);
  const unreadMessagesCount = channelStatsMap[channel.id]?.unreadMessages || 0;
  const hasUnread = unreadMessagesCount > 0;
  const hasActiveThread = useMemo(
    () => Boolean(selectedThreadId && channelThreads.some((th) => th.id === selectedThreadId)),
    [selectedThreadId, channelThreads]
  );

  const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false));

  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (hasActiveThread || (isDesktop && (isActive || hasUnread))) setIsOpen(true);
  }, [isActive, hasActiveThread, hasUnread]);

  const channelDisplayName =
    channel.name === 'Général' || channel.name === 'Geral' ? t('forum.defaultChannelGeneral') : channel.name;

  const handleChannelClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && channelThreads.length > 0 && !isOpen) {
      setIsOpen(true);
      return;
    }
    onSelectChannel(channel.id);
  };

  const showSubChannels = isOpen || (level === 0 && children.length > 0);
  const icon = channel.readOnlyForMembers ? (
    <XiloMegaphone size={12} className="text-cordel-wood inline" />
  ) : !channel.readRoles || channel.readRoles.includes('all') || channel.readRoles.length === 0 ? (
    level === 0 ? '📂' : '#'
  ) : '🔒';

  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <div className="flex items-center gap-1 w-full min-w-0">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-[10px] font-black text-cordel-wood hover:text-encre-noire cursor-pointer select-none shrink-0"
            title={isOpen ? 'Réduire' : 'Déplier les sujets'}
          >
            {isOpen ? '▼' : '►'}
          </button>
        ) : <span className="w-3 shrink-0" />}
        <button
          type="button"
          onClick={handleChannelClick}
          className={`flex-1 text-left px-2 py-1.5 text-xs rounded transition-all cursor-pointer border flex justify-between items-center min-w-0 ${
            isActive
              ? 'theme-bg-ocre text-encre-noire border-encre-noire font-black shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : hasUnread
                ? 'bg-transparent text-encre-noire font-black border-transparent hover:bg-white/40'
                : 'bg-transparent text-cordel-master-dark font-semibold border-transparent hover:bg-white/40'
          }`}
          style={{ paddingLeft: `${Math.max(6, level * 10 + 6)}px` }}
        >
          <span className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1 pr-1">
            <span className="shrink-0 font-bold text-cordel-wood opacity-75">{icon}</span>
            <span className={`truncate ${hasUnread ? 'font-black text-encre-noire' : ''}`}>{channelDisplayName}</span>
            {channelThreads.length > 0 && <span className="text-[9px] opacity-60 font-normal shrink-0">({channelThreads.length})</span>}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {hasUnread && (
              <span className="text-[8px] font-black text-white bg-red-600 px-1.5 py-0.2 rounded-full shadow-xs flex items-center justify-center min-w-[16px] animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
            {isReadOnly && <span className="text-[9px] opacity-75" title="Lecture seule">🔒</span>}
          </div>
        </button>
      </div>

      {(showSubChannels || isOpen) && hasChildren && (
        <div className="flex flex-col gap-1 ml-2 border-l border-dashed border-cordel-master-dark/25 pl-1 min-w-0">
          {showSubChannels && children.map((child) => (
            <ChannelTreeItem {...props} key={child.id} channel={child} level={level + 1} />
          ))}
          {isOpen && channelThreads.map((thread) => {
            const isThreadActive = selectedThreadId === thread.id;
            const repliesCount = thread.reponses ? thread.reponses.length - 1 : 0;
            const unreadCount = countThreadUnreadMessages(thread, currentUserId, effectiveReadThreads[thread.id]);
            const isUnread = !isThreadActive && unreadCount > 0;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread && onSelectThread(thread, activeChannelId)}
                className={`w-full text-left py-1 px-2 text-[11px] rounded transition-all cursor-pointer flex items-center justify-between gap-1 min-w-0 border ${
                  isThreadActive
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire font-extrabold shadow-none'
                    : isUnread
                      ? 'bg-transparent text-encre-noire font-black hover:bg-white/60 border-transparent'
                      : 'bg-transparent text-cordel-master-dark font-semibold hover:bg-white/60 border-transparent'
                }`}
                style={{ paddingLeft: `${Math.max(10, (level + 1) * 8 + 6)}px` }}
                title={thread.titre}
              >
                <span className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1 pr-1">
                  <span className="shrink-0 text-[10px] relative">
                    {thread.isPinned ? '📌' : '💬'}
                    {isUnread && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />}
                  </span>
                  <span className={`truncate ${isUnread ? 'font-black' : ''}`}>{thread.titre}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {isUnread && <span className="text-[7.5px] font-black text-white bg-red-600 px-1 py-0.2 rounded-full">{unreadCount}</span>}
                  {repliesCount > 0 && <span className={`text-[8.5px] opacity-60 shrink-0 font-bold ${isUnread ? 'text-red-600 opacity-100 font-black' : ''}`}>{repliesCount}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
