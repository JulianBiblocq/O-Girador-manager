import React, { useState } from 'react';
import CordelButton from '../CordelButton';

/**
 * Modale de sélection multiple de photos depuis la bibliothèque du Varal
 * pour intégration dans la publication réseaux sociaux.
 */
export default function StudioVaralPickerModal({ isOpen, onClose, varalImages = [], onSelectImages }) {
  const [selectedUrls, setSelectedUrls] = useState([]);

  if (!isOpen) return null;

  const toggleSelect = (url) => {
    setSelectedUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleConfirm = () => {
    const chosenImages = varalImages.filter(img => selectedUrls.includes(img.fileUrl));
    onSelectImages(chosenImages);
    setSelectedUrls([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-cordel-bg border-2 border-encre-noire rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-[4px_4px_0px_0px_#181716] overflow-hidden animate-fade-in">
        
        {/* En-tête de la modale */}
        <div className="p-3.5 border-b-2 border-dashed border-cordel-master-dark/25 flex items-center justify-between bg-cordel-bg-light">
          <div className="flex items-center gap-2">
            <span className="text-lg">📂</span>
            <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-encre-noire">
              Sélectionner des photos du Varal
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-cordel-wood font-black text-base px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Grille des photos du Varal */}
        <div className="p-3.5 overflow-y-auto flex-1 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {varalImages.length === 0 ? (
            <p className="col-span-full text-center py-8 text-xs italic text-stone-500">
              Aucune image trouvée dans la bibliothèque du Varal.
            </p>
          ) : (
            varalImages.map((img) => {
              const isSelected = selectedUrls.includes(img.fileUrl);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => toggleSelect(img.fileUrl)}
                  className={`group relative aspect-square rounded border-2 overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 ring-3 ring-[var(--color-cordel-vert)] scale-[1.02] shadow-md'
                      : 'border-stone-300 hover:border-encre-noire hover:scale-[1.01]'
                  }`}
                >
                  <img
                    src={img.fileUrl}
                    alt={img.titre || 'Photo Varal'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-encre-noire ${
                    isSelected
                      ? 'bg-[var(--color-cordel-vert)] text-white shadow-xs'
                      : 'bg-white/80 text-transparent group-hover:text-stone-400'
                  }`}>
                    ✓
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[8px] text-white font-semibold truncate text-left">
                    {img.titre}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Barre d'action */}
        <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-cordel-master-dark">
            {selectedUrls.length} photo(s) sélectionnée(s)
          </span>
          <div className="flex gap-2">
            <CordelButton
              variant="default"
              size="small"
              onClick={onClose}
              className="text-xs px-3 py-1.5 font-bold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              variant="vert"
              size="small"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="text-xs px-4 py-1.5 font-black uppercase tracking-wider"
            >
              Ajouter ({selectedUrls.length})
            </CordelButton>
          </div>
        </div>

      </div>
    </div>
  );
}
