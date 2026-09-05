import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LayoutShell from './components/LayoutShell';
import { TerminologyProvider } from './components/TerminologyContext';
import { useTranslation } from './components/LanguageContext';
import ReloadPrompt from './components/ReloadPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import PublicHome from './components/PublicHome';
import PublicThemeProvider from './components/PublicThemeProvider';
import { tracker } from './utils/O-Girador-Tracker';

import { lazyWithRetry } from './utils/pwaUtils';
import { resolveEffectiveUserTags } from './utils/tagUtils';
import { getMigratedRoleAndTags } from './utils/roleMigration';
import { canEditVitrine, canAccessPole, canAccessTabPermission, canAccessMestre } from './utils/permissionUtils';
import PendingValidationScreen from './components/auth/PendingValidationScreen';
import { useTenantContext } from './context/TenantContext';
import TenantNotFound from './components/TenantNotFound';
import { DEFAULT_VARAL_CATEGORIES } from './hooks/useAssociationSettings';

const Onboarding = lazyWithRetry(() => import('./components/Onboarding'));
const OnboardingWizard = lazyWithRetry(() => import('./components/onboarding/OnboardingWizard'));
const HubSetupWizard = lazyWithRetry(() => import('./components/onboarding/HubSetupWizard'));
const Trombinoscope = lazyWithRetry(() => import('./components/Trombinoscope'));
const Forum = lazyWithRetry(() => import('./components/Forum'));
const UserProfile = lazyWithRetry(() => import('./components/UserProfile'));
const UserMateriel = lazyWithRetry(() => import('./components/profile/UserMateriel'));
const MonVestiaire = lazyWithRetry(() => import('./components/profile/MonVestiaire'));
const SystemAdminPanel = lazyWithRetry(() => import('./components/SystemAdminPanel'));
const TagManager = lazyWithRetry(() => import('./components/TagManager'));
const InventoryManager = lazyWithRetry(() => import('./components/InventoryManager'));
const OrdersManager = lazyWithRetry(() => import('./components/OrdersManager'));
const WardrobeManager = lazyWithRetry(() => import('./components/mestre/WardrobeManager'));
const CostumesAdminManager = lazyWithRetry(() => import('./components/mestre/CostumesAdminManager'));
const AssociationSettings = lazyWithRetry(() => import('./components/AssociationSettings'));
const TreasuryManager = lazyWithRetry(() => import('./components/TreasuryManager'));
const StudioSocial = lazyWithRetry(() => import('./components/StudioSocial'));
const StudioEventsManager = lazyWithRetry(() => import('./components/studio/StudioEventsManager'));
const NewsletterPage = lazyWithRetry(() => import('./components/studio/NewsletterPage'));
const AdminExport = lazyWithRetry(() => import('./components/AdminExport'));
const VaralManager = lazyWithRetry(() => import('./components/VaralManager'));
const ReunionManager = lazyWithRetry(() => import('./components/ReunionManager'));
const ActivityReports = lazyWithRetry(() => import('./components/studio/ActivityReports'));
const EventDetails = lazyWithRetry(() => import('./components/EventDetails'));
const MestreEvents = lazyWithRetry(() => import('./components/mestre/MestreEvents'));
const MestreOrientationCasting = lazyWithRetry(() => import('./components/mestre/MestreOrientationCasting'));
const MestreStageLayout = lazyWithRetry(() => import('./components/mestre/MestreStageLayout'));
const ForumChannelsManager = lazyWithRetry(() => import('./components/ForumChannelsManager'));
const MestreSequenceur = lazyWithRetry(() => import('./components/mestre/MestreSequenceur'));
const SecretariatDocuments = lazyWithRetry(() => import('./components/secretariat/SecretariatDocuments'));
const SecretariatAgendaLieux = lazyWithRetry(() => import('./components/secretariat/SecretariatAgendaLieux'));
const SecretariatReportsView = lazyWithRetry(() => import('./components/secretariat/SecretariatReportsView'));
const StudioCommunication = lazyWithRetry(() => import('./components/studio/StudioCommunication'));
const StudioPhotosView = lazyWithRetry(() => import('./components/studio/StudioPhotosView'));
const MestrePedagogyManager = lazyWithRetry(() => import('./components/mestre/MestrePedagogyManager'));
const GigsPipelineManager = lazyWithRetry(() => import('./components/diffusion/GigsPipelineManager'));
const MestreMotMestre = lazyWithRetry(() => import('./components/mestre/MestreMotMestre'));
const MestrePedagogyDashboard = lazyWithRetry(() => import('./components/mestre/MestrePedagogyDashboard'));
const MestreAutoEvalConfig = lazyWithRetry(() => import('./components/mestre/MestreAutoEvalConfig'));
const WidgetAgenda = lazyWithRetry(() => import('./components/WidgetAgenda'));
const WidgetDocuments = lazyWithRetry(() => import('./components/WidgetDocuments'));
const InstrumentModelsManager = lazyWithRetry(() => import('./components/varal/InstrumentModelsManager'));
const AtelierCouture = lazyWithRetry(() => import('./components/profile/AtelierCouture'));
const MonParcours = lazyWithRetry(() => import('./components/pedagogy/MonParcours'));
const MonAtelier = lazyWithRetry(() => import('./components/profile/MonAtelier'));

