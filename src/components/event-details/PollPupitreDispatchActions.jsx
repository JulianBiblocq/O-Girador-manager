import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Sous-composant des actions de validation par pupitre (unitaire en entonnoir + globale)
 * et option d'ouverture aux retardataires.
 * Extrait de PollPupitreDispatchPanel.jsx (< 140 lignes).
 */
export default function PollPupitreDispatchActions({
  effectivePupitres = [],
  pollEvents = [],
  matrix = {},
  activeAllocation = {},
  setManualOverrides,
  sharedDates = [],
  totalPresents = 0,
  allowLatecomers = true,
  setAllowLatecomers,
  isProcessing = false,
  formatDate,
  onConfirmSinglePupitre,
  onConfirmDispatch
}) {
  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-encre-noire/20">
      {/* Option d'ouverture aux retardataires du pupitre */}
      <label className="flex items-start sm:items-center gap-2 p-2 rounded bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-400/50 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={allowLatecomers}
          onChange={(e) => setAllowLatecomers(e.target.checked)}
          disabled={isProcessing}
          className="w-4 h-4 accent-[var(--color-cordel-vert,#2d6a4f)] rounded cursor-pointer mt-0.5 sm:mt-0 shrink-0"
        />
        <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-200 leading-snug">
          🔓 Laisser les inscriptions ouvertes aux retardataires de ce pupitre jusqu'au jour de l'atelier
        </span>
      </label>

      {/* Sélecteur et bouton de validation unitaire ("En entonnoir") par pupitre */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {effectivePupitres.map((p) => {
          const selectedEventId = activeAllocation[p] || pollEvents[0]?.id || '';
          const selectedEv = pollEvents.find((ev) => ev.id === selectedEventId) || pollEvents[0];
          const selectedDateLabel = selectedEv
            ? (formatDate ? formatDate(selectedEv.date) : selectedEv.date)
            : '';
          const selectedCell = matrix?.[selectedEventId]?.[p] || { count: 0, totalPupitre: 0 };
          const is100PercentVoted = selectedCell.totalPupitre > 0 &&
            pollEvents.some((ev) => {
              const votes = ev?.votes || {};
              return Object.keys(votes).length >= selectedCell.totalPupitre;
            });

          return (
            <div
              key={p}
              className="flex flex-col justify-between gap-1.5 p-2.5 rounded bg-cordel-bg-light border border-encre-noire/25"
            >
              <div className="flex items-center justify-between gap-1">
                <label className="text-[9.5px] font-black uppercase text-cordel-wood flex items-center gap-1">
                  <span>🥁 {p}</span>
                </label>
                <span className="text-[9px] font-extrabold text-[var(--color-cordel-vert,#2d6a4f)]">
                  {selectedCell.count}/{selectedCell.totalPupitre} dispo
                  {is100PercentVoted ? ' 🎯' : ''}
                </span>
              </div>

              <select
                value={selectedEventId}
                onChange={(e) => setManualOverrides((prev) => ({ ...prev, [p]: e.target.value }))}
                disabled={isProcessing}
                className="theme-input text-[10px] font-bold py-1 px-1.5 bg-white"
              >
                {pollEvents.map((ev, i) => {
                  const c = matrix?.[ev.id]?.[p] || { count: 0, totalPupitre: 0 };
                  return (
                    <option key={ev.id} value={ev.id}>
                      Opt. {ev.optionIndex || i + 1} — {formatDate ? formatDate(ev.date) : ev.date} ({c.count}/{c.totalPupitre})
                    </option>
                  );
                })}
              </select>

              {onConfirmSinglePupitre && selectedEventId && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onConfirmSinglePupitre(p, selectedEventId, allowLatecomers, matrix)}
                  className="mt-0.5 w-full text-[9.5px] font-black uppercase py-1.5 px-2 rounded border border-encre-noire bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all text-center"
                >
                  📌 Valider ce créneau ({p} ➔ {selectedDateLabel})
                </button>
              )}
            </div>
          );
        })}
      </div>

      {sharedDates.length > 0 && (
        <div className="p-2 rounded border border-[var(--color-cordel-ocre,#c05621)] bg-amber-100/80 text-[var(--color-cordel-ocre,#c05621)] text-[10px] font-bold">
          ⚠️ Attention : {sharedDates.map(([, list]) => list.join(' & ')).join(' / ')} partagent la même date (atelier fusionné sur ce créneau).
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-black text-encre-noire">
          Total retenu : <strong className="text-[var(--color-cordel-vert,#2d6a4f)]">{totalPresents} adhérent(s) inscrit(s)</strong> sur {effectivePupitres.length} pupitre(s)
        </span>
        <CordelButton
          variant="vert"
          useExtremeBorder={true}
          disabled={isProcessing}
          onClick={() => onConfirmDispatch && onConfirmDispatch(activeAllocation, matrix, effectivePupitres, allowLatecomers)}
          className="text-xs font-black uppercase py-2 px-4 w-full sm:w-auto"
        >
          {isProcessing ? 'Validation en cours...' : '✅ Tout valider'}
        </CordelButton>
      </div>
    </div>
  );
}

