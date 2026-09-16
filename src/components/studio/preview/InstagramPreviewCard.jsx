import React, { useState } from 'react';

/**
 * Aperçu réaliste d'une publication au format Carrousel Instagram
 */
export default function InstagramPreviewCard({
  mediaList = [],
  branding = null,
  selectedEvent = null,
  publicationText = ''
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const photos = mediaList.length > 0 
    ? mediaList 
    : [{ id: 'empty', url: null, name: 'Vide' }];
  const currentPhoto = photos[currentIndex] || photos[0];

  const assocName = branding?.nom || 'Samambaia Maracatu';
  const logoUrl = branding?.logoUrl || '/Pictures/tambour.png';
  const locationName = selectedEvent?.lieu || '';

  const formatTextWithHashtags = (text) => {
    if (!text) return '(Légende en attente de rédaction...)';
    const parts = text.split(/(#[a-zA-Z0-9_\u00C0-\u00FF]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return <span key={idx} className="text-blue-900 font-semibold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-[380px] bg-white border border-stone-300 rounded-lg overflow-hidden shadow-md flex flex-col text-left font-sans select-none text-neutral-900">
      {/* En-tête profil Instagram */}
      <div className="flex items-center justify-between p-2.5 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full border border-stone-300 object-cover" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-black tracking-tight">{assocName}</span>
            {locationName && <span className="text-[9.5px] text-stone-500 font-medium">{locationName}</span>}
          </div>
        </div>
        <span className="text-stone-400 text-sm font-bold">•••</span>
      </div>

      {/* Cadre de photo ou carrousel */}
      <div className="relative aspect-square w-full bg-stone-100 flex items-center justify-center overflow-hidden">
        {currentPhoto?.url ? (
          <img src={currentPhoto.url} alt="Photo" className="w-full h-full object-cover" />
        ) : (
          <div className="p-4 text-center text-xs text-stone-400 font-bold">
            Ajoutez au moins une photo pour prévisualiser
          </div>
        )}

        {/* Flèches et compteur de carrousel multi-photos */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center font-bold text-xs disabled:opacity-0 transition-opacity cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={currentIndex === photos.length - 1}
              onClick={() => setCurrentIndex(prev => Math.min(photos.length - 1, prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center font-bold text-xs disabled:opacity-0 transition-opacity cursor-pointer"
            >
              ›
            </button>
            <span className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {currentIndex + 1}/{photos.length}
            </span>
          </>
        )}
      </div>

      {/* Barre d'actions Instagram */}
      <div className="p-2.5 flex items-center justify-between text-base">
        <div className="flex items-center gap-3">
          <span className="cursor-pointer hover:scale-110 transition-transform">❤️</span>
          <span className="cursor-pointer hover:scale-110 transition-transform">💬</span>
          <span className="cursor-pointer hover:scale-110 transition-transform">✈️</span>
        </div>
        {photos.length > 1 && (
          <div className="flex gap-1 items-center">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'bg-blue-600 w-2 h-2' : 'bg-stone-300'
                }`}
              />
            ))}
          </div>
        )}
        <span className="cursor-pointer hover:scale-110 transition-transform">🔖</span>
      </div>

      {/* Légende de la publication */}
      <div className="px-3 pb-3 text-xs leading-relaxed max-h-[140px] overflow-y-auto">
        <span className="font-black mr-1">{assocName}</span>
        <span className="whitespace-pre-wrap font-mono text-[11px] text-stone-800">
          {formatTextWithHashtags(publicationText)}
        </span>
      </div>
    </div>
  );
}
