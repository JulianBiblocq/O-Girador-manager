import React from 'react';

/**
 * Composant Détails Publics d'un Événement (PublicEventDetails).
 * Affiche la vue détaillée complète pour les visiteurs du site vitrine.
 * Filtre strictement toutes les informations logistiques internes (covoiturage, vestiaires, présences, séquenceur).
 * 
 * @param {Object} props
 * @param {Object} props.event - Données de l'événement public sélectionné
 * @param {Function} props.onClose - Handler de fermeture de la modale
 */
export default function PublicEventDetails({ event, onClose }) {
  if (!event) return null;

  const dateObj = new Date(event.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date à venir';

  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const imageUrl = event.imageUrl || event.socialThumbnailUrl || '';

  // Génération du lien Google Calendar public
  const generateGoogleCalendarUrl = () => {
    if (isNaN(dateObj.getTime())) return '#';
    const startTimeIso = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDateObj = event.dateFin ? new Date(event.dateFin) : new Date(dateObj.getTime() + 2 * 60 * 60 * 1000);
    const endTimeIso = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const title = encodeURIComponent(event.titre || 'Événement');
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.lieu || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeIso}/${endTimeIso}&details=${details}&location=${location}`;
  };

  // URL Google Maps d'itinéraires/carte
  const mapsSearchUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : event.lieu
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.lieu)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col relative text-left">
        {/* Bouton de Fermeture */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-sm shadow-md cursor-pointer transition-all"
          title="Fermer"
        >
          ✕
        </button>

        {/* Visuel d'illustration Grand Formater */}
        {imageUrl && (
          <div className="w-full h-64 sm:h-80 overflow-hidden bg-stone-100 relative">
            <img 
              src={imageUrl} 
              alt={event.titre} 
              className="w-full h-full object-cover"
            />
            <span 
              className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded text-white shadow-md backdrop-blur-md"
              style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
            >
              {event.type || 'Événement'}
            </span>
          </div>
        )}

        {/* Contenu Rédactionnel */}
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          {!imageUrl && (
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded text-white"
                style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
              >
                {event.type || 'Événement'}
              </span>
            </div>
          )}

          <h2 
            className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: 'var(--public-primary, #D32F2F)'
            }}
          >
            {event.titre}
          </h2>

          {/* Bloc Date, Horaire & Lieu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200/80">
            <div className="flex items-start gap-3">
              <span className="text-xl">📅</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Date & Heure</span>
                <span className="text-sm font-semibold text-stone-800 capitalize">{formattedDate}</span>
                {formattedTime && <span className="text-xs text-stone-600 font-medium">À partir de {formattedTime}</span>}
              </div>
            </div>

            {event.lieu && (
              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Lieu</span>
                  <span className="text-sm font-semibold text-stone-800">{event.lieu}</span>
                  {mapsSearchUrl && (
                    <a
                      href={mapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[var(--public-primary,#D32F2F)] hover:underline mt-0.5 inline-flex items-center gap-1"
                    >
                      <span>Voir sur Google Maps ↗</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description Publique */}
          {event.description && (
            <div className="flex flex-col gap-2">
              <h3 
                className="text-xs font-bold uppercase tracking-wider text-stone-500"
                style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
              >
                À propos de cet événement
              </h3>
              <p 
                className="text-sm sm:text-base text-stone-700 whitespace-pre-line leading-relaxed"
                style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
              >
                {event.description}
              </p>
            </div>
          )}

          {/* Actions & Liens Externes */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6">
            {event.lienSocial && (
              <a
                href={event.lienSocial}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200 transition-all flex items-center gap-2"
              >
                <span>🔗 Lien externe / Réseaux sociaux ↗</span>
              </a>
            )}

            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-white shadow-md hover:brightness-110 active:scale-95 transition-all ml-auto flex items-center gap-2"
              style={{
                backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                color: 'var(--public-btn-text, #FFFFFF)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              <span>📅 Ajouter à mon agenda</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
