import React from 'react';
import HeaderSealLogo from '../common/HeaderSealLogo';
import ViewSimulatorSelector from './ViewSimulatorSelector';

/**
 * En-tête du tiroir de navigation mobile (Drawer Header) :
 * affiche le sceau de l'association, le bloc d'administration technique
 * (Mode Intervention + Simulateur de vue) et l'accès à la recherche rapide (< 90 lignes).
 */
export default function MobileDrawerHeader({
  associationData,
  effectiveAssocName,
  currentGroupId,
  logoUrl,
  combinedLogoUrl,
  canUseViewSimulator,
  isSuperAdmin,
  breakGlassActive,
  onToggleBreakGlass,
  hasBadgeOrRole,
  onOpenCommandPalette,
  t
}) {
  return (
    <div className="flex flex-col items-center gap-2 mt-4 mb-6 pb-4 border-b border-dashed border-cordel-master-dark/20 text-center">
      <HeaderSealLogo
        associationData={associationData}
        associationName={effectiveAssocName}
        currentGroupId={currentGroupId}
        logoUrl={logoUrl}
        combinedLogoUrl={combinedLogoUrl}
        isLogoTilting={false}
        size={64}
      />
      <span className="font-extrabold text-[9px] uppercase tracking-widest text-cordel-master-dark/50">
        O Girador
      </span>
      {effectiveAssocName && (
        <span className="font-black text-xs uppercase tracking-wider text-cordel-wood leading-tight text-center break-words max-w-[200px]">
          {effectiveAssocName}
        </span>
      )}

      {/* Encart réservé Administration Technique (Super-Admin / Mestres réels ou simulation active) */}
      {canUseViewSimulator && (
        <div className="w-full mt-2 p-2 bg-amber-500/10 border-2 border-dashed border-amber-800/40 rounded-[6px_9px_5px_8px] flex flex-col gap-1.5 text-left">
          <span className="text-[8px] font-black uppercase tracking-widest text-amber-950/80">
            🛠️ {t('menu.techAdminTitle')}
          </span>
          <div className="flex items-center gap-1.5">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={onToggleBreakGlass}
                className={`flex-1 py-1.5 px-2 rounded-[5px_7px_4px_6px] text-[8.5px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1px_1px_0px_0px_#181716] ${
                  breakGlassActive
                    ? 'bg-amber-400 text-encre-noire border-encre-noire animate-pulse'
                    : 'bg-cordel-bg text-cordel-master-dark/85 border-cordel-master-dark/30 hover:border-encre-noire'
                }`}
                title={breakGlassActive ? 'Mode Intervention Actif' : 'Déverrouiller le Mode Intervention'}
              >
                <span>{breakGlassActive ? '🔓 Actif' : `🔒 ${t('menu.btnIntervention')}`}</span>
              </button>
            )}
            <div className="shrink-0">
              <ViewSimulatorSelector />
            </div>
          </div>
        </div>
      )}

      {/* Bouton Palette de Commande Mobile dans le Drawer */}
      {hasBadgeOrRole && (
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="mt-1 w-full py-1.5 px-2 rounded-[6px_9px_5px_8px] text-[9px] font-black uppercase tracking-wider border-2 border-encre-noire bg-cordel-bg hover:bg-white text-encre-noire transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#181716]"
        >
          <span>🔍 {t('menu.quickSearchBtn')}</span>
        </button>
      )}
    </div>
  );
}

