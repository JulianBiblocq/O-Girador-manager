import React from 'react';
import { isDemoMode } from '../../demo/demoManager';

/**
 * Composant officiel de Sceau Combiné pour l'écran de chargement / Splash Screen.
 * 
 * Assure la superposition propre :
 * 1. Cas Samambaia : blason officiel d'orfèvrerie fusionné (/brandings/logoOGSamambaia.png).
 * 2. Cas Mode Démo : blason Na Chuva (/brandings/logo-nachuva-girador.svg).
 * 3. Cas Sceau combiné persistant (combinedLogoUrl) : affichage direct du blason complet.
 * 4. Cas dynamique multi-tenant (ex: Samb'à Bulles) :
 *    - Calque 1 (arrière-plan) : anneau Cordel officiel O Girador (/og-girador-frame.svg).
 *    - Calque 2 (centre) : logo de l'association (branding.logoUrl ou cache F5), centré,
 *      redimensionné proportionnellement et masqué en cercle (w-[62%], top-[14%], rounded-full).
 * 5. Fallback neutre strict : anneau officiel O Girador sans débordement.
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

  // Récupération de secours dans le localStorage lors d'un F5
  const cachedGroup = (typeof window !== 'undefined')
    ? (() => {
        try {
          return localStorage.getItem('og_cached_loader_group') || '';
        } catch (_) {
          return '';
        }
      })()
    : '';

  const cachedLogo = (typeof window !== 'undefined')
    ? (() => {
        try {
          return localStorage.getItem('og_cached_loader_logo') || null;
        } catch (_) {
          return null;
        }
      })()
    : null;

  const effectiveGroup = String(
    currentGroupId || 
    associationData?.groupId || 
    associationData?.id || 
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('groupe') || new URLSearchParams(window.location.search).get('tenant') || new URLSearchParams(window.location.search).get('groupId') : '') || 
    cachedGroup ||
    ''
  ).trim().toLowerCase();

  const nameLower = (associationName || associationData?.nom || associationData?.name || '').toLowerCase();
  const isSamambaia = effectiveGroup === 'samambaia' || nameLower.includes('samambaia');

  // Détermination de la source du sceau direct ou du logo central
  let directSealSrc = null;
  let innerLogoSrc = null;

  if (isDemo) {
    directSealSrc = branding?.logoUrl || '/brandings/logo-nachuva-girador.svg';
  } else if (isSamambaia) {
    directSealSrc = '/brandings/logoOGSamambaia.png';
  } else if (branding?.combinedLogoUrl || associationData?.branding?.combinedLogoUrl) {
    directSealSrc = branding?.combinedLogoUrl || associationData?.branding?.combinedLogoUrl;
  } else if (cachedLogo && (cachedLogo.includes('logoOG') || cachedLogo.includes('combined-logo') || cachedLogo.startsWith('data:image'))) {
    directSealSrc = cachedLogo;
  } else {
    innerLogoSrc = branding?.logoUrl || associationData?.branding?.logoUrl || associationData?.logoUrl || cachedLogo || null;
  }

  // Classes de dimensionnement responsif
  const sizeClasses = size === 'small' 
    ? 'w-20 h-20' 
    : (size === 'large' ? 'w-32 h-32 sm:w-40 sm:h-40' : 'w-24 h-24 sm:w-32 sm:h-32');

  const containerBaseClasses = `relative ${sizeClasses} rounded-full overflow-hidden flex items-center justify-center select-none shadow-md ${className}`;

  // 1. Sceau officiel complet fusionné (Samambaia ou combinedLogoUrl)
  if (directSealSrc) {
    return (
      <div className={containerBaseClasses}>
        <img
          src={directSealSrc}
          alt={associationName || 'Sceau O Girador'}
          className="w-full h-full object-contain select-none pointer-events-none"
          onError={(e) => {
            // Repli gracieux vers le cadre neutre si l'asset distant échoue
            e.currentTarget.src = '/og-girador-frame.svg';
          }}
        />
      </div>
    );
  }

  // 2. Composition dynamique multi-tenant (Anneau O Girador + Logo association au centre)
  if (innerLogoSrc) {
    return (
      <div className={`${containerBaseClasses} bg-[#f4ecd8]`}>
        {/* Calque 1 : Anneau Cordel officiel O Girador */}
        <img
          src="/og-girador-frame.svg"
          alt="Anneau O Girador"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        />
        {/* Calque 2 : Logo de l'association au cœur du disque neutre */}
        <div className="absolute w-[62%] h-[62%] top-[14%] rounded-full overflow-hidden flex items-center justify-center pointer-events-none select-none p-1">
          <img
            src={innerLogoSrc}
            alt={associationName || 'Logo Association'}
            className="w-full h-full object-contain rounded-full select-none"
            onError={(e) => {
              // Si le logo de l'association échoue, masquer le calque intérieur
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  // 3. Fallback neutre strict : anneau O Girador seul
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
