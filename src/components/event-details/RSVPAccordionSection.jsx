import React from 'react';

/**
 * Composant accordéon réutilisable pour les sections de présences / inscriptions d'un événement.
 * Conçu selon la charte Cordel : bordure bois/encre, typographie typique et chevrons d'état.
 */
export default function RSVPAccordionSection({
  title,
  count = 0,
  icon = '📋',
  colorVariant = 'neutral',
  isExpanded = false,
  onToggle,
  children,
  badgeExtra = null,
  emptyText = "Aucun membre",
  className = ""
}) {
  // Styles d'en-tête selon la variante sémantique Cordel
  const getVariantStyles = () => {
    switch (colorVariant) {
      case 'rouge':
        return {
          headerBg: 'hover:bg-red-50/60 dark:hover:bg-red-950/20 text-cordel-wood',
          border: 'border-[#8b2a1a]/25',
          badgeBg: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-800'
        };
      case 'vert':
        return {
          headerBg: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 text-[var(--color-cordel-vert)]',
          border: 'border-[#2d6a4f]/25',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        };
      case 'ocre':
        return {
          headerBg: 'hover:bg-amber-50/60 dark:hover:bg-amber-950/20 text-[var(--color-cordel-ocre)]',
          border: 'border-[#c05621]/25',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        };
      case 'yellow':
        return {
          headerBg: 'hover:bg-yellow-50/60 dark:hover:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400',
          border: 'border-yellow-500/25',
          badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
        };
      default:
        return {
          headerBg: 'hover:bg-stone-100/60 dark:hover:bg-stone-900/30 text-cordel-master-dark dark:text-cordel-bg-light',
          border: 'border-cordel-master-dark/20',
          badgeBg: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`theme-inner-panel rounded overflow-hidden border border-dashed ${styles.border} ${className}`}>
      {/* En-tête cliquable d'accordéon */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition-colors select-none text-left cursor-pointer ${styles.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm select-none">{icon}</span>
          <span className="font-extrabold uppercase tracking-wide">{title}</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border leading-none select-none ${styles.badgeBg}`}>
            {count}
          </span>
          {badgeExtra}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black">
          <span className="text-[10px] opacity-60 uppercase font-semibold hidden sm:inline">
            {isExpanded ? "Replier" : "Déplier"}
          </span>
          <span className={`transform transition-transform duration-200 select-none ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Contenu de la section dépliée */}
      {isExpanded && (
        <div className="p-3 pt-2.5 border-t border-dashed border-cordel-master-dark/15 text-xs animate-fade-in">
          {count === 0 && !children ? (
            <span className="opacity-60 italic text-xs">{emptyText}</span>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
