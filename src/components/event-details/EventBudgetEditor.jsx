import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Composant d'édition du budget d'un événement.
 * - Supprime le champ de saisie manuelle globale des recettes (source unique Devis/Facture).
 * - Propose l'édition des dépenses hybrides : Ligne automatique Covoiturage en lecture seule + Frais annexes manuels.
 *
 * @param {Array} budgetDepenses - Liste des dépenses manuelles [{ id, intitule, montant }]
 * @param {Function} onChangeDepenses - Callback de mise à jour des dépenses manuelles
 * @param {number} covoiturageAmount - Montant calculé automatiquement des frais kilométriques
 * @param {number} totalRecettes - Montant total des recettes issues du devis/facture ou archive
 * @param {string} documentStatusLabel - Libellé d'état du document rattaché
 * @param {boolean} disabled - Indicateur de désactivation des champs
 */
export default function EventBudgetEditor({
  budgetDepenses = [],
  onChangeDepenses,
  montantRecette = 0,
  onChangeRecette,
  hasLinkedInvoice = false,
  covoiturageAmount = 0,
  totalRecettes = 0,
  documentStatusLabel = '',
  disabled = false
}) {
  // Ajouter une ligne de dépense manuelle (frais annexes)
  const addDepense = () => {
    const newItems = [
      ...budgetDepenses,
      { id: Math.random().toString(36).substring(2, 9), intitule: '', montant: '' }
    ];
    onChangeDepenses(newItems);
  };

  // Supprimer une ligne de dépense manuelle
  const removeDepense = (id) => {
    onChangeDepenses(budgetDepenses.filter((item) => item.id !== id));
  };

  // Modifier un champ d'une dépense manuelle
  const updateDepense = (id, field, value) => {
    onChangeDepenses(
      budgetDepenses.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Calculs des totaux
  const manualDepensesTotal = budgetDepenses.reduce(
    (sum, item) => sum + (parseFloat(item.montant) || 0),
    0
  );
  const totalDepenses = covoiturageAmount + manualDepensesTotal;
  const soldeNet = totalRecettes - totalDepenses;

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colonne 1 : Revenus */}
        <div className="flex flex-col gap-2 p-3 bg-[#2d6a4f]/5 border border-dashed border-[#2d6a4f]/30 rounded-[var(--theme-border-radius,6px)]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] uppercase font-bold text-[#2d6a4f] dark:text-emerald-400">
              📈 Revenus {hasLinkedInvoice ? '(Lecture seule)' : ''}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-xs space-y-1">
            <span className="font-medium text-stone-600 dark:text-stone-400 block">
              {documentStatusLabel || 'Aucun devis / facture rattaché(e)'}
            </span>
            {hasLinkedInvoice ? (
              <>
                <span className="text-base font-extrabold text-[#2d6a4f] dark:text-emerald-400 block">
                  {totalRecettes.toFixed(2)} €
                </span>
                <p className="text-[10px] text-stone-500 italic mt-1">
                  Les rentrées sont synchronisées depuis le module de facturation pour éviter toute double saisie.
                </p>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-1 text-left">
                <label className="text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400">
                  Montant manuel / historique (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={montantRecette || ''}
                  onChange={(e) => onChangeRecette && onChangeRecette(e.target.value)}
                  disabled={disabled}
                  className="theme-input w-full p-2 text-base font-extrabold text-[#2d6a4f] bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Colonne 2 : Dépenses Hybrides (Covoiturage Auto + Frais Annexes Manuels) */}
        <div className="flex flex-col gap-3 p-3 bg-[#8b2a1a]/5 border border-dashed border-[#8b2a1a]/30 rounded-[var(--theme-border-radius,6px)]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] uppercase font-bold text-[#8b2a1a] dark:text-rose-400">
              📉 Dépenses Hybrides
            </span>
            <CordelButton
              type="button"
              onClick={addDepense}
              disabled={disabled}
              className="text-[10px] font-bold uppercase bg-[#2d6a4f] hover:bg-[#23533e] text-white px-2.5 py-1 rounded cursor-pointer disabled:opacity-50"
            >
              ➕ Ajouter un frais annexe
            </CordelButton>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {/* Ligne Automatique : Frais kilométriques de covoiturage */}
            <div className="flex items-center justify-between p-2 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>🚗</span> Frais kilométriques (Covoiturage auto)
              </span>
              <span className="font-bold text-[#8b2a1a] dark:text-rose-400">
                {covoiturageAmount.toFixed(2)} €
              </span>
            </div>

            {/* Saisie manuelle des frais annexes */}
            {budgetDepenses.length === 0 ? (
              <span className="text-[11px] italic opacity-60 text-center py-2">
                Aucun frais annexe manuel.
              </span>
            ) : (
              budgetDepenses.map((item, idx) => (
                <div key={item.id || idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.intitule}
                    placeholder="Ex : Repas techniciens, Location matériel"
                    onChange={(e) => updateDepense(item.id, 'intitule', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 flex-1 focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                  <input
                    type="number"
                    value={item.montant}
                    placeholder="Montant"
                    onChange={(e) => updateDepense(item.id, 'montant', e.target.value)}
                    disabled={disabled}
                    className="w-24 px-2.5 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-right focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                    min="0"
                    step="any"
                  />
                  <button
                    type="button"
                    onClick={() => removeDepense(item.id)}
                    disabled={disabled}
                    className="text-[10px] font-bold uppercase bg-[#8b2a1a] text-white p-1.5 rounded cursor-pointer hover:bg-rose-800 disabled:opacity-50"
                    title="Supprimer cette dépense"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Synthèse financière instantanée en direct pendant l'édition */}
      <div className="border border-stone-300 dark:border-stone-700 p-3.5 rounded-[var(--theme-border-radius,6px)] bg-stone-50 dark:bg-stone-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
        <div className="flex flex-wrap gap-5 font-bold">
          <div>
            <span className="text-stone-500">Total Revenus : </span>
            <span className="text-[#2d6a4f] dark:text-emerald-400 font-extrabold">
              {totalRecettes.toFixed(2)} €
            </span>
          </div>
          <div>
            <span className="text-stone-500">Total Sorties (Auto + Manuel) : </span>
            <span className="text-[#8b2a1a] dark:text-rose-400 font-extrabold">
              {totalDepenses.toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="font-bold flex items-center gap-2">
          <span className="text-stone-600 dark:text-stone-400">Solde Net :</span>
          <span
            className={`font-black px-2.5 py-1 rounded text-xs border ${
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
