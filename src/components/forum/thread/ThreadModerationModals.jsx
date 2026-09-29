import React from 'react';
import MoveThreadModal from '../../MoveThreadModal';
import MoveReplyModal from '../../MoveReplyModal';
import ThreadEditReplyModal from './ThreadEditReplyModal';

/**
 * Sous-composant regroupant l'ensemble des modales de modération et d'édition d'une discussion
 */
export default function ThreadModerationModals({
  thread,
  threadId,
  channels = [],
  availableThreads = [],
  profileData,
  actionLoading = false,
  isMoveThreadOpen,
  onCloseMoveThread,
  moveThread,
  movingReplyData,
  onCloseMoveReply,
  moveReplyToThread,
  extractReplyToNewThread,
  editingReplyData,
  onCloseEditReply,
  onChangeEditText,
  onSaveEditReply
}) {
  return (
    <>
      {/* Modale de déplacement du sujet */}
      {isMoveThreadOpen && (
        <MoveThreadModal
          thread={thread}
          channels={channels}
          isSubmitting={actionLoading}
          onClose={onCloseMoveThread}
          onConfirm={async (newChannelId, newCategory) => {
            const ok = await moveThread(thread?.id, newChannelId, newCategory);
            if (ok) onCloseMoveThread();
          }}
        />
      )}

      {/* Modale de déplacement / extraction d'une réponse */}
      {movingReplyData && (
        <MoveReplyModal
          reply={movingReplyData.reply}
          replyIndex={movingReplyData.index}
          currentThreadId={thread?.id}
          availableThreads={availableThreads}
          channels={channels}
          isSubmitting={actionLoading}
          onClose={onCloseMoveReply}
          onMoveToExisting={async (targetThreadId) => {
            const ok = await moveReplyToThread(thread?.id, movingReplyData.index, targetThreadId);
            if (ok) onCloseMoveReply();
          }}
          onExtractToNew={async (newTitle, newChannelId, newCategory) => {
            const ok = await extractReplyToNewThread(
              thread?.id,
              movingReplyData.index,
              newTitle,
              newChannelId,
              newCategory,
              profileData
            );
            if (ok) onCloseMoveReply();
          }}
        />
      )}

      {/* Modale d'édition d'une réponse */}
      <ThreadEditReplyModal
        editingData={editingReplyData}
        onClose={onCloseEditReply}
        onChangeText={onChangeEditText}
        onSave={onSaveEditReply}
        disabled={actionLoading}
        groupId={profileData?.groupId}
      />
    </>
  );
}
