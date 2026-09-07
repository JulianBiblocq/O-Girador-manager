import React from 'react';

/**
 * Rendu SVG 3D d'une corde de chanvre incurvée (courbe caténaire naturelle)
 * avec attaches murales, brins tressés, micro-fibres et reflets dorés.
 */
export default function VaralRopeSVG({
  className = "absolute top-[44px] left-0 right-0 h-8 w-full z-0 select-none pointer-events-none overflow-visible"
}) {
  return (
    <div className={className}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hempMain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6E4420" />
            <stop offset="25%" stopColor="#A47442" />
            <stop offset="50%" stopColor="#E0B67C" />
            <stop offset="75%" stopColor="#A47442" />
            <stop offset="100%" stopColor="#6E4420" />
          </linearGradient>
          <linearGradient id="hempHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4A26A" />
            <stop offset="50%" stopColor="#FFF3D4" />
            <stop offset="100%" stopColor="#D4A26A" />
          </linearGradient>
        </defs>

        {/* Crochet mural gauche / Noeud */}
        <rect x="2" y="2" width="14" height="12" rx="3" fill="#3D220E" stroke="#181716" strokeWidth="1.5" />
        <circle cx="9" cy="8" r="3" fill="#E0B67C" />

        {/* Crochet mural droit / Noeud */}
        <rect x="984" y="2" width="14" height="12" rx="3" fill="#3D220E" stroke="#181716" strokeWidth="1.5" />
        <circle cx="991" cy="8" r="3" fill="#E0B67C" />

        {/* 1. Ombre portée sous la corde */}
        <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#181716" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round" />

        {/* 2. Contour sombre / Âme de la corde */}
        <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#3D220E" strokeWidth="6" strokeLinecap="round" />

        {/* 3. Corps chaud en chanvre tressé */}
        <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="url(#hempMain)" strokeWidth="4.5" strokeLinecap="round" />

        {/* 4. Brins torsadés (profondeur de tissage) */}
        <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#2B1607" strokeWidth="2.2" strokeDasharray="7 4" strokeLinecap="round" opacity="0.9" />

        {/* 5. Micro-fibres naturelles et aspérités */}
        <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#523214" strokeWidth="1.8" strokeDasharray="1.5 5" strokeLinecap="round" opacity="0.8" />

        {/* 6. Reflets dorés des fibres de surface */}
        <path d="M 9 7.5 Q 500 27.5, 991 7.5" fill="none" stroke="url(#hempHighlight)" strokeWidth="1.2" strokeDasharray="4 6" strokeLinecap="round" opacity="0.9" />
        <path d="M 9 7 Q 500 27, 991 7" fill="none" stroke="#FFF7E6" strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" opacity="0.75" />
      </svg>
    </div>
  );
}
