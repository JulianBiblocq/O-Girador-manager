import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import WidgetMotMestre from './WidgetMotMestre';
import WidgetAnnonces from './WidgetAnnonces';
import WidgetAgenda from './WidgetAgenda';
import WidgetCommandes from './WidgetCommandes';
import WidgetForum from './WidgetForum';
import WidgetDocuments from './WidgetDocuments';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloSun, XiloMoon } from './XiloIcons';
import { useTranslation } from './LanguageContext';

export default function Dashboard({ user, profileData, onNavigateToTrombi, onNavigateToView, onSignOut }) {
  const { locale, toggleLanguage, t } = useTranslation();
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [layout, setLayout] = useState(["motMestre", "annonces", "agenda", "commandes", "forum", "documents"]);
  const [sequenceurUrl, setSequenceurUrl] = useState('');

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const getWidgetSpan = (id) => {
    switch (id) {
      case 'motMestre':
      case 'annonces':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  // Real-time synchronization of the pupil widgets display order
  useEffect(() => {
    if (!profileData?.groupId) return;

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.layoutEleves) && data.layoutEleves.length > 0) {
          setLayout(data.layoutEleves);
        }
        setSequenceurUrl(data.sequenceurUrl || '');
      }
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot association :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  return (
    <div className="flex flex-col gap-4">
      {/* System Admin Button (Top Float) */}
      {profileData?.isSystemAdmin && (
        <div className="flex justify-end -mb-3">
          <button 
            onClick={() => onNavigateToView('system-admin')}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-wood text-cordel-bg-light px-3 py-1 border border-encre-noire rounded-[4px_7px_3px_5px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          >
            🛠️ Admin Système
          </button>
        </div>
      )}
      {/* Header Panel */}
      <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
        {/* Toggle Language Button in Header */}
        <button 
          type="button"
          onClick={toggleLanguage}
          className="theme-btn px-1.5 py-1 text-[11px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer flex items-center justify-center min-w-8 min-h-7"
          title={locale === 'fr' ? "Mudar para Português" : "Changer en Français"}
        >
          {locale === 'fr' ? "🇧🇷" : "🇫🇷"}
        </button>
        
        <div className="text-center flex-1">
          <h1 className="panel-title text-3xl font-extrabold tracking-wider text-cordel-wood">
            O GIRADOR
          </h1>
          <p className="text-sm font-semibold tracking-widest opacity-80 mt-1 uppercase">
            {t('dashboard.title')}
          </p>
        </div>
        
        {/* Toggle Dark Mode Button in Header */}
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="theme-btn px-2.5 py-1 text-xs font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer flex items-center justify-center min-w-8 min-h-7"
          title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
        >
          {darkMode ? <XiloSun size={14} /> : <XiloMoon size={14} />}
        </button>
      </div>


      {/* Clickable User Information Card */}
      <div 
        onClick={() => onNavigateToView('profil')}
        className="cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
        title="Modifier mon profil / Paramètres"
      >
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <div className="flex items-center gap-4 text-left">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={`${profileData?.prenom} ${profileData?.nom}`} 
                className="w-14 h-14 rounded-[12px_6px_10px_8px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] object-cover select-none pointer-events-none"
              />
            ) : (
              <div className="w-14 h-14 rounded-[12px_6px_10px_8px] border-2 border-encre-noire bg-cordel-wood flex items-center justify-center text-cordel-bg-light text-xl font-bold select-none">
                {profileData?.prenom ? profileData.prenom.charAt(0) : '?'}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h2 className="panel-title text-base font-extrabold text-cordel-wood truncate">
                {t('dashboard.welcome')}, {profileData?.prenom || 'Batuqueiro'} !
              </h2>
              <div className="flex flex-col items-start gap-1 mt-1">
                <span className="text-[9px] font-semibold text-cordel-master-dark/70 break-all select-all">
                  {profileData?.email}
                </span>
                
                {/* Slanted ink stamp style role badge */}
                <span className="theme-stamp-badge theme-stamp-badge-wood rotate-[-2deg] select-none">
                  {profileData?.role || 'membre'}
                </span>
              </div>
            </div>
          </div>
        </CordelCard>
      </div>

      {/* Navigation to Trombinoscope */}
      <div className="flex flex-col gap-2 -mt-2">
        <CordelButton 
          variant="ocre" 
          useExtremeBorder={true}
          onClick={onNavigateToTrombi} 
          className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2"
        >
          👥 {t('dashboard.seeTrombi')}
        </CordelButton>

        {sequenceurUrl && (
          <a 
            href={sequenceurUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2 bg-[#d99f4d] text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-center text-xs"
          >
            🎛️ Séquenceur de la Roda (Révisions)
          </a>
        )}

        {/* Layout Editor & Inventory Access Buttons (Visible to Mestres, Super-Admins & System Admins) */}
        {(profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin) && (
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={() => onNavigateToView('layout-editor')}
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border-2 border-dashed border-encre-noire/30 hover:border-encre-noire text-encre-noire py-1.5 w-full rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              ⚙️ {t('dashboard.layoutEditor')}
            </button>
            <button 
              type="button"
              onClick={() => onNavigateToView('inventory')}
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border-2 border-dashed border-encre-noire/30 hover:border-encre-noire text-encre-noire py-1.5 w-full rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              🥁 {t('dashboard.inventory')}
            </button>
            <button 
              type="button"
              onClick={() => onNavigateToView('orders-manager')}
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border-2 border-dashed border-encre-noire/30 hover:border-encre-noire text-encre-noire py-1.5 w-full rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              📦 {t('dashboard.ordersManager')}
            </button>
          </div>
        )}
      </div>

      {/* Widgets Grid (Dynamically Ordered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {layout.map((widgetId) => {
          const spanClass = getWidgetSpan(widgetId);
          
          let widgetContent = null;
          switch (widgetId) {
            case 'motMestre':
              widgetContent = (
                <WidgetMotMestre 
                  role={profileData?.role} 
                  isSystemAdmin={profileData?.isSystemAdmin} 
                  groupId={profileData?.groupId} 
                  profileData={profileData}
                />
              );
              break;
            case 'annonces':
              widgetContent = (
                <WidgetAnnonces 
                  groupId={profileData?.groupId} 
                  profileData={profileData}
                  role={profileData?.role} 
                  isSystemAdmin={profileData?.isSystemAdmin} 
                />
              );
              break;
            case 'agenda':
              widgetContent = (
                <WidgetAgenda 
                  role={profileData?.role} 
                  isSystemAdmin={profileData?.isSystemAdmin} 
                  groupId={profileData?.groupId} 
                  user={user} 
                  profileData={profileData} 
                />
              );
              break;
            case 'commandes':
              widgetContent = (
                <WidgetCommandes 
                  groupId={profileData?.groupId} 
                  user={user} 
                  profileData={profileData} 
                />
              );
              break;
            case 'forum':
              widgetContent = (
                <WidgetForum 
                  groupId={profileData?.groupId} 
                  onOpen={() => onNavigateToView('forum')} 
                />
              );
              break;
            case 'documents':
              widgetContent = (
                <WidgetDocuments 
                  role={profileData?.role} 
                  isSystemAdmin={profileData?.isSystemAdmin} 
                  groupId={profileData?.groupId} 
                />
              );
              break;
            default:
              return null;
          }

          return (
            <div key={widgetId} className={spanClass}>
              {widgetContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
