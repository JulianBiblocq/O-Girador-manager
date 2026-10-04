import React, { useState, useMemo } from 'react';
import CordelCard from '../../CordelCard';
import {
  DEFAULT_SEASON_START_MONTH,
  DEFAULT_FISCAL_START_MONTH,
  getSeasonDateRange,
  getCurrentSeason,
  getFiscalYearDateRange
} from '../../../utils/seasonUtils';
import { useTranslation } from '../../LanguageContext';

/**
 * Accordéon pour la configuration des cycles annuels (Saison d'activité & Exercice comptable).
 * Affiche en bandeau compact : « Saison [année] • Exercice comptable [année] ».
 */
export default function AnnualCyclesAccordion({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const saisonDebutMois = formData.saisonDebutMois !== undefined 
    ? Number(formData.saisonDebutMois) 
    : DEFAULT_SEASON_START_MONTH;
  const exerciceDebutMois = formData.exerciceDebutMois !== undefined 
    ? Number(formData.exerciceDebutMois) 
    : DEFAULT_FISCAL_START_MONTH;

  const currentSeasonLabel = useMemo(() => getCurrentSeason(saisonDebutMois), [saisonDebutMois]);
  const currentSeasonRange = useMemo(() => getSeasonDateRange(currentSeasonLabel, saisonDebutMois), [currentSeasonLabel, saisonDebutMois]);
  const currentFiscalRange = useMemo(() => getFiscalYearDateRange(new Date(), exerciceDebutMois, 0), [exerciceDebutMois]);

  const formatIsoDate = (isoStr) => {
    if (!isoStr || typeof isoStr !== 'string') return '';
    const parts = isoStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoStr;
  };

  const MONTHS = [
    { value: 1, label: t('settings.organization.annualCyclesAccordion.janvier') },
    { value: 2, label: t('settings.organization.annualCyclesAccordion.fevrier') },
    { value: 3, label: t('settings.organization.annualCyclesAccordion.mars') },
    { value: 4, label: t('settings.organization.annualCyclesAccordion.avril') },
    { value: 5, label: t('settings.organization.annualCyclesAccordion.mai') },
    { value: 6, label: t('settings.organization.annualCyclesAccordion.juin') },
    { value: 7, label: t('settings.organization.annualCyclesAccordion.juillet') },
    { value: 8, label: t('settings.organization.annualCyclesAccordion.aout') },
    { value: 9, label: t('settings.organization.annualCyclesAccordion.septembre') },
    { value: 10, label: t('settings.organization.annualCyclesAccordion.octobre') },
    { value: 11, label: t('settings.organization.annualCyclesAccordion.novembre') },
    { value: 12, label: t('settings.organization.annualCyclesAccordion.decembre') }
  ];

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau d'en-tête compact */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📅</span>
            <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.organization.annualCyclesAccordion.cyclesAnnuels')}
            </span>
          </div>
          <span className="text-[10px] text-cordel-master-dark/75 font-semibold hidden sm:inline">•</span>
          <span className="text-[10px] font-bold text-stone-600">
            {t('settings.organization.annualCyclesAccordion.saison')} <strong className="text-emerald-800">{currentSeasonLabel}</strong> {t('settings.organization.annualCyclesAccordion.exerciceComptable')} <strong className="text-amber-800">{currentFiscalRange.fiscalYearLabel}</strong>
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {isOpen ? t('settings.organization.annualCyclesAccordion.fermer') : t('settings.organization.annualCyclesAccordion.regler')}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3.5 text-left animate-fade-in bg-white/40">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            {t('settings.organization.annualCyclesAccordion.synchronisezLAgendaLesNotes')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mois de rentrée */}
            <div className="flex flex-col gap-1 p-2.5 rounded border border-stone-200 bg-white">
              <label htmlFor="saisonDebutMois" className="text-[9px] uppercase font-black text-cordel-master-dark">
                {t('settings.organization.annualCyclesAccordion.moisDeRentreeSaisonD')}
              </label>
              <select
                id="saisonDebutMois"
                value={saisonDebutMois}
                onChange={(e) => handleChange('saisonDebutMois', parseInt(e.target.value, 10))}
                disabled={saving}
                className="theme-input text-xs font-bold py-1 bg-stone-50 w-full cursor-pointer"
              >
                {MONTHS.map(m => (
                  <option key={`season_${m.value}`} value={m.value}>
                    {m.label} {m.value === 9 ? t('settings.organization.annualCyclesAccordion.recommandeRentree') : m.value === 1 ? t('settings.organization.annualCyclesAccordion.anneeCivile') : ''}
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-stone-500 font-medium">
                {t('settings.organization.annualCyclesAccordion.periodeActive')} {formatIsoDate(currentSeasonRange.startDate)} {t('settings.organization.annualCyclesAccordion.au')} {formatIsoDate(currentSeasonRange.endDate)}
              </span>
            </div>

            {/* Début exercice comptable */}
            <div className="flex flex-col gap-1 p-2.5 rounded border border-stone-200 bg-white">
              <label htmlFor="exerciceDebutMois" className="text-[9px] uppercase font-black text-cordel-master-dark">
                {t('settings.organization.annualCyclesAccordion.moisDeClotureExerciceComptable')}
              </label>
              <select
                id="exerciceDebutMois"
                value={exerciceDebutMois}
                onChange={(e) => handleChange('exerciceDebutMois', parseInt(e.target.value, 10))}
                disabled={saving}
                className="theme-input text-xs font-bold py-1 bg-stone-50 w-full cursor-pointer"
              >
                {MONTHS.map(m => (
                  <option key={`fiscal_${m.value}`} value={m.value}>
                    {m.label} {m.value === 1 ? t('settings.organization.annualCyclesAccordion.standardAnneeCivile') : m.value === 9 ? t('settings.organization.annualCyclesAccordion.anneeScolaire') : ''}
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-stone-500 font-medium">
                {t('settings.organization.annualCyclesAccordion.exerciceActif')} {formatIsoDate(currentFiscalRange.startDate)} {t('settings.organization.annualCyclesAccordion.au')} {formatIsoDate(currentFiscalRange.endDate)}
              </span>
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
