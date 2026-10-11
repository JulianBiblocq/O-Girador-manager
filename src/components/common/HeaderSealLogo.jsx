import React from 'react';
import { isDemoMode } from '../../demo/demoManager';

/**
 * Composant de blason circulaire officiel combiné O Girador × Association.
 * Affiche l'anneau gravé "★ O GIRADOR ★" entourant le logo de l'association.
 * Pour Samambaia, exploite en priorité l'asset d'orfèvrerie dédié /brandings/logoOGSamambaia.png.
 * 
 * @param {Object} props
 * @param {Object} [props.associationData] - Données de l'association courante
 * @param {string} [props.associationName] - Nom de l'association
 * @param {string} [props.currentGroupId] - Identifiant du tenant
 * @param {string} [props.logoUrl] - URL brute du logo de l'association
 * @param {string} [props.combinedLogoUrl] - DataURL du logo combiné généré via Canvas
 * @param {boolean} [props.isLogoTilting] - Animation de bascule au clic
 * @param {Function} [props.onClick] - Callback au clic
 * @param {number} [props.size=80] - Diamètre en pixels
 * @param {string} [props.className] - Classes CSS complémentaires
 */
export default function HeaderSealLogo({
  associationData,
  associationName = '',
  currentGroupId = null,
  logoUrl = null,
  combinedLogoUrl = null,
  isLogoTilting = false,
  onClick = null,
  size = 80,
  className = ''
}) {
  const isDemo = isDemoMode();
  const rawGroup = currentGroupId || associationData?.groupId || associationData?.id || '';
  const cleanGroup = String(rawGroup).trim().toLowerCase();
  const name = (associationName || associationData?.nom || associationData?.name || '').toLowerCase();
  const isSamambaia = cleanGroup === 'samambaia' || name.includes('samambaia');

  // 1. Détermination de la source d'image pour le sceau
  let sealSrc = null;
  let useCompositeFallback = false;

  if (isDemo) {
    sealSrc = logoUrl || '/brandings/logo-nachuva-girador.svg';
  } else if (isSamambaia) {
    // Override sur-mesure d'orfèvrerie pour Samambaia (anneau O Girador gravé + fougère sacrée)
    sealSrc = '/brandings/logoOGSamambaia.png';
  } else if (combinedLogoUrl) {
    sealSrc = combinedLogoUrl;
  } else if (logoUrl) {
    // Si aucun canvas n'est encore prêt, composition visuelle avec anneau en fond
    useCompositeFallback = true;
  } else {
    sealSrc = '/og-girador-frame.svg';
  }

  const dimensionClasses = size === 40 
    ? 'w-10 h-10 landscape:w-8 landscape:h-8' 
    : (size === 64 ? 'w-16 h-16' : 'w-20 h-20');

  return (
    <div
      onClick={onClick}
      className={`relative ${dimensionClasses} rounded-full overflow-hidden flex items-center justify-center select-none shrink-0 drop-shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.04] hover:rotate-[-4deg] active:translate-x-[0.5px] active:translate-y-[0.5px]' : ''
      } ${isLogoTilting ? 'animate-logo-tilt' : ''} ${className}`}
      title={associationName || 'O Girador'}
    >
      {useCompositeFallback ? (
        <div className="relative w-full h-full flex items-center justify-center bg-[#f4ecd8]">
          {/* Anneau officiel O Girador en arrière-plan */}
          <img
            src="/og-girador-frame.svg"
            alt="Cadre O Girador"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          {/* Logo centré de l'association au cœur du disque */}
          <div className="absolute w-[62%] h-[62%] top-[14%] rounded-full overflow-hidden flex items-center justify-center pointer-events-none">
            <img
              src={logoUrl}
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
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            // Repli gracieux en cas de problème de chargement d'image
            if (sealSrc !== '/og-girador-frame.svg') {
              e.currentTarget.src = '/og-girador-frame.svg';
            }
          }}
        />
      )}
    </div>
  );
}
