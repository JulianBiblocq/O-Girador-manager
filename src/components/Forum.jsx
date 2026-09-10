import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, or, doc, setDoc, addDoc, updateDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import ThreadView from './ThreadView';
import PrivateChatView from './PrivateChatView';
import MoveThreadModal from './MoveThreadModal';
import CreateThreadForm from './CreateThreadForm';
import { useForumModeration } from '../hooks/useForumModeration';
import { useTranslation } from './LanguageContext';
import XiloAvatar from './XiloAvatar';
import { XiloMegaphone } from './XiloIcons';
import useConfirm from '../hooks/useConfirm';
import { resolveEffectiveUserTags } from '../utils/tagUtils'; // Utilitaires pour la gestion et la résolution des étiquettes
import { isUserModeratorOrAdmin, canUserWriteInForumChannel, canUserReadForumChannel, checkUserAccessToList } from '../utils/permissionUtils';
import { countThreadUnreadMessages, getAllChannelsUnreadStats } from '../utils/forumUnreadUtils';
import ForumThreadCard from './forum/ForumThreadCard';
import ConversationCard from './forum/ConversationCard';
import NewDirectMessageModal from './forum/NewDirectMessageModal';
import NewGroupModal from './forum/NewGroupModal';
import { useConversations } from '../hooks/useConversations';
import useHardwareBack from '../hooks/useHardwareBack';

