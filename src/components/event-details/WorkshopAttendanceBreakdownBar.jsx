import React from 'react';
import { computeWorkshopAttendanceBreakdown } from '../../utils/workshopSanctuaryUtils';

/**
 * Barre synthétique affichant distinctement le sous-total des Titulaires du pupitre,
 * les Inscrits d'autres pupitres / Découverte, et le badge secondaire d'attente de re-confirmation.
 */
export default function WorkshopAttendanceBreakdownBar({
  event,
  allUsers = [],
  pupitresList = [],
  linkedInstruments = []
}) {
  const allUsersMap = React.useMemo(() => {
    const map = {};
    (allUsers || []).forEach((u) => {
      if (u?.id) map[u.id] = u;
      if (u?.uid) map[u.uid] = u;
    });
    return map;
  }, [allUsers]);

  const breakdown = React.useMemo(
    () => computeWorkshopAttendanceBreakdown({ event, allUsersMap, pupitresList, linkedInstruments }),
    [event, allUsersMap, pupitresList, linkedInstruments]
  );

  if (!breakdown.targetPupitres || breakdown.targetPupitres.length === 0) return null;
  if (event?.status === 'sondage' || event?.isPoll) return null;

  const titulairesCount = breakdown.titulairesPresents.length;
  const autresCount = breakdown.autresPupitresPresents.length;
  const pendingReconfirmCount = breakdown.pendingReconfirmList.length;

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded border border-dashed border-encre-noire/25 bg-cordel-bg-light/80 text-xs select-none">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white font-black text-[10.5px] uppercase tracking-wide">
        <span>🥁 {breakdown.targetPupitreLabel} :</span>
        <span>{titulairesCount}</span>
      </span>

      {autresCount > 0 && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-encre-noire bg-cordel-bg text-encre-noire font-extrabold text-[10.5px] uppercase tracking-wide"
          title={breakdown.autresPupitresPresents.map((x) => x.ins?.userName || 'Membre').join(', ')}
        >
          <span>✨ Autres pupitres :</span>
          <span>{autresCount}</span>
        </span>
      )}

      {pendingReconfirmCount > 0 && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--color-cordel-ocre)] text-[var(--color-cordel-ocre)] bg-cordel-bg-light font-bold text-[10px]"
          title={breakdown.pendingReconfirmList.map((x) => x.ins?.userName || 'Membre').join(', ')}
        >
          ⏳ {pendingReconfirmCount} en attente de re-confirmation
        </span>
      )}
    </div>
  );
}
