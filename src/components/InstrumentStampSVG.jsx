import React from 'react';

// Generates a slightly irregular border for the stamp effect
const StampBorder = () => (
  <path 
    d="M 5,5 Q 15,2 30,6 Q 50,4 70,7 Q 90,3 115,5 Q 118,25 116,45 Q 114,65 115,85 Q 90,87 70,85 Q 40,88 20,86 Q 5,85 4,65 Q 2,45 5,5 Z" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    vectorEffect="non-scaling-stroke"
  />
);

export const getInstrumentStamp = (instrumentName, className = "") => {
  if (!instrumentName) return null;
  const nameLower = instrumentName.toLowerCase();
  
  let Icon = null;
  let label = "INSTRUMENT";
  
  if (nameLower.includes('alfaia')) {
    label = "ALFAIA";
    Icon = () => (
      <g transform="translate(60, 42) scale(0.6)">
        <circle cx="0" cy="0" r="25" fill="none" stroke="currentColor" strokeWidth="4"/>
        <path d="M-25,-10 L25,-10 M-25,10 L25,10" stroke="currentColor" strokeWidth="2"/>
        <path d="M-15,-20 L-25,-35 M15,-20 L25,-35" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </g>
    );
  } else if (nameLower.includes('caixa') || nameLower.includes('tarol')) {
    label = "CAIXA";
    Icon = () => (
      <g transform="translate(60, 42) scale(0.6)">
        <rect x="-30" y="-15" width="60" height="30" fill="none" stroke="currentColor" strokeWidth="4" rx="2"/>
        <path d="M-30,0 L30,0" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
        <path d="M-20,-25 L-5,-15 M20,-25 L5,-15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </g>
    );
  } else if (nameLower.includes('gonguê') || nameLower.includes('gongue')) {
    label = "GONGUÊ";
    Icon = () => (
      <g transform="translate(60, 45) scale(0.6)">
        <path d="M-20,20 Q-10,-30 0,-40 Q10,-30 20,20 Z" fill="none" stroke="currentColor" strokeWidth="4"/>
        <path d="M0,20 L0,40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </g>
    );
  } else if (nameLower.includes('agbe') || nameLower.includes('agbê') || nameLower.includes('shekere')) {
    label = "AGBÊ";
    Icon = () => (
      <g transform="translate(60, 45) scale(0.6)">
        <ellipse cx="0" cy="0" rx="20" ry="30" fill="none" stroke="currentColor" strokeWidth="4"/>
        <path d="M-20,-10 Q0,5 20,-10 M-20,0 Q0,15 20,0 M-20,10 Q0,25 20,10" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"/>
        <path d="M-10,-30 L10,-30 L5,-40 L-5,-40 Z" fill="currentColor"/>
      </g>
    );
  } else if (nameLower.includes('mineiro') || nameLower.includes('ganzá') || nameLower.includes('ganza')) {
    label = "MINEIRO";
    Icon = () => (
      <g transform="translate(60, 42) scale(0.6)">
        <rect x="-35" y="-10" width="70" height="20" fill="none" stroke="currentColor" strokeWidth="4" rx="10"/>
        <path d="M-20,-10 L-20,10 M0,-10 L0,10 M20,-10 L20,10" stroke="currentColor" strokeWidth="2"/>
      </g>
    );
  } else if (nameLower.includes('timbal')) {
    label = "TIMBAL";
    Icon = () => (
      <g transform="translate(60, 42) scale(0.6)">
        <path d="M-20,-20 L20,-20 L10,30 L-10,30 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M-15,-5 L15,-5 M-12,10 L12,10" stroke="currentColor" strokeWidth="2"/>
      </g>
    );
  } else if (nameLower.includes('chant') || nameLower.includes('puxador') || nameLower.includes('voix') || nameLower.includes('chanteur')) {
    label = "CHANT";
    Icon = () => (
      <g transform="translate(60, 45) scale(0.5)">
        <path d="M0,5 A15,15 0 0,0 30,5 A15,15 0 0,0 0,5 Z" fill="none" stroke="currentColor" strokeWidth="4"/>
        <path d="M5,25 Q15,40 25,25" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <rect x="10" y="-10" width="10" height="25" rx="5" fill="currentColor"/>
      </g>
    );
  } else if (nameLower.includes('danse') || nameLower.includes('cortejo') || nameLower.includes('pas')) {
    label = "DANSE";
    Icon = () => (
      <g transform="translate(60, 45) scale(0.6)">
        <circle cx="0" cy="-20" r="8" fill="currentColor"/>
        <path d="M-15,5 Q0,-10 15,5 M0,-10 L0,15 M0,15 L-10,35 M0,15 L10,35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </g>
    );
  } else {
    // Generic
    Icon = () => (
      <g transform="translate(60, 42) scale(0.6)">
        <circle cx="0" cy="0" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="4 4"/>
        <path d="M-10,-10 L10,10 M-10,10 L10,-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </g>
    );
    label = instrumentName.toUpperCase().substring(0, 10);
  }

  // Rotation aléatoire légère comme demandé (-4° à +4°)
  // Utilisons un hash simple du nom pour que ce soit déterministe par instrument
  const hash = nameLower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rotation = -4 + (hash % 9);

  return (
    <div 
      className={`inline-flex flex-col items-center justify-center text-[var(--theme-ink,#1a1a1a)] opacity-85 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      title={instrumentName}
    >
      <svg width="100" height="75" viewBox="0 0 120 90" className="w-full h-full drop-shadow-sm">
        <StampBorder />
        <Icon />
        <text 
          x="60" 
          y="76" 
          fontFamily="Cactus, sans-serif" 
          fontSize="18" 
          fontWeight="bold"
          textAnchor="middle" 
          fill="currentColor"
          letterSpacing="1"
        >
          {label}
        </text>
        {/* Grunge overlay effect for xylography */}
        <path d="M 15,15 L 20,10 M 100,10 L 105,15 M 10,70 L 15,75 M 105,75 L 100,70 M 20,40 L 25,40 M 100,50 L 95,50" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    </div>
  );
};
