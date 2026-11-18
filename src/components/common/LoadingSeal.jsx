import React from 'react';
import { isDemoMode } from '../../demo/demoManager';

/**
 * Composant officiel de Sceau Combiné pour l'écran de chargement / Splash Screen (100 % Multi-Associations) :
 * 1. Mode Démo : blason Na Chuva (`/brandings/logo-nachuva-girador.svg`).
 * 2. Sceau combiné persistant (`combinedLogoUrl` ou cache F5) : affichage direct du blason complet.
 * 3. Composition dynamique à 2 calques : anneau `/og-girador-frame.svg` + logo intérieur centré (`w-[62%]`, `top-[14%]`).
 * 4. Repli neutre strict : anneau officiel O Girador seul.
 */
export default function LoadingSeal({
  associationData = null,
  branding = null,
  associationName = '',
  currentGroupId = null,
  className = '',
  size = 'large'
}) {
  const isDemo = isDemoMode();

  const cachedGroup = (typeof window !== 'undefined')
    ? (() => { try { return localStorage.getItem('og_cached_loader_group') || ''; } catch { return ''; } })()
    : '';

  const cachedLogo = (typeof window !== 'undefined')
    ? (() => { try { return localStorage.getItem('og_cached_loader_logo') || null; } catch { return null; } })()
    : null;

  const effectiveGroup = String(
    currentGroupId ||
    associationData?.groupId ||
    associationData?.id ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('groupe') || new URLSearchParams(window.location.search).get('tenant') || new URLSearchParams(window.location.search).get('groupId') : '') ||
    cachedGroup ||
    ''
  ).trim().toLowerCase();

  const canUseCachedLogo = Boolean(
    cachedLogo && (!effectiveGroup || !cachedGroup || cachedGroup.trim().toLowerCase() === effectiveGroup)
  );

  const resolvedCombined = branding?.combinedLogoUrl
    || associationData?.branding?.combinedLogoUrl
    || associationData?.combinedLogoUrl
    || null;

  let directSealSrc = null;
  let innerLogoSrc = null;

  if (isDemo) {
    directSealSrc = branding?.logoUrl || '/brandings/logo-nachuva-girador.svg';
  } else if (resolvedCombined) {
    directSealSrc = resolvedCombined;
  } else if (canUseCachedLogo && (cachedLogo.includes('logoOG') || cachedLogo.includes('combined-logo') || cachedLogo.startsWith('data:image'))) {
    directSealSrc = cachedLogo;
  } else {
    innerLogoSrc = branding?.logoUrl || associationData?.branding?.logoUrl || associationData?.logoUrl || (canUseCachedLogo ? cachedLogo : null) || null;
  }

  const sizeClasses = size === 'small'
    ? 'w-20 h-20'
    : (size === 'large' ? 'w-32 h-32 sm:w-40 sm:h-40' : 'w-24 h-24 sm:w-32 sm:h-32');

  const containerBaseClasses = `relative ${sizeClasses} rounded-full overflow-hidden flex items-center justify-center select-none shadow-md ${className}`;

  if (directSealSrc) {
    return (
      <div className={containerBaseClasses}>
        <img
          src={directSealSrc}
          alt={associationName || 'Sceau O Girador'}
          className="w-full h-full object-contain select-none pointer-events-none"
          onError={(e) => {
            e.currentTarget.src = '/og-girador-frame.svg';
          }}
        />
      </div>
    );
  }

  if (innerLogoSrc) {
    return (
      <div className={`${containerBaseClasses} bg-[#f4ecd8]`}>
        <img
          src="/og-girador-frame.svg"
          alt="Anneau O Girador"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        />
        <div className="absolute w-[62%] h-[62%] top-[14%] rounded-full overflow-hidden flex items-center justify-center pointer-events-none select-none p-1">
          <img
            src={innerLogoSrc}
            alt={associationName || 'Logo Association'}
            className="w-full h-full object-contain rounded-full select-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containerBaseClasses}>
      <img
        src="/og-girador-frame.svg"
        alt="O Girador"
        className="w-full h-full object-contain select-none pointer-events-none"
      />
    </div>
  );
}
