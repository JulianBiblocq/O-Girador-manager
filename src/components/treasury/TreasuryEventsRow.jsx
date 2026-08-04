import React from 'react';
import { formatLocationShort } from '../../utils/locationUtils';
import { useEventFinance } from '../../hooks/useEventFinance';

/**
 * Composant de ligne pour la synthèse financière d'un événement dans la trésorerie.
 *
 * @param {Object} evt - Événement Firestore
 * @param {string} groupId - ID du groupe
 * @param {Array} lieuxImportants - Lieux importants de l'association
 */
export default function TreasuryEventsRow({ evt, groupId, lieuxImportants = [] }) {
  const {
    hasLinkedInvoice,
    totalRecettes,
    isLegacyRevenue,
    documentStatusLabel,
    covoiturageAmount,
    manualDepensesAmount,
    totalDepenses,
    soldeNet
  } = useEventFinance(evt, groupId);

  const eventDateStr = evt.date ? evt.date.substring(0, 10) : '';

  return (
    <div className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-stone-200 dark:border-stone-800 py-2 px-2 hover:bg-stone-100/50 dark:hover:bg-stone-800/40 rounded transition-colors">
      {/* Date */}
      <div className="col-span-2 font-semibold text-left text-stone-700 dark:text-stone-300">
        {eventDateStr}
      </div>

      {/* Titre & Type */}
      <div className="col-span-3 text-left">
        <div className="font-bold text-stone-900 dark:text-stone-100 truncate" title={evt.titre}>
          {evt.titre}
        </div>
        <span className="text-[9px] font-bold uppercase text-[#2d6a4f] dark:text-emerald-400">
          {evt.type}
        </span>
      </div>

      {/* Lieu */}
      <div className="col-span-2 text-left truncate text-stone-600 dark:text-stone-400" title={evt.lieu}>
        {evt.lieu ? `📍 ${formatLocationShort(evt, lieuxImportants)}` : '-'}
      </div>

      {/* Recettes (Lecture seule avec statut) */}
      <div className="col-span-2 text-right">
        <div className="font-bold text-[#2d6a4f] dark:text-emerald-400">
          {totalRecettes.toFixed(2)} €
        </div>
        <span className="text-[9px] text-stone-500 block truncate" title={documentStatusLabel}>
          {hasLinkedInvoice ? '📜 Devis/Facture' : isLegacyRevenue ? '📦 Archive' : 'Non devisé'}
        </span>
      </div>

      {/* Dépenses (Hybrides : Auto + Manuel) */}
      <div className="col-span-2 text-right">
        <div className="font-bold text-[#8b2a1a] dark:text-rose-400">
          {totalDepenses.toFixed(2)} €
        </div>
        <span className="text-[9px] text-stone-500 block truncate" title={`Covoit: ${covoiturageAmount.toFixed(2)}€ | Annexes: ${manualDepensesAmount.toFixed(2)}€`}>
          🚗 {covoiturageAmount.toFixed(0)}€ | 📝 {manualDepensesAmount.toFixed(0)}€
        </span>
      </div>

      {/* Solde Net */}
      <div className="col-span-1 text-center font-extrabold">
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${
            soldeNet >= 0
              ? 'bg-[#2d6a4f]/15 border-[#2d6a4f] text-[#2d6a4f] dark:text-emerald-400'
              : 'bg-[#8b2a1a]/15 border-[#8b2a1a] text-[#8b2a1a] dark:text-rose-400'
          }`}
        >
          {soldeNet >= 0 ? '+' : ''}{soldeNet.toFixed(0)}€
        </span>
      </div>
    </div>
  );
}
