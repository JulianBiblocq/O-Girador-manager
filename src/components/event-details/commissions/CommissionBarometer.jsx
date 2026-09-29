import React from 'react';

/**
 * Baromètre de santé global du projet / événement
 * Affiche la jauge % globale, les compteurs de jalons, les arbitrages budgétaires et alertes de retard.
 */
export default function CommissionBarometer({ stats = {} }) {
  const {
    globalProgress = 0,
    totalJalons = 0,
    completedJalons = 0,
    pendingArbitrationsCount = 0,
    overdueAlertsCount = 0
  } = stats;

  return (
    <div className="w-full bg-cordel-bg-light/95 border-2 border-encre-noire rounded-[8px_12px_7px_10px] p-4 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              Baromètre d'avancement général
            </h3>
            <p className="text-[10px] text-encre-noire/70">
              Synthèse en temps réel de tous les chantiers et commissions
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 self-end sm:self-auto">
          <span className="text-2xl font-black text-encre-noire tracking-tight">
            {globalProgress}%
          </span>
          <span className="text-[10px] uppercase font-bold text-cordel-master-dark/60">
            complété
          </span>
        </div>
      </div>

      {/* Jauge globale visuelle */}
      <div className="w-full bg-stone-200 h-3 rounded-full border border-encre-noire overflow-hidden p-0.5">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[var(--color-cordel-ocre,#c05621)] to-[var(--color-cordel-vert,#2d6a4f)]"
          style={{ width: `${Math.min(100, Math.max(0, globalProgress))}%` }}
        />
      </div>

      {/* Cartouches d'indicateurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Jalons terminés */}
        <div className="p-2.5 bg-cordel-bg rounded-[5px_7px_6px_8px] border border-encre-noire/30 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-black tracking-wider text-encre-noire/70">
                Jalons bouclés
              </span>
              <span className="text-xs font-black text-encre-noire">
                {completedJalons} / {totalJalons}
              </span>
            </div>
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
            totalJalons > 0 && completedJalons === totalJalons
              ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire'
              : 'bg-stone-200 text-stone-800 border-stone-300'
          }`}>
            {totalJalons > 0 ? `${Math.round((completedJalons / totalJalons) * 100)}%` : '0%'}
          </span>
        </div>

        {/* Arbitrages Trésorerie en attente */}
        <div className={`p-2.5 rounded-[5px_7px_6px_8px] border shadow-xs flex items-center justify-between ${
          pendingArbitrationsCount > 0
            ? 'bg-amber-100/90 border-amber-500 text-amber-950 animate-pulse'
            : 'bg-cordel-bg border-encre-noire/30'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-black tracking-wider text-encre-noire/70">
                Arbitrages budget
              </span>
              <span className="text-xs font-black text-encre-noire">
                {pendingArbitrationsCount === 0 ? "Tous validés" : `${pendingArbitrationsCount} en attente`}
              </span>
            </div>
          </div>
          {pendingArbitrationsCount > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--color-cordel-ocre)] text-white border border-encre-noire">
              CA
            </span>
          )}
        </div>

        {/* Alertes de dates dépassées */}
        <div className={`p-2.5 rounded-[5px_7px_6px_8px] border shadow-xs flex items-center justify-between ${
          overdueAlertsCount > 0
            ? 'bg-rose-100/90 border-rose-500 text-rose-950'
            : 'bg-cordel-bg border-encre-noire/30'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{overdueAlertsCount > 0 ? "🚨" : "🛡️"}</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-black tracking-wider text-encre-noire/70">
                Alertes retard
              </span>
              <span className="text-xs font-black text-encre-noire">
                {overdueAlertsCount === 0 ? "À jour" : `${overdueAlertsCount} en retard`}
              </span>
            </div>
          </div>
          {overdueAlertsCount > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--color-cordel-rouge)] text-white border border-encre-noire">
              Urgent
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
