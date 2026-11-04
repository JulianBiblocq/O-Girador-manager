import React from 'react';

/**
 * Icône SVG de mégaphone style gravure sur bois Cordel en rouge brique / terracotta (#8b2a1a)
 * et crème (#eaddcf), remplaçant l'émoji système 📢.
 */
export default function TerracottaMegaphoneIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Pavillon terracotta avec contour encre noire */}
      <path
        d="M5.5 9.5L15.2 5.2C16.1 4.8 17 5.5 17 6.5V17.5C17 18.5 16.1 19.2 15.2 18.8L5.5 14.5V9.5Z"
        fill="#8b2a1a"
        stroke="#181716"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Embouchure crème */}
      <rect
        x="2.5"
        y="9.2"
        width="3.2"
        height="5.6"
        rx="1"
        fill="#eaddcf"
        stroke="#181716"
        strokeWidth="1.8"
      />
      {/* Poignée gravée */}
      <path
        d="M7.5 14.8L6.6 19.2C6.4 20 7.1 20.6 7.9 20.4L9.4 19.9C10 19.7 10.3 19.1 10.2 18.5L9.6 15.5"
        fill="#eaddcf"
        stroke="#181716"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Ondes sonores terracotta */}
      <path
        d="M19.5 8.5C20.8 10 20.8 14 19.5 15.5"
        stroke="#8b2a1a"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M22 6.5C23.8 9 23.8 15 22 17.5"
        stroke="#8b2a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

