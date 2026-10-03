import React, { useState } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useThreadData } from '../hooks/useThreadData';
import ThreadHeader from './forum/thread/ThreadHeader';
import ThreadValidationCard from './forum/thread/ThreadValidationCard';
import ThreadPollSection from './forum/thread/ThreadPollSection';
import ThreadMessageList from './forum/thread/ThreadMessageList';
import ThreadReplyBar from './forum/thread/ThreadReplyBar';
import ThreadModerationModals from './forum/thread/ThreadModerationModals';

/**
 * Vue principale d'un sujet de discussion (ThreadView).
 * Architecture Flexbox étanche avec flux de messages scrollable et barre de réponse ancrée.
 */
export default function ThreadView({ 
  threadId, user, profileData, channels = [], allThreads = [], allUsers = [], 
  onClose, breakGlassActive = false, tagsDisponibles = [], effectiveUserTags = [] 
}) {
  const { t } = useTranslation();

  const threadData = useThreadData({
    threadId, user, profileData, channels, allUsers,
    breakGlassActive, tagsDisponibles, effectiveUserTags, onClose, t
  });

  const [isMoveThreadOpen, setIsMoveThreadOpen] = useState(false);
  const [movingReplyData, setMovingReplyData] = useState(null);
  const [editingReplyData, setEditingReplyData] = useState(null);

  const handleSaveEditReply = async (e) => {
    e.preventDefault();
    if (!editingReplyData || !editingReplyData.text.trim()) return;
    const ok = await threadData.editReply(threadId, editingReplyData.index, editingReplyData.text.trim());
    if (ok) setEditingReplyData(null);
  };

  return (
    <div className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto flex flex-col h-[100dvh] max-h-[100dvh] md:h-[calc(100dvh-200px)] md:max-h-[calc(100dvh-200px)] overflow-hidden w-full overscroll-contain text-left bg-[var(--theme-bg)] md:border-2 md:border-encre-noire md:rounded-[8px_12px_10px_9px] md:shadow-[4px_4px_0px_0px_#181716]">
      {/* Étage 1 — En-tête (Retour + Titre du sujet) : shrink-0 (hauteur fixe, ne s'écrase jamais) */}
      <div className="shrink-0 z-20 bg-cordel-bg/95 backdrop-blur-sm flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 px-3 py-2 select-none min-h-[48px] gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CordelButton variant="default" onClick={onClose} className="px-2.5 py-1 text-xs shrink-0 flex items-center gap-1 font-bold">
            <span>←</span>
            <span className="hidden sm:inline">{t('common.back')}</span>
          </CordelButton>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {threadData.thread?.isPinned && (
                <span className="text-[11px] shrink-0" title="Sujet épinglé">📌</span>
              )}
              <h2 className="font-extrabold text-xs sm:text-sm text-encre-noire truncate leading-tight">
                {threadData.thread?.titre || t('forum.discussionHeader')}
              </h2>
            </div>
            {threadData.thread && (
              <span className="text-[9px] text-cordel-master-dark/70 font-bold truncate">
                {threadData.getCategoryLabel ? threadData.getCategoryLabel(threadData.thread.categorie) : threadData.thread.categorie}
                {threadData.thread.auteurNom ? ` • ${threadData.thread.auteurNom}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions de modération du sujet (épingler, déplacer, supprimer) */}
        {(threadData.isModeratorOrAdmin || user?.uid === threadData.thread?.auteurId) && (
          <div className="flex items-center gap-1 shrink-0">
            {threadData.isModeratorOrAdmin && (
              <button
                type="button"
                onClick={() => threadData.togglePinThread(threadData.thread?.id, threadData.thread?.isPinned)}
                disabled={threadData.actionLoading}
                className={`p-1.5 text-xs rounded border transition-colors cursor-pointer ${
                  threadData.thread?.isPinned
                    ? 'bg-cordel-wood text-white border-encre-noire'
                    : 'bg-white hover:bg-cordel-bg text-encre-noire border-cordel-master-dark/30'
                }`}
                title={threadData.thread?.isPinned ? "Désépingler le sujet" : "Épingler le sujet"}
              >
                📌
              </button>
            )}
            {threadData.isModeratorOrAdmin && (
              <button
                type="button"
                onClick={() => setIsMoveThreadOpen(true)}
                disabled={threadData.actionLoading}
                className="p-1.5 text-xs rounded bg-white hover:bg-cordel-bg text-encre-noire border border-cordel-master-dark/30 cursor-pointer shadow-xs"
                title="Déplacer vers un autre salon"
              >
                🚚
              </button>
            )}
            <button
              type="button"
              onClick={() => threadData.handleDeleteThread()}
              disabled={threadData.actionLoading}
              className="p-1.5 text-xs rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 cursor-pointer shadow-xs transition-colors"
              title={(t && t('common.delete')) || "Supprimer la discussion"}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {threadData.loading ? (
        <div className="flex-1 flex justify-center items-center py-12 select-none">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">
            ⏳ {t('common.loading')}
          </span>
        </div>
      ) : !threadData.thread ? (
        <div className="p-4 flex-1">
          <CordelCard variant="default" className="p-8 text-center select-none">
            <p className="text-xs opacity-75 font-semibold">{t('forum.notFound')}</p>
          </CordelCard>
        </div>
      ) : threadData.isAccessForbidden ? (
        <div className="p-4 flex-1">
          <CordelCard variant="default" className="p-8 text-center select-none">
            <p className="text-xs font-black text-cordel-wood">
              🔒 Ce salon est privé et réservé à un groupe spécifique. Vous n'avez pas les droits d'accès requis pour consulter cette discussion.
            </p>
          </CordelCard>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Étage 2 — Fil des messages : flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 */}
          <ThreadMessageList
            headerContent={
              <div className="flex flex-col gap-2.5 mb-1">
                {/* Carte détaillée de présentation du sujet */}
                <ThreadHeader
                  thread={threadData.thread}
                  isModeratorOrAdmin={threadData.isModeratorOrAdmin}
                  isAuthor={user?.uid === threadData.thread?.auteurId}
                  actionLoading={threadData.actionLoading}
                  onTogglePin={() => threadData.togglePinThread(threadData.thread?.id, threadData.thread?.isPinned)}
                  onOpenMove={() => setIsMoveThreadOpen(true)}
                  onDeleteThread={() => threadData.handleDeleteThread()}
                  t={t}
                  getCategoryLabel={threadData.getCategoryLabel}
                />

                {/* Section d'approbation collaborative de la publication réseaux sociaux */}
                {threadData.thread?.validationData && (
                  <ThreadValidationCard
                    thread={threadData.thread}
                    userId={user?.uid}
                    profileData={profileData}
                    isModeratorOrAdmin={threadData.isModeratorOrAdmin}
                    allUsers={allUsers}
                  />
                )}

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
              </div>
            }
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

          {/* Étage 3 — Barre de réponse (Input + Actions) : shrink-0 border-t bg-[var(--theme-bg)] pb-[max(env(safe-area-inset-bottom),0.75rem)] */}
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
            replyingTo={threadData.replyingTo}
            onCancelReply={threadData.cancelReply}
            onOpenAddPoll={() => threadData.setIsAddPollOpen(true)}
            onExpand={threadData.scrollToBottom}
            onAutoResize={threadData.scrollToBottom}
            t={t}
          />

          {/* Modales de modération (déplacement et édition) */}
          <ThreadModerationModals
            isMoveThreadOpen={isMoveThreadOpen}
            onCloseMoveThread={() => setIsMoveThreadOpen(false)}
            moveThread={threadData.moveThread}
            movingReplyData={movingReplyData}
            onCloseMoveReply={() => setMovingReplyData(null)}
            moveReplyToThread={threadData.moveReplyToThread}
            extractReplyToNewThread={threadData.extractReplyToNewThread}
            editingReplyData={editingReplyData}
            onCloseEditReply={() => setEditingReplyData(null)}
            onChangeEditText={(val) => setEditingReplyData((prev) => ({ ...prev, text: val }))}
            onSaveEditReply={handleSaveEditReply}
            thread={threadData.thread}
            channels={channels}
            availableThreads={allThreads}
            profileData={profileData}
            actionLoading={threadData.actionLoading}
          />
        </div>
      )}
    </div>
  );
}
