import React from 'react';
import { useTranslation } from '../../LanguageContext';
import AgReportAccordionCard from './AgReportAccordionCard';

/**
 * Accordéon 4 : Chantiers, Ateliers & Patrimoine.
 * Résumé replié : "1 chantier couture • 47 instruments en service"
 * Déplié : Costumerie & Confection et Lutherie & Matériel en md:grid-cols-2.
 */
export default function AgBlock4WorkshopsPatrimony({ indicators, isOpen, onToggle }) {
  const { t } = useTranslation();
  const {
    totalCouture = 0,
    coutureFinished = 0,
    coutureInProgress = 0,
    totalParts = 0,
    instrumentsInService = 0,
    instrumentsMaintenance = 0
  } = indicators || {};

  const summaryText = `${totalCouture} chantier${totalCouture > 1 ? 's' : ''} couture • ${instrumentsInService} instrument${instrumentsInService > 1 ? 's' : ''} en service`;

  return (
    <AgReportAccordionCard
      icon="🪡"
      title="4. Chantiers, Ateliers & Patrimoine"
      summaryText={summaryText}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Costumerie & Confection */}
        <div className="p-2.5 bg-cordel-bg/70 border border-encre-noire/20 rounded flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>👗</span> {t('governance.wardrobeCraftTitle') || 'Costumerie & Confection'}
          </span>
          <div className="flex justify-between items-center text-xs">
            <span className="text-encre-noire/80">{t('governance.costumesCrafted')}</span>
            <span className="font-black text-[var(--color-cordel-vert)]">{coutureFinished}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-encre-noire/80">{t('governance.ongoingWorkshops')}</span>
            <span className="font-black text-[var(--color-cordel-ocre)]">{coutureInProgress}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-dashed border-encre-noire/15 pt-1">
            <span className="text-encre-noire/80 font-bold">{t('governance.totalMonitoredProjects')}</span>
            <span className="font-black text-encre-noire">{totalCouture}</span>
          </div>
        </div>

        {/* Lutherie & Matériel */}
        <div className="p-2.5 bg-cordel-bg/70 border border-encre-noire/20 rounded flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🎻</span> {t('governance.metricLutherieMaterial') || 'Lutherie & Matériel'}
          </span>
          <div className="flex justify-between items-center text-xs">
            <span className="text-encre-noire/80">{t('governance.metricInstrumentsInService')}</span>
            <span className="font-black text-[var(--color-cordel-vert)]">{instrumentsInService}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-encre-noire/80">{t('governance.instrumentsUnderMaintenance')}</span>
            <span className="font-black text-[var(--theme-primary)]">{instrumentsMaintenance}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-dashed border-encre-noire/15 pt-1">
            <span className="text-encre-noire/80 font-bold">{t('governance.trackedPartsStock')}</span>
            <span className="font-black text-encre-noire">{totalParts}</span>
          </div>
        </div>
      </div>
    </AgReportAccordionCard>
  );
}

