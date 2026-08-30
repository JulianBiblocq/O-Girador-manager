import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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

  const [isEditing, setIsEditing] = useState(false);
  const [editRecette, setEditRecette] = useState(parseFloat(evt.montantRecette) || 0);
  const [editDepense, setEditDepense] = useState(manualDepensesAmount || 0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const eventRef = doc(db, 'events', evt.id);
      
      const parsedRecette = parseFloat(editRecette) || 0;
      const parsedDepense = parseFloat(editDepense) || 0;

      // Keep existing budgetDepenses but update or add the manual entry
      let newBudget = Array.isArray(evt.budgetDepenses) ? [...evt.budgetDepenses] : [];
      
      // If there's only one entry and it's a simple one, or if we want to replace it:
      // To be safe, we'll just replace the whole manual expenses with a single line if they edit it here,
      // OR we can just set it as a single generic expense if it doesn't match perfectly.
      // Actually, since this is a simple override, we replace the budgetDepenses array with a single line
      // if they changed the amount.
      if (parsedDepense !== manualDepensesAmount) {
        newBudget = [{ description: 'Saisie trésorerie', montant: parsedDepense }];
      }

      await updateDoc(eventRef, {
        montantRecette: parsedRecette,
        budgetDepenses: parsedDepense !== manualDepensesAmount ? newBudget : evt.budgetDepenses || []
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Recettes (Lecture seule avec statut ou Mode Édition) */}
      <div className="col-span-2 text-right flex flex-col justify-center items-end">
        {isEditing && !hasLinkedInvoice ? (
          <input 
            type="number"
            min="0"
            step="0.01"
            value={editRecette}
            onChange={(e) => setEditRecette(e.target.value)}
            disabled={isSaving}
            className="w-16 text-right text-xs p-1 border border-[#2d6a4f] rounded outline-none"
          />
        ) : (
          <div className="font-bold text-[#2d6a4f] dark:text-emerald-400">
            {totalRecettes.toFixed(2)} €
          </div>
        )}
        <span className="text-[9px] text-stone-500 block truncate" title={documentStatusLabel}>
          {hasLinkedInvoice ? '📜 Devis/Facture' : isLegacyRevenue ? '📦 Archive' : 'Saisie manuelle'}
        </span>
      </div>

      {/* Dépenses (Hybrides : Auto + Manuel) */}
      <div className="col-span-2 text-right flex flex-col justify-center items-end">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-stone-500">+{covoiturageAmount.toFixed(0)}€</span>
            <input 
              type="number"
              min="0"
              step="0.01"
              value={editDepense}
              onChange={(e) => setEditDepense(e.target.value)}
              disabled={isSaving}
              title="Dépenses annexes (hors covoiturage)"
              className="w-16 text-right text-xs p-1 border border-[#8b2a1a] rounded outline-none"
            />
          </div>
        ) : (
          <div className="font-bold text-[#8b2a1a] dark:text-rose-400">
            {totalDepenses.toFixed(2)} €
          </div>
        )}
        <span className="text-[9px] text-stone-500 block truncate" title={`Covoit: ${covoiturageAmount.toFixed(2)}€ | Annexes: ${manualDepensesAmount.toFixed(2)}€`}>
          🚗 {covoiturageAmount.toFixed(0)}€ | 📝 {isEditing ? (parseFloat(editDepense)||0).toFixed(0) : manualDepensesAmount.toFixed(0)}€
        </span>
      </div>

      {/* Solde Net & Actions */}
      <div className="col-span-1 flex flex-col items-center justify-center gap-1 font-extrabold">
        {!isEditing ? (
          <>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${
                soldeNet >= 0
                  ? 'bg-[#2d6a4f]/15 border-[#2d6a4f] text-[#2d6a4f] dark:text-emerald-400'
                  : 'bg-[#8b2a1a]/15 border-[#8b2a1a] text-[#8b2a1a] dark:text-rose-400'
              }`}
            >
              {soldeNet >= 0 ? '+' : ''}{soldeNet.toFixed(0)}€
            </span>
            <button
              onClick={() => {
                setEditRecette(parseFloat(evt.montantRecette) || 0);
                setEditDepense(manualDepensesAmount || 0);
                setIsEditing(true);
              }}
              className="text-[9px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Éditer
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-[9px] bg-[#2d6a4f] text-white px-2 py-0.5 rounded hover:brightness-110 disabled:opacity-50"
            >
              {isSaving ? '...' : 'OK'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="text-[9px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
