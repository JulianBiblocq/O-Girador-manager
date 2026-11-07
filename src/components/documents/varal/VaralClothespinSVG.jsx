import React from 'react';

/**
 * Rendu vectoriel SVG 3D de l'épingle à linge artisanale en bois (Wooden Clothespin)
 * ou en finition dorée/cuivrée (`variant="gold"`) pour la « Fiche de la semaine » Culture.
 */
export default function VaralClothespinSVG({ className = "", variant = "wood" }) {
  const isGold = variant === "gold";
  const leftGradId = isGold ? "goldLeft" : "woodLeft";
  const rightGradId = isGold ? "goldRight" : "woodRight";
  const springGradId = isGold ? "springCopper" : "springMetal";
  const strokeColor = isGold ? "#78350F" : "#261A10";
  const veinColor = isGold ? "#92400E" : "#5E3915";

  return (
    <svg
      width="22"
      height="42"
      viewBox="0 0 22 42"
      fill="none"
      data-clothespin-variant={variant}
      className={`select-none drop-shadow-[1px_2px_3px_rgba(24,23,22,0.5)] ${isGold ? "text-amber-500 border-amber-900" : ""} ${className}`}
    >
      <defs>
        <linearGradient id="woodLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E2B274" />
          <stop offset="40%" stopColor="#C48E44" />
          <stop offset="100%" stopColor="#7E5220" />
        </linearGradient>
        <linearGradient id="woodRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F1C78B" />
          <stop offset="40%" stopColor="#D4A359" />
          <stop offset="100%" stopColor="#825220" />
        </linearGradient>
        <linearGradient id="goldLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="goldRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="45%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="springMetal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EEEEEE" />
          <stop offset="50%" stopColor="#999999" />
          <stop offset="100%" stopColor="#444444" />
        </linearGradient>
        <linearGradient id="springCopper" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Poignées supérieures en bois ou dorées (au-dessus de la corde) */}
      <path d="M 4 2 Q 5 1, 8.5 1 L 8.5 18 L 4 17 Z" fill={`url(#${leftGradId})`} stroke={strokeColor} strokeWidth="0.9" />
      <path d="M 13.5 1 Q 17 1, 18 2 L 18 17 L 13.5 18 Z" fill={`url(#${rightGradId})`} stroke={strokeColor} strokeWidth="0.9" />

      {/* Ressort central hélicoïdal */}
      <rect x="6.5" y="15" width="9" height="5.5" rx="1.8" fill={`url(#${springGradId})`} stroke="#1A1A1A" strokeWidth="0.8" />
      <circle cx="11" cy="17.7" r="1.6" fill="#1A1A1A" />

      {/* Mors inférieurs (pinçant le papier et la corde) */}
      <path d="M 4 21 L 8.5 21 L 8.5 40 L 6.5 41 Q 4 40, 4 36 Z" fill={`url(#${leftGradId})`} stroke={strokeColor} strokeWidth="0.9" />
      <path d="M 13.5 21 L 18 21 L 18 36 Q 18 40, 15.5 41 L 13.5 40 Z" fill={`url(#${rightGradId})`} stroke={strokeColor} strokeWidth="0.9" />

      {/* Stries et veines */}
      <line x1="6" y1="4" x2="6" y2="12" stroke={veinColor} strokeWidth="0.6" opacity="0.45" />
      <line x1="16" y1="4" x2="16" y2="13" stroke={veinColor} strokeWidth="0.6" opacity="0.45" />
      <line x1="6" y1="25" x2="6" y2="36" stroke={veinColor} strokeWidth="0.6" opacity="0.45" />
      <line x1="16" y1="25" x2="16" y2="35" stroke={veinColor} strokeWidth="0.6" opacity="0.45" />
    </svg>
  );
}
