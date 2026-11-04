import React from 'react';
import CordelCard from '../../CordelCard';

/** Formate une date ISO YYYY-MM-DD en DD/MM/YYYY pour le sélecteur compact. */
function formatShortFrDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  const parts = isoStr.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoStr;
}

/**
 * Bandeau compact de sélection de la période d'analyse (Gain de 75 % de hauteur sur mobile).
 * Affiche un <select> Cordel sur une ligne et ne révèle les champs DU / AU que pour "Période personnalisée".
 */
export default function AgPeriodSelectorBar({
  periodPreset,
  onSelectPreset,
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  currentSeason,
  previousSeason,
  currentSeasonRange,
  previousSeasonRange,
  currentFiscalRange,
  previousFiscalRange,
  allExpanded,
  onToggleAllAccordions
}) {
  return (
    <CordelCard
      variant="default"
      useExtremeBorder={false}
      className="p-2.5 sm:p-3 flex flex-col gap-2 no-print"
      data-tour="reports-period-selector"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Sélecteur déroulant de période sur 1 ligne */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label
            htmlFor="ag-period-select"
            className="text-[10px] font-black uppercase tracking-wider text-cordel-wood shrink-0 flex items-center gap-1"
          >
            <span>📅</span>
            <span>Période :</span>
          </label>
          <select
            id="ag-period-select"
            value={periodPreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="theme-input py-1.5 px-2.5 text-[11px] sm:text-xs font-black text-encre-noire bg-cordel-bg border-2 border-encre-noire rounded-[4px_6px_3px_5px] flex-1 min-w-0 cursor-pointer truncate"
          >
            <option value="current_season">
              Saison en cours ({currentSeason}) ({formatShortFrDate(currentSeasonRange.startDate)} - {formatShortFrDate(currentSeasonRange.endDate)})
            </option>
            <option value="previous_season">
              Saison précédente ({previousSeason}) ({formatShortFrDate(previousSeasonRange.startDate)} - {formatShortFrDate(previousSeasonRange.endDate)})
            </option>
            <option value="current_fiscal">
              Exercice civil en cours ({currentFiscalRange.fiscalYearLabel}) ({formatShortFrDate(currentFiscalRange.startDate)} - {formatShortFrDate(currentFiscalRange.endDate)})
            </option>
            <option value="previous_fiscal">
              Exercice civil N-1 ({previousFiscalRange.fiscalYearLabel}) ({formatShortFrDate(previousFiscalRange.startDate)} - {formatShortFrDate(previousFiscalRange.endDate)})
            </option>
            <option value="custom">
              Période personnalisée (Du... Au...)
            </option>
          </select>
        </div>

        {/* Bouton global Tout déplier / Tout replier */}
        <button
          type="button"
          onClick={onToggleAllAccordions}
          className="px-2.5 py-1.5 text-[9.5px] font-black uppercase tracking-wider bg-cordel-bg hover:bg-amber-100 text-cordel-wood border border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] cursor-pointer shrink-0 whitespace-nowrap"
        >
          {allExpanded ? '▴ Tout replier' : '▾ Tout déplier'}
        </button>
      </div>

      {/* Champs de dates DU / AU affichés uniquement en mode Période personnalisée */}
      {periodPreset === 'custom' && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
          <div className="flex items-center gap-1.5">
            <label className="text-[9.5px] font-black uppercase text-encre-noire/75 shrink-0">Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onChangeStartDate(e.target.value)}
              className="theme-input px-2 py-1 text-xs font-bold rounded border border-encre-noire w-full bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[9.5px] font-black uppercase text-encre-noire/75 shrink-0">Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onChangeEndDate(e.target.value)}
              className="theme-input px-2 py-1 text-xs font-bold rounded border border-encre-noire w-full bg-white"
            />
          </div>
        </div>
      )}
    </CordelCard>
  );
}