const POLES_CONFIG = [
  {
    id: 'accueil',
    label: 'Accueil',
    labelKey: 'poles.accueil',
    tabs: []
  },
  {
    id: 'mon-espace',
    label: 'Espace',
    labelKey: 'poles.mon-espace',
    tabs: [
      { id: 'profil', label: 'Profil', labelKey: 'tabProfil' },
      { id: 'mon-parcours', label: 'Mon Parcours', labelKey: 'tabParcours' },
      { id: 'agenda', label: 'Agenda', labelKey: 'tabAgenda' },
      { id: 'atelier', label: 'Atelier', labelKey: 'tabAtelier' },
      { id: 'materiel', label: 'Matériel', labelKey: 'tabMateriel' },
      { id: 'vestiaire', label: 'Vestiaire', labelKey: 'tabVestiaire' },
      { id: 'trombinoscope', label: 'Trombinoscope', labelKey: 'tabTrombinoscope' },
      { id: 'forum', label: 'Porte-voix', labelKey: 'tabForum' }
    ]
  },
  {
    id: 'secretariat',
    label: 'Secrétariat',
    labelKey: 'poles.secretariat',
    tabs: [
      { id: 'export-annu', label: 'Annuaire', labelKey: 'tabExportAnnu' },
      { id: 'studio-events', label: 'Registre des dates', labelKey: 'tabStudioEvents' },
      { id: 'reunion-manager', label: 'Réunions', labelKey: 'tabReunions' },
      { id: 'varal-secretariat', label: 'Varal Secrétariat', labelKey: 'tabVaralSecretariat' },
      { id: 'mestre-forum-channels', label: 'Porte-voix', labelKey: 'tabMestreForumChannels' },
      { id: 'activity-reports', label: "Rapports", labelKey: 'tabActivityReports' },
      { id: 'secretariat-reports', label: 'Rapports & Bilan AG', labelKey: 'tabSecretariatReports' },
      { id: 'secretariat-documents', label: 'Chartes & Santé', labelKey: 'tabSecretariatDocuments' },
      { id: 'secretariat-lieux', label: 'Lieux & Salles', labelKey: 'tabSecretariatLieux' }
    ]
  },
  {
    id: 'diffusion',
    label: 'Diffusion',
    labelKey: 'poles.diffusion',
    tabs: [
      { id: 'gigs-pipeline', label: 'Suivi des Prestations', labelKey: 'tabGigsPipeline' },
      { id: 'diffusion-contacts', label: 'Carnet de Contacts CRM', labelKey: 'tabDiffusionContacts' }
    ]
  },
  {
    id: 'tresorerie',
    label: 'Trésorerie',
    labelKey: 'poles.tresorerie',
    tabs: [
      { id: 'dashboard-finance', label: 'Synthèse', labelKey: 'tabDashboard' },
      { id: 'cotisations', label: 'Cotisations', labelKey: 'tabCotisations' },
      { id: 'events-finances', label: 'Événements', labelKey: 'tabEvents' },
      { id: 'operations-diverses', label: 'Opérations', labelKey: 'tabOperations' },
      { id: 'frais-km', label: 'Frais', labelKey: 'tabFraisKm' },
      { id: 'reports-exports', label: 'Exports', labelKey: 'tabReports' }
    ]
  },
  {
    id: 'logistique',
    label: 'Logistique',
    labelKey: 'poles.logistique',
    tabs: [
      { id: 'inventory', label: 'Instruments', labelKey: 'tabInventory' },
      { id: 'logistics-pupitres', label: 'Pupitres', labelKey: 'tabLogisticsPupitres' },
      { id: 'logistics-kits', label: 'Accessoires & Kits', labelKey: 'tabLogisticsKits' },
      { id: 'logistics-carpool', label: 'Covoiturage & Convois', labelKey: 'tabLogisticsCarpool' },
      { id: 'orders', label: 'Commandes', labelKey: 'tabOrders' }
    ]
  },
  {
    id: 'lutherie',
    label: 'Lutherie',
    labelKey: 'poles.lutherie',
    tabs: [
      { id: 'inventory-projects', label: 'Établi & chantiers', labelKey: 'tabInventoryProjects' },
      { id: 'instrument-models', label: "Modèles d'instruments", labelKey: 'tabInstrumentModels' },
      { id: 'inventory-parts', label: 'Pièces détachées', labelKey: 'tabInventoryParts' },
      { id: 'inventory-supplies', label: 'Matières premières', labelKey: 'tabInventorySupplies' },
      { id: 'workshop-tools', label: 'Outillage', labelKey: 'tabWorkshopTools' },
      { id: 'varal-lutherie', label: 'Varal Lutherie', labelKey: 'tabVaralLutherie' }
    ]
  },
  {
    id: 'costumerie',
    label: 'Costumerie',
    labelKey: 'poles.costumerie',
    tabs: [
      { id: 'wardrobe-projects', label: 'Établi de confection', labelKey: 'tabWardrobeProjects' },
      { id: 'wardrobe-models', label: 'Modèles & Patrons', labelKey: 'tabWardrobeModels' },
      { id: 'wardrobe-pieces', label: 'Vestiaire physique', labelKey: 'tabWardrobePieces' },
      { id: 'wardrobe-supplies', label: 'Tissus & Mercerie', labelKey: 'tabWardrobeSupplies' },
      { id: 'wardrobe-tools', label: 'Machines & Outils', labelKey: 'tabWardrobeTools' },
      { id: 'wardrobe-sizes', label: 'Tailles & Mensurations', labelKey: 'tabWardrobeSizes' },
      { id: 'varal-costumerie', label: 'Varal Costumerie', labelKey: 'tabVaralCostumerie' }
    ]
  },
  {
    id: 'studio',
    label: 'Studio',
    labelKey: 'poles.studio',
    tabs: [
      { id: 'studio-social', label: 'Studio social', labelKey: 'tabStudioSocial' },
      { id: 'newsletter', label: 'Newsletter', labelKey: 'tabNewsletter' },
      { id: 'studio-communication', label: 'Communication & Brevo', labelKey: 'tabStudioCommunication' },
      { id: 'varal-photos', label: 'Varal Photos', labelKey: 'tabVaralPhotos' }
    ]
  },
  {
    id: 'pedagogie',
    label: 'Pédagogie',
    labelKey: 'poles.pedagogie',
    tabs: [
      { id: 'varal-manager', label: 'Varal', labelKey: 'tabVaralManager' },
      { id: 'mestre-pedagogy-qcm', label: 'QCM & Quiz', labelKey: 'tabMestrePedagogyQcm' },
      { id: 'mestre-pedagogy-dashboard', label: 'Suivi et Analyse', labelKey: 'tabMestrePedagogyDashboard' }
    ]
  },
  {
    id: 'mestre',
    label: 'Mestria',
    labelKey: 'poles.mestre',
    tabs: [
      { id: 'mestre-orientation', label: 'Casting & Orientation', labelKey: 'tabMestreOrientation' },
      { id: 'mestre-stage-layout', label: 'Plan de Scène', labelKey: 'tabMestreStage' },
      { id: 'mestre-sequenceur', label: 'Séquenceur & Rythmes', labelKey: 'tabMestreSequenceur' },
      { id: 'mestre-events', label: 'Événements & Présences', labelKey: 'tabMestreEvents' },
      { id: 'mestre-mot-mestre', label: 'Annonces du Mestre', labelKey: 'tabMestreMotMestre' }
    ]
  },
  {
    id: 'vitrine',
    label: 'Vitrine',
    labelKey: 'poles.vitrine',
    tabs: [
      { id: 'vitrine-general', label: 'Général & SEO' },
      { id: 'vitrine-presentation', label: 'Présentation' },
      { id: 'vitrine-organisateur', label: 'Organisateur & Technique' },
      { id: 'vitrine-galerie', label: 'Galerie Photo' },
      { id: 'vitrine-recrutement', label: 'Recrutement & Vie Associative' },
      { id: 'vitrine-reseaux', label: 'Réseaux & Newsletter' },
      { id: 'vitrine-apparence', label: 'Apparence' }
    ]
  },
  {
    id: 'config',
    label: 'Configuration',
    labelKey: 'poles.config',
    tabs: [
      { id: 'config-identity', label: 'Identité', labelKey: 'tabConfigIdentity' },
      { id: 'config-security', label: 'Badges & Permissions', labelKey: 'tabConfigSecurity' },
      { id: 'config-layout', label: 'Apparence', labelKey: 'tabConfigLayout' },
      { id: 'config-profile', label: 'Inscription & Profils', labelKey: 'tabConfigProfile' },
      { id: 'config-modules', label: 'Modules & Fonctionnalités', labelKey: 'tabConfigModules' }
    ]
  }
];

