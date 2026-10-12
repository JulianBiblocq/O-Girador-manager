import React, { useState, useRef, useEffect } from 'react';

/**
 * Composant Tooltip pour explications contextuelles de micro-aide.
 * Entièrement conforme à l'architecture multi-thèmes via variables CSS sémantiques.
 * Supporte le survol, le focus clavier et le basculement tactile mobile.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.text - Contenu explicatif de l'infobulle
 * @param {React.ReactNode} [props.children] - Élément déclencheur personnalisé. Si omis, affiche l'icône discrète [?].
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top'] - Position relative au déclencheur
 * @param {'left'|'center'|'right'} [props.align] - Alignement horizontal. Par défaut 'left' pour les icônes près du bord gauche afin d'éviter le débordement hors écran.
 * @param {string} [props.className] - Classes CSS additionnelles pour le conteneur
 * @param {string} [props.iconVariant='default'] - Style d'icône prédéfini ('default' [?], 'info' (i))
 * @param {boolean} [props.enableHover=false] - Active l'affichage au survol souris
 */
export default function Tooltip({
  text,
  children,
  position = 'top',
  align,
  className = '',
  iconVariant = 'default',
  enableHover = false
}) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Résolution de l'alignement : par défaut 'left' pour les icônes d'aide afin de s'ouvrir vers la droite sans tronquage
  const effectiveAlign = align || (children ? 'center' : 'left');

  // Fermer la bulle d'aide lors d'un clic extérieur ou appui sur Échap
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      if (!e || !e.target || !e.target.isConnected) return;
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setIsVisible(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  if (!text) return children || null;

  // Calcul dynamique des classes de position du panneau
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        if (effectiveAlign === 'left') return 'top-full mt-2 left-0 translate-x-0';
        if (effectiveAlign === 'right') return 'top-full mt-2 right-0 translate-x-0';
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        if (effectiveAlign === 'left') return 'bottom-full mb-2 left-0 translate-x-0';
        if (effectiveAlign === 'right') return 'bottom-full mb-2 right-0 translate-x-0';
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  // Calcul dynamique des classes du pointeur / flèche indicatrice
  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        if (effectiveAlign === 'left') {
          return 'bottom-full left-3 -translate-x-1/2 border-b-[var(--cordel-border,#181716)] border-l-transparent border-r-transparent border-t-transparent';
        }
        if (effectiveAlign === 'right') {
          return 'bottom-full right-3 translate-x-1/2 border-b-[var(--cordel-border,#181716)] border-l-transparent border-r-transparent border-t-transparent';
        }
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--cordel-border,#181716)] border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-[var(--cordel-border,#181716)] border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-[var(--cordel-border,#181716)] border-t-transparent border-b-transparent border-l-transparent';
      case 'top':
      default:
        if (effectiveAlign === 'left') {
          return 'top-full left-3 -translate-x-1/2 border-t-[var(--cordel-border,#181716)] border-l-transparent border-r-transparent border-b-transparent';
        }
        if (effectiveAlign === 'right') {
          return 'top-full right-3 translate-x-1/2 border-t-[var(--cordel-border,#181716)] border-l-transparent border-r-transparent border-b-transparent';
        }
        return 'top-full left-1/2 -translate-x-1/2 border-t-[var(--cordel-border,#181716)] border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  // Formatage défensif du texte pour neutraliser tout texte accidentellement tout en majuscules
  const formatText = (val) => {
    if (typeof val !== 'string') return val;
    const str = val.trim();
    if (!str) return '';
    if (str.length > 5 && str === str.toUpperCase()) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    return str;
  };

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`}>
      {/* Élément déclencheur : ouverture au clic */}
      <div
        ref={triggerRef}
        onMouseEnter={() => enableHover && setIsVisible(true)}
        onMouseLeave={() => enableHover && setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        tabIndex={0}
        role="button"
        aria-label="Aide d'information"
        className="cursor-pointer inline-flex items-center justify-center focus:outline-none"
      >
        {children ? (
          children
        ) : (
          <span className="w-4 h-4 rounded-full border border-[var(--cordel-border,#181716)] bg-[var(--cordel-card-bg,#f4ecd8)] text-[var(--cordel-wood,#8b2a1a)] hover:bg-[var(--cordel-hover-bg,#e8dcbe)] flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors duration-150 ml-1">
            {iconVariant === 'info' ? 'i' : '?'}
          </span>
        )}
      </div>

      {/* Popover de l'infobulle - Calibré sans débordement gauche avec casse normale lisible */}
      {isVisible && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`absolute z-50 min-w-[240px] max-w-xs sm:max-w-sm w-max max-w-[85vw] p-2.5 sm:p-3 bg-[var(--cordel-card-bg,#f4ecd8)] text-[var(--cordel-text,#181716)] text-xs font-normal normal-case leading-relaxed text-left rounded-[var(--theme-border-radius,6px)] border border-[var(--cordel-border,#181716)] shadow-lg animate-fadeIn pointer-events-none select-text ${getPositionClasses()}`}
        >
          {formatText(text)}
          <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
}
