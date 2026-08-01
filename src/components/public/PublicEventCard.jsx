import React from 'react';

/**
 * Composant Carte Billet Public (PublicEventCard) pour le site vitrine.
 * Présente les événements publics avec distinction visuelle si passés
 * et bouton de dépôt de médias (lienDepotMedias) conditionné à la date (aujourd'hui ou passée).
 */
export default function PublicEventCard({ event, onClickDetails, isPast = false }) {
  if (!event) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const dateObj = new Date(event.date);

  // Règle temporelle stricte : Est-ce aujourd'hui ou dans le passé ?
  const isPastOrToday = Boolean(event.date && (event.date <= todayStr || dateObj.getTime() <= Date.now()));

  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date à venir';

  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const imageUrl = event.imageUrl || event.socialThumbnailUrl || '';
  const mediaDepotUrl = (event.lienDepotMedias || event.publicMediaFolderUrl || '').trim();

  // Affichage du bouton de dépôt UNIQUEMENT si la date est aujourd'hui ou passée ET que le lien est renseigné
  const showMediaDepotButton = Boolean(isPastOrToday && mediaDepotUrl);

  const handleMediaClick = (e) => {
    e.stopPropagation(); // Empêche l'ouverture de la modale de détails
  };

  return (
    <div 
      onClick={() => onClickDetails && onClickDetails(event)}
      className={`rounded-xl border transition-all flex flex-col overflow-hidden group cursor-pointer border-t-4 relative ${
        isPast || isPastOrToday 
          ? 'bg-stone-50/90 border-stone-300 shadow-xs hover:shadow border-t-stone-500' 
          : 'bg-white border-stone-200 shadow-sm hover:shadow-md border-t-[var(--public-primary,#D32F2F)]'
      }`}
    >
      {/* Visuel d'illustration / Affiche */}
      {imageUrl && (
        <div className="w-full h-44 overflow-hidden bg-stone-100 relative">
          <img 
            src={imageUrl} 
            alt={event.titre || 'Événement'} 
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isPast ? 'brightness-95 contrast-95' : ''}`}
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded text-white shadow-xs backdrop-blur-xs"
              style={{ backgroundColor: isPast ? '#6B7280' : 'var(--public-secondary, #1976D2)' }}
            >
              {event.type || 'Événement'}
            </span>

            {isPast && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-stone-800 text-amber-300 shadow-xs">
                📸 Prestation passée
              </span>
            )}
          </div>
        </div>
      )}

      {/* Contenu principal du Billet */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-4">
        <div className="flex flex-col gap-2 text-left">
          {!imageUrl && (
            <div className="flex items-center justify-between">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded text-white"
                style={{ backgroundColor: isPast ? '#6B7280' : 'var(--public-secondary, #1976D2)' }}
              >
                {event.type || 'Événement'}
              </span>

              {isPast && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                  Prestation passée
                </span>
              )}
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

        {/* Pied du Billet : Date, Lieu & Bouton de Dépôt de Médias */}
        <div className="flex flex-col gap-2.5 border-t border-stone-200/80 pt-3.5 text-left">
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

          {/* Bouton de dépôt de médias conditionné à la date (Aujourd'hui ou Passée UNIQUEMENT) */}
          {showMediaDepotButton && (
            <div className="pt-1.5" onClick={handleMediaClick}>
              <a
                href={mediaDepotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-600 text-center"
              >
                <span>📸</span>
                <span>Partagez vos photos/vidéos</span>
              </a>
            </div>
          )}

          <div className="mt-1 flex justify-end">
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
