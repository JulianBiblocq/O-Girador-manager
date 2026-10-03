import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import CordelButton from '../CordelButton';
import useModalEscape from '../../hooks/useModalEscape';

/**
 * Modale de sélection multiple de photos depuis la bibliothèque du Varal
 * pour intégration dans la publication réseaux sociaux.
 */
export default function StudioVaralPickerModal({ isOpen, onClose, varalImages = [], onSelectImages }) {
  const { t } = useTranslation();
  const [selectedUrls, setSelectedUrls] = useState([]);

  // Fermeture accessible avec touche Échap
  useModalEscape(isOpen, onClose);

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
      <div className="bg-[var(--theme-bg)] border-2 border-encre-noire rounded-lg max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-[4px_4px_0px_0px_#181716] overflow-hidden animate-fade-in mt-2 sm:mt-0">
        
        {/* En-tête de la modale */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex items-start justify-between gap-3 bg-cordel-bg-light">
          <div className="flex-1 min-w-0 pr-2 flex items-start gap-2">
            <span className="text-lg">📂</span>
            <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-encre-noire break-words">
              {t('studio.photos.selectionnerDesPhotosDuVaral')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-stone-500 hover:text-cordel-wood hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Grille des photos du Varal */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {varalImages.length === 0 ? (
            <p className="col-span-full text-center py-8 text-xs italic text-stone-500">
              {t('studio.photos.aucuneImageTrouveeDansLa')}
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
        <div className="shrink-0 p-3 sm:p-4 border-t-2 border-dashed border-cordel-master-dark/20 bg-[var(--theme-bg)] flex items-center justify-between gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <span className="text-[10px] font-bold text-cordel-master-dark">
            {selectedUrls.length} {t('studio.photos.photosSelectionnees')}
          </span>
          <div className="flex gap-2">
            <CordelButton
              variant="default"
              size="small"
              onClick={onClose}
              className="text-xs px-3 py-1.5 font-bold shrink-0"
            >
              {t('studio.photos.annuler')}
            </CordelButton>
            <CordelButton
              variant="vert"
              size="small"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="text-xs px-4 py-1.5 font-black uppercase tracking-wider shrink-0"
            >
              {t('studio.photos.ajouter')} ({selectedUrls.length})
            </CordelButton>
          </div>
        </div>

      </div>
    </div>
  );
}
