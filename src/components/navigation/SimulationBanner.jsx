import React from 'react';
import { useViewSimulator } from '../../context/ViewSimulatorContext';

/**
 * Bannière d'alerte persistante (Mode Test / Impersonation).
 * Fixée tout en haut de l'écran lorsque la simulation est active.
 * Conforme aux règles d'avertissement Cordel (fond kraft/ambré, bordure sombre, ombres franches).
 */
export default function SimulationBanner() {
  const { isSimulating, simulationTarget, effectiveProfile, stopSimulation } = useViewSimulator();

  if (!isSimulating || !simulationTarget) {
    return null;
  }

  // Formatage des détails des étiquettes simulées
  const tagsSummary = effectiveProfile?.tags && effectiveProfile.tags.length > 0
    ? effectiveProfile.tags.map(t => (typeof t === 'string' ? t : (t.nomM || t.id))).join(', ')
    : 'Aucun badge';

  return (
    <div className="sticky top-0 z-[9999] w-full bg-amber-100 border-b-2 border-amber-900 text-amber-950 px-3.5 py-2 shadow-md flex items-center justify-between gap-3 select-none animate-fadeIn">
      {/* Informations sur la vue simulée */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="text-base shrink-0 animate-pulse" title="Mode Test actif">
          👁️
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide truncate">
            <span>Mode Test actif :</span>
            <span className="underline decoration-amber-800 decoration-2">
              {simulationTarget.label || 'Vue simulée'}
            </span>
          </div>
          <div className="text-[10px] font-bold text-amber-900/80 flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.2 rounded bg-amber-200/80 border border-amber-700/40">
              Rôle : {effectiveProfile?.role || 'membre'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-200/80 border border-amber-700/40 truncate max-w-xs">
              🏷️ {tagsSummary}
            </span>
            <span className="hidden md:inline italic opacity-85 text-[9px]">
              (Zéro écriture Firestore — Simulation 100% mémoire)
            </span>
          </div>
        </div>
      </div>

      {/* Bouton pour quitter la simulation */}
      <button
        type="button"
        onClick={stopSimulation}
        className="px-3 py-1 bg-cordel-wood text-cordel-bg-light border-2 border-encre-noire rounded-[4px_7px_5px_6px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer text-xs font-black uppercase tracking-wider shrink-0 transition-transform flex items-center gap-1.5"
        title="Désactiver le mode test et restaurer la vue administrateur réelle"
      >
        <span>✕</span>
        <span className="hidden sm:inline">Quitter la simulation</span>
        <span className="sm:hidden">Quitter</span>
      </button>
    </div>
  );
}
