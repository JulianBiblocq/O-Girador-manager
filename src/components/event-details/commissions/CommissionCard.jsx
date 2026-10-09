import React, { useMemo, useState } from 'react';
import CommissionVaralAction from './CommissionVaralAction';

/**
 * Carte d'affichage Cordel d'une commission
 * Présente le binôme référent, la jauge locale dynamique et les dates butoirs.
 */
export default function CommissionCard({
  commission, event = null, groupId = null, usersMap = {}, progress = 0,
  canManage = false, onManage, onView, onNavigateToView,
  getOrCreateCommissionThread, openOrCreateCommissionThread, userProfile = null, onCloseHub = null
}) {
  const { id, titre = 'Commission sans titre', icone = '📋', description = '', referentsIds = [], jalons = [], budget = {} } = commission;
  const [isOpeningForum, setIsOpeningForum] = useState(false);

  // Gestionnaire d'ouverture sécurisé du fil de discussion Porte-Voix
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
      console.error("Erreur ouverture salon de débat commission :", err);
    } finally {
      setIsOpeningForum(false);
    }
  };

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Détection du prochain jalon et des retards
  const { nextJalon, hasOverdueJalon } = useMemo(() => {
    let overdue = false;
    const upcoming = jalons
      .filter((j) => {
        if (j.status !== 'fait' && j.deadline && j.deadline < today) {
          overdue = true;
        }
        return j.status !== 'fait' && j.deadline;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline));

    return { nextJalon: upcoming[0] || null, hasOverdueJalon: overdue };
  }, [jalons, today]);

  const hasPendingBudget = budget?.statusArbitrage === 'en_attente';

  // Couleur sémantique Cordel de la jauge
  const progressColorClass = useMemo(() => {
    if (hasOverdueJalon) return 'bg-[var(--color-cordel-rouge,#8b2a1a)]';
    if (hasPendingBudget) return 'bg-[var(--color-cordel-ocre,#c05621)]';
    return 'bg-[var(--color-cordel-vert,#2d6a4f)]';
  }, [hasOverdueJalon, hasPendingBudget]);

  return (
    <div className="w-full bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_11px_7px_10px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col justify-between gap-3 text-left transition-transform hover:-translate-y-0.5">
      {/* En-tête : Icône, Titre & Statut */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-cordel-bg border border-encre-noire flex items-center justify-center text-lg shrink-0 shadow-xs">
              {icone}
            </span>
            <div className="flex flex-col min-w-0">
              <h4 className="text-sm font-black text-encre-noire truncate leading-tight">
                {titre}
              </h4>
              {description && (
                <p className="text-[10px] text-encre-noire/70 line-clamp-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          <span className="text-xs font-black px-2 py-0.5 rounded border border-encre-noire bg-cordel-bg shrink-0">
            {progress}%
          </span>
        </div>

        {/* Jauge locale */}
        <div className="w-full bg-stone-200 h-2 rounded-full border border-encre-noire/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColorClass}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Binôme référent & Prochain jalon */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-cordel-master-dark/15 text-xs">
        {/* Binôme référent */}
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="uppercase font-bold text-encre-noire/60">Binôme référent :</span>
          <div className="flex items-center gap-1">
            {referentsIds.length === 0 ? (
              <span className="italic text-encre-noire/50">Non assigné</span>
            ) : (
              referentsIds.slice(0, 2).map((refId) => {
                const u = usersMap[refId] || {};
                const name = u.nom || u.displayName || u.prenom || 'Adhérent';
                return (
                  <span
                    key={refId}
                    className="px-1.5 py-0.5 bg-amber-100/80 border border-amber-800/30 rounded text-[9.5px] font-bold truncate max-w-[100px]"
                    title={name}
                  >
                    👤 {name}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Prochaine date butoir */}
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="uppercase font-bold text-encre-noire/60">Prochain jalon :</span>
          {nextJalon ? (
            <span className={`font-black flex items-center gap-1 ${
              nextJalon.deadline < today ? 'text-[var(--color-cordel-rouge)]' : 'text-encre-noire'
            }`}>
              <span>{nextJalon.deadline < today ? '⚠️' : '🗓️'}</span>
              <span>{nextJalon.deadline}</span>
            </span>
          ) : (
            <span className="text-stone-500 font-medium">Aucun jalon en attente</span>
          )}
        </div>
      </div>

      {/* Boutons d'action Cordel & Synchronisation Varal */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
        {event && (
          <CommissionVaralAction
            event={event}
            commission={commission}
            usersMap={usersMap}
            groupId={groupId}
            variant="compact"
          />
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {onNavigateToView && (
            <button
              type="button"
              disabled={isOpeningForum}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenThread(commission);
              }}
              className="px-2 py-1 text-[10px] font-black rounded border border-encre-noire bg-cordel-bg hover:bg-stone-200 cursor-pointer shadow-xs active:translate-y-0.5 flex items-center gap-1 text-encre-noire disabled:opacity-50"
              title="Ouvrir le salon de débat de cette commission sur le Porte-Voix"
            >
              <span>{isOpeningForum ? '⏳' : '💬'}</span>
              <span>Salon Débat</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onView && onView(commission)}
            className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire bg-cordel-bg hover:bg-stone-200 cursor-pointer shadow-xs active:translate-y-0.5"
          >
            👁️ Consulter
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => onManage && onManage(commission)}
              className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border-2 border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:brightness-105 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-y-0.5"
            >
              ✏️ Gérer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
