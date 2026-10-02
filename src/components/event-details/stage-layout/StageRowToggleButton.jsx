import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Bouton de commande discrète à bascule pour décaler une ligne en quinconce
 * sur la grille scénique du Mestre.
 *
 * @param {object} props
 * @param {number|string} props.rowIndex Identifiant / numéro de la ligne (positif pour percussions, négatif pour danse)
 * @param {boolean} props.isStaggered Indique si la ligne est actuellement en quinconce
 * @param {Function} props.onToggle Callback déclenché au clic avec le rowIndex
 * @param {string} [props.label] Libellé textuel optionnel (ex: "Rang 1", "Danse 1")
 */
export default function StageRowToggleButton({
  rowIndex,
  isStaggered = false,
  onToggle,
  label
}) {
  const { t } = useTranslation();
  const isDance = typeof rowIndex === 'number' && rowIndex < 0;
  const numIndex = isDance ? Math.abs(rowIndex) : rowIndex;
  const shortRowTag = isDance ? `D${numIndex}` : `R${numIndex}`;

  const rowText = isDance
    ? t('mestre.danceRowAligned', { index: numIndex })
    : isStaggered
      ? t('mestre.rowStaggered', { index: numIndex })
      : t('mestre.rowAligned', { index: numIndex });

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.(rowIndex);
      }}
      aria-pressed={isStaggered}
      className={`
        shrink-0 px-1.5 sm:px-2 py-1 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider
        transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer select-none
        ${
          isStaggered
            ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-2 border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] scale-[1.02]'
            : 'bg-white/80 dark:bg-black/30 text-cordel-master-dark/70 border border-dashed border-encre-noire/30 hover:border-encre-noire hover:text-encre-noire hover:bg-white'
        }
      `}
      title={
        isStaggered
          ? `${rowText} — Cliquer pour aligner`
          : `${rowText} — Cliquer pour décaler`
      }
    >
      <span className="text-[10px] leading-none" aria-hidden="true">⇄</span>
      <span className="hidden sm:inline font-bold">
        {rowText}
      </span>
      <span className="sm:hidden font-extrabold text-[8.5px]">
        {shortRowTag}
      </span>
      <span className="sm:hidden truncate">
        {isStaggered ? (
          <span className="font-black text-[9px] leading-none">✓</span>
        ) : (
          <span className="font-medium text-[8px] leading-none">|</span>
        )}
      </span>
    </button>
  );
}

