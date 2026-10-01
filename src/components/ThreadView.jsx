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
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden text-left bg-[var(--theme-bg)]">
      {/* Barre d'en-tête supérieure fixe en flux (z-20 pour rester sous les modales) */}
      <div className="shrink-0 z-20 bg-cordel-bg/95 backdrop-blur-sm flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 py-2 select-none">
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
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* En-tête du sujet et actions de modération */}
          <div className="shrink-0">
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
          </div>

          {/* Section d'approbation collaborative de la publication réseaux sociaux */}
          {threadData.thread?.validationData && (
            <div className="shrink-0">
              <ThreadValidationCard
                thread={threadData.thread}
                userId={user?.uid}
                profileData={profileData}
                isModeratorOrAdmin={threadData.isModeratorOrAdmin}
                allUsers={allUsers}
              />
            </div>
          )}

          {/* Section sondage interactif & modale d'ajout */}
          <div className="shrink-0">
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

          {/* Liste déroulante des messages avec repère des non-lus (confinée dans l'espace restant) */}
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

          {/* Barre de réponse dockée en bas d'écran en flux normal */}
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
