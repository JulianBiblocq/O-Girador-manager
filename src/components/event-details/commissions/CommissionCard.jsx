import React, { useMemo, useState } from 'react';
import CommissionVaralAction from './CommissionVaralAction';
import { consolidateVolunteerShifts, computeVolunteerCoverage } from '../../../utils/volunteerShiftUtils';

/**
 * Carte d'affichage Cordel d'une commission
 * Présente le binôme référent, la jauge locale de jalons, la couverture bénévole consolidée et les actions.
 */
export default function CommissionCard({
  commission, event = null, groupId = null, usersMap = {}, progress = 0,
  volunteerCoverage = null, canManage = false, onManage, onView, onNavigateToView,
  getOrCreateCommissionThread, openOrCreateCommissionThread, userProfile = null, onCloseHub = null
}) {
  const { id, titre = 'Commission sans titre', icone = '📋', description = '', referentsIds = [], jalons = [], budget = {} } = commission;
  const [isOpeningForum, setIsOpeningForum] = useState(false);

  const effVolCoverage = useMemo(() => {
    if (volunteerCoverage) return volunteerCoverage;
    const all = consolidateVolunteerShifts(event || {}, [commission], usersMap);
    return computeVolunteerCoverage(all.filter((s) => s.commissionId === id));
  }, [volunteerCoverage, event, commission, usersMap, id]);

  const handleOpenThread = async (targetCommission) => {
    if (isOpeningForum || !onNavigateToView) return;
    const isDom = Boolean(targetCommission && (targetCommission.nativeEvent || targetCommission.target || typeof targetCommission.preventDefault === 'function'));
    const safeComm = (!targetCommission || isDom) ? commission : targetCommission;
    try {
      setIsOpeningForum(true);
      const fn = openOrCreateCommissionThread || getOrCreateCommissionThread;
      const evTitle = event?.titre || event?.title || 'Événement';
      let targetThreadId = safeComm?.threadId;
      if (typeof fn === 'function') {
        targetThreadId = await fn(event?.id, safeComm, evTitle, { userProfile, groupId: groupId || event?.groupId });
      }
      if (targetThreadId) {
        if (onCloseHub) onCloseHub();
        onNavigateToView('forum', { threadId: String(targetThreadId) });
      }
    } catch (err) {
      console.error('Erreur ouverture salon de débat commission :', err);
    } finally {
      setIsOpeningForum(false);
    }
  };

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { nextJalon, hasOverdueJalon } = useMemo(() => {
    const overdue = jalons.some((j) => j.status !== 'fait' && j.deadline && j.deadline < today);
    const upcoming = jalons.filter((j) => j.status !== 'fait' && j.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline));
    return { nextJalon: upcoming[0] || null, hasOverdueJalon: overdue };
  }, [jalons, today]);

  const progressColorClass = useMemo(() => {
    if (hasOverdueJalon) return 'bg-[var(--color-cordel-rouge)]';
    if (budget?.statusArbitrage === 'en_attente') return 'bg-[var(--color-cordel-ocre)]';
    return 'bg-[var(--color-cordel-vert)]';
  }, [hasOverdueJalon, budget?.statusArbitrage]);

  return (
    <div className="w-full bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_11px_7px_10px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col justify-between gap-3 text-left transition-transform hover:-translate-y-0.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-cordel-bg border border-encre-noire flex items-center justify-center text-lg shrink-0 shadow-xs">{icone}</span>
            <div className="flex flex-col min-w-0">
              <h4 className="text-sm font-black text-encre-noire truncate leading-tight">{titre}</h4>
              {description && <p className="text-[10px] text-encre-noire/70 line-clamp-1">{description}</p>}
            </div>
          </div>
          <span className="text-xs font-black px-2 py-0.5 rounded border border-encre-noire bg-cordel-bg shrink-0">{progress}%</span>
        </div>

        <div className="w-full bg-[var(--cordel-bg)] h-2 rounded-full border border-encre-noire/40 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${progressColorClass}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-cordel-master-dark/15 text-xs">
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="uppercase font-bold text-encre-noire/60">Binôme référent :</span>
          <div className="flex items-center gap-1">
            {referentsIds.length === 0 ? (
              <span className="italic text-encre-noire/50">Non assigné</span>
            ) : referentsIds.slice(0, 2).map((refId) => {
              const u = usersMap[refId] || {};
              const name = u.nom || u.displayName || u.prenom || 'Adhérent';
              return <span key={refId} className="px-1.5 py-0.5 bg-[var(--cordel-bg)] border border-encre-noire/25 rounded text-[9.5px] font-bold truncate max-w-[100px]" title={name}>👤 {name}</span>;
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="uppercase font-bold text-encre-noire/60">Prochain jalon :</span>
          {nextJalon ? (
            <span className={`font-black flex items-center gap-1 ${nextJalon.deadline < today ? 'text-[var(--color-cordel-rouge)]' : 'text-encre-noire'}`}>
              <span>{nextJalon.deadline < today ? '⚠️' : '🗓️'}</span><span>{nextJalon.deadline}</span>
            </span>
          ) : <span className="opacity-60 font-medium">Aucun jalon en attente</span>}
        </div>

        {effVolCoverage.shiftsCount > 0 && (
          <div className="flex items-center justify-between gap-2 text-[10px] pt-0.5">
            <span className="uppercase font-bold text-encre-noire/60">🤝 Bénévoles :</span>
            <span className={`px-1.5 py-0.5 rounded font-black border border-encre-noire/30 text-white ${
              effVolCoverage.isComplete ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'
            }`}>
              {effVolCoverage.totalRequired > 0
                ? `${effVolCoverage.filledPosts} / ${effVolCoverage.totalRequired} postes pourvus`
                : `${effVolCoverage.totalInscrits} inscrit(s)`}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-dashed border-cordel-master-dark/20 w-full">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2 w-full">
          {event && <CommissionVaralAction event={event} commission={commission} usersMap={usersMap} groupId={groupId} variant="compact" className="w-full col-span-1 sm:w-auto" />}
          {onNavigateToView && (
            <button type="button" disabled={isOpeningForum} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenThread(commission); }} className="w-full sm:w-auto col-span-1 px-2 py-1.5 text-[10px] font-black rounded border border-encre-noire bg-cordel-bg hover:bg-[var(--theme-hover-bg)] cursor-pointer shadow-xs flex items-center justify-center gap-1 text-encre-noire disabled:opacity-50 truncate">
              <span className="shrink-0">{isOpeningForum ? '⏳' : '💬'}</span><span className="truncate">Salon Débat</span>
            </button>
          )}
          <button type="button" onClick={() => onView && onView(commission)} className="w-full sm:w-auto col-span-1 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire bg-cordel-bg hover:bg-[var(--theme-hover-bg)] cursor-pointer shadow-xs flex items-center justify-center truncate">
            👁️ Consulter
          </button>
          {canManage && (
            <button type="button" onClick={() => onManage && onManage(commission)} className="w-full sm:w-auto col-span-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded border-2 border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:brightness-105 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] flex items-center justify-center truncate">
              ✏️ Gérer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
