import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import Tooltip from '../Tooltip';
import { useTranslation } from '../LanguageContext';
import BankAccountsTracker from './BankAccountsTracker';
import TreasuryBankDetailsAccordion from './TreasuryBankDetailsAccordion';
import { getFiscalYearDateRange, DEFAULT_FISCAL_START_MONTH } from '../../utils/seasonUtils';

/**
 * Tableau de bord principal de la Trésorerie (Synthèse Financière).
 * Optimisé sur Desktop avec une barre d'exercice comptable horizontale compacte
 * permettant d'afficher les 3 compteurs, le bilan détaillé et l'accès aux exports sans défilement vertical.
 */
export default function TreasuryDashboard({
  calculateGlobalBalance,
  associationSettings,
  handleSaveAssociationSettings,
  groupId: _groupId,
  onSelectTab
}) {
  const { t } = useTranslation();

  // Déterminer le mois de début de l'exercice comptable (par défaut 1 = Janvier / Année civile)
  const exerciceDebutMois = associationSettings?.exerciceDebutMois !== undefined && associationSettings?.exerciceDebutMois !== null
    ? Number(associationSettings.exerciceDebutMois)
    : DEFAULT_FISCAL_START_MONTH;

  // Initialisation dynamique des dates selon l'exercice comptable en cours
  const initialFiscalRange = getFiscalYearDateRange(new Date(), exerciceDebutMois, 0);

  const [startDate, setStartDate] = useState(initialFiscalRange.startDate);
  const [endDate, setEndDate] = useState(initialFiscalRange.endDate);
  const [userHasCustomizedDates, setUserHasCustomizedDates] = useState(false);

  // Synchronisation dynamique si les paramètres changent et que l'utilisateur n'a pas modifié manuellement
  useEffect(() => {
    if (!userHasCustomizedDates && associationSettings?.exerciceDebutMois !== undefined && associationSettings?.exerciceDebutMois !== null) {
      const range = getFiscalYearDateRange(new Date(), Number(associationSettings.exerciceDebutMois), 0);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }, [associationSettings?.exerciceDebutMois, userHasCustomizedDates]);

  const balanceResult = (typeof calculateGlobalBalance === 'function' ? calculateGlobalBalance(startDate, endDate) : null) || {};
  const totalRecettes = Number(balanceResult.totalRecettes) || 0;
  const totalDepenses = Number(balanceResult.totalDepenses) || 0;
  const solde = Number(balanceResult.solde) || 0;
  const categoriesBreakdown = {
    recette: {
      'Cotisations': Number(balanceResult.categoriesBreakdown?.recette?.['Cotisations']) || 0,
      'Événements': Number(balanceResult.categoriesBreakdown?.recette?.['Événements']) || 0,
      'Opérations Diverses': Number(balanceResult.categoriesBreakdown?.recette?.['Opérations Diverses']) || 0,
      ...(balanceResult.categoriesBreakdown?.recette || {})
    },
    depense: {
      'Événements': Number(balanceResult.categoriesBreakdown?.depense?.['Événements']) || 0,
      'Frais Kilométriques': Number(balanceResult.categoriesBreakdown?.depense?.['Frais Kilométriques']) || 0,
      'Opérations Diverses': Number(balanceResult.categoriesBreakdown?.depense?.['Opérations Diverses']) || 0,
      ...(balanceResult.categoriesBreakdown?.depense || {})
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-none">
      {/* Bannière d'introduction compacte pleine largeur */}
      <div className="w-full text-xs text-encre-noire dark:text-cordel-bg-light opacity-85 border border-dashed border-cordel-master-dark/30 px-3.5 py-2.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-snug">
        🪙 <strong>{t('treasury.dashboardTitle')}</strong> : {t('treasury.dashboardBannerDesc')}
      </div>

      {/* Barre horizontale fine : Exercice Comptable (Date de début / Date de fin) */}
      <CordelCard variant="default" useExtremeBorder={true} className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 w-full">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase shrink-0 flex items-center gap-1.5">
          <span>📅</span>
          <span>{t('treasury.fiscalYear')}</span>
        </h3>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark whitespace-nowrap">
              {t('secretariatReports.startDate') || 'Date de début'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setUserHasCustomizedDates(true);
              }}
              className="theme-input py-1 px-2.5 font-bold text-xs w-full sm:w-auto"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark whitespace-nowrap">
              {t('secretariatReports.endDate') || 'Date de fin'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setUserHasCustomizedDates(true);
              }}
              className="theme-input py-1 px-2.5 font-bold text-xs w-full sm:w-auto"
            />
          </div>
        </div>
      </CordelCard>

      {/* 3 Cartes de totaux financiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
        <div className="border border-encre-noire/25 p-3 bg-green-50/40 dark:bg-green-950/10 rounded-[5px_3px_6px_4px] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="text-[10px] uppercase font-black text-green-700 dark:text-green-400 opacity-80 tracking-wider flex items-center justify-center gap-1">
            <span>{t('treasury.totalIncome')} (+)</span>
            <Tooltip text="Cumul de toutes les entrées d'argent (cotisations, recettes événements, subventions)." />
          </div>
          <div className="text-xl sm:text-2xl font-black text-green-700 dark:text-green-400 mt-0.5">{totalRecettes.toFixed(2)} €</div>
        </div>
        <div className="border border-encre-noire/25 p-3 bg-red-50/40 dark:bg-red-950/10 rounded-[4px_6px_3px_5px] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="text-[10px] uppercase font-black text-red-700 dark:text-red-400 opacity-80 tracking-wider flex items-center justify-center gap-1">
            <span>{t('treasury.totalExpenses')} (-)</span>
            <Tooltip text="Cumul de tous les coûts (frais d'événements, défraiements kilométriques, achats matériel)." />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400 mt-0.5">{totalDepenses.toFixed(2)} €</div>
        </div>
        <div className={`border-2 border-encre-noire p-3 rounded-[6px_4px_5px_3px] text-center shadow-[2px_2px_0px_0px_#181716] ${solde >= 0 ? 'bg-[#e2ecc8] dark:bg-emerald-950/20' : 'bg-[#f7d6d0] dark:bg-rose-950/20'}`}>
          <div className="text-[10px] uppercase font-black text-encre-noire tracking-wider flex items-center justify-center gap-1">
            <span>{t('treasury.netMargin')}</span>
            <Tooltip text="Différence nette entre les recettes totales et les dépenses sur la période." />
          </div>
          <div className={`text-xl sm:text-2xl font-black mt-0.5 ${solde >= 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {solde >= 0 ? '+' : ''}{solde.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Tableau du Bilan Financier Détaillé */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 w-full">
        <h3 className="text-xs font-black tracking-widest text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-1.5 mb-3 text-left flex items-center gap-1.5">
          <span>📊 {t('treasury.detailedFinancialBalance')}</span>
          <Tooltip text="Ventilation complète des recettes et dépenses par catégorie pour le rapport de gestion." />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ventilation des Recettes */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] uppercase font-black text-green-700 dark:text-green-400 border-b border-green-700/20 pb-1 text-left flex justify-between">
              <span>🟢 {t('treasury.categoryIncome')}</span>
              <span className="font-mono">{totalRecettes.toFixed(2)} €</span>
            </h4>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 text-left">
                <span className="font-semibold text-encre-noire">{t('treasury.catCotisationsAdhesions')}</span>
                <span className="font-black text-green-700">{categoriesBreakdown.recette['Cotisations'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 text-left">
                <span className="font-semibold text-encre-noire">{t('treasury.catRecettesEvents')}</span>
                <span className="font-black text-green-700">{categoriesBreakdown.recette['Événements'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 text-left">
                <span className="font-semibold text-encre-noire">{t('treasury.catOperationsDiverses')}</span>
                <span className="font-black text-green-700">{categoriesBreakdown.recette['Opérations Diverses'].toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Ventilation des Dépenses */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] uppercase font-black text-red-700 dark:text-red-400 border-b border-red-700/20 pb-1 text-left flex justify-between">
              <span>🔴 {t('treasury.categoryExpense')}</span>
              <span className="font-mono">{totalDepenses.toFixed(2)} €</span>
            </h4>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 text-left">
                <span className="font-semibold text-encre-noire">{t('treasury.catFraisEvents')}</span>
                <span className="font-black text-red-700">{categoriesBreakdown.depense['Événements'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 text-left">
                <span className="font-semibold text-encre-noire">{t('treasury.catDefraiementsKm')}</span>
                <span className="font-black text-red-700">{categoriesBreakdown.depense['Frais Kilométriques'].toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 text-left">
                <span className="font-semibold text-encre-noire">{t('treasury.catOperationsDiverses')}</span>
                <span className="font-black text-red-700">{categoriesBreakdown.depense['Opérations Diverses'].toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne de Solde Net Global */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-cordel-master-dark/20 flex justify-between items-center text-sm font-black">
          <span className="uppercase tracking-wider text-cordel-wood">{t('treasury.currentBalance')}</span>
          <span className={`px-3 py-0.5 rounded border-2 border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] ${solde >= 0 ? 'bg-[#e2ecc8] text-green-800' : 'bg-[#f7d6d0] text-red-800'}`}>
            {solde >= 0 ? '+' : ''}{solde.toFixed(2)} €
          </span>
        </div>
      </CordelCard>

      {/* Accès rapide Rapports Financiers & Exports Comptables */}
      {onSelectTab && (
        <CordelCard variant="jaune" useExtremeBorder={true} className="px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3 select-none w-full">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div className="text-left">
              <h4 className="text-xs font-black text-encre-noire uppercase tracking-wide">
                {t('treasury.reportsExportsTitle')}
              </h4>
              <p className="text-[10px] font-semibold text-cordel-master-dark/75">
                {t('treasury.reportsExportsSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('reports-exports')}
            className="text-xs font-extrabold uppercase px-3 py-1.5 rounded-[4px_6px_3px_5px] bg-cordel-wood text-white border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer shrink-0"
          >
            {t('treasury.btnExportCsv')} ➔
          </button>
        </CordelCard>
      )}

      {/* Accordéon Coordonnées Bancaires & Mentions de Facturation */}
      <TreasuryBankDetailsAccordion
        associationSettings={associationSettings}
        handleSaveAssociationSettings={handleSaveAssociationSettings}
      />

      {/* Suivi des Comptes Bancaires et Projections */}
      <BankAccountsTracker
        associationSettings={associationSettings}
        handleSaveAssociationSettings={handleSaveAssociationSettings}
        bilanOperationnel={solde}
      />
    </div>
  );
}
