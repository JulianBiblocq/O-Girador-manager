import React from 'react';

/**
 * Bloc d'affichage du lieu et de la carte interactive Google Maps pour un événement.
 *
 * @param {Object} props Propriétés du composant
 * @param {Object} props.event Données de l'événement
 * @param {boolean} props.isAdmin Détermine si l'utilisateur courant est administrateur
 * @param {Function} props.onOpenMapModal Callback pour l'ouverture de la modale de positionnement carte
 * @param {Function} props.t Fonction de traduction
 */
export default function EventLocationMapBox({ event, isAdmin, onOpenMapModal, t }) {
  if (!event.lieu && !event.latitude && !event.longitude) return null;

  const mapQuery = event.latitude && event.longitude 
    ? `${event.latitude},${event.longitude}` 
    : encodeURIComponent(event.lieu || '');

  return (
    <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light/60 border-2 border-dashed border-cordel-master-dark/20 rounded-[6px] text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
          <span>📍</span> <span>{event.lieu || "Localisation de l'événement"}</span>
        </h4>

        {isAdmin && onOpenMapModal && (
          <button
            type="button"
            onClick={onOpenMapModal}
            className="text-[9.5px] font-bold text-cordel-wood hover:underline bg-cordel-bg px-2 py-0.5 border border-cordel-master-dark/30 rounded cursor-pointer"
            title="Ajuster l'emplacement sur la carte"
          >
            🗺️ Ajuster repère
          </button>
        )}
      </div>

      {/* Indication des coordonnées GPS exactes */}
      {event.latitude && event.longitude && (
        <span className="text-[9.5px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-300/40 w-fit select-none">
          📌 GPS : {Number(event.latitude).toFixed(5)}, {Number(event.longitude).toFixed(5)}
        </span>
      )}

      {/* Carte Google Maps intégrée */}
      <div className="mt-1 border-2 border-encre-noire rounded-[8px] overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] bg-white h-[200px]">
        <iframe
          title="Google Maps Location"
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
        />
      </div>

      {/* Estimation de la distance routière */}
      {event.distanceAllerRetourKm && (
        <p className="text-[10px] font-bold text-cordel-master-dark/80 italic mt-0.5">
          🚗 Distance estimée : ~{event.distanceAllerRetourKm} km A/R depuis la salle
        </p>
      )}
    </div>
  );
}
