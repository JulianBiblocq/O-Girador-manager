import React, { useState } from 'react';
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
  XiloScroll,
  XiloCar,
  XiloCalendar,
  XiloHanger,
  XiloCaixa
} from './XiloIcons';
import { useTranslation } from './LanguageContext';

export default function LayoutShell({ 
  logoUrl, 
  associationName,
  sequenceurUrl, 
  currentPole, 
  onNavigateToPole,
  currentTab,
  onNavigateToTab,
  polesList = [],
  profileData, 
  onSignOut, 
  unreadPrivateMessagesCount = 0,
  forceLight = false,
  permissionsMatrice,
  children 
}) {
  const finalLogoUrl = logoUrl || '/Pictures/logo-samambaia.png';
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const isSystemOrSuperAdminOrMestre = profileData?.isSystemAdmin || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  const userTags = profileData?.tags || [];

  const hasAccessTroupe = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.troupe?.includes(t));
  const hasAccessLogistique = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.logistique?.includes(t));
  const hasAccessTresorerie = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.tresorerie?.includes(t));
  const hasAccessStudio = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.studio?.includes(t));
  const hasAccessVestiaire = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.vestiaire?.includes(t));
  const hasAccessMestre = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.mestre?.includes(t));

  const isAdministrativeUser = isSystemOrSuperAdminOrMestre || 
                               profileData?.role === 'bureau' || 
                               profileData?.role === 'ca' || 
                               hasAccessTroupe || 
                               hasAccessLogistique || 
                               hasAccessTresorerie || 
                               hasAccessStudio ||
                               hasAccessVestiaire ||
                               hasAccessMestre;

  const memberMenuItems = [
    { id: 'accueil', label: 'Accueil', icon: <XiloHome size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('accueil'); onNavigateToTab && onNavigateToTab('dashboard'); } },
    { id: 'profil', label: 'Mon profil', icon: <XiloUser size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('profil'); } },
    { id: 'agenda', label: 'Agenda', icon: <XiloCalendar size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('agenda'); } },
    { id: 'materiel', label: 'Mon matériel', icon: <XiloCaixa size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('materiel'); } },
    { id: 'vestiaire', label: 'Mon vestiaire', icon: <XiloHanger size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('vestiaire'); } },
    { id: 'trombinoscope', label: 'Trombinoscope', icon: <XiloPeople size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('trombinoscope'); } },
    { id: 'forum', label: 'Porte-voix', icon: <XiloMegaphone size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('mon-espace'); onNavigateToTab && onNavigateToTab('forum'); } },
    { id: 'varal', label: 'Varal (documents)', icon: <XiloScroll size={12} />, onClick: () => { onNavigateToPole && onNavigateToPole('accueil'); onNavigateToTab && onNavigateToTab('varal'); } }
  ];

  const hasAccessToPole = (poleId) => {
    switch (poleId) {
      case 'accueil':
      case 'mon-espace':
        return true;
      case 'troupe':
        return hasAccessTroupe;
      case 'tresorerie':
        return hasAccessTresorerie;
      case 'logistique':
        return hasAccessLogistique;
      case 'vestiaire':
        return hasAccessVestiaire;
      case 'studio':
        return hasAccessStudio;
      case 'mestre':
        return hasAccessMestre;
      case 'config':
        return isSystemOrSuperAdminOrMestre;
      default:
        return false;
    }
  };

  const hasAccessToTab = (tabId) => {
    // Individual tab overrides
    switch (tabId) {
      // Troupe tabs
      case 'export-annu':
      case 'tag-manager':
        return hasAccessTroupe;
      case 'system-admin':
      case 'instruments':
      case 'linked-instruments':
        return hasAccessTroupe;

      // Other sections inherit pole permissions
      default:
        return true;
    }
  };

  const getPoleIcon = (poleId, size = 12) => {
    switch (poleId) {
      case 'accueil':
        return <XiloHome size={size} />;
      case 'mon-espace':
        return <XiloUser size={size} />;
      case 'troupe':
        return <XiloPeople size={size} />;
      case 'tresorerie':
        return <XiloCoin size={size} />;
      case 'logistique':
        return <XiloBox size={size} />;
      case 'vestiaire':
        return <XiloHanger size={size} />;
      case 'studio':
        return <XiloMegaphone size={size} />;
      case 'mestre':
        return <XiloDrum size={size} />;
      case 'config':
        return <XiloSettings size={size} />;
      default:
        return <XiloHome size={size} />;
    }
  };

  const visiblePoles = polesList.filter(p => hasAccessToPole(p.id));
  const activePoleObj = polesList.find(p => p.id === currentPole);
  const visibleTabs = activePoleObj 
    ? activePoleObj.tabs.filter(tab => hasAccessToTab(tab.id))
    : [];

  return (
    <div className={`min-h-screen lg:h-screen w-full ${forceLight ? 'bg-cordel-bg-light' : 'bg-cordel-bg-dark'} flex lg:items-stretch lg:justify-stretch lg:p-0 p-4 md:p-6`}>
      {/* Responsive board container */}
      <div className="w-full h-screen lg:h-screen lg:max-w-none lg:border-none lg:rounded-none lg:shadow-none overflow-hidden flex flex-col lg:flex-row relative bg-cordel-bg-light text-encre-noire">
        
        {/* Top Header / Navbar for Mobile and Tablet (hidden on Desktop) */}
        <div className="lg:hidden w-full h-16 landscape:h-12 border-b-4 border-cordel-master-dark bg-cordel-bg-light flex items-center px-4 justify-between select-none shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigateToPole && onNavigateToPole('accueil')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              title={t('poles.accueil')}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo" 
                className="w-10 h-10 landscape:w-8 landscape:h-8 object-contain rounded-[4px] p-0.5 bg-white border border-encre-noire/25 pointer-events-none" 
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
            {sequenceurUrl && (
              <a 
                href={sequenceurUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 border border-dashed border-encre-noire/20 hover:border-[#d99f4d] text-[#d99f4d] hover:bg-[#d99f4d]/10 rounded flex items-center justify-center transition-all cursor-pointer"
                title="O Girador Séquenceur"
              >
                <XiloEQ size={14} />
              </a>
            )}
          </div>

          {associationName && (
            <div className="hidden sm:flex flex-grow justify-center px-4 select-none pointer-events-none">
              <span className="font-black text-xs md:text-sm uppercase tracking-widest text-cordel-wood truncate max-w-[200px] md:max-w-xs">
                {associationName}
              </span>
            </div>
          )}

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 border-2 border-dashed border-encre-noire/20 hover:border-encre-noire text-encre-noire rounded-md cursor-pointer flex items-center justify-center transition-colors"
            title="Ouvrir le menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Left Sidebar for Desktop (hidden on Mobile & Tablet) */}
        <div className="hidden lg:flex w-56 border-r-4 border-cordel-master-dark bg-cordel-bg-light flex-col items-center justify-between py-6 px-3 shrink-0 select-none">
          <div className="flex flex-col items-center gap-3 w-full flex-grow min-h-0">
            <div 
              onClick={() => onNavigateToPole && onNavigateToPole('accueil')}
              className="w-20 h-20 bg-white border-2 border-encre-noire rounded-full flex items-center justify-center p-2 shadow-[2px_2px_0px_0px_#181716] cursor-pointer hover:scale-[1.02] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shrink-0"
              title={t('poles.accueil')}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain pointer-events-none" 
              />
            </div>
            <div className="flex flex-col items-center justify-center text-center px-1 shrink-0 mt-1">
              <div className="flex items-center gap-2 justify-center">
                <span 
                  onClick={() => onNavigateToPole && onNavigateToPole('accueil')}
                  className="font-extrabold text-[9px] uppercase tracking-widest text-cordel-master-dark/50 cursor-pointer hover:opacity-85 transition-opacity"
                >
                  O Girador
                </span>
                {sequenceurUrl && (
                  <a 
                    href={sequenceurUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 border border-dashed border-encre-noire/20 hover:border-[#d99f4d] text-[#d99f4d] hover:bg-[#d99f4d]/10 rounded flex items-center justify-center transition-all cursor-pointer"
                    title="O Girador Séquenceur"
                  >
                    <XiloEQ size={10} />
                  </a>
                )}
              </div>
              {associationName && (
                <span className="font-black text-xs uppercase tracking-wider text-cordel-wood mt-0.5 leading-tight text-center break-words max-w-[160px]">
                  {associationName}
                </span>
              )}
            </div>
            
            <div className="w-full border-t border-dashed border-cordel-master-dark/20 my-2 shrink-0" />
            
            {/* Desktop Poles Navigation */}
            <div className="w-full flex-grow overflow-y-auto flex flex-col gap-2 pr-1 max-h-[calc(100vh-220px)] scrollbar-thin">
              {isAdministrativeUser ? (
                visiblePoles.map((pole) => {
                  const isActive = currentPole === pole.id;
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
                        <span className="w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0">
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
                        <span className="w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0">
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
                className={`w-full py-1.5 px-2 font-black uppercase tracking-widest text-center text-[8px] border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currentTab === 'system-admin' 
                    ? 'theme-bg-ocre text-encre-noire' 
                    : 'bg-neutral-850 text-encre-noire hover:bg-neutral-100 bg-white'
                }`}
              >
                <XiloConsole size={10} className="inline mr-1" /> {t('poles.tabSystemAdmin') || "Admin Système"}
              </button>
            )}

            {sequenceurUrl && (
              <a 
                href={sequenceurUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-1 font-extrabold flex items-center justify-center gap-1 bg-[#d99f4d] text-[#1a1a1a] border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-center text-[8px] uppercase tracking-wide cursor-pointer select-none"
              >
                <XiloEQ size={10} className="inline mr-1" /> O Girador Séquenceur
              </a>
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
            
            <span className="text-[7.5px] font-black opacity-35 tracking-widest uppercase select-none mt-1">
              {import.meta.env.VITE_APP_VERSION || 'v1.0.1'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto cordel-bg p-5 sm:p-6 md:p-8 flex flex-col justify-between">
          <div className="flex flex-col gap-5 w-full flex-1">
            
            {/* Top Horizontal Subcategories Menu */}
            {(isSystemOrSuperAdminOrMestre || isAdministrativeUser) && visibleTabs.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none shrink-0">
                {visibleTabs.map((tab) => {
                  const isActive = currentTab === tab.id;
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
                      {t(`poles.${tab.labelKey}`) || tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="w-full flex-1">
              {children}
            </div>
          </div>

          <div className="w-full flex justify-between items-center mt-8 border-t border-dashed border-cordel-master-dark/10 pt-2 select-none shrink-0">
            <span className="text-[8px] font-black uppercase tracking-wider opacity-20">
              © O Girador Manager
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-25 lg:hidden">
              {import.meta.env.VITE_APP_VERSION || 'v1.0.1'}
            </span>
          </div>
        </div>

        {/* Sliding Navigation Drawer (Mobile & Tablet overlay) */}
        {isDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
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
                <div className="w-16 h-16 bg-white border border-encre-noire rounded-full flex items-center justify-center p-1.5 shadow-[1.5px_1.5px_0px_0px_#181716]">
                  <img src={finalLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-extrabold text-[9px] uppercase tracking-widest text-cordel-master-dark/50">
                  O Girador
                </span>
                {associationName && (
                  <span className="font-black text-xs uppercase tracking-wider text-cordel-wood leading-tight text-center break-words max-w-[200px]">
                    {associationName}
                  </span>
                )}
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex flex-col gap-2.5 flex-grow overflow-y-auto pr-1">
                {isAdministrativeUser ? (
                  visiblePoles.map((pole) => {
                    const isActive = currentPole === pole.id;
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
                          <span className="w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0">
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
                          <span className="w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse shrink-0">
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
                    className={`w-full py-1.5 text-center text-[9px] font-black uppercase tracking-widest border border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      currentTab === 'system-admin' 
                        ? 'theme-bg-ocre text-encre-noire' 
                        : 'bg-neutral-850 text-encre-noire hover:bg-neutral-100 bg-white'
                    }`}
                  >
                    <XiloConsole size={12} className="inline mr-1" /> {t('poles.tabSystemAdmin') || "Admin Système"}
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

                <div className="flex justify-between items-center text-[8px] font-black opacity-30 mt-1">
                  <span>O GIRADOR</span>
                  <span>{import.meta.env.VITE_APP_VERSION || 'v1.0.1'}</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
