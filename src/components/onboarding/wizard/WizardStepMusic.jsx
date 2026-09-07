import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import OnboardingToggleSwitch from '../OnboardingToggleSwitch';

/**
 * Étape 2 du Wizard : Activité & Pupitres 🥁
 * Configuration du profil d'activité (presets) et des pupitres.
 */
export default function WizardStepMusic({ wizardData, updateWizardData }) {
  const instrumentsList = Array.isArray(wizardData.instrumentsDisponibles) 
    ? wizardData.instrumentsDisponibles 
    : [];

  const majoriteFeminine = Boolean(wizardData.majoriteFeminine);
  const [newInstInput, setNewInstInput] = useState('');

  const activityPresets = [
    {
      id: 'percussions',
      name: 'Percussions & Batucada',
      icon: '🥁',
      roles: ['Percussions graves', 'Percussions médiums', 'Percussions aiguës', 'Chant', 'Danse']
    },
    {
      id: 'harmonie',
      name: 'Harmonie & Fanfare',
      icon: '🎺',
      roles: ['Bois', 'Cuivres', 'Percussions', 'Direction']
    },
    {
      id: 'chorale',
      name: 'Chorale & Polyphonie',
      icon: '🎤',
      roles: ['Soprano', 'Alto', 'Ténor', 'Basse', 'Direction de chœur']
    },
    {
      id: 'danse',
      name: 'Danse & Arts vivants',
      icon: '🎭',
      roles: ['Danseurs', 'Comédiens', 'Costumiers', 'Technique/Régie']
    }
  ];

  const handleApplyPreset = (presetRoles) => {
    updateWizardData('instrumentsDisponibles', [...presetRoles]);
  };

  // Activer ou désactiver un instrument
  const removeInstrument = (instName) => {
    const updated = instrumentsList.filter(i => i !== instName);
    updateWizardData('instrumentsDisponibles', updated);
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
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--theme-primary)] flex items-center gap-2">
          <span>🎯</span>
          <span>Étape 2 : Activité & Pupitres</span>
        </h3>
        <p className="text-xs text-stone-500 font-bold mt-1 leading-relaxed">
          Sélectionnez votre profil d'activité pour pré-remplir vos pupitres et ajustez les options de terminologie.
        </p>
      </div>

      {/* 1. Profil d'activité */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800">
          Profil d'activité (Pré-remplissage)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activityPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.roles)}
              className="p-3 rounded-lg border border-stone-300 bg-white hover:border-[var(--theme-primary)] hover:bg-stone-50 transition-all flex items-center gap-3 text-left cursor-pointer group shadow-xs"
            >
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{preset.icon}</span>
              <div>
                <span className="block text-xs font-bold text-stone-800 group-hover:text-[var(--theme-primary)]">
                  {preset.name}
                </span>
                <span className="block text-[10px] text-stone-500 truncate mt-0.5">
                  {preset.roles.slice(0, 3).join(', ')}...
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interrupteur d'Inclusivité Féminine */}
      <CordelCard variant="default" className="p-4 bg-emerald-50/60 border-2 border-[var(--color-cordel-vert)]/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👩‍🎤</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-vert)]">
                Inclusivité / Terminologie Féminine Majoritaire
              </h4>
              <p className="text-[11px] text-stone-600 font-medium">
                Adapte les intitulés par défaut dans l'application (ex: "Batuqueuse", "Présente").
              </p>
            </div>
          </div>

          <OnboardingToggleSwitch
            checked={majoriteFeminine}
            onChange={(val) => updateWizardData('majoriteFeminine', val)}
          />
        </div>
      </CordelCard>

      {/* 3. Ajustement des Pupitres & Instruments */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center justify-between">
          <span>Pupitres & Rôles Actifs ({instrumentsList.length})</span>
          <span className="text-[10px] text-stone-500 font-normal">Cliquez pour retirer</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {instrumentsList.length === 0 && (
            <span className="text-xs text-stone-400 italic">Aucun pupitre défini. Choisissez un profil ci-dessus ou ajoutez-les manuellement.</span>
          )}
          {instrumentsList.map((inst) => (
            <button
              key={inst}
              type="button"
              onClick={() => removeInstrument(inst)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white shadow-xs scale-102 flex items-center gap-1.5 hover:bg-red-700 hover:border-red-700 transition-colors cursor-pointer group"
              title="Retirer ce pupitre"
            >
              <span className="group-hover:hidden">✓</span>
              <span className="hidden group-hover:inline">✕</span>
              <span>{inst}</span>
            </button>
          ))}
        </div>

        {/* Ajout d'un instrument personnalisé */}
        <form onSubmit={handleAddCustomInstrument} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newInstInput}
            onChange={(e) => setNewInstInput(e.target.value)}
            placeholder="Autre pupitre ou rôle (ex: Technique, Basse...)"
            className="text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 flex-1 outline-none focus:border-[var(--theme-primary)]"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-extrabold uppercase bg-[var(--theme-primary)] text-white rounded-lg hover:brightness-110 cursor-pointer"
          >
            + Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
