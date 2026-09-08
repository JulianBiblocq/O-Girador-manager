import React from 'react';
import ThreadMessageItem from './ThreadMessageItem';

/**
 * Conteneur scrollable des messages d'une discussion avec gestion du séparateur
 * de nouveaux messages et de la pastille flottante de défilement rapide vers le bas.
 *
 * @param {Object} props
 * @param {Array} props.reponses Liste des réponses du sujet
 * @param {number} props.firstUnreadIdx Index du premier message non lu (-1 si aucun)
 * @param {string} props.userId Identifiant de l'utilisateur connecté
 * @param {Object} props.profileData Profil de l'utilisateur connecté
 * @param {boolean} props.isModeratorOrAdmin Statut modérateur/administrateur
 * @param {Array} props.allUsers Liste des membres
 * @param {Object} props.messagesContainerRef Référence du conteneur scrollable
 * @param {Object} props.messagesEndRef Référence de l'ancre finale
 * @param {Object} props.unreadSeparatorRef Référence de la ligne de séparation de non-lus
 * @param {Function} props.onScroll Gestionnaire d'événement de défilement
 * @param {boolean} props.showScrollBottom Indique si la pastille de descente doit être affichée
 * @param {Function} props.onScrollToBottom Callback pour scroller tout en bas
 * @param {Function} props.onDeleteReply Callback de suppression d'une réponse
 * @param {Function} props.onMoveReply Callback de déplacement d'une réponse
 * @param {Function} props.onEditReply Callback d'édition d'une réponse
 * @param {Function} props.onReplyToMessage Callback de citation d'une réponse
 * @param {Function} props.onToggleReaction Callback de bascule de réaction emoji
 * @param {Function} props.t Fonction de traduction
 */
export default function ThreadMessageList({
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
  t
}) {
  // Prise en charge résiliente : prop direct reponses, champ thread.reponses ou repli thread.message
  const reponses = passedReponses || thread?.reponses || (thread?.message ? [{
    auteurId: thread.auteurId,
    auteurNom: thread.auteurNom || 'Auteur',
    message: thread.message,
    dateCreation: thread.dateCreation,
    targetTag: thread.targetTag || null
  }] : []);

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="flex flex-col gap-3 overflow-y-auto max-h-[460px] min-h-[220px] p-3 bg-cordel-bg-light border-2 border-dashed border-cordel-master-dark/20 rounded-md select-text"
      >
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

              <ThreadMessageItem
                reply={reply}
                index={index}
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
            </React.Fragment>
          );
        })
      )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pastille flottante de défilement rapide vers le bas (↓) */}
      {showScrollBottom && (
        <div className="sticky bottom-4 flex justify-end pointer-events-none pr-2">
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
