import React, { useState } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import RichTextEditor from './RichTextEditor';
import MoveThreadModal from './MoveThreadModal';
import MoveReplyModal from './MoveReplyModal';
import { useTranslation } from './LanguageContext';
import { useThreadData } from '../hooks/useThreadData';
import ThreadHeader from './forum/thread/ThreadHeader';
import ThreadPollSection from './forum/thread/ThreadPollSection';
import ThreadMessageList from './forum/thread/ThreadMessageList';
import ThreadReplyBar from './forum/thread/ThreadReplyBar';

/**
 * Vue principale d'un sujet de discussion (ThreadView).
 * Rôle : Chef d'orchestre épuré assemblant les composants spécialisés
 * (en-tête, sondage, messages, barre de saisie, modales de modération).
 */
export default function ThreadView({ 
  threadId, 
  user, 
  profileData, 
  channels = [], 
  allThreads = [], 
  allUsers = [], 
  onClose, 
  breakGlassActive = false,
  tagsDisponibles = [],
  effectiveUserTags = []
}) {
  const { t } = useTranslation();

  // Logique métier complète encapsulée dans le custom hook
  const threadData = useThreadData({
    threadId,
    user,
    profileData,
    channels,
    allUsers,
    breakGlassActive,
    tagsDisponibles,
    effectiveUserTags,
    onClose,
    t
  });

  // États locaux des modales de modération et d'édition rapide
  const [isMoveThreadOpen, setIsMoveThreadOpen] = useState(false);
  const [movingReplyData, setMovingReplyData] = useState(null); // { reply, index }
  const [editingReplyData, setEditingReplyData] = useState(null); // { reply, index, text }

  // Enregistrement de l'édition d'une réponse
  const handleSaveEditReply = async (e) => {
    e.preventDefault();
    if (!editingReplyData || !editingReplyData.text.trim()) return;
    const ok = await threadData.editReply(threadId, editingReplyData.index, editingReplyData.text.trim());
    if (ok) {
      setEditingReplyData(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left h-full">
      {/* Barre d'en-tête supérieure fixe */}
      <div className="sticky top-0 z-[100] bg-cordel-bg/95 backdrop-blur-sm flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 py-2 select-none">
        <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          {t('forum.discussionHeader')}
        </span>
        <div className="w-12"></div>
      </div>

      {threadData.loading ? (
        <div className="flex justify-center items-center py-12 select-none">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">
            ⏳ {t('common.loading')}
          </span>
        </div>
      ) : !threadData.thread ? (
        <CordelCard variant="default" className="p-8 text-center select-none">
          <p className="text-xs opacity-75 font-semibold">{t('forum.notFound')}</p>
        </CordelCard>
      ) : threadData.isAccessForbidden ? (
        <CordelCard variant="default" className="p-8 text-center select-none">
          <p className="text-xs font-black text-cordel-wood">
            🔒 Ce salon est privé et réservé à un groupe spécifique. Vous n'avez pas les droits d'accès requis pour consulter cette discussion.
          </p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {/* En-tête du sujet et actions de modération */}
          <ThreadHeader
            thread={threadData.thread}
            isModeratorOrAdmin={threadData.isModeratorOrAdmin}
            isAuthor={user?.uid === threadData.thread.auteurId}
            actionLoading={threadData.actionLoading}
            onTogglePin={() => threadData.togglePinThread(threadData.thread.id, threadData.thread.isPinned)}
            onOpenMove={() => setIsMoveThreadOpen(true)}
            onDeleteThread={() => threadData.handleDeleteThread()}
            t={t}
            getCategoryLabel={threadData.getCategoryLabel}
          />

          {/* Section sondage interactif & modale d'ajout */}
          <ThreadPollSection
            thread={threadData.thread}
            userId={user?.uid}
            user={user}
            allUsers={allUsers}
            isAuthorOrAdmin={threadData.isModeratorOrAdmin || user?.uid === threadData.thread?.auteurId}
            isAddPollOpen={threadData.isAddPollOpen}
            setIsAddPollOpen={threadData.setIsAddPollOpen}
            onCloseAddPoll={() => threadData.setIsAddPollOpen(false)}
            onCreatePoll={threadData.handleCreatePoll}
            savingPoll={threadData.savingNewPoll}
            t={t}
          />

          {/* Liste déroulante des messages avec repère des non-lus */}
          <ThreadMessageList
            thread={threadData.thread}
            reponses={threadData.thread?.reponses || []}
            userId={user?.uid}
            profileData={profileData}
            isModeratorOrAdmin={threadData.isModeratorOrAdmin}
            allUsers={allUsers}
            firstUnreadIdx={threadData.firstUnreadIdx}
            unreadSeparatorRef={threadData.unreadSeparatorRef}
            messagesContainerRef={threadData.messagesContainerRef}
            messagesEndRef={threadData.messagesEndRef}
            showScrollBottom={threadData.showScrollBottom}
            onScroll={threadData.handleScroll}
            onScrollToBottom={threadData.scrollToBottom}
            onDeleteReply={threadData.handleDeleteReply}
            onMoveReply={(index, reply) => setMovingReplyData({ index, reply })}
            onEditReply={(index, reply) => setEditingReplyData({ index, text: reply.message })}
            onReplyToMessage={threadData.handleReplyToMessage}
            onToggleReaction={threadData.handleToggleReaction}
            t={t}
          />

          {/* Barre de réponse dockée en bas d'écran */}
          <ThreadReplyBar
            isReadOnly={threadData.isReadOnly}
            replyText={threadData.replyText}
            setReplyText={threadData.setReplyText}
            sending={threadData.sending}
            onSubmit={threadData.handleSend}
            selectedTarget={threadData.selectedTarget}
            setSelectedTarget={threadData.setSelectedTarget}
            availableTargets={threadData.availableTargets}
            profileData={profileData}
            lienDepotForum={threadData.lienDepotForum}
            allUsers={allUsers}
            thread={threadData.thread}
            user={user}
            isModeratorOrAdmin={threadData.isModeratorOrAdmin}
            onOpenAddPoll={() => threadData.setIsAddPollOpen(true)}
            t={t}
          />

          {/* Modale de déplacement du sujet */}
          {isMoveThreadOpen && (
            <MoveThreadModal
              thread={threadData.thread}
              channels={channels}
              isSubmitting={threadData.actionLoading}
              onClose={() => setIsMoveThreadOpen(false)}
              onConfirm={async (newChannelId, newCategory) => {
                const ok = await threadData.moveThread(threadData.thread.id, newChannelId, newCategory);
                if (ok) setIsMoveThreadOpen(false);
              }}
            />
          )}

          {/* Modale de déplacement / extraction d'une réponse */}
          {movingReplyData && (
            <MoveReplyModal
              reply={movingReplyData.reply}
              replyIndex={movingReplyData.index}
              currentThreadId={threadData.thread.id}
              availableThreads={allThreads}
              channels={channels}
              isSubmitting={threadData.actionLoading}
              onClose={() => setMovingReplyData(null)}
              onMoveToExisting={async (targetThreadId) => {
                const ok = await threadData.moveReplyToThread(threadData.thread.id, movingReplyData.index, targetThreadId);
                if (ok) setMovingReplyData(null);
              }}
              onExtractToNew={async (newTitle, newChannelId, newCategory) => {
                const ok = await threadData.extractReplyToNewThread(
                  threadData.thread.id,
                  movingReplyData.index,
                  newTitle,
                  newChannelId,
                  newCategory,
                  profileData
                );
                if (ok) setMovingReplyData(null);
              }}
            />
          )}

          {/* Modale d'édition d'une réponse */}
          {editingReplyData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
              <div className="relative w-full max-w-md">
                <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
                  <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                    <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase">
                      ✏️ Éditer le message
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingReplyData(null)}
                      className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditReply} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                        Message *
                      </label>
                      <RichTextEditor
                        value={editingReplyData.text}
                        onChange={(val) => setEditingReplyData(prev => ({ ...prev, text: val }))}
                        disabled={threadData.actionLoading}
                        placeholder="Message..."
                        groupId={profileData?.groupId}
                        minHeight="120px"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                      <CordelButton
                        type="button"
                        variant="default"
                        onClick={() => setEditingReplyData(null)}
                        disabled={threadData.actionLoading}
                        className="py-2 px-4 text-xs font-bold uppercase"
                      >
                        Annuler
                      </CordelButton>
                      <CordelButton
                        type="submit"
                        variant="ocre"
                        useExtremeBorder={true}
                        disabled={threadData.actionLoading || !editingReplyData.text.trim()}
                        className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                      >
                        {threadData.actionLoading ? "Enregistrement..." : "Enregistrer"}
                      </CordelButton>
                    </div>
                  </form>
                </CordelCard>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
