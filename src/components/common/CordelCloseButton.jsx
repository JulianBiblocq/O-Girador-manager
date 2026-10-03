import React from 'react';

/**
 * Bouton de fermeture standardisé Cordel conforme aux règles d'accessibilité tactile (Target Size 44×44 px minimum).
 * 
 * Garantit :
 * - Boîte tactile 44×44 px minimum (`min-w-[44px] min-h-[44px]`)
 * - Marges compensatoires d'alignement (`-mr-2 -mt-2`)
 * - Style Cordel contrasté (`text-[var(--color-cordel-wood,#8b2a1a)]`)
 * - Prise en charge des variantes 'default' et 'darkCircle'
 *
 * @param {Object} props
 * @param {Function} props.onClick Callback de fermeture
 * @param {string} [props.title="Fermer"] Texte au survol
 * @param {string} [props.ariaLabel="Fermer la boîte de dialogue"] Label d'accessibilité
 * @param {'default'|'darkCircle'} [props.variant='default']
 * @param {string} [props.className] Classes supplémentaires
 * @param {React.ReactNode} [props.children] Icône ou contenu optionnel (par défaut '✕')
 */
export default function CordelCloseButton({
  onClick,
  title = "Fermer",
  ariaLabel = "Fermer",
  variant = 'default',
  className = '',
  children
}) {
  const baseClasses = "min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg transition-colors cursor-pointer shrink-0 select-none touch-manipulation";

  if (variant === 'darkCircle') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
        className={`${baseClasses} text-white hover:bg-black/5 active:bg-black/10 ${className}`}
      >
        <span className="w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white hover:bg-red-700 transition-colors shadow-2xs">
          {children || <span className="leading-none pointer-events-none">✕</span>}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={`${baseClasses} rounded-lg text-[var(--color-cordel-wood,#8b2a1a)] hover:bg-black/5 active:bg-black/10 ${className}`}
    >
      {children || <span className="text-xl font-black leading-none pointer-events-none">✕</span>}
    </button>
  );
}
