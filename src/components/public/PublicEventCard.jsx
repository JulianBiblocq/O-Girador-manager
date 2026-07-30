import React from 'react';

/**
 * Composant Carte Billet Public (PublicEventCard) pour le site vitrine.
 * Présente les événements publics sous forme de ticket/billet épuré
 * débarrassé de toute information logistique interne (RSVP, présences, tenues, covoiturage).
 * 
 * @param {Object} props
 * @param {Object} props.event - Données de l'événement public
 * @param {Function} props.onClickDetails - Handler au clic pour ouvrir le composant PublicEventDetails
 */
export default function PublicEventCard({ event, onClickDetails }) {
  if (!event) return null;

  const dateObj = new Date(event.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date à venir';

  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const imageUrl = event.imageUrl || event.socialThumbnailUrl || '';

  return (
    <div 
      onClick={() => onClickDetails && onClickDetails(event)}
      className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer border-t-4"
      style={{ borderTopColor: 'var(--public-primary, #D32F2F)' }}
    >
      {/* Visuel d'illustration / Affiche (si présente) */}
      {imageUrl && (
        <div className="w-full h-44 overflow-hidden bg-stone-100 relative">
          <img 
            src={imageUrl} 
            alt={event.titre || 'Événement'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span 
            className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded text-white shadow-xs backdrop-blur-xs"
            style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
          >
            {event.type || 'Événement'}
          </span>
        </div>
      )}

      {/* Contenu principal du Billet */}
      <div className="p-6 flex flex-col justify-between flex-1 gap-4">
        <div className="flex flex-col gap-2">
          {!imageUrl && (
            <div className="flex items-center justify-between">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded text-white"
                style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
              >
                {event.type || 'Événement'}
              </span>
            </div>
          )}

          <h3 
            className="text-lg font-bold text-stone-900 leading-tight group-hover:text-[var(--public-primary)] transition-colors"
            style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
          >
            {event.titre}
          </h3>

          {event.description && (
            <p 
              className="text-xs text-stone-600 line-clamp-2 leading-relaxed"
              style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
            >
              {event.description}
            </p>
          )}
        </div>

        {/* Pied du Billet : Date, Heure & Lieu */}
        <div className="flex flex-col gap-2 border-t border-stone-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-stone-700 font-medium">
            <span>📅</span>
            <span className="capitalize">{formattedDate} {formattedTime ? `à ${formattedTime}` : ''}</span>
          </div>

          {event.lieu && (
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span>📍</span>
              <span className="truncate">{event.lieu}</span>
            </div>
          )}

          <div className="mt-2 flex justify-end">
            <span 
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              style={{ 
                color: 'var(--public-primary, #D32F2F)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              En savoir plus ➔
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
