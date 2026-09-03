import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloChat, XiloMegaphone } from './XiloIcons';
import { useTranslation } from './LanguageContext';

export default function WidgetForum({ groupId, onOpen }) {
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);
  const [threadCount, setThreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setThreads([]);
      setThreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const forumRef = collection(db, 'forum');
    const q = query(forumRef, where('groupId', '==', groupId), limit(20));

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
        // Trier by derniereModification descending (most recent first)
        const sorted = fetchedThreads.sort((a, b) => new Date(b.derniereModification || b.dateCreation) - new Date(a.derniereModification || a.dateCreation));
        setThreads(sorted);
      } else {
        setThreads([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("WidgetForum - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const recentThreads = threads.slice(0, 3);

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <CordelCard 
      variant="default" 
      useExtremeBorder={true} 
      className="relative p-4 select-none w-full"
    >
      {/* Simulateur de filigrane décoratif en arrière-plan */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.08] select-none pointer-events-none transform -rotate-12">
        <XiloMegaphone size={96} className="text-cordel-wood" />
      </div>

      <div className="flex flex-col gap-3 text-left w-full">
        {/* Barre d'en-tête */}
        <div className="flex flex-wrap justify-between items-center w-full pb-2 border-b border-dashed border-cordel-master-dark/20 gap-2">
          <div className="flex items-center gap-2 min-w-[200px] flex-1">
            <div className="w-8 h-8 bg-cordel-master-dark text-cordel-bg-light border border-encre-noire flex items-center justify-center rounded-[6px_4px_8px_5px] shrink-0 select-none shadow-[1px_1px_0px_0px_#181716]">
              <XiloChat size={16} className="text-cordel-bg-light" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1.5">
                {t('widgetForum.title') || "Porte-Voix"} <span className="opacity-60 text-[10px] font-bold">({threadCount} {t('widgetForum.subjectCountLabel') || 'sujet'}{threadCount > 1 ? 's' : ''})</span>
              </h3>
              <p className="text-[9px] font-semibold text-cordel-master-dark/70">
                {t('widgetForum.subtitle') || "Dernières discussions & sujets de la communauté"}
              </p>
            </div>
          </div>

          <CordelButton 
            variant="default" 
            onClick={() => onOpen()}
            className="text-[10px] px-3 py-1 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0"
          >
            {t('widgetForum.openForum') || "💬 Ouvrir le Porte-Voix"}
          </CordelButton>
        </div>

        {/* Grille responsive des discussions (1 col sur mobile, 2 cols sur tablette, 3 cols sur PC) */}
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : recentThreads.length === 0 ? (
          <div 
            onClick={() => onOpen()}
            className="p-4 border-2 border-dashed border-cordel-master-dark/20 rounded-[6px_10px_6px_8px] bg-white/40 text-center cursor-pointer hover:bg-white/60 transition-colors"
          >
            <p className="text-xs font-bold text-cordel-master-dark/70">
              {t('widgetForum.noThreads') || "Aucun sujet dans le Porte-Voix pour le moment."}
            </p>
            <span className="text-[10px] text-cordel-wood font-extrabold uppercase mt-1 inline-block">
              {t('widgetForum.startFirst') || "+ Lancer la première discussion"}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full mt-1 p-1 overflow-visible">
            {recentThreads.map((thread, index) => {
              const replyCount = Array.isArray(thread.reponses) ? thread.reponses.length : 0;
              const dateFormatted = formatDateShort(thread.derniereModification || thread.dateCreation);

              return (
                <div
                  key={thread.id}
                  onClick={() => onOpen(thread.id)}
                  className={`p-3 border-2 border-encre-noire rounded-[6px_10px_6px_8px] bg-cordel-bg-light shadow-[2px_2px_0px_0px_#181716] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-cordel-hover transition-all flex flex-col justify-between ${
                    index >= 1 ? 'hidden md:flex' : ''
                  } ${index >= 2 ? 'hidden lg:flex' : ''}`}
                  title={`Ouvrir le sujet: ${thread.titre}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      {thread.isPinned ? (
                        <span className="text-[8px] font-black uppercase tracking-wider text-red-800 bg-red-100 border border-red-700/30 px-1.5 py-0.5 rounded">
                          {t('widgetForum.pinned') || "📌 Épinglé"}
                        </span>
                      ) : thread.poll ? (
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-600/30 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {t('widgetForum.poll') || "📊 Sondage"}
                        </span>
                      ) : (
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-cordel-wood bg-cordel-wood/10 border border-cordel-wood/20 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {t('widgetForum.discussion') || "💬 Discussion"}
                        </span>
                      )}

                      {dateFormatted && (
                        <span className="text-[8px] font-bold text-cordel-master-dark/60">
                          {dateFormatted}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-encre-noire line-clamp-2 leading-tight">
                      {thread.titre}
                    </h4>

                    {thread.auteurNom && (
                      <p className="text-[9.5px] font-semibold text-cordel-master-dark/75 mt-1 truncate">
                        ✍️ {thread.auteurNom}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15 flex justify-between items-center text-[9px] font-bold">
                    <span className="text-cordel-wood">{t('widgetForum.viewDiscussion') || "Voir la discussion ➔"}</span>
                    <span className="bg-cordel-wood/15 text-cordel-wood font-black px-1.5 py-0.5 rounded-full border border-cordel-wood/30">
                      {replyCount} {t('widgetForum.replyCountSuffix') || "rép."}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CordelCard>
  );
}
