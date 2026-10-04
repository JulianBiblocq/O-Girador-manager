import React from 'react';
import ThreadMessageItem from './ThreadMessageItem';
import PollCard from '../PollCard';

/**
 * Conteneur scrollable des messages d'une discussion avec gestion du séparateur
 * de nouveaux messages, affichage des sondages interactifs et pastille de défilement.
 */
export default function ThreadMessageList({
  headerContent = null,
  thread,
  reponses: passedReponses,
  firstUnreadIdx = -1,
  userId,
  profileData,
  isModeratorOrAdmin = false,
  allUsers = [],
  messagesContainerRef,
  messagesEndRef,
  unreadSeparatorRef,
  onScroll,
  showScrollBottom = false,
  onScrollToBottom,
  onDeleteReply,
  onMoveReply,
  onEditReply,
  onReplyToMessage,
  onToggleReaction,
  onVotePoll,
  onOpenEditPoll,
  votingPollId = null,
  t
}) {
  // Prise en charge ultra-résiliente : prop direct reponses, champ thread.reponses ou repli thread.message
  const rawReponses = Array.isArray(passedReponses)
    ? passedReponses
    : Array.isArray(thread?.reponses)
      ? thread.reponses
      : (thread?.reponses && typeof thread.reponses === 'object')
        ? (Array.isArray(thread.reponses._elements) ? thread.reponses._elements : Object.values(thread.reponses))
        : (thread?.message ? [{
            auteurId: thread.auteurId,
            auteurNom: thread.auteurNom || 'Auteur',
            message: thread.message,
            dateCreation: thread.dateCreation,
            targetTag: thread.targetTag || null
          }] : []);
  const reponses = Array.isArray(rawReponses) ? rawReponses : [];

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Étage 2 — Fil des messages : unique zone autorisée à défiler verticalement */}
      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 py-2 pb-6 bg-cordel-bg-light select-text flex flex-col gap-3"
      >
        {headerContent}
        {reponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center text-xs opacity-60 font-semibold italic select-none py-8">
            <span>📭 {(t && t('forum.noReplies')) || "Aucun message dans cette discussion pour le moment."}</span>
          </div>
        ) : (
          reponses.map((reply, index) => {
            const isFirstUnread = index === firstUnreadIdx;
            const dateMsg = new Date(reply.dateCreation);
            const formattedTime = isNaN(dateMsg.getTime())
              ? ''
              : ((t && t('forum.atTime')) || "{time} le {date}")
                  .replace('{time}', dateMsg.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
                  .replace('{date}', dateMsg.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));

            return (
              <React.Fragment key={`${reply.dateCreation}-${index}`}>
              {/* Ligne de repère de nouveaux messages */}
              {isFirstUnread && (
                <div
                  ref={unreadSeparatorRef}
                  className="flex items-center my-3 gap-2 select-none w-full"
                >
                  <div className="flex-1 h-[1.5px] bg-[var(--theme-primary)]/40" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-primary)] bg-cordel-bg px-2.5 py-0.5 rounded border border-[var(--theme-primary)]/40 shadow-xs">
                    ── Nouveaux messages ──
                  </span>
                  <div className="flex-1 h-[1.5px] bg-[var(--theme-primary)]/40" />
                </div>
              )}

              {(reply.type === 'poll' || (reply.options && reply.question)) ? (
                <PollCard
                  poll={reply}
                  userId={userId}
                  allUsers={allUsers}
                  isAuthorOrAdmin={isModeratorOrAdmin || userId === reply.auteurId}
                  onVote={onVotePoll}
                  onOpenEdit={onOpenEditPoll}
                  onDelete={onDeleteReply ? () => onDeleteReply(index) : null}
                  voting={votingPollId === reply.id}
                  t={t}
                />
              ) : (
                <ThreadMessageItem
                  reply={{
                    ...reply,
                    lectures: reply.lectures || (index === 0 ? thread?.lectures : {})
                  }}
                  index={index}
                  threadId={thread?.id}
                  collectionName="forum"
                  userId={userId}
                  profileData={profileData}
                  isModeratorOrAdmin={isModeratorOrAdmin}
                  onDeleteReply={onDeleteReply}
                  onMoveReply={onMoveReply}
                  onEditReply={onEditReply}
                  onReplyToMessage={onReplyToMessage}
                  onToggleReaction={onToggleReaction}
                  allUsers={allUsers}
                  t={t}
                  formattedTime={formattedTime}
                />
              )}
            </React.Fragment>
          );
        })
      )}
        {/* Coussin d'espacement (pb-6) et ancre invisible de fin de liste pour le scroll automatique */}
        <div ref={messagesEndRef} className="h-8 shrink-0 pb-6 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Pastille flottante de défilement rapide vers le bas (↓) */}
      {showScrollBottom && (
        <div className="absolute bottom-3 right-4 pointer-events-none z-10">
          <button
            type="button"
            onClick={onScrollToBottom}
            className="pointer-events-auto w-8 h-8 rounded-full bg-cordel-bg/95 hover:bg-white text-encre-noire border-2 border-encre-noire flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-all text-xs select-none backdrop-blur-xs"
            title="Sauter au dernier message"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}
