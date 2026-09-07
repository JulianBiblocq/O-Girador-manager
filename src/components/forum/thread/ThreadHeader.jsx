import React from 'react';
import CordelCard from '../../CordelCard';

/**
 * Carte de présentation du sujet de discussion avec badges et actions de modération.
 *
 * @param {Object} props
 * @param {Object} props.thread Document du sujet de discussion
 * @param {boolean} props.isModeratorOrAdmin Statut modérateur / admin
 * @param {boolean} props.isAuthor Indique si l'utilisateur connecté est l'auteur du sujet
 * @param {boolean} props.actionLoading Indique si une action de modération est en cours
 * @param {Function} props.onTogglePin Callback d'épinglage / désépinglage
 * @param {Function} props.onOpenMove Callback d'ouverture de la modale de déplacement
 * @param {Function} props.onDeleteThread Callback de suppression de la discussion
 * @param {Function} props.getCategoryLabel Fonction de libellé de catégorie
 * @param {Function} props.t Fonction de traduction
 */
export default function ThreadHeader({
  thread,
  isModeratorOrAdmin = false,
  isAuthor = false,
  actionLoading = false,
  onTogglePin,
  onOpenMove,
  onDeleteThread,
  getCategoryLabel,
  t
}) {
  if (!thread) return null;

  const categoryBadges = {
    Général: 'ocre',
    Costumes: 'vert',
    Covoiturage: 'bleu',
    Autre: 'kraft'
  };

  const badgeVariant = categoryBadges[thread.categorie] || 'default';
  const authorLabel = (t && t('forum.launchedBy')) || "Lancé par {author}";

  return (
    <CordelCard variant={badgeVariant} useExtremeBorder={true} className="py-4 relative select-none">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {thread.isPinned && (
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] flex items-center gap-1">
            📌 Épinglé
          </span>
        )}
        <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
          {getCategoryLabel ? getCategoryLabel(thread.categorie) : thread.categorie}
        </span>
      </div>

      <h3 className="font-extrabold text-base text-encre-noire leading-tight mt-0.5 mb-2 pr-32">
        {thread.titre}
      </h3>
      <p className="text-[10px] font-bold tracking-wide opacity-75">
        {authorLabel.replace('{author}', thread.auteurNom || 'Inconnu')}
      </p>

      {/* Barre d'outils de modération superposée */}
      {(isModeratorOrAdmin || isAuthor) && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {isModeratorOrAdmin && (
            <button
              type="button"
              onClick={onTogglePin}
              disabled={actionLoading}
              className={`text-[9px] font-black cursor-pointer rounded px-1.5 py-0.5 border shadow-xs transition-colors ${
                thread.isPinned
                  ? 'bg-cordel-wood text-white border-encre-noire'
                  : 'bg-white hover:bg-cordel-bg text-encre-noire border-cordel-master-dark/30'
              }`}
              title={thread.isPinned ? "Désépingler le sujet" : "Épingler le sujet"}
            >
              📌 {thread.isPinned ? "Désépingler" : "Épingler"}
            </button>
          )}

          {isModeratorOrAdmin && (
            <button
              type="button"
              onClick={onOpenMove}
              disabled={actionLoading}
              className="bg-white hover:bg-cordel-bg text-encre-noire border border-cordel-master-dark/30 text-[9px] font-black cursor-pointer rounded px-1.5 py-0.5 shadow-xs"
              title="Déplacer vers un autre salon"
            >
              🚚 Déplacer
            </button>
          )}

          <button
            type="button"
            onClick={onDeleteThread}
            disabled={actionLoading}
            className="text-[var(--theme-primary)] hover:text-white text-[9px] font-black cursor-pointer border border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)] rounded px-1.5 py-0.5 shadow-xs transition-colors"
            title={(t && t('common.delete')) || "Supprimer"}
          >
            🗑️
          </button>
        </div>
      )}
    </CordelCard>
  );
}
