import React from 'react';
import CordelButton from './CordelButton';

/**
 * EmptyState component for engaging empty views across main modules.
 * Fully multi-theme compliant using semantic CSS variables.
 *
 * @param {Object} props
 * @param {string} props.title - Main headline message
 * @param {string} [props.description] - Welcoming/explanatory description text
 * @param {React.ReactNode|string} [props.icon] - Emoji, SVG element or icon component
 * @param {string} [props.actionLabel] - Text for primary CTA button
 * @param {Function} [props.onAction] - Primary action callback
 * @param {string} [props.secondaryActionLabel] - Text for optional secondary action button
 * @param {Function} [props.onSecondaryAction] - Secondary action callback
 * @param {string} [props.className] - Additional container CSS classes
 * @param {'card'|'minimal'} [props.variant='card'] - Layout variant
 */
export default function EmptyState({
  title,
  description,
  icon = "🥁",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  variant = 'card'
}) {
  const containerStyles = variant === 'card'
    ? 'p-8 border-2 border-dashed border-[var(--cordel-border)] rounded-[var(--theme-border-radius,12px)] bg-[var(--cordel-card-bg)] text-center shadow-sm'
    : 'p-6 text-center';

  return (
    <div className={`flex flex-col items-center justify-center ${containerStyles} ${className}`}>
      {/* Icon Graphic Container */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-full bg-[var(--cordel-hover-bg)] border-2 border-[var(--cordel-border)] flex items-center justify-center text-3xl sm:text-4xl shadow-inner transition-transform duration-200 hover:scale-105">
        {typeof icon === 'string' && icon.length <= 4 ? (
          <span>{icon}</span>
        ) : (
          icon
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-black text-[var(--cordel-wood)] mb-2 max-w-md">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm font-medium text-[var(--encre-noire)] opacity-80 max-w-lg mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {actionLabel && onAction && (
            <CordelButton
              variant="wood"
              onClick={onAction}
              className="text-xs sm:text-sm py-2 px-5 font-bold shadow-md hover:shadow-lg"
            >
              {actionLabel}
            </CordelButton>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <CordelButton
              variant="secondary"
              onClick={onSecondaryAction}
              className="text-xs sm:text-sm py-2 px-4"
            >
              {secondaryActionLabel}
            </CordelButton>
          )}
        </div>
      )}
    </div>
  );
}
