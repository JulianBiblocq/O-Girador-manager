import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * PieceTutorialModal displays detailed fabrication and tailoring instructions
 * for a specific costume piece in the Atelier Couture.
 *
 * @param {Object} props
 * @param {Object} props.piece The costume piece object (name, tutorialNotes, etc.)
 * @param {Object} [props.workshop] Optional linked workshop tutorial object
 * @param {Function} props.onClose Callback to close the modal
 */
export default function PieceTutorialModal({ piece, workshop, onClose }) {
  if (!piece) return null;

  const title = workshop?.titre || piece.name || "Tutoriel Couture";
  const content = workshop?.content || piece.tutorialNotes || "Aucune instruction spécifique enregistrée pour cette pièce.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-3">
            <div>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase tracking-wider mb-1 inline-block">
                🧵 Atelier Couture
              </span>
              <h3 className="font-cactus font-black text-lg text-encre-noire tracking-wide">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-base font-extrabold text-cordel-wood hover:text-red-600 transition-colors p-1"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Piece info badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-cordel-wood">Pièce :</span>
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2 py-0.5">
              {piece.name}
            </span>
            {piece.isMandatory ? (
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-2 py-0.5">
                ★ Obligatoire
              </span>
            ) : (
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] px-2 py-0.5 opacity-80">
                Optionnelle
              </span>
            )}
          </div>

          {/* Tutorial content */}
          <div className="bg-white/50 dark:bg-black/20 p-4 border border-dashed border-cordel-master-dark/20 rounded text-xs text-encre-noire whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {content}
          </div>

          {/* Footer button */}
          <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={onClose}
              className="py-1.5 px-4 text-xs font-black uppercase tracking-wider"
            >
              Fermer la fiche
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
