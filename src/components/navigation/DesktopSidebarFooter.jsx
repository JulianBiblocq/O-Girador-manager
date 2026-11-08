import React from 'react';
import { XiloConsole, XiloSignOut } from '../XiloIcons';
import { forceUpdateAndClearCache } from '../../utils/pwaUtils';

/**
 * Pied de page compact de la barre latérale gauche (PC).
 * Regroupe « Système » et « Mode Standard » sur une seule ligne (`grid-cols-2`),
 * suivi du bouton « Se déconnecter » compact et de la micro-ligne de version PWA.
 */
export default function DesktopSidebarFooter({
  isSystemOrSuperAdminOrMestre,
  isSuperAdmin,
  currentTab,
  hasPendingMembers,
  pendingCount,
  breakGlassActive,
  onToggleBreakGlass,
  onNavigateToPole,
  onNavigateToTab,
  onSignOut,
  t
}) {
  const showBothTopButtons = Boolean(isSystemOrSuperAdminOrMestre && isSuperAdmin);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20 shrink-0 select-none">
      {(isSystemOrSuperAdminOrMestre || isSuperAdmin) && (
        <div className="grid grid-cols-2 gap-1.5 w-full">
          {isSystemOrSuperAdminOrMestre && (
            <button
              type="button"
              onClick={() => {
                if (onNavigateToPole) onNavigateToPole(null);
                if (onNavigateToTab) onNavigateToTab('system-admin');
              }}
              className={`relative ${showBothTopButtons ? 'col-span-1' : 'col-span-2'} py-1.5 px-2 font-black uppercase tracking-wide text-center text-[11px] leading-tight border-2 border-encre-noire rounded-[6px_9px_5px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                currentTab === 'system-admin'
                  ? 'theme-bg-ocre text-encre-noire'
                  : hasPendingMembers
                  ? 'bg-amber-100 text-encre-noire border-amber-600 animate-pulse'
                  : 'bg-white text-encre-noire hover:bg-neutral-100'
              }`}
              title={hasPendingMembers ? `${pendingCount} nouveau(x) membre(s) à valider` : (t('poles.tabSystemAdmin') || 'Système')}
            >
              <XiloConsole size={11} className="shrink-0" />
              <span className="truncate">{t('poles.tabSystemAdmin') || 'Système'}</span>
              {hasPendingMembers && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
              )}
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={onToggleBreakGlass}
              className={`${showBothTopButtons ? 'col-span-1' : 'col-span-2'} py-1.5 px-2 rounded-[6px_9px_5px_8px] text-[11px] leading-tight font-black uppercase tracking-wide border-2 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1.5px_1.5px_0px_0px_#181716] truncate ${
                breakGlassActive
                  ? 'bg-amber-400 text-encre-noire border-encre-noire animate-pulse'
                  : 'bg-cordel-bg text-cordel-master-dark/85 border-cordel-master-dark/30 hover:border-encre-noire'
              }`}
              title={t('breakGlass.switchTooltip') || 'Basculez pour déverrouiller les salons et modules restreints'}
            >
              <span className="truncate">
                {breakGlassActive ? `🔓 ${t('menu.btnIntervention')}` : `🔒 ${t('menu.btnIntervention')}`}
              </span>
            </button>
          )}
        </div>
      )}

      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          className="w-full py-1.5 px-2 text-center text-[11px] leading-tight font-black uppercase tracking-wider bg-[var(--color-cordel-rouge,#8b2a1a)] text-white border-2 border-encre-noire rounded-[6px_9px_5px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <XiloSignOut size={11} className="shrink-0" />
          <span className="truncate">{t('common.signOut') || 'Se déconnecter'}</span>
        </button>
      )}

      <div className="w-full flex items-center justify-between text-[7.5px] font-black opacity-40 tracking-widest uppercase select-none pt-1 px-0.5">
        <span>{import.meta.env.VITE_APP_VERSION || 'v1.6.15'}</span>
        <button
          type="button"
          onClick={() => forceUpdateAndClearCache()}
          className="hover:opacity-100 hover:text-cordel-wood cursor-pointer underline flex items-center gap-0.5"
          title="Vider les caches et actualiser l'application"
        >
          🔄 {t('menu.refreshApp')}
        </button>
      </div>
    </div>
  );
}

