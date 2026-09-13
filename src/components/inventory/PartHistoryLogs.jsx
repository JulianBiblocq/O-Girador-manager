import React, { useState } from 'react';

/**
 * Sous-composant : PartHistoryLogs
 * Affiche le journal de traçabilité des étapes de fabrication,
 * contrôles et retouches d'une pièce d'atelier (lutherie).
 * Respecte la règle anti-monolithe et le code couleur sémantique Cordel.
 *
 * @param {Object} props
 * @param {Array} props.historique Liste des événements de contrôle [{ date, action, etape, validateur, note }]
 */
export default function PartHistoryLogs({ historique = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!historique || historique.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-dashed border-encre-noire/20 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between w-full py-1 px-2 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-all cursor-pointer text-left select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">📜</span>
          <span className="text-[11px] font-black uppercase tracking-wider text-cordel-wood">
            Journal des contrôles &amp; logs ({historique.length})
          </span>
        </div>
        <span className="text-xs text-cordel-wood font-bold">
          {isExpanded ? '▲ Réduire' : '▼ Voir l\'historique'}
        </span>
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2 mt-1 pl-1 max-h-56 overflow-y-auto">
          {historique.slice().reverse().map((log, idx) => {
            const isValidation = (log.action || '').toLowerCase().includes('validation');
            const isRetouche = (log.action || '').toLowerCase().includes('retouche');
            const formattedDate = log.date ? new Date(log.date).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Date inconnue';

            return (
              <div
                key={idx}
                className="p-2 bg-white rounded border border-encre-noire/15 flex flex-col gap-1 text-left shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isValidation
                        ? 'bg-[var(--color-cordel-vert)] text-white'
                        : isRetouche
                        ? 'bg-[var(--color-cordel-rouge)] text-white'
                        : 'bg-stone-200 text-stone-800'
                    }`}>
                      {log.action || 'Contrôle'}
                    </span>
                    {log.etape !== undefined && (
                      <span className="text-[9px] font-bold text-stone-600">
                        Étape {log.etape + 1}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-stone-400 font-mono">
                    {formattedDate}
                  </span>
                </div>

                {log.validateur && (
                  <span className="text-[9.5px] font-semibold text-stone-700">
                    Par : <strong className="text-cordel-wood">{log.validateur}</strong>
                  </span>
                )}

                {log.note && (
                  <p className="text-[10px] italic text-stone-700 bg-amber-50 p-1.5 rounded border-l-2 border-amber-500">
                    "{log.note}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
