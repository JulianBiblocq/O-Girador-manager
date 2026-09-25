import React from 'react';

/**
 * Composant Tampon "ORGANIZADOR" Style Cordel / Xylogravure.
 * Reproduit fidèlement les codes esthétiques du tampon Sequenciador :
 * - Cadre fin rouge brique / bois (#8B2A1A)
 * - Fond papier / ivoire (#F4ECD8)
 * - Typographie à empattement en capitales avec large espacement
 * - Légère rotation artisanale (-1°)
 * - Effet linogravure / usure de tampon (.lino-distressed)
 */
export default function OrganizadorStamp({ className = '', size = 'md' }) {
  const sizeClasses = size === 'sm'
    ? 'text-[8.5px] px-2 py-0.5 tracking-[0.22em] border'
    : 'text-[9.5px] sm:text-[10.5px] px-2.5 py-0.5 tracking-[0.26em] border-[1.5px]';

  return (
    <span 
      className={`inline-flex items-center justify-center font-serif font-black uppercase select-none rounded-[2px_3px_2px_4px] shadow-[1px_1px_0px_0px_rgba(139,42,26,0.25)] rotate-[-1deg] border-[#8b2a1a] bg-[#f4ecd8] text-[#8b2a1a] transition-transform hover:rotate-0 hover:scale-[1.02] ${sizeClasses} ${className}`}
      title="Organizad'Or - Outil de gestion associative"
      style={{ fontFamily: '"Georgia", "Cinzel Decorative", "Cactus", serif' }}
    >
      <span className="lino-distressed font-bold translate-x-[0.13em]">
        ORGANIZADOR
      </span>
    </span>
  );
}
