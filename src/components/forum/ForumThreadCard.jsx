import React from 'react';
import CordelCard from '../CordelCard';
import { usePresenceContext } from '../../context/PresenceContext';
import { countThreadUnreadMessages, getLocalReadThreads } from '../../utils/forumUnreadUtils';

/**
 * Carte de prévisualisation d'un sujet dans le forum.
 *
 * @param {Object} props Propriétés du composant
 * @param {Object} props.thread Données du sujet
 * @param {Object} props.user Utilisateur connecté
 * @param {Object} props.profileData Profil du membre connecté
 * @param {Object} [props.effectiveReadThreads] Horodatages effectifs de lecture
 * @param {Function} props.onClick Action d'ouverture de la discussion
 * @param {boolean} props.isModeratorOrAdmin Indique si le membre dispose de droits de modération
 * @param {Function} props.onTogglePin Action d'épinglage
 * @param {Function} props.onMoveThread Action de déplacement de salon
 * @param {Function} props.onDeleteThread Action de suppression de sujet
 * @param {Function} props.t Fonction de traduction
 */
const ForumThreadCard = React.memo(({
  thread,
  user,
  profileData,
  effectiveReadThreads,
  onClick,
  isModeratorOrAdmin,
  onTogglePin,
  onMoveThread,
  onDeleteThread,
  t
}) => {
  const { onlineUserIds, isPresenceEnabled } = usePresenceContext();
  const isAuthorOnline = isPresenceEnabled !== false && thread.auteurId && onlineUserIds.has(thread.auteurId);

  const dateCreationObj = new Date(thread.dateCreation);
  const formattedDate = isNaN(dateCreationObj.getTime())
    ? ''
    : dateCreationObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  
  const repliesCount = thread.reponses ? thread.reponses.length - 1 : 0;

  // Calcul du nombre de messages non lus pour l'utilisateur
  const currentUserId = user?.uid || profileData?.uid || profileData?.id;
  const userLastReadDate = effectiveReadThreads?.[thread.id] || profileData?.readThreads?.[thread.id] || getLocalReadThreads(currentUserId)[thread.id];
  const unreadCount = countThreadUnreadMessages(
    thread,
    currentUserId,
    userLastReadDate
  );
  const isUnread = unreadCount > 0;

  // Détection du ciblage par instrument/tag
  const userPlaysInstrument = (profileData?.instrumentsJoues && profileData.instrumentsJoues.includes(thread.targetTag)) ||
                               (profileData?.instrument === thread.targetTag);
  const userHasTag = profileData?.tags && profileData.tags.includes(thread.targetTag);
  const isThreadTargeted = thread.targetTag && (userPlaysInstrument || userHasTag);

  return (
    <CordelCard 
      variant="default"
      useExtremeBorder={false}
      onClick={() => onClick(thread)}
      className={`p-3.5 transition-all cursor-pointer relative hover:border-cordel-wood ${
        isUnread 
          ? 'bg-cordel-accent-light/15 border-l-4 border-l-cordel-accent-dark font-medium shadow-sm' 
          : 'bg-cordel-bg'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {thread.isPinned && (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                📌 {t('forum.pinned', "Épinglé")}
              </span>
            )}
            
            {thread.channelId ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cordel-bg-light text-cordel-wood border border-cordel-wood/30">
                📁 {thread.channelName || thread.categorie || 'Salon'}
              </span>
            ) : thread.categorie && (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cordel-bg-light text-cordel-wood border border-cordel-wood/30">
                {thread.categorie}
              </span>
            )}

            {isThreadTargeted && (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cordel-accent/20 text-cordel-wood border border-cordel-accent">
                🎯 {thread.targetTag}
              </span>
            )}

            {isUnread && (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cordel-accent text-cordel-master-light animate-pulse">
                {unreadCount > 1 
                  ? `${unreadCount} ${t('forum.newRepliesBadge', "nouveaux messages")}`
                  : t('forum.newReplyBadge', "Nouveau message")}
              </span>
            )}
          </div>

          <h3 className={`text-sm tracking-tight truncate ${isUnread ? 'font-black text-cordel-master-dark' : 'font-bold text-cordel-wood'}`}>
            {thread.titre}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-[11px] opacity-75">
            <span className="flex items-center gap-1">
              <span 
                className={`w-2 h-2 rounded-full inline-block ${
                  isAuthorOnline ? 'bg-emerald-500 shadow-sm' : 'bg-cordel-wood/40'
                }`} 
                title={isAuthorOnline ? t('forum.userOnline', "En ligne") : t('forum.userOffline', "Hors-ligne")}
              />
              <span className="font-semibold truncate max-w-[120px]">{thread.auteurNom || 'Anonyme'}</span>
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="font-semibold">
              💬 {repliesCount} {repliesCount > 1 ? t('forum.repliesCountPlural', "réponses") : t('forum.repliesCountSingular', "réponse")}
            </span>
            {thread.poll && (
              <>
                <span>•</span>
                <span className="font-semibold text-cordel-wood">📊 {t('forum.pollBadge', "Sondage")}</span>
              </>
            )}
          </div>
        </div>

        {isModeratorOrAdmin && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onTogglePin(thread.id, thread.isPinned)}
              title={thread.isPinned ? t('forum.unpin', "Désépingler") : t('forum.pin', "Épingler")}
              className={`p-1 rounded text-xs transition-colors ${
                thread.isPinned 
                  ? 'text-amber-800 bg-amber-100 hover:bg-amber-200' 
                  : 'opacity-40 hover:opacity-100 hover:bg-cordel-bg-light'
              }`}
            >
              📌
            </button>
            <button
              type="button"
              onClick={() => onMoveThread(thread)}
              title={t('forum.move', "Déplacer")}
              className="p-1 rounded text-xs opacity-40 hover:opacity-100 hover:bg-cordel-bg-light transition-colors"
            >
              📁
            </button>
            <button
              type="button"
              onClick={() => onDeleteThread(thread)}
              title={t('forum.delete', "Supprimer")}
              className="p-1 rounded text-xs opacity-40 hover:opacity-100 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </CordelCard>
  );
});

export default ForumThreadCard;
