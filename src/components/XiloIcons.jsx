import React from 'react';

// 🎛️ Égaliseur (EQ)
export const XiloEQ = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M6,2 C6.3,7 5.8,13 6.1,22" />
    <path d="M12,2 C11.8,8 12.3,14 12,22" />
    <path d="M18,2 C18.2,6 17.7,12 18,22" />
    <path d="M3.5,14 C3.5,14 4.5,12 6,12 C7.5,12 8.5,14 8.5,14 C8.5,14 7.5,16 6,16 C4.5,16 3.5,14 3.5,14 Z" fill="currentColor" />
    <path d="M9.5,6 C9.5,6 10.5,4 12,4 C13.5,4 14.5,6 14.5,6 C14.5,6 13.5,8 12,8 C10.5,8 9.5,6 9.5,6 Z" fill="currentColor" />
    <path d="M15.5,10 C15.5,10 16.5,8 18,8 C19.5,8 20.5,10 20.5,10 C20.5,10 19.5,12 18,12 C16.5,12 15.5,10 15.5,10 Z" fill="currentColor" />
  </svg>
);

// 🌀 Compresseur (Compressor spiral)
export const XiloCompressor = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M19.5,4.5 C22.5,9.0 21.0,16.5 16.5,19.5 C12.0,22.5 5.5,21.0 3.0,16.5 C0.5,12.0 2.0,5.5 6.5,3.0 C11.0,0.5 16.5,2.0 18.0,6.5 C19.5,11.0 16.5,15.0 13.0,16.5 C9.5,18.0 6.5,15.0 6.0,11.5 C5.5,8.0 8.0,6.0 10.5,6.5 C13.0,7.0 13.5,9.5 12.0,11.0" />
  </svg>
);

// 🌊 Réverbération (Wave)
export const XiloReverb = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M2.0,13.0 C5.0,9.0 8.0,16.0 12.0,11.0 C16.0,6.0 18.0,10.0 22.0,6.0" />
    <path d="M2.0,18.0 C4.5,15.0 7.5,19.5 11.5,15.0 C15.5,10.5 18.5,15.0 22.0,11.0" />
    <path d="M3.0,21.5 L7.0,21.5" strokeWidth="1.5" />
    <path d="M10.0,21.5 L14.0,21.5" strokeWidth="1.5" />
    <path d="M17.0,21.5 L21.0,21.5" strokeWidth="1.5" />
  </svg>
);

// 🔥 Distorsion (Flame)
export const XiloDistortion = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M12.0,2.0 C11.5,4.5 10.0,6.5 9.0,8.0 C8.0,6.5 7.5,4.5 7.0,3.5 C5.5,5.5 3.0,9.0 3.0,13.0 C3.0,18.0 7.0,22.0 12.0,22.0 C17.0,22.0 21.0,18.0 21.0,13.0 C21.0,8.0 16.0,4.0 12.0,2.0 Z M12.0,18.0 C10.0,18.0 8.0,16.0 8.0,13.5 C8.0,11.5 9.5,10.0 10.5,9.0 C11.0,10.5 12.0,11.5 13.0,12.5 C14.0,13.5 14.5,14.5 14.5,15.5 C14.5,17.0 13.5,18.0 12.0,18.0 Z" />
  </svg>
);

// ✏️ Ciseau à bois / Éditer (Chisel)
export const XiloChisel = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M11.5,13.0 C10.0,11.0 12.5,5.5 16.5,2.5 C19.0,0.5 22.0,1.0 23.0,2.5 C24.0,4.0 23.0,7.5 20.5,10.5 C18.0,13.5 13.5,15.0 12.0,13.5 Z" fill="#b17046" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M16.5,4.5 C18.5,3.0 20.5,2.5 22.0,2.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M15.5,7.0 C17.5,5.5 19.5,5.0 20.5,5.0" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M8.5,15.5 L12.0,12.0 L11.0,11.0 L7.5,14.5 Z" fill="#d4af37" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M1.5,22.5 L7.5,14.5 L8.5,15.5 Z" fill="#e0e0e0" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M1.5,22.5 L4.0,20.0 L5.0,21.0 Z" fill="#ffffff" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
  </svg>
);

