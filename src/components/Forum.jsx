import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import CreateThreadForm from './CreateThreadForm';
import ThreadView from './ThreadView';
import PrivateChatView from './PrivateChatView';
import { useTranslation } from './LanguageContext';

export default function Forum({ user, profileData, onBack, activePrivateChatUserId, onClearActivePrivateChat }) {
  const { t } = useTranslation();

  const getCategoryLabel = (cat) => {
    return t(`forum.${cat}`) || cat;
  };

  const [threads, setThreads] = useState([]);
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

  useEffect(() => {
    if (!profileData?.groupId) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const forumRef = collection(db, 'forum');
    const q = query(forumRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedThreads = [];
      querySnapshot.forEach((doc) => {
        fetchedThreads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort locally in JS: latest modification first
      const sorted = fetchedThreads.sort((a, b) => new Date(b.derniereModification) - new Date(a.derniereModification));
      setThreads(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Forum - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

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
          💬 Discussions
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
          ✉️ MP / Boîte de réception
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
            Mes Discussions Privées
          </h2>

          {conversations.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs opacity-75 font-semibold">Aucune discussion privée pour le moment. Allez dans le Trombinoscope pour contacter un membre !</p>
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
                        {isLastMessageFromMe ? "Vous : " : ""}{conv.lastMessage?.content}
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
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ {t('common.loading')}</span>
        </div>
      ) : isAdding ? (
        /* Create thread form panel */
        <CreateThreadForm 
          groupId={profileData.groupId} 
          user={user} 
          profileData={profileData} 
          onClose={() => setIsAdding(false)} 
        />
      ) : (
        /* Thread Listing */
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
              {t('forum.threadsList')}
            </h2>
            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true}
              onClick={() => setIsAdding(true)} 
              className="text-xs px-3 py-1.5 font-bold uppercase tracking-widest"
            >
              + {t('forum.newSubject')}
            </CordelButton>
          </div>

          {threads.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center">
              <p className="text-xs opacity-75 font-semibold">{t('forum.noThreads') || "Aucune discussion lancée. Soyez le premier !"}</p>
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

                return (
                  <CordelCard 
                    key={thread.id} 
                    variant="default" 
                    useExtremeBorder={false} 
                    className="hover:scale-[1.01] transition-all relative pr-16 cursor-pointer"
                    onClick={() => setSelectedThread(thread)}
                  >
                    <div className="flex flex-col gap-1 items-start">
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
  );
}
