import React from 'react';

/**
 * Composant de filigrane (Watermark) fixe pour la Vitrine Publique.
 * Positionne le logo de l'association au centre de l'écran en arrière-plan (z-0 / fixed),
 * avec une opacité très faible (8-10%) et un mode de fusion élégant.
 * Le contenu de la page défile par-dessus (relative z-10).
 * 
 * @param {Object} props
 * @param {string} props.logoSrc - URL de l'image du logo de l'association
 * @param {string} [props.altText] - Description alternative (accessibilité)
 */
export default function PublicWatermarkLogo({ logoSrc, altText = '' }) {
  if (!logoSrc) return null;

  return (
    <div 
      aria-hidden="true"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none w-3/4 max-w-md sm:max-w-lg object-contain mix-blend-multiply select-none flex items-center justify-center transition-all duration-500"
    >
      <img 
        src={logoSrc} 
        alt={altText}
        className="w-full h-auto max-h-[55vh] object-contain filter grayscale-15"
      />
    </div>
  );
}
