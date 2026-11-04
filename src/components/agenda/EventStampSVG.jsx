import React from 'react';

/**
 * Composant de tampon vectoriel (SVG) en style xylogravure Cordel pour l'Agenda.
 * Réutilise les tracés d'instruments du Sequenciador (apito, alfaia, caixa, gongue, agbe)
 * et fournit les gravures dédiées (danse, prestation, stage, reunion, lutherie)
 * en encre noire franche (#181716) sur parchemin (#F4ECD8) avec double filet gravé.
 */
export default function EventStampSVG({ stampKey = 'apito', className = 'w-full h-full' }) {
  const ink = '#181716';
  const paper = '#F4ECD8';

  const renderGlyph = () => {
    switch (stampKey) {
      case 'alfaia':
        return (
          <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 18 30 Q 50 22 82 32 M 18 30 Q 50 40 82 32" />
            <path d="M 20 70 Q 50 62 78 72 M 22 72 Q 50 82 79 70" />
            <path d="M 18 30 Q 12 50 20 70 M 82 32 Q 88 50 78 72" />
            <path d="M 19 32 L 28 68 L 38 35 L 48 70 L 58 32 L 68 69 L 80 32" strokeWidth="2.5" />
            <path d="M 10 18 Q 24 22 38 25" strokeWidth="3" />
            <circle cx="10" cy="18" r="4.5" fill={ink} />
          </g>
        );
      case 'caixa':
        return (
          <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 14 42 C 30 34, 70 34, 86 42 C 70 50, 30 50, 14 42 Z" />
            <path d="M 16 66 C 30 59, 70 59, 84 66 C 70 73, 30 73, 16 66" />
            <path d="M 14 42 Q 11 54 16 66 M 86 42 Q 89 54 84 66" />
            <path d="M 27 45 L 27 64 M 46 46 L 46 67 M 66 46 L 66 67" strokeWidth="2.5" />
            <path d="M 18 48 L 82 61" strokeWidth="1.8" strokeDasharray="3 3" />
            <path d="M 12 20 L 48 39 M 88 18 L 46 39" strokeWidth="3" />
          </g>
        );
      case 'gongue':
        return (
          <g fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 16 74 Q 50 92 84 74 Q 50 58 16 74 Z" fill={ink} fillOpacity="0.12" />
            <path d="M 16 74 Q 35 45 45 30 Q 50 24 55 30 Q 65 45 84 74" />
            <path d="M 48 26 L 46 11 M 52 26 L 54 11" />
            <path d="M 84 18 L 58 55" strokeWidth="3.8" />
          </g>
        );
      case 'agbe':
        return (
          <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 45 20 Q 18 40 24 72 C 26 92, 78 92, 76 72 Q 72 40 55 20" />
            <ellipse cx="50" cy="20" rx="7" ry="4.5" strokeWidth="3" />
            <path d="M 28 48 L 74 82 M 25 62 L 64 88 M 36 38 L 76 68" strokeWidth="2" />
            <path d="M 74 48 L 28 82 M 75 62 L 36 88 M 64 38 L 26 68" strokeWidth="2" />
            <circle cx="50" cy="55" r="2.5" fill={ink} />
            <circle cx="63" cy="67" r="2.5" fill={ink} />
            <circle cx="38" cy="68" r="2.5" fill={ink} />
            <circle cx="50" cy="78" r="2.5" fill={ink} />
          </g>
        );
      case 'danse':
        return (
          <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="52" cy="18" r="6.5" fill={ink} />
            <path d="M 30 28 Q 50 38 72 22" strokeWidth="3.5" />
            <path d="M 50 25 L 47 46" strokeWidth="3.8" />
            <path d="M 47 46 Q 22 62 18 78 Q 50 88 82 76 Q 74 58 47 46 Z" fill={ink} fillOpacity="0.14" />
            <path d="M 32 76 Q 42 62 47 46 M 64 76 Q 56 62 47 46" strokeWidth="2.2" />
            <path d="M 42 79 L 38 90 M 58 79 L 63 90" strokeWidth="3.2" />
          </g>
        );
      case 'prestation':
        return (
          <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 50 10 L 50 90 M 18 22 L 82 22" strokeWidth="3.5" />
            <path d="M 24 22 L 24 66 L 50 80 L 76 66 L 76 22 Z" fill={ink} fillOpacity="0.12" />
            <polygon points="50,32 54,42 65,42 56,49 59,60 50,53 41,60 44,49 35,42 46,42" fill={ink} />
            <path d="M 24 66 L 20 76 M 36 72 L 34 82 M 64 72 L 66 82 M 76 66 L 80 76" strokeWidth="2.5" />
          </g>
        );
      case 'stage':
        return (
          <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 26 52 A 24 24 0 0 1 74 52" fill={ink} fillOpacity="0.18" />
            <path d="M 50 14 L 50 22 M 26 24 L 32 30 M 74 24 L 68 30 M 14 44 L 22 46 M 86 44 L 78 46" strokeWidth="3.2" />
            <path d="M 20 56 L 80 56 L 74 84 L 26 84 Z" />
            <path d="M 24 56 L 34 84 L 46 56 L 56 84 L 68 56 L 74 84" strokeWidth="2.4" />
          </g>
        );
      case 'reunion':
        return (
          <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="20" y="22" width="44" height="60" rx="3" fill={ink} fillOpacity="0.08" />
            <path d="M 28 36 H 54 M 28 48 H 54 M 28 60 H 46" strokeWidth="2.8" />
            <path d="M 52 68 C 58 46, 72 28, 84 16 C 82 34, 72 52, 56 66 Z" fill={ink} />
            <path d="M 48 74 L 56 64" strokeWidth="3.2" />
          </g>
        );
      case 'lutherie':
        return (
          <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22 78 L 68 32" strokeWidth="4" />
            <rect x="58" y="16" width="24" height="14" rx="2" transform="rotate(45 70 23)" fill={ink} />
            <path d="M 78 78 L 32 32" strokeWidth="3.5" />
            <circle cx="24" cy="24" r="6" />
            <circle cx="34" cy="18" r="5" />
          </g>
        );
      case 'apito':
      default:
        return (
          <g fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 38 26 L 38 72 C 38 78, 62 78, 62 72 L 62 26 Z" fill={ink} fillOpacity="0.1" />
            <path d="M 42 26 L 45 13 L 55 13 L 58 26 M 38 35 L 62 35" />
            <path d="M 38 44 L 24 44 L 24 58 L 38 58 M 62 44 L 76 44 L 76 58 L 62 58" />
            <circle cx="50" cy="51" r="3.5" fill={ink} />
            <circle cx="50" cy="84" r="4.5" />
            <path d="M 50 74 L 50 79" />
          </g>
        );
    }
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" fill={paper} />
      <rect x="5" y="5" width="90" height="90" rx="6" fill="none" stroke={ink} strokeWidth="2.2" strokeDasharray="7 2.5" />
      {renderGlyph()}
    </svg>
  );
}

