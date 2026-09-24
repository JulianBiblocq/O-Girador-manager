import React, { useState } from 'react';

/**
 * Sous-composant Vue Aide-Mémoire (Option A) des Signes du Mestre (< 120 lignes).
 * Permet la révision visuelle chronologique avec mode récitation masquée.
 */
export default function PieceSignalsMemorandoView({
  resolvedSignals = [],
  hideLabels,
  setHideLabels,
  onSwitchToQuiz
}) {
  const [revealedIds, setRevealedIds] = useState({});

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between gap-2 p-2 rounded bg-white/80 border border-encre-noire/15 flex-wrap">
        <span className="text-[10px] sm:text-xs font-bold text-stone-600">
          {resolvedSignals.length} convention(s) chronologique(s) dans ce morceau
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHideLabels(!hideLabels);
              setRevealedIds({});
            }}
            className="px-2.5 py-1 text-[11px] font-bold rounded border border-encre-noire/25 bg-stone-50 hover:bg-stone-100 text-stone-800 cursor-pointer shadow-2xs select-none"
          >
            {hideLabels ? '👁️ Tout afficher' : '🙈 Masquer les noms'}
          </button>
          <button
            type="button"
            onClick={onSwitchToQuiz}
            className="px-3 py-1 text-[11px] font-black rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:opacity-90 cursor-pointer shadow-2xs select-none"
          >
            🎯 S'entraîner au Quiz
          </button>
        </div>
      </div>

      {/* Galerie des signaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {resolvedSignals.map((sig) => {
          const isHidden = hideLabels && !revealedIds[sig.id];
          return (
            <div
              key={sig.id}
              className="p-3 rounded bg-white border-2 border-encre-noire/20 flex gap-3 items-center hover:border-encre-noire/50 transition-colors shadow-2xs"
            >
              <div className="shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded border border-encre-noire/15 overflow-hidden flex items-center justify-center bg-stone-50">
                {sig.imageUrl ? (
                  <img src={sig.imageUrl} alt={sig.nom} className="w-full h-full object-contain p-1" loading="lazy" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-1 text-cordel-wood select-none">
                    <span className="text-2xl">🖐️</span>
                    <span className="text-[8px] font-bold uppercase text-stone-500 mt-0.5">Geste</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-amber-100 text-amber-950 w-fit border border-amber-300">
                  Mesure {sig.mesure}
                </span>
                {isHidden ? (
                  <button
                    type="button"
                    onClick={() => setRevealedIds((prev) => ({ ...prev, [sig.id]: true }))}
                    className="mt-1 px-2 py-1 text-[10px] font-bold rounded bg-stone-100 hover:bg-stone-200 text-cordel-wood border border-dashed border-stone-400 cursor-pointer w-fit"
                  >
                    👁️ Cliquer pour révéler
                  </button>
                ) : (
                  <>
                    <h4 className="text-xs sm:text-sm font-black text-encre-noire truncate uppercase mt-0.5">{sig.nom}</h4>
                    {sig.consigne && (
                      <p className="text-[11px] text-stone-600 italic line-clamp-2 leading-tight">{sig.consigne}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