// ✕ Supprimer
export const XiloClose = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M4.5,3.2 C4.1,3.4 3.5,3.9 3.2,4.5 C2.9,5.1 3.2,5.8 3.8,6.4 L9.2,12.0 L3.8,17.6 C3.2,18.2 2.9,18.9 3.2,19.5 C3.5,20.1 4.1,20.6 4.5,20.8 C4.9,21.0 5.6,20.7 6.2,20.0 L12.0,14.2 L17.8,20.0 C18.4,20.7 19.1,21.0 19.5,20.8 C19.9,20.6 20.5,20.1 20.8,19.5 C21.1,18.9 20.8,18.2 20.2,17.6 L14.8,12.0 L20.2,6.4 C20.8,5.8 21.1,5.1 20.8,4.5 C20.5,3.9 19.9,3.4 19.5,3.2 C19.1,3.0 18.4,3.3 17.8,4.0 L12.0,9.8 L6.2,4.0 C5.6,3.3 4.9,3.0 4.5,3.2 Z" />
  </svg>
);

// Crown/Master
export const XiloMestre = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M2.5,21.0 L21.5,21.0 L21.5,18.5 L2.5,18.5 Z M3.5,16.5 L20.5,16.5 L22.0,7.5 L17.5,11.5 L12.0,4.5 L6.5,11.5 L2.0,7.5 Z" />
  </svg>
);

// 🙌 Main / Signaux (Hand)
export const XiloHand = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M11.5,1.5 C12.3,1.5 13.0,2.2 13.0,3.0 L13.0,10.0 L14.5,8.5 C15.1,7.9 16.0,7.9 16.6,8.5 C17.2,9.1 17.2,10.0 16.6,10.6 L14.5,12.7 L14.5,13.5 C14.5,13.5 15.5,12.5 16.5,12.5 C17.3,12.5 18.0,13.2 18.0,14.0 L18.0,15.5 C18.0,18.5 15.8,21.5 12.0,21.5 C8.2,21.5 5.5,19.0 5.5,15.5 L5.5,11.0 C5.5,10.2 6.2,9.5 7.0,9.5 C7.8,9.5 8.5,10.2 8.5,11.0 L8.5,12.5 L9.5,10.0 C9.8,9.2 10.5,8.5 11.5,8.5 L11.5,3.0 C11.5,2.2 12.3,1.5 11.5,1.5 Z" />
    <path d="M18.0,9.5 C19.3,9.5 20.5,10.7 20.5,12.0 C20.5,13.3 19.3,14.5 18.0,14.5 L17.0,14.5 L17.0,9.5 L18.0,9.5 Z" />
  </svg>
);

// 🔒 Verrou (Lock / Slave)
export const XiloLock = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M5,11 C5,9.5 5.5,10 5,11 L5,20 C5,21 6,22 7,22 L17,22 C18,22 19,21 19,20 L19,11 C19,10 18,9 17,9 L7,9 C6,9 5,10 5,11 Z" fill="currentColor" fillOpacity="0.1" />
    <path d="M8,9 L8,5 C8,3 9.5,2 12,2 C14.5,2 16,3 16,5 L16,9" />
    <path d="M12,13 L12,17" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
  </svg>
);

// Expand (Outward arrows)
export const XiloExpand = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M14,3 C16.5,3 19,3.5 21,3 L21,10" />
    <path d="M21,3 L14,10" />
    <path d="M10,21 C7.5,21 5,20.5 3,21 L3,14" />
    <path d="M3,21 L10,14" />
  </svg>
);

// Collapse (Inward arrows)
export const XiloCollapse = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M21,3 L15,9" />
    <path d="M15,9 L15,4" />
    <path d="M15,9 L20,9" />
    <path d="M3,21 L9,15" />
    <path d="M9,15 L9,20" />
    <path d="M9,15 L4,15" />
  </svg>
);

