import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { lazyWithRetry } from '../utils/pwaUtils';
import WidgetMotMestre from './WidgetMotMestre';
import WidgetAnnonces from './WidgetAnnonces';
const WidgetAgenda = lazyWithRetry(() => import('./WidgetAgenda'));
import WidgetForum from './WidgetForum';
import DashboardBirthdaysOrdersDuo from './dashboard/DashboardBirthdaysOrdersDuo';
import WidgetValidations from './dashboard/WidgetValidations';
import WidgetVideoALaUne from './dashboard/WidgetVideoALaUne';
import { extractYouTubeVideoId } from './common/LiteYouTubeEmbed';
const WidgetDocuments = lazyWithRetry(() => import('./WidgetDocuments'));
const WidgetTreasury = lazyWithRetry(() => import('./WidgetTreasury'));
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';
import InstrumentReminderBanner from './dashboard/InstrumentReminderBanner';
import NotificationBanner from './dashboard/NotificationBanner';
import DashboardProfileHeader from './dashboard/DashboardProfileHeader';
import PushActivationModal from './dashboard/PushActivationModal';
import PushTutorialModal from './dashboard/PushTutorialModal';
import { usePresenceContext } from '../context/PresenceContext';
import { canPublishAnnonces } from '../utils/permissionUtils';
import { resolveEffectiveUserTags } from '../utils/tagUtils';
import HeaderBrandTitle from './common/HeaderBrandTitle';
import { useViewSimulator } from '../context/ViewSimulatorContext';
import { 
  getCachedDashboardItem, 
  setCachedDashboardItem, 
  getCachedDashboardLayout, 
  setCachedDashboardLayout 
} from '../utils/dashboardCacheUtils';
import { isAnnouncementVisibleForUser } from '../utils/announcementUtils';

