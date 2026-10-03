import React, { useState } from 'react';
import CordelButton from '../CordelButton';
import useModalEscape from '../../hooks/useModalEscape';

export default function WorkshopValidationModal({ piecesCibles, onClose, onValidate }) {
  // Par défaut, aucune pièce n'est cochée
  const [selectedPieces, setSelectedPieces] = useState(new Set());

  // Fermeture accessible avec touche Échap
  useModalEscape(true, onClose);

  const handleToggle = (pieceIdx) => {
    const nextSet = new Set(selectedPieces);
    if (nextSet.has(pieceIdx)) {
      nextSet.delete(pieceIdx);
    } else {
      nextSet.add(pieceIdx);
    }
    setSelectedPieces(nextSet);
  };

  const handleToggleAll = () => {
    if (selectedPieces.size === piecesCibles.length) {
      setSelectedPieces(new Set());
    } else {
      setSelectedPieces(new Set(piecesCibles.map((_, idx) => idx)));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // On ne renvoie que les objets piecesCibles cochés
    const validatedPieces = piecesCibles.filter((_, idx) => selectedPieces.has(idx));
    onValidate(validatedPieces);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left select-none">
      <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-encre-noire shadow-2xl overflow-hidden mt-2 sm:mt-0">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/20 flex items-start justify-between gap-3 bg-cordel-bg-light">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-black text-cordel-wood uppercase flex items-center gap-2 break-words">
              <span>✍️</span> Émargement de séance
            </h3>
            <p className="text-[10px] text-stone-600 font-medium">
              Quelles étapes ont réellement été achevées aujourd'hui ?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title="Fermer"
            aria-label="Fermer"
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-stone-100 p-2 rounded border border-stone-200 shrink-0">
              <span className="text-[10px] font-bold uppercase">Sélection rapide :</span>
              <button 
                type="button" 
                onClick={handleToggleAll}
                className="text-[10px] font-bold text-cordel-wood hover:underline cursor-pointer"
              >
                {selectedPieces.size === piecesCibles.length ? "Tout décocher" : "Tout cocher"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {piecesCibles.map((piece, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded border transition-colors cursor-pointer ${
                    selectedPieces.has(idx) 
                      ? 'bg-amber-50 border-cordel-ocre' 
                      : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedPieces.has(idx)}
                    onChange={() => handleToggle(idx)}
                    className="mt-0.5 w-4 h-4 text-cordel-ocre focus:ring-cordel-ocre"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black text-encre-noire uppercase">
                        {piece.nomProjet} — {piece.nomPiece}
                      </span>
                      <span className="text-[9px] bg-cordel-master-dark text-white px-2 py-0.5 rounded-full font-bold">
                        Étape {piece.etapeCibleIndex + 1}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-700 italic">Objectif : {piece.titreEtape}</span>
                  </div>
                </label>
              ))}
              
              {piecesCibles.length === 0 && (
                <p className="text-[10px] text-stone-500 italic text-center">Aucune pièce n'était au programme de cette séance.</p>
              )}
            </div>
          </div>

          {/* 3. Footer buttons (Fixe) */}
          <div className="shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 bg-[var(--theme-bg)] flex justify-end gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <CordelButton variant="secondary" type="button" onClick={onClose} className="shrink-0">
              Annuler
            </CordelButton>
            <CordelButton variant="vert" type="submit" disabled={selectedPieces.size === 0} className="shrink-0">
              Valider ({selectedPieces.size})
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
