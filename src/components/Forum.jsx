import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import CreateThreadForm from './CreateThreadForm';
import ThreadView from './ThreadView';

export default function Forum({ user, profileData, onBack }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);

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

  // Find the currently selected thread in the sync threads state to get real-time messages
  const activeThread = selectedThread
    ? threads.find(t => t.id === selectedThread.id) || selectedThread
    : null;

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
          ⬅️ Retour
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          Le Porte-Voix
        </span>
        <div className="w-12"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement...</span>
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
              Fils de discussion
            </h2>
            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true}
              onClick={() => setIsAdding(true)} 
              className="text-xs px-3 py-1.5 font-bold uppercase tracking-widest"
            >
              + Nouveau sujet
            </CordelButton>
          </div>

          {threads.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center">
              <p className="text-xs opacity-75 font-semibold">Aucune discussion lancée. Soyez le premier !</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-3">
              {threads.map((thread) => {
                const dateCreationObj = new Date(thread.dateCreation);
                const formattedDate = isNaN(dateCreationObj.getTime())
                  ? ''
                  : dateCreationObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                
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
                        {thread.categorie}
                      </span>

                      {/* Subject */}
                      <h4 className="font-extrabold text-sm text-encre-noire leading-tight">
                        {thread.titre}
                      </h4>

                      {/* Meta */}
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-cordel-master-dark/70">
                        <span>Par {thread.auteurNom}</span>
                        <span>•</span>
                        <span>Le {formattedDate}</span>
                      </div>
                    </div>

                    {/* Replies Stamp Overlay */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center select-none">
                      <div className="w-8 h-8 bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center font-black text-xs rounded-full shadow-[2px_2px_0px_0px_#181716]">
                        {repliesCount}
                      </div>
                      <span className="text-[7px] font-extrabold uppercase mt-1 tracking-wider opacity-60">
                        {repliesCount > 1 ? "réponses" : "réponse"}
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
