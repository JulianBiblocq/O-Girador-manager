import React, { useState, useMemo, useEffect } from 'react';
import { computeAssociationUsageStats, syncUsageStatsToOrquestrador } from '../../../utils/usageStatsUtils';
import { useTranslation } from '../../LanguageContext';

/**
 * Bandeau de statistiques d'usage numérique de l'association (Bureau & CA).
 * Présente 4 indicateurs clés : Couverture Push, Fréquentation App, Lectures Mégaphone
 * et Consultations du Varal (Top 5 + documents à 0 vue), avec synchronisation quotidienne vers Orquestrador.
 */
export default function UsageStatsBanner({
  groupId, rawUsers = [], rawAnnouncements = [], rawDocuments = [], canSyncOrquestrador = false
}) {
  const { t } = useTranslation();
  const [showUnreachable, setShowUnreachable] = useState(false);
  const [showZeroViews, setShowZeroViews] = useState(false);

  const stats = useMemo(
    () => computeAssociationUsageStats({ rawUsers, rawAnnouncements, rawDocuments }),
    [rawUsers, rawAnnouncements, rawDocuments]
  );

  useEffect(() => {
    syncUsageStatsToOrquestrador(groupId, stats, canSyncOrquestrador);
  }, [groupId, stats, canSyncOrquestrador]);

  return (
    <div className="bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-4 print-card">
      <div className="border-b border-dashed border-cordel-master-dark/25 pb-2 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>📡</span>
            <span>{t('secretariatReports.usageBannerTitle') || "Suivi d'Usage Numérique & Réception des Alertes"}</span>
          </h3>
          <p className="text-[10px] text-encre-noire/70 font-medium">
            {t('secretariatReports.usageBannerDesc') || "Couverture Push, fréquentation d'Organizador, lectures du Mégaphone et consultations du Varal."}
          </p>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 border border-amber-600/40 text-amber-950 no-print">
          🔄 Synchronisé avec Orquestrador
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Couverture Notifications Push */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between gap-2">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">1. Couverture Push</span>
            <div className="text-base font-black text-[var(--color-cordel-vert,#2d6a4f)] mt-0.5">
              🔔 {stats.pushReachableCount} / {stats.totalActiveMembers} <span className="text-xs">({stats.pushReachablePercent}%)</span>
            </div>
            <p className="text-[9.5px] text-encre-noire/70 font-semibold">membres actifs joignables</p>
          </div>
          {stats.unreachableMembers.length > 0 && (
            <div className="pt-1 border-t border-dashed border-encre-noire/15 no-print">
              <button type="button" onClick={() => setShowUnreachable((v) => !v)} className="text-[9.5px] font-black text-cordel-wood hover:underline cursor-pointer">
                {showUnreachable ? '▾ Masquer' : `▸ Voir les ${stats.unreachableMembers.length} non-joignables`}
              </button>
              {showUnreachable && (
                <ul className="mt-1.5 max-h-28 overflow-y-auto text-[9.5px] font-semibold space-y-0.5 pr-1">
                  {stats.unreachableMembers.map((m) => <li key={m.id} className="truncate">🔕 {m.label}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 2. Fréquentation de l'application */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between gap-2">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">2. Fréquentation App</span>
            <div className="flex items-baseline gap-3 mt-1">
              <div><span className="text-base font-black text-[var(--color-cordel-vert,#2d6a4f)]">{stats.activeMembers7d}</span><span className="text-[9px] font-bold text-encre-noire/70 block">actifs 7j</span></div>
              <div><span className="text-base font-black text-cordel-wood">{stats.activeMembers30d}</span><span className="text-[9px] font-bold text-encre-noire/70 block">actifs 30j</span></div>
              <div><span className="text-base font-black text-stone-500">{stats.inactiveOver30d}</span><span className="text-[9px] font-bold text-encre-noire/70 block">&gt; 30j</span></div>
            </div>
          </div>
          <p className="text-[9px] text-encre-noire/60 italic">Basé sur la dernière connexion des membres actifs</p>
        </div>

        {/* 3. Lectures du Mégaphone */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between gap-2">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">3. Lectures Mégaphone</span>
            <div className="text-base font-black text-[var(--color-cordel-ocre,#c05621)] mt-0.5">
              📢 {stats.avgMegaphoneReadRate}% <span className="text-[10px] font-bold text-encre-noire/70">de lecture moy.</span>
            </div>
            <p className="text-[9px] text-encre-noire/70 font-semibold">Sur les {stats.recentAnnouncementsCount} dernière(s) annonce(s)</p>
          </div>
          {stats.recentAnnouncementsStats.length > 0 && (
            <div className="pt-1 border-t border-dashed border-encre-noire/15 space-y-0.5 max-h-20 overflow-y-auto">
              {stats.recentAnnouncementsStats.slice(0, 3).map((a) => (
                <div key={a.id} className="flex justify-between text-[9px] font-semibold gap-1">
                  <span className="truncate">{a.titre}</span><span className="font-black shrink-0">{a.readCount}/{a.targetCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Consultations du Varal */}
        <div className="p-3 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between gap-2">
          <div>
            <span className="text-[9px] font-black uppercase text-encre-noire/60 block">4. Consultations Varal</span>
            <div className="text-base font-black text-cordel-wood mt-0.5">
              🧺 {stats.varalTotalViews} vue{stats.varalTotalViews > 1 ? 's' : ''} <span className="text-[10px] font-bold text-encre-noire/70">({stats.varalTotalDocs} docs)</span>
            </div>
            {stats.top5VaralDocs.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-[9px] font-semibold">
                {stats.top5VaralDocs.slice(0, 5).map((d, i) => (
                  <li key={d.id} className="flex justify-between gap-1">
                    <span className="truncate">{i + 1}. {d.titre}</span><span className="font-black shrink-0">👁️ {d.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {stats.zeroViewVaralDocs.length > 0 && (
            <div className="pt-1 border-t border-dashed border-encre-noire/15 no-print">
              <button type="button" onClick={() => setShowZeroViews((v) => !v)} className="text-[9.5px] font-black text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer">
                {showZeroViews ? '▾ Masquer 0 vue' : `▸ ${stats.zeroViewVaralDocs.length} doc(s) à 0 vue`}
              </button>
              {showZeroViews && (
                <ul className="mt-1 max-h-24 overflow-y-auto text-[9px] font-semibold space-y-0.5 pr-1">
                  {stats.zeroViewVaralDocs.map((d) => <li key={d.id} className="truncate">📄 {d.titre}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
