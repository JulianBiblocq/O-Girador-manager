import React from 'react';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lun', full: 'Lundi' },
  { id: 2, label: 'Mar', full: 'Mardi' },
  { id: 3, label: 'Mer', full: 'Mercredi' },
  { id: 4, label: 'Jeu', full: 'Jeudi' },
  { id: 5, label: 'Ven', full: 'Vendredi' },
  { id: 6, label: 'Sam', full: 'Samedi' },
  { id: 0, label: 'Dim', full: 'Dimanche' }
];

/**
 * Formate une chaîne 'YYYY-MM-DD' en libellé convivial Cordel (ex: 'Jeu. 15 oct. 2026')
 */
function formatOccurrenceLabel(isoDateStr) {
  if (!isoDateStr) return '';
  const [yyyy, mm, dd] = isoDateStr.split('-');
  const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return dateObj.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Sous-composant : Moteur de récurrence et sélection dynamique des dates d'exception
 * Conforme à la règle anti-monolithe (< 200 lignes).
 */
export default function BatchRehearsalDateSelector({
  selectedDay,
  setSelectedDay,
  dateRange,
  setDateRange,
  occurrences = [],
  selectedDates = [],
  setSelectedDates
}) {
  const selectedCount = selectedDates.length;
  const totalCount = occurrences.length;

  const handleToggleDate = (dateStr) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr].sort();
    });
  };

  const handleSelectAll = () => {
    setSelectedDates([...occurrences]);
  };

  const handleDeselectAll = () => {
    setSelectedDates([]);
  };

  return (
    <div className="bg-[#fdfaf2] p-4 rounded-[6px_9px_7px_8px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3.5 text-left text-encre-noire">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            2. Période &amp; Jour de Récurrence
          </h4>
        </div>

        {/* Compteur dynamique */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border-2 border-encre-noire bg-amber-300 text-encre-noire shadow-2xs">
          <span>⚡</span>
          <span>{selectedCount} répétition{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}</span>
        </span>
      </div>

      {/* Choix du jour de la semaine */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80 mb-1.5">
          Jour de la semaine :
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDay === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDay(d.id)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-cordel-wood text-white shadow-[2px_2px_0px_0px_#181716] scale-105'
                    : 'bg-white hover:bg-amber-100 text-encre-noire/80'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plage de dates : Du ... au ... */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80 mb-1">
            Du (Date de début)
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80 mb-1">
            Au (Date de fin)
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood"
          />
        </div>
      </div>

      {/* Liste des occurrences trouvées et gestion des exceptions */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-encre-noire">
            Dates trouvées ({totalCount}) • Cliquez pour exclure une date (vacances, férié) :
          </span>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-encre-noire/40 bg-white hover:bg-neutral-100 cursor-pointer"
            >
              ✓ Tout cocher
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-encre-noire/40 bg-white hover:bg-neutral-100 cursor-pointer"
            >
              ✗ Tout décocher
            </button>
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="p-4 text-center bg-white/70 border border-dashed border-encre-noire/30 rounded text-xs font-bold text-cordel-master-dark/70">
            Aucune occurrence trouvée pour ce jour sur la période sélectionnée. Ajustez les dates de début et de fin.
          </div>
        ) : (
          <div className="max-h-44 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 scrollbar-thin">
            {occurrences.map((dateStr) => {
              const isChecked = selectedDates.includes(dateStr);
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleToggleDate(dateStr)}
                  className={`p-2 rounded-[4px_6px_3px_5px] border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-1 shadow-2xs ${
                    isChecked
                      ? 'bg-white border-encre-noire text-encre-noire hover:border-emerald-800'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-400 line-through opacity-60'
                  }`}
                  title={isChecked ? "Cochée (Sera créée)" : "Exclue (Ne sera pas créée)"}
                >
                  <span className="text-[11px] font-bold truncate capitalize">
                    {formatOccurrenceLabel(dateStr)}
                  </span>
                  <span className={`text-xs font-black shrink-0 ${isChecked ? 'text-[var(--color-cordel-vert)]' : 'text-neutral-400'}`}>
                    {isChecked ? '✓' : '✗'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
