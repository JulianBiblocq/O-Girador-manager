import React from 'react';
import CordelCard from '../CordelCard';
import XiloAvatar from '../XiloAvatar';
import { usePresenceContext } from '../../context/PresenceContext';

/**
 * Carte de prévisualisation d'un sujet dans le forum.
 *
 * @param {Object} props Propriétés du composant
 * @param {Object} props.thread Données du sujet
 * @param {Object} props.profileData Profil du membre connecté
 * @param {Function} props.onClick Action d'ouverture de la discussion
 * @param {boolean} props.isModeratorOrAdmin Indique si le membre dispose de droits de modération
 * @param {Function} props.onTogglePin Action d'épinglage
 * @param {Function} props.onMoveThread Action de déplacement de salon
 * @param {Function} props.onDeleteThread Action de suppression de sujet
 * @param {Function} props.t Fonction de traduction
 */
const ForumThreadCard = React.memo(({
  thread,
  profileData,
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

  // Détection du ciblage par instrument/tag
  const userPlaysInstrument = (profileData?.instrumentsJoues && profileData.instrumentsJoues.includes(thread.targetTag)) ||
                               (profileData?.instrument === thread.targetTag);
  const userHasTag = profileData?.tags && profileData.tags.includes(thread.targetTag);
  const isThreadTargeted = thread.targetTag && (userPlaysInstrument || userHasTag);

  return (
    <CordelCard 
      variant={thread.isPinned ? "jaune" : isThreadTargeted ? "jaune" : "default"} 
      useExtremeBorder={false} 
      className={`hover:scale-[1.01] transition-all relative pr-20 cursor-pointer select-none text-left ${
        isThreadTargeted ? 'border-cordel-wood border-2 shadow-[2px_2px_0px_0px_#8b2a1a]' : 'bg-cordel-bg'
      }`}
      onClick={() => onClick(thread)}
    >
      <div className="flex flex-col gap-1 items-start">
        {thread.isPinned && (
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] uppercase tracking-wider mb-1 flex items-center gap-1">
            📌 Épinglé
          </span>
        )}
        {isThreadTargeted && (
          <span className="text-[8px] font-black text-cordel-wood uppercase tracking-wider mb-1 block animate-pulse">
            🗣️ Concernant votre pupitre / tag ({thread.targetTag})
          </span>
        )}

        {/* Categorie & Sondage */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] rotate-0">
            {thread.categorie || 'Général'}
          </span>
          {thread.poll && (
            <span className="theme-stamp-badge text-[7px] rotate-0 bg-amber-100 dark:bg-amber-950/40 text-amber-900 border-amber-600/40">
              📊 Sondage {thread.poll.isClosed ? '(Clôturé)' : ''}
            </span>
          )}
        </div>

        {/* Titre du sujet */}
        <h4 className="font-extrabold text-sm text-encre-noire leading-tight pr-4">
          {thread.titre}
        </h4>

        {/* Métadonnées auteur et date */}
        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-cordel-master-dark/70">
          <span className="flex items-center gap-1">
            <span>Par {thread.auteurNom || 'Membre'}</span>
            {isAuthorOnline && (
              <span className="relative flex h-2 w-2" title="En ligne">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
            )}
          </span>
          <span>•</span>
          <span>Le {formattedDate}</span>
        </div>

        {/* Commandes rapides de modération */}
        {isModeratorOrAdmin && (
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-dashed border-cordel-master-dark/15 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(thread.id, thread.isPinned);
              }}
              className="text-[9px] font-bold px-1.5 py-0.5 bg-cordel-bg-light border border-cordel-master-dark/20 rounded hover:bg-white cursor-pointer"
              title={thread.isPinned ? "Désépingler" : "Épingler"}
            >
              📌 {thread.isPinned ? 'Désépingler' : 'Épingler'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveThread(thread);
              }}
              className="text-[9px] font-bold px-1.5 py-0.5 bg-cordel-bg-light border border-cordel-master-dark/20 rounded hover:bg-white cursor-pointer"
              title="Déplacer vers un autre salon"
            >
              🚚 Déplacer
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteThread(thread);
              }}
              className="text-[9px] font-bold px-1.5 py-0.5 bg-[#8b2a1a]/10 hover:bg-[#8b2a1a] text-[#8b2a1a] hover:text-white border border-[#8b2a1a]/30 rounded cursor-pointer transition-colors"
              title="Supprimer le sujet"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Badge du nombre de réponses */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
        <div className="w-8 h-8 bg-cordel-bg-light border-2 border-encre-noire flex items-center justify-center font-black text-xs rounded-full shadow-[2px_2px_0px_0px_#181716]">
          {repliesCount}
        </div>
        <span className="text-[7px] font-extrabold uppercase mt-1 tracking-wider opacity-60">
          {repliesCount > 1 ? 'réponses' : 'réponse'}
        </span>
      </div>
    </CordelCard>
  );
});

export default ForumThreadCard;
