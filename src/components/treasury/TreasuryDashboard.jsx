import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import { useTranslation } from '../LanguageContext';
import BankAccountsTracker from './BankAccountsTracker';

export default function TreasuryDashboard({ 
  calculateGlobalBalance,
  associationSettings,
  handleSaveAssociationSettings,
  groupId
}) {
  const { t } = useTranslation();

  // Set default dates to school year (Sep 1st to Aug 31st)
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
  const defaultStartDate = `${startYear}-09-01`;
  const defaultEndDate = `${startYear + 1}-08-31`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const {
    totalRecettes,
    totalDepenses,
    solde,
    categoriesBreakdown
  } = calculateGlobalBalance(startDate, endDate);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Introduction */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        🪙 <strong>Tableau de Bord Financier</strong> : Suivez en temps réel l'état des finances de l'association. Ce tableau synthétise toutes les écritures comptables (cotisations, recettes/dépenses d'événements, frais kilométriques et opérations libres) sur la période choisie.
      </div>

      {/* Date Filters */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-1 mb-1">
          📅 Choix de la Période
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de début
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="theme-input w-full font-bold text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de fin
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="theme-input w-full font-bold text-xs"
            />
          </div>
        </div>
      </CordelCard>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-encre-noire/25 p-3.5 bg-green-50/40 dark:bg-green-950/10 rounded-[5px_3px_6px_4px] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="text-[10px] uppercase font-black text-green-700 dark:text-green-400 opacity-80 tracking-wider">Total Recettes (+)</div>
          <div className="text-2xl font-black text-green-700 dark:text-green-400 mt-1">{totalRecettes.toFixed(2)} €</div>
        </div>
        <div className="border border-encre-noire/25 p-3.5 bg-red-50/40 dark:bg-red-950/10 rounded-[4px_6px_3px_5px] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="text-[10px] uppercase font-black text-red-700 dark:text-red-400 opacity-80 tracking-wider">Total Dépenses (-)</div>
          <div className="text-2xl font-black text-red-700 dark:text-red-400 mt-1">{totalDepenses.toFixed(2)} €</div>
        </div>
        <div className={`border-2 border-encre-noire p-3.5 rounded-[6px_4px_5px_3px] text-center shadow-[2px_2px_0px_0px_#181716] ${solde >= 0 ? 'bg-[#e2ecc8] dark:bg-emerald-950/20' : 'bg-[#f7d6d0] dark:bg-rose-950/20'}`}>
          <div className="text-[10px] uppercase font-black text-encre-noire tracking-wider">Solde Net</div>
          <div className={`text-2xl font-black mt-1 ${solde >= 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {solde >= 0 ? '+' : ''}{solde.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Global Balance Table */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-5">
        <h3 className="text-xs font-black tracking-widest text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-2 mb-4 text-left">
          📊 Bilan Financier Détaillé
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recettes Category Breakdown */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] uppercase font-black text-green-700 dark:text-green-400 border-b border-green-700/20 pb-1 text-left flex justify-between">
              <span>🟢 Recettes</span>
              <span className="font-mono">{totalRecettes.toFixed(2)} €</span>
            </h4>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1.5 text-left">
                <span className="font-semibold text-encre-noire">Cotisations & Adhésions</span>
                <span className="font-black text-green-700">{categoriesBreakdown.recette['Cotisations'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1.5 text-left">
                <span className="font-semibold text-encre-noire">Recettes Événements (Prestations, etc.)</span>
                <span className="font-black text-green-700">{categoriesBreakdown.recette['Événements'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1.5 text-left">
                <span className="font-semibold text-encre-noire">Opérations Diverses</span>
                <span className="font-black text-green-700">{categoriesBreakdown.recette['Opérations Diverses'].toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Depenses Category Breakdown */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] uppercase font-black text-red-700 dark:text-red-400 border-b border-red-700/20 pb-1 text-left flex justify-between">
              <span>🔴 Dépenses</span>
              <span className="font-mono">{totalDepenses.toFixed(2)} €</span>
            </h4>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1.5 text-left">
                <span className="font-semibold text-encre-noire">Frais Événements</span>
                <span className="font-black text-red-700">{categoriesBreakdown.depense['Événements'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1.5 text-left">
                <span className="font-semibold text-encre-noire">Défraiements Kilométriques</span>
                <span className="font-black text-red-700">{categoriesBreakdown.depense['Frais Kilométriques'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1.5 text-left">
                <span className="font-semibold text-encre-noire">Opérations Diverses</span>
                <span className="font-black text-red-700">{categoriesBreakdown.depense['Opérations Diverses'].toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Net Balance Row */}
        <div className="mt-8 pt-4 border-t-2 border-dashed border-cordel-master-dark/20 flex justify-between items-center text-sm font-black">
          <span className="uppercase tracking-wider text-cordel-wood">Solde de la période</span>
          <span className={`px-3 py-1 rounded border-2 border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] ${solde >= 0 ? 'bg-[#e2ecc8] text-green-800' : 'bg-[#f7d6d0] text-red-800'}`}>
            {solde >= 0 ? '+' : ''}{solde.toFixed(2)} €
          </span>
        </div>
      </CordelCard>

      {/* Bank Accounts and Projections */}
      <BankAccountsTracker
        associationSettings={associationSettings}
        handleSaveAssociationSettings={handleSaveAssociationSettings}
        bilanOperationnel={solde}
      />
    </div>
  );
}