// ⭕ Roda
export const XiloRoda = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="6" />
  </svg>
);

// 🎚️ Console
export const XiloConsole = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M8,2 V22" />
    <path d="M16,2 V22" />
    <rect x="5" y="8" width="6" height="4" rx="1" fill="currentColor" />
    <rect x="13" y="14" width="6" height="4" rx="1" fill="currentColor" />
  </svg>
);

// 🎞️ Timeline
export const XiloTimeline = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <rect x="2" y="5" width="20" height="14" rx="1.5" />
    <path d="M2,9 H22" />
    <path d="M2,15 H22" />
    <path d="M6,5 V9" />
    <path d="M12,5 V9" />
    <path d="M18,5 V9" />
    <path d="M6,15 V19" />
    <path d="M12,15 V19" />
    <path d="M18,15 V19" />
  </svg>
);

// 🎮 Game
export const XiloGame = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="4" />
    <path d="M6,12 H10" strokeWidth="2.5" />
    <path d="M8,10 V14" strokeWidth="2.5" />
    <circle cx="15.5" cy="11" r="1" fill="currentColor" />
    <circle cx="17.5" cy="13" r="1" fill="currentColor" />
  </svg>
);

// 🌞 Sun
export const XiloSun = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12,2 V4" strokeWidth="2.5" />
    <path d="M12,20 V22" strokeWidth="2.5" />
    <path d="M2,12 H4" strokeWidth="2.5" />
    <path d="M20,12 H22" strokeWidth="2.5" />
    <path d="M5,5 L6.5,6.5" strokeWidth="2.5" />
    <path d="M17.5,17.5 L19,19" strokeWidth="2.5" />
    <path d="M5,19 L6.5,17.5" strokeWidth="2.5" />
    <path d="M17.5,6.5 L19,5" strokeWidth="2.5" />
  </svg>
);

// 🌙 Moon
export const XiloMoon = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M12,3 C10.5,5 9.5,7.5 9.5,10.5 C9.5,15.5 13.5,19.5 18.5,19.5 C19.5,19.5 20.5,19 21,18.5 C19.5,21 16.5,22.5 13,22.5 C6.5,22.5 1.5,17.5 1.5,11 C1.5,6.5 4.5,2.5 8.5,1.5 C8,2 12,3 12,3 Z" />
  </svg>
);

// 🧲 Aimant (Magnet)
export const XiloMagnet = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M5,10 V5 C5,3 7,2 12,2 C17,2 19,3 19,5 V10" />
    <path d="M5,10 C5,12 6,14 8,16 C10,18 14,18 16,16 C18,14 19,12 19,10" />
    <path d="M5,10 H9 V5 H5 Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M15,10 H19 V5 H15 Z" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

// ℹ️ Info
export const XiloInfo = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12,8 L12,8.01" strokeWidth="3" />
    <path d="M12,12 L12,16" />
  </svg>
);

// 📝 Scroll/Document (Toada lyrics)
export const XiloScroll = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M14,2 L14,6 C14,7 15,8 16,8 L20,8" />
    <path d="M16,22 H6 C5,22 4,21 4,20 V4 C4,3 5,2 6,2 H14 L20,8 V20 C20,21 19,22 18,22 Z" />
    <path d="M8,13 H16" strokeWidth="1.8" />
    <path d="M8,17 H14" strokeWidth="1.8" />
  </svg>
);

// 📖 Book (Légendes / shortcuts)
export const XiloBook = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M4,19.5 C4,18 5.5,17 7,17 H20" />
    <path d="M4,4.5 C4,3 5.5,2 7,2 H20 V21 H7 C5.5,21 4,20 4,18.5 Z" />
  </svg>
);

