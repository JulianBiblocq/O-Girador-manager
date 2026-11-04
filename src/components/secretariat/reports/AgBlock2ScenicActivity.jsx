import React from 'react';
import { useTranslation } from '../../LanguageContext';
import AgReportAccordionCard from './AgReportAccordionCard';

/**
 * Accordéon 2 : Rayonnement Scénique & Pratique Collective.
 * Résumé replié : "6 prestas • 19 répètes • 424 mobilisations"
 */
export default function AgBlock2ScenicActivity({ indicators, isOpen, onToggle }) {
  const { t } = useTranslation();
  const {
    eventsByType = {},
    avgPresencePrestation = '0',
    totalPresencesAll = 0
  } = indicators || {};

  const prestas = eventsByType.prestation || 0;
  const repetes = eventsByType.repetition || 0;
  const stagesAteliers = (eventsByType.stage || 0) + (eventsByType.atelier || 0);
  const reunions = eventsByType.reunion || 0;

  const summaryText = `${prestas} presta${prestas > 1 ? 's' : ''} • ${repetes} répète${repetes > 1 ? 's' : ''} • ${totalPresencesAll} mobilisations`;

  return (
    <AgReportAccordionCard
      icon="🥁"
      title={t('secretariatReports.block2Title') || '2. Rayonnement Scénique & Pratique Collective'}
      summaryText={summaryText}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Grille 2x2 des types d'événements */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricPrestations')}</span>
          <span className="text-base sm:text-lg font-black text-cordel-wood">{prestas}</span>
        </div>
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricRepetitions')}</span>
          <span className="text-base sm:text-lg font-black text-encre-noire">{repetes}</span>
        </div>
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricStagesAteliers')}</span>
          <span className="text-base sm:text-lg font-black text-encre-noire">{stagesAteliers}</span>
        </div>
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center">
          <span className="text-[9px] font-black uppercase text-encre-noire/60">{t('governance.metricReunionsAg')}</span>
          <span className="text-base sm:text-lg font-black text-encre-noire">{reunions}</span>
        </div>
      </div>

      {/* Moyenne présents / sortie et Mobilisations cumulées côte à côte sur 2 colonnes (grid-cols-2) */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15">
        <div className="p-2.5 bg-cordel-bg/60 border border-encre-noire/15 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-encre-noire/75 block truncate">
              {t('secretariatReports.avgPresence') || 'Moyenne présents / sortie'}
            </span>
            <span className="text-[9px] text-encre-noire/60 hidden sm:block">{t('governance.avgEffectifScene')}</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-emerald-800 shrink-0">
            {avgPresencePrestation}
          </span>
        </div>

        <div className="p-2.5 bg-cordel-bg/60 border border-encre-noire/15 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-encre-noire/75 block truncate">
              {t('secretariatReports.totalMobilisations') || 'Mobilisations cumulées'}
            </span>
            <span className="text-[9px] text-encre-noire/60 hidden sm:block">{t('governance.totalPresencesRecorded')}</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-cordel-wood shrink-0">
            {totalPresencesAll}
          </span>
        </div>
      </div>
    </AgReportAccordionCard>
  );
}

