import React from 'react';
import { useTabRibbonAutoScroll } from '../../hooks/useTabRibbonAutoScroll';

/**
 * Conteneur générique pour ruban horizontal défilant responsive avec auto-scroll et indicateur de suite.
 * Garantit un défilement tactile fluide sur une seule ligne (nowrap) sans masquer les interactions.
 *
 * @param {Object} props
 * @param {string|number} props.activeTabId Identifiant de l'onglet actif pour l'auto-scroll
 * @param {React.ReactNode} props.children Boutons d'onglets ou éléments de navigation
 * @param {string} [props.className] Classes supplémentaires sur le conteneur externe
 * @param {string} [props.navClassName] Classes supplémentaires sur l'élément nav défilant
 * @param {string} [props.ariaLabel="Navigation par sous-onglets"] Libellé d'accessibilité ARIA
 * @param {boolean} [props.showFade=true] Active le dégradé indicateur sur le bord droit
 * @param {boolean} [props.isSticky=false] Active le positionnement collant (sticky)
 * @param {string} [props.stickyOffset="top-0"] Décalage vertical si collant
 * @param {string} [props.stickyZIndex="z-20"] Indice de superposition (z-index)
 */
export function HorizontalRibbonContainer({
  activeTabId,
  children,
  className = '',
  navClassName = '',
  ariaLabel = 'Navigation par sous-onglets',
  showFade = true,
  isSticky = false,
  stickyOffset = 'top-0',
  stickyZIndex = 'z-20'
}) {
  const containerRef = useTabRibbonAutoScroll(activeTabId);

  return (
    <div
      className={`relative w-full max-w-full min-w-0 ${
        isSticky ? `sticky ${stickyOffset} ${stickyZIndex} bg-cordel-bg/95 backdrop-blur-xs` : ''
      } ${className}`}
    >
      <nav
        ref={containerRef}
        aria-label={ariaLabel}
        className={`w-full max-w-full overflow-x-auto flex flex-nowrap lg:flex-wrap lg:overflow-visible items-center gap-x-2 gap-y-2 px-3 py-2 lg:py-1 pr-8 lg:pr-2 scroll-smooth scrollbar-none no-scrollbar ${navClassName}`}
      >
        {children}
      </nav>

      {/* Indicateur de suite sur le bord droit (dégradé subtil avec pointer-events-none strict pour ne jamais bloquer le dernier bouton) */}
      {showFade && (
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-[var(--cordel-bg,#faf6ed)] to-transparent select-none z-10 lg:hidden"
        />
      )}
    </div>
  );
}

/**
 * Bouton d'onglet standardisé pour ruban horizontal défilant.
 * Respecte les standards d'ergonomie mobile : touch-target >= 40px, non-écrasement, typographie claire.
 *
 * @param {Object} props
 * @param {string|number} props.id Identifiant unique de l'onglet
 * @param {boolean} props.isActive Indique si l'onglet est actuellement actif
 * @param {Function} props.onClick Gestionnaire de clic
 * @param {boolean} [props.disabled=false] Désactive le bouton (accès restreint)
 * @param {string} [props.title] Infobulle / titre accessible
 * @param {React.ReactNode} [props.icon] Icône ou emoji préfixe
 * @param {React.ReactNode} props.label Libellé textuel de l'onglet
 * @param {React.ReactNode} [props.badge] Badge indicateur (compteur ou pastille)
 * @param {string} [props.className] Classes CSS d'ajustement
 * @param {string} [props.activeClassName] Classes CSS de l'état actif (défaut : thème ocre Cordel)
 * @param {string} [props.inactiveClassName] Classes CSS de l'état inactif (défaut : carte Cordel neutre)
 * @param {string} [props.disabledClassName] Classes CSS de l'état verrouillé/désactivé
 */
export function RibbonTabButton({
  id,
  isActive,
  onClick,
  disabled = false,
  title,
  icon,
  label,
  badge,
  className = '',
  activeClassName = 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]',
  inactiveClassName = 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]',
  disabledClassName = 'opacity-50 grayscale cursor-not-allowed bg-cordel-bg/50 text-encre-noire/50 border-encre-noire/20 shadow-none'
}) {
  return (
    <button
      key={id}
      type="button"
      data-tab-id={id}
      data-tab-active={isActive ? 'true' : 'false'}
      disabled={disabled}
      title={title}
      onClick={disabled ? undefined : onClick}
      className={`shrink-0 whitespace-nowrap min-h-[40px] lg:min-h-0 px-3.5 py-1.5 lg:px-2.5 lg:py-1 text-sm lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
        disabled
          ? disabledClassName
          : isActive
          ? activeClassName
          : inactiveClassName
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {badge && <span className="ml-1 shrink-0">{badge}</span>}
    </button>
  );
}

/**
 * Ruban horizontal complet d'onglets défilants avec auto-scroll et styles Cordel.
 */
export default function HorizontalTabRibbon({
  tabs = [],
  activeTabId,
  onSelectTab,
  ariaLabel = 'Navigation par sous-onglets',
  className = '',
  navClassName = '',
  showFade = true,
  isSticky = false,
  stickyOffset = 'top-0',
  stickyZIndex = 'z-20'
}) {
  return (
    <HorizontalRibbonContainer
      activeTabId={activeTabId}
      className={className}
      navClassName={navClassName}
      ariaLabel={ariaLabel}
      showFade={showFade}
      isSticky={isSticky}
      stickyOffset={stickyOffset}
      stickyZIndex={stickyZIndex}
    >
      {tabs.map((tab) => (
        <RibbonTabButton
          key={tab.id}
          id={tab.id}
          isActive={activeTabId === tab.id}
          onClick={() => onSelectTab && onSelectTab(tab.id)}
          disabled={tab.disabled}
          title={tab.title}
          icon={tab.icon}
          label={tab.label}
          badge={tab.badge}
          activeClassName={tab.activeClassName}
          inactiveClassName={tab.inactiveClassName}
          disabledClassName={tab.disabledClassName}
          className={tab.className}
        />
      ))}
    </HorizontalRibbonContainer>
  );
}
