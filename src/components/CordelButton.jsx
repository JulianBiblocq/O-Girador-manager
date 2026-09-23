import React from 'react';

/**
 * CordelButton component utilizing theme-agnostic semantic CSS classes
 * for multi-theme architecture capability (no inline styles).
 */
export default function CordelButton({ 
  children, 
  onClick, 
  variant = 'default', // 'default', 'ocre', 'vert', 'bleu', 'kraft'
  useExtremeBorder = false, // if true, uses the extreme woodcut asymmetrical border-radius
  type = 'submit', // Default to submit to match native HTML button behavior
  className = '',
  ...props
}) {
  // Détection d'un padding personnalisé pour éviter les conflits Tailwind v4
  const hasCustomPaddingX = /(?:^|\s)(?:px-|p-)\S+/.test(className);
  const hasCustomPaddingY = /(?:^|\s)(?:py-|p-)\S+/.test(className);
  const defaultPadding = `${hasCustomPaddingX ? '' : 'px-5'} ${hasCustomPaddingY ? '' : 'py-2'}`.trim();

  const baseClass = `theme-btn ${defaultPadding} cursor-pointer inline-block text-center transition-all select-none`.replace(/\s+/g, ' ').trim();
  const borderClass = useExtremeBorder ? 'theme-btn-extreme' : 'theme-btn-standard';

  const bgColors = {
    default: 'theme-bg-default',
    ocre: 'theme-bg-ocre',
    vert: 'theme-bg-vert',
    bleu: 'theme-bg-bleu',
    kraft: 'theme-bg-kraft',
    rouge: 'theme-bg-rouge',
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      className={`${baseClass} ${borderClass} ${bgColors[variant] || bgColors.default} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
