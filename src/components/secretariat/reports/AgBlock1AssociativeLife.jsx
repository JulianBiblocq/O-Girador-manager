import React from 'react';
import { useTranslation } from '../../LanguageContext';
import AgReportAccordionCard from './AgReportAccordionCard';

/**
 * Accordéon 1 : Vie Associative, Adhésions, Répartition par pupitre & Ancrage Territorial (Cerfa).
 * Résumé replié : "54 actifs • 47 à jour • 51% commune siège"
 */
export default function AgBlock1AssociativeLife({ indicators, isOpen, onToggle }) {
  const { t } = useTranslation();
  const {
    totalMembers = 0,
    activeMembers = 0,
    cotisationsUpToDate = 0,
    cotisationsPending = 0,
    sortedPupitres = [],
    territorialStats = {}
  } = indicators || {};

  const {
    totalAudited = 0,
    totalActiveMembers = 0,
    communeMembersCount = 0,
    communeMembersPercent = 0,
    externalMembersCount = 0,
    externalMembersPercent = 0,
    topCommunes = [],
    siegeCP = null,
    siegeVille = null
  } = territorialStats;

  const summaryText = `${activeMembers} actifs • ${cotisationsUpToDate} à jour • ${communeMembersPercent}% commune siège`;
  const badgeText = siegeVille ? `${siegeVille}${siegeCP ? ` (${siegeCP})` : ''}` : null;

  return (
    <AgReportAccordionCard
      icon="👥"
      title={t('secretariatReports.block1Title') || '1. Vie Associative & Adhésions'}
      summaryText={summaryText}
      badgeText={badgeText}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Grille 2x2 sur mobile (4 colonnes sur sm+) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricCotisations')}</span>
          <span className="text-base sm:text-lg font-black text-cordel-wood">{totalMembers}</span>
        </div>
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricActifs')}</span>
          <span className="text-base sm:text-lg font-black text-emerald-800">{activeMembers}</span>
        </div>
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricAJour')}</span>
          <span className="text-base sm:text-lg font-black text-[var(--color-cordel-vert)]">{cotisationsUpToDate}</span>
        </div>
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricEnAttente')}</span>
          <span className="text-base sm:text-lg font-black text-[var(--color-cordel-ocre)]">{cotisationsPending}</span>
        </div>
      </div>

      {/* Répartition par pupitre et Ancrage territorial côte à côte sur PC (md:grid-cols-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
        {/* Colonne 1 : Répartition par pupitre */}
        <div className="p-2.5 bg-cordel-bg/50 border border-encre-noire/15 rounded flex flex-col gap-1.5">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-cordel-wood">
            🥁 {t('secretariatReports.pupitresBreakdown') || 'Répartition par pupitre'}
          </span>
          <div className="flex flex-col gap-1.5">
            {sortedPupitres.map((p) => (
              <div key={p.name} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[10.5px] font-bold">
                  <span className="truncate">{p.name === 'En attente' || p.name === 'Non défini' ? t('governance.pupitrePending') : p.name}</span>
                  <span className="text-encre-noire/70 shrink-0">{p.count} ({p.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-cordel-bg border border-encre-noire/30 rounded-full overflow-hidden">
                  <div className="h-full bg-cordel-wood" style={{ width: `${p.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 2 : Ancrage territorial (Communes Cerfa) */}
        <div className="p-2.5 bg-cordel-bg/50 border border-encre-noire/15 rounded flex flex-col gap-2 justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-cordel-wood">
              📍 {t('governance.ancrageTerritorialTitle')}
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1.5 bg-cordel-bg border border-encre-noire/20 rounded">
                <span className="text-[8px] font-black uppercase text-encre-noire/60 block">Siège</span>
                <span className="text-xs font-black text-[var(--color-cordel-vert)]">{communeMembersCount} ({communeMembersPercent}%)</span>
              </div>
              <div className="p-1.5 bg-cordel-bg border border-encre-noire/20 rounded">
                <span className="text-[8px] font-black uppercase text-encre-noire/60 block">Extérieurs</span>
                <span className="text-xs font-black text-[var(--theme-primary)]">{externalMembersCount} ({externalMembersPercent}%)</span>
              </div>
              <div className="p-1.5 bg-cordel-bg border border-encre-noire/20 rounded">
                <span className="text-[8px] font-black uppercase text-encre-noire/60 block">Audités</span>
                <span className="text-xs font-black text-cordel-wood">{totalAudited}/{totalActiveMembers}</span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-cordel-bg border border-encre-noire/30 rounded-full overflow-hidden flex">
              <div className="h-full bg-[var(--color-cordel-vert)]" style={{ width: `${communeMembersPercent}%` }} />
              <div className="h-full bg-[var(--theme-primary)]" style={{ width: `${externalMembersPercent}%` }} />
            </div>
          </div>

          {topCommunes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1 border-t border-dashed border-cordel-master-dark/15">
              {topCommunes.slice(0, 5).map((c, idx) => (
                <span key={c.ville || idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-cordel-bg border border-encre-noire/20 rounded">
                  <strong className="text-cordel-wood">{idx + 1}.</strong> {c.ville} ({c.count})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgReportAccordionCard>
  );
}

