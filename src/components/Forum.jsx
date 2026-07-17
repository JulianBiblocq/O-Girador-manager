import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import CreateThreadForm from './CreateThreadForm';
import ThreadView from './ThreadView';
import PrivateChatView from './PrivateChatView';
import { useTranslation } from './LanguageContext';
import XiloAvatar from './XiloAvatar';

export default function Forum({ user, profileData, onBack, activePrivateChatUserId, onClearActivePrivateChat }) {
  const { t } = useTranslation();

  const getCategoryLabel = (cat) => {
    return t(`forum.${cat}`) || cat;
  };

  const [threads, setThreads] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  
  const [activeTab, setActiveTab] = useState('discussions'); // 'discussions' or 'inbox'
  const [privateMessages, setPrivateMessages] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [activeChatUserId, setActiveChatUserId] = useState(null);

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
    const isAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;

    // Admin query sees all channels. Member query is filtered by allowedRoles and isTransparent
    const q = isAdmin
      ? query(channelsRef, where('groupId', '==', profileData.groupId))
      : query(
          channelsRef,
          where('groupId', '==', profileData.groupId),
          or(
            where('allowedRoles', 'array-contains', userRole),
            where('allowedRoles', 'array-contains', 'all'),
            where('isTransparent', '==', true)
          )
        );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const fetched = [];
      snap.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      if (fetched.length === 0) {
        // Seed default channels if empty
        const defaults = [
          { id: `${profileData.groupId}_general`, name: "Général", allowedRoles: ["all"], isTransparent: true },
          { id: `${profileData.groupId}_ca`, name: "CA", allowedRoles: ["ca"], isTransparent: false },
          { id: `${profileData.groupId}_bureau`, name: "Bureau", allowedRoles: ["bureau"], isTransparent: false }
        ];
        for (const ch of defaults) {
          try {
            await setDoc(doc(db, 'forum_channels', ch.id), {
              groupId: profileData.groupId,
              name: ch.name,
              allowedRoles: ch.allowedRoles,
              isTransparent: ch.isTransparent
            }, { merge: true });
          } catch (e) {
            console.log(`Channel seeding skipped or blocked: ${ch.name}`, e.message);
          }
        }
      } else {
        // Sort channels: Général, then CA, then Bureau, then others
        const order = ["Général", "CA", "Bureau"];
        const sorted = fetched.sort((a, b) => {
          const idxA = order.indexOf(a.name);
          const idxB = order.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        setChannels(sorted);

        // Auto-select first channel if none is selected
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
  }, [profileData?.groupId, profileData?.role, profileData?.isSystemAdmin]);

  // Migration of old threads without channelId (Admin-only check on load)
  useEffect(() => {
    const isAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin;
    if (!isAdmin || !profileData?.groupId) return;

    const forumRef = collection(db, 'forum');
    const q = query(forumRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, (snap) => {
      snap.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (!data.channelId) {
          // Only attempt migration if the user has edit rights (is the author or is a system admin)
          const canMigrate = data.authorId === user?.uid || profileData?.isSystemAdmin;
          if (!canMigrate) return;

          try {
            await updateDoc(doc(db, 'forum', docSnap.id), {
              channelId: `${profileData.groupId}_general`
            });
            console.log(`Migrated thread ${docSnap.id} to channel ${profileData.groupId}_general`);
          } catch (err) {
            console.warn("Migration error (insufficient permissions):", err);
          }
        }
      });
    }, (err) => {
      console.warn("Migration listener failed:", err);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, profileData?.role, profileData?.isSystemAdmin, user?.uid]);

  // Sync threads for the active channel
  useEffect(() => {
    if (!profileData?.groupId || !activeChannelId) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const forumRef = collection(db, 'forum');
    const q = query(
      forumRef, 
      where('groupId', '==', profileData.groupId),
      where('channelId', '==', activeChannelId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedThreads = [];
      querySnapshot.forEach((doc) => {
        fetchedThreads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort locally: latest modification first
      const sorted = fetchedThreads.sort((a, b) => new Date(b.derniereModification) - new Date(a.derniereModification));
      setThreads(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Forum - Erreur onSnapshot threads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, activeChannelId]);

  const categoryBadges = {
    Général: 'ocre',
    Costumes: 'vert',
    Covoiturage: 'bleu',
    Autre: 'kraft'
  };

  // Group messages by conversational partner
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

  const conversations = Object.values(conversationsMap).sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp) : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp) : 0;
    return timeB - timeA;
  });

  const unreadInboxCount = privateMessages.filter(m => m.recipientId === user.uid && !m.read).length;

  // Find the currently selected thread in the sync threads state to get real-time messages
  const activeThread = selectedThread
    ? threads.find(t => t.id === selectedThread.id) || selectedThread
    : null;

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const hasWriteAccess = (channel) => {
    if (!channel) return false;
    if (profileData?.isSystemAdmin || profileData?.role === 'mestre' || profileData?.role === 'super-admin') return true;
    const roles = channel.allowedRoles || [];
    return roles.includes('all') || roles.includes(profileData?.role);
  };

  if (activeChatUserId) {
    const otherUser = usersMap[activeChatUserId] || { id: activeChatUserId };
    return (
      <PrivateChatView 
        user={user}
        otherUser={otherUser}
        profileData={profileData}
        onClose={() => setActiveChatUserId(null)}
      />
    );
  }

  if (activeThread) {
    return (
      <ThreadView 
        threadId={activeThread.id} 
        user={user} 
        profileData={profileData} 
        isReadOnly={!hasWriteAccess(activeChannel)}
        onClose={() => setSelectedThread(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          {t('dashboard.forum')}
        </span>
        <div className="w-12"></div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none">
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
          💬 {t('forum.discussionsTab') || "Discussions"}
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
          ✉️ {t('forum.inboxTab') || "MP / Boîte de réception"}
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
          <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase px-1">
            {t('forum.privateConversationsTitle') || "Mes Discussions Privées"}
          </h2>

          {conversations.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs opacity-75 font-semibold">{t('forum.noPrivateConversations') || "Aucune discussion privée pour le moment. Allez dans le Trombinoscope pour contacter un membre !"}</p>
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
                    <div className="flex flex-col gap-0.5 items-start text-left flex-grow min-w-0 pr-6">
                      <span className="font-extrabold text-xs text-encre-noire">
                        {partnerFullName}
                      </span>
                      <p className={`text-[11px] truncate max-w-full text-cordel-master-dark ${
                        isUnread ? 'font-black text-encre-noire' : 'font-semibold opacity-75'
                      }`}>
                        {isLastMessageFromMe ? `${t('common.you') || "Vous"} : ` : ""}{conv.lastMessage?.content}
                      </p>
                      <span className="text-[8px] font-black uppercase tracking-wider opacity-50 mt-0.5">
                        {formattedTime}
                      </span>
                    </div>

                    {/* Unread badge overlay */}
                    {isUnread && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
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
          <div className="w-full md:w-60 shrink-0 flex flex-col gap-2">
            {/* Mobile Dropdown */}
            <div className="block md:hidden">
              <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark block mb-1">
                {t('forum.selectChannel') || "Salon :"}
              </label>
              <select
                value={activeChannelId || ''}
                onChange={(e) => setActiveChannelId(e.target.value)}
                className="theme-input w-full font-bold text-xs py-2 bg-cordel-bg-light"
              >
                {channels.map((ch) => {
                  const isReadOnly = !hasWriteAccess(ch);
                  return (
                    <option key={ch.id} value={ch.id}>
                      # {ch.name} {isReadOnly ? "🔒 (Lecture seule)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col gap-2 p-3 bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_6px_10px_7px] shadow-[2.5px_2.5px_0px_0px_#181716]">
              <h3 className="text-xs font-black uppercase tracking-widest text-cordel-wood mb-2 border-b border-dashed border-cordel-master-dark/20 pb-1">
                📁 Salons
              </h3>
              <div className="flex flex-col gap-1.5">
                {channels.map((ch) => {
                  const isActive = ch.id === activeChannelId;
                  const isReadOnly = !hasWriteAccess(ch);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-black rounded transition-all cursor-pointer border flex justify-between items-center ${
                        isActive
                          ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                          : 'bg-transparent text-encre-noire border-transparent hover:bg-cordel-hover-bg'
                      }`}
                    >
                      <span># {ch.name}</span>
                      {isReadOnly && (
                        <span className="text-[9px] opacity-75" title="Lecture seule">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Discussions Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
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
                <div className="flex justify-between items-center px-1">
                  <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
                    {activeChannel ? `# ${activeChannel.name}` : t('forum.threadsList')}
                  </h2>
                  
                  {!hasWriteAccess(activeChannel) ? (
                    <span className="text-[10px] font-black text-cordel-wood border-2 border-dashed border-cordel-wood/30 p-2 rounded bg-cordel-bg-light select-none">
                      🔒 Lecture seule
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

                {threads.length === 0 ? (
                  <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
                    <p className="text-xs opacity-75 font-semibold">{t('forum.noThreads') || "Aucune discussion lancée dans ce salon. Soyez le premier !"}</p>
                  </CordelCard>
                ) : (
                  <div className="flex flex-col gap-3">
                    {threads.map((thread) => {
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

                      return (
                        <CordelCard 
                          key={thread.id} 
                          variant={isThreadTargeted ? "jaune" : "default"} 
                          useExtremeBorder={false} 
                          className={`hover:scale-[1.01] transition-all relative pr-16 cursor-pointer ${
                            isThreadTargeted ? 'border-cordel-wood border-2 shadow-[2px_2px_0px_0px_#8b2a1a]' : 'bg-cordel-bg'
                          }`}
                          onClick={() => setSelectedThread(thread)}
                        >
                          <div className="flex flex-col gap-1 items-start">
                            {isThreadTargeted && (
                              <span className="text-[8px] font-black text-cordel-wood uppercase tracking-wider mb-1 block animate-pulse">
                                🗣️ Vous concerne ({thread.targetTag})
                              </span>
                            )}
                            {/* Category Label */}
                            <span className={`theme-stamp-badge theme-stamp-badge-${badgeVariant === 'ocre' || badgeVariant === 'vert' ? 'wood' : 'dark'} text-[7px] rotate-0 mb-1`}>
                              {getCategoryLabel(thread.categorie)}
                            </span>

                            {/* Subject */}
                            <h4 className="font-extrabold text-sm text-encre-noire leading-tight">
                              {thread.titre}
                            </h4>

                            {/* Meta */}
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-cordel-master-dark/70">
                              <span>{(t('forum.byAuthor') || "Par {author}").replace('{author}', thread.auteurNom)}</span>
                              <span>•</span>
                              <span>{(t('forum.createdOn') || "Le {date}").replace('{date}', formattedDate)}</span>
                            </div>
                          </div>

                          {/* Replies Stamp Overlay */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center select-none">
                            <div className="w-8 h-8 bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center font-black text-xs rounded-full shadow-[2px_2px_0px_0px_#181716]">
                              {repliesCount}
                            </div>
                            <span className="text-[7px] font-extrabold uppercase mt-1 tracking-wider opacity-60">
                              {repliesCount > 1 ? (t('forum.replies') || "réponses") : (t('forum.reply') || "réponse")}
                            </span>
                          </div>
                        </CordelCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
