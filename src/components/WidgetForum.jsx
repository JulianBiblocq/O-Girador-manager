import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloChat } from './XiloIcons';

export default function WidgetForum({ groupId, onOpen }) {
  const [latestThread, setLatestThread] = useState(null);
  const [threadCount, setThreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLatestThread(null);
      setThreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const forumRef = collection(db, 'forum');
    const q = query(forumRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedThreads = [];
      querySnapshot.forEach((doc) => {
        fetchedThreads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setThreadCount(fetchedThreads.length);

      if (fetchedThreads.length > 0) {
        // Sort locally in JS by derniereModification descending (most recent first)
        const sorted = fetchedThreads.sort((a, b) => new Date(b.derniereModification) - new Date(a.derniereModification));
        setLatestThread(sorted[0]);
      } else {
        setLatestThread(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("WidgetForum - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  return (
    <CordelCard 
      variant="default" 
      useExtremeBorder={true} 
      className="relative overflow-hidden cursor-pointer hover:bg-cordel-hover hover:scale-[1.01] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cordel-wood"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="Ouvrir le forum"
    >
      {/* Decorative background stamp simulator */}
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.06] select-none pointer-events-none transform -rotate-12">
        💬
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 text-left">
          <div className="flex gap-4 items-center">
            {/* Discussion Icon */}
            <div className="w-10 h-10 bg-cordel-master-dark text-cordel-bg-light border-2 border-encre-noire flex items-center justify-center shrink-0 rounded-[8px_6px_10px_7px] select-none">
              <XiloChat size={20} className="text-cordel-bg-light" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-0.5">
                Le Porte-Voix (Forum)
              </h3>
              {latestThread ? (
                <>
                  <p className="text-sm font-bold text-encre-noire truncate">
                    {latestThread.titre}
                  </p>
                  <p className="text-xs text-cordel-master-dark/75 truncate italic">
                    Par {latestThread.auteurNom}
                  </p>
                </>
              ) : (
                <p className="text-xs font-semibold text-cordel-master-dark/70">
                  Aucun sujet de discussion.
                </p>
              )}
            </div>

            {/* Total Threads Count Stamp */}
            {threadCount > 0 && (
              <div className="w-6 h-6 bg-cordel-wood text-cordel-bg-light border border-encre-noire flex items-center justify-center font-black text-[9px] rounded-full shrink-0 shadow-[1.5px_1.5px_0px_0px_#181716] select-none">
                {threadCount}
              </div>
            )}
          </div>

          {/* Action to open Forum view */}
          <div className="flex justify-end mt-1 z-10">
            <CordelButton 
              variant="default" 
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5"
              tabIndex={-1}
            >
              💬 Ouvrir le Forum
            </CordelButton>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
