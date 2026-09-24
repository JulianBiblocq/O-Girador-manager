import React from 'react';
import PatternVisualizer from '../PatternVisualizer';

/**
 * Plateau de jeu du Défi Réflexe présentant les 4 cartes de tablatures.
 * Rendu avec PatternVisualizer selon le design system Cordel neutre.
 *
 * @param {Object} props
 * @param {Array<Object>} props.options - Les 4 cartes mélangées ({ id, pattern, isCorrect })
 * @param {string|null} props.selectedOptionId - Identifiant de la carte cliquée
 * @param {'success'|'error'|null} props.validationState - État de validation immédiat
 * @param {Function} props.onSelectOption - Callback lors du clic sur une carte
 * @param {boolean} props.disabled - Désactivation pendant le chargement / reprise
 */
export default function ReflexGameBoard({
  options = [],
  selectedOptionId = null,
  validationState = null,
  onSelectOption,
  disabled = false
}) {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  const handleCardClick = (option) => {
    if (disabled) return;
    onSelectOption(option);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark/70">
          Quelle est la tablature du Temps 1 de la mesure suivante ?
        </span>
        <span className="text-[9px] font-bold text-encre-noire/50">
          4 propositions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isError = isSelected && validationState === 'error';
          const isSuccess = isSelected && validationState === 'success';

          let borderClass = 'border-2 border-encre-noire/40 hover:border-encre-noire hover:shadow-[3px_3px_0px_0px_#181716]';
          let bgClass = 'bg-[#fdfaf2] text-encre-noire';

          if (isError) {
            borderClass = 'border-2 border-[var(--color-cordel-rouge,#8b2a1a)] shadow-[3px_3px_0px_0px_#8b2a1a] animate-shake';
            bgClass = 'bg-red-50 text-[var(--color-cordel-rouge,#8b2a1a)]';
          } else if (isSuccess) {
            borderClass = 'border-2 border-[var(--color-cordel-vert,#2d6a4f)] shadow-[3px_3px_0px_0px_#2d6a4f]';
            bgClass = 'bg-emerald-50 text-[var(--color-cordel-vert,#2d6a4f)]';
          }

          return (
            <button
              key={option.id || idx}
              type="button"
              disabled={disabled}
              onClick={() => handleCardClick(option)}
              className={`p-3 rounded-lg flex flex-col gap-2 transition-all cursor-pointer text-left select-none ${bgClass} ${borderClass} ${
                disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-dashed border-current/20 pb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-encre-noire/10 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>Option {idx + 1}</span>
                </span>

                {isSuccess && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-vert,#2d6a4f)] flex items-center gap-1">
                    <span>✓</span>
                    <span>Bonne réponse</span>
                  </span>
                )}
                {isError && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-rouge,#8b2a1a)] flex items-center gap-1">
                    <span>✗</span>
                    <span>Erreur</span>
                  </span>
                )}
              </div>

              {/* Rendu de la tablature avec PatternVisualizer */}
              <div className="w-full pointer-events-none py-1">
                <PatternVisualizer patternArray={option.pattern} beatResolution={4} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
