import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { useAgReportsData } from '../../hooks/useAgReportsData';
import { exportAgSummaryCSV, exportAgAttendanceCSV } from '../../utils/agReportsExportUtils';
import AgReportsHeaderBar from './reports/AgReportsHeaderBar';
import AgPeriodSelectorBar from './reports/AgPeriodSelectorBar';
import AgBlock1AssociativeLife from './reports/AgBlock1AssociativeLife';
import AgBlock2ScenicActivity from './reports/AgBlock2ScenicActivity';
import ReportVolunteerCard from './reports/ReportVolunteerCard';
import AgBlock4WorkshopsPatrimony from './reports/AgBlock4WorkshopsPatrimony';
import AgBlock5FinancialSummary from './reports/AgBlock5FinancialSummary';
import AgBlock6WebAndDigitalUsage from './reports/AgBlock6WebAndDigitalUsage';
import AgSlideshowModal from './reports/AgSlideshowModal';

const ACCORDION_IDS = ['block1', 'block2', 'block3', 'block4', 'block5', 'block6'];

/**
 * Vue consolidée des Bilans & Rapports d'Assemblée Générale (Pôle Gouvernance - ca-reports).
 * Structurée en 6 accordéons Cordel avec résumés des chiffres clés et impression @media print intégrale.
 */
export default function SecretariatReportsView({ groupId }) {
  const { t } = useTranslation();
  const {
    rawUsers, rawEvents, rawAnnouncements, rawDocuments, assocInfo, loading, error,
    periodPreset, startDate, endDate, setStartDate, setEndDate, setPeriodPreset, handleSelectPreset, periodLabel,
    currentSeason, previousSeason, currentSeasonRange, previousSeasonRange, currentFiscalRange, previousFiscalRange,
    loadReportsData, isWithinRange, indicators
  } = useAgReportsData(groupId);

  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // Sur mobile (< 768px), accordéons repliés par défaut pour tenir sur 1 seul écran. Sur PC, blocs 1-5 ouverts et bloc 6 replié.
  const [openBlocks, setOpenBlocks] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile
      ? { block1: false, block2: false, block3: false, block4: false, block5: false, block6: false }
      : { block1: true, block2: true, block3: true, block4: true, block5: true, block6: false };
  });

  const allExpanded = ACCORDION_IDS.every((id) => Boolean(openBlocks[id]));
  const toggleBlock = (id) => setOpenBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleToggleAllAccordions = () => {
    const next = !allExpanded;
    setOpenBlocks({ block1: next, block2: next, block3: next, block4: next, block5: next, block6: next });
  };

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 text-left select-none relative animate-fade-in">
      <style>{`
        @media print {
          body { background: #ffffff !important; color: #181716 !important; }
          .no-print, header, nav, aside, footer, button, .banner-hide-print { display: none !important; }
          .print-only, .print-force-open { display: block !important; }
          .print-card { border: 1px solid #181716 !important; box-shadow: none !important; break-inside: avoid; background: #ffffff !important; margin-bottom: 12px !important; }
          .print-header { border-bottom: 2px solid #181716 !important; margin-bottom: 16px !important; padding-bottom: 8px !important; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>

      <div className="print-only print-header">
        <h1 className="text-xl font-black uppercase tracking-wider text-encre-noire mb-1">
          {assocInfo?.nom || 'Association O Girador'} — Rapport d'Activité & Bilan de Saison
        </h1>
        <p className="text-xs text-encre-noire/80">
          Période de référence : du <strong>{startDate}</strong> au <strong>{endDate}</strong> | Édité le {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      <AgReportsHeaderBar
        loading={loading}
        onOpenSlideshow={() => setIsSlideshowOpen(true)}
        onExportSummaryCSV={() => exportAgSummaryCSV({ assocInfo, startDate, endDate, indicators })}
        onExportAttendanceCSV={() => exportAgAttendanceCSV({ assocInfo, startDate, endDate, rawEvents, isWithinRange })}
        onPrint={() => window.print()}
        onRefresh={loadReportsData}
      />

      <AgPeriodSelectorBar
        periodPreset={periodPreset}
        onSelectPreset={handleSelectPreset}
        startDate={startDate}
        endDate={endDate}
        onChangeStartDate={(val) => { setStartDate(val); setPeriodPreset('custom'); }}
        onChangeEndDate={(val) => { setEndDate(val); setPeriodPreset('custom'); }}
        currentSeason={currentSeason}
        previousSeason={previousSeason}
        currentSeasonRange={currentSeasonRange}
        previousSeasonRange={previousSeasonRange}
        currentFiscalRange={currentFiscalRange}
        previousFiscalRange={previousFiscalRange}
        allExpanded={allExpanded}
        onToggleAllAccordions={handleToggleAllAccordions}
      />

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-2 bg-cordel-card-bg border-2 border-dashed border-encre-noire/30 rounded-[6px_10px_7px_8px] no-print">
          <div className="text-2xl animate-spin">⏳</div>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            {t('secretariatReports.loading') || 'Agrégation des données des pôles en cours...'}
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-100 text-red-900 border-2 border-red-800 rounded font-bold text-xs no-print">⚠️ {error}</div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2.5 sm:gap-3.5" data-tour="reports-blocks-grid">
          <AgBlock1AssociativeLife indicators={indicators} isOpen={openBlocks.block1} onToggle={() => toggleBlock('block1')} />
          <AgBlock2ScenicActivity indicators={indicators} isOpen={openBlocks.block2} onToggle={() => toggleBlock('block2')} />
          <ReportVolunteerCard volunteeringStats={indicators.volunteeringStats} isOpen={openBlocks.block3} onToggle={() => toggleBlock('block3')} />
          <AgBlock4WorkshopsPatrimony indicators={indicators} isOpen={openBlocks.block4} onToggle={() => toggleBlock('block4')} />
          <AgBlock5FinancialSummary indicators={indicators} isOpen={openBlocks.block5} onToggle={() => toggleBlock('block5')} />
          <AgBlock6WebAndDigitalUsage
            groupId={groupId} indicators={indicators} rawUsers={rawUsers}
            rawAnnouncements={rawAnnouncements} rawDocuments={rawDocuments}
            isOpen={openBlocks.block6} onToggle={() => toggleBlock('block6')}
          />
        </div>
      )}

      {isSlideshowOpen && (
        <AgSlideshowModal
          isOpen={isSlideshowOpen} onClose={() => setIsSlideshowOpen(false)}
          groupId={groupId} indicators={indicators} assocInfo={assocInfo}
          startDate={startDate} endDate={endDate} periodLabel={periodLabel}
        />
      )}
    </div>
  );
}
