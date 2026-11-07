import React, { useState, useMemo } from 'react';
import { buildPollPupitreMatrix, computeOptimalPupitreAllocation } from '../../utils/pollAllocationUtils';
import { sendPollUnansweredReminder } from '../../utils/pollNotificationUtils';
import PollPupitreDispatchActions from './PollPupitreDispatchActions';
import PollPupitreMatrixCell from './PollPupitreMatrixCell';
import PollPupitreHeaderCell from './PollPupitreHeaderCell';

const DEFAULT_PUPITRES = ['Alfaias', 'Caixas', 'Gonguê', 'Agbê'];

/** Tableau de synthèse Mestre & Matrice croisée (Dates x Pupitres) (< 140 lignes) */
export default function PollPupitreDispatchPanel({
  pollEvents = [], allUsers = [], targetPupitres = [], pupitresList = [], linkedInstruments = [],
  isSuperAdminOrMestre = false, isProcessing = false, formatDate, onConfirmSinglePupitre, onConfirmDispatch
}) {
  const [allowLatecomers, setAllowLatecomers] = useState(true);
  const [manualOverrides, setManualOverrides] = useState({});
  const [expandedHeaderPupitre, setExpandedHeaderPupitre] = useState(null);
  const [remindingKey, setRemindingKey] = useState(null);
  const [reminderFeedback, setReminderFeedback] = useState('');

  const effectivePupitres = useMemo(() => {
    if (Array.isArray(targetPupitres) && targetPupitres.length > 0) return targetPupitres;
    if (Array.isArray(pupitresList) && pupitresList.length > 0) return pupitresList.slice(0, 6);
    return DEFAULT_PUPITRES;
  }, [targetPupitres, pupitresList]);

  const matrix = useMemo(
    () => buildPollPupitreMatrix({ pollEvents, allUsers, targetPupitres: effectivePupitres, linkedInstruments }),
    [pollEvents, allUsers, effectivePupitres, linkedInstruments]
  );
  const optimal = useMemo(
    () => computeOptimalPupitreAllocation(matrix, pollEvents, effectivePupitres),
    [matrix, pollEvents, effectivePupitres]
  );
  const activeAllocation = useMemo(
    () => ({ ...optimal.allocation, ...manualOverrides }),
    [optimal.allocation, manualOverrides]
  );
  const totalPresents = useMemo(
    () => effectivePupitres.reduce((acc, p) => acc + (matrix?.[activeAllocation[p]]?.[p]?.count || 0), 0),
    [effectivePupitres, matrix, activeAllocation]
  );

  const allUnanswered = useMemo(() => {
    const map = new Map();
    effectivePupitres.forEach((p) => {
      (matrix?.pupitreStats?.[p]?.totallyUnansweredMembers || []).forEach((m) => {
        if (m?.uid) map.set(m.uid, m);
      });
    });
    return Array.from(map.values());
  }, [effectivePupitres, matrix]);

  const sharedDates = useMemo(() => {
    const byDate = {};
    effectivePupitres.forEach((p) => {
      const dId = activeAllocation[p];
      if (dId) byDate[dId] = [...(byDate[dId] || []), p];
    });
    return Object.entries(byDate).filter(([, list]) => list.length > 1);
  }, [effectivePupitres, activeAllocation]);

  const handleTriggerRemind = async (pupitreLabel, membersList) => {
    if (remindingKey || !membersList?.length) return;
    const firstEv = pollEvents[0] || {};
    setRemindingKey(pupitreLabel);
    try {
      const count = await sendPollUnansweredReminder({
        groupId: firstEv.groupId, firstPollEventId: firstEv.id,
        eventTitle: firstEv.titre || 'Atelier', pupitreLabel, unansweredMembers: membersList
      });
      setReminderFeedback(`✅ Relance envoyée à ${count} membre(s) (${pupitreLabel})`);
      setTimeout(() => { setRemindingKey(null); setReminderFeedback(''); }, 4500);
    } catch {
      setRemindingKey(null);
    }
  };

  if (pollEvents.length === 0 || effectivePupitres.length === 0) return null;

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
        <div className="flex flex-wrap items-center gap-1.5">
          {isSuperAdminOrMestre && allUnanswered.length > 0 && (
            <button type="button" disabled={Boolean(remindingKey)} onClick={() => handleTriggerRemind(effectivePupitres.join(', '), allUnanswered)} className="text-[9px] font-black uppercase px-2 py-1 rounded border border-encre-noire bg-amber-100 text-[var(--color-cordel-ocre,#c05621)] hover:brightness-95 disabled:opacity-50 cursor-pointer">
              🔔 Relancer tous les sans-réponse ({allUnanswered.length})
            </button>
          )}
          {Object.keys(manualOverrides).length > 0 && isSuperAdminOrMestre && (
            <button type="button" onClick={() => setManualOverrides({})} className="text-[9px] font-black uppercase px-2 py-1 rounded border border-encre-noire bg-cordel-bg hover:brightness-95 cursor-pointer">
              🔄 Réinitialiser l'optimum
            </button>
          )}
        </div>
      </div>

      {reminderFeedback && (
        <div className="px-2.5 py-1.5 rounded border border-emerald-600/40 bg-emerald-50 text-[10px] font-extrabold text-[var(--color-cordel-vert,#2d6a4f)]">
          {reminderFeedback}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-cordel-bg-light border-b-2 border-encre-noire text-cordel-wood font-black uppercase">
              <th className="p-2 text-left border-r border-encre-noire/20 align-top">Créneau proposé</th>
              {effectivePupitres.map((p) => (
                <PollPupitreHeaderCell
                  key={p} pupitre={p} stats={matrix?.pupitreStats?.[p] || matrix?.[pollEvents[0]?.id]?.[p] || {}}
                  isOpen={expandedHeaderPupitre === p} onToggleOpen={() => setExpandedHeaderPupitre((prev) => (prev === p ? null : p))}
                  isSuperAdminOrMestre={isSuperAdminOrMestre} isReminding={Boolean(remindingKey)} onRemindPupitre={handleTriggerRemind}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {pollEvents.map((ev, idx) => (
              <tr key={ev.id} className="border-b border-encre-noire/15">
                <td className="p-2 font-extrabold text-encre-noire border-r border-encre-noire/20 whitespace-nowrap align-top">
                  <span className="text-cordel-wood mr-1">Opt. {ev.optionIndex || idx + 1} :</span>
                  {formatDate ? formatDate(ev.date) : ev.date}
                </td>
                {effectivePupitres.map((p) => (
                  <PollPupitreMatrixCell
                    key={p} cell={matrix?.[ev.id]?.[p] || {}} isSelected={activeAllocation[p] === ev.id}
                    isSuperAdminOrMestre={isSuperAdminOrMestre} onSelectSlot={() => setManualOverrides((prev) => ({ ...prev, [p]: ev.id }))}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSuperAdminOrMestre && (
        <PollPupitreDispatchActions
          effectivePupitres={effectivePupitres} pollEvents={pollEvents} matrix={matrix}
          activeAllocation={activeAllocation} setManualOverrides={setManualOverrides}
          sharedDates={sharedDates} totalPresents={totalPresents}
          allowLatecomers={allowLatecomers} setAllowLatecomers={setAllowLatecomers}
          isProcessing={isProcessing} formatDate={formatDate}
          onConfirmSinglePupitre={onConfirmSinglePupitre} onConfirmDispatch={onConfirmDispatch}
        />
      )}
    </div>
  );
}
