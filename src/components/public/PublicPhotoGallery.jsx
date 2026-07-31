import React, { useState, useRef } from 'react';

/**
 * Composant de Galerie Photos & Carrousel pour la vitrine publique.
 * Offre un défilement horizontal fluide (scroll snap), des commandes de navigation (flèches + puces)
 * et une visionneuse grand écran (modal lightbox) lors du clic sur une photo.
 * 
 * @param {Object} props
 * @param {Array<string>} [props.photos] - Tableau des URL des photos à afficher.
 * @param {Object} [props.publicTheme] - Configuration dynamique du thème vitrine.
 */
export default function PublicPhotoGallery({ photos = [], publicTheme = {} }) {
  const vitrineTexts = publicTheme?.vitrineTexts || {};
  const badgeGalerie = vitrineTexts.badgeGalerie || "Photos & Prestations";
  const titreGalerie = vitrineTexts.titreGalerie || "En Images";
  const accrocheGalerie = vitrineTexts.accrocheGalerie || "Découvrez la ferveur, l'énergie scénique et les moments forts de notre collectif.";
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Si aucune photo n'est disponible dans la base, la section est masquée pour préserver le design
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  // Défilement vers la gauche ou la droite
  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.85;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mise à jour de l'index de la puce active lors du scroll
  const handleScrollEvent = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const itemWidth = container.clientWidth;
    const newIndex = Math.round(container.scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < photos.length) {
      setActiveIndex(newIndex);
    }
  };

  // Défilement direct vers une photo spécifique par son index
  const scrollToPhoto = (index) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const targetScroll = container.clientWidth * index;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveIndex(index);
  };

  return (
    <section id="galerie" className="py-16 bg-stone-100/70 border-b border-stone-200/60 overflow-hidden relative select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
        
        {/* En-tête de section */}
        <div className="text-center flex flex-col items-center gap-3">
          <span 
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded text-white shadow-xs"
            style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
          >
            {badgeGalerie}
          </span>

          <h2 
            className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: 'var(--public-primary, #D32F2F)' 
            }}
          >
            {titreGalerie}
          </h2>

          <div 
            className="w-16 h-1 rounded-full"
            style={{ backgroundColor: 'var(--public-primary, #D32F2F)' }}
          ></div>
          
          <p className="text-sm text-stone-600 max-w-md">
            {accrocheGalerie}
          </p>
        </div>

        {/* Conteneur principal du Carrousel avec Flèches de navigation */}
        <div className="relative group">
          
          {/* Bouton Flèche Gauche */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Photo précédente"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-xl backdrop-blur-xs flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer border border-stone-200"
            >
              ❮
            </button>
          )}

          {/* Bouton Flèche Droite */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Photo suivante"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-xl backdrop-blur-xs flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer border border-stone-200"
            >
              ❯
            </button>
          )}

          {/* Zone de défilement horizontal (Scroll Snap CSS) */}
          <div
            ref={scrollRef}
            onScroll={handleScrollEvent}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-4 px-2 sm:px-4 scroll-smooth"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {photos.map((photoUrl, idx) => (
              <div
                key={`${photoUrl}-${idx}`}
                onClick={() => setLightboxIndex(idx)}
                className="shrink-0 w-80 sm:w-[500px] md:w-[650px] snap-center rounded-2xl overflow-hidden shadow-lg border border-stone-200/80 bg-stone-900 group/card cursor-pointer relative transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <img
                  src={photoUrl}
                  alt={`Prestation ${idx + 1}`}
                  className="w-full h-64 sm:h-96 md:h-[440px] object-cover transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />

                {/* Overlay au survol */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    🔍 Agrandir la photo ({idx + 1} / {photos.length})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Puces de navigation (Pagination) */}
          {photos.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              {photos.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => scrollToPhoto(dotIdx)}
                  aria-label={`Aller à la photo ${dotIdx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeIndex === dotIdx 
                      ? 'w-8 h-2.5 bg-[var(--public-primary,#D32F2F)] shadow-sm' 
                      : 'w-2.5 h-2.5 bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visionneuse grand écran (Lightbox Modal) */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Bouton de fermeture */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold bg-stone-800/80 hover:bg-stone-700 w-11 h-11 rounded-full flex items-center justify-center border border-stone-600 transition-all cursor-pointer z-50"
          >
            ✕
          </button>

          {/* Nav Gauche Lightbox */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-xl bg-stone-800/80 hover:bg-stone-700 w-12 h-12 rounded-full flex items-center justify-center border border-stone-600 transition-all cursor-pointer z-50"
            >
              ❮
            </button>
          )}

          {/* Image Agrandie */}
          <div 
            className="max-w-5xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex]}
              alt={`Visionneuse Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>

          {/* Nav Droite Lightbox */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-xl bg-stone-800/80 hover:bg-stone-700 w-12 h-12 rounded-full flex items-center justify-center border border-stone-600 transition-all cursor-pointer z-50"
            >
              ❯
            </button>
          )}
        </div>
      )}
    </section>
  );
}
