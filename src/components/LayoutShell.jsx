import React, { useState, useEffect } from 'react';
import { 
  XiloHome, 
  XiloUser, 
  XiloPeople, 
  XiloMegaphone, 
  XiloSettings, 
  XiloCoin, 
  XiloBox, 
  XiloDrum, 
  XiloChisel, 
  XiloConsole, 
  XiloSignOut,
  XiloEQ,
  XiloScroll,
  XiloCalendar,
  XiloCompass,
  XiloHanger,
  XiloCaixa,
  XiloQuill,
  XiloScissors,
  XiloScale
} from './XiloIcons';
import { useTranslation } from './LanguageContext';
import { usePresence } from '../hooks/usePresence';
import { PresenceProvider } from '../context/PresenceContext';
import OnlineStatusWidget from './OnlineStatusWidget';
import { canAccessPole, canAccessTabPermission } from '../utils/permissionUtils';
import { usePendingMembersNotification } from '../hooks/usePendingMembersNotification';
import { resolveEffectiveUserTags } from '../utils/tagUtils'; // Utilitaire de résolution des étiquettes effectives
import InfoPoleBanner, { InfoPoleHelpButton } from './InfoPoleBanner';
import PageAccessBadgeIndicator from './common/PageAccessBadgeIndicator';
import FeedbackModal from './FeedbackModal';
import CommandPaletteModal from './common/CommandPaletteModal';
import { useTenantContext } from '../context/TenantContext';

import { useViewSimulator } from '../context/ViewSimulatorContext';
import SimulationBanner from './navigation/SimulationBanner';
import ViewSimulatorSelector from './navigation/ViewSimulatorSelector';
import useLicenseGuard from '../hooks/useLicenseGuard';
import SubscriptionBanner from './SubscriptionBanner';
import { isDemoMode } from '../demo/demoManager';
import NotificationCenter from './notifications/NotificationCenter';
import EcosystemAppLauncher from './navigation/EcosystemAppLauncher';
import LanguageToggle from './common/LanguageToggle';
import HeaderBrandTitle from './common/HeaderBrandTitle';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';

