import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, or, doc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import CreateThreadForm from './CreateThreadForm';
import ThreadView from './ThreadView';
import PrivateChatView from './PrivateChatView';
import MoveThreadModal from './MoveThreadModal';
import { useForumModeration } from '../hooks/useForumModeration';
import { useTranslation } from './LanguageContext';
import XiloAvatar from './XiloAvatar';
import { usePresenceContext } from '../context/PresenceContext';

// Memoized ThreadCard component to prevent list items re-rendering during search or active inputs
const ThreadCard = React.memo(({
  thread,
  profileData,
  categoryBadges,
  t,
  getCategoryLabel,
  onClick,
  isModeratorOrAdmin,
  onMoveThread,
  onTogglePin,
  onDeleteThread
}) => {
  const { onlineUserIds, isPresenceEnabled } = usePresenceContext();
  const isAuthorOnline = isPresenceEnabled !== false && thread.auteurId && onlineUserIds.has(thread.auteurId);

  const dateCreationObj = new Date(thread.dateCreation);
  const formattedDate = isNaN(dateCreationObj.getTime())
    ? ''
    : dateCreationObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  
  const repliesCount = thread.reponses ? thread.reponses.length - 1 : 0;
  const badgeVariant = categoryBadges[thread.categorie] || 'default';

  // Target check for user highlight
  const userPlaysInstrument = (profileData?.instrumentsJoues && profileData.instrumentsJoues.includes(thread.targetTag)) ||
                               (profileData?.instrument === thread.targetTag);
  const userHasTag = profileData?.tags && profileData.tags.includes(thread.targetTag);
  const isThreadTargeted = thread.targetTag && (userPlaysInstrument || userHasTag);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <CordelCard 
      variant={thread.isPinned ? "jaune" : isThreadTargeted ? "jaune" : "default"} 
      useExtremeBorder={false} 
      className={`hover:scale-[1.01] transition-all relative pr-20 cursor-pointer select-none ${
        isThreadTargeted ? 'border-cordel-wood border-2 shadow-[2px_2px_0px_0px_#8b2a1a]' : 'bg-cordel-bg'
      }`}
      onClick={() => onClick(thread)}
    >
      <div className="flex flex-col gap-1 items-start">
        {thread.isPinned && (
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] uppercase tracking-wider mb-1 flex items-center gap-1">
            📌 Épinglé
          </span>
        )}
        {isThreadTargeted && (
          <span className="text-[8px] font-black text-cordel-wood uppercase tracking-wider mb-1 block animate-pulse">
            🗣️ {(translate('forum.targeted', "Vous concerne ({tag})")).replace('{tag}', thread.targetTag)}
          </span>
        )}
        {/* Category & Poll Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className={`theme-stamp-badge theme-stamp-badge-${badgeVariant === 'ocre' || badgeVariant === 'vert' ? 'wood' : 'dark'} text-[7px] rotate-0`}>
            {getCategoryLabel(thread.categorie)}
          </span>
          {thread.poll && (
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] rotate-0 bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-600/40">
              📊 Sondage {thread.poll.isClosed ? '(Clôturé)' : ''}
            </span>
          )}
        </div>

        {/* Subject */}
        <h4 className="font-extrabold text-sm text-encre-noire leading-tight pr-4">
          {thread.titre}
        </h4>

        {/* Meta */}
        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-cordel-master-dark/70">
          <span className="flex items-center gap-1">
            <span>{(translate('forum.byAuthor', "Par {author}")).replace('{author}', thread.auteurNom)}</span>
            {isAuthorOnline && (
              <span className="relative flex h-2 w-2" title="Auteur en ligne">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
            )}
          </span>
          <span>•</span>
          <span>{(translate('forum.createdOn', "Le {date}")).replace('{date}', formattedDate)}</span>
        </div>

        {/* Moderator Quick Controls */}
        {isModeratorOrAdmin && (
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-dashed border-cordel-master-dark/15 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(thread.id, thread.isPinned);
              }}
              className="text-[9px] font-bold px-1.5 py-0.5 bg-cordel-bg-light border border-cordel-master-dark/20 rounded hover:bg-white cursor-pointer"
              title={thread.isPinned ? "Désépingler" : "Épingler"}
            >
              📌 {thread.isPinned ? 'Désépingler' : 'Épingler'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveThread(thread);
              }}
              className="text-[9px] font-bold px-1.5 py-0.5 bg-cordel-bg-light border border-cordel-master-dark/20 rounded hover:bg-white cursor-pointer"
              title="Déplacer vers un autre salon"
            >
              🚚 Déplacer
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteThread(thread);
              }}
              className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 cursor-pointer"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Replies Stamp Overlay */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
        <div className="w-8 h-8 bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center font-black text-xs rounded-full shadow-[2px_2px_0px_0px_#181716]">
          {repliesCount}
        </div>
        <span className="text-[7px] font-extrabold uppercase mt-1 tracking-wider opacity-60">
          {repliesCount > 1 ? translate('forum.replies', "réponses") : translate('forum.reply', "réponse")}
        </span>
      </div>
    </CordelCard>
  );
}, (prevProps, nextProps) => {
  return prevProps.thread.id === nextProps.thread.id &&
         prevProps.thread.isPinned === nextProps.thread.isPinned &&
         prevProps.thread.derniereModification === nextProps.thread.derniereModification &&
         (prevProps.thread.reponses ? prevProps.thread.reponses.length : 0) === (nextProps.thread.reponses ? nextProps.thread.reponses.length : 0) &&
         prevProps.thread.targetTag === nextProps.thread.targetTag &&
         prevProps.thread.titre === nextProps.thread.titre &&
         prevProps.thread.categorie === nextProps.thread.categorie &&
         prevProps.thread.auteurNom === nextProps.thread.auteurNom &&
         prevProps.profileData === nextProps.profileData &&
         prevProps.isModeratorOrAdmin === nextProps.isModeratorOrAdmin &&
         prevProps.getCategoryLabel === nextProps.getCategoryLabel &&
         prevProps.onClick === nextProps.onClick;
});

