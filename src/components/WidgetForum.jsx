import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import CordelCard from './CordelCard';
import { useTranslation } from './LanguageContext';
import { canUserReadForumChannel } from '../utils/permissionUtils';
import { resolveEffectiveUserTags } from '../utils/tagUtils';
import { countThreadUnreadMessages, getEffectiveReadThreads } from '../utils/forumUnreadUtils';
import WidgetZapPanel from './forum/WidgetZapPanel';
import WidgetPorteVoixPanel from './forum/WidgetPorteVoixPanel';

const HOME_COMM_TAB_STORAGE_KEY = 'organizador_home_comm_tab';

/**
 * Conteneur maître duo interactif « 💬 Le Zap / 📢 Porte-Voix » sur la page d'accueil.
 * - Sur PC (`>= 1024px` / `lg:`): 2 colonnes équilibrées (`lg:grid-cols-2`) côte à côte.
 * - Sur Mobile (`< 1024px`): une seule `CordelCard` avec bascule tactile segmentée, swipe et pastilles de non-lus.
 */
export default function WidgetForum({
  groupId,
  user,
  profileData,
  breakGlassActive = false,
  tagsDisponibles = [],
  onOpen
}) {
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadZapCount, setUnreadZapCount] = useState(0);
  const [localReadOverrides, setLocalReadOverrides] = useState({});
  const hasAppliedUnreadPriorityRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const [activeMobileTab, setActiveMobileTab] = useState(() => {
    try {
      return localStorage.getItem(HOME_COMM_TAB_STORAGE_KEY) === 'porte-voix' ? 'porte-voix' : 'zap';
    } catch {
      return 'zap';
    }
  });

  const handleUnreadZapChange = (count) => {
    setUnreadZapCount(count);
    if (!hasAppliedUnreadPriorityRef.current && count > 0) {
      hasAppliedUnreadPriorityRef.current = true;
      setActiveMobileTab('zap');
    }
  };

  const handleSelectMobileTab = (tab) => {
    hasAppliedUnreadPriorityRef.current = true;
    setActiveMobileTab(tab);
    try { localStorage.setItem(HOME_COMM_TAB_STORAGE_KEY, tab); } catch {}
  };

  useEffect(() => {
    const onSingleRead = (e) => {
      const { threadId, timestamp } = e.detail || {};
      if (threadId && timestamp) setLocalReadOverrides((prev) => ({ ...prev, [threadId]: timestamp }));
    };
    const onAllRead = (e) => {
      const { threadIds, timestamp } = e.detail || {};
      if (Array.isArray(threadIds) && timestamp) {
        setLocalReadOverrides((prev) => {
          const next = { ...prev };
          threadIds.forEach((id) => { if (id) next[id] = timestamp; });
          return next;
        });
      }
    };
    window.addEventListener('forum_thread_read', onSingleRead);
    window.addEventListener('forum_all_threads_read', onAllRead);
    return () => {
      window.removeEventListener('forum_thread_read', onSingleRead);
      window.removeEventListener('forum_all_threads_read', onAllRead);
    };
  }, []);

  useEffect(() => {
    if (!groupId) return;
    const qChan = query(collection(db, 'forum_channels'), where('groupId', '==', groupId));
    return onSnapshot(qChan, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setChannels(list);
    }, () => {});
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const qThreads = query(collection(db, 'forum'), where('groupId', '==', groupId), limit(150));
    return onSnapshot(qThreads, (snap) => {
      const fetched = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => new Date(b.derniereModification || b.dateCreation || 0) - new Date(a.derniereModification || a.dateCreation || 0));
      setThreads(fetched);
      setLoading(false);
    }, () => setLoading(false));
  }, [groupId]);

  const activeChannels = useMemo(() => (groupId ? channels : []), [groupId, channels]);
  const activeThreads = useMemo(() => (groupId ? threads : []), [groupId, threads]);
  const isLoading = Boolean(groupId) && loading;

  const effectiveUserTags = useMemo(() => resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles), [profileData?.tags, tagsDisponibles]);

  const allowedChannelIds = useMemo(() => {
    if (breakGlassActive) return null;
    const ids = new Set();
    activeChannels.forEach((ch) => {
      if (canUserReadForumChannel(ch, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive)) ids.add(ch.id);
    });
    return ids;
  }, [activeChannels, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive]);

  const visibleThreads = useMemo(() => {
    if (breakGlassActive || !allowedChannelIds) return activeThreads;
    return activeThreads.filter((th) => {
      if (th.channelId) return allowedChannelIds.has(th.channelId);
      const ch = activeChannels.find((c) => c.name === (th.categorie || 'Général'));
      if (ch) return allowedChannelIds.has(ch.id);
      return (th.categorie || '').toLowerCase() !== 'bureau';
    });
  }, [activeThreads, allowedChannelIds, activeChannels, breakGlassActive]);

  const currentUserId = user?.uid || auth?.currentUser?.uid || profileData?.uid || profileData?.id || '';
  const effectiveReadThreads = useMemo(
    () => ({ ...getEffectiveReadThreads(currentUserId, profileData?.readThreads), ...localReadOverrides }),
    [currentUserId, profileData?.readThreads, localReadOverrides]
  );

  const unreadThreadsCount = useMemo(
    () => visibleThreads.filter((th) => countThreadUnreadMessages(th, currentUserId, effectiveReadThreads[th.id]) > 0).length,
    [visibleThreads, currentUserId, effectiveReadThreads]
  );

  const handleOpenZap = (generalConvId) => { if (onOpen) onOpen({ conversationId: generalConvId, tab: 'groups' }); };

  const handleTouchStart = (e) => {
    const t0 = e.touches?.[0];
    if (t0) touchStartRef.current = { x: t0.clientX, y: t0.clientY };
  };

  const handleTouchEnd = (e) => {
    const t1 = e.changedTouches?.[0];
    if (!t1) return;
    const dx = t1.clientX - touchStartRef.current.x;
    const dy = t1.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      handleSelectMobileTab(dx < 0 ? 'porte-voix' : 'zap');
    }
  };

  return (
    <div className="w-full select-none">
      {/* 1. Vue PC (>= 1024px) : 2 colonnes équilibrées côte à côte */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 w-full items-stretch">
        <CordelCard variant="default" useExtremeBorder={true} className="relative p-4 w-full h-full flex flex-col">
          <WidgetZapPanel groupId={groupId} user={user} profileData={profileData} isMobile={false} onOpenZap={handleOpenZap} onUnreadCountChange={handleUnreadZapChange} t={t} />
        </CordelCard>

        <CordelCard variant="default" useExtremeBorder={true} className="relative p-4 w-full h-full flex flex-col">
          <WidgetPorteVoixPanel threads={visibleThreads} channels={activeChannels} loading={isLoading} isMobile={false} currentUserId={currentUserId} effectiveReadThreads={effectiveReadThreads} unreadThreadsCount={unreadThreadsCount} onOpenForum={() => onOpen && onOpen()} onOpenThread={(id) => onOpen && onOpen(id)} t={t} />
        </CordelCard>
      </div>

      {/* 2. Vue Mobile / Tablette portrait (< 1024px) : carte unifiée avec bascule segmentée et swipe */}
      <div className="lg:hidden w-full">
        <CordelCard variant="default" useExtremeBorder={true} className="relative p-3.5 sm:p-4 w-full">
          <div className="grid grid-cols-2 gap-1.5 p-1 mb-3 rounded-[6px_8px_6px_8px] bg-cordel-bg-light border-2 border-encre-noire">
            <button type="button" onClick={() => handleSelectMobileTab('zap')} className={`py-1.5 px-2 rounded-[4px_6px_4px_5px] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${activeMobileTab === 'zap' ? 'bg-[var(--color-cordel-vert)] text-white border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' : 'text-cordel-master-dark hover:bg-cordel-hover'}`}>
              <span>💬 {t('widgetForum.zapTitle') || 'Le Zap'}</span>
              {unreadZapCount > 0 && <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-red-600 text-white border border-white animate-pulse">{unreadZapCount}</span>}
            </button>

            <button type="button" onClick={() => handleSelectMobileTab('porte-voix')} className={`py-1.5 px-2 rounded-[4px_6px_4px_5px] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${activeMobileTab === 'porte-voix' ? 'bg-cordel-wood text-white border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' : 'text-cordel-master-dark hover:bg-cordel-hover'}`}>
              <span>📢 {t('widgetForum.porteVoixTab') || 'Porte-Voix'}</span>
              {unreadThreadsCount > 0 && <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-red-600 text-white border border-white animate-pulse">{unreadThreadsCount}</span>}
            </button>
          </div>

          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="w-full">
            <div className={activeMobileTab === 'zap' ? 'block' : 'hidden'}>
              <WidgetZapPanel groupId={groupId} user={user} profileData={profileData} isMobile={true} onOpenZap={handleOpenZap} onUnreadCountChange={handleUnreadZapChange} t={t} />
            </div>
            <div className={activeMobileTab === 'porte-voix' ? 'block' : 'hidden'}>
              <WidgetPorteVoixPanel threads={visibleThreads} channels={activeChannels} loading={isLoading} isMobile={true} currentUserId={currentUserId} effectiveReadThreads={effectiveReadThreads} unreadThreadsCount={unreadThreadsCount} onOpenForum={() => onOpen && onOpen()} onOpenThread={(id) => onOpen && onOpen(id)} t={t} />
            </div>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