export default function LayoutShell({ 
  logoUrl, 
  associationName,
  associationData,
  sequenceurUrl, 
  currentPole, 
  onNavigateToPole,
  currentTab,
  onNavigateToTab,
  onOpenPrivateMessages,
  onNotificationNavigate,
  polesList = [],
  profileData, 
  onSignOut, 
  unreadPrivateMessagesCount = 0,
  forceLight = false,
  permissionsMatrice,
  enabledModules = {},
  activerPresenceEnLigne = true,
  enableIndividualProgression: _enableIndividualProgression = false,
  breakGlassActive = false,
  onToggleBreakGlass,
  tagsDisponibles = [],
  isBirthdayMonth = false,
  onStartDirectChat = null,
  children 
}) {
  const { urls } = useTenantContext();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoTilting, setIsLogoTilting] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [combinedLogoUrl, setCombinedLogoUrl] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const licenseInfo = useLicenseGuard(associationData);

  React.useEffect(() => {
    // Vérifie si le logo combiné a déjà été généré par App.jsx
    const favicon = document.querySelector('link#favicon') || document.querySelector('link[rel="icon"]');
    if (favicon && favicon.href && favicon.href.startsWith('data:image')) {
      setCombinedLogoUrl(favicon.href);
    }
    
    // Écoute l'événement pour récupérer le logo fraîchement généré
    const handleLogoReady = (e) => setCombinedLogoUrl(e.detail);
    window.addEventListener('combined-logo-ready', handleLogoReady);
    return () => window.removeEventListener('combined-logo-ready', handleLogoReady);
  }, []);

  const isDemo = isDemoMode();
  const finalLogoUrl = isDemo
    ? (logoUrl || '/brandings/logo-nachuva-girador.svg')
    : (combinedLogoUrl || logoUrl || '/favicon.svg');

  const handleLogoClick = () => {
    setIsLogoTilting(true);
    setTimeout(() => {
      setIsLogoTilting(false);
    }, 750);

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('eventId') || searchParams.has('threadId')) {
      searchParams.delete('eventId');
      searchParams.delete('threadId');
      const cleanUrl = window.location.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      window.history.replaceState({ ...window.history.state, eventId: null, threadId: null }, '', cleanUrl);
    }

    if (onNavigateToPole) onNavigateToPole('accueil');
    if (onNavigateToTab) onNavigateToTab('dashboard');
  };
  
  // Consommation du simulateur de vue
  const {
    isSimulating,
    simulationTarget,
    effectiveProfile: simulatedProfile,
    effectiveUserTags: simulatedTags
  } = useViewSimulator();

  // Profil actif pour le rendu et les permissions (adopte la vue simulée si active)
  const currentProfile = isSimulating && simulatedProfile ? simulatedProfile : profileData;

  // Garde-fou 1 : Isolation du Break-Glass (forcé à false en mode simulation pour ne pas fausser le test)
  const effectiveBreakGlassActive = isSimulating ? false : breakGlassActive;

  const isPresenceEnabled = activerPresenceEnLigne !== false;
  const currentUserId = currentProfile?.uid || currentProfile?.id;
  const currentGroupId = currentProfile?.groupId;
  const afficherEnLigne = currentProfile?.afficherEnLigne !== false;
  const { onlineMembers, onlineCount } = usePresence(currentUserId, currentGroupId, isPresenceEnabled, afficherEnLigne);
  const onlineUserIds = React.useMemo(() => new Set(onlineMembers.map(m => m.id || m.uid)), [onlineMembers]);
  
  const isSuperAdmin = Boolean(
    currentProfile?.isSystemAdmin === true || 
    (currentProfile?.role || '').toLowerCase() === 'super-admin' || 
    (currentProfile?.role || '').toLowerCase() === 'mestre' ||
    currentProfile?.uid === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1' ||
    currentProfile?.id === 'iA0SweEHyOPzAPGIDVZdeKAV2mk1'
  );
  const isSystemOrSuperAdminOrMestre = isSuperAdmin || currentProfile?.role === 'mestre';
  const isMasterKeyActive = isSuperAdmin && effectiveBreakGlassActive;
  // isPrivileged contrôle l'affichage des boutons inaccessibles avec un cadenas (🔒).
  // Si le mode intervention est inactif ou en simulation, le super-admin subit le même masquage propre que les autres membres.
  const isPrivileged = isMasterKeyActive;
  const userTags = (isSimulating && simulatedTags && simulatedTags.length > 0)
    ? simulatedTags
    : resolveEffectiveUserTags(currentProfile?.tags || [], tagsDisponibles);
  const { hasPendingMembers, pendingCount } = usePendingMembersNotification(currentProfile);

  // Condition stricte d'accès à la palette de commande (réservée aux porteurs de badges et rôles administratifs/mestre)
  const hasBadgeOrRole = Boolean(
    (userTags && userTags.length > 0) ||
    (currentProfile?.tags && currentProfile.tags.length > 0) ||
    currentProfile?.role === 'mestre' ||
    currentProfile?.role === 'admin' ||
    currentProfile?.role === 'super-admin' ||
    currentProfile?.isSystemAdmin === true ||
    isMasterKeyActive
  );

  // Écouteur global pour ouvrir/fermer la palette de commande universelle (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isModuleEnabled = (tabId, poleId) => {
    if (!enabledModules) return true;

    // Vérifier Pole-level module basculer
    if (poleId === 'gouvernance' && enabledModules?.gouvernance === false) return false;
    if (poleId === 'diffusion' && enabledModules.diffusion === false) return false;
    if (poleId === 'tresorerie' && enabledModules.tresorerie === false) return false;
    if (poleId === 'logistique' && enabledModules.logistique === false && enabledModules.commandes === false) return false;
    if (poleId === 'vestiaire' && enabledModules.vestiaire === false) return false;
    if (poleId === 'costumerie' && enabledModules.vestiaire === false && enabledModules.costumerie === false) return false;
    if (poleId === 'mestre' && enabledModules.mestre === false) return false;

    // Vérifier Tab-level module basculer
    if (tabId === 'gigs-pipeline' && enabledModules.diffusion === false) return false;
    if (['dashboard-finance', 'cotisations', 'events-finances', 'operations-diverses', 'frais-km', 'reports-exports'].includes(tabId) && enabledModules.tresorerie === false) return false;
    if (tabId === 'inventory' && enabledModules.logistique === false) return false;
    if (tabId === 'orders-manager' && enabledModules.commandes === false) return false;
    if (['vestiaire', 'wardrobe-inventory', 'wardrobe-couture', 'wardrobe-sizes', 'wardrobe-projects', 'wardrobe-models', 'wardrobe-pieces', 'wardrobe-supplies', 'wardrobe-tools', 'varal-costumerie'].includes(tabId) && enabledModules.vestiaire === false && enabledModules.costumerie === false) return false;
    if (['studio-social', 'studio-lexique', 'varal-manager'].includes(tabId) && enabledModules.studioSocial === false) return false;
    if (['reunion-manager', 'ca-reunions'].includes(tabId) && enabledModules.reunions === false) return false;
    if (['forum', 'mestre-forum-channels'].includes(tabId) && enabledModules.forum === false) return false;
    if (['mestre-repertoire', 'mestre-sante-troupe', 'mestre-pedagogy-manager', 'mestre-orientation', 'mestre-events', 'mestre-stage-layout', 'mestre-sequenceur', 'mestre-mot-mestre'].includes(tabId) && enabledModules.mestre === false) return false;

    if (tabId === 'mon-parcours') {
      if (enabledModules.monParcoursGlobal === false) return false;
    }

    if (tabId === 'repertoire') {
      const hasAccessMestreLocal = isMasterKeyActive || currentProfile?.role === 'mestre' || currentProfile?.role === 'super-admin' || currentProfile?.role === 'admin' || currentProfile?.isSystemAdmin === true;
      if (associationData?.features?.repertoireEleves !== true && !hasAccessMestreLocal) return false;
    }

    return true;
  };

  const checkTabAccess = (tabId, poleId) => {
    // 0. Strict Global Feature Basculer vérifier (Hides for EVERYONE including super-admin if OFF)
    if (!isModuleEnabled(tabId, poleId)) return false;

    // Master Key Bypass ONLY if Break-Glass Technical Intervention Mode is ACTIVE
    if (isMasterKeyActive) return true;

    return canAccessTabPermission(tabId, poleId, currentProfile, permissionsMatrice, userTags, effectiveBreakGlassActive);
  };


  // Strict Feature Basculer vérifier for the entire Pole (enabled globally for group)
  const isPoleEnabled = (poleId) => {
    if (poleId === 'accueil' || poleId === 'mon-espace') return true;

    if (poleId === 'gouvernance' && enabledModules?.gouvernance === false) return false;
    if (poleId === 'tresorerie' && enabledModules?.tresorerie === false) return false;
    if (poleId === 'logistique' && enabledModules?.logistique === false && enabledModules?.commandes === false) return false;
    if (poleId === 'costumerie' && enabledModules?.vestiaire === false && enabledModules?.costumerie === false) return false;

    if (poleId === 'mestre' && enabledModules?.mestre === false) return false;
    if (poleId === 'pedagogie' && enabledModules?.mestre === false && enabledModules?.studioSocial === false) return false;

    return true;
  };

  const isPoleUnlocked = (poleId) => {
    if (!isPoleEnabled(poleId)) return false;
    if (poleId === 'accueil' || poleId === 'mon-espace') return true;
    if (isMasterKeyActive) return true;

    if (canAccessPole(poleId, currentProfile, permissionsMatrice, userTags, effectiveBreakGlassActive)) return true;

    const activePoleObj = polesList.find(p => p.id === poleId);
    if (activePoleObj && activePoleObj.tabs) {
      return activePoleObj.tabs.some(tab => canAccessTabPermission(tab.id, poleId, currentProfile, permissionsMatrice, userTags, effectiveBreakGlassActive));
    }

    return false;
  };

  const isAdministrativeUser = isMasterKeyActive || 
                               currentProfile?.role === 'bureau' || 
                               currentProfile?.role === 'ca' || 
                               polesList.some(pole => pole.id !== 'accueil' && pole.id !== 'mon-espace' && isPoleUnlocked(pole.id));

  const canSendFeedback = currentProfile?.role === 'admin' || currentProfile?.role === 'mestre' || currentProfile?.role === 'super-admin' || currentProfile?.role === 'bureau' || currentProfile?.isSystemAdmin;

  const allMemberMenuItems = [
    { id: 'accueil', label: 'Accueil', labelKey: 'poles.tabAccueil', icon: <XiloHome size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('accueil', 'dashboard'); onNavigateToTab && onNavigateToTab('dashboard'); } },
    { id: 'profil', label: 'Profil', labelKey: 'poles.tabProfil', icon: <XiloUser size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'profil'); onNavigateToTab && onNavigateToTab('profil'); } },
    { id: 'mon-parcours', label: 'Mon Parcours', labelKey: 'poles.tabParcours', icon: <XiloCompass size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'mon-parcours'); onNavigateToTab && onNavigateToTab('mon-parcours'); } },
    { id: 'agenda', label: 'Agenda', labelKey: 'poles.tabAgenda', icon: <XiloCalendar size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'agenda'); onNavigateToTab && onNavigateToTab('agenda'); } },
    { id: 'atelier', label: 'Atelier', labelKey: 'poles.tabAtelier', icon: <XiloChisel size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'atelier'); onNavigateToTab && onNavigateToTab('atelier'); } },
    { id: 'materiel', label: 'Matériel', labelKey: 'poles.tabMateriel', icon: <XiloCaixa size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'materiel'); onNavigateToTab && onNavigateToTab('materiel'); } },
    { id: 'vestiaire', label: 'Vestiaire', labelKey: 'poles.tabVestiaire', icon: <XiloHanger size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'vestiaire'); onNavigateToTab && onNavigateToTab('vestiaire'); } },
    { id: 'trombinoscope', label: 'Trombinoscope', labelKey: 'poles.tabTrombinoscope', icon: <XiloPeople size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'trombinoscope'); onNavigateToTab && onNavigateToTab('trombinoscope'); } },
    { id: 'forum', label: 'Porte-voix', labelKey: 'poles.tabPorteVoix', icon: <XiloMegaphone size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'forum'); onNavigateToTab && onNavigateToTab('forum'); } },
    { id: 'varal', label: 'Varal', labelKey: 'poles.tabVaral', icon: <XiloScroll size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace', 'varal'); onNavigateToTab && onNavigateToTab('varal'); } }
  ];

  const memberMenuItems = allMemberMenuItems.filter(item => isModuleEnabled(item.id, 'mon-espace'));

  const hasAccessToTab = (tabId) => {
    const activePole = currentPole || 'accueil';
    return checkTabAccess(tabId, activePole);
  };

  // Garde-fou 2 : Redirection automatique de sécurité lors du passage en mode simulation
  // Si le pôle actif ou l'onglet courant devient inaccessible pour le profil simulé, redirection immédiate vers l'accueil/dashboard
  React.useEffect(() => {
    if (isSimulating) {
      const isCurrentPoleAccessible = !currentPole || currentPole === 'accueil' || currentPole === 'mon-espace' || isPoleUnlocked(currentPole);
      const isCurrentTabAccessible = !currentTab || currentTab === 'dashboard' || hasAccessToTab(currentTab);

      if (!isCurrentPoleAccessible || !isCurrentTabAccessible) {
        if (onNavigateToPole) onNavigateToPole('accueil');
        if (onNavigateToTab) onNavigateToTab('dashboard');
      }
    }
  }, [isSimulating, simulationTarget, currentPole, currentTab]);

  const getPoleIcon = (poleId, size = 12) => {
    switch (poleId) {
      case 'accueil':
        return <XiloHome size={size} />;
      case 'mon-espace':
        return <XiloUser size={size} />;

      case 'gouvernance':
        return <XiloScale size={size} />;
      case 'diffusion':
        return <XiloMegaphone size={size} />;
      case 'tresorerie':
        return <XiloCoin size={size} />;
      case 'secretariat':
        return <XiloQuill size={size} />;
      case 'logistique':
        return <XiloBox size={size} />;
      case 'lutherie':
        return <XiloChisel size={size} />;
      case 'costumerie':
        return <XiloScissors size={size} />;
      case 'studio':
        return <XiloMegaphone size={size} />;
      case 'pedagogie':
        return <XiloScroll size={size} />;
      case 'mestre':
        return <XiloDrum size={size} />;
      case 'config':
        return <XiloSettings size={size} />;
      default:
        return <XiloHome size={size} />;
    }
  };

  // Poles that are enabled in group configuration stay visible for discoverability
  const visiblePoles = polesList.filter(p => isPoleEnabled(p.id));
  const activePoleObj = polesList.find(p => p.id === currentPole);
  // Enabled tabs in the active pole stay visible in horizontal sub-menu
  const visibleTabs = activePoleObj 
    ? activePoleObj.tabs.filter(tab => isModuleEnabled(tab.id, activePoleObj.id))
    : [];

  const ecosystemAccess = associationData?.ecosystemAccess || {
    vitrine: true,
    sequenciador: true,
    dancador: true,
    hub: true
  };

  const isAccueil = currentPole === 'accueil' || !currentPole;



  return (
    <div className={`min-h-[100dvh] h-[100dvh] max-h-[100dvh] w-full ${forceLight ? 'bg-cordel-bg-light' : 'bg-cordel-bg-dark'} ${isBirthdayMonth ? 'theme-birthday-month' : ''} flex flex-col items-stretch justify-stretch p-0 overflow-hidden`}>
      <SubscriptionBanner licenseInfo={licenseInfo} profileData={currentProfile} />
      {/* Bannière persistante d'avertissement du mode simulation */}
      <SimulationBanner />

      {/* Responsive board container */}
      <div className="w-full h-full max-h-full overflow-hidden flex flex-col lg:flex-row relative bg-cordel-bg-light text-encre-noire">
        
        {/* Top Header / Navbar for Mobile and Tablet (hidden on Desktop) */}
        <div className="lg:hidden w-full h-16 landscape:h-12 border-b-4 border-cordel-master-dark bg-cordel-bg-light flex items-center px-3 sm:px-4 justify-between select-none shrink-0 z-[90]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div 
              onClick={handleLogoClick}
              className={`flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-90 transition-all shrink-0 ${
                isLogoTilting ? 'animate-logo-tilt' : ''
              }`}
              title={t('poles.accueil')}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo" 
                width={40}
                height={40}
                className="w-10 h-10 landscape:w-8 landscape:h-8 object-cover rounded-full pointer-events-none drop-shadow-sm" 
              />
              <div className="flex flex-col text-left truncate">
                <span className="font-extrabold text-[8px] uppercase tracking-widest text-cordel-master-dark/50 truncate">
                  O Girador
                </span>
                {associationName && (
                  <span className="font-black text-[10px] uppercase tracking-wider text-cordel-wood truncate max-w-[110px] sm:max-w-[150px] -mt-0.5">
                    {associationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {associationName && (
            <div className="hidden md:flex flex-grow justify-center px-2 select-none pointer-events-none">
              <span className="font-black text-xs md:text-sm uppercase tracking-widest text-cordel-wood truncate max-w-[200px]">
                {associationName}
              </span>
            </div>
          )}

          {/* Actions rapides Mobile : Écosystème, Présence compacte, Notifications & Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <EcosystemAppLauncher urls={urls} associationData={associationData} />
            <OnlineStatusWidget 
              onlineMembers={onlineMembers} 
              onlineCount={onlineCount} 
              isPresenceEnabled={isPresenceEnabled}
              compact={true}
              currentUserId={currentUserId}
              currentUserProfile={currentProfile}
              onStartDirectChat={onStartDirectChat}
            />
            <NotificationCenter 
              currentUser={currentProfile}
              groupId={currentGroupId}
              onNavigateToUrl={onNotificationNavigate}
            />

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 min-w-[38px] min-h-[38px] border-2 border-dashed border-encre-noire/20 hover:border-encre-noire text-encre-noire rounded-md cursor-pointer flex items-center justify-center transition-colors select-none"
              title="Ouvrir le menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {hasPendingMembers && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3" title={`${pendingCount} nouveau(x) membre(s) en attente de validation`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Left Sidebar for Desktop (hidden on Mobile & Tablet) */}
        <div className="hidden lg:flex w-56 border-r-4 border-cordel-master-dark bg-cordel-bg-light flex-col items-center justify-between py-6 px-3 shrink-0 select-none">
          <div className="flex flex-col items-center gap-3 w-full flex-grow min-h-0">
            <div 
              onClick={handleLogoClick}
              className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:scale-[1.04] hover:rotate-[-4deg] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all duration-300 shrink-0 drop-shadow-md ${
                isLogoTilting ? 'animate-logo-tilt' : ''
              }`}
              title={t('poles.accueil')}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo" 
                width={80}
                height={80}
                className="w-full h-full object-cover pointer-events-none" 
              />
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 shrink-0 mt-1">
              <div className="flex items-center gap-2 justify-center">
                <span 
                  onClick={handleLogoClick}
                  className="font-extrabold text-[10px] uppercase tracking-widest text-cordel-master-dark/50 cursor-pointer hover:opacity-85 transition-opacity"
                >
                  O Girador
                </span>
              </div>

              {isDemoMode() && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/demo?app=mostrador';
                  }}
                  className="w-full mt-1.5 py-1 px-2 text-[9px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)] text-white rounded-[5px_8px_6px_9px] border-2 border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer flex items-center justify-center gap-1 transition-all"
                  title="Ouvrir la Vitrine Publique en mode démo"
                >
                  <span>🌍 Voir le site public ↗</span>
                </button>
              )}
              {associationName && (
                <span className="font-black text-xs uppercase tracking-wider text-cordel-wood mt-1 leading-tight text-center break-words max-w-[160px]">
                  {associationName}
                </span>
              )}
            </div>
            
            <div className="w-full border-t border-dashed border-cordel-master-dark/20 my-2 shrink-0" />
            
            {/* Desktop Poles Navigation */}
            <div className="w-full flex-grow overflow-y-auto flex flex-col gap-2 pr-1 max-h-[calc(100vh-220px)] scrollbar-thin">
              {isAdministrativeUser ? (
                visiblePoles.map((pole) => {
                  const isUnlocked = isPoleUnlocked(pole.id);
                  const isActive = currentPole === pole.id;
                  const isRestrictedTitle = t('common.accessRestricted') || "Accès restreint";

                  if (!isUnlocked) {
                    // Masquage strict si l'utilisateur n'a pas de rôle privilégié (zéro cadenas, zéro bouton grisé)
                    if (!isPrivileged) return null;

                    return (
                      <button
                        key={pole.id}
                        type="button"
                        disabled={true}
                        title={isRestrictedTitle}
                        className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-2.5 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between opacity-50 grayscale cursor-not-allowed bg-cordel-bg/50 text-encre-noire/50 border-encre-noire/20 select-none shadow-none"
                      >
                        <span className="flex items-center gap-2">
                          {getPoleIcon(pole.id, 12)} 
                          {t(`poles.${pole.id}`) || pole.label}
                        </span>
                        <span className="text-[11px] shrink-0 opacity-75" title={isRestrictedTitle}>
                          🔒
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={pole.id}
                      onClick={() => onNavigateToPole && onNavigateToPole(pole.id)}
                      className={`theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-2.5 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between hover:bg-cordel-hover cursor-pointer border-2 transition-all ${
                        isActive 
                          ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                          : 'bg-cordel-bg text-encre-noire border-encre-noire/30 shadow-[1.5px_1.5px_0px_0px_#181716]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {getPoleIcon(pole.id, 12)} 
                        {t(`poles.${pole.id}`) || pole.label}
                      </span>
                      {pole.id === 'accueil' && unreadPrivateMessagesCount > 0 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenPrivateMessages) {
                              onOpenPrivateMessages();
                            } else {
                              if (onNavigateToPole) onNavigateToPole('mon-espace', 'forum');
                              if (onNavigateToTab) onNavigateToTab('forum');
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              if (onOpenPrivateMessages) onOpenPrivateMessages();
                            }
                          }}
                          className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0 cursor-pointer shadow-xs hover:scale-125 transition-transform"
                          title={`${unreadPrivateMessagesCount} message(s) privé(s) non lu(s) - Cliquer pour ouvrir`}
                        >
                          {unreadPrivateMessagesCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                memberMenuItems.map((item) => {
                  const isActive = (item.id === 'accueil' && currentPole === 'accueil' && (currentTab === 'dashboard' || !currentTab)) ||
                                   (item.id !== 'accueil' && currentTab === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-2.5 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between hover:bg-cordel-hover cursor-pointer border-2 transition-all ${
                        isActive 
                          ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                          : 'bg-cordel-bg text-encre-noire border-encre-noire/30 shadow-[1.5px_1.5px_0px_0px_#181716]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.labelKey ? (t(item.labelKey) || item.label) : item.label}
                      </span>
                      {item.id === 'forum' && unreadPrivateMessagesCount > 0 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenPrivateMessages) {
                              onOpenPrivateMessages();
                            } else {
                              if (onNavigateToPole) onNavigateToPole('mon-espace', 'forum');
                              if (onNavigateToTab) onNavigateToTab('forum');
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              if (onOpenPrivateMessages) onOpenPrivateMessages();
                            }
                          }}
                          className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0 cursor-pointer shadow-xs hover:scale-125 transition-transform"
                          title={`${unreadPrivateMessagesCount} message(s) privé(s) non lu(s) - Cliquer pour ouvrir`}
                        >
                          {unreadPrivateMessagesCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Desktop Footer */}
          <div className="flex flex-col items-center gap-2 w-full mt-4 shrink-0">
            {isSystemOrSuperAdminOrMestre && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPole) onNavigateToPole(null);
                  if (onNavigateToTab) onNavigateToTab('system-admin');
                }}
                className={`relative w-full py-1.5 px-2 font-black uppercase tracking-widest text-center text-[8px] border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currentTab === 'system-admin' 
                    ? 'theme-bg-ocre text-encre-noire' 
                    : hasPendingMembers
                    ? 'bg-amber-100 text-encre-noire border-amber-600 animate-pulse'
                    : 'bg-neutral-850 text-encre-noire hover:bg-neutral-100 bg-white'
                }`}
                title={hasPendingMembers ? `${pendingCount} nouveau(x) membre(s) à valider` : undefined}
              >
                <XiloConsole size={10} className="inline mr-1" />
                <span>{t('poles.tabSystemAdmin') || "Système"}</span>
                {hasPendingMembers && (
                  <span className="relative flex h-2 w-2 ml-1 shrink-0">
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
                className={`w-full py-1.5 px-2 rounded-[6px_9px_5px_8px] text-[8.5px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#181716] ${
                  breakGlassActive
                    ? 'bg-amber-400 text-encre-noire border-encre-noire animate-pulse'
                    : 'bg-cordel-bg text-cordel-master-dark/75 border-cordel-master-dark/30 hover:border-encre-noire'
                }`}
                title={t('breakGlass.switchTooltip') || "Basculez pour déverrouiller les salons et modules restreints"}
              >
                <span>{breakGlassActive ? (t('breakGlass.switchActive') || '🔓 Mode Intervention') : (t('breakGlass.switchInactive') || '🔒 Mode Standard')}</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-1.5 text-center text-[8px] font-black uppercase tracking-widest bg-red-800 text-white border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <XiloSignOut size={10} /> {t('common.signOut') || "Déconnexion"}
              </button>
            )}

            {canSendFeedback && (
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(true)}
                className="w-full py-1.5 text-center text-[8px] font-black uppercase tracking-widest bg-[var(--color-cordel-vert)] text-white border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1 mt-1"
                title="Signaler un bug ou soumettre une idée"
              >
                💡 Feedback
              </button>
            )}
            
            <div className="w-full flex items-center justify-center mt-2">
              <LanguageToggle className="w-full" />
            </div>

            <div className="w-full flex items-center justify-between text-[7.5px] font-black opacity-40 tracking-widest uppercase select-none mt-1 px-1">
              <span>{import.meta.env.VITE_APP_VERSION || 'v1.0.1'}</span>
              <button
                type="button"
                onClick={() => forceUpdateAndClearCache()}
                className="hover:opacity-100 hover:text-cordel-wood cursor-pointer underline flex items-center gap-0.5"
                title="Vider les caches et actualiser l'application"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y cordel-bg p-4 sm:p-5 sm:px-7 md:px-9 sm:py-6 md:py-8 flex flex-col justify-between">
          <div className="flex flex-col gap-5 w-full flex-1">
            
            {/* Break-Glass Active Warning Banner */}
            {breakGlassActive && isSuperAdmin && (
              <div className="w-full mb-1 px-3.5 py-2 bg-amber-400 text-encre-noire border-2 border-encre-noire rounded-[5px_8px_4px_7px] shadow-[2px_2px_0px_0px_#181716] text-[10px] font-black uppercase tracking-wider flex items-center justify-between z-20 select-none animate-fade-in shrink-0">
                <span className="flex items-center gap-2 truncate">
                  🔓 {t('breakGlass.activeBanner') || "Mode Intervention Technique Actif (Passe-partout complet)"}
                </span>
                <button
                  type="button"
                  onClick={onToggleBreakGlass}
                  className="bg-encre-noire text-white text-[9px] px-2.5 py-1 rounded font-black uppercase hover:bg-neutral-800 cursor-pointer shadow-xs shrink-0 ml-2"
                >
                  ✕ Désactiver
                </button>
              </div>
            )}

            {/* Mode Tableau de bord / Accueil : Barre d'en-tête unifiée fusionnée sur PC */}
            {isAccueil ? (
              <div className="hidden lg:grid lg:grid-cols-3 items-center w-full border-b-2 border-dashed border-cordel-master-dark/25 pb-3 mb-2 pt-1 select-none shrink-0">
                {/* 1. Gauche : Lanceur d'applications de l'écosystème (le gaufrier) */}
                <div className="flex items-center justify-start">
                  <EcosystemAppLauncher urls={urls} associationData={associationData} />
                </div>

                {/* 2. Centre : Titre "O GIRADOR" surmontant le tampon "ORGANIZADOR" */}
                <div className="flex justify-center items-center">
                  <HeaderBrandTitle titleSize="text-2xl xl:text-3xl" />
                </div>

                {/* 3. Droite : Composants de session regroupés */}
                <div className="flex items-center justify-end gap-2">
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

                  <OnlineStatusWidget 
                    onlineMembers={onlineMembers} 
                    onlineCount={onlineCount} 
                    isPresenceEnabled={isPresenceEnabled} 
                    currentUserId={currentUserId}
                    currentUserProfile={currentProfile}
                    onStartDirectChat={onStartDirectChat}
                  />

                  <NotificationCenter 
                    currentUser={currentProfile}
                    groupId={currentGroupId}
                    onNavigateToUrl={onNotificationNavigate}
                  />

                  {(isSuperAdmin || currentProfile?.role === 'mestre') && (
                    <ViewSimulatorSelector />
                  )}
                </div>
              </div>
            ) : (
              /* En-tête pour les autres pôles : onglets de navigation à gauche et utilitaires à droite sur PC */
              <div className={`items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none shrink-0 ${
                ((isSystemOrSuperAdminOrMestre || isAdministrativeUser) && visibleTabs.length > 0)
                  ? 'flex'
                  : 'hidden lg:flex'
              }`}>
                {/* Menu d'onglets horizontaux principaux du pôle courant (si présents) */}
                <div className="flex flex-wrap gap-2 items-center min-w-0">
                  <EcosystemAppLauncher urls={urls} associationData={associationData} className="mr-1 hidden lg:inline-flex" />
                  {(isSystemOrSuperAdminOrMestre || isAdministrativeUser) && visibleTabs.length > 0 ? (
                    visibleTabs.map((tab) => {
                      const isUnlocked = checkTabAccess(tab.id, activePoleObj?.id);
                      const isActive = currentTab === tab.id;
                      const isRestrictedTitle = t('common.accessRestricted') || "Accès restreint";

                      const translatedLabel = tab.labelKey ? (tab.labelKey.startsWith('poles.') ? t(tab.labelKey) : t(`poles.${tab.labelKey}`)) : null;
                      const displayLabel = (translatedLabel && !translatedLabel.startsWith('poles.')) ? translatedLabel : tab.label;

                      if (!isUnlocked) {
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            disabled={true}
                            title={isRestrictedTitle}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all opacity-50 grayscale cursor-not-allowed bg-cordel-bg/50 text-encre-noire/50 border-encre-noire/20 select-none shadow-none flex items-center gap-1.5"
                          >
                            <span className="text-[11px] opacity-75">🔒</span>
                            <span>{displayLabel}</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => onNavigateToTab && onNavigateToTab(tab.id)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                            isActive
                              ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                          }`}
                        >
                          {displayLabel}
                        </button>
                      );
                    })
                  ) : null}
                </div>

                {/* Actions rapides supérieures droites (Desktop PC universel, toujours visibles sur grand écran) */}
                <div className="hidden lg:flex items-center gap-2 shrink-0 ml-auto">
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

                  <OnlineStatusWidget 
                    onlineMembers={onlineMembers} 
                    onlineCount={onlineCount} 
                    isPresenceEnabled={isPresenceEnabled} 
                    currentUserId={currentUserId}
                    currentUserProfile={currentProfile}
                    onStartDirectChat={onStartDirectChat}
                  />

                  <NotificationCenter 
                    currentUser={currentProfile}
                    groupId={currentGroupId}
                    onNavigateToUrl={onNotificationNavigate}
                  />

                  {(isSuperAdmin || currentProfile?.role === 'mestre') && (
                    <ViewSimulatorSelector />
                  )}

                  <InfoPoleHelpButton 
                    key={`help_btn_${activePoleObj?.id || currentPole}_${currentTab || 'default'}`}
                    currentPole={activePoleObj?.id || currentPole} 
                    currentTab={currentTab} 
                  />
                </div>

                {/* Sur mobile : bouton d'aide contextuelle si des onglets sont affichés */}
                <div className="lg:hidden flex items-center gap-1.5 shrink-0 ml-auto">
                  <InfoPoleHelpButton 
                    key={`help_btn_mob_${activePoleObj?.id || currentPole}_${currentTab || 'default'}`}
                    currentPole={activePoleObj?.id || currentPole} 
                    currentTab={currentTab} 
                  />
                </div>
              </div>
            )}

            <div className="w-full flex-1">
              <PresenceProvider value={{ onlineMembers, onlineCount, onlineUserIds, isPresenceEnabled, afficherEnLigne }}>
                <InfoPoleBanner 
                  key={`help_banner_${activePoleObj?.id || currentPole}_${currentTab || 'default'}`}
                  currentPole={activePoleObj?.id || currentPole} 
                  currentTab={currentTab} 
                />
                <PageAccessBadgeIndicator 
                  currentTab={currentTab}
                  currentPole={activePoleObj?.id || currentPole}
                  permissionsMatrice={permissionsMatrice}
                  userTags={userTags}
                  isSystemAdminOrMestre={isSystemOrSuperAdminOrMestre}
                  tagsDisponibles={tagsDisponibles}
                />
                {children}
              </PresenceProvider>
            </div>
          </div>

          <div className="w-full flex justify-between items-center mt-8 border-t border-dashed border-cordel-master-dark/10 pt-2 select-none shrink-0">
            <span className="text-[8px] font-black uppercase tracking-wider opacity-20">
              © O Girador {associationName || (isDemo ? 'Maracatu Na Chuva' : 'Samambaia')}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-25 lg:hidden">
              {import.meta.env.VITE_APP_VERSION || 'v1.0.1'}
            </span>
          </div>
        </div>

        {/* Sliding Navigation Drawer (Mobile & Tablet overlay) */}
        {isDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] flex">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsDrawerOpen(false)}
            />
            
            {/* Drawer sheet container */}
            <div className="relative flex flex-col w-64 max-w-xs h-full bg-cordel-bg-light border-r-4 border-cordel-master-dark p-6 z-10 shadow-2xl animate-slide-in select-none text-left">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="absolute top-4 right-4 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center"
                title="Fermer le menu"
              >
                ✕
              </button>

              {/* Drawer Header */}
              <div className="flex flex-col items-center gap-2 mt-4 mb-6 pb-4 border-b border-dashed border-cordel-master-dark/20 text-center">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center drop-shadow-md">
                  <img src={finalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-[9px] uppercase tracking-widest text-cordel-master-dark/50">
                  O Girador
                </span>
                {associationName && (
                  <span className="font-black text-xs uppercase tracking-wider text-cordel-wood leading-tight text-center break-words max-w-[200px]">
                    {associationName}
                  </span>
                )}

                {/* Encart réservé Administration Technique (Super-Admin / Mestres réels) */}
                {isSystemOrSuperAdminOrMestre && (
                  <div className="w-full mt-2 p-2 bg-amber-500/10 border-2 border-dashed border-amber-800/40 rounded-[6px_9px_5px_8px] flex flex-col gap-1.5 text-left">
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-950/80">
                      🛠️ Administration technique
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleBreakGlass();
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-[5px_7px_4px_6px] text-[8.5px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1px_1px_0px_0px_#181716] ${
                            breakGlassActive
                              ? 'bg-amber-400 text-encre-noire border-encre-noire animate-pulse'
                              : 'bg-cordel-bg text-cordel-master-dark/85 border-cordel-master-dark/30 hover:border-encre-noire'
                          }`}
                          title={breakGlassActive ? "Mode Intervention Actif" : "Déverrouiller le Mode Intervention"}
                        >
                          <span>{breakGlassActive ? '🔓 Actif' : '🔒 Intervention'}</span>
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
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsCommandPaletteOpen(true);
                    }}
                    className="mt-1 w-full py-1.5 px-2 rounded-[6px_9px_5px_8px] text-[9px] font-black uppercase tracking-wider border-2 border-encre-noire bg-cordel-bg hover:bg-white text-encre-noire transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#181716]"
                  >
                    <span>🔍 Recherche rapide (Ctrl + K)</span>
                  </button>
                )}
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex flex-col gap-2.5 flex-grow overflow-y-auto pr-1">
                {isAdministrativeUser ? (
                  visiblePoles.map((pole) => {
                    const isUnlocked = isPoleUnlocked(pole.id);
                    const isActive = currentPole === pole.id;
                    const isRestrictedTitle = t('common.accessRestricted') || "Accès restreint";

                    if (!isUnlocked) {
                      // Masquage strict si l'utilisateur n'a pas de rôle privilégié (zéro cadenas, zéro bouton grisé)
                      if (!isPrivileged) return null;

                      return (
                        <button
                          key={pole.id}
                          type="button"
                          disabled={true}
                          title={isRestrictedTitle}
                          className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between opacity-50 grayscale cursor-not-allowed bg-cordel-bg/50 text-encre-noire/50 border-encre-noire/20 w-full select-none shadow-none"
                        >
                          <span className="flex items-center gap-2">
                            {getPoleIcon(pole.id, 14)} 
                            {t(`poles.${pole.id}`) || pole.label}
                          </span>
                          <span className="text-[12px] shrink-0 opacity-75" title={isRestrictedTitle}>
                            🔒
                          </span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={pole.id}
                        onClick={() => {
                          if (onNavigateToPole) onNavigateToPole(pole.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between hover:bg-cordel-hover cursor-pointer border-2 w-full transition-all ${
                          isActive 
                            ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                            : 'bg-cordel-bg text-encre-noire border-encre-noire/30 shadow-[1.5px_1.5px_0px_0px_#181716]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {getPoleIcon(pole.id, 14)} 
                          {t(`poles.${pole.id}`) || pole.label}
                        </span>
                        {pole.id === 'accueil' && unreadPrivateMessagesCount > 0 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenPrivateMessages) {
                                onOpenPrivateMessages();
                              } else {
                                if (onNavigateToPole) onNavigateToPole('mon-espace', 'forum');
                                if (onNavigateToTab) onNavigateToTab('forum');
                              }
                              setIsDrawerOpen(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                if (onOpenPrivateMessages) onOpenPrivateMessages();
                                setIsDrawerOpen(false);
                              }
                            }}
                            className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0 cursor-pointer shadow-xs hover:scale-125 transition-transform"
                            title={`${unreadPrivateMessagesCount} message(s) privé(s) non lu(s) - Cliquer pour ouvrir`}
                          >
                            {unreadPrivateMessagesCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  memberMenuItems.map((item) => {
                    const isActive = (item.id === 'accueil' && currentPole === 'accueil' && (currentTab === 'dashboard' || !currentTab)) ||
                                     (item.id !== 'accueil' && currentTab === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onClick();
                          setIsDrawerOpen(false);
                        }}
                        className={`theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between hover:bg-cordel-hover cursor-pointer border-2 w-full transition-all ${
                          isActive 
                            ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                            : 'bg-cordel-bg text-encre-noire border-encre-noire/30 shadow-[1.5px_1.5px_0px_0px_#181716]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon}
                          {item.labelKey ? (t(item.labelKey) || item.label) : item.label}
                        </span>
                        {item.id === 'forum' && unreadPrivateMessagesCount > 0 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenPrivateMessages) {
                                onOpenPrivateMessages();
                              } else {
                                if (onNavigateToPole) onNavigateToPole('mon-espace', 'forum');
                                if (onNavigateToTab) onNavigateToTab('forum');
                              }
                              setIsDrawerOpen(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                if (onOpenPrivateMessages) onOpenPrivateMessages();
                                setIsDrawerOpen(false);
                              }
                            }}
                            className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0 cursor-pointer shadow-xs hover:scale-125 transition-transform"
                            title={`${unreadPrivateMessagesCount} message(s) privé(s) non lu(s) - Cliquer pour ouvrir`}
                          >
                            {unreadPrivateMessagesCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-dashed border-cordel-master-dark/20 mt-auto select-none shrink-0">
                {isSystemOrSuperAdminOrMestre && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToPole) onNavigateToPole(null);
                      if (onNavigateToTab) onNavigateToTab('system-admin');
                      setIsDrawerOpen(false);
                    }}
                    className={`relative w-full py-1.5 text-center text-[9px] font-black uppercase tracking-widest border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      currentTab === 'system-admin' 
                        ? 'theme-bg-ocre text-encre-noire' 
                        : hasPendingMembers
                        ? 'bg-amber-100 text-encre-noire border-amber-600 animate-pulse'
                        : 'bg-neutral-850 text-encre-noire hover:bg-neutral-100 bg-white'
                    }`}
                  >
                    <XiloConsole size={12} className="inline mr-1" />
                    <span>{t('poles.tabSystemAdmin') || "Admin Système"}</span>
                    {hasPendingMembers && (
                      <span className="relative flex h-2 w-2 ml-1 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </span>
                    )}
                  </button>
                )}

                {sequenceurUrl && (
                  <a 
                    href={sequenceurUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 font-extrabold flex items-center justify-center gap-1.5 bg-[#d99f4d] text-[#1a1a1a] border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all text-center text-[8px] uppercase tracking-wide cursor-pointer"
                  >
                    <XiloEQ size={12} className="inline mr-1" /> {t('dashboard.sequencer') || "Séquenceur"}
                  </a>
                )}
                
                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-1.5 text-center text-[9px] font-black uppercase tracking-widest bg-red-800 text-white border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <XiloSignOut size={12} /> {t('common.signOut') || "Se déconnecter"}
                  </button>
                )}

                {canSendFeedback && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFeedbackModalOpen(true);
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-1.5 text-center text-[9px] font-black uppercase tracking-widest bg-[var(--color-cordel-vert)] text-white border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                  >
                    💡 Feedback
                  </button>
                )}

                <div className="w-full flex items-center justify-center mt-2">
                  <LanguageToggle className="w-full" />
                </div>

                <div className="flex justify-between items-center text-[8px] font-black opacity-40 mt-1">
                  <span>{import.meta.env.VITE_APP_VERSION || 'v1.0.1'}</span>
                  <button
                    type="button"
                    onClick={() => forceUpdateAndClearCache()}
                    className="hover:opacity-100 text-cordel-wood underline cursor-pointer flex items-center gap-1 font-black uppercase text-[8px]"
                    title="Vider les caches et actualiser l'application"
                  >
                    🔄 Actualiser
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      
      {hasBadgeOrRole && (
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(poleId, tabId) => {
            if (onNavigateToPole) {
              onNavigateToPole(poleId, tabId);
            }
            if (onNavigateToTab && tabId) {
              onNavigateToTab(tabId);
            }
          }}
          profileData={currentProfile}
          permissionsMatrice={permissionsMatrice}
          userTags={userTags}
          breakGlassActive={effectiveBreakGlassActive}
        />
      )}

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        profileData={profileData}
        associationName={associationName}
      />
    </div>
  );
}
