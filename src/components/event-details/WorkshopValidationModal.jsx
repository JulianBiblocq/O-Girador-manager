import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function WorkshopValidationModal({ piecesCibles, onClose, onValidate }) {
  // Par défaut, aucune pièce n'est cochée
  const [selectedPieces, setSelectedPieces] = useState(new Set());

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-lg">
        <CordelCard variant="default" className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/20 pb-3">
            <div>
              <h3 className="text-sm font-black text-cordel-wood uppercase flex items-center gap-2">
                <span>✍️</span> Émargement de séance
              </h3>
              <p className="text-[10px] text-stone-600 font-medium">
                Quelles étapes ont réellement été achevées aujourd'hui ?
              </p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer">×</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex justify-between items-center bg-stone-100 p-2 rounded border border-stone-200">
              <span className="text-[10px] font-bold uppercase">Sélection rapide :</span>
              <button 
                type="button" 
                onClick={handleToggleAll}
                className="text-[10px] font-bold text-cordel-wood hover:underline"
              >
                {selectedPieces.size === piecesCibles.length ? "Tout décocher" : "Tout cocher"}
              </button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto flex flex-col gap-2">
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

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton variant="secondary" type="button" onClick={onClose}>
                Annuler
              </CordelButton>
              <CordelButton variant="vert" type="submit" disabled={selectedPieces.size === 0}>
                Valider ({selectedPieces.size})
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
