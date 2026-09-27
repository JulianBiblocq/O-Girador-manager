import React, { useState, useMemo } from 'react';
import CordelCard from '../../CordelCard';
import {
  DEFAULT_SEASON_START_MONTH,
  DEFAULT_FISCAL_START_MONTH,
  getSeasonDateRange,
  getCurrentSeason,
  getFiscalYearDateRange
} from '../../../utils/seasonUtils';

/**
 * Accordéon pour la configuration des cycles annuels (Saison d'activité & Exercice comptable).
 * Affiche en bandeau compact : « Saison [année] • Exercice comptable [année] ».
 */
export default function AnnualCyclesAccordion({ formData = {}, handleChange, saving }) {
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
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
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
              Cycles Annuels
            </span>
          </div>
          <span className="text-[10px] text-cordel-master-dark/75 font-semibold hidden sm:inline">•</span>
          <span className="text-[10px] font-bold text-stone-600">
            Saison : <strong className="text-emerald-800">{currentSeasonLabel}</strong> • Exercice comptable : <strong className="text-amber-800">{currentFiscalRange.fiscalYearLabel}</strong>
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {isOpen ? '▲ Fermer' : '⚙️ Régler'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3.5 text-left animate-fade-in bg-white/40">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            Synchronisez l'Agenda, les notes de frais et les bilans d'AG sur les bornes calendaires réelles de votre association.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mois de rentrée */}
            <div className="flex flex-col gap-1 p-2.5 rounded border border-stone-200 bg-white">
              <label htmlFor="saisonDebutMois" className="text-[9px] uppercase font-black text-cordel-master-dark">
                🌱 Mois de rentrée / Saison d'activité
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
                    {m.label} {m.value === 9 ? '— (Recommandé / Rentrée)' : m.value === 1 ? '— (Année civile)' : ''}
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-stone-500 font-medium">
                Période active : {formatIsoDate(currentSeasonRange.startDate)} au {formatIsoDate(currentSeasonRange.endDate)}
              </span>
            </div>

            {/* Début exercice comptable */}
            <div className="flex flex-col gap-1 p-2.5 rounded border border-stone-200 bg-white">
              <label htmlFor="exerciceDebutMois" className="text-[9px] uppercase font-black text-cordel-master-dark">
                💼 Mois de clôture / Exercice comptable
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
                    {m.label} {m.value === 1 ? '— (Standard / Année civile)' : m.value === 9 ? '— (Année scolaire)' : ''}
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-stone-500 font-medium">
                Exercice actif : {formatIsoDate(currentFiscalRange.startDate)} au {formatIsoDate(currentFiscalRange.endDate)}
              </span>
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
