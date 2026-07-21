import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import WidgetMotMestre from './WidgetMotMestre';
import WidgetAnnonces from './WidgetAnnonces';
import WidgetAgenda from './WidgetAgenda';
import WidgetCommandes from './WidgetCommandes';
import WidgetForum from './WidgetForum';
import WidgetAnniversaires from './WidgetAnniversaires';
const WidgetDocuments = React.lazy(() => import('./WidgetDocuments'));
const WidgetTreasury = React.lazy(() => import('./WidgetTreasury'));
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloSettings, XiloCaixa, XiloBox, XiloPeople, XiloConsole, XiloMandacaru } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';

export default function Dashboard({ user, profileData, onNavigateToTrombi, onNavigateToView, onSignOut, installPromptAvailable, onTriggerInstall, permissionsMatrice }) {
  const { tRole } = useTerminologie();
  const { locale, toggleLanguage, t } = useTranslation();
  const [layout, setLayout] = useState(["motMestre", "annonces", "agenda", "commandes", "forum", "documents", "tresorerie", "anniversaires"]);
  const [sequenceurUrl, setSequenceurUrl] = useState('');
  const [agendaFocusMode, setAgendaFocusMode] = useState(false);
  const [selectedEventForAgenda, setSelectedEventForAgenda] = useState(null);

  const isSystemOrSuperAdminOrMestre = profileData?.isSystemAdmin || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  const userTags = profileData?.tags || [];

  const hasAccessTroupe = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.troupe?.includes(t));
  const hasAccessLogistique = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.logistique?.includes(t));

  const getWidgetSpan = (id) => {
    switch (id) {
      case 'motMestre':
      case 'annonces':
      case 'documents':
        return 'col-span-1 md:col-span-2 lg:col-span-3 w-full max-w-full overflow-hidden';
      case 'agenda':
        return 'col-span-1 md:col-span-2 lg:col-span-3 w-full max-w-full overflow-hidden';
      default:
        return 'col-span-1 w-full max-w-full overflow-hidden';
    }
  };

  // Real-time synchronization of the pupil widgets display order and motDuMestre
  const [motDuMestre, setMotDuMestre] = useState('');
  const [hasActiveAnnouncements, setHasActiveAnnouncements] = useState(false);
  const [hasOpenCampaign, setHasOpenCampaign] = useState(false);

  useEffect(() => {
    if (!profileData?.groupId) return;

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.layoutEleves) && data.layoutEleves.length > 0) {
          const activeLayout = [...data.layoutEleves];
          if (!activeLayout.includes("tresorerie")) {
            activeLayout.push("tresorerie");
          }
          if (!activeLayout.includes("anniversaires")) {
            activeLayout.push("anniversaires");
          }
          setLayout(activeLayout);
        }
        setSequenceurUrl(data.sequenceurUrl || '');
        setMotDuMestre(data.motDuMestre || '');
      }
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot association :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  // Real-time check for active announcements targeting the user
  useEffect(() => {
    if (!profileData?.groupId) return;
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, where('groupId', '==', profileData.groupId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      const userTags = profileData?.tags || [];
      const userRole = profileData?.role || 'membre';
      const visible = fetched.filter(ann => {
        if (ann.publishOnApp === false) return false;
        if (!Array.isArray(ann.cibles) || ann.cibles.length === 0) return true;
        if (ann.cibles.includes('Tous')) return true;
        if (ann.cibles.includes('role:admin') && (userRole === 'mestre' || userRole === 'super-admin' || profileData?.isSystemAdmin === true)) {
          return true;
        }
        return ann.cibles.some(t => userTags.includes(t));
      });
      setHasActiveAnnouncements(visible.length > 0);
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot announcements :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, profileData?.tags, profileData?.role, profileData?.isSystemAdmin]);

  // Real-time check for active campaigns (open orders)
  useEffect(() => {
    if (!profileData?.groupId) return;
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('groupId', '==', profileData.groupId), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setHasOpenCampaign(!querySnapshot.empty);
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot campaigns :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  if (agendaFocusMode) {
    return (
      <div className="flex flex-col gap-4 text-left max-w-4xl mx-auto w-full select-none min-h-screen justify-center items-stretch py-4 px-1">
        <WidgetAgenda 
          role={profileData?.role} 
          isSystemAdmin={profileData?.isSystemAdmin} 
          groupId={profileData?.groupId} 
          user={user} 
          profileData={profileData} 
          onFocusModeChange={(isFocused) => {
            setAgendaFocusMode(isFocused);
            if (!isFocused) setSelectedEventForAgenda(null);
          }}
          onNavigateToView={onNavigateToView}
          selectedEvent={selectedEventForAgenda}
          setSelectedEvent={setSelectedEventForAgenda}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden">

      {/* Header Panel */}
      <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
        {/* Toggle Language Button in Header */}
        <button 
          type="button"
          onClick={toggleLanguage}
          className="theme-btn px-2 py-1 text-[11px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer flex items-center justify-center gap-1 min-w-[36px] min-h-7"
          title={locale === 'fr' ? "Mudar para Português (Brasil)" : "Changer en Français"}
        >
          <span className={locale === 'fr' ? 'font-black text-cordel-wood' : 'opacity-40'}>FR</span>
          <span className="opacity-20">/</span>
          <span className={locale === 'pt' ? 'font-black text-cordel-wood' : 'opacity-40'}>BR</span>
        </button>
        
        <div className="text-center flex-1">
          <h1 className="panel-title text-3xl font-extrabold tracking-wider text-cordel-wood">
            O GIRADOR
          </h1>
          <p className="text-sm font-semibold tracking-widest opacity-80 mt-1 uppercase">
            {t('dashboard.title')}
          </p>
        </div>
        

      </div>


      {/* Welcome & Tags Section */}
      <div className="text-left select-none pb-1 mt-1 border-b border-dashed border-cordel-master-dark/15">
        <h2 className="text-lg font-black text-cordel-wood flex items-center gap-1.5">
          <XiloMandacaru size={20} className="text-cordel-wood shrink-0" />
          <span>
            {t('dashboard.welcome') || "Axé"}, {profileData?.prenom || tRole('batuqueiro', profileData?.genre)} !
          </span>
        </h2>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Role badge */}
          <span className="theme-stamp-badge theme-stamp-badge-wood rotate-[-1.5deg] text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 select-none">
            🏆 {tRole(profileData?.role || 'membre', profileData?.genre)}
          </span>
          
          {/* Instrument badges */}
          {(() => {
            const userInstruments = profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0
              ? profileData.instrumentsJoues
              : [profileData?.instrument].filter(Boolean);
              
            return userInstruments.map((inst) => (
              <span 
                key={inst} 
                className="inline-block text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2 py-0.5 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] select-none"
              >
                🎵 {inst}
              </span>
            ));
          })()}
        </div>
      </div>

      {/* Clickable User Information Card */}
      <div 
        onClick={() => onNavigateToView('profil')}
        className="cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
        title="Modifier mon profil / Paramètres"
      >
        <CordelCard variant="default" useExtremeBorder={true} className="py-3 px-4">
          <div className="flex items-center gap-3 text-left">
            {(profileData?.photoURL || user?.photoURL) && (
              <img 
                src={profileData.photoURL || user.photoURL} 
                alt={`${profileData?.prenom} ${profileData?.nom}`} 
                className="w-10 h-10 rounded-[8px_4px_7px_6px] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] object-cover grayscale contrast-[130%] sepia-[40%] mix-blend-multiply brightness-[95%] select-none pointer-events-none"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-encre-noire truncate flex items-center gap-1.5 flex-wrap">
                <span>{profileData?.prenom} {profileData?.nom}</span>
                {profileData?.paymentStatus === 'paid' && (
                  <span className="theme-stamp-badge theme-stamp-badge-wood bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border-green-700/35 uppercase text-[7px] font-black tracking-wider px-1.5 py-0.2 shrink-0 scale-90 rotate-[-1deg]">
                    Payé
                  </span>
                )}
                {profileData?.paymentStatus === 'exempted' && (
                  <span className="theme-stamp-badge theme-stamp-badge-wood bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border-blue-700/35 uppercase text-[7px] font-black tracking-wider px-1.5 py-0.2 shrink-0 scale-90 rotate-[-1deg]">
                    Exonéré
                  </span>
                )}
              </h3>
              <p className="text-[9px] font-semibold text-cordel-master-dark/70 break-all select-all">
                {profileData?.email}
              </p>
            </div>
          </div>
        </CordelCard>
      </div>

      {/* Navigation to Trombinoscope */}
      <div className="flex flex-col gap-2 -mt-2">
        {installPromptAvailable && (
          <button
            type="button"
            onClick={onTriggerInstall}
            className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2 bg-[#84967a] text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-xs mb-1"
          >
            📱 {t('dashboard.installApp')}
          </button>
        )}

        <CordelButton 
          variant="ocre" 
          useExtremeBorder={true}
          onClick={onNavigateToTrombi} 
          className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2"
        >
          <XiloPeople size={14} />
          {t('dashboard.seeTrombi')}
        </CordelButton>

        {sequenceurUrl && (
          <a 
            href={sequenceurUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2 bg-[#d99f4d] text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-center text-xs"
          >
            <XiloConsole size={14} />
            {t('dashboard.sequencer')}
          </a>
        )}


      </div>

      {/* Widgets Grid (Dynamically Ordered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full overflow-hidden">
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
                  user={user}
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
                  onFocusModeChange={(isFocused) => setAgendaFocusMode(isFocused)}
                  onNavigateToView={onNavigateToView}
                  selectedEvent={selectedEventForAgenda}
                  setSelectedEvent={setSelectedEventForAgenda}
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
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Varal...</div>}>
                  <WidgetDocuments 
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    groupId={profileData?.groupId} 
                  />
                </React.Suspense>
              );
              break;
            case 'tresorerie':
              widgetContent = (
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement de la Trésorerie...</div>}>
                  <WidgetTreasury 
                    groupId={profileData?.groupId} 
                    profileData={profileData} 
                  />
                </React.Suspense>
              );
              break;
            case 'anniversaires':
              widgetContent = (
                <WidgetAnniversaires 
                  groupId={profileData?.groupId} 
                />
              );
              break;
            default:
              return null;
          }

          // Conditional hiding for non-administrators
          if (widgetId === 'tresorerie') {
            const status = profileData?.paymentStatus || 'unpaid';
            const isReturnFromPayment = typeof window !== 'undefined' && window.location.search.includes('payment=success');
            if ((status === 'paid' || status === 'exempted') && !isReturnFromPayment) {
              return null;
            }
          }

          if (!isSystemOrSuperAdminOrMestre) {
            if (widgetId === 'motMestre' && (!motDuMestre || !motDuMestre.trim())) {
              return null;
            }
            if (widgetId === 'annonces' && !hasActiveAnnouncements) {
              return null;
            }
            if (widgetId === 'commandes' && !hasOpenCampaign) {
              return null;
            }
          }

          if (!widgetContent) return null;

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
