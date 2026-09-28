import React from 'react';

/**
 * Sous-composant pour la sélection des pupitres requis et quotas d'effectifs pour un événement.
 * Respecte strictement la modularité (< 200 lignes) et le design Cordel.
 *
 * @param {Object} props
 * @param {Object} props.formData - Données actuelles du formulaire d'événement
 * @param {Function} props.setFormData - Setter du formulaire
 * @param {Array<string>} [props.pupitresList] - Noms réels des pupitres configurés pour l'association
 * @param {boolean} [props.disabled] - Indicateur de verrouillage des champs
 */
export default function EventPupitresQuotasFields({
  formData = {},
  setFormData,
  pupitresList = [],
  disabled = false
}) {
  // Liste de repli des pupitres unifiés si non encore chargés
  const availablePupitres = pupitresList && pupitresList.length > 0
    ? pupitresList
    : ['Alfaias', 'Caixas', 'Sementes', 'Gonguê', 'Timbal', 'Danse', 'Chant'];

  const quotasPupitres = formData.quotasPupitres || {};

  const handleQuotaChange = (pupitre, value) => {
    const parsed = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setFormData((prev) => {
      const currentQuotas = { ...(prev.quotasPupitres || {}) };
      if (parsed === '' || parsed === 0) {
        delete currentQuotas[pupitre];
      } else {
        currentQuotas[pupitre] = parsed;
      }
      return {
        ...prev,
        quotasPupitres: currentQuotas
      };
    });
  };

  const handleTogglePupitre = (pupitre) => {
    if (disabled) return;
    setFormData((prev) => {
      const currentQuotas = { ...(prev.quotasPupitres || {}) };
      if (currentQuotas[pupitre] !== undefined) {
        delete currentQuotas[pupitre];
      } else {
        currentQuotas[pupitre] = 1; // Valeur par défaut quand activé
      }
      return {
        ...prev,
        quotasPupitres: currentQuotas
      };
    });
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-white/70 dark:bg-stone-800/70 rounded border border-encre-noire/10 text-left">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-1">
        <span className="text-[10px] font-black uppercase text-cordel-wood flex items-center gap-1.5">
          <span>🎯</span>
          <span>Pupitres Requis &amp; Quotas Cibles (Optionnel)</span>
        </span>
        <span className="text-[8px] font-bold text-neutral-500">
          {Object.keys(quotasPupitres).length} pupitre{Object.keys(quotasPupitres).length > 1 ? 's' : ''} ciblé{Object.keys(quotasPupitres).length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
        {availablePupitres.map((pupitre) => {
          const isSelected = quotasPupitres[pupitre] !== undefined;
          const quotaVal = isSelected ? quotasPupitres[pupitre] : '';

          return (
            <div
              key={pupitre}
              className={`flex items-center justify-between p-1.5 rounded border transition-all ${
                isSelected
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/80 shadow-xs'
                  : 'bg-stone-50/60 dark:bg-stone-900/30 border-stone-200 dark:border-stone-700 opacity-70'
              }`}
            >
              <label
                onClick={() => handleTogglePupitre(pupitre)}
                className="flex items-center gap-1.5 cursor-pointer select-none truncate flex-1 mr-1"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  disabled={disabled}
                  className="rounded accent-cordel-wood cursor-pointer w-3.5 h-3.5"
                />
                <span className="text-[10px] font-bold text-cordel-master-dark truncate">
                  {pupitre}
                </span>
              </label>

              {isSelected && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] font-semibold text-neutral-500">obj:</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quotaVal}
                    onChange={(e) => handleQuotaChange(pupitre, e.target.value)}
                    disabled={disabled}
                    className="w-10 theme-input text-[10px] font-black text-center py-0.5 px-1 bg-white"
                    placeholder="1"
                    title={`Objectif d'effectif pour ${pupitre}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