// 💬 Chat (Feedback)
export const XiloChat = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M21,11.5 C21,15.5 17,18 13,18 C11.5,18 9,19 7,21 V18 C4,16.5 3,14 3,11.5 C3,7 7,4 12,4 C17,4 21,7 21,11.5 Z" />
  </svg>
);

// 🥁 Drum (Mixador)
export const XiloDrum = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <ellipse cx="12" cy="6" rx="9" ry="3" />
    <path d="M3,6 V18 C3,19.5 7,21 12,21 C17,21 21,19.5 21,18 V6" />
    <path d="M3,6 L12,12 L21,6" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
    <path d="M8,9 V17" />
    <path d="M16,9 V17" />
  </svg>
);

// 📢 Mégaphone (Tocado por / Joué par)
export const XiloMegaphone = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M6,9.5 C5.2,9.5 4.5,10 4.5,11.5 C4.5,13 5.2,13.5 6,13.5 Z" fill="currentColor" />
    <path d="M6,10.5 L14.2,7.5 C14.9,7.2 15.5,7.8 15.5,8.5 L15.5,15.5 C15.5,16.2 14.9,16.8 14.2,16.5 L6,13.5" />
    <path d="M9.5,13 L8.5,18.5 C8.3,19.2 9.3,19.5 9.5,18.8 L10.5,12.8" />
    <path d="M18.5,8.5 C19.5,9.5 19.5,14.5 18.5,15.5" strokeWidth="2.5" />
    <path d="M21.5,6.5 C23.5,8.2 23.5,15.8 21.5,17.5" strokeWidth="2" strokeDasharray="1.5 2" />
  </svg>
);

// ⚙️ Paramètres / Administration (Gear)
export const XiloSettings = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path d="M12,2 L12,4" />
    <path d="M12,20 L12,22" />
    <path d="M2,12 L4,12" />
    <path d="M20,12 L22,12" />
    <path d="M5,5 L6.5,6.5" />
    <path d="M17.5,17.5 L19,19" />
    <path d="M5,19 L6.5,17.5" />
    <path d="M17.5,6.5 L19,5" />
    <path d="M9,3 L9.5,5" />
    <path d="M15,3 L14.5,5" />
    <path d="M9,21 L9.5,19" />
    <path d="M15,21 L14.5,19" />
    <path d="M3,9 L5,9.5" />
    <path d="M3,15 L5,14.5" />
    <path d="M21,9 L19,9.5" />
    <path d="M21,15 L19,14.5" />
  </svg>
);

// 🥁 Caisse claire (Caixa)
export const XiloCaixa = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <ellipse cx="12" cy="7" rx="9" ry="2.5" />
    <path d="M3,7 V13 C3,14.2 7,15.5 12,15.5 C17,15.5 21,14.2 21,13 V7" />
    <path d="M5,8.5 V12.5" />
    <path d="M8,9.5 V13.5" />
    <path d="M12,10 V14" />
    <path d="M16,9.5 V13.5" />
    <path d="M19,8.5 V12.5" />
    <path d="M4,17 L20,21" strokeWidth="1.8" />
    <path d="M20,17 L4,21" strokeWidth="1.8" />
    <circle cx="4" cy="17" r="0.8" fill="currentColor" />
    <circle cx="20" cy="17" r="0.8" fill="currentColor" />
  </svg>
);

// 📦 Achats groupés / Commandes (Box / Carton)
export const XiloBox = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M12,3 L21,7.5 L12,12 L3,7.5 Z" />
    <path d="M3,7.5 V16.5 L12,21 V12 Z" />
    <path d="M21,7.5 V16.5 L12,21 Z" />
    <path d="M12,1 V3" strokeWidth="1.5" strokeDasharray="2 1" />
    <path d="M10,1 C9,0.5 8,1.5 9,2.5 C10,3.5 12,3 12,3 C12,3 14,3.5 15,2.5 C16,1.5 15,0.5 14,1 C13,1.5 12,3 12,3" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

