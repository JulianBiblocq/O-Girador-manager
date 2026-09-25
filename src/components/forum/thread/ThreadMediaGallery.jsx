import React, { useState } from 'react';

/**
 * Galerie interactive multi-photos pour le Forum (Porte-Voix) :
 * Carrousel de visionnage pour le Bureau, miniatures et agrandissement Lightbox.
 */
export default function ThreadMediaGallery({ mediaUrls = [], initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const currentUrl = mediaUrls[currentIndex] || mediaUrls[0];
  const total = mediaUrls.length;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev < total - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col gap-2 w-full select-none">
      {/* Cadre principal de visionnage */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="relative aspect-square w-full rounded-lg border-2 border-encre-noire overflow-hidden bg-black/5 shadow-md group cursor-zoom-in touch-manipulation"
      >
        <img
          src={currentUrl}
          alt={`Photo ${currentIndex + 1}`}
          className="w-full h-full object-contain bg-stone-900/5 transition-transform md:group-hover:scale-[1.01]"
          loading="eager"
          decoding="sync"
        />

        {/* Boutons de navigation carrousel */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center font-black text-sm hover:bg-black/80 transition-colors shadow-md cursor-pointer"
              title="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center font-black text-sm hover:bg-black/80 transition-colors shadow-md cursor-pointer"
              title="Photo suivante"
            >
              ›
            </button>

            {/* Compteur de position */}
            <span className="absolute top-2 right-2 bg-black/75 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs">
              📸 {currentIndex + 1} / {total}
            </span>
          </>
        )}

        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Cliquer pour agrandir
        </div>
      </div>

      {/* Rangée de miniatures cliquables */}
      {total > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {mediaUrls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-12 h-12 rounded border-2 shrink-0 overflow-hidden cursor-pointer transition-all ${
                idx === currentIndex
                  ? 'border-encre-noire ring-2 ring-[var(--color-cordel-ocre)] scale-105 shadow-md'
                  : 'border-stone-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Modale Lightbox plein écran */}
      {isLightboxOpen && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={currentUrl}
              alt={`Agrandissement ${currentIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg border-2 border-white/20 shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between w-full text-white text-xs font-bold px-2">
              <span>Photo {currentIndex + 1} sur {total}</span>
              <div className="flex gap-2">
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px]"
                >
                  Ouvrir l'original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="px-3 py-1 bg-red-800/80 hover:bg-red-800 rounded text-[11px] font-black cursor-pointer"
                >
                  Fermer ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
