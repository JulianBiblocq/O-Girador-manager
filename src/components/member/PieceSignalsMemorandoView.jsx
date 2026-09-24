import React from 'react';

/**
 * Sous-composant Vue Aide-Mémoire des Signes du Mestre (< 100 lignes).
 * Galerie en lecture directe épurée, sans quiz ni masquage de texte.
 */
export default function PieceSignalsMemorandoView({ resolvedSignals = [] }) {
  if (!resolvedSignals || resolvedSignals.length === 0) {
    return (
      <div className="p-6 text-center text-xs font-bold text-stone-500 bg-white/60 border border-dashed border-encre-noire/20 rounded">
        Aucun signe associé à ce morceau.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="p-2 rounded bg-white/80 border border-encre-noire/15">
        <span className="text-xs font-bold text-stone-600">
          {resolvedSignals.length} convention{resolvedSignals.length > 1 ? 's' : ''} chronologique{resolvedSignals.length > 1 ? 's' : ''} dans ce morceau
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {resolvedSignals.map((sig) => (
          <div
            key={sig.id}
            className="p-3 rounded bg-white border-2 border-encre-noire/20 flex gap-3 items-center hover:border-encre-noire/50 transition-colors shadow-2xs"
          >
            <div className="shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded border border-encre-noire/15 overflow-hidden flex items-center justify-center bg-stone-50">
              {sig.imageUrl ? (
                <img src={sig.imageUrl} alt={sig.nom} className="w-full h-full object-contain p-1" loading="lazy" />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-1 text-cordel-wood select-none">
                  <span className="text-2xl">✋</span>
                  <span className="text-[8px] font-bold uppercase text-stone-500 mt-0.5">Geste</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
              {sig.mesure && (
                <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-amber-100 text-amber-950 w-fit border border-amber-300">
                  Mesure {sig.mesure}
                </span>
              )}
              <h4 className="text-xs sm:text-sm font-black text-encre-noire truncate uppercase mt-0.5">{sig.nom}</h4>
              {sig.consigne && (
                <p className="text-[11px] text-stone-600 italic line-clamp-2 leading-tight">{sig.consigne}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
