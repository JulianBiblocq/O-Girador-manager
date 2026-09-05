import React, { useState } from 'react';
import { normalizePartSteps } from '../../utils/workshopProjectionUtils.js';

/**
 * Sous-composant de suivi granulaire de la nomenclature et des pièces d'un modèle d'atelier.
 * Permet à l'élève de visualiser et ajuster son aisance par pièce et de lancer le QCM ciblé.
 * Respecte la règle anti-monolithe et le design system Cordel.
 *
 * @param {Object} props
 * @param {Object} props.model - Modèle d'instrument contenant le tableau 'parts'
 * @param {Object} props.evaluations - Dictionnaire des évaluations de parcours { [cle]: niveau }
 * @param {Function} props.handleSetEvaluation - Callback d'enregistrement de l'aisance (itemId, level)
 * @param {Array} props.comfortLevels - Liste des paliers d'aisance [{ level, label }]
 * @param {Function} props.onLaunchPartQuiz - Callback de déclenchement du quiz ({ model, partId })
 */
export default function AtelierModelPartsProgress({
  model,
  evaluations = {},
  handleSetEvaluation,
  comfortLevels = [],
  onLaunchPartQuiz
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parts = model?.parts || [];
  if (parts.length === 0) return null;

  // Calcul du nombre de pièces évaluées au moins au palier 'pratique'
  const evaluatedPartsCount = parts.filter((part, idx) => {
    const partKey = part.id || `part_${idx}`;
    const compositeKey = `${model.id}__${partKey}`;
    const level = evaluations[compositeKey] || evaluations[`${model.id}__${part.nom}`];
    return level && level !== 'decouverte';
  }).length;

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-encre-noire/15 flex flex-col gap-2">
      {/* En-tête dépliable Cordel */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between w-full text-left py-1 px-2 rounded bg-stone-100/70 hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">🪵</span>
          <span className="text-[11px] font-black uppercase tracking-wider text-cordel-wood">
            Nomenclature &amp; Pièces usinées ({parts.length})
          </span>
          <span className="text-[9.5px] font-bold text-encre-noire/60 bg-white px-1.5 py-0.5 rounded border border-stone-300">
            {evaluatedPartsCount} / {parts.length} maîtrisée{evaluatedPartsCount > 1 ? 's' : ''}
          </span>
        </div>

        <span className="text-xs text-cordel-wood font-bold">
          {isExpanded ? '▲ Réduire' : '▼ Détails par pièce'}
        </span>
      </button>

      {/* Liste dépliable des pièces du modèle */}
      {isExpanded && (
        <div className="flex flex-col gap-2.5 mt-1 pl-1 sm:pl-2">
          {parts.map((part, idx) => {
            const partKey = part.id || `part_${idx}`;
            const compositeKey = `${model.id}__${partKey}`;
            const currentLevel = evaluations[compositeKey] || evaluations[`${model.id}__${part.nom}`];
            const steps = normalizePartSteps(part);

            return (
              <div
                key={partKey}
                className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2.5 bg-white rounded border border-encre-noire/15 shadow-xs transition-all hover:border-cordel-wood/40"
              >
                {/* Informations sur la pièce */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-white bg-cordel-wood w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-black uppercase text-encre-noire tracking-wide">
                      {part.nom}
                    </span>
                    {part.quantiteRequise && (
                      <span className="text-[9.5px] font-semibold text-stone-500">
                        (x{part.quantiteRequise})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-stone-600">
                    <span>⚙️ {steps.length} étape{steps.length > 1 ? 's' : ''} d'usinage</span>
                    {part.materiels?.length > 0 && (
                      <span className="truncate max-w-[200px]" title={part.materiels.join(', ')}>
                        • Mat. : {part.materiels.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions : Échelle d'aisance et déclencheur QCM */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Échelle de confort par pièce */}
                  <div className="flex items-center gap-1">
                    {comfortLevels.map(lvl => {
                      const isSelected = currentLevel === lvl.level;
                      return (
                        <button
                          key={lvl.level}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSetEvaluation?.(compositeKey, lvl.level);
                          }}
                          className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--color-cordel-wood,#8b2a1a)] text-white border-[#181716] shadow-[1px_1px_0px_0px_#181716]'
                              : 'bg-stone-50 text-encre-noire/80 border-stone-300 hover:bg-stone-100'
                          }`}
                          title={`Définir l'aisance sur ${part.nom} : ${lvl.label}`}
                        >
                          {lvl.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bouton pour lancer le QCM dédié à cette pièce */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onLaunchPartQuiz?.({ model, partId: partKey });
                    }}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/30 rounded hover:bg-cordel-wood hover:text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title={`Lancer un QCM d'évaluation centré sur la pièce : ${part.nom}`}
                  >
                    <span>📝</span>
                    <span>Quiz Pièce</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
