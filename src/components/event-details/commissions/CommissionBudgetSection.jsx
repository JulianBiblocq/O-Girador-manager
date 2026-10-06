import React, { useState } from 'react';
import { STATUS_ARBITRAGE_LABELS } from './commissionUtils';
import { useConfirm } from '../../../context/ConfirmContext';

/**
 * Sous-composant du tiroir "Budget & Dépenses"
 * Gestion prévisionnelle, devis et soumission d'arbitrage.
 */
export default function CommissionBudgetSection({
  budget = {},
  onChangeBudget,
  canArbitrate = false
}) {
  const { prompt } = useConfirm();
  const [newDevisIntitule, setNewDevisIntitule] = useState('');
  const [newDevisMontant, setNewDevisMontant] = useState('');
  const [newDevisPrestataire, setNewDevisPrestataire] = useState('');

  const { demande = 0, alloue = 0, statusArbitrage = 'en_etude', motifRefus = '', devis = [] } = budget;
  const totalDevis = devis.reduce((sum, d) => sum + (Number(d.montant) || 0), 0);

  const handleDemanderArbitrage = () => {
    onChangeBudget({ ...budget, demande: demande > 0 ? demande : totalDevis, statusArbitrage: 'en_attente' });
  };

  const handleAddDevis = (e) => {
    e.preventDefault();
    if (!newDevisIntitule.trim() || !newDevisMontant) return;
    const newDevisItem = {
      id: `devis_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      intitule: newDevisIntitule.trim(),
      montant: Number(newDevisMontant) || 0,
      prestataire: newDevisPrestataire.trim() || '',
      status: 'recu'
    };
    const nextDevis = [...devis, newDevisItem];
    onChangeBudget({
      ...budget, devis: nextDevis,
      demande: demande === 0 ? nextDevis.reduce((sum, d) => sum + d.montant, 0) : demande
    });
    setNewDevisIntitule(''); setNewDevisMontant(''); setNewDevisPrestataire('');
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg/50 rounded-lg border border-encre-noire/20 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="font-black uppercase text-encre-noire flex items-center gap-1.5">
          <span>💰</span> Budget & Arbitrages
        </h4>
        <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${
          statusArbitrage === 'valide'
            ? 'bg-emerald-100 text-emerald-900 border-[var(--color-cordel-vert)]'
            : statusArbitrage === 'rejete'
            ? 'bg-rose-100 text-rose-900 border-[var(--color-cordel-rouge)]'
            : statusArbitrage === 'en_attente'
            ? 'bg-amber-100 text-amber-900 border-[var(--color-cordel-ocre)]'
            : 'bg-stone-100 text-stone-700 border-stone-300'
        }`}>
          {STATUS_ARBITRAGE_LABELS[statusArbitrage] || statusArbitrage}
        </span>
      </div>

      {/* Synthèse des montants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2 bg-white rounded border border-encre-noire/20">
          <label className="text-[10px] font-bold text-stone-600 block">Total devis estimés</label>
          <span className="text-sm font-black text-encre-noire">{totalDevis.toFixed(2)} €</span>
        </div>
        <div className="p-2 bg-white rounded border border-encre-noire/20">
          <label className="text-[10px] font-bold text-stone-600 block">Enveloppe demandée</label>
          <div className="flex items-center gap-1 mt-0.5">
            <input
              type="number"
              min="0"
              step="10"
              value={demande}
              onChange={(e) => onChangeBudget({ ...budget, demande: Number(e.target.value) || 0 })}
              className="w-full font-black text-xs px-1.5 py-0.5 rounded border border-encre-noire/20"
            />
            <span className="text-[11px] font-bold">€</span>
          </div>
        </div>
        <div className="p-2 bg-white rounded border border-encre-noire/20">
          <label className="text-[10px] font-bold text-stone-600 block">Enveloppe allouée</label>
          <span className={`text-sm font-black ${alloue > 0 ? 'text-[var(--color-cordel-vert)]' : 'text-stone-500'}`}>
            {alloue > 0 ? `${alloue.toFixed(2)} €` : 'Non fixée'}
          </span>
        </div>
      </div>

      {statusArbitrage === 'rejete' && motifRefus && (
        <div className="p-2 rounded bg-rose-50 border border-[var(--color-cordel-rouge)] text-rose-800 text-[11px]">
          <strong>Motif du refus :</strong> {motifRefus}
        </div>
      )}

      {/* Actions d'arbitrage (Trésorier vs Référent) */}
      {canArbitrate ? (
        <div className="p-2.5 rounded bg-white border border-encre-noire/20 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-stone-600 uppercase">Arbitrage Trésorerie :</label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeBudget({ ...budget, alloue: alloue > 0 ? alloue : (demande > 0 ? demande : totalDevis), statusArbitrage: 'valide', motifRefus: '' })}
              className="px-3 py-1 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 shadow-xs"
            >
              ✅ Valider le budget ({alloue > 0 ? alloue : (demande > 0 ? demande : totalDevis)} €)
            </button>

            <button
              type="button"
              onClick={async () => {
                const motif = await prompt({
                  title: 'Arbitrage budgétaire',
                  message: 'Motif du rejet ou de la révision demandée :',
                  defaultValue: motifRefus || '',
                  placeholder: 'Indiquez les raisons du refus ou ajustements...',
                  multiline: true,
                  confirmLabel: 'Confirmer la révision',
                  variant: 'danger',
                  badge: '⚠️ Révision demandée'
                });
                if (motif !== null) onChangeBudget({ ...budget, statusArbitrage: 'rejete', motifRefus: motif.trim() });
              }}
              className="px-2.5 py-1 font-bold rounded border border-encre-noire bg-rose-100 text-rose-900 hover:bg-rose-200 cursor-pointer"
            >
              ⚠️ Refuser / Demander révision
            </button>

          </div>
        </div>
      ) : statusArbitrage !== 'valide' && (
        <button
          type="button"
          onClick={handleDemanderArbitrage}
          className="self-start px-3 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-ocre)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <span>📩</span> Demander arbitrage Trésorerie
        </button>
      )}

      {/* Devis */}
      <div className="pt-2 border-t border-encre-noire/10 flex flex-col gap-2">
        <label className="font-bold text-[10px] uppercase text-stone-600">Devis & Tarifs fournisseurs</label>
        {devis.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-1.5 bg-white rounded border border-stone-200">
            <div>
              <span className="font-bold">{d.intitule}</span>
              {d.prestataire && <span className="text-stone-500 text-[10px] ml-1.5">({d.prestataire})</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black">{Number(d.montant).toFixed(2)} €</span>
              <button
                type="button"
                onClick={() => onChangeBudget({ ...budget, devis: devis.filter((x) => x.id !== d.id) })}
                className="text-stone-400 hover:text-[var(--color-cordel-rouge)] text-[10px]"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <form onSubmit={handleAddDevis} className="flex flex-wrap items-center gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Intitulé devis..."
            value={newDevisIntitule}
            onChange={(e) => setNewDevisIntitule(e.target.value)}
            className="flex-1 min-w-[120px] px-2 py-1 rounded border border-encre-noire/20 text-xs bg-white"
          />
          <input
            type="text"
            placeholder="Prestataire..."
            value={newDevisPrestataire}
            onChange={(e) => setNewDevisPrestataire(e.target.value)}
            className="w-28 px-2 py-1 rounded border border-encre-noire/20 text-xs bg-white"
          />
          <input
            type="number"
            placeholder="Montant €"
            value={newDevisMontant}
            onChange={(e) => setNewDevisMontant(e.target.value)}
            className="w-20 px-2 py-1 rounded border border-encre-noire/20 text-xs bg-white"
          />
          <button
            type="submit"
            disabled={!newDevisIntitule.trim() || !newDevisMontant}
            className="px-2.5 py-1 font-bold rounded border border-encre-noire bg-stone-100 hover:bg-stone-200 disabled:opacity-40"
          >
            + Devis
          </button>
        </form>
      </div>
    </div>
  );
}
