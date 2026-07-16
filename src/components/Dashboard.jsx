import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import WidgetMotMestre from './WidgetMotMestre';
import WidgetAgenda from './WidgetAgenda';
import WidgetForum from './WidgetForum';
import WidgetDocuments from './WidgetDocuments';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function Dashboard({ user, profileData, onNavigateToTrombi, onNavigateToView, onSignOut }) {
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [layout, setLayout] = useState(["motMestre", "agenda", "forum", "documents"]);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
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
        {/* Left spacer to center title */}
        <div className="w-10"></div>
        
        <div className="text-center flex-1">
          <h1 className="panel-title text-3xl font-extrabold tracking-wider text-cordel-wood">
            O GIRADOR
          </h1>
          <p className="text-sm font-semibold tracking-widest opacity-80 mt-1 uppercase">
            Tableau de bord
          </p>
        </div>
        
        {/* Toggle Dark Mode Button in Header */}
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="theme-btn px-2.5 py-1 text-xs font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer"
          title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
        >
          {darkMode ? '☀️' : '🌙'}
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
                Axé, {profileData?.prenom || 'Batuqueiro'} !
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
          👥 Voir le Trombinoscope
        </CordelButton>

        {/* Layout Editor Access Button (Visible to Mestres, Super-Admins & System Admins) */}
        {(profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin) && (
          <button 
            type="button"
            onClick={() => onNavigateToView('layout-editor')}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border-2 border-dashed border-encre-noire/30 hover:border-encre-noire text-encre-noire py-1.5 w-full rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            ⚙️ Organiser l'accueil (Mise en page)
          </button>
        )}
      </div>

      {/* 4 Widgets Stack (Dynamically Ordered) */}
      {layout.map((widgetId) => {
        switch (widgetId) {
          case 'motMestre':
            return (
              <WidgetMotMestre 
                key="motMestre"
                role={profileData?.role} 
                isSystemAdmin={profileData?.isSystemAdmin} 
                groupId={profileData?.groupId} 
              />
            );
          case 'agenda':
            return (
              <WidgetAgenda 
                key="agenda"
                role={profileData?.role} 
                isSystemAdmin={profileData?.isSystemAdmin} 
                groupId={profileData?.groupId} 
                user={user} 
                profileData={profileData} 
              />
            );
          case 'forum':
            return (
              <WidgetForum 
                key="forum"
                groupId={profileData?.groupId} 
                onOpen={() => onNavigateToView('forum')} 
              />
            );
          case 'documents':
            return (
              <WidgetDocuments 
                key="documents"
                role={profileData?.role} 
                isSystemAdmin={profileData?.isSystemAdmin} 
                groupId={profileData?.groupId} 
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
