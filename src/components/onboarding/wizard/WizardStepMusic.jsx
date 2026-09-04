import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import OnboardingToggleSwitch from '../OnboardingToggleSwitch';

/**
 * Étape 2 du Wizard : Musique & Inclusivité 🥁
 * Configuration des pupitres d'instruments principaux et activation du mode d'inclusivité féminine.
 */
export default function WizardStepMusic({ wizardData, updateWizardData }) {
  const instrumentsList = Array.isArray(wizardData.instrumentsDisponibles) && wizardData.instrumentsDisponibles.length > 0
    ? wizardData.instrumentsDisponibles
    : ["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

  const majoriteFeminine = Boolean(wizardData.majoriteFeminine);

  const defaultInstruments = [
    "Alfaia", 
    "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", 
    "Timbal", "Chant", "Danse", "Performance"
  ];

  const [newInstInput, setNewInstInput] = useState('');

  // Activer ou désactiver un instrument
  const toggleInstrument = (instName) => {
    if (instrumentsList.includes(instName)) {
      const updated = instrumentsList.filter(i => i !== instName);
      updateWizardData('instrumentsDisponibles', updated);
    } else {
      updateWizardData('instrumentsDisponibles', [...instrumentsList, instName]);
    }
  };

  // Ajouter un instrument personnalisé
  const handleAddCustomInstrument = (e) => {
    if (e) e.preventDefault();
    const trimmed = newInstInput.trim();
    if (trimmed && !instrumentsList.includes(trimmed)) {
      updateWizardData('instrumentsDisponibles', [...instrumentsList, trimmed]);
      setNewInstInput('');
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left animate-fade-in">
      <div className="border-b border-dashed border-stone-300 pb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>🥁</span>
          <span>Étape 2 : Musique, Pupitres & Inclusivité</span>
        </h3>
        <p className="text-xs text-stone-500 font-bold mt-1 leading-relaxed">
          Sélectionnez les instruments pratiqués par votre collectif et définissez les options de terminologie inclusive.
        </p>
      </div>

      {/* 1. Interrupteur d'Inclusivité Féminine */}
      <CordelCard variant="default" className="p-4 bg-emerald-50/60 border-2 border-[var(--color-cordel-vert,#2d6a4f)]/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👩‍🎤</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-vert,#2d6a4f)]">
                Inclusivité / Terminologie Féminine Majoritaire
              </h4>
              <p className="text-[11px] text-stone-600 font-medium">
                Adapte les intitulés par défaut dans l'application (ex: "Batuqueuse / Tamboire", "Présente").
              </p>
            </div>
          </div>

          <OnboardingToggleSwitch
            checked={majoriteFeminine}
            onChange={(val) => updateWizardData('majoriteFeminine', val)}
          />
        </div>
      </CordelCard>

      {/* 2. Activation des Pupitres & Instruments */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center justify-between">
          <span>Pupitres & Instruments Actifs ({instrumentsList.length})</span>
          <span className="text-[10px] text-stone-500 font-normal">Cliquez pour activer/désactiver</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {defaultInstruments.map((inst) => {
            const isSelected = instrumentsList.includes(inst);
            return (
              <button
                key={inst}
                type="button"
                onClick={() => toggleInstrument(inst)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-emerald-800 shadow-xs scale-102'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400 opacity-70'
                }`}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{inst}</span>
              </button>
            );
          })}
        </div>

        {/* Ajout d'un instrument personnalisé */}
        <form onSubmit={handleAddCustomInstrument} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newInstInput}
            onChange={(e) => setNewInstInput(e.target.value)}
            placeholder="Autre instrument (ex: Atabaque, Surdo...)"
            className="text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 flex-1 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-extrabold uppercase bg-[var(--color-cordel-vert,#2d6a4f)] text-white rounded-lg hover:brightness-110 cursor-pointer"
          >
            + Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
