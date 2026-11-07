import React from 'react';
import { XiloFeedback } from '../XiloIcons';

/**
 * Bouton d'ouverture de la modale de retour (Feedback / Signalement de bug).
 * Utilise l'icône SVG sur-mesure `XiloFeedback` (bulle gravée avec un '+')
 * à la place de l'ampoule réservée aux bannières d'aide des pôles.
 */
export default function FeedbackButton({ onClick, variant = 'topbar', className = '' }) {
  const tooltip = 'Envoyer un retour / Signaler un bug';

  if (variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={tooltip}
        aria-label={tooltip}
        className={`w-full py-1.5 px-2 text-center text-[10px] font-black uppercase tracking-widest bg-[var(--color-cordel-vert)] text-white border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${className}`}
      >
        <XiloFeedback size={13} />
        <span>Feedback</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
      className={`px-2.5 py-1 min-h-[34px] bg-[var(--color-cordel-vert)] hover:brightness-110 text-white border-2 border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:scale-[1.03] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider select-none shrink-0 ${className}`}
    >
      <XiloFeedback size={15} />
      <span className="hidden xl:inline">Feedback</span>
    </button>
  );
}

