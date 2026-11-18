import React from 'react';
import { isDemoMode } from '../../demo/demoManager';

/**
 * Composant de blason circulaire officiel combiné O Girador × Association.
 * Affiche en priorité `combinedLogoUrl` (sceau officiel fusionné), sinon superpose
 * l'anneau gravé O Girador autour du logo de l'association, ou affiche le cadre neutre.
 */
export default function HeaderSealLogo({
  associationData,
  associationName = '',
  currentGroupId: _currentGroupId = null,
  logoUrl = null,
  combinedLogoUrl = null,
  isLogoTilting = false,
  onClick = null,
  size = 80,
  className = ''
}) {
  const isDemo = isDemoMode();
  const resolvedCombined = combinedLogoUrl
    || associationData?.branding?.combinedLogoUrl
    || associationData?.combinedLogoUrl
    || null;
  const resolvedInnerLogo = logoUrl
    || associationData?.branding?.logoUrl
    || associationData?.logoUrl
    || null;

  let sealSrc = null;
  let useCompositeFallback = false;

  if (isDemo) {
    sealSrc = resolvedInnerLogo || '/brandings/logo-nachuva-girador.svg';
  } else if (resolvedCombined) {
    sealSrc = resolvedCombined;
  } else if (resolvedInnerLogo) {
    useCompositeFallback = true;
  } else {
    sealSrc = '/og-girador-frame.svg';
  }

  const dimensionClasses = size === 40
    ? 'w-10 h-10 shrink-0 flex items-center justify-center'
    : (size === 64 ? 'w-16 h-16 shrink-0 flex items-center justify-center' : 'w-20 h-20 shrink-0 flex items-center justify-center');

  return (
    <div
      onClick={onClick}
      className={`relative ${dimensionClasses} select-none drop-shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.04] hover:rotate-[-4deg] active:translate-x-[0.5px] active:translate-y-[0.5px]' : ''
      } ${isLogoTilting ? 'animate-logo-tilt' : ''} ${className}`}
      title={associationName || 'O Girador'}
    >
      {useCompositeFallback ? (
        <div className="relative w-full h-full rounded-full flex items-center justify-center bg-[#f4ecd8]">
          <img
            src="/og-girador-frame.svg"
            alt="Cadre O Girador"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          <div className="absolute w-[62%] h-[62%] top-[14%] rounded-full overflow-hidden flex items-center justify-center pointer-events-none">
            <img
              src={resolvedInnerLogo}
              alt={associationName || 'Logo Association'}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>
      ) : (
        <img
          src={sealSrc}
          alt={associationName || 'Sceau O Girador'}
          width={size}
          height={size}
          className="w-full h-full object-contain pointer-events-none"
          onError={(e) => {
            if (sealSrc !== '/og-girador-frame.svg') {
              e.currentTarget.src = '/og-girador-frame.svg';
            }
          }}
        />
      )}
    </div>
  );
}