// 👥 Trombinoscope / Membres (People)
export const XiloPeople = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <circle cx="8" cy="8" r="3.5" />
    <path d="M2.5,18.5 C2.5,15.5 5,14 8,14 C9,14 9.8,14.2 10.5,14.5" />
    <circle cx="16" cy="8" r="3.5" />
    <path d="M13.5,14.5 C14.2,14.2 15,14 16,14 C19,14 21.5,15.5 21.5,18.5" />
    <path d="M1,21 H23" strokeWidth="1.5" />
  </svg>
);

// 📅 Agenda / Calendrier (Calendar)
export const XiloCalendar = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3,10 H21" />
    <path d="M8,2 V5" strokeWidth="2.5" />
    <path d="M16,2 V5" strokeWidth="2.5" />
    <circle cx="7" cy="14" r="0.8" fill="currentColor" />
    <circle cx="12" cy="14" r="0.8" fill="currentColor" />
    <circle cx="17" cy="14" r="0.8" fill="currentColor" />
    <circle cx="7" cy="18" r="0.8" fill="currentColor" />
    <circle cx="12" cy="18" r="0.8" fill="currentColor" />
    <circle cx="17" cy="18" r="0.8" fill="currentColor" />
  </svg>
);

export const XiloHome = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const XiloUser = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const XiloCoin = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9 9h5a2 2 0 0 1 0 4H9.5a2 2 0 0 0 0 4H15" />
  </svg>
);

export const XiloTag = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
  </svg>
);

export const XiloSignOut = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const XiloCar = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12.5V16c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
    <path d="M5 10h9l2 3.5H2.5L5 10Z" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

export const XiloMandacaru = ({ size = 16, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`xilo-icon ${className}`} 
    {...props}
  >
    {/* Soil / ground line at the bottom */}
    <path d="M 15 88 Q 50 85, 85 88" stroke="currentColor" strokeWidth="3" fill="none" />
    
    {/* Main cactus path (body + arms) */}
    <path 
      d="
        M 46 88 
        L 46 72 
        C 32 72, 26 65, 26 50 
        C 26 42, 32 42, 33 42 
        C 36 42, 36 48, 36 50 
        C 36 60, 40 64, 46 64 
        L 46 30 
        C 46 22, 54 22, 54 30 
        L 54 52 
        C 60 52, 64 48, 64 38 
        C 64 32, 70 32, 72 32 
        C 74 32, 74 38, 74 38 
        C 74 58, 68 62, 54 62 
        L 54 88 
        Z
      "
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="3.5"
    />
    
    {/* Inner ribs (lines following the contours of trunk and arms) */}
    {/* Main stem rib */}
    <path d="M 50 26 L 50 86" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    {/* Left arm rib */}
    <path d="M 31 43 C 31 52, 33 62, 45 68" stroke="currentColor" strokeWidth="2" fill="none" />
    {/* Right arm rib */}
    <path d="M 69 33 C 69 45, 68 53, 53 57" stroke="currentColor" strokeWidth="2" fill="none" />

    {/* Thorns (small crossed strokes) */}
    {/* Top thorn */}
    <path d="M 50 18 L 50 22 M 48 20 L 52 20" stroke="currentColor" strokeWidth="2" />
    {/* Left arm thorns */}
    <path d="M 22 46 L 26 50 M 26 46 L 22 50" stroke="currentColor" strokeWidth="2" />
    <path d="M 28 60 L 32 64 M 32 60 L 28 64" stroke="currentColor" strokeWidth="2" />
    {/* Right arm thorns */}
    <path d="M 72 35 L 76 39 M 76 35 L 72 39" stroke="currentColor" strokeWidth="2" />
    <path d="M 68 47 L 72 51 M 72 47 L 68 51" stroke="currentColor" strokeWidth="2" />
    {/* Main trunk thorns */}
    <path d="M 40 40 L 44 44 M 44 40 L 40 44" stroke="currentColor" strokeWidth="2" />
    <path d="M 60 70 L 64 74 M 64 70 L 60 74" stroke="currentColor" strokeWidth="2" />
  </svg>
);

