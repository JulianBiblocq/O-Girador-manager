import React from 'react';

/**
 * Composant de barre de progression visuelle pour l'assistant d'onboarding.
 * Affiche l'avancement pas-à-pas (1 sur 4), les étapes avec icônes et le pourcentage.
 */
export default function WizardProgressBar({ currentStep, totalSteps = 4, stepTitles = [] }) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Entête avec étape actuelle et pourcentage */}
      <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-cordel-wood">
        <span>Étape {currentStep} sur {totalSteps}</span>
        <span className="font-mono bg-amber-100 text-stone-900 px-2 py-0.5 rounded border border-amber-300">
          {progressPercent}% complété
        </span>
      </div>

      {/* Barre de progression avec animation de remplissage */}
      <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden border border-stone-300 shadow-inner relative">
        <div
          className="h-full bg-[var(--color-cordel-vert,#2d6a4f)] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Puces visuelles des étapes */}
      <div className="grid grid-cols-4 gap-1 pt-1">
        {stepTitles.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div
              key={stepNum}
              className={`flex flex-col items-center text-center p-1 rounded transition-colors ${
                isActive
                  ? 'bg-amber-50 text-[var(--color-cordel-ocre,#c05621)] font-extrabold'
                  : isCompleted
                  ? 'text-[var(--color-cordel-vert,#2d6a4f)] font-bold'
                  : 'text-stone-400 font-normal'
              }`}
            >
              <span className={`text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full border mb-0.5 ${
                isActive
                  ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-amber-700'
                  : isCompleted
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-emerald-800'
                  : 'bg-stone-100 text-stone-500 border-stone-300'
              }`}>
                {isCompleted ? '✓' : stepNum}
              </span>
              <span className="text-[9px] sm:text-[10px] leading-tight hidden sm:block truncate w-full">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