function OrganizadorRedirector({ user, navigateToRoute, brandingStyle }) {
  useEffect(() => {
    navigateToRoute(user ? '/app' : '/login');
  }, [user, navigateToRoute]);

  return (
    <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-[#f4ecd8]">
      <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
      <span className="font-bold text-xs uppercase tracking-widest text-[#8b2a1a]">
        Redirection...
      </span>
    </div>
  );
}

function OrchestradorRedirector({ brandingStyle }) {
  useEffect(() => {
    window.location.href = 'https://o-girador.com';
  }, []);

  return (
    <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-[#f4ecd8]">
      <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
      <span className="font-bold text-xs uppercase tracking-widest text-[#8b2a1a]">
        Redirection vers le Hub...
      </span>
    </div>
  );
}

export default function App() {
  const { appMode, groupId: urlGroupId, urls, isLocalhost, isTenantLoading, tenantError } = useTenantContext();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [branding, setBranding] = useState(null);
  const [associationName, setAssociationName] = useState('');
  const [majoriteFeminine, setMajoriteFeminine] = useState(false);
  const [sequenceurUrl, setSequenceurUrl] = useState('');
  const [permissionsMatrice, setPermissionsMatrice] = useState(null);
  const [enabledModules, setEnabledModules] = useState(null);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [activerPresenceEnLigne, setActiverPresenceEnLigne] = useState(true);
  const [breakGlassActive, setBreakGlassActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('breakGlassActive') === 'true';
    }
    return false;
  });

  const handleToggleBreakGlass = () => {
    setBreakGlassActive(prev => {
      const nextVal = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('breakGlassActive', String(nextVal));
      }
      return nextVal;
    });
  };

  // Gestion du routage dynamique (/ vitrine public, /app espace membre, /login connexion)
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const navigateToRoute = (route) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route + window.location.search);
    }
  };

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'trombinoscope', 'forum', 'profil', 'system-admin', 'layout-editor', 'tag-manager'
  const [currentPole, setCurrentPole] = useState('accueil');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedMestreEventId, setSelectedMestreEventId] = useState(null);
  const [activeMestreEventDetails, setActiveMestreEventDetails] = useState(null);
  const [activeTutorialPiece, setActiveTutorialPiece] = useState(null);

  const handleGoToStageLayoutEditor = (eventId) => {
    setSelectedMestreEventId(eventId);
    setCurrentPole('espace-mestre');
    setCurrentTab('mestre-stage-layout');
    setActiveMestreEventDetails(null);
  };
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [unreadPrivateMessagesCount, setUnreadPrivateMessagesCount] = useState(0);
  const [activePrivateChatUserId, setActivePrivateChatUserId] = useState(null);
  const [latestUnreadSenderId, setLatestUnreadSenderId] = useState(null);
  const [forumInitialTab, setForumInitialTab] = useState('discussions');
  const [initialPrivateMessage, setInitialPrivateMessage] = useState('');
  const [dashboardKey, setDashboardKey] = useState(0);

  // Redirection directe vers la messagerie privée (avec interlocuteur spécifique si disponible)
  const handleOpenPrivateMessages = useCallback((senderId = null) => {
    const targetUserId = senderId || latestUnreadSenderId;
    setForumInitialTab('inbox');
    if (targetUserId) {
      setActivePrivateChatUserId(targetUserId);
    }
    setCurrentPole('mon-espace');
    setCurrentTab('forum');
  }, [latestUnreadSenderId]);

  // Vérifier si l'utilisateur connecté fâte son anniversaire ce mois-ci
  const isUserBirthdayMonth = useMemo(() => {
    if (!profileData?.dateNaissance) return false;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const parts = profileData.dateNaissance.split('-');
    if (parts.length === 3) {
      const birthMonth = parseInt(parts[1], 10);
      return birthMonth === currentMonth;
    }
    const d = new Date(profileData.dateNaissance);
    if (!isNaN(d.getTime())) {
      return (d.getMonth() + 1) === currentMonth;
    }
    return false;
  }, [profileData]);

  const [associationData, setAssociationData] = useState(null);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [hasTriggeredOnboardingAuto, setHasTriggeredOnboardingAuto] = useState(false);

  const isAdministrativeUser = Boolean(
    profileData?.isSystemAdmin || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'mestre' ||
    profileData?.role === 'admin'
  );

  useEffect(() => {
    tracker.init({
      appId: 'manager',
      groupId: profileData?.groupId || 'public',
      appVersion: '1.2.0'
    });
  }, [profileData?.groupId]);

  // Tracking du cycle de vie et de session
  useEffect(() => {
    if (user && profileData) {
      // Démarrer la session
      tracker.startSession(profileData, 'manager', profileData.groupId);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          tracker.endSession('manager', profileData.groupId);
        } else if (document.visibilityState === 'visible') {
          tracker.startSession(profileData, 'manager', profileData.groupId);
        }
      };

      const handleBeforeUnload = () => {
        tracker.endSession('manager', profileData.groupId);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Nettoyage lors du démontage ou changement d'utilisateur
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        tracker.endSession('manager', profileData.groupId);
      };
    }
  }, [user, profileData]);

  // Charger branding in real-time
  useEffect(() => {
    let activeGroupId = profileData?.groupId || null;
    
    if (!activeGroupId) {
      const searchParams = new URLSearchParams(window.location.search);
      activeGroupId = searchParams.get('groupe') || null;
    }

    if (!activeGroupId) {
      setAssociationData(null);
      setBranding(null);
      setAssociationName('');
      setMajoriteFeminine(false);
      setSequenceurUrl('');
      setPermissionsMatrice(null);
      return;
    }

    const assocRef = doc(db, 'associations', activeGroupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAssociationData(data);
        if (data.branding) {
          setBranding(data.branding);
        } else {
          setBranding(null);
        }
        setAssociationName(data.nom || '');
        setMajoriteFeminine(data.majoriteFeminine || false);
        setSequenceurUrl(data.sequenceurUrl || '');
        setPermissionsMatrice(data.permissionsMatrice || null);
        setEnabledModules(data.enabledModules || null);
        setTagsDisponibles(Array.isArray(data.tagsDisponibles) ? data.tagsDisponibles : []);
        setActiverPresenceEnLigne(data.activerPresenceEnLigne !== false);
      } else {
        setAssociationData(null);
        setBranding(null);
        setAssociationName('');
        setMajoriteFeminine(false);
        setSequenceurUrl('');
        setPermissionsMatrice(null);
        setEnabledModules(null);
        setTagsDisponibles([]);
        setActiverPresenceEnLigne(true);
      }
    }, (error) => {
      console.error("App - Erreur onSnapshot branding :", error);
      setAssociationData(null);
      setBranding(null);
      setAssociationName('');
      setMajoriteFeminine(false);
      setSequenceurUrl('');
      setPermissionsMatrice(null);
      setTagsDisponibles([]);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, user]);

  // Déclenchement automatique de l'assistant d'onboarding pour l'administrateur/mestre lors du premier démarrage
  useEffect(() => {
    if (
      user &&
      isAdministrativeUser &&
      associationData &&
      associationData.onboardingCompleted === false &&
      !hasTriggeredOnboardingAuto
    ) {
      setShowOnboardingWizard(true);
      setHasTriggeredOnboardingAuto(true);
    }
  }, [user, isAdministrativeUser, associationData, hasTriggeredOnboardingAuto]);


  // Personnalisation dynamique du titre du document HTML et de la PWA selon le nom de l'association
  useEffect(() => {
    const fullAppName = associationName ? `O Girador ${associationName}` : "O Girador Samambaia";
    
    // Ne forcer le titre "O Girador..." que sur l'espace d'administration (Organizador)
    if (currentRoute !== '/') {
      document.title = fullAppName;
    }

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta) {
      appleTitleMeta.setAttribute('content', fullAppName);
    }
  }, [associationName, currentRoute]);

  const brandingStyle = branding?.colors ? {
    '--cordel-bg': branding.colors.background,
    '--cordel-bg-light-color': branding.colors.background,
    '--color-cordel-bg-light': branding.colors.background,

    '--cordel-text': branding.colors.text,
    '--color-encre-noire': branding.colors.text,
    '--encre-noire': branding.colors.text,
    '--cordel-border': branding.colors.text,

    '--color-cordel-ocre': branding.colors.primary,
    '--cordel-ocre': branding.colors.primary,
    '--cordel-wood': branding.colors.primary,

    '--color-cordel-vert': branding.colors.secondary,
    '--cordel-vert': branding.colors.secondary
  } : {};

  // Initialiser theme: force light theme by default, disable dark mode completely
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Synchroniser la navigation PWA et du routeur avec l'historique du navigateur
  useEffect(() => {
    const handlePopState = (event) => {
      if (typeof window !== 'undefined') {
        setCurrentRoute(window.location.pathname || '/');
      }
      if (event.state && event.state.currentPole && event.state.currentTab) {
        setCurrentPole(event.state.currentPole);
        setCurrentTab(event.state.currentTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Remplacer l'état initial pour que le bouton retour ramène à l'accueil
    if (!window.history.state) {
      window.history.replaceState(
        { currentPole: currentPole || 'accueil', currentTab: currentTab || 'dashboard' },
        '',
        window.location.pathname + window.location.search
      );
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Pousser l'état de navigation dans l'historique lors d'un changement d'onglet ou pôle
  useEffect(() => {
    const currentState = window.history.state;
    if (!currentState || currentState.currentPole !== currentPole || currentState.currentTab !== currentTab) {
      window.history.pushState(
        { currentPole, currentTab },
        '',
        window.location.pathname + window.location.search
      );
    }
  }, [currentPole, currentTab]);

  // Intercept PWA installation prompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallPromptAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const triggerInstallPrompt = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallPromptAvailable(false);
  };

  // Generate dynamic Manifest with canvas branded stamp
  useEffect(() => {
    let activeGroupId = profileData?.groupId || null;
    if (!activeGroupId) {
      const searchParams = new URLSearchParams(window.location.search);
      activeGroupId = searchParams.get('groupe') || null;
    }

    if (!activeGroupId) return;

    const generateAndInjectManifest = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const bgCol = branding?.colors?.background || '#f4ecd8';
      const primaryCol = branding?.colors?.primary || '#d99f4d';
      const textCol = branding?.colors?.text || '#1a1a1a';
      const logoSrc = branding?.logoUrl;

      // Appliquer un masque circulaire strict pour garantir la transparence extérieure
      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.clip();

      // Draw paper background
      ctx.fillStyle = bgCol;
      ctx.fillRect(0, 0, 512, 512);

      // Draw double textured woodcut circles
      ctx.strokeStyle = primaryCol;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(256, 256, 230, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, 256, 215, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(256, 256, 205, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dessin du texte circulaire "★ O GIRADOR ★" en bas à l'intérieur de l'anneau (de gauche à droite)
      ctx.font = 'bold 24px Courier New, Courier, monospace';
      ctx.fillStyle = textCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = "★ O GIRADOR ★";
      const radius = 175;
      const angleStep = 0.16;
      // Pour afficher le texte de gauche à droite sur l'arc inférieur (angle PI/2 = bas) :
      // L'angle de départ commence du côté gauche (> PI/2) et diminue vers le côté droit (< PI/2).
      const startAngle = Math.PI / 2 + (label.length - 1) * angleStep / 2;

      for (let i = 0; i < label.length; i++) {
        const charAngle = startAngle - i * angleStep;
        const x = 256 + Math.cos(charAngle) * radius;
        const y = 256 + Math.sin(charAngle) * radius;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(charAngle - Math.PI / 2);
        ctx.fillText(label[i], 0, 0);
        ctx.restore();
      }

      if (logoSrc) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = logoSrc;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const targetSize = 310;
          let w = img.width;
          let h = img.height;
          const ratio = w / h;
          if (w > h) {
            w = targetSize;
            h = targetSize / ratio;
          } else {
            h = targetSize;
            w = targetSize * ratio;
          }
          ctx.drawImage(img, 256 - w / 2, 235 - h / 2, w, h);
        } catch (err) {
          console.error("App - Erreur logo Canvas PWA fallback text :", err);
          ctx.font = 'bold 42px Courier New, Courier, monospace';
          ctx.fillStyle = textCol;
          ctx.fillText(associationName ? associationName.substring(0, 12).toUpperCase() : 'RODA', 256, 220);
        }
      } else {
        ctx.font = 'bold 42px Courier New, Courier, monospace';
        ctx.fillStyle = textCol;
        ctx.fillText(associationName ? associationName.substring(0, 12).toUpperCase() : 'RODA', 256, 220);
      }

      const iconDataUrl = canvas.toDataURL('image/png');
      
      // Partager ce logo combiné au reste de l'application (ex: LayoutShell)
      window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: iconDataUrl }));

      // Mettre à jour favicon and apple-touch-icon with branded canvas icon
      let faviconElement = document.querySelector('link#favicon') || document.querySelector('link[rel="icon"]');
      if (faviconElement && iconDataUrl) {
        faviconElement.href = iconDataUrl;
      }
      let appleIconElement = document.querySelector('link[rel="apple-touch-icon"]');
      if (appleIconElement && iconDataUrl) {
        appleIconElement.href = iconDataUrl;
      }

      // Mettre à jour meta theme-color
      let themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta && primaryCol) {
        themeMeta.setAttribute('content', primaryCol);
      }

      // Ensure manifest link always points to valid static /manifest.json (never a blob: URL)
      let linkElement = document.querySelector('link[rel="manifest"]');
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'manifest';
        linkElement.href = '/manifest.json';
        document.head.appendChild(linkElement);
      } else {
        linkElement.href = '/manifest.json';
      }
    };

    generateAndInjectManifest();
  }, [branding, associationName, profileData?.groupId]);

  // Automatically associate or switch the user's group if they open the app via an invitation URL
  // containing a different groupId than their current profileData.groupId
  useEffect(() => {
    if (user && profileData) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlGroupId = searchParams.get('groupe');
      if (urlGroupId && urlGroupId !== profileData.groupId) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { groupId: urlGroupId })
          .then(() => {
            // Clean up the URL to hide the query parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          })
          .catch((err) => {
            console.error("App - Erreur association groupe automatique :", err);
          });
      }
    }
  }, [user, profileData]);

  // Gestion du Deep Linking automatique pour la navigation via les notifications Push FCM
  useEffect(() => {
    if (!user || !profileData) return;

    // Fonction de navigation interne déclenchée par un deep link (notification push)
    const handleDeepLinkNavigation = (overridePath) => {
      const pathname = overridePath || window.location.pathname || '';
      const searchParams = new URLSearchParams(window.location.search);

      const hasEventId = searchParams.has('eventId');
      const hasThreadId = searchParams.has('threadId');
      const isAgendaRoute = pathname.includes('/agenda') || pathname.includes('/events');
      const isForumRoute = pathname.includes('/forum') || pathname.includes('/threads');

      if (hasEventId || isAgendaRoute) {
        setCurrentPole('accueil');
        setCurrentTab('agenda');
      } else if (hasThreadId || isForumRoute) {
        setCurrentPole('mon-espace');
        setCurrentTab('forum');
      }

      // Mettre à jour la route interne si un chemin explicite est fourni
      if (overridePath) {
        setCurrentRoute(overridePath);
        window.history.pushState({}, '', overridePath);
      }
    };

    handleDeepLinkNavigation();

    // Écoute des événements de navigation (ex: retour arrière navigateur)
    window.addEventListener('popstate', () => handleDeepLinkNavigation());

    // Écoute des messages du service worker (clic notification quand l'app est déjà ouverte)
    // Le SW envoie un postMessage au lieu de client.navigate pour éviter un rechargement complet
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK' && event.data.url) {
        console.log('[App] Navigation via notification push :', event.data.url);
        handleDeepLinkNavigation(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('popstate', () => handleDeepLinkNavigation());
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [user, profileData]);

  // Synchroniser unread private messages count et identifier le dernier expéditeur
  useEffect(() => {
    if (!user?.uid) {
      setUnreadPrivateMessagesCount(0);
      setLatestUnreadSenderId(null);
      return;
    }
    const messagesRef = collection(db, 'private_messages');
    const q = query(
      messagesRef, 
      where('recipientId', '==', user.uid), 
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadPrivateMessagesCount(snap.size);
      if (!snap.empty) {
        // Trier pour identifier l'expéditeur du message non lu le plus récent
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setLatestUnreadSenderId(docs[0]?.senderId || null);
      } else {
        setLatestUnreadSenderId(null);
      }
    }, (error) => {
      console.error("App - Error syncing unread messages:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    let unsubscribeProfile = null;
    let unsubscribeAuth = null;
    let isMounted = true;

    // Détection et traitement du SSO Custom Token
    const searchParams = new URLSearchParams(window.location.search);
    const ssoToken = searchParams.get('ssoToken');
    let isSSOPending = Boolean(ssoToken);

    if (ssoToken) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('ssoToken');
      window.history.replaceState({}, document.title, cleanUrl.toString());

      let tokenUid = null;
      try {
        const parts = ssoToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          tokenUid = payload.uid || payload.sub || null;
        }
      } catch (_) {}

      if (auth.currentUser && tokenUid && auth.currentUser.uid === tokenUid) {
        isSSOPending = false;
      } else {
        setLoading(true);
        signInWithCustomToken(auth, ssoToken)
          .catch((err) => {
            console.warn("[Organizad'Or SSO] Erreur custom token :", err);
            setLoading(false);
          })
          .finally(() => {
            isSSOPending = false;
          });
      }
    }

    const initAuth = () => {
      if (!isMounted) return;

      unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        
        // Clean up previous profile listener if any
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (currentUser) {
          setCheckingProfile(true);
          const profileRef = doc(db, 'users', currentUser.uid);
          unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const migration = getMigratedRoleAndTags(data);
              if (migration.needsMigration) {
                updateDoc(profileRef, {
                  role: migration.newRole,
                  tags: migration.newTags
                }).catch(err => console.error("App - Erreur migration profil utilisateur :", err));

                setProfileData({ uid: docSnap.id, id: docSnap.id, ...data, role: migration.newRole, tags: migration.newTags });
              } else {
                setProfileData({ uid: docSnap.id, id: docSnap.id, ...data });
              }
              setProfileExists(true);
            } else {
              setProfileData(null);
              setProfileExists(false);
            }
            setCheckingProfile(false);
            setLoading(false);
          }, (error) => {
            console.error("App - Erreur onSnapshot profil utilisateur :", error);
            setProfileData(null);
            setProfileExists(false);
            setCheckingProfile(false);
            setLoading(false);
          });
        } else {
          setProfileData(null);
          setProfileExists(false);
          setCheckingProfile(false);
          if (!isSSOPending) {
            setLoading(false);
          }
        }
      });
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard'); // Réinitialiser navigation view on sign out
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  const userTags = resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);
  const isSystemOrSuperAdminOrMestre = profileData?.isSystemAdmin || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  const isMasterKeyActive = isSystemOrSuperAdminOrMestre && breakGlassActive;

  const [accessDeniedToast, setAccessDeniedToast] = useState(false);

  // Interception ProtectedRoutes : si le membre standard tente d'accéder à un pôle ou onglet réservé
  useEffect(() => {
    if (!profileData || profileData.isNew) return;
    // Si l'utilisateur est Mestre (ou direction/admin) et navigue vers le pôle mestre, l'accès est garanti d'office
    if (currentPole === 'mestre' && (profileData.role === 'mestre' || profileData.role === 'super-admin' || profileData.role === 'admin' || profileData.isSystemAdmin)) {
      return;
    }
    if (currentPole && currentPole !== 'accueil' && currentPole !== 'mon-espace') {
      let isAllowed = canAccessPole(currentPole, profileData, permissionsMatrice, userTags);
      
      // Autoriser l'accès au conteneur du pôle si l'utilisateur a accès à au moins un onglet spécifique
      if (!isAllowed) {
        const activePoleObj = POLES_CONFIG.find(p => p.id === currentPole);
        if (activePoleObj && activePoleObj.tabs) {
          isAllowed = activePoleObj.tabs.some(tab => canAccessTabPermission(tab.id, currentPole, profileData, permissionsMatrice, userTags));
        }
      }

      if (!isAllowed && !isMasterKeyActive) {
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
        setAccessDeniedToast(true);
        const timer = setTimeout(() => setAccessDeniedToast(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPole, profileData, permissionsMatrice, userTags, isMasterKeyActive]);

  // Called after onboarding completes successfully
  const handleOnboardingComplete = () => {
    // No need to récupérer manually, the onSnapshot listener handles it automatically
  };

  // 1. Écran de chargement (Authentification ou chargement Firestore)
  if (loading || checkingProfile) {
    const logoSrc = branding?.logoUrl || '/favicon.svg';
    return (
      <div style={brandingStyle} className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[var(--cordel-bg)] text-[var(--cordel-text)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs sm:max-w-sm w-full">
          {logoSrc && (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden flex items-center justify-center mb-2 mx-auto">
              <img 
                src={logoSrc} 
                alt="Logo Association" 
                className="w-full h-full object-cover select-none" 
              />
            </div>
          )}
          {/* Spinner stylisé */}
          <div className="relative w-16 h-16 select-none animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--cordel-border)]/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cordel-wood border-r-transparent border-b-transparent border-l-transparent"></div>
          </div>
          <span className="font-black text-xs uppercase tracking-widest text-cordel-wood animate-pulse">
            {checkingProfile ? t('dashboard.loadingProfile') : t('common.loading')}
          </span>
        </div>
      </div>
    );
  }

  // 2. Routage dynamique : Vitrine Publique One-Page, Racine, Setup

  const isRootPath = !currentRoute || currentRoute === '/' || currentRoute === '' || currentRoute === '/index.html' || currentRoute.startsWith('/?') || currentRoute.startsWith('/#');
  const isSetupPath = currentRoute.startsWith('/setup');
  const isAppPath = currentRoute.startsWith('/app');
  const isLoginPath = currentRoute === '/login' || currentRoute === '/login/';
  
  // Toute autre route (ex: /asso-01) est traitée comme une route vitrine
  const isVitrinePath = !isRootPath && !isSetupPath && !isAppPath && !isLoginPath;
  const vitrineGroupId = isVitrinePath ? currentRoute.split('/')[1]?.split('?')[0] : null;

  if (isSetupPath) {
    return (
      <React.Suspense fallback={
        <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-[#f4ecd8]">
          <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-[#8b2a1a]">Chargement de l'assistant...</span>
        </div>
      }>
        <HubSetupWizard brandingStyle={brandingStyle} onComplete={() => navigateToRoute('/app')} />
        <ReloadPrompt />
      </React.Suspense>
    );
  }

  if (isRootPath || isVitrinePath) {

    if (isTenantLoading) {
      return (
        <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-[#f4ecd8]">
          <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-[#8b2a1a]">Chargement de la plateforme...</span>
        </div>
      );
    }

    if (tenantError) {
      return <TenantNotFound />;
    }

    if (appMode === 'orchestrador' && isRootPath) {
      return <OrchestradorRedirector brandingStyle={brandingStyle} />;
    }

    if (appMode === 'organizador' && isRootPath) {
      return <OrganizadorRedirector user={user} navigateToRoute={navigateToRoute} brandingStyle={brandingStyle} />;
    }

    const publicGroupId = vitrineGroupId || urlGroupId || profileData?.groupId || null;

    return (
      <PublicThemeProvider groupId={publicGroupId}>
        <PublicHome
          groupId={publicGroupId}
          user={user}
          profileData={profileData}
          permissionsMatrice={permissionsMatrice}
          effectiveUserTags={userTags}
          isAdministrativeUser={isAdministrativeUser}
          associationName={associationName}
          branding={branding}
          onNavigateToApp={() => navigateToRoute(user ? '/app' : '/login')}
          onNavigateToLogin={() => navigateToRoute('/login')}
        />
        <ReloadPrompt />
      </PublicThemeProvider>
    );
  }

  // 3. Utilisateur non connecté sur une route privée (/app, /login, etc.) -> Affichage de la page Login
  if (!user) {
    return (
      <>
        <Login branding={branding} onSuccess={() => navigateToRoute('/app')} />
        <ReloadPrompt />
      </>
    );
  }

  // 4. Utilisateur connecté mais profil Firestore manquant ou incomplet -> Onboarding
  const isProfileComplete = profileData?.onboardingCompleted === true || (profileData?.telephone && profileData?.adresseRue);

  if (!profileExists || !profileData || (!isProfileComplete && !isSystemOrSuperAdminOrMestre)) {
    return (
      <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
        <React.Suspense fallback={<div className="flex-1 flex justify-center items-center py-12 animate-pulse text-xs font-bold select-none">⏳ Initialisation...</div>}>
          <Onboarding user={user} branding={branding} onComplete={handleOnboardingComplete} profileData={profileData} />
        </React.Suspense>
        <ReloadPrompt />
      </div>
    );
  }

  // 4b. Sécurisation : Compte nouvellement inscrit en attente de validation par le bureau (isNew === true)
  if (profileData?.isNew === true && !isSystemOrSuperAdminOrMestre) {
    return (
      <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
        <PendingValidationScreen
          profileData={profileData}
          branding={branding}
          onSignOut={handleSignOut}
        />
        <ReloadPrompt />
      </div>
    );
  }

  // 5. Utilisateur connecté avec profil valide -> Rendu de l'Espace Membre Privé (/app)

  const isModuleEnabled = (tabId, poleId) => {
    if (!enabledModules) return true;

    // Vérifier Pôles activation
    if (poleId === 'diffusion' && enabledModules.diffusion === false) return false;
    if (poleId === 'tresorerie' && enabledModules.tresorerie === false) return false;
    if (poleId === 'secretariat' && enabledModules.secretariat === false) return false;
    if (poleId === 'logistique' && enabledModules.logistique === false && enabledModules.commandes === false) return false;
    if (poleId === 'lutherie' && enabledModules.lutherie === false) return false;
    if (poleId === 'costumerie' && enabledModules.costumerie === false && enabledModules.vestiaire === false) return false;
    if (poleId === 'vestiaire' && enabledModules.vestiaire === false) return false;
    if (poleId === 'mestre' && enabledModules.mestre === false) return false;
    if (poleId === 'pedagogie' && enabledModules.mestre === false && enabledModules.studioSocial === false) return false;

    // Specific Tabs Checks
    if (['mestre-sante-troupe', 'mestre-pedagogy-dashboard', 'mestre-sequenceur'].includes(tabId) && enabledModules.mestre === false) return false;
    if (tabId === 'varal-manager' && enabledModules.studioSocial === false) return false;

    // Vérifier Tab-level module basculer
    if (tabId === 'gigs-pipeline' && enabledModules.diffusion === false) return false;
    if (['dashboard-finance', 'cotisations', 'events-finances', 'operations-diverses', 'frais-km', 'reports-exports'].includes(tabId) && enabledModules.tresorerie === false) return false;
    if (tabId === 'mon-parcours' && enabledModules.monParcoursGlobal === false) return false;
    if (tabId === 'inventory' && enabledModules.logistique === false) return false;
    if (['orders', 'orders-manager'].includes(tabId) && enabledModules.commandes === false) return false;
    if (['wardrobe-projects', 'wardrobe-models', 'wardrobe-pieces', 'wardrobe-supplies', 'wardrobe-tools', 'wardrobe-sizes', 'varal-costumerie', 'wardrobe', 'vestiaire', 'wardrobe-inventory', 'wardrobe-couture'].includes(tabId) && enabledModules.vestiaire === false && enabledModules.costumerie === false) return false;
    if (['studio-social', 'newsletter'].includes(tabId) && enabledModules.studioSocial === false) return false;
    if (tabId === 'reunion-manager' && enabledModules.reunions === false) return false;
    if (['forum', 'mestre-forum-channels'].includes(tabId) && enabledModules.forum === false) return false;
    if (['mestre-sante-troupe', 'mestre-pedagogy-dashboard', 'varal-manager', 'mestre-pedagogy-qcm', 'mestre-orientation', 'mestre-events', 'mestre-stage-layout', 'mestre-mot-mestre', 'mestre-sequenceur'].includes(tabId) && enabledModules.mestre === false) return false;

    return true;
  };

  const checkTabAccess = (tabId, poleId) => {
    // 0. Strict Global Feature Basculer vérifier (Hides & blocks for EVERYONE including super-admin if OFF)
    if (!isModuleEnabled(tabId, poleId)) return false;

    // Master Key Bypass ONLY if Break-Glass Technical Intervention Mode is ACTIVE
    if (isMasterKeyActive) return true;

    // Centralized access rule vérifier by roles and tags
    return canAccessTabPermission(tabId, poleId, profileData, permissionsMatrice, userTags);
  };


  const hasAccessDiffusion = isMasterKeyActive || canAccessPole('diffusion', profileData, permissionsMatrice, userTags) || checkTabAccess('gigs-pipeline', 'diffusion');
  const hasAccessTresorerie = isMasterKeyActive || canAccessPole('tresorerie', profileData, permissionsMatrice, userTags) || checkTabAccess('dashboard-finance', 'tresorerie') || checkTabAccess('cotisations', 'tresorerie') || checkTabAccess('events-finances', 'tresorerie') || checkTabAccess('operations-diverses', 'tresorerie') || checkTabAccess('frais-km', 'tresorerie') || checkTabAccess('reports-exports', 'tresorerie');
  const hasAccessSecretariat = isMasterKeyActive || canAccessPole('secretariat', profileData, permissionsMatrice, userTags) || checkTabAccess('export-annu', 'secretariat') || checkTabAccess('reunion-manager', 'secretariat') || checkTabAccess('activity-reports', 'secretariat') || checkTabAccess('mestre-forum-channels', 'secretariat') || checkTabAccess('studio-events', 'secretariat') || checkTabAccess('varal-secretariat', 'secretariat') || checkTabAccess('secretariat-documents', 'secretariat') || checkTabAccess('secretariat-lieux', 'secretariat');
  const hasAccessLogistique = isMasterKeyActive || canAccessPole('logistique', profileData, permissionsMatrice, userTags) || checkTabAccess('inventory', 'logistique') || checkTabAccess('logistics-pupitres', 'logistique') || checkTabAccess('logistics-kits', 'logistique') || checkTabAccess('logistics-carpool', 'logistique') || checkTabAccess('orders', 'logistique') || checkTabAccess('orders-manager', 'logistique');
  const hasAccessLutherie = isMasterKeyActive || canAccessPole('lutherie', profileData, permissionsMatrice, userTags) || checkTabAccess('instrument-models', 'lutherie') || checkTabAccess('inventory-projects', 'lutherie') || checkTabAccess('inventory-parts', 'lutherie') || checkTabAccess('inventory-supplies', 'lutherie') || checkTabAccess('workshop-tools', 'lutherie') || checkTabAccess('varal-lutherie', 'lutherie');
  const hasAccessCostumerie = isMasterKeyActive || canAccessPole('costumerie', profileData, permissionsMatrice, userTags) || checkTabAccess('wardrobe-projects', 'costumerie') || checkTabAccess('wardrobe-models', 'costumerie') || checkTabAccess('wardrobe-pieces', 'costumerie') || checkTabAccess('wardrobe-supplies', 'costumerie') || checkTabAccess('wardrobe-tools', 'costumerie') || checkTabAccess('wardrobe-sizes', 'costumerie') || checkTabAccess('varal-costumerie', 'costumerie');
  const hasAccessStudio = isMasterKeyActive || canAccessPole('studio', profileData, permissionsMatrice, userTags) || checkTabAccess('studio-social', 'studio') || checkTabAccess('newsletter', 'studio') || checkTabAccess('studio-communication', 'studio') || checkTabAccess('varal-photos', 'studio');
  const hasAccessMestre = isMasterKeyActive || 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'admin' || 
    profileData?.isSystemAdmin === true ||
    canAccessMestre(profileData, permissionsMatrice, userTags);
  const hasAccessPedagogie = isMasterKeyActive || canAccessPole('pedagogie', profileData, permissionsMatrice, userTags) || checkTabAccess('mestre-pedagogy-dashboard', 'pedagogie') || checkTabAccess('varal-manager', 'pedagogie') || checkTabAccess('mestre-pedagogy-qcm', 'pedagogie');
  const hasAccessVitrine = isMasterKeyActive || checkTabAccess('vitrine-general', 'vitrine') || checkTabAccess('vitrine-editor', 'vitrine');
  const hasAccessConfig = isMasterKeyActive || checkTabAccess('config-identity', 'config') || checkTabAccess('config-security', 'config') || checkTabAccess('config-layout', 'config') || checkTabAccess('config-profile', 'config') || checkTabAccess('config-modules', 'config');
  const hasAccessForumMod = isMasterKeyActive || userTags.some(t => ['Modérateur', 'Modérateur Forum', 'Gestionnaire Porte-voix', 'Porte-voix'].includes(t));

  // Fonction utilitaire pour nettoyer les paramètres d'URL (ex: threadId, eventId) lors des navigations
  const cleanUrlParams = (keys = ['threadId', 'eventId']) => {
    const searchParams = new URLSearchParams(window.location.search);
    let changed = false;
    keys.forEach(k => {
      if (searchParams.has(k)) {
        searchParams.delete(k);
        changed = true;
      }
    });
    if (changed) {
      const cleanUrl = window.location.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      const stateUpdate = {};
      keys.forEach(k => { stateUpdate[k] = null; });
      window.history.replaceState({ ...window.history.state, ...stateUpdate }, '', cleanUrl);
    }
  };

  const handleNavigateToPole = (poleId) => {
    if (poleId !== 'accueil' && poleId !== 'mon-espace') {
      let isAllowed = canAccessPole(poleId, profileData, permissionsMatrice, userTags);
      
      if (!isAllowed) {
        const activePoleObj = POLES_CONFIG.find(p => p.id === poleId);
        if (activePoleObj && activePoleObj.tabs) {
          isAllowed = activePoleObj.tabs.some(tab => canAccessTabPermission(tab.id, poleId, profileData, permissionsMatrice, userTags));
        }
      }

      if (!isAllowed && !isMasterKeyActive) {
        setAccessDeniedToast(true);
        setTimeout(() => setAccessDeniedToast(false), 4000);
        return;
      }
    }
    setCurrentPole(poleId);
    if (poleId === 'accueil') {
      cleanUrlParams(['eventId', 'threadId']);
      setCurrentTab('dashboard');
      setDashboardKey(prev => prev + 1);
      return;
    }
    // Nettoyer les paramètres de deep-link lorsqu'on quitte les pôles respectifs
    if (poleId !== 'mon-espace') {
      cleanUrlParams(['threadId']);
    }
    cleanUrlParams(['eventId']);

    const poleObj = POLES_CONFIG.find(p => p.id === poleId);
    if (poleObj && poleObj.tabs.length > 0) {
      const allowedTab = poleObj.tabs.find(tab => checkTabAccess(tab.id, poleId));
      setCurrentTab(allowedTab ? allowedTab.id : poleObj.tabs[0].id);
    } else {
      setCurrentTab(null);
    }
  };

  const handleNavigateToView = (viewName, extraOptions = null) => {
    if (viewName === 'forum' && extraOptions?.userId) {
      setActivePrivateChatUserId(extraOptions.userId);
      setInitialPrivateMessage(extraOptions.message || '');
    }

    if (viewName === 'forum' && extraOptions?.threadId) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('threadId', extraOptions.threadId);
      window.history.pushState({}, '', window.location.pathname + '?' + searchParams.toString());
    } else if (viewName !== 'forum') {
      cleanUrlParams(['threadId']);
    }

    if (viewName !== 'agenda' && viewName !== 'studio-events' && !extraOptions?.eventId) {
      cleanUrlParams(['eventId']);
    }

    switch (viewName) {
      case 'dashboard': {
        cleanUrlParams(['eventId', 'threadId']);
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
        setDashboardKey(prev => prev + 1);
        break;
      }
      case 'profile':
      case 'profil':
        setCurrentPole('mon-espace');
        setCurrentTab('profil');
        break;
      case 'mon-parcours':
        setCurrentPole('mon-espace');
        setCurrentTab('mon-parcours');
        break;
      case 'trombinoscope':
        setCurrentPole('mon-espace');
        setCurrentTab('trombinoscope');
        break;
      case 'forum':
        setCurrentPole('mon-espace');
        setCurrentTab('forum');
        break;
      case 'export-annu':
        setCurrentPole('secretariat');
        setCurrentTab('export-annu');
        break;
      case 'reunion-manager':
        setCurrentPole('secretariat');
        setCurrentTab('reunion-manager');
        break;
      case 'activity-reports':
        setCurrentPole('secretariat');
        setCurrentTab('activity-reports');
        break;
      case 'mestre-forum-channels':
        setCurrentPole('secretariat');
        setCurrentTab('mestre-forum-channels');
        break;
      case 'studio-events':
        setCurrentPole('secretariat');
        setCurrentTab('studio-events');
        break;
      case 'varal-secretariat':
        setCurrentPole('secretariat');
        setCurrentTab('varal-secretariat');
        break;
      case 'system-admin':
        setCurrentPole('config');
        setCurrentTab('system-admin');
        break;
      case 'tag-manager':
        setCurrentPole('config');
        setCurrentTab('tag-manager');
        break;
      case 'materiel':
      case 'inventory':
        setCurrentPole('logistique');
        setCurrentTab('inventory');
        break;
      case 'logistics-pupitres':
        setCurrentPole('logistique');
        setCurrentTab('logistics-pupitres');
        break;
      case 'logistics-kits':
        setCurrentPole('logistique');
        setCurrentTab('logistics-kits');
        break;
      case 'vestiaire':
      case 'wardrobe':
      case 'wardrobe-pieces':
      case 'wardrobe-inventory':
        setCurrentPole('costumerie');
        setCurrentTab('wardrobe-pieces');
        break;
      case 'wardrobe-projects':
      case 'wardrobe-couture':
        setCurrentPole('costumerie');
        setCurrentTab('wardrobe-projects');
        break;
      case 'wardrobe-models':
        setCurrentPole('costumerie');
        setCurrentTab('wardrobe-models');
        break;
      case 'wardrobe-supplies':
        setCurrentPole('costumerie');
        setCurrentTab('wardrobe-supplies');
        break;
      case 'wardrobe-tools':
        setCurrentPole('costumerie');
        setCurrentTab('wardrobe-tools');
        break;
      case 'wardrobe-sizes':
        setCurrentPole('costumerie');
        setCurrentTab('wardrobe-sizes');
        break;
      case 'varal-costumerie':
        setCurrentPole('costumerie');
        setCurrentTab('varal-costumerie');
        break;
      case 'orders':
      case 'orders-manager':
        setCurrentPole('logistique');
        setCurrentTab('orders');
        break;
      case 'inventory-projects':
        setCurrentPole('lutherie');
        setCurrentTab('inventory-projects');
        break;
      case 'instrument-models':
        setCurrentPole('lutherie');
        setCurrentTab('instrument-models');
        break;
      case 'inventory-parts':
        setCurrentPole('lutherie');
        setCurrentTab('inventory-parts');
        break;
      case 'inventory-supplies':
        setCurrentPole('lutherie');
        setCurrentTab('inventory-supplies');
        break;
      case 'workshop-tools':
        setCurrentPole('lutherie');
        setCurrentTab('workshop-tools');
        break;
      case 'varal-lutherie':
        setCurrentPole('lutherie');
        setCurrentTab('varal-lutherie');
        break;
      case 'treasury':
        setCurrentPole('tresorerie');
        setCurrentTab('dashboard-finance');
        break;
      case 'kilometric-reimbursement':
        setCurrentPole('tresorerie');
        setCurrentTab('frais-km');
        break;
      case 'reports-exports':
        setCurrentPole('tresorerie');
        setCurrentTab('reports-exports');
        break;
      case 'association-settings':
        setCurrentPole('config');
        setCurrentTab('config-identity');
        break;
      case 'layout-editor':
        setCurrentPole('config');
        setCurrentTab('config-layout');
        break;
      case 'studio-social':
        setCurrentPole('studio');
        setCurrentTab('studio-social');
        break;
      case 'newsletter':
        setCurrentPole('studio');
        setCurrentTab('newsletter');
        break;
      case 'varal-photos':
        setCurrentPole('studio');
        setCurrentTab('varal-photos');
        break;
      case 'varal-pedagogy':
      case 'varal-manager':
        setCurrentPole('pedagogie');
        setCurrentTab('varal-manager');
        break;
      case 'agenda':
        setCurrentPole('accueil');
        setCurrentTab('agenda');
        break;
      case 'varal':
        setCurrentPole('accueil');
        setCurrentTab('varal');
        break;
      case 'mestre-orientation':
        setCurrentPole('mestre');
        setCurrentTab('mestre-orientation');
        break;
      case 'mestre-stage-layout':
        setCurrentPole('mestre');
        setCurrentTab('mestre-stage-layout');
        break;
      case 'mestre-sequenceur':
        setCurrentPole('mestre');
        setCurrentTab('mestre-sequenceur');
        break;
      case 'mestre-events':
        setCurrentPole('mestre');
        setCurrentTab('mestre-events');
        break;
      case 'mestre-mot-mestre':
        setCurrentPole('mestre');
        setCurrentTab('mestre-mot-mestre');
        break;
      case 'secretariat-documents':
        setCurrentPole('secretariat');
        setCurrentTab('secretariat-documents');
        break;
      case 'secretariat-lieux':
        setCurrentPole('secretariat');
        setCurrentTab('secretariat-lieux');
        break;
      case 'logistics-carpool':
        setCurrentPole('logistique');
        setCurrentTab('logistics-carpool');
        break;
      case 'studio-communication':
        setCurrentPole('studio');
        setCurrentTab('studio-communication');
        break;
      default:
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
    }
  };

  return (
    <TerminologyProvider majoriteFeminine={majoriteFeminine}>
      <div style={brandingStyle} className="min-h-screen flex flex-col w-full relative">
        {accessDeniedToast && (
          <div className="fixed top-4 right-4 z-50 bg-amber-900 text-amber-100 font-extrabold text-xs px-4 py-3 rounded-[6px_10px_8px_12px] border-2 border-amber-600 shadow-[3px_3px_0px_0px_#181716] flex items-center gap-2 animate-bounce">
            <span>🔒</span> Accès restreint : vous n'avez pas les droits nécessaires pour accéder à cet espace.
          </div>
        )}
        <LayoutShell 
          logoUrl={branding?.logoUrl} 
          associationName={associationName}
          associationData={associationData}
          sequenceurUrl={sequenceurUrl}
          currentPole={currentPole}
          onNavigateToPole={handleNavigateToPole}
          currentTab={currentTab}
          onNavigateToTab={(tab) => {
            if (tab !== 'forum') {
              cleanUrlParams(['threadId']);
            }
            if (tab !== 'agenda' && tab !== 'studio-events') {
              cleanUrlParams(['eventId']);
            }
            setCurrentTab(tab);
          }}
          onOpenPrivateMessages={handleOpenPrivateMessages}
          polesList={POLES_CONFIG}
          profileData={profileData}
          onSignOut={handleSignOut}
          unreadPrivateMessagesCount={unreadPrivateMessagesCount}
          permissionsMatrice={permissionsMatrice}
          enabledModules={enabledModules}
          activerPresenceEnLigne={activerPresenceEnLigne}
          breakGlassActive={breakGlassActive}
          onToggleBreakGlass={handleToggleBreakGlass}
          tagsDisponibles={tagsDisponibles}
          isBirthdayMonth={isUserBirthdayMonth}
          enableIndividualProgression={associationData?.enableIndividualProgression || false}
        >
          <React.Suspense fallback={
            <div className="flex-1 flex flex-col justify-center items-center py-12">
              <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
              <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                {t('dashboard.loadingPage')}
              </span>
            </div>
          }>
            <ErrorBoundary title={`Section ${currentTab || 'Principale'}`}>
            {activeMestreEventDetails ? (
              <EventDetails 
                event={activeMestreEventDetails}
                user={user}
                profileData={profileData}
                onNavigateToView={handleNavigateToView}
                onClose={() => setActiveMestreEventDetails(null)}
                onGoToStageLayoutEditor={handleGoToStageLayoutEditor}
              />
            ) : currentTab === 'profil' ? (
              <UserProfile 
                user={user} 
                profileData={profileData} 
                associationName={associationName}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : currentTab === 'mon-parcours' ? (
              <MonParcours 
                profileData={profileData}
                sequenceurUrl={sequenceurUrl}
                enabledModules={enabledModules}
              />
            ) : currentTab === 'agenda' ? (
              <WidgetAgenda 
                role={profileData?.role} 
                isSystemAdmin={profileData?.isSystemAdmin} 
                groupId={profileData?.groupId} 
                user={user} 
                profileData={profileData} 
                onNavigateToView={handleNavigateToView} 
                isFullPage={true}
              />
            ) : currentTab === 'atelier' ? (
              <MonAtelier 
                user={user} 
                profileData={profileData} 
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : currentTab === 'materiel' ? (
              <UserMateriel 
                user={user} 
                profileData={profileData} 
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : currentTab === 'vestiaire' ? (
              <MonVestiaire 
                userId={user?.uid} 
                groupId={profileData?.groupId} 
                userChecklist={profileData?.userCostumeChecklist || {}} 
                userSection={profileData?.instrument || ''} 
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : currentTab === 'trombinoscope' ? (
              <Trombinoscope 
                user={user} 
                profileData={profileData} 
                onBack={() => handleNavigateToPole('accueil')} 
                onContactUser={(otherUserId) => {
                  setActivePrivateChatUserId(otherUserId);
                  handleNavigateToView('forum');
                }}
              />
            ) : currentTab === 'forum' ? (
              <Forum 
                user={user} 
                profileData={profileData} 
                onBack={() => handleNavigateToPole('accueil')} 
                activePrivateChatUserId={activePrivateChatUserId}
                initialPrivateMessage={initialPrivateMessage}
                initialTab={forumInitialTab}
                onClearActivePrivateChat={() => {
                  setActivePrivateChatUserId(null);
                  setInitialPrivateMessage('');
                }}
                onOpenStudioForum={() => setCurrentTab('mestre-forum-channels')}
                breakGlassActive={breakGlassActive}
              />
            ) : currentTab === 'atelier-couture' ? (
              <AtelierCouture
                groupId={profileData?.groupId}
                activePiece={activeTutorialPiece}
                onClearActivePiece={() => setActiveTutorialPiece(null)}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (currentTab === 'export-annu' && (hasAccessSecretariat || hasAccessStudio)) ? (
              <AdminExport 
                user={user}
                profileData={profileData}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'system-admin' && hasAccessConfig) ? (
              <SystemAdminPanel 
                user={user} 
                profileData={profileData} 
                associationName={associationName}
                onBack={() => handleNavigateToPole('accueil')} 
                onNavigateToView={handleNavigateToView}
              />
            ) : (currentTab === 'tag-manager' && hasAccessConfig) ? (
              <TagManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => setCurrentTab('export-annu')} 
              />
            ) : (currentTab === 'instruments' && hasAccessConfig) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="instruments-only"
                activeTabProp="organisation"
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (['gigs-pipeline', 'diffusion-contacts'].includes(currentTab) && hasAccessDiffusion) ? (
              <GigsPipelineManager
                groupId={profileData?.groupId}
                initialTab={currentTab === 'diffusion-contacts' ? 'contacts' : 'pipeline'}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (currentTab === 'dashboard-finance' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="dashboard-finance"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'cotisations' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="cotisations"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'events-finances' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="events-finances"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'operations-diverses' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="operations-diverses"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'frais-km' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="frais-km"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'reports-exports' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="reports-exports"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'inventory' && hasAccessLogistique) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="instruments"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'logistics-pupitres' && hasAccessLogistique) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="pupitres"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'logistics-kits' && hasAccessLogistique) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="kits"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'logistics-carpool' && hasAccessLogistique) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="carpool"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (['orders', 'orders-manager'].includes(currentTab) && hasAccessLogistique) ? (
              <OrdersManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'inventory-projects' && hasAccessLutherie) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="projects"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'instrument-models' && hasAccessLutherie) ? (
              <div className="max-w-4xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement des modèles...</div>}>
                  <InstrumentModelsManager 
                    groupId={profileData?.groupId}
                    isAuthorized={hasAccessLutherie}
                    varalCategories={DEFAULT_VARAL_CATEGORIES}
                  />
                </React.Suspense>
              </div>
            ) : (currentTab === 'inventory-parts' && hasAccessLutherie) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="parts"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'inventory-supplies' && hasAccessLutherie) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="supplies"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'workshop-tools' && hasAccessLutherie) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                hasAccessLutherie={hasAccessLutherie}
                profileData={profileData}
                activeTabProp="tools"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'varal-lutherie' && hasAccessLutherie) ? (
              <div className="max-w-4xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Varal Lutherie...</div>}>
                  <WidgetDocuments 
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    poleId="lutherie"
                    userTags={userTags}
                    canWrite={hasAccessLutherie}
                    onNavigateToView={handleNavigateToView}
                  />
                </React.Suspense>
              </div>
            ) : (['wardrobe-projects', 'wardrobe-couture'].includes(currentTab) && hasAccessCostumerie) ? (
              <WardrobeManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessCostumerie={hasAccessCostumerie}
                hasAccessLogistique={hasAccessLogistique}
                activeTabProp="couture"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (currentTab === 'wardrobe-models' && hasAccessCostumerie) ? (
              <div className="max-w-5xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement des modèles de costumes...</div>}>
                  <CostumesAdminManager groupId={profileData?.groupId} />
                </React.Suspense>
              </div>
            ) : (['wardrobe-pieces', 'wardrobe-inventory', 'wardrobe'].includes(currentTab) && hasAccessCostumerie) ? (
              <WardrobeManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessCostumerie={hasAccessCostumerie}
                hasAccessLogistique={hasAccessLogistique}
                activeTabProp="inventory"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (['wardrobe-supplies', 'costumerie-supplies'].includes(currentTab) && hasAccessCostumerie) ? (
              <WardrobeManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessCostumerie={hasAccessCostumerie}
                hasAccessLogistique={hasAccessLogistique}
                activeTabProp="supplies"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (['wardrobe-tools', 'costumerie-tools'].includes(currentTab) && hasAccessCostumerie) ? (
              <WardrobeManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessCostumerie={hasAccessCostumerie}
                hasAccessLogistique={hasAccessLogistique}
                activeTabProp="tools"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (['wardrobe-sizes', 'costumerie-sizes'].includes(currentTab) && hasAccessCostumerie) ? (
              <WardrobeManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessCostumerie={hasAccessCostumerie}
                hasAccessLogistique={hasAccessLogistique}
                activeTabProp="sizes"
                hideSubTabs={true}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (currentTab === 'varal-costumerie' && hasAccessCostumerie) ? (
              <div className="max-w-4xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Varal Costumerie...</div>}>
                  <WidgetDocuments 
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    poleId="costumerie"
                    userTags={userTags}
                    canWrite={hasAccessCostumerie}
                    onNavigateToView={handleNavigateToView}
                  />
                </React.Suspense>
              </div>
            ) : (currentTab === 'studio-events' && (hasAccessSecretariat || hasAccessStudio)) ? (
              <StudioEventsManager 
                groupId={profileData?.groupId}
                user={user}
                profileData={profileData}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'studio-social' && hasAccessStudio) ? (
              <StudioSocial 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                branding={branding}
                user={user}
                profileData={profileData}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'reunion-manager' && (hasAccessSecretariat || hasAccessStudio)) ? (
              <ReunionManager 
                groupId={profileData?.groupId}
                user={user}
                profileData={profileData}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'newsletter' && hasAccessStudio) ? (
              <NewsletterPage
                groupId={profileData?.groupId}
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (currentTab === 'studio-communication' && hasAccessStudio) ? (
              <StudioCommunication 
                groupId={profileData?.groupId}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'activity-reports' && (hasAccessSecretariat || hasAccessStudio)) ? (
              <ActivityReports 
                groupId={profileData?.groupId}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'secretariat-reports' && hasAccessSecretariat) ? (
              <SecretariatReportsView 
                groupId={profileData?.groupId} 
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'secretariat-documents' && hasAccessSecretariat) ? (
              <SecretariatDocuments 
                groupId={profileData?.groupId}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'secretariat-lieux' && hasAccessSecretariat) ? (
              <SecretariatAgendaLieux 
                groupId={profileData?.groupId}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'mestre-forum-channels' && (hasAccessSecretariat || hasAccessStudio || hasAccessMestre || hasAccessForumMod)) ? (
              <ForumChannelsManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'varal-secretariat' && (hasAccessSecretariat || hasAccessStudio)) ? (
              <div className="max-w-4xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Varal Secrétariat...</div>}>
                  <WidgetDocuments 
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    poleId="secretariat"
                    userTags={userTags}
                    canWrite={hasAccessSecretariat}
                    onNavigateToView={handleNavigateToView}
                  />
                </React.Suspense>
              </div>
            ) : (currentTab === 'varal-photos' && hasAccessStudio) ? (
              <div className="max-w-5xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Studio Photos...</div>}>
                  <StudioPhotosView 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    userTags={userTags}
                    canWrite={hasAccessStudio}
                    onNavigateToView={handleNavigateToView}
                    onBack={() => handleNavigateToPole('accueil')}
                  />
                </React.Suspense>
              </div>
            ) : (currentTab === 'mestre-pedagogy-dashboard' && hasAccessPedagogie) ? (
              <MestrePedagogyDashboard 
                profileData={profileData}
                sequenceurUrl={sequenceurUrl}
              />
            ) : (currentTab === 'mestre-pedagogy-manager' && hasAccessPedagogie) ? (
              <MestrePedagogyManager 
                profileData={profileData}
                sequenceurUrl={sequenceurUrl}
              />
            ) : (currentTab === 'mestre-pedagogy-qcm' && hasAccessPedagogie) ? (
              <MestreAutoEvalConfig 
                profileData={profileData}
              />
            ) : (['varal-manager', 'varal-pedagogy'].includes(currentTab) && hasAccessPedagogie) ? (
              <div className="max-w-4xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Varal Pédagogique...</div>}>
                  <WidgetDocuments 
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    poleId="pedagogie"
                    userTags={userTags}
                    canWrite={hasAccessPedagogie}
                    onNavigateToView={handleNavigateToView}
                  />
                </React.Suspense>
              </div>
            ) : (currentTab === 'mestre-orientation' && hasAccessMestre) ? (
              <MestreOrientationCasting 
                user={user}
                profileData={profileData}
                onNavigateToMember={(mId) => {
                  setCurrentTab('trombinoscope');
                }}
              />
            ) : (currentTab === 'mestre-events' && hasAccessMestre) ? (
              <MestreEvents 
                groupId={profileData?.groupId} 
                onSelectForStage={(evt) => {
                  setSelectedMestreEventId(evt.id);
                  setCurrentTab('mestre-stage-layout');
                }} 
                onOpenDetails={(evt) => setActiveMestreEventDetails(evt)}
              />
            ) : (currentTab === 'mestre-stage-layout' && hasAccessMestre) ? (
              <MestreStageLayout 
                groupId={profileData?.groupId}
                user={user}
                profileData={profileData}
                selectedEventId={selectedMestreEventId}
                onSelectEventId={setSelectedMestreEventId}
              />
            ) : (currentTab === 'mestre-sequenceur' && (hasAccessMestre || hasAccessPedagogie)) ? (
              <MestreSequenceur 
                groupId={profileData?.groupId}
                sequenceurUrl={sequenceurUrl}
              />
            ) : (currentTab === 'mestre-mot-mestre' && hasAccessMestre) ? (
              <MestreMotMestre 
                groupId={profileData?.groupId}
                profileData={profileData}
              />
            ) : (currentTab === 'config-identity' && checkTabAccess('config-identity', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="identity"
                mode="identity-only"
                onBack={() => handleNavigateToPole('accueil')} 
                onReopenOnboarding={() => setShowOnboardingWizard(true)}
              />
            ) : (currentTab === 'config-security' && checkTabAccess('config-security', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="security"
                mode="security-only"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-layout' && checkTabAccess('config-layout', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="apparence"
                mode="apparence-only"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-profile' && checkTabAccess('config-profile', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="profile-fields-only"
                activeTabProp="organisation"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-modules' && checkTabAccess('config-modules', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="modules"
                mode="modules-only"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (['vitrine-editor', 'vitrine-general', 'vitrine-presentation', 'vitrine-organisateur', 'vitrine-galerie', 'vitrine-recrutement', 'vitrine-reseaux', 'vitrine-apparence'].includes(currentTab) && checkTabAccess('vitrine-editor', 'vitrine')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                profileData={profileData}
                permissionsMatrice={permissionsMatrice}
                effectiveUserTags={userTags}
                mode="public-theme-only"
                activeTabProp="public-theme"
                vitrineSubTabProp={currentTab ? currentTab.replace('vitrine-', '') : 'general'}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : currentTab === 'agenda' ? (
              <div className="max-w-4xl mx-auto w-full">
                <WidgetAgenda 
                  role={profileData?.role} 
                  isSystemAdmin={profileData?.isSystemAdmin} 
                  groupId={profileData?.groupId} 
                  user={user} 
                  profileData={profileData} 
                  onFocusModeChange={(isFocused) => {
                    if (!isFocused) handleNavigateToView('dashboard');
                  }}
                  onNavigateToView={handleNavigateToView}
                />
              </div>
            ) : currentTab === 'varal' ? (
              <div className="max-w-4xl mx-auto w-full">
                <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">Chargement du Varal...</div>}>
                  <WidgetDocuments 
                    role={profileData?.role} 
                    isSystemAdmin={profileData?.isSystemAdmin} 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    userTags={userTags}
                    canWrite={profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true}
                    onNavigateToView={handleNavigateToView}
                  />
                </React.Suspense>
              </div>
            ) : (
              <Dashboard 
                key={dashboardKey}
                user={user} 
                profileData={profileData} 
                onNavigateToTrombi={() => handleNavigateToView('trombinoscope')} 
                onNavigateToView={handleNavigateToView}
                onSignOut={handleSignOut} 
                installPromptAvailable={installPromptAvailable}
                onTriggerInstall={triggerInstallPrompt}
                permissionsMatrice={permissionsMatrice}
                breakGlassActive={breakGlassActive}
                tagsDisponibles={tagsDisponibles}
              />
            )}
            </ErrorBoundary>
          </React.Suspense>

          {/* Assistant de Premier Démarrage (Wizard Onboarding Mestre/Bureau) */}
          <React.Suspense fallback={null}>
            <OnboardingWizard
              isOpen={showOnboardingWizard}
              onClose={() => setShowOnboardingWizard(false)}
              groupId={profileData?.groupId || (new URLSearchParams(window.location.search).get('groupe'))}
              associationSettings={associationData || {}}
              onCompleteSuccess={() => setShowOnboardingWizard(false)}
            />
          </React.Suspense>
        </LayoutShell>
        <ReloadPrompt />
      </div>
    </TerminologyProvider>
  );
}
