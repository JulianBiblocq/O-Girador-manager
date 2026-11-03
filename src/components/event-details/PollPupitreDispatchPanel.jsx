import React, { useState, useMemo } from 'react';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { buildPollPupitreMatrix, computeOptimalPupitreAllocation } from '../../utils/pollAllocationUtils';

const DEFAULT_PUPITRES = ['Alfaias', 'Caixas', 'Gonguê', 'Agbê'];

/** Tableau de synthèse Mestre & Matrice croisée (Dates x Pupitres) (< 140 lignes) */
export default function PollPupitreDispatchPanel({
  pollEvents = [], allUsers = [], targetPupitres = [], pupitresList = [], linkedInstruments = [],
  isSuperAdminOrMestre = false, isProcessing = false, formatDate, onConfirmDispatch
}) {
  const effectivePupitres = useMemo(() => {
    if (Array.isArray(targetPupitres) && targetPupitres.length > 0) return targetPupitres;
    if (Array.isArray(pupitresList) && pupitresList.length > 0) return pupitresList.slice(0, 6);
    return DEFAULT_PUPITRES;
  }, [targetPupitres, pupitresList]);

  const matrix = useMemo(
    () => buildPollPupitreMatrix({ pollEvents, allUsers, targetPupitres: effectivePupitres, linkedInstruments }),
    [pollEvents, allUsers, effectivePupitres, linkedInstruments]
  );
  const optimal = useMemo(() => computeOptimalPupitreAllocation(matrix, pollEvents, effectivePupitres), [matrix, pollEvents, effectivePupitres]);

  const [manualOverrides, setManualOverrides] = useState({});
  const activeAllocation = useMemo(() => ({ ...optimal.allocation, ...manualOverrides }), [optimal.allocation, manualOverrides]);
  const totalPresents = useMemo(
    () => effectivePupitres.reduce((acc, p) => acc + (matrix?.[activeAllocation[p]]?.[p]?.count || 0), 0),
    [effectivePupitres, matrix, activeAllocation]
  );

  // Détection des collisions (2 pupitres ou plus sur la même date)
  const sharedDates = useMemo(() => {
    const byDate = {};
    effectivePupitres.forEach((p) => {
      const dId = activeAllocation[p];
      if (dId) byDate[dId] = [...(byDate[dId] || []), p];
    });
    return Object.entries(byDate).filter(([, list]) => list.length > 1);
  }, [effectivePupitres, activeAllocation]);

  if (pollEvents.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-3 bg-white/85 dark:bg-black/30 border-2 border-encre-noire rounded-lg shadow-[2px_2px_0px_0px_#181716] text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-encre-noire/20 pb-2">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🥁</span> <span>Matrice de répartition par pupitre (Dates × Pupitres)</span>
          </h4>
          <p className="text-[10px] font-semibold text-encre-noire/75">
            Proposition optimale calculée : <strong className="text-[var(--color-cordel-vert,#2d6a4f)]">{totalPresents} présent(s) cumulé(s)</strong>
          </p>
        </div>
        {Object.keys(manualOverrides).length > 0 && isSuperAdminOrMestre && (
          <button type="button" onClick={() => setManualOverrides({})} className="text-[9px] font-black uppercase px-2 py-1 rounded border border-encre-noire bg-cordel-bg hover:brightness-95 cursor-pointer">
            🔄 Réinitialiser l'optimum
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-cordel-bg-light border-b-2 border-encre-noire text-cordel-wood font-black uppercase">
              <th className="p-2 text-left border-r border-encre-noire/20">Créneau proposé</th>
              {effectivePupitres.map((p) => <th key={p} className="p-2 text-center border-r border-encre-noire/15 last:border-r-0">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {pollEvents.map((ev, idx) => (
              <tr key={ev.id} className="border-b border-encre-noire/15">
                <td className="p-2 font-extrabold text-encre-noire border-r border-encre-noire/20 whitespace-nowrap">
                  <span className="text-cordel-wood mr-1">Opt. {ev.optionIndex || idx + 1} :</span>{formatDate ? formatDate(ev.date) : ev.date}
                </td>
                {effectivePupitres.map((p) => {
                  const cell = matrix?.[ev.id]?.[p] || { availableMembers: [], count: 0, totalPupitre: 0, percentage: 0 };
                  const isSelected = activeAllocation[p] === ev.id;
                  return (
                    <td key={p} onClick={() => isSuperAdminOrMestre && setManualOverrides((prev) => ({ ...prev, [p]: ev.id }))} className={`p-2 border-r border-encre-noire/15 last:border-r-0 align-top transition-all ${isSuperAdminOrMestre ? 'cursor-pointer' : ''} ${isSelected ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-inset ring-[var(--color-cordel-vert,#2d6a4f)] font-bold' : 'hover:bg-amber-50/50'}`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={isSelected ? 'text-[var(--color-cordel-vert,#2d6a4f)] font-black' : 'font-bold text-encre-noire'}>{cell.count} / {cell.totalPupitre} dispo ({cell.percentage}%)</span>
                        {isSelected && <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white">Retenu</span>}
                      </div>
                      {cell.availableMembers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {cell.availableMembers.slice(0, 4).map((m) => (
                            <span key={m.uid} className="inline-flex items-center gap-0.5 text-[8.5px] bg-white/90 border border-encre-noire/20 px-1 py-0.2 rounded">
                              <XiloAvatar src={m.photoURL} name={m.name} size={11} /> <span>{m.prenom}</span>
                            </span>
                          ))}
                          {cell.availableMembers.length > 4 && <span className="text-[8px] opacity-70">+{cell.availableMembers.length - 4}</span>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSuperAdminOrMestre && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-encre-noire/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {effectivePupitres.map((p) => (
              <div key={p} className="flex flex-col gap-1 p-2 rounded bg-cordel-bg-light border border-encre-noire/25">
                <label className="text-[9px] font-black uppercase text-cordel-wood">🥁 {p}</label>
                <select value={activeAllocation[p] || ''} onChange={(e) => setManualOverrides((prev) => ({ ...prev, [p]: e.target.value }))} className="theme-input text-[10px] font-bold py-1 px-1.5 bg-white">
                  {pollEvents.map((ev, i) => {
                    const c = matrix?.[ev.id]?.[p] || { count: 0, totalPupitre: 0 };
                    return <option key={ev.id} value={ev.id}>Opt. {ev.optionIndex || i + 1} — {formatDate ? formatDate(ev.date) : ev.date} ({c.count}/{c.totalPupitre})</option>;
                  })}
                </select>
              </div>
            ))}
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
            <CordelButton variant="vert" useExtremeBorder={true} disabled={isProcessing} onClick={() => onConfirmDispatch && onConfirmDispatch(activeAllocation, matrix, effectivePupitres)} className="text-xs font-black uppercase py-2 px-4 w-full sm:w-auto">
              {isProcessing ? 'Validation en cours...' : '✅ Valider la répartition'}
            </CordelButton>
          </div>
        </div>
      )}
    </div>
  );
}
