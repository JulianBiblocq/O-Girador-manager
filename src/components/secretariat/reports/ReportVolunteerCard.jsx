import React from 'react';
import { useTranslation } from '../../LanguageContext';
import AgReportAccordionCard from './AgReportAccordionCard';

/**
 * Accordéon 3 : Bénévolat & Vie de Troupe (Cerfa 12156).
 * Résumé replié : "2 934,7 h valorisables (Cerfa)"
 * Déplié : encart vert du volume global + 3 compteurs sur une seule ligne de 3 colonnes (grid-cols-3).
 */
export default function ReportVolunteerCard({ volunteeringStats = {}, isOpen = false, onToggle }) {
  const { t } = useTranslation();
  const {
    totalPublicPlayingHours = 0,
    totalCollectiveVolunteerHours = 0,
    forfaitHeuresAdmin = 120,
    forfaitHeuresArtisanat = 80,
    totalCerfaVolunteerHours = 0,
    eventsAuditedCount = 0
  } = volunteeringStats;

  const summaryText = `${totalCerfaVolunteerHours.toLocaleString('fr-FR')} h valorisables (Cerfa)`;
  const badgeText = `${eventsAuditedCount} événements analysés`;

  return (
    <AgReportAccordionCard
      icon="🤝"
      title={`3. ${t('governance.volunteeringCerfaTitle') || 'Bénévolat & Vie de Troupe (Cerfa 12156)'}`}
      summaryText={summaryText}
      badgeText={badgeText}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Compteur du volume global valorisable Cerfa */}
      <div className="p-3 bg-emerald-50/90 border-2 border-[#2d6a4f]/50 rounded-[4px_8px_5px_7px] flex items-center justify-between gap-2 shadow-inner">
        <div className="flex flex-col min-w-0">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[var(--color-cordel-vert)]">
            Volume Global Valorisable Cerfa
          </span>
          <span className="text-[10px] font-semibold text-emerald-950/80 truncate">
            {t('governance.volunteeringHoursDesc')}
          </span>
        </div>

        <div className="flex items-baseline gap-1 shrink-0">
          <span className="text-xl sm:text-2xl font-black text-[var(--color-cordel-vert)] tracking-tight">
            {totalCerfaVolunteerHours.toLocaleString('fr-FR')}
          </span>
          <span className="text-[10px] font-black uppercase text-[var(--color-cordel-vert)]">h</span>
        </div>
      </div>

      {/* Les 3 compteurs sur une seule ligne de 3 colonnes (grid-cols-3) compactes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center justify-between">
          <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-encre-noire/65 leading-tight">
            {t('governance.collectiveActivity') || 'Activité collective'}
          </span>
          <span className="text-sm sm:text-base font-black text-cordel-wood mt-1">
            {totalCollectiveVolunteerHours.toLocaleString('fr-FR')} h
          </span>
        </div>

        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center justify-between">
          <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-encre-noire/65 leading-tight">
            {t('governance.publicPerformance') || 'Jeu en public'}
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-800 mt-1">
            {totalPublicPlayingHours} h
          </span>
        </div>

        <div className="p-2 bg-cordel-bg/80 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col items-center text-center justify-between">
          <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-encre-noire/65 leading-tight">
            {t('governance.boardWorkshopPackages') || 'Forfaits bureau & atelier'}
          </span>
          <span className="text-sm sm:text-base font-black text-[var(--color-cordel-ocre)] mt-1">
            {forfaitHeuresAdmin + forfaitHeuresArtisanat} h
          </span>
        </div>
      </div>
    </AgReportAccordionCard>
  );
}
