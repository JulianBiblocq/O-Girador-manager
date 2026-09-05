import React, { useState, useMemo } from 'react';
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
  XiloTag, 
  XiloConsole, 
  XiloSignOut,
  XiloEQ,
  XiloGlobe,
  XiloScroll,
  XiloCar,
  XiloCalendar,
  XiloCompass,
  XiloHanger,
  XiloCaixa,
  XiloQuill,
  XiloScissors
} from './XiloIcons';
import { useTranslation } from './LanguageContext';
import { usePresence } from '../hooks/usePresence';
import { PresenceProvider } from '../context/PresenceContext';
import OnlineStatusWidget from './OnlineStatusWidget';
import { canEditVitrine, canAccessPole, canAccessTabPermission } from '../utils/permissionUtils';
import { usePendingMembersNotification } from '../hooks/usePendingMembersNotification';
import { resolveEffectiveUserTags } from '../utils/tagUtils'; // Utilitaire de résolution des étiquettes effectives
import InfoPoleBanner, { InfoPoleHelpButton } from './InfoPoleBanner';
import PageAccessBadgeIndicator from './common/PageAccessBadgeIndicator';
import FeedbackModal from './FeedbackModal';
import { useTenantContext } from '../context/TenantContext';
import { getVitrineUrl } from '../utils/urlUtils';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';

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
  polesList = [],
  profileData, 
  onSignOut, 
  unreadPrivateMessagesCount = 0,
  forceLight = false,
  permissionsMatrice,
  enabledModules = {},
  activerPresenceEnLigne = true,
  enableIndividualProgression = false,
  breakGlassActive = false,
  onToggleBreakGlass,
  tagsDisponibles = [],
  isBirthdayMonth = false,
  children 
}) {
  const { urls } = useTenantContext();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoTilting, setIsLogoTilting] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [combinedLogoUrl, setCombinedLogoUrl] = useState(null);
  const [launchingAppKey, setLaunchingAppKey] = useState(null);

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

  const finalLogoUrl = combinedLogoUrl || logoUrl || '/favicon.svg';

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
  
  const isPresenceEnabled = activerPresenceEnLigne !== false;
  const currentUserId = profileData?.uid;
  const currentGroupId = profileData?.groupId;
  const { onlineMembers, onlineCount } = usePresence(currentUserId, currentGroupId, isPresenceEnabled);
  const onlineUserIds = React.useMemo(() => new Set(onlineMembers.map(m => m.id || m.uid)), [onlineMembers]);
  
  const isSystemOrSuperAdminOrMestre = profileData?.isSystemAdmin || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  const isPrivileged = profileData?.isSystemAdmin === true || ['super-admin', 'admin', 'mestre'].includes(profileData?.role);
  const isMasterKeyActive = isSystemOrSuperAdminOrMestre && breakGlassActive;
  const userTags = resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);
  const { hasPendingMembers, pendingCount } = usePendingMembersNotification(profileData);

  const isModuleEnabled = (tabId, poleId) => {
    if (!enabledModules) return true;

    // Vérifier Pole-level module basculer
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
    if (['studio-social', 'varal-manager'].includes(tabId) && enabledModules.studioSocial === false) return false;
    if (tabId === 'reunion-manager' && enabledModules.reunions === false) return false;
    if (['forum', 'mestre-forum-channels'].includes(tabId) && enabledModules.forum === false) return false;
    if (['mestre-sante-troupe', 'mestre-pedagogy-manager', 'mestre-orientation', 'mestre-events', 'mestre-stage-layout', 'mestre-sequenceur', 'mestre-mot-mestre'].includes(tabId) && enabledModules.mestre === false) return false;

    if (tabId === 'mon-parcours') {
      if (enabledModules.monParcoursGlobal === false) return false;
    }

    return true;
  };

  const checkTabAccess = (tabId, poleId) => {
    // 0. Strict Global Feature Basculer vérifier (Hides for EVERYONE including super-admin if OFF)
    if (!isModuleEnabled(tabId, poleId)) return false;

    // Master Key Bypass ONLY if Break-Glass Technical Intervention Mode is ACTIVE
    if (isMasterKeyActive) return true;

    return canAccessTabPermission(tabId, poleId, profileData, permissionsMatrice, userTags);
  };


  // Strict Feature Basculer vérifier for the entire Pole (enabled globally for group)
  const isPoleEnabled = (poleId) => {
    if (poleId === 'accueil' || poleId === 'mon-espace') return true;

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

    if (canAccessPole(poleId, profileData, permissionsMatrice, userTags)) return true;

    const activePoleObj = polesList.find(p => p.id === poleId);
    if (activePoleObj && activePoleObj.tabs) {
      return activePoleObj.tabs.some(tab => canAccessTabPermission(tab.id, poleId, profileData, permissionsMatrice, userTags));
    }

    return false;
  };

  const isAdministrativeUser = isSystemOrSuperAdminOrMestre || 
                               profileData?.role === 'bureau' || 
                               profileData?.role === 'ca' || 
                               polesList.some(pole => pole.id !== 'accueil' && pole.id !== 'mon-espace' && isPoleUnlocked(pole.id));

  const canSendFeedback = profileData?.role === 'admin' || profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.role === 'bureau' || profileData?.isSystemAdmin;

  const allMemberMenuItems = [
    { id: 'accueil', label: 'Accueil', icon: <XiloHome size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('accueil'); onNavigateToTab && onNavigateToTab('dashboard'); } },
    { id: 'profil', label: 'Profil', icon: <XiloUser size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('profil'); } },
    { id: 'mon-parcours', label: 'Mon Parcours', icon: <XiloCompass size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('mon-parcours'); } },
    { id: 'agenda', label: 'Agenda', icon: <XiloCalendar size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('agenda'); } },
    { id: 'atelier', label: 'Atelier', icon: <XiloChisel size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('atelier'); } },
    { id: 'materiel', label: 'Matériel', icon: <XiloCaixa size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('materiel'); } },
    { id: 'vestiaire', label: 'Vestiaire', icon: <XiloHanger size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('vestiaire'); } },
    { id: 'trombinoscope', label: 'Trombinoscope', icon: <XiloPeople size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('trombinoscope'); } },
    { id: 'forum', label: 'Porte-voix', icon: <XiloMegaphone size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('forum'); } },
    { id: 'varal', label: 'Varal', icon: <XiloScroll size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('accueil'); onNavigateToTab && onNavigateToTab('varal'); } }
  ];

  const memberMenuItems = allMemberMenuItems.filter(item => isModuleEnabled(item.id, 'mon-espace'));

  const hasAccessToTab = (tabId) => {
    const activePole = currentPole || 'accueil';
    return checkTabAccess(tabId, activePole);
  };

  const getPoleIcon = (poleId, size = 12) => {
    switch (poleId) {
      case 'accueil':
        return <XiloHome size={size} />;
      case 'mon-espace':
        return <XiloUser size={size} />;

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

  const renderAppLauncher = (isMobile = false) => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const apps = [
      {
        key: 'vitrine',
        url: getVitrineUrl(urls, associationData),
        img: '/ecosystem/logo-mostrador.png',
        label: 'Vitrine (Site Public)'
      },
      {
        key: 'sequenciador',
        url: isLocal ? 'http://localhost:5174' : 'https://sequenciador.o-girador.com',
        img: '/ecosystem/favicon.svg',
        label: 'O Girador Séquenceur'
      },
      {
        key: 'dancador',
        url: isLocal ? 'http://localhost:5175' : 'https://dancador.o-girador.com',
        img: '/ecosystem/dancador-logo.png',
        label: 'O Girador Dançador'
      },
      {
        key: 'hub',
        url: isLocal ? 'http://localhost:5176' : 'https://o-girador.com',
        img: '/ecosystem/hub-logo.png',
        label: 'Hub Orchestrador'
      }
    ];

    const handleLaunchApp = async (e, app) => {
      e.preventDefault();
      if (launchingAppKey) return;

      // Vitrine publique ou non connecté : ouverture directe
      if (app.key === 'vitrine' || !auth.currentUser) {
        window.open(app.url, '_blank', 'noopener,noreferrer');
        return;
      }

      setLaunchingAppKey(app.key);
      // Pré-ouverture synchrone pour éviter le blocage pop-up du navigateur
      const newTab = window.open('', '_blank');

      try {
        const getSSOToken = httpsCallable(functions, 'getCrossAppAuthToken');
        const res = await getSSOToken();
        const customToken = res.data?.customToken;

        if (customToken) {
          const targetUrl = new URL(app.url);
          targetUrl.searchParams.set('ssoToken', customToken);
          if (newTab) {
            newTab.location.href = targetUrl.toString();
          } else {
            window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer');
          }
        } else {
          if (newTab) newTab.location.href = app.url;
          else window.open(app.url, '_blank', 'noopener,noreferrer');
        }
      } catch (error) {
        console.warn("[SSO Launcher] Erreur obtention token, fallback direct :", error);
        if (newTab) newTab.location.href = app.url;
        else window.open(app.url, '_blank', 'noopener,noreferrer');
      } finally {
        setLaunchingAppKey(null);
      }
    };

    return (
      <div className={`flex items-center ${isMobile ? 'gap-0.5 sm:gap-1' : 'gap-1.5'} justify-center flex-nowrap`}>
        {apps.map(app => {
          const isEnabled = ecosystemAccess[app.key] !== false;
          
          if (!isEnabled) {
            return (
              <div
                key={app.key}
                className={`${isMobile ? 'p-0.5 sm:p-1' : 'p-1.5'} border border-transparent rounded flex items-center justify-center grayscale opacity-50 cursor-not-allowed`}
                title="Module non activé. Découvrez-le sur le Hub O Girador !"
              >
                {app.isSvg ? (
                  <div className="text-cordel-master-dark">{app.icon}</div>
                ) : (
                  <img src={app.img} alt={app.label} className={`${isMobile ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6'} object-contain shrink-0`} />
                )}
              </div>
            );
          }

          const isLaunching = launchingAppKey === app.key;

          return (
            <a
              key={app.key}
              href={app.url}
              onClick={(e) => handleLaunchApp(e, app)}
              className={`${isMobile ? 'p-0.5 sm:p-1' : 'p-1.5'} border border-transparent rounded flex items-center justify-center transition-all cursor-pointer hover:scale-105 hover:bg-encre-noire/5 hover:border-cordel-wood ${app.isSvg ? 'hover:border-emerald-600 text-emerald-700 hover:bg-emerald-50' : ''} ${isLaunching ? 'opacity-50 pointer-events-none' : ''}`}
              title={app.label}
            >
              {isLaunching ? (
                <div className={`${isMobile ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6'} flex items-center justify-center`}>
                  <div className="w-3.5 h-3.5 border-2 border-cordel-master-dark border-t-transparent rounded-full animate-spin" />
                </div>
              ) : app.isSvg ? (
                <div>{app.icon}</div>
              ) : (
                <img src={app.img} alt={app.label} className={`${isMobile ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6'} object-contain shrink-0`} />
              )}
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen lg:h-screen w-full ${forceLight ? 'bg-cordel-bg-light' : 'bg-cordel-bg-dark'} ${isBirthdayMonth ? 'theme-birthday-month' : ''} flex lg:items-stretch lg:justify-stretch lg:p-0 p-4 md:p-6`}>
      {/* Responsive board container */}
      <div className="w-full h-screen lg:h-screen lg:max-w-none lg:border-none lg:rounded-none lg:shadow-none overflow-hidden flex flex-col lg:flex-row relative bg-cordel-bg-light text-encre-noire">
        
        {/* Top Header / Navbar for Mobile and Tablet (hidden on Desktop) */}
        <div className="lg:hidden w-full h-16 landscape:h-12 border-b-4 border-cordel-master-dark bg-cordel-bg-light flex items-center px-4 justify-between select-none shrink-0 z-[90]">
          <div className="flex items-center gap-3">
            <div 
              onClick={handleLogoClick}
              className={`flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all ${
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
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-[8px] uppercase tracking-widest text-cordel-master-dark/50">
                  O Girador
                </span>
                {associationName && (
                  <span className="font-black text-[10px] uppercase tracking-wider text-cordel-wood truncate max-w-[120px] -mt-0.5">
                    {associationName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSystemOrSuperAdminOrMestre && (
                <button
                  type="button"
                  onClick={onToggleBreakGlass}
                  className={`p-2 border-2 rounded transition-all cursor-pointer flex items-center justify-center ${
                    breakGlassActive 
                      ? 'bg-amber-400 border-encre-noire text-encre-noire animate-pulse shadow-xs' 
                      : 'border-dashed border-encre-noire/20 text-stone-600 hover:border-encre-noire'
                  }`}
                  title={breakGlassActive ? "Mode Intervention Actif (Cliquez pour désactiver)" : "Activer le Mode Intervention (Déverrouiller)"}
                >
                  <span className="text-sm">{breakGlassActive ? '🔓' : '🔒'}</span>
                </button>
              )}
              {renderAppLauncher(true)}
            </div>
          </div>

          {associationName && (
            <div className="hidden sm:flex flex-grow justify-center px-4 select-none pointer-events-none">
              <span className="font-black text-xs md:text-sm uppercase tracking-widest text-cordel-wood truncate max-w-[200px] md:max-w-xs">
                {associationName}
              </span>
            </div>
          )}

          {/* Online Presence Indicator Widget */}
          <div className="flex items-center gap-2">
            <OnlineStatusWidget onlineMembers={onlineMembers} onlineCount={onlineCount} isPresenceEnabled={isPresenceEnabled} />

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 border-2 border-dashed border-encre-noire/20 hover:border-encre-noire text-encre-noire rounded-md cursor-pointer flex items-center justify-center transition-colors"
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
              <div className="mt-2 mb-1">
                {renderAppLauncher(false)}
              </div>
              {associationName && (
                <span className="font-black text-xs uppercase tracking-wider text-cordel-wood mt-0.5 leading-tight text-center break-words max-w-[160px]">
                  {associationName}
                </span>
              )}

              {/* Online Presence Indicator Widget in Desktop Sidebar */}
              <div className="mt-2">
                <OnlineStatusWidget onlineMembers={onlineMembers} onlineCount={onlineCount} isPresenceEnabled={isPresenceEnabled} />
              </div>
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
                              if (onNavigateToPole) onNavigateToPole('mon-espace');
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
                        {item.label}
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
                              if (onNavigateToPole) onNavigateToPole('mon-espace');
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


            
            {isSystemOrSuperAdminOrMestre && (
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
                className="w-full py-1.5 text-center text-[8px] font-black uppercase tracking-widest bg-[#2d6a4f] text-white border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1 mt-1"
                title="Signaler un bug ou soumettre une idée"
              >
                💡 Feedback
              </button>
            )}
            
            <span className="text-[7.5px] font-black opacity-35 tracking-widest uppercase select-none mt-1">
              {import.meta.env.VITE_APP_VERSION || 'v1.0.1'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto cordel-bg p-5 sm:px-7 md:px-9 sm:py-6 md:py-8 flex flex-col justify-between">
          <div className="flex flex-col gap-5 w-full flex-1">
            
            {/* Break-Glass Active Warning Banner */}
            {breakGlassActive && isSystemOrSuperAdminOrMestre && (
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

            {/* Menu d'onglets horizontaux principaux du pôle courant (Rendu unique tout en haut) */}
            {(isSystemOrSuperAdminOrMestre || isAdministrativeUser) && visibleTabs.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none shrink-0">
                <div className="flex flex-wrap gap-2 items-center">
                  {visibleTabs.map((tab) => {
                    const isUnlocked = checkTabAccess(tab.id, activePoleObj?.id);
                    const isActive = currentTab === tab.id;
                    const isRestrictedTitle = t('common.accessRestricted') || "Accès restreint";

                    const translatedLabel = tab.labelKey ? t(`poles.${tab.labelKey}`) : null;
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
                  })}
                </div>
                <InfoPoleHelpButton currentPole={activePoleObj?.id || currentPole} currentTab={currentTab} />
              </div>
            )}

            <div className="w-full flex-1">
              <PresenceProvider value={{ onlineMembers, onlineCount, onlineUserIds, isPresenceEnabled }}>
                <InfoPoleBanner currentPole={activePoleObj?.id || currentPole} currentTab={currentTab} />
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
              © O Girador {associationName || 'Samambaia'}
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

                {/* Bouton Mode Intervention Mobile dans le Drawer */}
                {isSystemOrSuperAdminOrMestre && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleBreakGlass();
                      setIsDrawerOpen(false);
                    }}
                    className={`mt-2 w-full py-1.5 px-2 rounded-[6px_9px_5px_8px] text-[9px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#181716] ${
                      breakGlassActive
                        ? 'bg-amber-400 text-encre-noire border-encre-noire animate-pulse'
                        : 'bg-cordel-bg text-cordel-master-dark/85 border-cordel-master-dark/30 hover:border-encre-noire'
                    }`}
                  >
                    <span>{breakGlassActive ? '🔓 Mode Intervention Actif' : '🔒 Mode Intervention'}</span>
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
                                if (onNavigateToPole) onNavigateToPole('mon-espace');
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
                          {item.label}
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
                                if (onNavigateToPole) onNavigateToPole('mon-espace');
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
                    className="w-full py-1.5 text-center text-[9px] font-black uppercase tracking-widest bg-[#2d6a4f] text-white border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                  >
                    💡 Feedback
                  </button>
                )}

                <div className="flex justify-between items-center text-[8px] font-black opacity-30 mt-1">
                  <span>O GIRADOR</span>
                  <span>{import.meta.env.VITE_APP_VERSION || 'v1.0.1'}</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        profileData={profileData}
        associationName={associationName}
      />
    </div>
  );
}
