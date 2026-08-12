import React, { useMemo } from 'react';

const STAMPS = {
  // 1. Oxalá - Opaxorô (Staff)
  'axe-oxala': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M9 8h6M10 14h4" />
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6c-3 0-5 2-5 5h10c0-3-2-5-5-5z" fill="currentColor" opacity="0.2" />
      {/* Hatching for woodcut feel */}
      <path d="M11 9L10 10M14 9L13 10M11 12L10 13" strokeWidth="1" />
    </svg>
  ),
  // 2. Yemanjá - Abebé (Mirror) & Waves
  'axe-yemanja': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="5" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v9" />
      <path d="M4 14c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 6 0" />
      <path d="M4 18c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 6 0" />
      {/* Hatching */}
      <path d="M10 7L11 8M14 7L13 8" strokeWidth="1" />
    </svg>
  ),
  // 3. Oxum - Abebé (Mirror) & Water flow
  'axe-oxum': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="9" r="6" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="9" r="6" />
      <path d="M12 15v7" />
      <path d="M12 18l-3 2M12 18l3 2" />
      {/* Hatching */}
      <path d="M10 8L11 9M14 8L13 9M11 11L12 12" strokeWidth="1" />
    </svg>
  ),
  // 4. Iansã - Eruexim (Fly whisk/Lightning)
  'axe-iansa': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2L10 12h4l-3 10" fill="currentColor" opacity="0.2" />
      <path d="M13 2L10 12h4l-3 10" />
      <path d="M7 6c2 1 2 3 0 4M17 6c-2 1-2 3 0 4" />
      <path d="M6 14c2 1 2 3 0 4M18 14c-2 1-2 3 0 4" />
    </svg>
  ),
  // 5. Oxóssi - Ofá (Bow and Arrow)
  'axe-oxossi': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12c0 8 8 10 16 8-8-4-12-12-8-18-6 2-8 6-8 10z" fill="currentColor" opacity="0.2" />
      <path d="M4 12c0 8 8 10 16 8-8-4-12-12-8-18-6 2-8 6-8 10z" />
      <path d="M22 2L6 18M22 2h-4M22 2v4" />
      {/* Hatching */}
      <path d="M8 12L9 13M10 15L11 16" strokeWidth="1" />
    </svg>
  ),
  // 6. Ogum - Idá (Sword)
  'axe-ogum': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2l2 6-2 14-2-14 2-6z" fill="currentColor" opacity="0.2" />
      <path d="M12 2l2 6-2 14-2-14 2-6z" />
      <path d="M8 18h8M12 18v4" />
      {/* Hatching */}
      <path d="M12 8L11 9M12 11L11 12M12 14L11 15" strokeWidth="1" />
    </svg>
  ),
  // 7. Xangô - Oxê (Double Axe)
  'axe-xango': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22V10" />
      <path d="M12 10C8 10 5 7 5 3c3 1 7 5 7 5s4-4 7-5c0 4-3 7-7 7z" fill="currentColor" opacity="0.2" />
      <path d="M12 10C8 10 5 7 5 3c3 1 7 5 7 5s4-4 7-5c0 4-3 7-7 7z" />
      <path d="M9 16h6" />
      {/* Hatching */}
      <path d="M8 5L9 6M15 5L14 6M11 7L12 8" strokeWidth="1" />
    </svg>
  ),
  // 8. Nanã - Ibirí (Curved Staff)
  'axe-nana': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 22v-8c0-2-1-4-3-4s-3 1-3 3 2 3 4 3 4-2 4-4-2-6-5-6-5 2-5 5" fill="currentColor" opacity="0.2" />
      <path d="M14 22v-8c0-2-1-4-3-4s-3 1-3 3 2 3 4 3 4-2 4-4-2-6-5-6-5 2-5 5" />
      {/* Straw/fibers details */}
      <path d="M7 11h2M12 16h3M12 18h3" strokeWidth="1" />
    </svg>
  ),
  // 9. Obaluaiê - Xaxará (Straw Broom)
  'axe-obaluai': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 2h4v8h-4zM6 10h12l-2 12H8L6 10z" fill="currentColor" opacity="0.2" />
      <path d="M10 2h4v8h-4z" />
      <path d="M6 10h12l-2 12H8L6 10z" />
      {/* Cowrie shells & straw hatching */}
      <path d="M12 14v1M10 15l-1 2M14 15l1 2M9 12l1 1M15 12l-1 1" strokeWidth="1" />
    </svg>
  ),
  // 10. Exu - Ogó (Trident)
  'axe-exu': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M7 8V5c0-1 1-2 2-2s2 1 2 2v2M17 8V5c0-1-1-2-2-2s-2 1-2 2v2" fill="currentColor" opacity="0.2" />
      <path d="M12 2v20M7 8V5c0-1 1-2 2-2s2 1 2 2v2M17 8V5c0-1-1-2-2-2s-2 1-2 2v2" />
      <path d="M5 8h14" />
      {/* Hatching */}
      <path d="M11 12L12 13M11 16L12 17" strokeWidth="1" />
    </svg>
  ),
  // 11. Oxumarê - Cobra (Rainbow Serpent)
  'axe-oxumare': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 18c0-6 4-10 8-10s8 4 8 10" fill="currentColor" opacity="0.2" />
      <path d="M4 18c0-6 4-10 8-10s8 4 8 10" />
      <path d="M4 18h3M20 18h-3" />
      <path d="M8 12c4-2 8-2 8 0" />
      {/* Hatching */}
      <path d="M6 15l1-1M18 15l-1-1" strokeWidth="1" />
    </svg>
  ),
  // 12. Logun Edé - Ofá and Abebé (Bow and Mirror)
  'axe-logunede': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Bow */}
      <path d="M4 12c0 8 8 10 16 8-8-4-12-12-8-18-6 2-8 6-8 10z" fill="currentColor" opacity="0.1" />
      <path d="M4 12c0 8 8 10 16 8-8-4-12-12-8-18-6 2-8 6-8 10z" />
      {/* Mirror */}
      <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="16" cy="16" r="4" />
      <path d="M16 20v3" />
    </svg>
  ),
  // Default and generic fallback stamps
  'axe-default': (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" opacity="0.2"/>
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
    </svg>
  )
};

