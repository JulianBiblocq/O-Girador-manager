import React from 'react';

/**
 * Composant d'affichage visuel de la barre de progression (Stepper UI) en 4 étapes.
 *
 * @param {number} currentStep - Étape actuellement active (1 à 4)
 * @param {Function} onSelectStep - Callback de changement d'étape au clic
 */
export default function NewsletterStepper({ currentStep, onSelectStep }) {
  const steps = [
    { number: 1, title: "1. Message d'accueil", desc: "Édito & Bienvenue" },
    { number: 2, title: "2. Prochaines dates", desc: "Événements à venir" },
    { number: 3, title: "3. Retour en images", desc: "Bilan & Galerie photos" },
    { number: 4, title: "4. Récapitulatif", desc: "Validation & Export" }
  ];

  return (
    <nav aria-label="Progression de la newsletter" className="w-full mb-8">
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <li key={step.number} className="w-full">
              <button
                type="button"
                onClick={() => onSelectStep(step.number)}
                className={`w-full text-left p-3.5 rounded-[var(--theme-border-radius,8px)] border transition-all duration-200 flex items-center space-x-3 cursor-pointer ${
                  isActive
                    ? 'border-[#2d6a4f] bg-[#2d6a4f]/10 shadow-sm ring-1 ring-[#2d6a4f]'
                    : isCompleted
                    ? 'border-[#2d6a4f]/50 bg-stone-100 dark:bg-stone-800 opacity-90'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Indicateur visuel d'étape */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm select-none shrink-0 ${
                    isActive
                      ? 'bg-[#2d6a4f] text-white'
                      : isCompleted
                      ? 'bg-[#2d6a4f]/80 text-white'
                      : 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {isCompleted ? '✓' : step.number}
                </div>

                {/* Libellé et sous-titre */}
                <div className="flex flex-col overflow-hidden">
                  <span
                    className={`font-semibold text-sm truncate ${
                      isActive
                        ? 'text-[#2d6a4f] dark:text-emerald-400'
                        : 'text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {step.desc}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
