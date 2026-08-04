import React from 'react';
import CordelButton from '../CordelButton';
import { useEventFinance } from '../../hooks/useEventFinance';

/**
 * Composant de présentation du Bilan Financier d'un événement.
 * - Rentrées : Issu de Devis/Facture (Lecture seule) ou Bouton "Créer un devis" si aucun document lié.
 * - Dépenses Hybrides : Frais kilométriques (Covoiturage automatique) + Frais annexes (Manuels).
 * - Bilan synthétique : Total Rentrées, Total Sorties et Marge nette estimée.
 *
 * @param {Object} event - Objet événement
 * @param {string} groupId - ID du groupe
 * @param {Function} onCreateQuote - Callback pour ouvrir la création de devis
 */
export default function EventBudgetSection({ event, groupId, onCreateQuote }) {
  const {
    linkedInvoice,
    hasLinkedInvoice,
    totalRecettes,
    isLegacyRevenue,
    documentStatusLabel,
    covoiturageAmount,
    manualDepensesAmount,
    totalDepenses,
    soldeNet,
    loading
  } = useEventFinance(event, groupId);

  if (loading) {
    return (
      <div className="p-4 text-center text-xs text-stone-500 animate-pulse">
        Chargement du bilan financier...
      </div>
    );
  }

  const manualItems = Array.isArray(event?.budgetDepenses) ? event.budgetDepenses : [];

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Grille principale : Revenus & Dépenses Hybrides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Section 1 : Revenus (Entrées d'argent) */}
        <div className="flex flex-col justify-between p-4 rounded-[var(--theme-border-radius,6px)] bg-emerald-50/50 dark:bg-emerald-950/20 border border-dashed border-[#2d6a4f]/30">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] dark:text-emerald-400 flex items-center gap-1.5">
                <span>📈</span> Revenus (Entrées)
              </span>
              {hasLinkedInvoice && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2d6a4f]/15 text-[#2d6a4f] dark:text-emerald-300">
                  {linkedInvoice.type === 'facture' ? 'Facturé' : 'Devisé'}
                </span>
              )}
            </div>

            {hasLinkedInvoice ? (
              /* Affichage en lecture seule du Devis/Facture lié */
              <div className="space-y-1.5 p-3 rounded bg-white/70 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-700 dark:text-stone-300">{documentStatusLabel}</span>
                  <span className="font-bold text-[#2d6a4f] dark:text-emerald-400 text-sm">
                    {totalRecettes.toFixed(2)} €
                  </span>
                </div>
                {linkedInvoice.client?.nom && (
                  <p className="text-[11px] text-stone-500">
                    Client : {linkedInvoice.client.nom}
                  </p>
                )}
              </div>
            ) : isLegacyRevenue ? (
              /* Affichage rétrocompatible pour les archives historiques */
              <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1">
                <span className="text-[11px] font-semibold text-[#c05621] block">
                  {documentStatusLabel}
                </span>
                <span className="font-bold text-[#2d6a4f] dark:text-emerald-400 text-sm block">
                  {totalRecettes.toFixed(2)} €
                </span>
              </div>
            ) : (
              /* Absence de document : Bouton de création de devis */
              <div className="p-4 text-center rounded bg-white/50 dark:bg-stone-800/50 border border-dashed border-stone-300 dark:border-stone-700 space-y-3">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Aucun devis ni facture n'est actuellement rattaché(e) à cet événement.
                </p>
                {onCreateQuote && (
                  <CordelButton
                    onClick={() => onCreateQuote(event)}
                    className="bg-[#2d6a4f] hover:bg-[#23533e] text-white px-4 py-2 text-xs font-bold rounded-[var(--theme-border-radius,6px)] flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-sm"
                  >
                    <span>📜</span> Créer un devis pour cet événement
                  </CordelButton>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-[#2d6a4f]/20 flex justify-between items-center text-xs font-bold">
            <span className="text-stone-600 dark:text-stone-400">Total Revenus :</span>
            <span className="text-[#2d6a4f] dark:text-emerald-400 font-extrabold text-sm">
              {totalRecettes.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Section 2 : Dépenses (Sorties d'argent hybrides) */}
        <div className="flex flex-col justify-between p-4 rounded-[var(--theme-border-radius,6px)] bg-rose-50/50 dark:bg-rose-950/20 border border-dashed border-[#8b2a1a]/30">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8b2a1a] dark:text-rose-400 flex items-center gap-1.5">
                <span>📉</span> Dépenses (Sorties Hybrides)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8b2a1a]/15 text-[#8b2a1a] dark:text-rose-300">
                Automatique + Manuel
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Partie Automatique : Frais kilométriques de covoiturage */}
              <div className="p-2.5 rounded bg-white/70 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>🚗</span>
                  <div>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                      Frais kilométriques (Covoiturage)
                    </span>
                    <span className="text-[10px] text-stone-500">Calcul automatique conducteurs</span>
                  </div>
                </div>
                <span className="font-bold text-[#8b2a1a] dark:text-rose-400">
                  {covoiturageAmount.toFixed(2)} €
                </span>
              </div>

              {/* Partie Manuelle : Frais annexes */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block">
                  Frais annexes manuels ({manualItems.length}) :
                </span>
                {manualItems.length === 0 ? (
                  <p className="text-[11px] italic text-stone-400 pl-2">Aucun frais annexe.</p>
                ) : (
                  manualItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2 rounded bg-white/50 dark:bg-stone-800/50 flex justify-between items-center text-xs"
                    >
                      <span className="text-stone-700 dark:text-stone-300">{item.intitule || 'Dépense'}</span>
                      <span className="font-semibold text-[#8b2a1a] dark:text-rose-400">
                        {(parseFloat(item.montant) || 0).toFixed(2)} €
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-[#8b2a1a]/20 flex justify-between items-center text-xs font-bold">
            <span className="text-stone-600 dark:text-stone-400">Total Sorties :</span>
            <span className="text-[#8b2a1a] dark:text-rose-400 font-extrabold text-sm">
              {totalDepenses.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* Bloc Récapitulatif Synthétique du Bilan Financier */}
      <div className="p-4 rounded-[var(--theme-border-radius,6px)] bg-stone-100 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs font-bold">
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">Total Rentrées</span>
            <span className="text-[#2d6a4f] dark:text-emerald-400 text-base font-extrabold">
              {totalRecettes.toFixed(2)} €
            </span>
          </div>

          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">Total Sorties</span>
            <span className="text-[#8b2a1a] dark:text-rose-400 text-base font-extrabold">
              {totalDepenses.toFixed(2)} €
            </span>
          </div>
        </div>

        <div>
          <span className="text-stone-500 uppercase tracking-wider block text-[10px] text-right sm:text-left">
            Marge Nette Estimée
          </span>
          <span
            className={`inline-block px-3 py-1 text-sm font-extrabold rounded-md border ${
              soldeNet >= 0
                ? 'bg-[#2d6a4f]/15 border-[#2d6a4f] text-[#2d6a4f] dark:text-emerald-400'
                : 'bg-[#8b2a1a]/15 border-[#8b2a1a] text-[#8b2a1a] dark:text-rose-400'
            }`}
          >
            {soldeNet >= 0 ? '+' : ''}{soldeNet.toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  );
}