const SeloAxeStamp = ({ 
  hexSecondary, 
  couleurs = [], 
  iconeStamp,
  stampKey,
  size = 'md',
  className = '',
  title = ''
}) => {
  // Aliases pour plus de robustesse
  const finalIcon = iconeStamp || stampKey || 'axe-default';
  const finalColor = hexSecondary || (couleurs && couleurs.length > 0 ? couleurs[0] : '#FFFFFF');

  // Tailles du conteneur
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  // Tailles de l'icône interne
  const iconSizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  // Micro-rotation aléatoire (-4° à +4°) pour l'effet d'impression manuelle
  const rotation = useMemo(() => {
    return (Math.random() * 8 - 4).toFixed(1);
  }, []);

  const StampIcon = STAMPS[finalIcon] || STAMPS['axe-default'];
  const sizeClass = sizeMap[size] || sizeMap.md;
  const iconSizeClass = iconSizeMap[size] || iconSizeMap.md;

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden border-2 shadow-sm ${sizeClass} ${className}`}
      style={{
        backgroundColor: finalColor,
        borderColor: 'var(--encre-noire)',
        // Bordures irrégulières style xylogravure / papier découpé
        borderRadius: '4px 12px 6px 14px / 10px 4px 12px 8px'
      }}
      title={title || `Selo de Axé: ${finalIcon}`}
    >
      {/* Texture de fond légère pour imiter le papier/grain d'encre */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)',
          backgroundSize: '4px 4px'
        }}
      />
      
      {/* Le tampon lui-même */}
      <div
        className={`text-[#1C1917] opacity-85 mix-blend-multiply drop-shadow-sm transition-transform duration-300 ${iconSizeClass}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <StampIcon className="w-full h-full" />
      </div>
    </div>
  );
};

export default SeloAxeStamp;
