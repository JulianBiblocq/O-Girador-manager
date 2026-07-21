import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import MoveThreadModal from './MoveThreadModal';
import MoveReplyModal from './MoveReplyModal';
import { useForumModeration } from '../hooks/useForumModeration';
import { useTranslation } from './LanguageContext';

export default function ForumModerationPanel({ groupId, channels = [] }) {
  const { t } = useTranslation();
  const {
    actionLoading,
    moveThread,
    togglePinThread,
    deleteThread,
    editThreadDetails,
    deleteReply,
    moveReplyToThread,
    extractReplyToNewThread
  } = useForumModeration(groupId);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannelId, setFilterChannelId] = useState('all');

  // Modals state
  const [movingThread, setMovingThread] = useState(null);
  const [movingReplyData, setMovingReplyData] = useState(null); // { thread, reply, index }
  const [editingThread, setEditingThread] = useState(null); // { id, titre, categorie }
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editCategoryInput, setEditCategoryInput] = useState('Général');

  // Load all threads for this group in real-time
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const forumRef = collection(db, 'forum');
    const q = query(forumRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort pinned first, then by last modification
      fetched.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.derniereModification) - new Date(a.derniereModification);
      });
      setThreads(fetched);
      setLoading(false);
    }, (err) => {
      console.error("ForumModerationPanel - Error loading threads:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Filtered threads
  const filteredThreads = threads.filter(thread => {
    const matchesChannel = filterChannelId === 'all' || thread.channelId === filterChannelId;
    const matchesSearch = !searchTerm.trim() || 
      thread.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.auteurNom?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleOpenEditThread = (thread) => {
    setEditingThread(thread);
    setEditTitleInput(thread.titre);
    setEditCategoryInput(thread.categorie || 'Général');
  };

  const handleSaveEditThread = async (e) => {
    e.preventDefault();
    if (!editingThread || !editTitleInput.trim()) return;
    const ok = await editThreadDetails(editingThread.id, editTitleInput, editCategoryInput);
    if (ok) {
      setEditingThread(null);
    }
  };

  const handleDeleteThreadConfirm = async (thread) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la discussion "${thread.titre}" et toutes ses réponses ?`)) {
      await deleteThread(thread.id);
    }
  };

  const handleDeleteReplyConfirm = async (threadId, replyIndex) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce message ?")) {
      await deleteReply(threadId, replyIndex);
    }
  };

  const categories = [
    { value: 'Général', label: t('forum.Général') || 'Général' },
    { value: 'Costumes', label: t('forum.Costumes') || 'Costumes' },
    { value: 'Covoiturage', label: t('forum.Covoiturage') || 'Covoiturage' },
    { value: 'Autre', label: t('forum.Autre') || 'Autre' }
  ];

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* Search and Channel Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/40 p-3 rounded border border-dashed border-cordel-master-dark/20">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <span className="text-xs">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un sujet ou auteur..."
            className="theme-input text-xs font-bold w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <label className="text-[10px] font-black uppercase text-cordel-master-dark shrink-0">
            Salon :
          </label>
          <select
            value={filterChannelId}
            onChange={(e) => setFilterChannelId(e.target.value)}
            className="theme-input text-xs font-bold bg-white w-full sm:w-auto"
          >
            <option value="all">Tous les salons ({threads.length})</option>
            {channels.map(ch => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Threads List */}
      {loading ? (
        <div className="py-8 text-center text-xs opacity-60 animate-pulse">⏳ Chargement des sujets...</div>
      ) : filteredThreads.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center bg-cordel-bg">
          <p className="text-xs italic text-cordel-master-dark/70">Aucune discussion trouvée.</p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredThreads.map(thread => {
            const channelObj = channels.find(c => c.id === thread.channelId);
            const repliesCount = thread.reponses ? thread.reponses.length - 1 : 0;

            return (
              <CordelCard
                key={thread.id}
                variant={thread.isPinned ? "jaune" : "default"}
                useExtremeBorder={false}
                className="p-3.5 bg-cordel-bg flex flex-col gap-2 relative"
              >
                {/* Header details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {thread.isPinned && (
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] flex items-center gap-1">
                        📌 Épinglé
                      </span>
                    )}
                    <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px]">
                      📂 {channelObj?.name || 'Général'}
                    </span>
                    <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px]">
                      {thread.categorie}
                    </span>
                    <h4 className="font-extrabold text-sm text-encre-noire leading-tight">
                      {thread.titre}
                    </h4>
                  </div>

                  <span className="text-[9px] font-semibold text-cordel-master-dark opacity-75 shrink-0">
                    Par {thread.auteurNom} • {repliesCount > 0 ? `${repliesCount} rép.` : '0 rép.'}
                  </span>
                </div>

                {/* Moderation Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {/* Pin/Unpin Toggle */}
                    <button
                      type="button"
                      onClick={() => togglePinThread(thread.id, thread.isPinned)}
                      disabled={actionLoading}
                      className={`text-[9.5px] font-bold px-2 py-1 border rounded transition-all cursor-pointer ${
                        thread.isPinned
                          ? 'bg-amber-100 border-amber-400 text-amber-900'
                          : 'bg-cordel-bg-light border-cordel-master-dark/20 text-encre-noire hover:bg-white'
                      }`}
                      title={thread.isPinned ? "Désépingler ce sujet" : "Épingler ce sujet en haut"}
                    >
                      📌 {thread.isPinned ? 'Désépingler' : 'Épingler'}
                    </button>

                    {/* Move Thread Button */}
                    <button
                      type="button"
                      onClick={() => setMovingThread(thread)}
                      disabled={actionLoading}
                      className="text-[9.5px] font-bold px-2 py-1 bg-cordel-bg-light border border-cordel-master-dark/20 text-encre-noire rounded hover:bg-white cursor-pointer"
                      title="Déplacer vers un autre salon ou changer la catégorie"
                    >
                      🚚 Déplacer le sujet
                    </button>

                    {/* Edit Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditThread(thread)}
                      disabled={actionLoading}
                      className="text-[9.5px] font-bold px-2 py-1 bg-cordel-bg-light border border-cordel-master-dark/20 text-encre-noire rounded hover:bg-white cursor-pointer"
                    >
                      ✏️ Éditer titre
                    </button>
                  </div>

                  {/* Delete Thread */}
                  <button
                    type="button"
                    onClick={() => handleDeleteThreadConfirm(thread)}
                    disabled={actionLoading}
                    className="text-[9.5px] font-bold px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 cursor-pointer"
                  >
                    🗑️ Supprimer sujet
                  </button>
                </div>

                {/* Sub-list of messages / replies inside thread */}
                {thread.reponses && thread.reponses.length > 0 && (
                  <details className="mt-1 bg-white/40 rounded p-2 border border-cordel-master-dark/10">
                    <summary className="text-[10px] font-black uppercase text-cordel-wood cursor-pointer select-none hover:underline">
                      💬 Inspecter &amp; Déplacer les messages ({thread.reponses.length})
                    </summary>
                    <div className="flex flex-col gap-1.5 mt-2 max-h-56 overflow-y-auto pr-1">
                      {thread.reponses.map((rep, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-2 p-2 bg-cordel-bg-light border border-cordel-master-dark/15 rounded text-left text-[10.5px]"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="font-extrabold text-cordel-wood text-[9px]">
                              #{idx + 1} {rep.auteurNom}
                            </span>
                            <p className="text-encre-noire opacity-90 line-clamp-2 italic">
                              "{rep.message?.replace(/<[^>]*>?/gm, '')}"
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setMovingReplyData({ thread, reply: rep, index: idx })}
                              disabled={actionLoading}
                              className="text-[9px] font-bold px-1.5 py-0.5 bg-white border border-cordel-master-dark/20 rounded hover:bg-cordel-bg cursor-pointer"
                              title="Déplacer ce message vers une autre discussion"
                            >
                              ➡️ Déplacer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReplyConfirm(thread.id, idx)}
                              disabled={actionLoading}
                              className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 cursor-pointer"
                              title="Supprimer ce message"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </CordelCard>
            );
          })}
        </div>
      )}

      {/* Edit Thread Modal */}
      {editingThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-md">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase">
                  ✏️ Modifier la discussion
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingThread(null)}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditThread} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Titre du sujet *
                  </label>
                  <input
                    type="text"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    required
                    className="theme-input text-xs font-bold w-full"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Catégorie
                  </label>
                  <select
                    value={editCategoryInput}
                    onChange={(e) => setEditCategoryInput(e.target.value)}
                    className="theme-input text-xs font-bold bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => setEditingThread(null)}
                    disabled={actionLoading}
                    className="py-2 px-4 text-xs font-bold uppercase"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={actionLoading || !editTitleInput.trim()}
                    className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {actionLoading ? "Enregistrement..." : "Enregistrer"}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}

      {/* Move Thread Modal */}
      {movingThread && (
        <MoveThreadModal
          thread={movingThread}
          channels={channels}
          isSubmitting={actionLoading}
          onClose={() => setMovingThread(null)}
          onConfirm={async (newChannelId, newCategory) => {
            const ok = await moveThread(movingThread.id, newChannelId, newCategory);
            if (ok) setMovingThread(null);
          }}
        />
      )}

      {/* Move Reply Modal */}
      {movingReplyData && (
        <MoveReplyModal
          reply={movingReplyData.reply}
          replyIndex={movingReplyData.index}
          currentThreadId={movingReplyData.thread.id}
          availableThreads={threads}
          channels={channels}
          isSubmitting={actionLoading}
          onClose={() => setMovingReplyData(null)}
          onMoveToExisting={async (targetThreadId) => {
            const ok = await moveReplyToThread(movingReplyData.thread.id, movingReplyData.index, targetThreadId);
            if (ok) setMovingReplyData(null);
          }}
          onExtractToNew={async (newTitle, newChannelId, newCategory) => {
            const ok = await extractReplyToNewThread(
              movingReplyData.thread.id,
              movingReplyData.index,
              newTitle,
              newChannelId,
              newCategory
            );
            if (ok) setMovingReplyData(null);
          }}
        />
      )}
    </div>
  );
}
