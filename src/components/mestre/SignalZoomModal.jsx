import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale de zoom et d'inspection haute définition d'un geste du Mestre (mestre_signals).
 * Permet aux musiciens et élèves de visualiser précisément le geste de commandement.
 *
 * @param {boolean} isOpen - État d'affichage de la modale
 * @param {Function} onClose - Callback de fermeture
 * @param {Object|null} signal - Données du signal { id, name, imageUrl, description, type }
 */
export default function SignalZoomModal({ isOpen, onClose, signal }) {
  if (!isOpen || !signal) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 md:p-6 animate-fadeIn select-none">
      <CordelCard className="w-full max-w-md p-4 md:p-6 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[90vh] overflow-y-auto text-left">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-wood/30 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">✋</span>
            <div>
              <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-encre-noire">
                {signal.name || "Signe du Mestre"}
              </h3>
              {signal.type && (
                <span className="text-[9.5px] font-black uppercase text-cordel-master-dark/60">
                  Signal {signal.type}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-black text-lg px-1.5 py-0.5 cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Image grand format du geste */}
        <div className="relative w-full aspect-square max-h-80 bg-stone-900 rounded-[6px_10px_7px_9px] border-2 border-encre-noire overflow-hidden shadow-inner flex items-center justify-center">
          {signal.imageUrl ? (
            <img
              src={signal.imageUrl}
              alt={signal.name || "Signe du Mestre"}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-4xl opacity-50">✋</span>
          )}
        </div>

        {/* Description et intention du geste */}
        {signal.description && (
          <p className="text-xs text-encre-noire/85 bg-amber-50/70 p-2.5 rounded border border-dashed border-amber-300 italic leading-relaxed">
            💡 {signal.description}
          </p>
        )}

        {/* Bouton de fermeture */}
        <div className="flex justify-end pt-1">
          <CordelButton
            type="button"
            variant="default"
            useExtremeBorder={false}
            onClick={onClose}
            className="py-1 px-4 text-xs font-black uppercase tracking-wider bg-stone-100 hover:bg-stone-200"
          >
            Fermer
          </CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