function ChannelTreeItem({ 
  channel, 
  channels, 
  allThreads = [],
  activeChannelId, 
  onSelectChannel, 
  onSelectThread,
  selectedThreadId,
  hasWriteAccess, 
  level = 0 
}) {
  const children = channels.filter(c => c.parentId === channel.id);
  const channelThreads = useMemo(() => {
    return allThreads.filter(t => t.channelId === channel.id || (!t.channelId && channel.name === (t.categorie || 'Général')));
  }, [allThreads, channel.id, channel.name]);

  const hasChildren = children.length > 0 || channelThreads.length > 0;
  const isActive = channel.id === activeChannelId;
  const isReadOnly = !hasWriteAccess(channel);

  const hasActiveThread = useMemo(() => {
    return selectedThreadId && channelThreads.some(t => t.id === selectedThreadId);
  }, [selectedThreadId, channelThreads]);

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isActive || hasActiveThread) {
      setIsOpen(true);
    }
  }, [isActive, hasActiveThread]);

  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <div className="flex items-center gap-1 w-full min-w-0">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-[10px] font-black text-cordel-wood hover:text-encre-noire cursor-pointer select-none shrink-0"
            title={isOpen ? "Réduire" : "Déplier les salons et sujets"}
          >
            {isOpen ? '▼' : '►'}
          </button>
        ) : (
          <span className="w-3 shrink-0"></span>
        )}

        <button
          type="button"
          onClick={() => onSelectChannel(channel.id)}
          className={`flex-1 text-left px-2 py-1.5 text-xs font-black rounded transition-all cursor-pointer border flex justify-between items-center min-w-0 ${
            isActive
              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-transparent text-encre-noire border-transparent hover:bg-white/40'
          }`}
          style={{ paddingLeft: `${Math.max(6, level * 10 + 6)}px` }}
        >
          <span className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1 pr-1">
            <span className="shrink-0">{level === 0 ? '📂' : level === 1 ? '📁' : '📄'}</span>
            <span className="truncate">{channel.name}</span>
            {channelThreads.length > 0 && (
              <span className="text-[9px] opacity-60 font-normal shrink-0">({channelThreads.length})</span>
            )}
          </span>
          {isReadOnly && <span className="text-[9px] opacity-75 shrink-0 ml-1">🔒</span>}
        </button>
      </div>

      {isOpen && hasChildren && (
        <div className="flex flex-col gap-1 ml-2 border-l border-dashed border-cordel-master-dark/25 pl-1 min-w-0">
          {/* Subchannels */}
          {children.map(child => (
            <ChannelTreeItem
              key={child.id}
              channel={child}
              channels={channels}
              allThreads={allThreads}
              activeChannelId={activeChannelId}
              onSelectChannel={onSelectChannel}
              onSelectThread={onSelectThread}
              selectedThreadId={selectedThreadId}
              hasWriteAccess={hasWriteAccess}
              level={level + 1}
            />
          ))}

          {/* Threads inside this channel */}
          {channelThreads.map(thread => {
            const isThreadActive = selectedThreadId === thread.id;
            const repliesCount = thread.reponses ? thread.reponses.length - 1 : 0;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  onSelectChannel(channel.id);
                  if (onSelectThread) onSelectThread(thread);
                }}
                className={`w-full text-left py-1 px-2 text-[11px] font-semibold rounded transition-all cursor-pointer flex items-center justify-between gap-1 min-w-0 border ${
                  isThreadActive
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire font-extrabold shadow-none'
                    : 'bg-transparent text-cordel-master-dark hover:bg-white/60 border-transparent'
                }`}
                style={{ paddingLeft: `${Math.max(10, (level + 1) * 8 + 6)}px` }}
                title={thread.titre}
              >
                <span className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1 pr-1">
                  <span className="shrink-0 text-[10px]">{thread.isPinned ? '📌' : '💬'}</span>
                  <span className="truncate">{thread.titre}</span>
                </span>
                {repliesCount > 0 && (
                  <span className="text-[8.5px] opacity-60 shrink-0 font-bold">
                    {repliesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Forum({ user, profileData, onBack, activePrivateChatUserId, onClearActivePrivateChat, onOpenStudioForum }) {
  const { t } = useTranslation();
  const { actionLoading, moveThread, togglePinThread, deleteThread } = useForumModeration(profileData?.groupId);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const getCategoryLabel = useCallback((cat) => {
    return t(`forum.${cat}`) || cat;
  }, [t]);

  const [threads, setThreads] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [movingThreadModal, setMovingThreadModal] = useState(null);
  
  // Member channel & folder creation state
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelParentId, setNewChannelParentId] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || !profileData?.groupId) return;

    setSavingChannel(true);
    try {
      const channelData = {
        groupId: profileData.groupId,
        name: newChannelName.trim(),
        parentId: newChannelParentId || null,
        readRoles: ['all'],
        writeRoles: ['all'],
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'forum_channels'), channelData);
      setActiveChannelId(docRef.id);
      setIsCreatingChannel(false);
      setNewChannelName('');
      setNewChannelParentId('');
    } catch (error) {
      console.error("Forum - Erreur création salon:", error);
    } finally {
      setSavingChannel(false);
    }
  };
  
  const [activeTab, setActiveTab] = useState('discussions'); // 'discussions' or 'inbox'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [activeChatUserId, setActiveChatUserId] = useState(null);

  const isModeratorOrAdmin = profileData?.role === 'mestre' || 
                             profileData?.role === 'super-admin' || 
                             profileData?.role === 'bureau' || 
                             profileData?.role === 'ca' || 
                             profileData?.isSystemAdmin === true || 
                             (profileData?.tags && (
                               profileData.tags.includes('Modérateur') || 
                               profileData.tags.includes('Modérateur Forum') ||
                               profileData.tags.includes('Gestionnaire Porte-voix') ||
                               profileData.tags.includes('Porte-voix')
                             ));

  // Sync users of the association for name/avatar lookup
  useEffect(() => {
    if (!profileData?.groupId) return;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', profileData.groupId));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsersMap(map);
    });
    return () => unsub();
  }, [profileData?.groupId]);

  // Sync private messages in real-time
  useEffect(() => {
    if (!user?.uid) return;
    const messagesRef = collection(db, 'private_messages');
    const q = query(
      messagesRef,
      or(where('senderId', '==', user.uid), where('recipientId', '==', user.uid))
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setPrivateMessages(fetched);
    }, (error) => {
      console.error("Forum - Error syncing private messages:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Automatically open private chat if redirected from Trombinoscope
  useEffect(() => {
    if (activePrivateChatUserId) {
      setActiveChatUserId(activePrivateChatUserId);
      setActiveTab('inbox');
      onClearActivePrivateChat();
    }
  }, [activePrivateChatUserId, onClearActivePrivateChat]);

  // Real-time synchronization of channels (salons)
  useEffect(() => {
    if (!profileData?.groupId) {
      setChannels([]);
      return;
    }

    const channelsRef = collection(db, 'forum_channels');
    const userRole = profileData?.role || 'membre';
    const userTags = profileData?.tags || [];
    const isAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

    // Load all channels for this group
    const q = query(channelsRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, async (snap) => {
      const fetched = [];
      snap.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      if (fetched.length === 0) {
        const defaults = [
          { id: `${profileData.groupId}_general`, name: "Général", readRoles: ["all"], writeRoles: ["all"], isTransparent: true },
          { id: `${profileData.groupId}_ca`, name: "CA", readRoles: ["ca"], writeRoles: ["ca"], isTransparent: false },
          { id: `${profileData.groupId}_bureau`, name: "Bureau", readRoles: ["bureau"], writeRoles: ["bureau"], isTransparent: false }
        ];
        for (const ch of defaults) {
          try {
            await setDoc(doc(db, 'forum_channels', ch.id), {
              groupId: profileData.groupId,
              name: ch.name,
              readRoles: ch.readRoles,
              writeRoles: ch.writeRoles,
              isTransparent: ch.isTransparent
            }, { merge: true });
          } catch (e) {
            console.error(`Channel seeding failed for: ${ch.name}`, e);
          }
        }
      } else {
        // Filter client-side
        const allowedChannels = fetched.filter(ch => {
          if (isAdmin) return true;
          
          // Read roles
          const read = ch.readRoles || ['all'];
          if (read.includes('all')) return true;
          if (read.includes(userRole)) return true;
          if (userTags.some(tag => read.includes(tag))) return true;

          // Backwards compatibility
          if (ch.allowedRoles) {
            if (ch.allowedRoles.includes('all') || ch.allowedRoles.includes(userRole)) return true;
          }
          if (ch.isTransparent === true) return true;
          
          return false;
        });

        const order = ["Général", "CA", "Bureau"];
        const sorted = allowedChannels.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          const idxA = order.indexOf(a.name);
          const idxB = order.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        setChannels(sorted);

        if (sorted.length > 0) {
          setActiveChannelId(prev => {
            if (prev && sorted.some(c => c.id === prev)) return prev;
            return sorted[0].id;
          });
        }
      }
    }, (error) => {
      console.error("Forum - Error syncing channels:", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, profileData?.role, profileData?.tags, profileData?.isSystemAdmin]);

  // Sync all threads for the group
  useEffect(() => {
    if (!profileData?.groupId) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const forumRef = collection(db, 'forum');
    const q = query(
      forumRef, 
      where('groupId', '==', profileData.groupId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedThreads = [];
      querySnapshot.forEach((doc) => {
        fetchedThreads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort pinned threads first, then by last modification
      const sorted = fetchedThreads.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.derniereModification || b.dateCreation) - new Date(a.derniereModification || a.dateCreation);
      });

      setThreads(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Forum - Erreur onSnapshot threads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  const activeChannelThreads = useMemo(() => {
    if (!activeChannelId) return [];
    const activeChan = channels.find(c => c.id === activeChannelId);
    return threads.filter(t => {
      if (t.channelId) return t.channelId === activeChannelId;
      if (activeChan && activeChan.name === (t.categorie || 'Général')) return true;
      return false;
    });
  }, [threads, activeChannelId, channels]);

  const categoryBadges = useMemo(() => ({
    Général: 'ocre',
    Costumes: 'vert',
    Covoiturage: 'bleu',
    Autre: 'kraft'
  }), []);

  // Group messages by conversational partner using useMemo
  const conversations = useMemo(() => {
    const conversationsMap = {};
    privateMessages.forEach(msg => {
      const otherId = msg.senderId === user.uid ? msg.recipientId : msg.senderId;
      if (!conversationsMap[otherId]) {
        conversationsMap[otherId] = {
          otherId,
          messages: [],
          unreadCount: 0,
          lastMessage: null
        };
      }
      conversationsMap[otherId].messages.push(msg);
    });

    Object.values(conversationsMap).forEach(conv => {
      conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      conv.lastMessage = conv.messages[conv.messages.length - 1];
      conv.unreadCount = conv.messages.filter(m => m.recipientId === user.uid && !m.read).length;
    });

    return Object.values(conversationsMap).sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp) : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp) : 0;
      return timeB - timeA;
    });
  }, [privateMessages, user?.uid]);

  const unreadInboxCount = useMemo(() => {
    return privateMessages.filter(m => m.recipientId === user.uid && !m.read).length;
  }, [privateMessages, user?.uid]);

  // Find the currently selected thread in the sync threads state to get real-time messages
  const activeThread = selectedThread
    ? threads.find(t => t.id === selectedThread.id) || selectedThread
    : null;

  const handleSelectThread = useCallback((thread) => {
    setSelectedThread(thread);
  }, []);

  const hasWriteAccess = useCallback((channel) => {
    if (!channel) return true;
    if (profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin) return true;

    const userRole = profileData?.role || 'membre';
    const userTags = profileData?.tags || [];

    const write = channel.writeRoles || ['all'];
    if (write.includes('all')) return true;
    if (write.includes(userRole)) return true;
    if (userTags.some(tag => write.includes(tag))) return true;

    // Rétrocompatibilité
    if (channel.allowedRoles) {
      return channel.allowedRoles.includes('all') || channel.allowedRoles.includes(userRole);
    }
    return false;
  }, [profileData?.role, profileData?.tags, profileData?.isSystemAdmin]);

  const activeChannel = useMemo(() => {
    return channels.find(c => c.id === activeChannelId);
  }, [channels, activeChannelId]);

  const handleDeleteThreadPrompt = async (thread) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la discussion "${thread.titre}" ?`)) {
      await deleteThread(thread.id);
    }
  };

  // If a private chat is active, display the full-page chat view
  if (activeChatUserId) {
    return (
      <PrivateChatView
        user={user}
        profileData={profileData}
        recipientId={activeChatUserId}
        usersMap={usersMap}
        onBack={() => setActiveChatUserId(null)}
      />
    );
  }

  // If a thread is selected, display the full ThreadView page
  if (activeThread) {
    return (
      <ThreadView 
        threadId={activeThread.id} 
        user={user} 
        profileData={profileData} 
        channels={channels}
        allThreads={threads}
        allUsers={Object.values(usersMap)}
        onClose={() => setSelectedThread(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          📢 {translate('forum.title', "Le Porte-voix")}
        </span>
        {isModeratorOrAdmin && onOpenStudioForum ? (
          <CordelButton
            variant="ocre"
            onClick={onOpenStudioForum}
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shrink-0"
            title="Accéder au Studio de Gestion du Porte-voix"
          >
            🛠️ Studio Porte-voix
          </CordelButton>
        ) : (
          <div className="w-12"></div>
        )}
      </div>

      {/* Main Tab Navigation (Discussions vs Inbox) */}
      <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('discussions');
            setIsAdding(false);
          }}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
            activeTab === 'discussions'
              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          💬 {translate('forum.discussionsTab', "Discussions")}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('inbox');
            setIsAdding(false);
          }}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer relative ${
            activeTab === 'inbox'
              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          ✉️ {translate('forum.inboxTab', "MP / Boîte de réception")}
          {unreadInboxCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[7px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unreadInboxCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'inbox' ? (
        /* Private Messages Inbox Listing */
        <div className="flex flex-col gap-4">
          <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase px-1 select-none">
            {translate('forum.privateConversationsTitle', "Mes Discussions Privées")}
          </h2>

          {conversations.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none">
              <p className="text-xs opacity-75 font-semibold">{translate('forum.noPrivateConversations', "Aucune discussion privée pour le moment. Allez dans le Trombinoscope pour contacter un membre !")}</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3">
              {conversations.map((conv) => {
                const partner = usersMap[conv.otherId] || { id: conv.otherId };
                const partnerFullName = `${partner.prenom || ''} ${partner.nom || ''}`.trim() || partner.email || "Membre";
                const dateObj = new Date(conv.lastMessage?.timestamp);
                const formattedTime = isNaN(dateObj.getTime())
                  ? ''
                  : dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const isLastMessageFromMe = conv.lastMessage?.senderId === user.uid;
                const isUnread = conv.unreadCount > 0;

                return (
                  <CordelCard 
                    key={conv.otherId} 
                    variant="default" 
                    useExtremeBorder={false} 
                    className="hover:scale-[1.01] transition-all relative pr-20 cursor-pointer flex items-center gap-3 bg-cordel-bg"
                    onClick={() => setActiveChatUserId(conv.otherId)}
                  >
                    <XiloAvatar src={partner.photoURL} name={partnerFullName} size={40} />
                    <div className="flex flex-col gap-0.5 items-start text-left flex-grow min-w-0 pr-6 select-none">
                      <span className="font-extrabold text-xs text-encre-noire">
                        {partnerFullName}
                      </span>
                      <p className={`text-[11px] truncate max-w-full text-cordel-master-dark ${
                        isUnread ? 'font-black text-encre-noire' : 'font-semibold opacity-75'
                      }`}>
                        {isLastMessageFromMe ? `${translate('common.you', "Vous")} : ` : ""}{conv.lastMessage?.content}
                      </p>
                      <span className="text-[8px] font-black uppercase tracking-wider opacity-50 mt-0.5">
                        {formattedTime}
                      </span>
                    </div>

                    {/* Unread badge overlay */}
                    {isUnread && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center select-none">
                        <span className="w-5 h-5 bg-red-600 text-white flex items-center justify-center font-black text-[9px] rounded-full shadow-[1.5px_1.5px_0px_0px_#181716]">
                          {conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </CordelCard>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Discussions Tab with Channels sidebar/dropdown */
        <div className="flex flex-col md:flex-row gap-4">
          {/* Channels Sidebar / Dropdown */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-2 select-none">
            {/* Mobile Channels Toggle Button */}
            <div className="block md:hidden mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-cordel-bg shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                >
                  📁 Salons
                </button>
                <div className="flex-1 px-3 py-2 border-2 border-dashed border-cordel-master-dark/15 rounded bg-cordel-bg-light/40 font-bold text-xs truncate">
                  # {activeChannel ? activeChannel.name : ''}
                </div>
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col gap-2 p-3 bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_6px_10px_7px] shadow-[2.5px_2.5px_0px_0px_#181716] min-w-0">
              <div className="flex justify-between items-center mb-2 border-b border-dashed border-cordel-master-dark/20 pb-1 min-w-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-cordel-wood truncate">
                  📂 {translate('forum.channelsHeader', "Salons & Dossiers")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(true)}
                  className="text-[9px] font-black uppercase text-cordel-wood hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
                  title="Créer un salon ou un sous-dossier"
                >
                  ➕ {translate('forum.addChannelShort', "Salon")}
                </button>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                {channels.filter(c => !c.parentId).map((ch) => (
                  <ChannelTreeItem
                    key={ch.id}
                    channel={ch}
                    channels={channels}
                    allThreads={threads}
                    activeChannelId={activeChannelId}
                    onSelectChannel={setActiveChannelId}
                    onSelectThread={handleSelectThread}
                    selectedThreadId={selectedThread?.id}
                    hasWriteAccess={hasWriteAccess}
                    level={0}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Discussions Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-12 select-none">
                <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ {t('common.loading')}</span>
              </div>
            ) : isAdding ? (
              /* Create thread form panel */
              <CreateThreadForm 
                groupId={profileData.groupId} 
                channelId={activeChannelId}
                user={user} 
                profileData={profileData} 
                onClose={() => setIsAdding(false)} 
              />
            ) : (
              /* Thread Listing */
              <div className="flex flex-col gap-4">
                {/* Breadcrumbs Path */}
                {(() => {
                  const path = [];
                  let current = channels.find(c => c.id === activeChannelId);
                  while (current) {
                    path.unshift(current);
                    if (!current.parentId) break;
                    current = channels.find(c => c.id === current.parentId);
                  }
                  return (
                    <div className="flex items-center gap-1.5 text-xs font-black text-cordel-wood uppercase tracking-wider select-none flex-wrap bg-white/40 p-2 rounded border border-dashed border-cordel-master-dark/15">
                      <span className="text-encre-noire">📢 Porte-voix</span>
                      {path.map((item, idx) => (
                        <React.Fragment key={item.id}>
                          <span className="opacity-40 text-encre-noire">/</span>
                          <button
                            type="button"
                            onClick={() => setActiveChannelId(item.id)}
                            className={`hover:underline ${idx === path.length - 1 ? 'text-encre-noire font-extrabold' : 'text-cordel-wood'}`}
                          >
                            {item.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center px-1 select-none flex-wrap gap-2">
                  <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
                    {activeChannel ? `📂 ${activeChannel.name}` : t('forum.threadsList')}
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <CordelButton 
                      variant="default" 
                      onClick={() => setIsCreatingChannel(true)} 
                      className="text-xs px-2.5 py-1.5 font-bold uppercase tracking-wider"
                      title="Créer une nouvelle catégorie ou un salon"
                    >
                      + {translate('forum.newChannelBtn', "Nouveau Salon / Dossier")}
                    </CordelButton>

                    {!hasWriteAccess(activeChannel) ? (
                      <span className="text-[10px] font-black text-cordel-wood border-2 border-dashed border-cordel-wood/30 p-2 rounded bg-cordel-bg-light select-none">
                        🔒 {translate('forum.readOnly', "Lecture seule")}
                      </span>
                    ) : (
                      <CordelButton 
                        variant="ocre" 
                        useExtremeBorder={true}
                        onClick={() => setIsAdding(true)} 
                        className="text-xs px-3 py-1.5 font-bold uppercase tracking-widest"
                      >
                        + {t('forum.newSubject')}
                      </CordelButton>
                    )}
                  </div>
                </div>

                {activeChannelThreads.length === 0 ? (
                  <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none">
                    <p className="text-xs opacity-75 font-semibold">{translate('forum.noThreads', "Aucune discussion lancée dans ce salon. Soyez le premier !")}</p>
                  </CordelCard>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeChannelThreads.map((thread) => (
                      <ThreadCard
                        key={thread.id}
                        thread={thread}
                        profileData={profileData}
                        categoryBadges={categoryBadges}
                        t={t}
                        getCategoryLabel={getCategoryLabel}
                        onClick={handleSelectThread}
                        isModeratorOrAdmin={isModeratorOrAdmin}
                        onMoveThread={setMovingThreadModal}
                        onTogglePin={(id, currentStatus) => togglePinThread(id, currentStatus)}
                        onDeleteThread={handleDeleteThreadPrompt}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Drawer Overlay */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
              ></div>
              {/* Drawer content */}
              <div className="fixed inset-y-0 left-0 w-72 max-w-full bg-[#fdfaf2] dark:bg-[#1f1b18] border-r-2 border-encre-noire p-4 flex flex-col gap-4 animate-slide-in shadow-2xl">
                <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-cordel-wood">
                    📁 Salons & Dossiers
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsCreatingChannel(true);
                      }}
                      className="text-[9px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
                    >
                      ➕ Nouveau
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-xs font-bold text-cordel-master-dark hover:text-encre-noire p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto">
                  {channels.filter(c => !c.parentId).map((ch) => (
                    <ChannelTreeItem
                      key={ch.id}
                      channel={ch}
                      channels={channels}
                      allThreads={threads}
                      activeChannelId={activeChannelId}
                      onSelectChannel={(id) => {
                        setActiveChannelId(id);
                        setIsDrawerOpen(false);
                      }}
                      onSelectThread={(t) => {
                        handleSelectThread(t);
                        setIsDrawerOpen(false);
                      }}
                      selectedThreadId={selectedThread?.id}
                      hasWriteAccess={hasWriteAccess}
                      level={0}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move Thread Modal */}
      {movingThreadModal && (
        <MoveThreadModal
          thread={movingThreadModal}
          channels={channels}
          isSubmitting={actionLoading}
          onClose={() => setMovingThreadModal(null)}
          onConfirm={async (newChannelId, newCategory) => {
            const ok = await moveThread(movingThreadModal.id, newChannelId, newCategory);
            if (ok) setMovingThreadModal(null);
          }}
        />
      )}

      {/* Modal de création de salon / sous-dossier par les membres */}
      {isCreatingChannel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md bg-cordel-bg p-6 relative select-none">
            <h3 className="font-extrabold text-sm text-encre-noire uppercase tracking-wider mb-4 border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2">
              📂 {translate('forum.createChannelTitle', "Créer un Salon ou Sous-dossier")}
            </h3>

            <form onSubmit={handleCreateChannelSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-cordel-master-dark mb-1">
                  {translate('forum.channelNameLabel', "Nom du salon ou du dossier")} *
                </label>
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="ex: Toadas 2026, Percussions, Commission Fêtes..."
                  className="w-full p-2.5 text-xs font-bold bg-white border-2 border-encre-noire rounded focus:outline-none focus:ring-2 focus:ring-cordel-wood"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-cordel-master-dark mb-1">
                  {translate('forum.channelParentLabel', "Emplacement (Parent)")}
                </label>
                <select
                  value={newChannelParentId}
                  onChange={(e) => setNewChannelParentId(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold bg-white border-2 border-encre-noire rounded focus:outline-none focus:ring-2 focus:ring-cordel-wood cursor-pointer"
                >
                  <option value="">📁 Racine (Nouvelle catégorie principale)</option>
                  {channels.filter(c => !c.parentId).map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      📂 Sous-dossier de : {ch.name}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] italic opacity-60 mt-1">
                  {newChannelParentId 
                    ? "Le salon apparaîtra comme un sous-dossier dans la catégorie choisie." 
                    : "Le salon sera créé comme une nouvelle rubrique principale."}
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20">
                <CordelButton
                  type="button"
                  variant="default"
                  onClick={() => setIsCreatingChannel(false)}
                  className="px-3 py-1.5 text-xs font-bold"
                >
                  {t('common.cancel')}
                </CordelButton>
                <CordelButton
                  type="submit"
                  variant="ocre"
                  disabled={savingChannel || !newChannelName.trim()}
                  className="px-4 py-1.5 text-xs font-black uppercase"
                >
                  {savingChannel ? "Création..." : "Créer le salon"}
                </CordelButton>
              </div>
            </form>
          </CordelCard>
        </div>
      )}
    </div>
  );
}
