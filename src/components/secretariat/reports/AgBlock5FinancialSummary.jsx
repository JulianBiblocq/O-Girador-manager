import React from 'react';
import { useTranslation } from '../../LanguageContext';
import AgReportAccordionCard from './AgReportAccordionCard';

/**
 * Accordéon 5 : Bilan Financier Condensé.
 * Résumé replié : "Résultat net : +6 113,67 € (Excédent)"
 * Déplié : Recettes globales et Dépenses globales côte à côte sur 2 colonnes (grid-cols-2) au-dessus du Résultat net.
 */
export default function AgBlock5FinancialSummary({ indicators, isOpen, onToggle }) {
  const { t } = useTranslation();
  const {
    recettesGlobales = 0,
    depensesGlobales = 0,
    soldeNet = 0
  } = indicators || {};

  const statusLabel = soldeNet > 0 ? 'Excédent' : soldeNet < 0 ? 'Déficit' : 'Équilibré';
  const summaryText = `Résultat net : ${soldeNet > 0 ? '+' : ''}${soldeNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € (${statusLabel})`;

  return (
    <AgReportAccordionCard
      icon="🪙"
      title="5. Bilan Financier Condensé"
      summaryText={summaryText}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Recettes globales et Dépenses globales côte à côte sur 2 colonnes (grid-cols-2) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 bg-emerald-50/80 border-2 border-emerald-800/40 rounded flex flex-col justify-between">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-900">
            {t('secretariatReports.totalRecettes') || 'Recettes globales'}
          </span>
          <span className="text-base sm:text-xl font-black text-[var(--color-cordel-vert)] mt-1">
            +{recettesGlobales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </div>

        <div className="p-2.5 bg-red-50/80 border-2 border-red-800/40 rounded flex flex-col justify-between">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-red-900">
            {t('secretariatReports.totalDepenses') || 'Dépenses globales'}
          </span>
          <span className="text-base sm:text-xl font-black text-[var(--theme-primary)] mt-1">
            -{depensesGlobales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </div>
      </div>

      {/* Bandeau Résultat net d'exercice */}
      <div
        className={`p-2.5 sm:p-3 rounded border-2 flex items-center justify-between ${
          soldeNet > 0
            ? 'bg-emerald-100 border-[#2d6a4f] text-[var(--color-cordel-vert)]'
            : soldeNet < 0
            ? 'bg-red-100 border-[var(--theme-primary)] text-[var(--theme-primary)]'
            : 'bg-amber-100 border-[#c05621] text-[var(--color-cordel-ocre)]'
        }`}
      >
        <div className="flex flex-col">
          <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider">
            {t('secretariatReports.soldeNet') || "Résultat net d'exercice"}
          </span>
          <span className="text-[11px] font-bold opacity-85">
            {soldeNet > 0
              ? `🟢 ${t('secretariatReports.surplus') || 'Excédent de gestion'}`
              : soldeNet < 0
              ? `🔴 ${t('secretariatReports.deficit') || "Déficit d'exercice"}`
              : `🟡 ${t('secretariatReports.equilibre') || 'Budget équilibré'}`}
          </span>
        </div>
        <span className="text-lg sm:text-2xl font-black">
          {soldeNet > 0 ? '+' : ''}
          {soldeNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
        </span>
      </div>
    </AgReportAccordionCard>
  );
}

