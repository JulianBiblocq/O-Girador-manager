import React from 'react';

/**
 * CordelCard component utilizing theme-agnostic semantic CSS classes
 * for multi-theme architecture capability.
 */
export default function CordelCard({ 
  children, 
  variant = 'default', // 'default', 'ocre', 'vert', 'bleu', 'kraft'
  useExtremeBorder = true, 
  className = '' 
}) {
  const baseClass = useExtremeBorder 
    ? 'theme-card-extreme' 
    : 'theme-card-standard';

  const bgColors = {
    default: 'theme-bg-default',
    ocre: 'theme-bg-ocre',
    vert: 'theme-bg-vert',
    bleu: 'theme-bg-bleu',
    kraft: 'theme-bg-kraft',
  };

  return (
    <div className={`${baseClass} ${bgColors[variant] || bgColors.default} ${className}`}>
      {children}
    </div>
  );
}
