import React from 'react';
import EventStampSVG from './EventStampSVG';
import { EVENT_STAMP_OPTIONS, resolveEventStampKey } from '../../utils/eventStampUtils';

/**
 * Galerie de sélection rapide de « Tampon Cordel » à la création et à l'édition d'un événement.
 * Permet de laisser le mode « ✨ Auto (Recommandé) » ou de forcer un tampon xylogravure spécifique.
 */
export default function EventStampSelector({ formData, setFormData, disabled = false }) {
  const activeSelection = formData?.stampIcon || 'auto';
  const resolvedStampKey = resolveEventStampKey(formData);

  const handleSelectStamp = (stampId) => {
    if (disabled || !setFormData) return;
    setFormData((prev) => ({
      ...prev,
      stampIcon: stampId
    }));
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-cordel-bg-light/80 border border-dashed border-cordel-master-dark/25 rounded-[6px_8px_5px_7px] select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood">
            🪵 Tampon Cordel (Vignette sans affiche)
          </span>
          <span className="text-[8.5px] font-semibold text-stone-600">
            Affiché sur le billet d'Agenda lorsqu'aucune image personnalisée n'est définie.
          </span>
        </div>

        {/* Aperçu en direct du tampon actif */}
        <div className="w-11 h-11 rounded-[5px_7px_4px_6px] border-2 border-encre-noire overflow-hidden shrink-0 shadow-[1.5px_1.5px_0px_0px_#181716]">
          <EventStampSVG stampKey={resolvedStampKey} className="w-full h-full" />
        </div>
      </div>

      {/* Rangée de pastilles cliquables */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        {EVENT_STAMP_OPTIONS.map((opt) => {
          const isSelected = activeSelection === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectStamp(opt.id)}
              className={`px-2 py-1 rounded-[4px_6px_3px_5px] text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] font-black'
                  : 'bg-white hover:bg-amber-50 text-encre-noire border-encre-noire/25'
              }`}
            >
              {opt.id !== 'auto' && (
                <span className="w-3.5 h-3.5 rounded-xs overflow-hidden border border-encre-noire/40 inline-block shrink-0">
                  <EventStampSVG stampKey={opt.id} className="w-full h-full" />
                </span>
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

