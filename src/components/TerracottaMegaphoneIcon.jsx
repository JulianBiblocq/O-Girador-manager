import React from 'react';

/**
 * Icône SVG de mégaphone / porte-voix en traits simples couleur terracotta (#8B2A1A / #C85A17).
 * Remplace l'émoji Unicode de mégaphone qui s'affiche en bleu-blanc-rouge sur iOS.
 */
export default function TerracottaMegaphoneIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden="true"
    >
      <path
        d="M3 10.5V13.5C3 14.3284 3.67157 15 4.5 15H6.5L14.5 19V5L6.5 9H4.5C3.67157 9 3 9.67157 3 10.5Z"
        stroke="var(--color-cordel-rouge, #8B2A1A)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(200, 90, 23, 0.14)"
      />
      <path
        d="M6.5 15L7.8 20.2C7.98 20.9 8.6 21.4 9.33 21.4H10.2C11.05 21.4 11.67 20.58 11.44 19.76L10.2 15.3"
        stroke="var(--color-cordel-rouge, #8B2A1A)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 9C18.5 10.1 18.5 13.9 17.5 15M20 7C21.6 9.3 21.6 14.7 20 17"
        stroke="#C85A17"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
