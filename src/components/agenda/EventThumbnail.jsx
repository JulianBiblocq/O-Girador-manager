import React, { useState } from 'react';
import { getValidEventThumbnailUrl } from '../../utils/videoUtils';
import { resolveEventStampKey } from '../../utils/eventStampUtils';
import EventStampSVG from './EventStampSVG';

/**
 * Composant d'affichage résilient pour la vignette ou miniature d'un événement :
 * 1. Affiche l'image personnalisée (upload, Varal ou URL) si disponible et valide.
 * 2. Sinon, affiche automatiquement le tampon vectoriel Cordel (EventStampSVG) correspondant
 *    au choix manuel (`stampIcon`) ou aux propriétés de l'événement (Apito, Alfaia, Caixa, Gonguê, Agbê, Danse, Prestation, Stage, Réunion, Lutherie).
 * 3. Ajoute le badge Play filigrane si un lien vidéo est associé.
 */
export default function EventThumbnail({ event, onSelect, className = '' }) {
  const [hasError, setHasError] = useState(false);

  if (!event) return null;

  const videoUrl = event.socialVideoUrl || event.videoUrl;
  const isVideo = Boolean(videoUrl || event.socialThumbnailUrl);

  // Résolution sécurisée de l'URL (élimine d'office les liens fbcdn expirés)
  const thumbnailUrl = !hasError ? getValidEventThumbnailUrl(event) : null;
  const resolvedStampKey = resolveEventStampKey(event);

  const handleContainerClick = (e) => {
    if (videoUrl) {
      e.stopPropagation();
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } else if (onSelect) {
      onSelect(e);
    }
  };

  return (
    <div
      className={`
        w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-[6px_8px_5px_7px] border-2 border-encre-noire bg-[#F4ECD8]
        overflow-hidden flex items-center justify-center select-none shadow-[1.5px_1.5px_0px_0px_#181716] relative group cursor-pointer
        ${className}
      `}
      onClick={handleContainerClick}
      title={videoUrl ? `Regarder la vidéo (${videoUrl})` : "Visuel de l'événement"}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={event.titre || event.title || 'Visuel'}
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      ) : (
        <EventStampSVG
          stampKey={resolvedStampKey}
          className="w-full h-full group-hover:scale-105 transition-transform pointer-events-none"
        />
      )}

      {/* Badge Play filigrane discret pour les événements intégrant un lien vidéo */}
      {isVideo && (
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-all group-hover:bg-black/50 pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[10px] font-black shadow-md border border-white/70 transform group-hover:scale-110 transition-transform">
            ▶
          </div>
        </div>
      )}
    </div>
  );
}
