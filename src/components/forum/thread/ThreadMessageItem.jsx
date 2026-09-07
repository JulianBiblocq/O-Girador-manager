import React from 'react';
import FormattedMessageContent from '../../FormattedMessageContent';
import { usePresenceContext } from '../../../context/PresenceContext';

/**
 * Barre de réactions rapides sous une réponse (emojis, compteurs et tooltips).
 */
const ReactionBar = ({ reactions = {}, currentUserId, onToggle, allUsers = [] }) => {
  const emojis = ['👍', '👎', '❤️', '👏'];
  const getUserName = (uid) => {
    const found = allUsers.find((u) => u.id === uid);
    return found ? `${found.prenom} ${found.nom}` : 'Inconnu';
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {emojis.map((emoji) => {
        const usersWhoReacted = reactions[emoji] || [];
        const count = usersWhoReacted.length;
        const hasReacted = usersWhoReacted.includes(currentUserId);

        if (count === 0) {
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggle(emoji)}
              className="opacity-60 hover:opacity-100 text-[14px] transition-opacity cursor-pointer p-0.5 grayscale hover:grayscale-0"
              title="Réagir"
            >
              {emoji}
            </button>
          );
        }

        const tooltipText = usersWhoReacted.map(getUserName).join(', ');

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[12px] text-[13px] font-black border transition-all cursor-pointer shadow-xs active:translate-y-[0.5px] ${
              hasReacted
                ? 'bg-[var(--color-cordel-ocre)]/15 border-[#c05621]/40 text-[var(--color-cordel-ocre)]'
                : 'bg-white/90 border-encre-noire/30 text-encre-noire/80 hover:bg-stone-100'
            }`}
            title={tooltipText}
          >
            <span className="text-[14px]">{emoji}</span>
            <span className="text-[11px] leading-none">{count}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Bulle individuelle de réponse mémoïsée avec détection de mention,
 * présence en ligne de l'auteur et barre de réactions.
 */
const ThreadMessageItem = React.memo(({
  reply,
  index,
  userId,
  profileData,
  isModeratorOrAdmin = false,
  onDeleteReply,
  onMoveReply,
  onEditReply,
  onReplyToMessage,
  onToggleReaction,
  allUsers = [],
  t,
  formattedTime
}) => {
  const { onlineUserIds, isPresenceEnabled } = usePresenceContext();
  const isCurrentUser = reply.auteurId === userId;
  const isAuthorOnline = isPresenceEnabled !== false && reply.auteurId && onlineUserIds.has(reply.auteurId);

  // Vérification si le message cible des étiquettes ou instruments du membre
  const userPlaysInstrument = (profileData?.instrumentsJoues && profileData.instrumentsJoues.includes(reply.targetTag)) ||
                              (profileData?.instrument === reply.targetTag);
  const userHasTag = profileData?.tags && profileData.tags.includes(reply.targetTag);
  const isTagTargeted = reply.targetTag && (userPlaysInstrument || userHasTag);

  // Vérification si le membre est directement nommé/mentionné avec @Prénom Nom
  const userFullName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim().toLowerCase();
  const userFirstName = (profileData?.prenom || '').trim().toLowerCase();
  const rawMsg = (reply.message || '').toLowerCase();

  const isDirectlyMentioned = Boolean(
    (userFullName && rawMsg.includes(`@${userFullName}`)) ||
    (userFirstName && rawMsg.includes(`@${userFirstName}`)) ||
    (reply.mentionedUserIds && Array.isArray(reply.mentionedUserIds) && reply.mentionedUserIds.includes(userId))
  );

  return (
    <div
      className={`
        flex flex-col w-full max-w-[85%]
        ${isCurrentUser ? 'self-end items-end ml-auto' : 'self-start items-start mr-auto'}
      `}
    >
      <div
        className={`
          border-2 p-3 shadow-[2px_2px_0px_0px_#181716] transition-all relative group
          ${isDirectlyMentioned
            ? 'theme-bg-jaune border-cordel-wood rounded-[6px_10px_6px_10px] scale-[1.02] shadow-[3px_3px_0px_0px_#8b2a1a] ring-2 ring-cordel-wood/40'
            : isTagTargeted
              ? 'theme-bg-jaune border-cordel-wood rounded-[6px_10px_6px_10px] scale-[1.02] shadow-[2.5px_2.5px_0px_0px_#8b2a1a]'
              : isCurrentUser
                ? 'theme-bg-vert border-encre-noire rounded-[10px_2px_8px_10px]'
                : 'bg-[var(--cordel-hover-bg)] border-encre-noire text-encre-noire rounded-[2px_10px_10px_8px]'}
        `}
      >
        {isDirectlyMentioned ? (
          <span className="text-[8.5px] font-black text-cordel-wood block mb-1 uppercase tracking-wider animate-pulse select-none bg-amber-200/70 border border-cordel-wood/40 px-2 py-0.5 rounded-[4px] w-fit shadow-xs">
            🗣️ Vous êtes mentionné(e) dans ce message
          </span>
        ) : isTagTargeted ? (
          <span className="text-[8px] font-black text-cordel-wood block mb-1 uppercase tracking-wider animate-pulse select-none">
            🗣️ Ce message vous concerne ({reply.targetTag})
          </span>
        ) : null}

        <div className="flex justify-between items-start gap-4 mb-1">
          {!isCurrentUser ? (
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-cordel-wood select-none flex items-center gap-1.5">
              <span>{reply.auteurNom}</span>
              {isAuthorOnline && (
                <span className="relative flex h-2 w-2" title="Membre en ligne">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
              )}
            </span>
          ) : <span />}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReplyToMessage && onReplyToMessage(reply)}
              className="text-[10px] font-black cursor-pointer leading-none select-none opacity-70 hover:opacity-100 p-0.5"
              title="Répondre à ce message"
            >
              💬
            </button>
            {isCurrentUser && (
              <button
                type="button"
                onClick={() => onEditReply && onEditReply(index, reply)}
                className="text-[10px] font-black cursor-pointer leading-none select-none opacity-70 hover:opacity-100 p-0.5"
                title="Éditer le message"
              >
                ✏️
              </button>
            )}
            {isModeratorOrAdmin && (
              <button
                type="button"
                onClick={() => onMoveReply && onMoveReply(index, reply)}
                className="text-[10px] font-black cursor-pointer leading-none select-none opacity-70 hover:opacity-100 p-0.5"
                title="Déplacer ce message vers un autre sujet"
              >
                ➡️
              </button>
            )}
            {(isCurrentUser || isModeratorOrAdmin) && (
              <button
                type="button"
                onClick={() => onDeleteReply && onDeleteReply(index)}
                className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer leading-none select-none p-0.5 ml-0.5"
                title={(t && t('common.delete')) || "Supprimer"}
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <FormattedMessageContent content={reply.message} />

        <ReactionBar
          reactions={reply.reactions}
          currentUserId={userId}
          onToggle={(emoji) => onToggleReaction && onToggleReaction(index, emoji)}
          allUsers={allUsers}
        />

        <div className="flex items-center justify-between gap-2 mt-2 select-none">
          {reply.isEdited && (
            <span className="text-[7px] italic font-semibold opacity-50">
              (modifié)
            </span>
          )}
          <span className="text-[7px] font-black opacity-60 block ml-auto">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.index === nextProps.index &&
         prevProps.reply.message === nextProps.reply.message &&
         JSON.stringify(prevProps.reply.reactions) === JSON.stringify(nextProps.reply.reactions) &&
         prevProps.reply.dateCreation === nextProps.reply.dateCreation &&
         prevProps.reply.targetTag === nextProps.reply.targetTag &&
         JSON.stringify(prevProps.reply.mentionedUserIds) === JSON.stringify(nextProps.reply.mentionedUserIds) &&
         prevProps.reply.isEdited === nextProps.reply.isEdited &&
         prevProps.userId === nextProps.userId &&
         prevProps.profileData === nextProps.profileData &&
         prevProps.isModeratorOrAdmin === nextProps.isModeratorOrAdmin &&
         prevProps.formattedTime === nextProps.formattedTime &&
         prevProps.onDeleteReply === nextProps.onDeleteReply &&
         prevProps.onMoveReply === nextProps.onMoveReply &&
         prevProps.onEditReply === nextProps.onEditReply &&
         prevProps.onReplyToMessage === nextProps.onReplyToMessage &&
         prevProps.onToggleReaction === nextProps.onToggleReaction;
});

export default ThreadMessageItem;
