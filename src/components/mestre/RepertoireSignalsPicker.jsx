import React from 'react';
import useMestreSignals from '../../hooks/useMestreSignals';

/**
 * Sélecteur multi-choix des Signes du Mestre pour une pièce du répertoire.
 * Affiche la grille des signaux de commandement avec miniature visuelle du geste.
 *
 * @param {Array} selectedSignalIds - Identifiants des signaux sélectionnés
 * @param {Function} onChange - Callback de mise à jour des identifiants
 */
export default function RepertoireSignalsPicker({ selectedSignalIds = [], onChange, groupId = null }) {
  const { signals, loading, error } = useMestreSignals(groupId);

  const handleToggle = (signalId) => {
    if (selectedSignalIds.includes(signalId)) {
      onChange(selectedSignalIds.filter((id) => id !== signalId));
    } else {
      onChange([...selectedSignalIds, signalId]);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[6px_10px_7px_9px] border border-dashed border-cordel-wood/30 bg-[#fbf7ee]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✋</span>
          <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
            Signes du Mestre associés ({selectedSignalIds.length})
          </label>
        </div>
        {selectedSignalIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[9px] text-stone-500 hover:text-stone-700 font-bold uppercase underline cursor-pointer"
          >
            Tout désélectionner
          </button>
        )}
      </div>

      <p className="text-[10px] text-encre-noire/70 font-semibold italic leading-tight">
        Sélectionnez les gestes de commandement du Mestre associés à ce rythme (départ, virada, coupure...).
      </p>

      {loading ? (
        <div className="py-3 text-center text-xs font-bold text-cordel-master-dark/60 animate-pulse">
          ⏳ Chargement des signes du Mestre...
        </div>
      ) : error ? (
        <div className="py-2 text-center text-[10px] text-red-700 font-bold">
          ⚠️ Impossible de charger les signaux.
        </div>
      ) : signals.length === 0 ? (
        <div className="py-2.5 text-center text-[10px] text-encre-noire/50 italic border border-dashed border-encre-noire/15 rounded bg-white/60">
          Aucun signe configuré dans la bibliothèque du Mestre.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1 max-h-56 overflow-y-auto p-1">
          {signals.map((sig) => {
            const isSelected = selectedSignalIds.includes(sig.id);

            return (
              <button
                key={sig.id}
                type="button"
                onClick={() => handleToggle(sig.id)}
                className={`flex items-center gap-2 p-1.5 rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer text-left select-none ${
                  isSelected
                    ? 'bg-green-50 border-green-700 shadow-[1.5px_1.5px_0px_0px_#2d6a4f]'
                    : 'bg-white border-encre-noire/20 hover:border-encre-noire/50'
                }`}
              >
                {/* Miniature du geste */}
                <div className="w-8 h-8 rounded bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center border border-encre-noire/30">
                  {sig.imageUrl ? (
                    <img
                      src={sig.imageUrl}
                      alt={sig.name || "Signe"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">✋</span>
                  )}
                </div>

                {/* Nom du geste & Coche */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[10px] font-black truncate leading-tight ${isSelected ? 'text-green-950' : 'text-encre-noire'}`}>
                    {sig.name}
                  </span>
                  {isSelected && (
                    <span className="text-[8.5px] font-black text-green-700 uppercase tracking-wider">
                      ✓ Associé
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
