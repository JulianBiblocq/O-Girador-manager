import React from 'react';
import EcosystemAppLauncher from './EcosystemAppLauncher';
import OnlineStatusWidget from '../OnlineStatusWidget';
import NotificationCenter from '../notifications/NotificationCenter';
import ViewSimulatorSelector from './ViewSimulatorSelector';
import { InfoPoleHelpButton } from '../InfoPoleBanner';
import { HorizontalRibbonContainer } from './HorizontalTabRibbon';

/**
 * Barre d'en-tête collante (sticky) des pôles métiers (hors Accueil).
 * Regroupe les utilitaires Desktop (Étage 1) et le ruban de sous-onglets (Étage 2)
 * avec fond 100 % opaque et bouton d'aide placé en colonne frère (shrink-0) à droite.
 */
export default function PoleStickyHeaderBar({
  urls, associationData, currentGroupId, setIsCommandPaletteOpen, isDefisAuthorized,
  activeLobbyRoom, setActiveGameRoomId, onlineMembers, onlineCount, isPresenceEnabled,
  currentUserId, currentProfile, profileData, onStartDirectChat, handleCreateGameRoom,
  handleJoinGameRoom, onNotificationNavigate, unreadPrivateMessagesCount,
  canUseViewSimulator, activePoleObj, currentPole, currentTab, visibleTabs = [],
  checkTabAccess, onNavigateToTab, t
}) {
  const poleId = activePoleObj?.id || currentPole;

  return (
    <div className="flex flex-col w-[calc(100%+1.25rem)] sm:w-[calc(100%+3.5rem)] md:w-[calc(100%+4.5rem)] -mx-2.5 px-2.5 sm:-mx-7 sm:px-7 md:-mx-9 md:px-9 select-none shrink-0 sticky top-0 z-30 bg-[var(--cordel-bg,#F4ECD8)] pt-2.5 sm:pt-4 md:pt-5">
      {/* ÉTAGE 1 : Barre d'utilitaires Desktop (invisible sur mobile) */}
      <div className="hidden lg:flex items-center justify-between w-full py-1.5 px-0 mb-0.5">
        <div className="flex items-center justify-start shrink-0">
          <EcosystemAppLauncher urls={urls} associationData={associationData} currentGroupId={currentGroupId} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-2.5 py-1 min-h-[34px] border-2 border-encre-noire bg-cordel-bg-light hover:bg-white text-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:scale-[1.03] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all text-xs font-black select-none"
            title="Recherche rapide (Ctrl + K)"
            aria-label="Palette de commande"
          >
            <span>🔍</span>
            <span className="text-[9.5px] font-mono opacity-60 bg-encre-noire/10 px-1 py-0.5 rounded hidden xl:inline">Ctrl K</span>
          </button>

          {isDefisAuthorized && activeLobbyRoom && (
            <button
              type="button"
              onClick={() => setActiveGameRoomId(activeLobbyRoom.id)}
              className="animate-bounce inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[34px] bg-[var(--color-cordel-vert)] text-white border-2 border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] text-[10px] font-black uppercase tracking-wider cursor-pointer select-none hover:scale-105 active:scale-95 transition-all"
              title="Défi ouvert ! Cliquer pour rejoindre la table"
            >
              <span className="text-xs">🏆</span>
              <span>Défi ouvert</span>
              <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                {Object.keys(activeLobbyRoom.players || {}).length}/4
              </span>
            </button>
          )}

          <OnlineStatusWidget
            onlineMembers={onlineMembers} onlineCount={onlineCount} isPresenceEnabled={isPresenceEnabled}
            currentUserId={currentUserId} currentUserProfile={currentProfile} onStartDirectChat={onStartDirectChat}
            activeLobbyRoom={activeLobbyRoom} onOpenLobby={(roomId) => setActiveGameRoomId(roomId)}
            onCreateRoom={handleCreateGameRoom} onJoinRoom={handleJoinGameRoom} isDefisAuthorized={isDefisAuthorized}
          />

          <NotificationCenter
            currentUser={profileData || currentProfile} groupId={currentGroupId}
            onNavigateToUrl={onNotificationNavigate} unreadPrivateMessagesCount={unreadPrivateMessagesCount}
          />

          {canUseViewSimulator && <ViewSimulatorSelector />}

          <InfoPoleHelpButton key={`help_btn_${poleId}_${currentTab || 'default'}`} currentPole={poleId} currentTab={currentTab} />
        </div>
      </div>

      {/* ÉTAGE 2 : Ruban horizontal de sous-onglets + bouton d'aide mobile isolé à droite */}
      {visibleTabs.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2 mb-1 w-full max-w-full min-w-0 lg:flex-wrap bg-[var(--cordel-bg,#F4ECD8)]">
          <div className="flex items-center min-w-0 flex-1 max-w-full overflow-hidden lg:overflow-visible">
            <HorizontalRibbonContainer activeTabId={currentTab} className="flex-1" navClassName="pr-12 lg:pr-2">
              {visibleTabs.map((tab) => {
                const isUnlocked = checkTabAccess(tab.id, activePoleObj?.id);
                const isActive = currentTab === tab.id;
                const isRestrictedTitle = t('common.accessRestricted') || 'Accès restreint';
                const translatedLabel = tab.labelKey ? (tab.labelKey.startsWith('poles.') ? t(tab.labelKey) : t(`poles.${tab.labelKey}`)) : null;
                let displayLabel = (translatedLabel && !translatedLabel.startsWith('poles.')) ? translatedLabel : tab.label;
                if (tab.id === 'vestiaire' && activePoleObj?.id === 'mon-espace' && associationData?.wardrobeMemberMode === 'collective_workshop') {
                  displayLabel = 'Atelier Costumes';
                }

                if (!isUnlocked) {
                  return (
                    <button
                      key={tab.id} type="button" data-tab-id={tab.id} data-tab-active="false" disabled={true} title={isRestrictedTitle}
                      className="shrink-0 whitespace-nowrap min-h-[40px] px-3.5 py-1.5 text-sm lg:min-h-0 lg:px-2.5 lg:py-1 lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all opacity-50 grayscale cursor-not-allowed bg-cordel-bg/50 text-encre-noire/50 border-encre-noire/20 select-none shadow-none flex items-center justify-center gap-1.5"
                    >
                      <span className="text-[11px] opacity-75">🔒</span>
                      <span>{displayLabel}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={tab.id} type="button" data-tab-id={tab.id} data-tab-active={isActive ? 'true' : 'false'}
                    onClick={() => onNavigateToTab && onNavigateToTab(tab.id)}
                    className={`shrink-0 whitespace-nowrap min-h-[40px] px-3.5 py-1.5 text-sm lg:min-h-0 lg:px-2.5 lg:py-1 lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                        : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                    }`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </HorizontalRibbonContainer>
          </div>

          <div className="lg:hidden flex items-center shrink-0 pl-1.5 border-l border-dashed border-cordel-master-dark/20">
            <InfoPoleHelpButton key={`help_btn_mob_${poleId}_${currentTab || 'default'}`} currentPole={poleId} currentTab={currentTab} />
          </div>
        </div>
      )}
    </div>
  );
}
