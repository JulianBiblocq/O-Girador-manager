import React from 'react';

/**
 * Composant OnboardingMissingFieldsAlert
 * Bannière d'alerte Cordel élégante indiquant avec précision les champs
 * obligatoires manquants lors de la soumission du profil adhérent.
 * Permet un défilement interactif immédiat vers le champ concerné au clic.
 */
export default function OnboardingMissingFieldsAlert({ missingFieldsList = [], className = '' }) {
  if (!missingFieldsList || missingFieldsList.length === 0) return null;

  const handleScrollToField = (anchorId) => {
    if (!anchorId) return;
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = (el.matches && el.matches('input:not([type="checkbox"]):not([type="radio"]), select, textarea'))
        ? el
        : el.querySelector('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    }
  };

  return (
    <div
      role="alert"
      className={`p-3.5 sm:p-4 rounded-[6px_9px_5px_8px] border-2 border-dashed border-[#8b2a1a] bg-[#fff5f3] text-[#8b2a1a] shadow-xs flex flex-col gap-2.5 text-left ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl shrink-0">⚠️</span>
        <div>
          <h4 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-[#8b2a1a]">
            Champs obligatoires manquants pour l'inscription
          </h4>
          <p className="text-[11px] text-[#8b2a1a]/90 font-medium">
            Veuillez compléter les {missingFieldsList.length} élément{missingFieldsList.length > 1 ? 's' : ''} ci-dessous pour valider votre fiche :
          </p>
        </div>
      </div>

      {/* Liste des badges cliquables avec ancre directe vers le champ */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {missingFieldsList.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleScrollToField(item.anchorId)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-black uppercase rounded bg-white hover:bg-red-50 text-[#8b2a1a] border border-[#8b2a1a]/40 shadow-2xs transition-all cursor-pointer select-none active:translate-y-0.5"
            title={`Cliquer pour aller directement au champ : ${item.label}`}
          >
            <span>👉</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
