import React, { useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import { computeAssociationUsageStats } from '../../../utils/usageStatsUtils';
import AgReportAccordionCard from './AgReportAccordionCard';
import UsageStatsBanner from './UsageStatsBanner';

/**
 * Accordéon 6 : Rayonnement Web & Usage Numérique.
 * Regroupe la Vitrine publique (3 colonnes sans barre de progression redondante)
 * et le Suivi d'usage numérique (Push, Fréquentation, Mégaphone SVG, Varal).
 * Résumé replié : "🔔 42% Push • 📱 43 actifs 7j • 🌐 320 visites vitrine"
 */
export default function AgBlock6WebAndDigitalUsage({
  groupId,
  indicators,
  rawUsers = [],
  rawAnnouncements = [],
  rawDocuments = [],
  isOpen,
  onToggle
}) {
  const { t } = useTranslation();
  const audienceStats = indicators?.audienceStats || {};
  const {
    vitrineViews = 0,
    vitrineRequestsTotal = 0,
    vitrineRequestsConverted = 0,
    conversionRate = 0
  } = audienceStats;

  const usageStats = useMemo(
    () => computeAssociationUsageStats({ rawUsers, rawAnnouncements, rawDocuments }),
    [rawUsers, rawAnnouncements, rawDocuments]
  );

  const summaryText = `🔔 ${usageStats.pushReachablePercent}% Push • 📱 ${usageStats.activeMembers7d} actifs 7j • 🌐 ${vitrineViews} visites vitrine`;

  return (
    <AgReportAccordionCard
      icon="📡"
      title="6. Rayonnement Web & Usage Numérique"
      summaryText={summaryText}
      badgeText="Synchronisé Orquestrador"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Sous-section A : Vitrine publique sur une seule rangée de 3 colonnes (grid-cols-3), sans barre redondante */}
      <div className="flex flex-col gap-2">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-cordel-wood flex items-center gap-1.5">
          <span>🌐</span>
          <span>{t('governance.showcaseTrafficTitle') || 'Rayonnement & Vitrine Publique'}</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center justify-between">
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-encre-noire/65 leading-tight">
              {t('governance.metricShowcaseViews') || 'Consultations'}
            </span>
            <span className="text-sm sm:text-lg font-black text-cordel-wood mt-0.5">
              {vitrineViews.toLocaleString('fr-FR')}
            </span>
          </div>

          <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center justify-between">
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-encre-noire/65 leading-tight">
              {t('governance.metricFormsReceived') || 'Formulaires'}
            </span>
            <span className="text-sm sm:text-lg font-black text-encre-noire mt-0.5">
              {vitrineRequestsTotal}
            </span>
          </div>

          <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center justify-between">
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-encre-noire/65 leading-tight">
              Concrétisation
            </span>
            <span className="text-sm sm:text-lg font-black text-[var(--color-cordel-vert)] mt-0.5">
              {vitrineRequestsConverted} <span className="text-[10px]">({conversionRate}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sous-section B : Suivi d'usage numérique interne (Push, Fréquentation, Mégaphone, Varal) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-cordel-wood flex items-center gap-1.5">
          <span>📱</span>
          <span>{t('secretariatReports.usageBannerTitle') || "Suivi d'Usage Numérique & Réception des Alertes"}</span>
        </span>
        <UsageStatsBanner
          groupId={groupId}
          rawUsers={rawUsers}
          rawAnnouncements={rawAnnouncements}
          rawDocuments={rawDocuments}
          canSyncOrquestrador={true}
        />
      </div>
    </AgReportAccordionCard>
  );
}

