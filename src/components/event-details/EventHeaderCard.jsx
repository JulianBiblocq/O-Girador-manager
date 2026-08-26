import React from 'react';
import CordelButton from '../CordelButton';
import EventDisciplineBadges from '../agenda/EventDisciplineBadges';

/**
 * En-tête visuel pour la fiche détaillée d'un événement (Titre, badges, dates, illustration/vidéo et boutons de navigation).
 *
 * @param {Object} props Propriétés du composant
 * @param {Object} props.event Données de l'événement
 * @param {Function} props.onClose Callback de fermeture de la vue
 * @param {Function} props.onPrev Callback événement précédent
 * @param {Function} props.onNext Callback événement suivant
 * @param {Function} props.t Fonction de traduction
 */
export default function EventHeaderCard({ event, onClose, onPrev, onNext, t }) {
  const videoUrl = event.socialVideoUrl || event.videoUrl;
  const thumbnailCandidate = event.socialThumbnailUrl || event.imageUrl;
  const isVideo = Boolean(videoUrl || event.socialThumbnailUrl);

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  return (
    <div className="flex flex-col gap-3 text-left relative">
      {/* Tampon de validation distinctif (Règle 4: Vert Validation) */}
      {event.status === 'confirme' && event.wasConfirmedLater && (
        <div className="absolute top-4 right-2 pointer-events-none z-10 select-none">
          <span 
            style={{ transform: 'rotate(-10deg)', color: 'var(--color-cordel-vert)', borderColor: 'var(--color-cordel-vert)' }}
            className="border-[3.5px] px-4 py-1 rounded-lg font-black text-sm tracking-widest uppercase opacity-80 bg-white/5 dark:bg-black/5 shadow-md block"
          >
            VALIDÉ
          </span>
        </div>
      )}

      {/* Barre supérieure : Retour & Navigation Précédent/Suivant */}
      <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2 select-none">
        <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs">
          ← {t('common.back') || "Retour"}
        </CordelButton>

        <div className="flex items-center gap-1.5">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="p-1 px-2 text-xs font-black bg-cordel-bg hover:bg-neutral-200 border border-encre-noire rounded-[3px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
              title="Événement précédent"
            >
              ◀
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="p-1 px-2 text-xs font-black bg-cordel-bg hover:bg-neutral-200 border border-encre-noire rounded-[3px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
              title="Événement suivant"
            >
              ▶
            </button>
          )}
        </div>
      </div>

      {/* Titre principal & Badges de type */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-cordel-wood text-white rounded-[3px_5px] border border-encre-noire/30 shadow-xs">
            {t(`common.type.${event.type}`) || event.type}
          </span>
          <EventDisciplineBadges includesPercussion={event.includesPercussion} includesDance={event.includesDance} size="normal" />
          {event.niveauRequis === 'confirme' && (
            <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 bg-amber-200 text-amber-900 border border-amber-400 rounded">
              ⭐ Confirmés
            </span>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-black text-encre-noire leading-tight">
          {event.titre}
        </h2>

        <p className="text-xs font-bold text-cordel-wood uppercase tracking-wider">
          📅 {formatEventDate(event.date)}
          {event.dateFin && event.dateFin !== event.date && ` ➔ ${formatEventDate(event.dateFin)}`}
        </p>
      </div>

      {/* Visuel principal (Affiche ou Miniature Vidéo) */}
      {thumbnailCandidate && (
        <div 
          className="mt-2 relative rounded-[8px] overflow-hidden border-2 border-encre-noire bg-black/5 shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] group cursor-pointer max-h-[320px] flex items-center justify-center"
          onClick={() => {
            if (videoUrl) {
              window.open(videoUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          title={videoUrl ? `Regarder la vidéo (${videoUrl})` : event.titre}
        >
          <img 
            src={thumbnailCandidate} 
            alt={event.titre} 
            className="w-full h-full object-contain max-h-[320px]" 
          />
          {isVideo && (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-all group-hover:bg-black/50">
              <div className="px-3 py-1.5 bg-red-600/90 text-white rounded-full text-xs font-black shadow-lg border border-white/80 flex items-center gap-1.5 transform group-hover:scale-105 transition-transform">
                <span>▶</span> <span>Regarder la vidéo</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
