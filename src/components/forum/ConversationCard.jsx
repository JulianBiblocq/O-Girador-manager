import React from 'react';
import CordelCard from '../CordelCard';
import XiloAvatar from '../XiloAvatar';

/**
 * Composant ConversationCard
 * Carte présentant une discussion dans l'onglet des messages privés (directe ou groupe).
 * Gère l'affichage contextuel du titre, des avatars, du dernier message et des pastilles de non-lus.
 */
export default function ConversationCard({
  conversation,
  currentUserId,
  usersMap = {},
  onClick
}) {
  const isGroup = conversation.type === 'group';

  // Identification du partenaire pour les discussions directes
  let title = conversation.name || 'Discussion de groupe';
  let partner = null;

  if (!isGroup) {
    const otherId = (conversation.participantIds || []).find((id) => id !== currentUserId);
    partner = usersMap[otherId] || { id: otherId };
    title = `${partner.prenom || ''} ${partner.nom || ''}`.trim() || partner.email || 'Membre';
  }

  // Formatage de l'heure du dernier message ou de la création
  const dateObj = new Date(conversation.lastMessage?.timestamp || conversation.updatedAt || conversation.createdAt);
  const formattedTime = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
      ' ' +
      dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Dernier message
  const lastMsg = conversation.lastMessage;
  const isMe = lastMsg?.senderId === currentUserId;
  let lastMessageText = 'Aucun message pour le moment.';
  if (lastMsg?.content) {
    if (isMe) {
      lastMessageText = `Vous : ${lastMsg.content}`;
    } else if (isGroup && lastMsg.senderName) {
      lastMessageText = `${lastMsg.senderName.split(' ')[0]} : ${lastMsg.content}`;
    } else {
      lastMessageText = lastMsg.content;
    }
  }

  const isUnread = !!conversation.isUnread;

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={false}
      className="hover:scale-[1.01] transition-all relative pr-16 cursor-pointer flex items-center gap-3 bg-cordel-bg p-3"
      onClick={onClick}
    >
      {/* Avatar ou icône de groupe */}
      {isGroup ? (
        <div className="w-10 h-10 rounded-full bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center text-base shadow-xs shrink-0 select-none">
          👥
        </div>
      ) : (
        <XiloAvatar src={partner?.photoURL} name={title} size={40} />
      )}

      {/* Détails du texte */}
      <div className="flex flex-col gap-0.5 items-start text-left flex-grow min-w-0 pr-2 select-none">
        <div className="flex items-center gap-1.5 max-w-full">
          <span className="font-extrabold text-xs text-encre-noire truncate">
            {title}
          </span>
          {isGroup && (
            <span className="text-[9px] font-bold opacity-60 shrink-0">
              ({conversation.participantIds?.length || 0})
            </span>
          )}
        </div>

        <p
          className={`text-[11px] truncate max-w-full text-cordel-master-dark ${
            isUnread ? 'font-black text-encre-noire' : 'font-semibold opacity-75'
          }`}
        >
          {lastMessageText}
        </p>

        <span className="text-[8px] font-black uppercase tracking-wider opacity-50 mt-0.5">
          {formattedTime}
        </span>
      </div>

      {/* Badge indicateur de message non lu */}
      {isUnread && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center select-none">
          <span className="w-5 h-5 bg-red-600 text-white flex items-center justify-center font-black text-[9px] rounded-full shadow-[1.5px_1.5px_0px_0px_#181716] animate-pulse">
            !
          </span>
        </div>
      )}
    </CordelCard>
  );
}