export default function Dashboard({ 
  user, 
  profileData, 
  onNavigateToTrombi: _onNavigateToTrombi, 
  onNavigateToView, 
  onSignOut: _onSignOut, 
  installPromptAvailable, 
  onTriggerInstall, 
  permissionsMatrice: _permissionsMatrice,
  breakGlassActive = false,
  tagsDisponibles = []
}) {
  const { tRole } = useTerminologie();
  const { t } = useTranslation();
  const { isPresenceEnabled } = usePresenceContext();

  // Consommation du simulateur de vue
  const { isSimulating, effectiveProfile, effectiveUserTags: simTags } = useViewSimulator();
  const currentProfile = isSimulating && effectiveProfile ? effectiveProfile : profileData;

  // Détection des rôles privilégiés (Système, Super-Admin ou Mestre - neutralisé en simulation)
  const isSystemOrSuperAdminOrMestre = Boolean(
    !isSimulating && (
      currentProfile?.isSystemAdmin || 
      currentProfile?.role === 'super-admin' || 
      currentProfile?.role === 'mestre'
    )
  );

  // Résolution des étiquettes effectives et calcul des droits de publication au Mégaphone (Annonces)
  const effectiveUserTags = useMemo(() => {
    if (isSimulating && simTags && simTags.length > 0) return simTags;
    return resolveEffectiveUserTags(currentProfile?.tags || [], tagsDisponibles);
  }, [isSimulating, simTags, currentProfile?.tags, tagsDisponibles]);

  const canUserPublishAnnonces = useMemo(() => {
    return canPublishAnnonces(currentProfile, _permissionsMatrice, effectiveUserTags, breakGlassActive);
  }, [currentProfile, _permissionsMatrice, effectiveUserTags, breakGlassActive]);

  const defaultLayout = useMemo(() => ["motMestre", "annonces", "agenda", "commandes", "forum", "documents", "tresorerie", "anniversaires"], []);
  const [layout, setLayout] = useState(() => getCachedDashboardLayout(profileData?.groupId, defaultLayout));
  const [agendaFocusMode, setAgendaFocusMode] = useState(false);
  const [selectedEventForAgenda, setSelectedEventForAgenda] = useState(null);

  const handleOpenEvent = (event) => {
    setAgendaFocusMode(true);
    setSelectedEventForAgenda(event);
  };

  const getWidgetSpan = (id) => {
    switch (id) {
      case 'motMestre':
      case 'annonces':
      case 'videoALaUne':
      case 'documents':
      case 'agenda':
      case 'forum':
      case 'anniversaires':
      case 'commandes':
        return 'col-span-1 md:col-span-2 lg:col-span-3 w-full max-w-full';
      default:
        return 'col-span-1 w-full max-w-full';
    }
  };

  // Synchronisation en temps réel de l'ordre d'affichage des widgets élèves, de motDuMestre et de la vidéo à la une
  const [motDuMestre, setMotDuMestre] = useState(() => getCachedDashboardItem(profileData?.groupId, 'mot_du_mestre', ''));
  const [videoALaUne, setVideoALaUne] = useState(() => getCachedDashboardItem(profileData?.groupId, 'video_a_la_une', null));
  const [hasActiveAnnouncements, setHasActiveAnnouncements] = useState(() => getCachedDashboardItem(profileData?.groupId, 'has_active_announcements', false));
  const [hasOpenCampaign, setHasOpenCampaign] = useState(() => getCachedDashboardItem(profileData?.groupId, 'has_open_campaign', false));

  useEffect(() => {
    if (!profileData?.groupId) return;

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const bPosition = data.birthdayWidgetPosition || 'bottom';
        
        let baseLayout = ["motMestre", "annonces", "agenda", "commandes", "forum", "documents", "tresorerie"];
        if (Array.isArray(data.layoutEleves) && data.layoutEleves.length > 0) {
          baseLayout = data.layoutEleves.filter(id => id !== "anniversaires");
        }
        if (!baseLayout.includes("tresorerie")) {
          baseLayout.push("tresorerie");
        }

        // Insertion dynamique du widget "anniversaires" selon le paramètre birthdayWidgetPosition ('top' ou 'bottom')
        const activeLayout = [...baseLayout];
        if (bPosition === 'top') {
          let insertIndex = 0;
          const annoncesIdx = activeLayout.indexOf("annonces");
          const motMestreIdx = activeLayout.indexOf("motMestre");
          if (annoncesIdx !== -1) {
            insertIndex = annoncesIdx + 1;
          } else if (motMestreIdx !== -1) {
            insertIndex = motMestreIdx + 1;
          }
          activeLayout.splice(insertIndex, 0, "anniversaires");
        } else {
          activeLayout.push("anniversaires");
        }

        // Insertion prioritaire de la "vidéo à la une" si active et valide (ou pour les administrateurs/Mestres)
        const isVideoActive = data.videoALaUne?.active === true && Boolean(extractYouTubeVideoId(data.videoALaUne?.url));
        const shouldShowVideoWidget = isVideoActive || isSystemOrSuperAdminOrMestre;
        if (shouldShowVideoWidget && !activeLayout.includes("videoALaUne")) {
          let videoIndex = 0;
          const annoncesIdx = activeLayout.indexOf("annonces");
          const motMestreIdx = activeLayout.indexOf("motMestre");
          const agendaIdx = activeLayout.indexOf("agenda");
          if (annoncesIdx !== -1) {
            videoIndex = annoncesIdx + 1;
          } else if (motMestreIdx !== -1) {
            videoIndex = motMestreIdx + 1;
          } else if (agendaIdx !== -1) {
            videoIndex = agendaIdx;
          }
          activeLayout.splice(videoIndex, 0, "videoALaUne");
        } else if (!shouldShowVideoWidget) {
          const vIdx = activeLayout.indexOf("videoALaUne");
          if (vIdx !== -1) activeLayout.splice(vIdx, 1);
        }

        setLayout(activeLayout);
        setCachedDashboardLayout(profileData?.groupId, activeLayout);
        const m = data.motDuMestre || '';
        setMotDuMestre(m);
        setCachedDashboardItem(profileData?.groupId, 'mot_du_mestre', m);
        const v = data.videoALaUne || null;
        setVideoALaUne(v);
        setCachedDashboardItem(profileData?.groupId, 'video_a_la_une', v);
      }
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot association :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, isSystemOrSuperAdminOrMestre]);


  // Real-time vérifier for active announcements targeting the user
  useEffect(() => {
    if (!profileData?.groupId) return;
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, where('groupId', '==', profileData.groupId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      const userRole = currentProfile?.role || 'membre';
      const visible = fetched.filter((ann) => isAnnouncementVisibleForUser({
        announcement: ann,
        userId: user?.uid,
        userTags: effectiveUserTags,
        userRole,
        isSystemAdmin: currentProfile?.isSystemAdmin === true,
        canPublish: canUserPublishAnnonces
      }));
      const hasActive = visible.length > 0;
      setHasActiveAnnouncements(hasActive);
      setCachedDashboardItem(profileData?.groupId, 'has_active_announcements', hasActive);
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot announcements :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, effectiveUserTags, currentProfile?.role, currentProfile?.isSystemAdmin, user?.uid, canUserPublishAnnonces]);

  // Real-time vérifier for active campaigns (open orders)
  useEffect(() => {
    if (!profileData?.groupId) return;
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('groupId', '==', profileData.groupId), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const isOpen = !querySnapshot.empty;
      setHasOpenCampaign(isOpen);
      setCachedDashboardItem(profileData?.groupId, 'has_open_campaign', isOpen);
    }, (error) => {
      console.error("Dashboard - Erreur onSnapshot campaigns :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  if (agendaFocusMode) {
    return (
      <div className="flex flex-col gap-4 text-left max-w-4xl mx-auto w-full select-none min-h-screen justify-center items-stretch py-4 px-1">
        <React.Suspense fallback={
          <div className="flex-1 flex flex-col justify-center items-center py-12">
            <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
            <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
              Chargement de l'Agenda...
            </span>
          </div>
        }>
          <WidgetAgenda 
            role={profileData?.role} 
            isSystemAdmin={profileData?.isSystemAdmin} 
            groupId={profileData?.groupId} 
            user={user} 
            profileData={profileData} 
            isDashboard={true}
            onFocusModeChange={(isFocused) => {
              setAgendaFocusMode(isFocused);
              if (!isFocused) setSelectedEventForAgenda(null);
            }}
            onNavigateToView={onNavigateToView}
            selectedEvent={selectedEventForAgenda}
            setSelectedEvent={setSelectedEventForAgenda}
          />
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-full pt-1.5 md:pt-0">

      {/* Header Panel Mobile (sur grand écran, fusionné dans l'en-tête universel de LayoutShell) */}
      <div className="lg:hidden flex justify-center items-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
        <HeaderBrandTitle titleSize="text-2xl sm:text-3xl" />
      </div>

      {/* Bannière discrète d'activation Push en 1 clic et resynchronisation automatique du jeton */}
      <NotificationBanner user={user} profileData={currentProfile} />

      {/* En-tête de bienvenue et carte de profil intégrant les badges dédupliqués */}
      <DashboardProfileHeader
        user={user}
        profileData={profileData}
        t={t}
        tRole={tRole}
        isPresenceEnabled={isPresenceEnabled}
        onNavigateToView={onNavigateToView}
      />

      {/* Bannière Cordel d'invitation aux vœux post-cours d'essai */}
      {Boolean(
        profileData?.isNew === false &&
        (profileData?.pratiquePercussion !== false) &&
        (!profileData?.instrument || profileData.instrument === 'En attente' || profileData.instrumentPrincipal === 'En attente') &&
        (!profileData?.voeuPrincipal && (!Array.isArray(profileData?.voeuxInstruments) || profileData.voeuxInstruments.filter(Boolean).length === 0))
      ) && (
        <InstrumentReminderBanner onNavigateToView={onNavigateToView} />
      )}

      {/* Bouton d'installation PWA si disponible */}
      {installPromptAvailable && (
        <div className="flex flex-col gap-2 -mt-2 mb-1">
          <button
            type="button"
            onClick={onTriggerInstall}
            className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2 bg-[#84967a] text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-xs"
          >
            📱 {t('dashboard.installApp')}
          </button>
        </div>
      )}

      <WidgetValidations 
        groupId={profileData?.groupId} 
        user={user} 
        onOpenEvent={handleOpenEvent} 
      />

      {/* Widgets Grid (Dynamically Ordered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full p-1 overflow-visible">
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
                  onNavigateToView={onNavigateToView}
                />
              );
              break;
            case 'annonces':
              widgetContent = (
                <WidgetAnnonces 
                  groupId={profileData?.groupId} 
                  profileData={currentProfile}
                  role={currentProfile?.role} 
                  isSystemAdmin={currentProfile?.isSystemAdmin} 
                  user={user}
                  onNavigateToView={onNavigateToView}
                  permissionsMatrice={_permissionsMatrice}
                  canPublish={canUserPublishAnnonces}
                  breakGlassActive={breakGlassActive}
                  userTags={effectiveUserTags}
                  installPromptAvailable={installPromptAvailable}
                  onTriggerInstall={onTriggerInstall}
                />
              );
              break;
            case 'agenda':
              widgetContent = (
                <React.Suspense fallback={
                  <div className="bg-cordel-master-dark/5 border-2 border-dashed border-cordel-master-dark/15 rounded-[8px_12px_9px_11px] p-4 min-h-[380px] animate-pulse flex flex-col justify-between select-none" aria-busy="true">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cordel-master-dark/15 rounded-md shrink-0" />
                      <div className="h-4 bg-cordel-master-dark/15 rounded w-1/3" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 my-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-28 bg-cordel-master-dark/10 rounded" />
                      ))}
                    </div>
                    <div className="h-3 bg-cordel-master-dark/15 rounded w-1/4" />
                  </div>
                }>
                  <WidgetAgenda 
                    role={currentProfile?.role} 
                    isSystemAdmin={currentProfile?.isSystemAdmin} 
                    groupId={currentProfile?.groupId} 
                    user={user} 
                    profileData={currentProfile} 
                    isDashboard={true}
                    onFocusModeChange={(isFocused) => setAgendaFocusMode(isFocused)}
                    onNavigateToView={onNavigateToView}
                    selectedEvent={selectedEventForAgenda}
                    setSelectedEvent={setSelectedEventForAgenda}
                  />
                </React.Suspense>
              );
              break;
            case 'videoALaUne':
              widgetContent = (
                <WidgetVideoALaUne 
                  videoALaUne={videoALaUne} 
                  groupId={currentProfile?.groupId}
                  isAuthorized={isSystemOrSuperAdminOrMestre}
                />
              );
              break;
            case 'commandes':
              if (layout.includes('anniversaires')) return null;
              if (!hasOpenCampaign) break;
              widgetContent = (
                <DashboardBirthdaysOrdersDuo
                  groupId={profileData?.groupId}
                  user={user}
                  profileData={profileData}
                  currentProfile={currentProfile}
                  hasOpenCampaign={hasOpenCampaign}
                  showBirthdaysInLayout={false}
                  showOrdersInLayout={true}
                  onNavigateToView={onNavigateToView}
                />
              );
              break;
            case 'forum':
              widgetContent = (
                <WidgetForum 
                  groupId={currentProfile?.groupId} 
                  profileData={currentProfile}
                  breakGlassActive={breakGlassActive}
                  tagsDisponibles={tagsDisponibles}
                  onOpen={(target) => {
                    if (target && typeof target === 'object') {
                      onNavigateToView('forum', target);
                    } else {
                      onNavigateToView('forum', target ? { threadId: target } : null);
                    }
                  }} 
                />
              );
              break;
            case 'documents':
              widgetContent = (
                <React.Suspense fallback={
                  <div className="bg-cordel-master-dark/5 border-2 border-dashed border-cordel-master-dark/15 rounded-[8px_12px_9px_11px] p-4 min-h-[160px] animate-pulse flex flex-col justify-between select-none" aria-busy="true">
                    <div className="h-4 bg-cordel-master-dark/15 rounded w-1/4" />
                    <div className="h-16 bg-cordel-master-dark/10 rounded my-2" />
                    <div className="h-3 bg-cordel-master-dark/15 rounded w-1/3" />
                  </div>
                }>
                  <WidgetDocuments 
                    role={currentProfile?.role} 
                    isSystemAdmin={currentProfile?.isSystemAdmin} 
                    groupId={currentProfile?.groupId} 
                    user={user}
                    profileData={currentProfile}
                  />
                </React.Suspense>
              );
              break;
            case 'tresorerie':
              widgetContent = (
                <React.Suspense fallback={
                  <div className="bg-cordel-master-dark/5 border-2 border-dashed border-cordel-master-dark/15 rounded-[8px_12px_9px_11px] p-4 min-h-[120px] animate-pulse flex flex-col justify-between select-none" aria-busy="true">
                    <div className="h-4 bg-cordel-master-dark/15 rounded w-1/3" />
                    <div className="h-10 bg-cordel-master-dark/10 rounded my-2" />
                  </div>
                }>
                  <WidgetTreasury 
                    groupId={currentProfile?.groupId} 
                    profileData={currentProfile} 
                    user={user}
                  />
                </React.Suspense>
              );
              break;
            case 'anniversaires':
              widgetContent = (
                <DashboardBirthdaysOrdersDuo
                  groupId={profileData?.groupId}
                  user={user}
                  profileData={profileData}
                  currentProfile={currentProfile}
                  hasOpenCampaign={hasOpenCampaign}
                  showBirthdaysInLayout={true}
                  showOrdersInLayout={layout.includes('commandes')}
                  onNavigateToView={onNavigateToView}
                />
              );
              break;
            default:
              return null;
          }

          // Masquage strict du widget trésorerie/cotisation si le membre est à jour ou exonéré
          if (widgetId === 'tresorerie') {
            const status = profileData?.paymentStatus || 'unpaid';
            const isExonere = 
              status === 'exempted' || 
              status === 'exempt' || 
              profileData?.isCotisationExoneree === true || 
              profileData?.cotisationStatus === 'exonere' || 
              (Array.isArray(profileData?.tags) && profileData.tags.some(t => typeof t === 'string' && t.toLowerCase().includes('exon')));
            const isAJour = status === 'paid';
            const isReturnFromPayment = typeof window !== 'undefined' && window.location.search.includes('payment=success');
            if ((isAJour || isExonere) && !isReturnFromPayment) {
              return null;
            }
          }

          if (!isSystemOrSuperAdminOrMestre) {
            if (widgetId === 'motMestre' && (!motDuMestre || !motDuMestre.trim())) {
              return null;
            }
            if (widgetId === 'annonces' && !hasActiveAnnouncements && !canUserPublishAnnonces) {
              return null;
            }
            if (widgetId === 'commandes' && !hasOpenCampaign) {
              return null;
            }
          }

          // Masquage strict de la vidéo à la une si inactive ou URL invalide pour les simples membres
          if (widgetId === 'videoALaUne' && !isSystemOrSuperAdminOrMestre && (!videoALaUne?.active || !extractYouTubeVideoId(videoALaUne?.url))) {
            return null;
          }

          if (!widgetContent) return null;

          return (
            <div key={widgetId} className={spanClass}>
              {widgetContent}
            </div>
          );
        })}
      </div>

      {/* Modale d'activation des notifications Push en 1 clic et tutoriel guidé */}
      <PushActivationModal user={user} profileData={profileData} />
      <PushTutorialModal />
    </div>
  );
}