function ChannelTreeItem({ 
  channel, 
  channels, 
  allThreads = [],
  activeChannelId, 
  onSelectChannel, 
  onSelectThread,
  selectedThreadId,
  hasWriteAccess,
  profileData,
  channelStatsMap = {},
  level = 0 
}) {
  const children = channels.filter(c => c.parentId === channel.id);
  const channelThreads = useMemo(() => {
    return allThreads.filter(t => t.channelId === channel.id || (!t.channelId && channel.name === (t.categorie || 'Général')));
  }, [allThreads, channel.id, channel.name]);

  const hasChildren = children.length > 0 || channelThreads.length > 0;
  const isActive = channel.id === activeChannelId;
  const isReadOnly = !hasWriteAccess(channel);

  // Statistiques de non-lus en cascade (incluant sous-dossiers et sujets enfants)
  const channelStats = channelStatsMap[channel.id];
  const unreadMessagesCount = channelStats?.unreadMessages || 0;
  const hasUnread = unreadMessagesCount > 0;

  const hasActiveThread = useMemo(() => {
    return selectedThreadId && channelThreads.some(t => t.id === selectedThreadId);
  }, [selectedThreadId, channelThreads]);

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isActive || hasActiveThread || hasUnread) {
      setIsOpen(true);
    }
  }, [isActive, hasActiveThread, hasUnread]);

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
            <span className="shrink-0 font-bold text-cordel-wood opacity-75">
              {channel.readOnlyForMembers ? '📢' : (!channel.readRoles || channel.readRoles.includes('all') || channel.readRoles.length === 0) ? (level === 0 ? '📂' : '#') : '🔒'}
            </span>
            <span className={`truncate ${hasUnread ? 'font-black text-encre-noire' : ''}`}>{channel.name}</span>
            {channelThreads.length > 0 && (
              <span className="text-[9px] opacity-60 font-normal shrink-0">({channelThreads.length})</span>
            )}
          </span>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {hasUnread && (
              <span 
                className="text-[8px] font-black text-white bg-red-600 px-1.5 py-0.2 rounded-full shadow-xs flex items-center justify-center min-w-[16px] animate-pulse"
                title={`${unreadMessagesCount} message(s) non lu(s)`}
              >
                {unreadMessagesCount}
              </span>
            )}
            {isReadOnly && <span className="text-[9px] opacity-75" title="Lecture seule">🔒</span>}
          </div>
        </button>
      </div>

      {isOpen && hasChildren && (
        <div className="flex flex-col gap-1 ml-2 border-l border-dashed border-cordel-master-dark/25 pl-1 min-w-0">
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
              profileData={profileData}
              channelStatsMap={channelStatsMap}
              level={level + 1}
            />
          ))}

          {/* Threads inside this channel */}
          {channelThreads.map(thread => {
            const isThreadActive = selectedThreadId === thread.id;
            const repliesCount = thread.reponses ? thread.reponses.length - 1 : 0;
            const unreadCount = countThreadUnreadMessages(
              thread,
              profileData?.uid || profileData?.id,
              profileData?.readThreads?.[thread.id]
            );
            const isUnread = !isThreadActive && unreadCount > 0;

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  if (onSelectThread) onSelectThread(thread, activeChannelId);
                }}
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
                    {isUnread && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>}
                  </span>
                  <span className={`truncate ${isUnread ? 'font-black' : ''}`}>{thread.titre}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {isUnread && (
                    <span className="text-[7.5px] font-black text-white bg-red-600 px-1 py-0.2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {repliesCount > 0 && (
                    <span className={`text-[8.5px] opacity-60 shrink-0 font-bold ${isUnread ? 'text-red-600 opacity-100 font-black' : ''}`}>
                      {repliesCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Forum({ 
  user, 
  profileData, 
  onBack, 
  activePrivateChatUserId, 
  initialPrivateMessage = '', 
  onClearActivePrivateChat, 
  onOpenStudioForum, 
  breakGlassActive = false,
  initialTab = 'discussions'
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { actionLoading, moveThread, togglePinThread, deleteThread } = useForumModeration(profileData?.groupId);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };


  const [threads, setThreads] = useState([]);
  const [threadLimit, setThreadLimit] = useState(30);
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [movingThreadModal, setMovingThreadModal] = useState(null);
  
  // État de création de salon et sous-dossier par un membre
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelParentId, setNewChannelParentId] = useState('');
  const [savingChannel, setSavingChannel] = useState(false);
  
  // États d'ouverture des modales dédiées (message direct 1-à-1 et groupe privé)
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useHardwareBack(isAdding, () => setIsAdding(false));
  useHardwareBack(!!movingThreadModal, () => setMovingThreadModal(null));
  useHardwareBack(isCreatingChannel, () => setIsCreatingChannel(false));
  useHardwareBack(isNewDirectModalOpen, () => setIsNewDirectModalOpen(false));
  useHardwareBack(isNewGroupModalOpen, () => setIsNewGroupModalOpen(false));

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
  
  // Normalisation de l'onglet actif : 'discussions', 'direct' (repli sur 'inbox' historique), 'groups'
  const resolveTab = (tab) => {
    if (tab === 'inbox') return 'direct';
    if (tab === 'groups') return 'groups';
    return tab || 'discussions';
  };
  const [activeTab, setActiveTab] = useState(resolveTab(initialTab));
  
  // Synchronisation de l'onglet actif si initialTab est passé en navigation directe
  useEffect(() => {
    if (initialTab) {
      setActiveTab(resolveTab(initialTab));
    }
  }, [initialTab]);
  const [mobileView, setMobileView] = useState('channels'); // 'channels' (Écran 1) ou 'discussion' (Écran 2)
  const [privateMessages, setPrivateMessages] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [activeChatUserId, setActiveChatUserId] = useState(null);

  const handleSelectChannel = useCallback((channelId) => {
    setActiveChannelId(channelId);
    setMobileView('discussion');
    setIsDrawerOpen(false);
  }, []);

  const isModeratorOrAdmin = isUserModeratorOrAdmin(profileData);

  // Hook de gestion des discussions privées et des groupes multi-membres
  const {
    conversations: modernConversations,
    createDirectConversation,
    createGroupConversation,
    markConversationAsRead,
    addParticipantsToGroup,
    removeParticipantFromGroup,
    leaveGroup,
    renameGroup
  } = useConversations(user, profileData?.groupId, profileData);

  // Synchronisation des membres de l'association pour la recherche de nom/avatar
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

  // Synchronisation temps réel des messages privés historiques
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
      console.error("Forum - Erreur de synchronisation des messages privés :", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Ouverture automatique d'une discussion privée en cas de rédirection depuis le Trombinoscope
  useEffect(() => {
    if (activePrivateChatUserId) {
      const initDirect = async () => {
        const convId = await createDirectConversation(activePrivateChatUserId, initialPrivateMessage);
        if (convId) {
          setActiveConversationId(convId);
        } else {
          setActiveChatUserId(activePrivateChatUserId);
        }
        setActiveTab('direct');
        if (onClearActivePrivateChat) onClearActivePrivateChat();
      };
      initDirect();
    }
  }, [activePrivateChatUserId, createDirectConversation, initialPrivateMessage, onClearActivePrivateChat]);

  const [tagsDisponibles, setTagsDisponibles] = useState([]);

  useEffect(() => {
    if (!profileData?.groupId) return;
    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTagsDisponibles(docSnap.data().tagsDisponibles || []);
      }
    });
    return () => unsubscribe();
  }, [profileData?.groupId]);

  const effectiveUserTags = useMemo(() => {
    return resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);
  }, [profileData?.tags, tagsDisponibles]);



  // Real-time synchronization of channels (salons)
  useEffect(() => {
    if (!profileData?.groupId) {
      setChannels([]);
      return;
    }

    const channelsRef = collection(db, 'forum_channels');


    // Charger les salons de l'association (le filtrage étanche des accès est assuré ci-dessous par canUserReadForumChannel)
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

        // Rendre immédiatement les salons par défaut disponibles localement pour ne pas bloquer l'adhérent
        const allowedDefaults = defaults.filter(ch => canUserReadForumChannel(ch, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive));
        setChannels(allowedDefaults);
        if (allowedDefaults.length > 0) {
          setActiveChannelId(allowedDefaults[0].id);
        }

        // Tenter d'enregistrer les salons par défaut dans Firestore si l'utilisateur est admin/mestre
        if (isUserModeratorOrAdmin(profileData)) {
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
        }
      } else {
        // Filtrer client-side : Le mode intervention (breakGlassActive) donne accès à tout.
        // En mode standard, chaque utilisateur n'accède qu'aux salons autorisés par ses badges/rôles.
        const allowedChannels = fetched.filter(ch => {
          return canUserReadForumChannel(ch, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive);
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
        } else {
          setActiveChannelId(null);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Erreur chargement Porte-voix :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, profileData?.role, effectiveUserTags, profileData?.isSystemAdmin, breakGlassActive, tagsDisponibles, checkUserAccessToList]);

  // Synchronisation des discussions récentes pour l'association (bornée à threadLimit pour préserver les quotas)
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
      where('groupId', '==', profileData.groupId),
      limit(threadLimit)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setHasMoreThreads(querySnapshot.size >= threadLimit);
      const fetchedThreads = [];
      querySnapshot.forEach((doc) => {
        fetchedThreads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Trier d'abord les sujets épinglés, puis par dernière activité / modification chronologique inversée
      const sorted = fetchedThreads.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const dateB = new Date(b.lastActivity || b.derniereModification || b.dateCreation || 0);
        const dateA = new Date(a.lastActivity || a.derniereModification || a.dateCreation || 0);
        return dateB - dateA;
      });

      setThreads(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Erreur chargement Porte-voix :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, threadLimit]);

  // Référence pour mémoriser le salon d'origine avant ouverture d'un sujet
  const previousChannelRef = useRef(null);

  // Ensemble des identifiants de salons autorisés pour le membre
  const allowedChannelIdSet = useMemo(() => {
    return new Set(channels.map(c => c.id));
  }, [channels]);

  // Discussions filtrées de manière étanche selon les salons autorisés en lecture pour le membre
  const accessibleThreads = useMemo(() => {
    if (breakGlassActive) return threads;
    return threads.filter(t => {
      if (t.channelId) {
        return allowedChannelIdSet.has(t.channelId);
      }
      const ch = channels.find(c => c.name === (t.categorie || 'Général'));
      if (ch) return allowedChannelIdSet.has(ch.id);
      const catLower = (t.categorie || '').toLowerCase();
      if (catLower === 'bureau') return false;
      return true;
    });
  }, [threads, allowedChannelIdSet, channels, breakGlassActive]);

  // Synchronisation de l'URL et de l'historique pour le routage des discussions
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const targetThreadId = searchParams.get('threadId');
      
      if (targetThreadId && accessibleThreads.length > 0) {
        const matchedThread = accessibleThreads.find(t => t.id === targetThreadId);
        if (matchedThread) {
          setSelectedThread(matchedThread);
        } else {
          setSelectedThread(null);
        }
      } else {
        if (selectedThread) {
          setSelectedThread(null);
          if (previousChannelRef.current) {
            setActiveChannelId(previousChannelRef.current);
          }
        }
      }
    };

    // Écouter les retours navigateur/téléphone
    window.addEventListener('popstate', handlePopState);
    
    // Gérer le deep linking initial
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, [accessibleThreads, selectedThread]);

  const activeChannelThreads = useMemo(() => {
    if (!activeChannelId) return [];
    const activeChan = channels.find(c => c.id === activeChannelId);
    return accessibleThreads.filter(t => {
      if (t.channelId) return t.channelId === activeChannelId;
      if (activeChan && activeChan.name === (t.categorie || 'Général')) return true;
      return false;
    });
  }, [accessibleThreads, activeChannelId, channels]);

  // Carte des statistiques de non-lus calculée en cascade pour l'arborescence des salons
  const channelStatsMap = useMemo(() => {
    return getAllChannelsUnreadStats(channels, accessibleThreads, user?.uid, profileData?.readThreads);
  }, [channels, accessibleThreads, user?.uid, profileData?.readThreads]);

  // Action globale pour acquitter tous les sujets de la section courante
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.uid || !accessibleThreads || accessibleThreads.length === 0) return;

    let targetThreads = accessibleThreads;
    if (activeChannelId) {
      const getDescendantIds = (cId) => {
        const kids = channels.filter(c => c.parentId === cId);
        return [cId, ...kids.flatMap(k => getDescendantIds(k.id))];
      };
      const scopeIds = new Set(getDescendantIds(activeChannelId));
      const activeChan = channels.find(c => c.id === activeChannelId);

      targetThreads = accessibleThreads.filter(t => {
        if (t.channelId) return scopeIds.has(t.channelId);
        if (activeChan && activeChan.name === (t.categorie || 'Général')) return true;
        return false;
      });
    }

    if (targetThreads.length === 0) return;

    const nowIso = new Date().toISOString();
    const updates = {};
    targetThreads.forEach(t => {
      updates[`readThreads.${t.id}`] = nowIso;
    });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
    } catch (err) {
      console.error("Erreur lors de l'acquittement global :", err);
    }
  }, [user?.uid, accessibleThreads, activeChannelId, channels]);

  // Fusion transparente des conversations modernes (directes & groupes) et des discussions legacy
  const allInboxConversations = useMemo(() => {
    const existingDirectOtherIds = new Set();
    modernConversations.forEach((c) => {
      if (c.type === 'direct' && Array.isArray(c.participantIds)) {
        const other = c.participantIds.find((id) => id !== user?.uid);
        if (other) existingDirectOtherIds.add(other);
      }
    });

    const legacyMap = {};
    privateMessages.forEach((msg) => {
      const otherId = msg.senderId === user?.uid ? msg.recipientId : msg.senderId;
      if (!existingDirectOtherIds.has(otherId)) {
        if (!legacyMap[otherId]) {
          legacyMap[otherId] = {
            id: `legacy_${otherId}`,
            isLegacy: true,
            type: 'direct',
            participantIds: [user?.uid, otherId],
            lastMessage: null,
            isUnread: false,
            updatedAt: msg.timestamp
          };
        }
        if (!legacyMap[otherId].lastMessage || new Date(msg.timestamp) > new Date(legacyMap[otherId].lastMessage.timestamp)) {
          legacyMap[otherId].lastMessage = {
            content: msg.content,
            senderId: msg.senderId,
            timestamp: msg.timestamp
          };
          legacyMap[otherId].updatedAt = msg.timestamp;
        }
        if (msg.recipientId === user?.uid && !msg.read) {
          legacyMap[otherId].isUnread = true;
        }
      }
    });

    const combined = [...modernConversations, ...Object.values(legacyMap)];
    combined.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.lastMessage?.timestamp || 0).getTime();
      const timeB = new Date(b.updatedAt || b.lastMessage?.timestamp || 0).getTime();
      return timeB - timeA;
    });
    return combined;
  }, [modernConversations, privateMessages, user?.uid]);

  // Ventilation étanche et rétrocompatible des discussions directes (1-à-1) et de groupes
  const directConversations = useMemo(() => {
    return allInboxConversations.filter((c) => {
      // Règle de rétrocompatibilité : toute conversation sans type 'group' est considérée comme 'direct'
      const convType = c.type === 'group' ? 'group' : 'direct';
      return convType === 'direct';
    });
  }, [allInboxConversations]);

  const groupConversations = useMemo(() => {
    return allInboxConversations.filter((c) => {
      // Règle de rétrocompatibilité : seule une conversation avec type 'group' est considérée comme un groupe
      const convType = c.type === 'group' ? 'group' : 'direct';
      return convType === 'group';
    });
  }, [allInboxConversations]);

  const unreadDirectCount = useMemo(() => {
    return directConversations.filter((c) => c.isUnread).length;
  }, [directConversations]);

  const unreadGroupsCount = useMemo(() => {
    return groupConversations.filter((c) => c.isUnread).length;
  }, [groupConversations]);

  // Retrouver la discussion sélectionnée dans l'état synchronisé pour avoir les messages en temps réel
  const activeThread = selectedThread
    ? accessibleThreads.find(t => t.id === selectedThread.id) || selectedThread
    : null;

  const handleSelectThread = useCallback((thread, originChannelId = null) => {
    // Mémorise le salon d'où venait l'utilisateur avant d'ouvrir le sujet
    previousChannelRef.current = originChannelId !== null ? originChannelId : activeChannelId;
    setSelectedThread(thread);

    const newUrl = new URL(window.location);
    newUrl.searchParams.set('threadId', thread.id);
    window.history.pushState(
      { ...window.history.state, threadId: thread.id },
      '',
      newUrl.toString()
    );
  }, [activeChannelId]);

  const handleCloseThread = useCallback(() => {
    // 1. Nettoyer l'URL de manière idempotente sans double popstate
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('threadId');
    window.history.replaceState({ ...window.history.state, threadId: null }, '', newUrl.toString());

    // 2. Restaurer le salon d'origine sans éjecter l'utilisateur vers l'accueil de l'application
    if (previousChannelRef.current !== null && previousChannelRef.current !== undefined) {
      setActiveChannelId(previousChannelRef.current);
    }
    setSelectedThread(null);
  }, []);

  const hasWriteAccess = useCallback((channel) => {
    return canUserWriteInForumChannel(channel, profileData, tagsDisponibles, effectiveUserTags, breakGlassActive);
  }, [profileData, tagsDisponibles, effectiveUserTags, breakGlassActive]);

  const activeChannel = useMemo(() => {
    return channels.find(c => c.id === activeChannelId);
  }, [channels, activeChannelId]);

  const handleDeleteThreadPrompt = async (thread) => {
    const ok = await confirm({
      title: "Supprimer la discussion",
      message: `Voulez-vous vraiment supprimer la discussion "${thread.titre}" ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (ok) {
      await deleteThread(thread.id);
    }
  };

  // Si une discussion privée (directe ou groupe) est active, afficher la vue de chat en pleine page
  if (activeConversationId || activeChatUserId) {
    const activeConv = modernConversations.find((c) => c.id === activeConversationId);

    return (
      <PrivateChatView
        user={user}
        conversation={activeConv}
        profileData={profileData}
        recipientId={activeChatUserId}
        otherUser={usersMap[activeChatUserId] || { id: activeChatUserId }}
        usersMap={usersMap}
        initialText={initialPrivateMessage}
        onMarkAsRead={markConversationAsRead}
        onAddParticipants={addParticipantsToGroup}
        onRemoveParticipant={removeParticipantFromGroup}
        onRenameGroup={renameGroup}
        onLeaveGroup={leaveGroup}
        isSystemAdmin={isModeratorOrAdmin}
        onClose={() => {
          setActiveConversationId(null);
          setActiveChatUserId(null);
          if (onClearActivePrivateChat) onClearActivePrivateChat();
        }}
        onBack={() => {
          setActiveConversationId(null);
          setActiveChatUserId(null);
          if (onClearActivePrivateChat) onClearActivePrivateChat();
        }}
      />
    );
  }

  if (activeThread) {
    return (
      <ThreadView 
        threadId={activeThread.id} 
        user={user} 
        profileData={profileData} 
        channels={channels}
        allThreads={accessibleThreads}
        allUsers={Object.values(usersMap)}
        breakGlassActive={breakGlassActive}
        tagsDisponibles={tagsDisponibles}
        effectiveUserTags={effectiveUserTags}
        onClose={handleCloseThread} 
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
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase flex items-center justify-center gap-1.5">
          <XiloMegaphone size={16} className="text-cordel-wood" />
          {translate('forum.title', "Porte-Voix")}
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

      {/* Barre de navigation principale (3 onglets racine : Discussions / Messages Privés / Groupes) */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2 w-full select-none">
        {/* Onglet 1 : Discussions */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('discussions');
            setIsAdding(false);
          }}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer text-center ${
            activeTab === 'discussions'
              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          <span className="shrink-0">💬</span>
          <span className="truncate">{translate('forum.discussionsTab', "Discussions")}</span>
        </button>

        {/* Onglet 2 : Messages Privés (1-à-1) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('direct');
            setIsAdding(false);
          }}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer relative text-center ${
            activeTab === 'direct'
              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          <span className="shrink-0">✉️</span>
          <span className="truncate">Messages privés</span>
          {unreadDirectCount > 0 && (
            <span className="absolute -top-1.5 -right-1 min-w-[14px] h-3.5 px-1 bg-red-600 text-white text-[7px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
              {unreadDirectCount}
            </span>
          )}
        </button>

        {/* Onglet 3 : Groupes */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('groups');
            setIsAdding(false);
          }}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer relative text-center ${
            activeTab === 'groups'
              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          <span className="shrink-0">👥</span>
          <span className="truncate">Groupes</span>
          {unreadGroupsCount > 0 && (
            <span className="absolute -top-1.5 -right-1 min-w-[14px] h-3.5 px-1 bg-red-600 text-white text-[7px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
              {unreadGroupsCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'direct' && (
        /* Liste des messages privés (1-à-1) */
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1 select-none flex-wrap gap-2">
            <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
              ✉️ Messages privés (1-à-1)
            </h2>
            <CordelButton
              variant="vert"
              onClick={() => setIsNewDirectModalOpen(true)}
              className="text-xs px-3 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Démarrer un nouveau message direct"
            >
              <span>➕</span>
              <span>Nouveau message</span>
            </CordelButton>
          </div>

          {directConversations.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none flex flex-col items-center gap-3">
              <span className="text-3xl">✉️</span>
              <p className="text-xs opacity-75 font-semibold max-w-sm">
                Aucun message privé pour le moment. Vous pouvez démarrer un échange en tête-à-tête avec n'importe quel membre actif de l'association !
              </p>
              <CordelButton
                variant="vert"
                onClick={() => setIsNewDirectModalOpen(true)}
                className="mt-1 text-xs px-4 py-2 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>➕</span>
                <span>Démarrer un message</span>
              </CordelButton>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3">
              {directConversations.map((conv) => (
                <ConversationCard 
                  key={conv.id} 
                  conversation={conv}
                  currentUserId={user?.uid}
                  usersMap={usersMap}
                  onClick={async () => {
                    if (conv.isLegacy) {
                      const otherId = conv.participantIds?.find((id) => id !== user?.uid);
                      try {
                        const convId = await createDirectConversation(otherId);
                        if (convId) {
                          setActiveConversationId(convId);
                        } else {
                          setActiveChatUserId(otherId);
                        }
                      } catch (err) {
                        console.warn("Forum - Erreur ouverture conversation (repli legacy actif) :", err);
                        setActiveChatUserId(otherId);
                      }
                    } else {
                      setActiveConversationId(conv.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'groups' && (
        /* Liste des groupes de discussion multi-membres */
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1 select-none flex-wrap gap-2">
            <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
              👥 Groupes de discussion
            </h2>
            <CordelButton
              variant="vert"
              onClick={() => setIsNewGroupModalOpen(true)}
              className="text-xs px-3 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Créer une nouvelle boucle de discussion de groupe"
            >
              <span>➕</span>
              <span>Nouveau groupe</span>
            </CordelButton>
          </div>

          {groupConversations.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none flex flex-col items-center gap-3">
              <span className="text-3xl">👥</span>
              <p className="text-xs opacity-75 font-semibold max-w-sm">
                Aucun groupe de discussion pour le moment. Fondez une boucle d'échange pour un projet, un événement, une section ou un covoiturage !
              </p>
              <CordelButton
                variant="vert"
                onClick={() => setIsNewGroupModalOpen(true)}
                className="mt-1 text-xs px-4 py-2 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>➕</span>
                <span>Créer un groupe</span>
              </CordelButton>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3">
              {groupConversations.map((conv) => (
                <ConversationCard 
                  key={conv.id} 
                  conversation={conv}
                  currentUserId={user?.uid}
                  usersMap={usersMap}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'discussions' && (
        /* Onglet Discussions avec barre latérale des salons / vue des discussions */
        <div className="flex flex-col md:flex-row gap-4">
          {/* Colonne 1 : Liste des salons (Écran 1 sur Mobile, Barre latérale gauche sur PC) */}
          <div className={`${mobileView === 'channels' ? 'block' : 'hidden'} md:block w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-2 select-none`}>
            <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_6px_10px_7px] shadow-[2.5px_2.5px_0px_0px_#181716] min-w-0">
              <div className="flex justify-between items-center mb-2 border-b border-dashed border-cordel-master-dark/20 pb-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-xs font-black uppercase tracking-widest text-cordel-wood truncate">
                    📂 {translate('forum.channelsHeader', "Salons")}
                  </h3>
                  {/* Bouton Tout marquer comme lu */}
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[8.5px] font-black uppercase tracking-wider text-cordel-wood hover:text-encre-noire cursor-pointer flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cordel-bg border border-cordel-master-dark/20 hover:border-encre-noire transition-all shadow-xs shrink-0"
                    title="Marquer tous les sujets de la section comme lus"
                  >
                    ✓✓ {translate('forum.markAllAsRead', "Tout lire")}
                  </button>
                </div>
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
                    allThreads={accessibleThreads}
                    activeChannelId={activeChannelId}
                    onSelectChannel={handleSelectChannel}
                    onSelectThread={handleSelectThread}
                    selectedThreadId={selectedThread?.id}
                    hasWriteAccess={hasWriteAccess}
                    profileData={profileData}
                    channelStatsMap={channelStatsMap}
                    level={0}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Colonne 2 : Zone de discussion (Écran 2 sur Mobile, Panneau principal droit sur PC) */}
          <div className={`${mobileView === 'discussion' ? 'block' : 'hidden'} md:block flex-1 min-w-0`}>
            {/* Bouton de retour mobile vers la liste des salons */}
            <div className="block md:hidden mb-3">
              <CordelButton
                variant="default"
                onClick={() => setMobileView('channels')}
                className="w-full py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-encre-noire bg-cordel-bg shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
              >
                ⬅️ {translate('forum.backToChannels', "Retour aux salons")}
              </CordelButton>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12 select-none">
                <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ {t('common.loading')}</span>
              </div>
            ) : isAdding ? (
              /* Formulaire de création de sujet */
              <CreateThreadForm 
                groupId={profileData.groupId} 
                channelId={activeChannelId}
                user={user} 
                profileData={profileData} 
                allUsers={Object.values(usersMap)}
                onClose={() => setIsAdding(false)} 
              />
            ) : (
              /* Liste des discussions */
              <div className="flex flex-col gap-4">
                {/* Chemin de navigation (Fil d'Ariane) */}
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
                      <span className="text-encre-noire flex items-center gap-1">
                        <XiloMegaphone size={12} className="text-cordel-wood" /> Porte-voix
                      </span>
                      {path.map((item, idx) => (
                        <React.Fragment key={item.id}>
                          <span className="opacity-40 text-encre-noire">/</span>
                          <button
                            type="button"
                            onClick={() => handleSelectChannel(item.id)}
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
                  <>
                    <div className="flex flex-col gap-3">
                      {activeChannelThreads.map((thread) => (
                        <ForumThreadCard
                          key={thread.id}
                          thread={thread}
                          profileData={profileData}
                          onClick={handleSelectThread}
                          isModeratorOrAdmin={isModeratorOrAdmin}
                          onTogglePin={(id, currentStatus) => togglePinThread(id, currentStatus)}
                          onMoveThread={setMovingThreadModal}
                          onDeleteThread={handleDeleteThreadPrompt}
                          t={t}
                        />
                      ))}
                    </div>

                    {hasMoreThreads && (
                      <div className="flex justify-center p-3">
                        <CordelButton
                          variant="default"
                          onClick={() => setThreadLimit(prev => prev + 30)}
                          className="text-xs px-4 py-2 font-bold uppercase tracking-wider"
                        >
                          💬 {translate('forum.loadMoreThreads', "Charger les discussions précédentes (+30)")}
                        </CordelButton>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de déplacement de sujet */}
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

      {/* Modale dédiée pour démarrer un nouveau message direct (1-à-1) */}
      <NewDirectMessageModal
        isOpen={isNewDirectModalOpen}
        onClose={() => setIsNewDirectModalOpen(false)}
        onStartDirectChat={async (targetUserId) => {
          try {
            const convId = await createDirectConversation(targetUserId);
            if (convId) {
              setActiveConversationId(convId);
            } else {
              setActiveChatUserId(targetUserId);
            }
          } catch (err) {
            console.warn("Forum - Erreur démarrage message direct (repli legacy actif) :", err);
            setActiveChatUserId(targetUserId);
          }
        }}
        members={Object.values(usersMap)}
        currentUserId={user?.uid}
        existingDirectUserIds={new Set(
          directConversations
            .map((c) => (c.participantIds || []).find((id) => id !== user?.uid))
            .filter(Boolean)
        )}
      />

      {/* Modale dédiée à la création d'une boucle de discussion de groupe */}
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        onCreateGroupChat={async ({ name, participantIds, initialMessage }) => {
          const convId = await createGroupConversation({ name, participantIds, initialMessage });
          if (convId) {
            setActiveConversationId(convId);
          }
        }}
        members={Object.values(usersMap)}
        currentUserId={user?.uid}
      />
    </div>
  );
}
