import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

/**
 * Étape 3 du Wizard : Cotisations de base 💳
 * Saisie du montant de l'Adhésion fixe de base et définition de la première formule de cotisation.
 */
export default function WizardStepFinance({ wizardData, updateWizardData }) {
  const montantAdhesion = wizardData.montantAdhesion !== undefined ? wizardData.montantAdhesion : 10;
  const optionsCotisation = Array.isArray(wizardData.optionsCotisation) ? wizardData.optionsCotisation : [];

  const [formulaName, setFormulaName] = useState('Percussion');
  const [formulaTarif, setFormulaTarif] = useState('135');
  const [formulaDesc, setFormulaDesc] = useState('Accès aux ateliers hebdomadaires et aux événements.');

  // Ajout d'une nouvelle formule de cotisation
  const handleAddFormula = (e) => {
    if (e) e.preventDefault();
    if (!formulaName.trim() || !formulaTarif) return;

    const newFormula = {
      id: `cotis_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      nom: formulaName.trim(),
      tarif: Number(formulaTarif) || 0,
      description: formulaDesc.trim()
    };

    updateWizardData('optionsCotisation', [...optionsCotisation, newFormula]);
    setFormulaName('');
    setFormulaTarif('');
    setFormulaDesc('');
  };

  // Suppression d'une formule
  const handleRemoveFormula = (id) => {
    const updated = optionsCotisation.filter(f => f.id !== id);
    updateWizardData('optionsCotisation', updated);
  };

  return (
    <div className="flex flex-col gap-5 text-left animate-fade-in">
      <div className="border-b border-dashed border-stone-300 pb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>💳</span>
          <span>Étape 3 : Adhésion & Formules de Cotisation</span>
        </h3>
        <p className="text-xs text-stone-500 font-bold mt-1 leading-relaxed">
          Saisissez les paramètres de la trésorerie initiale : montant de l'adhésion annuelle et première formule de cotisation.
        </p>
      </div>

      {/* 1. Montant de l'Adhésion Fixe */}
      <div className="flex flex-col gap-1.5 bg-stone-50 p-3.5 rounded-lg border border-stone-300">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center justify-between">
          <span>Montant de l'Adhésion annuelle de base (Frais fixes) *</span>
          <span className="text-[10px] text-stone-400 font-normal">Ex: 10 €</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={montantAdhesion}
            onChange={(e) => updateWizardData('montantAdhesion', Number(e.target.value))}
            className="text-sm font-black px-3.5 py-2 border-2 border-stone-300 rounded-lg bg-white text-stone-900 w-32 outline-none font-mono"
          />
          <span className="text-sm font-extrabold text-stone-700">€ / an</span>
        </div>
      </div>

      {/* 2. Formules de cotisations */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center justify-between">
          <span>Formules de cotisations des membres ({optionsCotisation.length})</span>
          <span className="text-[10px] text-stone-500 font-normal">Ex: Percussion, Danse, Tarif Réduit...</span>
        </label>

        {/* Liste des formules ajoutées */}
        {optionsCotisation.length > 0 && (
          <div className="flex flex-col gap-2">
            {optionsCotisation.map((formula) => (
              <div
                key={formula.id}
                className="p-3 bg-white border border-stone-300 rounded-lg flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-stone-900">{formula.nom}</span>
                    <span className="text-xs font-mono font-black text-[var(--color-cordel-vert,#2d6a4f)] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      {formula.tarif} €
                    </span>
                  </div>
                  {formula.description && (
                    <p className="text-[10px] text-stone-500 mt-0.5">{formula.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFormula(formula.id)}
                  className="text-stone-400 hover:text-[var(--color-cordel-rouge,#8b2a1a)] text-xs font-bold px-2 py-1 cursor-pointer"
                  title="Supprimer la formule"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire rapide d'ajout de formule */}
        <CordelCard variant="default" className="p-3.5 bg-stone-50 border border-stone-300 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Créer une nouvelle formule de cotisation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={formulaName}
              onChange={(e) => setFormulaName(e.target.value)}
              placeholder="Intitulé (ex: Percussion)"
              className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-bold text-stone-900 outline-none"
            />
            <input
              type="number"
              min="0"
              value={formulaTarif}
              onChange={(e) => setFormulaTarif(e.target.value)}
              placeholder="Tarif en € (ex: 135)"
              className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-900 outline-none"
            />
            <button
              type="button"
              onClick={handleAddFormula}
              className="px-3 py-2 text-xs font-extrabold uppercase tracking-wider bg-[var(--color-cordel-vert,#2d6a4f)] text-white rounded hover:brightness-110 cursor-pointer shadow-xs"
            >
              + Ajouter la formule
            </button>
          </div>

          <input
            type="text"
            value={formulaDesc}
            onChange={(e) => setFormulaDesc(e.target.value)}
            placeholder="Description courte (optionnel)"
            className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-700 outline-none"
          />
        </CordelCard>
      </div>
    </div>
  );
}
