import React from 'react';

/**
 * Rendu typographique Cordel avec superposition précise des accords harmoniques au-dessus des paroles.
 * Utilise un alignement vertical élégant inspiré du style Ruby / Grille d'accords.
 */
export default function ToadaChordOverlay({
  segments = [],
  showChords = false,
  activePuxador = true,
  activeChoeur = true,
  isRevealedMode = true,
  className = ''
}) {
  if (!segments || segments.length === 0) return null;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-0.5 leading-relaxed ${className}`}>
      {segments.map((seg, idx) => {
        const isBold = Boolean(seg.isPuxador);
        const isVisible = isRevealedMode || (isBold ? activePuxador : activeChoeur);
        const hasChord = Boolean(showChords && seg.chord);

        return (
          <span
            key={idx}
            className={`inline-flex flex-col items-start ${
              isVisible ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-200`}
          >
            {/* Ligne d'accord supérieur */}
            {showChords && (
              <span className="text-[10px] sm:text-xs font-black text-cordel-wood select-none leading-tight min-h-[14px]">
                {seg.chord || '\u00A0'}
              </span>
            )}

            {/* Syllabe ou mot correspondant */}
            <span
              className={`whitespace-pre ${
                isBold
                  ? 'font-black text-encre-noire'
                  : 'font-semibold text-encre-noire/90 italic'
              }`}
            >
              {seg.text}
            </span>
          </span>
        );
      })}
    </span>
  );
}
