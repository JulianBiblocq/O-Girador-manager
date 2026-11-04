import React from 'react';
import CordelCard from '../../CordelCard';

/**
 * Carte d'accordéon Cordel pliable/dépliable pour les sections du Bilan d'AG.
 * Affiche le résumé des chiffres clés lorsqu'elle est repliée, et force l'ouverture
 * complète lors de l'impression (@media print / print:block).
 */
export default function AgReportAccordionCard({
  icon,
  title,
  summaryText,
  badgeText,
  isOpen,
  onToggle,
  children,
  className = ''
}) {
  return (
    <CordelCard
      variant="default"
      useExtremeBorder={false}
      className={`p-3.5 sm:p-4 flex flex-col gap-3 print-card text-left transition-all ${className}`}
    >
      {/* En-tête cliquable de l'accordéon */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none ${
          isOpen ? 'border-b border-dashed border-cordel-master-dark/25 pb-2.5' : ''
        }`}
      >
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>{icon}</span>
              <span>{title}</span>
            </h3>
            {badgeText && (
              <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-cordel-bg border border-encre-noire/30 rounded text-cordel-wood">
                {badgeText}
              </span>
            )}
          </div>

          {/* Résumé compact affiché lorsque l'accordéon est replié */}
          {!isOpen && summaryText && (
            <div className="text-[10.5px] sm:text-xs font-extrabold text-encre-noire/85 bg-cordel-bg/80 border border-encre-noire/20 px-2.5 py-1 rounded-[4px_6px_3px_5px] inline-flex items-center gap-1.5 w-fit max-w-full truncate no-print">
              <span className="truncate">{summaryText}</span>
            </div>
          )}
        </div>

        {/* Indicateur de repli / dépli (masqué à l'impression) */}
        <span className="no-print shrink-0 w-7 h-7 flex items-center justify-center rounded-[4px_6px_3px_5px] bg-cordel-bg border border-encre-noire/40 text-xs font-black text-cordel-wood shadow-[1px_1px_0px_0px_#181716]">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {/* Contenu détaillé : visible si ouvert à l'écran, et TOUJOURS visible à l'impression */}
      <div className={`${isOpen ? 'flex flex-col gap-3.5' : 'hidden'} print-force-open`}>
        {children}
      </div>
    </CordelCard>
  );
}

