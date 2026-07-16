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
  const baseClass = "theme-btn px-5 py-2 cursor-pointer inline-block text-center transition-all select-none";
  const borderClass = useExtremeBorder ? 'theme-btn-extreme' : 'theme-btn-standard';

  const bgColors = {
    default: 'theme-bg-default',
    ocre: 'theme-bg-ocre',
    vert: 'theme-bg-vert',
    bleu: 'theme-bg-bleu',
    kraft: 'theme-bg-kraft',
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      className={`${baseClass} ${borderClass} ${bgColors[variant] || bgColors.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
