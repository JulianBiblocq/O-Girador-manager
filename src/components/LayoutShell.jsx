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
  XiloEQ 
} from './XiloIcons';
import { useTranslation } from './LanguageContext';

export default function LayoutShell({ 
  logoUrl, 
  sequenceurUrl, 
  currentView, 
  onNavigateToView, 
  profileData, 
  onSignOut, 
  unreadPrivateMessagesCount = 0,
  children 
}) {
  const finalLogoUrl = logoUrl || '/Pictures/logo-samambaia.png';
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-cordel-bg-dark flex lg:items-center lg:justify-center lg:p-4 md:p-6 lg:p-8">
      {/* Responsive board container: split into sidebar/content on desktop (lg breakpoint >= 1024px) */}
      <div className="w-full h-screen lg:h-auto lg:min-h-[85vh] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl lg:border-8 lg:border-cordel-master-dark lg:rounded-[36px] lg:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row relative bg-cordel-bg-light text-encre-noire">
        
        {/* Top Header / Navbar for Mobile and Tablet (hidden on Desktop) */}
        <div className="lg:hidden w-full h-16 landscape:h-12 border-b-4 border-cordel-master-dark bg-cordel-bg-light flex items-center px-4 justify-between select-none shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigateToView && onNavigateToView('dashboard')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              title={t('menu.dashboard') || "Accueil"}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo" 
                className="w-10 h-10 landscape:w-8 landscape:h-8 object-contain rounded-[4px] p-0.5 bg-white border border-encre-noire/25 pointer-events-none" 
              />
              <span className="font-extrabold text-xs uppercase tracking-widest text-cordel-wood">
                O Girador
              </span>
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
        <div className="hidden lg:flex w-44 border-r-4 border-cordel-master-dark bg-cordel-bg-light flex-col items-center justify-between py-8 px-4 shrink-0 select-none">
          <div className="flex flex-col items-center gap-3 w-full">
            <div 
              onClick={() => onNavigateToView && onNavigateToView('dashboard')}
              className="w-24 h-24 bg-white border-2 border-encre-noire rounded-full flex items-center justify-center p-2 shadow-[2px_2px_0px_0px_#181716] cursor-pointer hover:scale-[1.02] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
              title={t('menu.dashboard') || "Accueil"}
            >
              <img 
                src={finalLogoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain pointer-events-none" 
              />
            </div>
            <div className="flex items-center gap-2 mt-2 justify-center">
              <span 
                onClick={() => onNavigateToView && onNavigateToView('dashboard')}
                className="font-black text-sm uppercase tracking-widest text-cordel-wood cursor-pointer hover:opacity-85 transition-opacity"
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
                  <XiloEQ size={12} />
                </a>
              )}
            </div>
            <div className="w-full border-t border-dashed border-cordel-master-dark/20 my-4" />
          </div>

          <div className="flex flex-col items-center gap-2.5 w-full">
            {sequenceurUrl && (
              <a 
                href={sequenceurUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-1 font-extrabold flex items-center justify-center gap-1.5 bg-[#d99f4d] text-[#1a1a1a] border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-center text-[9px] uppercase tracking-wide cursor-pointer select-none"
              >
                <XiloEQ size={12} className="inline mr-1" /> O Girador Séquenceur
              </a>
            )}
            <span className="text-[8px] font-black opacity-35 tracking-widest uppercase select-none">
              {import.meta.env.VITE_APP_VERSION || 'v1.0.1'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto cordel-bg p-5 sm:p-6 md:p-8 flex flex-col justify-between">
          <div className="flex flex-col gap-6 w-full flex-1">
            {children}
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
              <div className="flex flex-col items-center gap-3 mt-4 mb-6 pb-4 border-b border-dashed border-cordel-master-dark/20">
                <div className="w-16 h-16 bg-white border border-encre-noire rounded-full flex items-center justify-center p-1.5 shadow-[1.5px_1.5px_0px_0px_#181716]">
                  <img src={finalLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-cordel-wood">
                  O Girador
                </span>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
                {currentView !== 'dashboard' && (
                  <button
                    onClick={() => {
                      if (onNavigateToView) onNavigateToView('dashboard');
                      setIsDrawerOpen(false);
                    }}
                    className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                  >
                    <XiloHome size={14} /> {t('menu.dashboard') || "Accueil"}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (onNavigateToView) onNavigateToView('profil');
                    setIsDrawerOpen(false);
                  }}
                  className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                >
                  <XiloUser size={14} /> {t('menu.profile') || "Mon Profil"}
                </button>

                <button
                  onClick={() => {
                    if (onNavigateToView) onNavigateToView('trombinoscope');
                    setIsDrawerOpen(false);
                  }}
                  className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                >
                  <XiloPeople size={14} /> {t('menu.trombinoscope') || "Trombinoscope"}
                </button>

                <button
                  onClick={() => {
                    if (onNavigateToView) onNavigateToView('forum');
                    setIsDrawerOpen(false);
                  }}
                  className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center justify-between hover:bg-cordel-hover cursor-pointer w-full"
                >
                  <span className="flex items-center gap-2"><XiloMegaphone size={14} /> {t('menu.forum') || "Porte-Voix"}</span>
                  {unreadPrivateMessagesCount > 0 && (
                    <span className="w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse mr-1 shrink-0">
                      {unreadPrivateMessagesCount}
                    </span>
                  )}
                </button>

                {/* Admin/Mestre features */}
                {(profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin) && (
                  <>
                    <div className="border-t border-dashed border-cordel-master-dark/15 my-2" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-cordel-master-dark opacity-50 pl-1 mb-1 block">
                      {t('menu.adminHeader') || "Administration"}
                    </span>

                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView('association-settings');
                        setIsDrawerOpen(false);
                      }}
                      className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                    >
                      <XiloSettings size={14} /> {t('menu.settings') || "Configuration"}
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView('treasury');
                        setIsDrawerOpen(false);
                      }}
                      className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                    >
                      <XiloCoin size={14} /> {t('menu.treasury') || "Trésorerie"}
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView('orders-manager');
                        setIsDrawerOpen(false);
                      }}
                      className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                    >
                      <XiloBox size={14} /> {t('menu.orders') || "Commandes"}
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView('inventory');
                        setIsDrawerOpen(false);
                      }}
                      className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                    >
                      <XiloDrum size={14} /> {t('menu.inventory') || "Inventaire"}
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView('layout-editor');
                        setIsDrawerOpen(false);
                      }}
                      className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                    >
                      <XiloChisel size={14} /> {t('menu.layoutEditor') || "Mise en page"}
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateToView) onNavigateToView('tag-manager');
                        setIsDrawerOpen(false);
                      }}
                      className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer"
                    >
                      <XiloTag size={14} /> {t('menu.tags') || "Badges"}
                    </button>
                  </>
                )}

                {/* System Admin */}
                {profileData?.isSystemAdmin && (
                  <button
                    onClick={() => {
                      if (onNavigateToView) onNavigateToView('system-admin');
                      setIsDrawerOpen(false);
                    }}
                    className="theme-btn text-[10px] font-black uppercase tracking-wider py-2 px-3 text-left rounded-[4px_6px_3px_5px] flex items-center gap-2 hover:bg-cordel-hover cursor-pointer mt-1"
                  >
                    <XiloConsole size={14} /> {t('menu.systemAdmin') || "Admin Système"}
                  </button>
                )}
              </div>

              {/* Drawer Footer / Sequencer & Logout */}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-dashed border-cordel-master-dark/20 mt-auto select-none shrink-0">
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
