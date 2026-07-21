import React from 'react';
import CordelCard from '../CordelCard';

/**
 * CostumeVisualizer Component
 * Displays a visual line-art human mannequin silhouette and an SVG accessory basket.
 * Costume pieces are positioned as interactive clickable markers at their respective body locations.
 *
 * @param {Object} props
 * @param {Object} props.costume The costume object containing pieces
 * @param {Object} props.checklist Object mapping pieceId -> boolean for the current user
 * @param {Function} props.onSelectPiece Callback fired when user clicks a piece marker
 */
export default function CostumeVisualizer({ costume, checklist = {}, onSelectPiece }) {
  const pieces = costume?.pieces || [];

  // Helper to infer body location if missing from older piece definitions
  const getEmplacement = (piece) => {
    if (piece.emplacement) return piece.emplacement.toLowerCase();
    const name = (piece.name || '').toLowerCase();
    if (name.includes('chapeau') || name.includes('coiffe') || name.includes('couronne') || name.includes('tête') || name.includes('tete') || name.includes('masque')) return 'tete';
    if (name.includes('chemise') || name.includes('haut') || name.includes('bustier') || name.includes('robe') || name.includes('buste') || name.includes('torse') || name.includes('veste') || name.includes('gilet')) return 'torse';
    if (name.includes('bras') || name.includes('épaulette') || name.includes('epaulette') || name.includes('manche') || name.includes('mangue')) return 'bras';
    if (name.includes('bracelet') || name.includes('gant') || name.includes('main') || name.includes('poignet')) return 'mains';
    if (name.includes('pantalon') || name.includes('jupe') || name.includes('bas') || name.includes('ceinture') || name.includes('jambe')) return 'jambes';
    if (name.includes('chaussure') || name.includes('botte') || name.includes('pied') || name.includes('sandale') || name.includes('chevillère')) return 'pieds';
    return 'accessoire';
  };

  // Group pieces by location
  const groupedPieces = {
    tete: [],
    torse: [],
    bras: [],
    mains: [],
    jambes: [],
    pieds: [],
    accessoire: []
  };

  pieces.forEach(p => {
    const loc = getEmplacement(p);
    if (groupedPieces[loc]) {
      groupedPieces[loc].push(p);
    } else {
      groupedPieces.accessoire.push(p);
    }
  });

  // Target coordinates on SVG canvas (percentages relative to 340px x 420px container)
  const getLocationCoords = (loc) => {
    switch (loc) {
      case 'tete': return { top: '10%', left: '50%' };
      case 'torse': return { top: '30%', left: '50%' };
      case 'bras': return { top: '24%', left: '26%' };
      case 'mains': return { top: '44%', left: '20%' };
      case 'jambes': return { top: '58%', left: '50%' };
      case 'pieds': return { top: '86%', left: '50%' };
      case 'accessoire': return { top: '65%', left: '84%' };
      default: return { top: '50%', left: '50%' };
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-cordel-bg p-4 rounded-xl border border-dashed border-cordel-master-dark/25 shadow-inner select-none flex flex-col items-center">
      <div className="text-center mb-2">
        <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase tracking-wider">
          🎨 Mannequin d'Habillage Visuel
        </span>
        <p className="text-[9px] text-cordel-master-dark opacity-75 mt-0.5">
          Cliquez sur un marqueur du corps ou du panier pour valider une pièce et voir son tutoriel.
        </p>
      </div>

      {/* Canvas Container for Silhouette and Anchors */}
      <div className="relative w-[340px] h-[440px] flex items-center justify-center overflow-hidden">
        {/* SVG Silhouette - Human Line Art in Woodcut Cordel Style */}
        <svg 
          viewBox="0 0 200 320" 
          className="w-full h-full text-cordel-master-dark/60 opacity-80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Head & Neck */}
          <circle cx="100" cy="38" r="18" strokeDasharray="3 1" />
          <path d="M 94 56 L 94 66 M 106 56 L 106 66" />

          {/* Shoulders & Torso */}
          <path d="M 64 74 C 75 66 125 66 136 74" strokeWidth="2" />
          <path d="M 64 74 L 56 120 L 70 155 L 100 155 L 130 155 L 144 120 L 136 74" />
          <line x1="100" y1="66" x2="100" y2="155" strokeDasharray="2 2" strokeWidth="1" />

          {/* Arms & Hands */}
          {/* Left Arm */}
          <path d="M 64 74 L 46 115 L 36 150" />
          <circle cx="34" cy="155" r="5" strokeDasharray="2 1" />
          {/* Right Arm */}
          <path d="M 136 74 L 154 115 L 164 150" />
          <circle cx="166" cy="155" r="5" strokeDasharray="2 1" />

          {/* Hips & Legs */}
          <path d="M 70 155 L 66 220 L 68 275" />
          <path d="M 130 155 L 134 220 L 132 275" />
          <path d="M 94 155 L 96 220 L 98 275" />
          <path d="M 106 155 L 104 220 L 102 275" />

          {/* Feet */}
          {/* Left Foot */}
          <path d="M 62 275 Q 64 288 80 288 L 98 288" />
          {/* Right Foot */}
          <path d="M 138 275 Q 136 288 120 288 L 102 288" />

          {/* SVG Accessories Basket (Panier d'accessoires sur le côté) */}
          <g transform="translate(142, 210) scale(0.75)">
            {/* Basket Body */}
            <path d="M 10 25 L 15 50 C 18 58 42 58 45 50 L 50 25 Z" fill="rgba(217, 159, 77, 0.15)" strokeWidth="1.8" />
            <path d="M 8 25 Q 30 20 52 25" strokeWidth="2" />
            {/* Woven Crosshatch Patterns */}
            <path d="M 16 28 L 44 48 M 24 26 L 40 52 M 36 26 L 20 52 M 44 28 L 16 48" strokeWidth="1" strokeDasharray="2 1" />
            {/* Basket Label */}
            <text x="30" y="66" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">
              Panier
            </text>
          </g>
        </svg>

        {/* Anchored Interactive Piece Markers */}
        {Object.entries(groupedPieces).map(([loc, locationPieces]) => {
          if (locationPieces.length === 0) return null;
          const coords = getLocationCoords(loc);

          return (
            <div
              key={loc}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20"
              style={{ top: coords.top, left: coords.left }}
            >
              {locationPieces.map(piece => {
                const isChecked = Boolean(checklist[piece.id]);

                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => onSelectPiece && onSelectPiece(piece)}
                    className={`px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
                      isChecked
                        ? 'bg-emerald-700 text-white border-2 border-emerald-950 shadow-[1.5px_1.5px_0px_0px_#064e3b]'
                        : 'bg-cordel-bg-light text-encre-noire border-2 border-dashed border-cordel-wood animate-pulse hover:bg-white'
                    }`}
                    title={`Cliquer pour voir/valider ${piece.name}`}
                  >
                    <span>{isChecked ? '✓' : '○'}</span>
                    <span className="truncate max-w-[110px]">{piece.name}</span>
                    {piece.isMandatory !== false && (
                      <span className="text-[8px] text-amber-400 font-bold">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
