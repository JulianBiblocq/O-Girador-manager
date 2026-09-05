import React, { useState } from 'react';
import { getValidEventThumbnailUrl } from '../../utils/videoUtils';

/**
 * Composant d'affichage résilient pour la vignette ou miniature d'un événement.
 * 
 * Avantages techniques :
 * 1. Filtrage préventif des URLs de CDN de réseaux sociaux (Facebook/Instagram) expirées (évite l'erreur HTTP 403 en console).
 * 2. Mémorisation de l'erreur via l'état React pour ne jamais retenter de requêter une image morte lors des re-renders.
 * 3. Repli visuel thématique Cordel élégant (icône de discipline ou type d'événement).
 * 4. Badge filigrane vidéo Play si un lien vidéo est associé.
 *
 * @param {Object} props
 * @param {Object} props.event - Objet événement Firestore
 * @param {Function} [props.onSelect] - Callback facultatif lors du clic
 * @param {string} [props.className] - Classes CSS personnalisées
 */
export default function EventThumbnail({ event, onSelect, className = '' }) {
  const [hasError, setHasError] = useState(false);

  if (!event) return null;

  const videoUrl = event.socialVideoUrl || event.videoUrl;
  const isVideo = Boolean(videoUrl || event.socialThumbnailUrl);
  
  // Résolution sécurisée de l'URL (élimine d'office les liens fbcdn expirés)
  const thumbnailUrl = !hasError ? getValidEventThumbnailUrl(event) : null;

  const handleContainerClick = (e) => {
    if (videoUrl) {
      e.stopPropagation();
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } else if (onSelect) {
      onSelect(e);
    }
  };

  const getFallbackIcon = () => {
    switch (event.type) {
      case 'prestation':
        return '🎭';
      case 'repetition':
        return '🥁';
      case 'stage':
        return '🎓';
      case 'atelier':
        return '🔨';
      case 'reunion':
        return '📅';
      default:
        return '📆';
    }
  };

  return (
    <div
      className={`
        w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded-[6px_8px_5px_7px] border border-encre-noire/30 bg-[#fdfaf2] dark:bg-[#1f1b18] 
        overflow-hidden flex items-center justify-center select-none shadow-[1px_1px_0px_0px_#181716] relative group cursor-pointer
        ${className}
      `}
      onClick={handleContainerClick}
      title={videoUrl ? `Regarder la vidéo (${videoUrl})` : "Visuel de l'événement"}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={event.title || "Visuel"}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      ) : (
        <span className="text-lg opacity-40 grayscale select-none pointer-events-none">
          {getFallbackIcon()}
        </span>
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
