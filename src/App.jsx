import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, getDocFromServer, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LayoutShell from './components/LayoutShell';
import { TerminologyProvider } from './components/TerminologyContext';
import { useTranslation } from './components/LanguageContext';
import { LicenseProvider } from './context/LicenseContext';
import { ViewSimulatorProvider } from './context/ViewSimulatorContext';
import ReloadPrompt from './components/ReloadPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import VitrineRouteShell from './components/public/VitrineRouteShell';
import { tracker } from './utils/O-Girador-Tracker';
import { useAppUpdate } from './hooks/useAppUpdate';
import { useConversations } from './hooks/useConversations';
import { useShareTarget } from './hooks/useShareTarget';
import useDynamicFavicon from './hooks/useDynamicFavicon';
import useDynamicManifest, { getCachedAssoName, saveCachedAssoName } from './hooks/useDynamicManifest';
import LoadingSeal from './components/common/LoadingSeal';
import ShareTargetModal from './components/share/ShareTargetModal';
import { lazyWithRetry } from './utils/pwaUtils';
import { resolveEffectiveUserTags } from './utils/tagUtils';
import { getMigratedRoleAndTags } from './utils/roleMigration';
import { canAccessPole, canAccessTabPermission, canAccessMestre, canPublishAnnonces } from './utils/permissionUtils';
import PendingValidationScreen from './components/auth/PendingValidationScreen';
import ArchivedAccountScreen from './components/auth/ArchivedAccountScreen';
import ProfileNetworkRetryScreen, { hasKnownCompletedProfile, markKnownCompletedProfile, checkIsProfileComplete } from './components/auth/ProfileNetworkRetryScreen';
import { ensureDualCombinedSealsIfMissing } from './utils/sealStorageSync';
import { isMemberArchived } from './utils/memberUtils';
import { useTenantContext } from './context/TenantContext';
import DemoTopBanner from './components/demo/DemoTopBanner';
import { canonicalizeGroupId, isSameGroupCaseInsensitive, isCustomDomainHost, registerCanonicalGroupId, saveLastKnownTenantId, getLastKnownTenantId, getCachedDomainGroupId, resolveCanonicalGroupFromFirestore } from './utils/tenantUtils';
import { isLockedVitrineHost, sanitizeLockedVitrinePathname, resolveIsVitrineMode, isPublicVolunteerRoute } from './utils/vitrineLockUtils';
import { buildFounderEmergencyProfile, resolveAdminFallbackGroupId, isSystemSuperAdminIdentity, isEmergencyFounderIdentity, EMERGENCY_FOUNDER_UID } from './utils/founderFallbackUtils';
import { reconcilePreExistingMember } from './services/memberService';
import { isDemoMode, initDemoSession, getDemoAuthUser, getDemoProfileData } from './demo/demoManager';
import { resolveInternalDestination, extractDeepLinkTarget, INTERNAL_APP_ROUTE_PREFIXES, isExternalActionLink } from './utils/megaphoneNavigationUtils';

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
const StudioLexiqueManager = lazyWithRetry(() => import('./components/studio/StudioLexiqueManager'));
const StudioEventsManager = lazyWithRetry(() => import('./components/studio/StudioEventsManager'));
const NewsletterPage = lazyWithRetry(() => import('./components/studio/NewsletterPage'));
const AdminExport = lazyWithRetry(() => import('./components/AdminExport'));
const ReunionManager = lazyWithRetry(() => import('./components/ReunionManager'));
const EventDetails = lazyWithRetry(() => import('./components/EventDetails'));
const MestreOrientationCasting = lazyWithRetry(() => import('./components/mestre/MestreOrientationCasting'));
const MestreStageLayout = lazyWithRetry(() => import('./components/mestre/MestreStageLayout'));
const SecretariatDocuments = lazyWithRetry(() => import('./components/secretariat/SecretariatDocuments'));
const SecretariatReportsView = lazyWithRetry(() => import('./components/secretariat/SecretariatReportsView'));
const StudioCommunication = lazyWithRetry(() => import('./components/studio/StudioCommunication'));
const StudioPhotosView = lazyWithRetry(() => import('./components/studio/StudioPhotosView'));
const GigsPipelineManager = lazyWithRetry(() => import('./components/diffusion/GigsPipelineManager'));
const MestreMotMestre = lazyWithRetry(() => import('./components/mestre/MestreMotMestre'));
const MestreCustomCategories = lazyWithRetry(() => import('./components/mestre/MestreCustomCategories'));
const MestrePedagogyDashboard = lazyWithRetry(() => import('./components/mestre/MestrePedagogyDashboard'));
const MestreRepertoireView = lazyWithRetry(() => import('./components/mestre/MestreRepertoireView'));
const MestreAutoEvalConfig = lazyWithRetry(() => import('./components/mestre/MestreAutoEvalConfig'));
const WidgetAgenda = lazyWithRetry(() => import('./components/WidgetAgenda'));
const WidgetDocuments = lazyWithRetry(() => import('./components/WidgetDocuments'));
const WidgetTreasury = lazyWithRetry(() => import('./components/WidgetTreasury'));
const InstrumentModelsManager = lazyWithRetry(() => import('./components/varal/InstrumentModelsManager'));
const MonParcours = lazyWithRetry(() => import('./components/pedagogy/MonParcours'));
const MonAtelier = lazyWithRetry(() => import('./components/profile/MonAtelier'));
const MemberRepertoireView = lazyWithRetry(() => import('./components/member/MemberRepertoireView'));

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
      { id: 'repertoire', label: 'Répertoire', labelKey: 'tabRepertoire' },
      { id: 'atelier', label: 'Atelier', labelKey: 'tabAtelier' },
      { id: 'materiel', label: 'Instruments', labelKey: 'tabMateriel' },
      { id: 'vestiaire', label: 'Vestiaire', labelKey: 'tabVestiaire' },
      { id: 'trombinoscope', label: 'Trombinoscope', labelKey: 'tabTrombinoscope' },
      { id: 'forum', label: 'Porte-voix', labelKey: 'tabForum' },
      { id: 'varal', label: 'Varal', labelKey: 'tabVaral' }
    ]
  },
  {
    id: 'gouvernance',
    label: 'Gouvernance',
    labelKey: 'poles.gouvernance',
    defaultTab: 'ca-reunions',
    tabs: [
      { id: 'ca-reunions', label: 'Réunions & PV', labelKey: 'tabCaReunions' },
      { id: 'ca-reports', label: 'Bilans & Rapports AG', labelKey: 'tabCaReports' },
      { id: 'ca-documents', label: 'Registre & Statuts', labelKey: 'tabCaDocuments' },
      { id: 'ca-finances', label: 'Synthèse Financière', labelKey: 'tabCaFinances' },
      { id: 'ca-prestations', label: 'Dates & Engagements', labelKey: 'tabCaPrestations' }
    ]
  },
  {
    id: 'secretariat',
    label: 'Secrétariat',
    labelKey: 'poles.secretariat',
    tabs: [
      { id: 'export-annu', label: 'Annuaire & Exports', labelKey: 'tabExportAnnu' },
      { id: 'studio-events', label: 'Registre des dates', labelKey: 'tabStudioEvents' },
      { id: 'varal-secretariat', label: 'Documents officiels', labelKey: 'tabVaralSecretariat' },
      { id: 'secretariat-documents', label: 'Chartes, Santé & Liens', labelKey: 'tabSecretariatDocuments' }
    ]
  },
  {
    id: 'diffusion',
    label: 'Diffusion',
    labelKey: 'poles.diffusion',
    tabs: [
      { id: 'gigs-pipeline', label: 'Prestations & Contacts CRM', labelKey: 'tabGigsPipeline' }
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
      { id: 'inventory', label: 'Parc Instruments & Cautions', labelKey: 'tabInventory' },
      { id: 'orders', label: 'Commandes Groupées', labelKey: 'tabOrders' },
      { id: 'logistics-carpool', label: 'Convois & Flotte Véhicules', labelKey: 'tabLogisticsCarpool' },
      { id: 'logistics-kits', label: 'Malles Régie & Trousses Secours', labelKey: 'tabLogisticsKits' }
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
      { id: 'studio-social', label: 'Réseaux & Médias', labelKey: 'tabStudioSocial' },
      { id: 'newsletter', label: "Lettres d'info", labelKey: 'tabNewsletter' },
      { id: 'varal-photos', label: 'Médiathèque Photos', labelKey: 'tabVaralPhotos' },
      { id: 'studio-communication', label: 'Communication & Brevo', labelKey: 'tabStudioCommunication' },
      { id: 'studio-lexique', label: 'Lexique & Mentions', labelKey: 'tabStudioLexique' }
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
      { id: 'mestre-repertoire', label: '📜 Répertoire', labelKey: 'tabMestreRepertoire' },
      { id: 'mestre-orientation', label: 'Casting & Orientation', labelKey: 'tabMestreOrientation' },
      { id: 'mestre-stage-layout', label: 'Plan de Scène', labelKey: 'tabMestreStage' },
      { id: 'mestre-mot-mestre', label: 'Annonces du Mestre', labelKey: 'tabMestreMotMestre' }
    ]
  },
  {
    id: 'vitrine',
    label: 'Vitrine',
    labelKey: 'poles.vitrine',
    tabs: [
      { id: 'vitrine-general', label: 'Général & SEO', labelKey: 'tabVitrineGeneral' },
      { id: 'vitrine-presentation', label: 'Présentation', labelKey: 'tabVitrinePresentation' },
      { id: 'vitrine-organisateur', label: 'Organisateur & Technique', labelKey: 'tabVitrineOrganisateur' },
      { id: 'vitrine-galerie', label: 'Galerie Photo', labelKey: 'tabVitrineGalerie' },
      { id: 'vitrine-recrutement', label: 'Recrutement & Vie Associative', labelKey: 'tabVitrineRecrutement' },
      { id: 'vitrine-reseaux', label: 'Réseaux & Newsletter', labelKey: 'tabVitrineReseaux' },
      { id: 'vitrine-apparence', label: 'Apparence', labelKey: 'tabVitrineApparence' }
    ]
  },
  {
    id: 'config',
    label: 'Configuration',
    labelKey: 'poles.config',
    tabs: [
      { id: 'config-identity', label: 'Identité légale & Juridique', labelKey: 'tabConfigIdentity' },
      { id: 'config-profile', label: 'Inscription, Profils & Pupitres', labelKey: 'tabConfigProfile' },
      { id: 'config-agenda', label: 'Agenda & Lieux', labelKey: 'tabConfigAgenda' },
      { id: 'config-security', label: 'Badges, Rôles & Sécurité', labelKey: 'tabConfigSecurity' },
      { id: 'config-comms', label: 'Communication, E-mails & Automatisations', labelKey: 'tabConfigComms' },
      { id: 'config-modules', label: 'Modules SaaS, Apparence & Médias', labelKey: 'tabConfigModules' }
    ]
  }
];

export default function App() {
  useAppUpdate();

  // Gestion du routage dynamique (/ vitrine public, /app espace membre, /login connexion)
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      return sanitizeLockedVitrinePathname(window.location.hostname, window.location.pathname || '/');
    }
    return '/';
  });

  // Nettoyage silencieux de l'URL au montage (_upd et routes privées résiduelles sur domaine Vitrine verrouillé)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        let mutated = false;
        if (url.searchParams.has('_upd')) {
          url.searchParams.delete('_upd');
          mutated = true;
        }
        const safePath = sanitizeLockedVitrinePathname(url.hostname, url.pathname);
        if (safePath !== url.pathname) {
          url.pathname = safePath;
          mutated = true;
        }
        if (mutated) {
          window.history.replaceState({}, document.title, url.pathname + (url.search || '') + url.hash);
        }
      } catch {}
    }
  }, []);

  // ✂️ Rétrocompatibilité Mostrador : migration automatique et silencieuse de ?tenant=xxx vers /xxx
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hostname = window.location.hostname || '';
      if (hostname.includes('mostrador')) {
        const url = new URL(window.location.href);
        if (!isPublicVolunteerRoute(url.pathname)) {
          const legacyTenant = url.searchParams.get('tenant') || url.searchParams.get('groupe') || url.searchParams.get('groupId') || url.searchParams.get('assoc');
          if (legacyTenant) {
            const cleanTenant = legacyTenant.trim().toLowerCase();
            ['tenant', 'groupe', 'groupId', 'assoc'].forEach((k) => url.searchParams.delete(k));
            const remainingSearch = url.searchParams.toString();
            const cleanPath = `/${encodeURIComponent(cleanTenant)}`;
            window.history.replaceState({}, document.title, cleanPath + (remainingSearch ? `?${remainingSearch}` : '') + url.hash);
            setCurrentRoute(cleanPath);
          }
        }
      }
    } catch {}
  }, []);

  const { appMode, groupId: urlGroupId, isTenantLoading, tenantError } = useTenantContext();
  const { t } = useTranslation();

  // Initialisation automatique du mode démo local si la route /demo ou ?demo=true est présente
  if (typeof window !== 'undefined' && isDemoMode()) {
    initDemoSession();
  }

  const [user, setUser] = useState(() => (isDemoMode() ? getDemoAuthUser() : null));
  const [loading, setLoading] = useState(() => (isDemoMode() ? false : true));
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileExists, setProfileExists] = useState(() => (isDemoMode() ? true : null));
  const [profileNetworkWaiting, setProfileNetworkWaiting] = useState(false);
  const [profileData, setProfileData] = useState(() => (isDemoMode() ? getDemoProfileData() : null));
  const isWaitingForProfile = Boolean(user && profileData === null && profileExists !== false && !profileNetworkWaiting);
  const [branding, setBranding] = useState(null);
  const [associationName, setAssociationName] = useState('');
  const [majoriteFeminine, setMajoriteFeminine] = useState(false);
  const [sequenceurUrl, setSequenceurUrl] = useState('');
  const [permissionsMatrice, setPermissionsMatrice] = useState(null);
  const [enabledModules, setEnabledModules] = useState(null);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [activerPresenceEnLigne, setActiverPresenceEnLigne] = useState(true);
  const [features, setFeatures] = useState(null);
  const [breakGlassActive, setBreakGlassActive] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('breakGlassActive') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const isSystemOrSuperAdminOrMestre = Boolean(
    isSystemSuperAdminIdentity(profileData, user) ||
    profileData?.canViewAll ||
    ['mestre', 'admin'].includes((profileData?.role || '').toLowerCase())
  );
  const isMasterKeyActive = isSystemOrSuperAdminOrMestre && breakGlassActive;

  const handleToggleBreakGlass = () => {
    setBreakGlassActive(prev => {
      const nextVal = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('breakGlassActive', String(nextVal));
        } catch {}
      }
      return nextVal;
    });
  };

  const navigateToRoute = (route) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route + window.location.search);
    }
  };

  // Capture de la cible Deep Link initiale au montage (avant tout nettoyage d'URL)
  const initialDeepLinkRef = useRef(
    typeof window !== 'undefined' ? (window.location.pathname || '') + (window.location.search || '') : ''
  );

  const [currentPole, setCurrentPole] = useState(() => {
    if (typeof window === 'undefined') return 'accueil';
    const dest = resolveInternalDestination((window.location.pathname || '') + (window.location.search || ''));
    return dest?.poleId || 'accueil';
  });
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const dest = resolveInternalDestination((window.location.pathname || '') + (window.location.search || ''));
    return dest?.tabId || 'dashboard';
  });
  const [selectedMestreEventId, setSelectedMestreEventId] = useState(null);
  const [activeMestreEventDetails, setActiveMestreEventDetails] = useState(null);

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
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [latestUnreadSenderId, setLatestUnreadSenderId] = useState(null);
  const [forumInitialTab, setForumInitialTab] = useState('discussions');
  const [initialPrivateMessage, setInitialPrivateMessage] = useState('');
  const [dashboardKey, setDashboardKey] = useState(0); const [loginSelectedGroupId, setLoginSelectedGroupId] = useState('');

  // Hook centralisé de gestion des conversations et des compteurs de non-lus
  const {
    createDirectConversation,
    totalUnreadCount: unreadConversationsCount
  } = useConversations(user, profileData?.groupId, profileData);

  // Réception des contenus partagés via l'API Web Share Target
  const { sharedPayload, clearShareTarget } = useShareTarget(user, profileData);

  // Redirection directe vers la messagerie privée (avec interlocuteur ou conversation spécifique si disponible)
  const handleOpenPrivateMessages = useCallback((senderId = null, conversationId = null) => {
    const targetUserId = senderId || latestUnreadSenderId;
    setForumInitialTab('inbox');
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
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

  // Détection stricte et verrouillage inconditionnel du mode Vitrine Publique (Mostrador)
  const isVitrineMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname || '';
    if (resolveIsVitrineMode({
      hostname,
      pathname: currentRoute || window.location.pathname || '',
      search: window.location.search || '',
      appMode
    })) {
      return true;
    }
    const customDomainList = [];
    if (associationData?.customDomain) customDomainList.push(associationData.customDomain);
    if (Array.isArray(associationData?.customDomains)) customDomainList.push(...associationData.customDomains);
    return customDomainList.some(d => d && (hostname === d || hostname.replace(/^www\./, '') === d.replace(/^www\./, '')));
  }, [appMode, currentRoute, associationData]);

  // Hook modulaire générant dynamiquement le favicon :
  // - Mode pure pour Mostrador (logo de l'association seul)
  // - Mode composite pour Organizador (anneau gravé O Girador x Association)
  const effectiveFaviconAssociationData = useMemo(() => {
    if (associationData) return associationData;
    if (associationName || branding?.logoUrl) {
      return {
        nom: associationName,
        name: associationName,
        logoUrl: branding?.logoUrl,
        branding
      };
    }
    // Détection d'un groupe spécifique dans les paramètres d'URL
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlGroup = searchParams.get('groupe') || searchParams.get('tenant') || searchParams.get('assoc') || urlGroupId;
      if (urlGroup) {
        const cleanGroup = canonicalizeGroupId(urlGroup);
        return {
          id: cleanGroup,
          groupId: cleanGroup,
          nom: cleanGroup,
          name: cleanGroup
        };
      }
    }
    return null;
  }, [associationData, associationName, branding, urlGroupId]);

  useDynamicFavicon(effectiveFaviconAssociationData, { isPureLogo: isVitrineMode });

  const isAdministrativeUser = Boolean(
    profileData?.isSystemAdmin || 
    ['super-admin', 'mestre', 'admin'].includes((profileData?.role || '').toLowerCase()) ||
    isSystemOrSuperAdminOrMestre
  );

  useEffect(() => {
    tracker.init({
      appId: 'manager',
      groupId: profileData?.groupId || 'public',
      appVersion: '1.2.1'
    });
  }, [profileData?.groupId]);

  // Tracking du cycle de vie et de session (désactivé en mode Vitrine publique)
  useEffect(() => {
    if (!isVitrineMode && user && profileData) {
      tracker.startSession(profileData, 'manager', profileData.groupId);
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') tracker.endSession('manager', profileData.groupId);
        else if (document.visibilityState === 'visible') tracker.startSession(profileData, 'manager', profileData.groupId);
      };
      const handleBeforeUnload = () => tracker.endSession('manager', profileData.groupId);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        tracker.endSession('manager', profileData.groupId);
      };
    }
  }, [user, profileData, isVitrineMode]);

  // Charger branding en temps réel (domaine Vitrine prioritaire en Mostrador, sinon profil connecté ou URL)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const host = typeof window !== 'undefined' ? (window.location.hostname || '') : '';
    const urlResolved = sp.get('groupe') || sp.get('tenant') || sp.get('assoc') || urlGroupId;
    let activeGroupId = isVitrineMode
      ? canonicalizeGroupId((isCustomDomainHost(host) ? (urlGroupId || getCachedDomainGroupId(host)) : null) || urlResolved || null)
      : canonicalizeGroupId(profileData?.groupId || loginSelectedGroupId || urlResolved || (!user ? getLastKnownTenantId() : null) || null);

    if (!activeGroupId) {
      setAssociationData(null);
      setBranding(null);
      setAssociationName('');
      setMajoriteFeminine(false);
      setSequenceurUrl('');
      setPermissionsMatrice(null);
      return;
    }

    const applyAssociationPayload = (docId, data, cachedFallbackName) => {
      registerCanonicalGroupId(docId);
      saveLastKnownTenantId(docId);
      setAssociationData({ id: docId, groupId: docId, ...data });
      if (data.branding) setBranding({ ...data.branding, combinedLogoUrl: data.branding.combinedLogoUrl || data.combinedLogoUrl || '', combinedLogoMaskableUrl: data.branding.combinedLogoMaskableUrl || data.combinedLogoMaskableUrl || '' });
      else if (data.logoUrl || data.combinedLogoUrl) setBranding({ logoUrl: data.logoUrl || '', combinedLogoUrl: data.combinedLogoUrl || '', combinedLogoMaskableUrl: data.combinedLogoMaskableUrl || '' });
      else setBranding(null);
      const resolvedAssoName = data.nom || data.name || cachedFallbackName || '';
      setAssociationName(resolvedAssoName);
      if (resolvedAssoName) saveCachedAssoName(docId, resolvedAssoName);
      setMajoriteFeminine(Boolean(data.majoriteFeminine ?? data.majorityFemale ?? false));
      setSequenceurUrl(data.sequenceurUrl || '');
      setPermissionsMatrice(data.permissionsMatrice || null);
      setEnabledModules(data.enabledModules || null);
      setTagsDisponibles(Array.isArray(data.tagsDisponibles) ? data.tagsDisponibles : []);
      setActiverPresenceEnLigne(data.activerPresenceEnLigne !== false);
      setFeatures(data.features || null);

      if (typeof window !== 'undefined') {
        const logoToCache = data.branding?.combinedLogoUrl || data.combinedLogoUrl || data.branding?.logoUrl || data.logoUrl || '';
        if (logoToCache) {
          try {
            localStorage.setItem('og_cached_loader_logo', logoToCache);
            localStorage.setItem('og_cached_loader_group', docId || '');
          } catch {}
        }
      }
    };

    const cachedAssoForGroup = getCachedAssoName(activeGroupId);
    setAssociationName(cachedAssoForGroup || '');

    const assocRef = doc(db, 'associations', activeGroupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists() && (docSnap.data()?.nom || docSnap.data()?.name || docSnap.data()?.ownerUid)) {
        applyAssociationPayload(docSnap.id, docSnap.data(), cachedAssoForGroup);
      } else {
        resolveCanonicalGroupFromFirestore(db, activeGroupId).then((res) => {
          if (res.exists && res.canonicalId && res.data) {
            applyAssociationPayload(res.canonicalId, res.data, cachedAssoForGroup);
            return;
          }
          if (docSnap.exists()) {
            applyAssociationPayload(docSnap.id, docSnap.data(), cachedAssoForGroup);
            return;
          }
          setAssociationData(null);
          setBranding(null);
          setAssociationName(cachedAssoForGroup || '');
          setMajoriteFeminine(false);
          setSequenceurUrl('');
          setPermissionsMatrice(null);
          setEnabledModules(null);
          setTagsDisponibles([]);
          setActiverPresenceEnLigne(true);
          setFeatures(null);
        }).catch(() => {});
      }
    }, (error) => {
      console.error("App - Erreur onSnapshot branding :", error);
      setAssociationData(null);
      setBranding(null);
      setAssociationName(cachedAssoForGroup || '');
      setMajoriteFeminine(false);
      setSequenceurUrl('');
      setPermissionsMatrice(null);
      setTagsDisponibles([]);
      setFeatures(null);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, profileData?.uid, user?.uid, urlGroupId, appMode, loginSelectedGroupId, isVitrineMode]);

  // Déclenchement automatique de l'assistant d'onboarding uniquement pour une association neuve non encore configurée
  useEffect(() => {
    const hasConfiguredIdentity = Boolean(associationData?.branding?.logoUrl || associationData?.logoUrl || associationData?.combinedLogoUrl || associationData?.customDomains?.length);
    if (!isVitrineMode && user && isAdministrativeUser && associationData) {
      ensureDualCombinedSealsIfMissing(associationData.id, associationData, true);
      if (associationData.onboardingCompleted === false && !hasConfiguredIdentity && !hasTriggeredOnboardingAuto) {
        setShowOnboardingWizard(true); setHasTriggeredOnboardingAuto(true);
      }
    }
  }, [isVitrineMode, user, isAdministrativeUser, associationData, hasTriggeredOnboardingAuto]);

  // Titre dynamique multi-associations ("Organizador — [Asso]" ou "Organizador") et manifest HTTPS dynamique
  const resolvedManifestGroupId = useMemo(() => {
    const fromActive = !isVitrineMode ? (associationData?.id || canonicalizeGroupId(profileData?.groupId || loginSelectedGroupId || null) || '') : '';
    if (fromActive) return fromActive;
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    return canonicalizeGroupId(urlGroupId || sp?.get('groupe') || sp?.get('tenant') || sp?.get('assoc') || null) || '';
  }, [isVitrineMode, associationData?.id, profileData?.groupId, loginSelectedGroupId, urlGroupId]);
  useDynamicManifest({ groupId: resolvedManifestGroupId, associationName, currentRoute, isVitrineMode });

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
    
    if (!isVitrineMode && !window.history.state) {
      window.history.replaceState(
        { currentPole: currentPole || 'accueil', currentTab: currentTab || 'dashboard' },
        '',
        window.location.pathname + window.location.search
      );
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isVitrineMode]);

  // Pousser l'état de navigation dans l'historique lors d'un changement d'onglet ou pôle (hors Vitrine)
  useEffect(() => {
    if (isVitrineMode) return;
    const currentState = window.history.state;
    if (!currentState || currentState.currentPole !== currentPole || currentState.currentTab !== currentTab) {
      window.history.pushState({ currentPole, currentTab }, '', window.location.pathname + window.location.search);
    }
  }, [currentPole, currentTab, isVitrineMode]);

  // Écoute de l'événement global de passerelle vers une fiche Répertoire
  useEffect(() => {
    const handleOpenRepertoirePiece = (e) => {
      const pieceId = e.detail?.pieceId;
      if (pieceId) {
        const isMestre = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.role === 'admin' || isMasterKeyActive;
        if (isMestre) {
          setCurrentPole('mestre');
          setCurrentTab('mestre-repertoire');
        } else {
          setCurrentPole('mon-espace');
          setCurrentTab('repertoire');
        }
      }
    };
    window.addEventListener('open-repertoire-piece', handleOpenRepertoirePiece);
    return () => window.removeEventListener('open-repertoire-piece', handleOpenRepertoirePiece);
  }, [profileData?.role, isMasterKeyActive]);

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

  // Bascule automatique d'association sur lien d'invitation dans Organizador (strictement inactif sur Mostrador)
  useEffect(() => {
    if (!isVitrineMode && user && profileData) {
      const searchParams = new URLSearchParams(window.location.search);
      const rawUrlGroupId = searchParams.get('groupe') || searchParams.get('tenant') || searchParams.get('assoc');
      if (rawUrlGroupId) {
        const canonicalUrlGroupId = canonicalizeGroupId(rawUrlGroupId);
        const currentCanonicalGroupId = canonicalizeGroupId(profileData.groupId);

        const cleanGroupParamsFromUrl = () => {
          searchParams.delete('groupe');
          searchParams.delete('tenant');
          searchParams.delete('assoc');
          const remaining = searchParams.toString();
          const newUrl = window.location.pathname + (remaining ? `?${remaining}` : '');
          window.history.replaceState(window.history.state || {}, document.title, newUrl);
        };

        // N'écraser le groupe que si l'invitation cible un groupe RÉELLEMENT distinct (insensible à la casse)
        if (canonicalUrlGroupId && !isSameGroupCaseInsensitive(canonicalUrlGroupId, currentCanonicalGroupId)) {
          const userRef = doc(db, 'users', user.uid);
          updateDoc(userRef, { groupId: canonicalUrlGroupId })
            .then(() => {
              cleanGroupParamsFromUrl();
            })
            .catch((err) => {
              console.error("App - Erreur association groupe automatique :", err);
            });
        } else {
          cleanGroupParamsFromUrl();
        }
      }
    }
  }, [isVitrineMode, user, profileData]);

  // Gestion du Deep Linking automatique pour les notifications Push FCM (désactivé sur tout domaine Vitrine)
  useEffect(() => {
    if (isVitrineMode || (typeof window !== 'undefined' && isLockedVitrineHost(window.location.hostname)) || !user || !profileData) return;
    const canUserAccessTresorerie = Boolean(
      isSystemOrSuperAdminOrMestre || isMasterKeyActive ||
      canAccessPole('tresorerie', profileData, permissionsMatrice, resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles)) ||
      canAccessTabPermission('dashboard-finance', 'tresorerie', profileData, permissionsMatrice, resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles))
    );
    const handleDeepLinkNavigation = (overridePath) => {
      if (typeof window !== 'undefined' && isLockedVitrineHost(window.location.hostname)) return;
      const currentBrowserUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
      const rawPath = overridePath || initialDeepLinkRef.current || currentBrowserUrl;
      if (!rawPath) return;

      if (!overridePath && initialDeepLinkRef.current) {
        initialDeepLinkRef.current = '';
      }

      const { searchParams, targetFromQuery } = extractDeepLinkTarget(rawPath);
      if (targetFromQuery) {
        searchParams.delete('target');
        searchParams.delete('redirect');
        searchParams.delete('url');
        searchParams.delete('destination');
      }

      const resolved = resolveInternalDestination(rawPath, { hasAccessTresorerie: canUserAccessTresorerie });
      const eventId = resolved?.eventId || null;
      const threadId = resolved?.threadId || null;

      if (resolved) {
        setCurrentPole(resolved.poleId);
        setCurrentTab(resolved.tabId);

        if (resolved.tabId === 'agenda') {
          if (eventId) searchParams.set('eventId', eventId);
          if (resolved.eventTab) searchParams.set('tab', resolved.eventTab);
        } else if (resolved.tabId === 'forum') {
          if (resolved.forumInitialTab) setForumInitialTab(resolved.forumInitialTab);
          if (resolved.conversationId) setActiveConversationId(resolved.conversationId);
          if (resolved.chatUserId) setActivePrivateChatUserId(resolved.chatUserId);
          if (threadId) searchParams.set('threadId', threadId);
        } else if (resolved.scrollToId) {
          setTimeout(() => {
            document.getElementById(resolved.scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }

      setCurrentRoute('/app');
      const finalQuery = searchParams.toString();
      const finalUrl = '/app' + (finalQuery ? `?${finalQuery}` : '');
      if (typeof window !== 'undefined') {
        const nextHistoryState = {
          ...(window.history.state || {}),
          ...(resolved ? { currentPole: resolved.poleId, currentTab: resolved.tabId } : {}),
          eventId,
          threadId
        };
        window.history.replaceState(nextHistoryState, '', finalUrl);
        if (eventId) {
          window.dispatchEvent(new PopStateEvent('popstate', { state: nextHistoryState }));
        }
      }
    };

    handleDeepLinkNavigation();

    const handlePopState = () => handleDeepLinkNavigation();
    window.addEventListener('popstate', handlePopState);

    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK' && event.data.url) {
        handleDeepLinkNavigation(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [isVitrineMode, user, profileData, isSystemOrSuperAdminOrMestre, isMasterKeyActive, permissionsMatrice, tagsDisponibles]);

  // Synchroniser le compteur de messages non lus (hors Vitrine publique)
  useEffect(() => {
    if (isVitrineMode || !user?.uid) {
      setUnreadPrivateMessagesCount(0);
      setLatestUnreadSenderId(null);
      return;
    }

    let unreadLegacyCount = 0;
    let unreadConvCount = 0;
    let latestSender = null;

    const updateCombinedUnread = (legacyCount, convCount, senderId) => {
      setUnreadPrivateMessagesCount(legacyCount + convCount);
      if (senderId) {
        setLatestUnreadSenderId(senderId);
      }
    };

    // 1. Écoute des messages directs legacy
    const messagesRef = collection(db, 'private_messages');
    const qLegacy = query(
      messagesRef, 
      where('recipientId', '==', user.uid), 
      where('read', '==', false)
    );
    const unsubLegacy = onSnapshot(qLegacy, (snap) => {
      unreadLegacyCount = snap.size;
      if (!snap.empty) {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        latestSender = docs[0]?.senderId || null;
      }
      updateCombinedUnread(unreadLegacyCount, unreadConvCount, latestSender);
    }, (err) => {
      console.error("App - Erreur écoute messages privés legacy :", err);
    });

    // 2. Écoute des conversations modernes (groupes et directes) avec isolation multi-tenant
    let unsubConv = () => {};
    if (user?.uid) {
      try {
        const convRef = collection(db, 'conversations');
        const qConv = query(
          convRef,
          where('participantIds', 'array-contains', user.uid)
        );

        unsubConv = onSnapshot(qConv, (snap) => {
          let count = 0;
          let newestConvTime = 0;
          let newestSender = null;

          snap.forEach(docSnap => {
            const data = docSnap.data();
            const matchesGroup = !profileData?.groupId || !data.groupId ||
              String(data.groupId).toLowerCase() === String(profileData.groupId).toLowerCase();

            if (!matchesGroup) return;

            const lastMsg = data.lastMessage;
            const lastReadIso = data.readStatus?.[user.uid];

            let isUnread = false;
            if (lastMsg && lastMsg.senderId !== user.uid) {
              if (!lastReadIso) {
                isUnread = true;
              } else {
                isUnread = new Date(lastMsg.timestamp) > new Date(lastReadIso);
              }
            }

            if (isUnread) {
              count += 1;
              const msgTime = new Date(lastMsg.timestamp || 0).getTime();
              if (msgTime > newestConvTime) {
                newestConvTime = msgTime;
                newestSender = lastMsg.senderId;
              }
            }
          });

          unreadConvCount = count;
          if (newestSender) {
            latestSender = newestSender;
          }
          updateCombinedUnread(unreadLegacyCount, unreadConvCount, latestSender);
        }, (err) => {
          console.warn("App - Écoute conversations non autorisée ou non configurée (repli legacy actif) :", err?.message || err);
        });
      } catch (e) {
        console.warn("App - Impossible d'initialiser l'écoute des conversations :", e?.message || e);
      }
    }

    return () => {
      unsubLegacy();
      unsubConv();
    };
  }, [user?.uid, profileData?.groupId]);

  useEffect(() => {
    let unsubscribeProfile = null;
    let unsubscribeAuth = null;
    let isMounted = true;

    // Détection et traitement du SSO Custom Token (tolérance ssoToken et token)
    const searchParams = new URLSearchParams(window.location.search);
    const ssoToken = searchParams.get('ssoToken') || searchParams.get('token');
    let isSSOPending = Boolean(ssoToken);

    if (ssoToken) {
      // Nettoyage immédiat de l'URL pour la sécurité et la propreté de la navigation
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('ssoToken');
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, cleanUrl.toString());

      let tokenUid = null;
      try {
        const parts = ssoToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          tokenUid = payload.uid || payload.sub || null;
        }
      } catch {}

      // Si l'utilisateur actuel correspond déjà au token, pas besoin de réauthentification
      if (auth.currentUser && tokenUid && auth.currentUser.uid === tokenUid) {
        isSSOPending = false;
      } else {
        setLoading(true);
        signInWithCustomToken(auth, ssoToken)
          .then(() => {})
          .catch((err) => {
            console.warn("[Organizador SSO] Erreur custom token :", err);
          })
          .finally(() => {
            isSSOPending = false;
            // Si aucun utilisateur n'est connecté à l'issue, libérer le loader pour afficher le formulaire
            if (isMounted && !auth.currentUser) {
              setLoading(false);
            }
          });
      }
    }

    const initAuth = () => {
      if (!isMounted) return;

      // En mode démo, injecter immédiatement le profil Mestre da Ria sans contacter Firebase Auth
      if (isDemoMode()) {
        const demoUser = getDemoAuthUser();
        const demoProfile = getDemoProfileData();
        setUser(demoUser);
        setProfileData(demoProfile);
        setProfileExists(true);
        setCheckingProfile(false);
        setLoading(false);
        return;
      }

      unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        // Si une opération SSO est activement en cours d'échange de jeton et que l'utilisateur est temporairement null,
        // on évite de flasher l'état déconnecté.
        if (!currentUser && isSSOPending) {
          return;
        }

        setUser(currentUser);
        
        // Clean up previous profile listener if any
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (currentUser) {
          setCheckingProfile(true);
          setProfileExists(prev => (prev === true ? true : null));
          const profileRef = doc(db, 'users', currentUser.uid);
          unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            try {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const canonicalGroup = canonicalizeGroupId(data.groupId);

                // 1. Court-circuit Fondateur / Super-Admin / Mestre / Bureau
                const isFounderOrSuperAdmin =
                  isSystemSuperAdminIdentity({ id: docSnap.id, ...data }, currentUser) ||
                  ['mestre', 'admin'].includes((data.role || '').toLowerCase());

                // 2. Fusion strictement additive des tags pour TOUS les utilisateurs
                const existingTags = Array.isArray(data.tags) ? data.tags : [];
                const migration = getMigratedRoleAndTags(data);
                const mergedTags = Array.from(new Set([...existingTags, ...(migration.newTags || [])]));

                // Si le profil était déjà exonéré, préserver absolument le statut :
                const isExonere = existingTags.includes('Exonéré') ||
                                  data.cotisationStatus === 'exonere' ||
                                  data.paymentStatus === 'exempt' ||
                                  data.paymentStatus === 'exempted' ||
                                  data.isCotisationExoneree === true;
                if (isExonere && !mergedTags.includes('Exonéré')) {
                  mergedTags.push('Exonéré');
                }

                // Détermination du rôle résolu
                const resolvedRole = isFounderOrSuperAdmin ? (data.role || 'mestre') : (migration.needsMigration ? migration.newRole : data.role);

                // 3. Injection immédiate dans le state React (zéro latence)
                const adminFallbackGroup = resolveAdminFallbackGroupId(data, urlGroupId);
                const resolvedProfile = {
                  uid: docSnap.id,
                  id: docSnap.id,
                  ...data,
                  groupId: canonicalGroup || data.groupId || (isFounderOrSuperAdmin ? (adminFallbackGroup || null) : null),
                  role: resolvedRole,
                  tags: mergedTags,
                  isSystemAdmin: isFounderOrSuperAdmin ? true : Boolean(data.isSystemAdmin),
                  canViewAll: isFounderOrSuperAdmin ? true : Boolean(data.canViewAll),
                  paymentStatus: (isFounderOrSuperAdmin || isExonere) ? 'exempt' : (data.paymentStatus || 'unpaid'),
                  cotisationStatus: (isFounderOrSuperAdmin || isExonere) ? 'exonere' : (data.cotisationStatus || 'non_payee'),
                  isCotisationExoneree: (isFounderOrSuperAdmin || isExonere) ? true : Boolean(data.isCotisationExoneree),
                  onboardingCompleted: isFounderOrSuperAdmin ? true : Boolean(data.onboardingCompleted)
                };
                if (resolvedProfile.groupId) saveLastKnownTenantId(resolvedProfile.groupId);
                setProfileData(resolvedProfile);
                setProfileExists(true);
                setProfileNetworkWaiting(false);
                if (checkIsProfileComplete(resolvedProfile, isFounderOrSuperAdmin, currentUser.uid)) {
                  markKnownCompletedProfile(currentUser.uid);
                }

                if (isFounderOrSuperAdmin && data.onboardingCompleted !== true) {
                  updateDoc(profileRef, { onboardingCompleted: true }).catch(() => {});
                }

                if (data.groupId && data.groupId !== canonicalGroup && canonicalGroup && isSameGroupCaseInsensitive(data.groupId, canonicalGroup)) {
                  updateDoc(profileRef, { groupId: canonicalGroup }).catch(() => {});
                }

                if (!isFounderOrSuperAdmin && migration.needsMigration) {
                  updateDoc(profileRef, { role: migration.newRole, tags: mergedTags }).catch(() => {});
                }
                setCheckingProfile(false);
                setLoading(false);
              } else {
                const isFounderAccount = isEmergencyFounderIdentity(currentUser);
                if (isFounderAccount) {
                  getDoc(doc(db, 'users', EMERGENCY_FOUNDER_UID)).then((founderSnap) => {
                    const fData = founderSnap.exists() ? founderSnap.data() : null;
                    setProfileData(buildFounderEmergencyProfile({ currentUser, profileDoc: fData, resolvedTenantId: urlGroupId }));
                    setProfileExists(true);
                    updateDoc(doc(db, 'users', currentUser.uid), { onboardingCompleted: true }).catch(() => {});
                    setCheckingProfile(false);
                    setLoading(false);
                  }).catch((err) => {
                    console.warn("App - Erreur lecture secours profil fondateur :", err);
                    setProfileData(buildFounderEmergencyProfile({ currentUser, resolvedTenantId: urlGroupId }));
                    setProfileExists(true);
                    setCheckingProfile(false);
                    setLoading(false);
                  });
                  return;
                }

                // Vérification serveur prioritaire (sur nouvel appareil au cache vierge) + réconciliation par e-mail
                getDocFromServer(profileRef)
                  .then(async (serverSnap) => {
                    if (serverSnap.exists()) {
                      const sData = serverSnap.data();
                      const canonicalGroup = canonicalizeGroupId(sData.groupId);
                      const resolvedServerProfile = {
                        uid: serverSnap.id,
                        id: serverSnap.id,
                        ...sData,
                        groupId: canonicalGroup || sData.groupId || null
                      };
                      setProfileData(resolvedServerProfile);
                      setProfileExists(true);
                      setProfileNetworkWaiting(false);
                      if (checkIsProfileComplete(resolvedServerProfile, false, currentUser.uid)) {
                        markKnownCompletedProfile(currentUser.uid);
                      }
                      setCheckingProfile(false);
                      setLoading(false);
                      return;
                    }

                    if (currentUser?.email) {
                      const reconciled = await reconcilePreExistingMember(currentUser);
                      if (reconciled) {
                        console.info("App - Fiche pré-existante Bureau réconciliée pour l'UID :", currentUser.uid);
                        setProfileData(reconciled);
                        setProfileExists(true);
                        setProfileNetworkWaiting(false);
                        setCheckingProfile(false);
                        setLoading(false);
                        return;
                      }
                    }

                    const knownComplete = hasKnownCompletedProfile(currentUser.uid);
                    setProfileData(null);
                    setProfileExists(knownComplete ? null : false);
                    setProfileNetworkWaiting(knownComplete);
                    setCheckingProfile(false);
                    setLoading(false);
                  })
                  .catch((err) => {
                    console.warn("App - Vérification serveur différée (attente réseau maintenue) :", err?.message || err);
                    setProfileExists(prev => (prev === true ? true : null));
                    setProfileNetworkWaiting(true);
                    setCheckingProfile(false);
                    setLoading(false);
                  });
                return;
              }
            } catch (snapErr) {
              console.error("App - Erreur traitement onSnapshot profil :", snapErr);
              setProfileNetworkWaiting(true);
              setCheckingProfile(false);
              setLoading(false);
            }
          }, (error) => {
            console.error("App - Erreur onSnapshot profil utilisateur :", error);
            const isFounderAccount = isEmergencyFounderIdentity(currentUser);

            // Si permission refusée, tenter de rafraîchir le jeton Firebase Auth en arrière-plan
            if (currentUser && error?.code === 'permission-denied') {
              currentUser.getIdToken(true).then(() => {
                console.info("App - Jeton Firebase Auth rafraîchi avec succès.");
              }).catch((tokenErr) => {
                console.warn("App - Session expirée ou invalide, déconnexion propre :", tokenErr);
                signOut(auth).catch(() => {});
              });
            }

            if (isFounderAccount) {
              setProfileData((prev) => prev || buildFounderEmergencyProfile({ currentUser, resolvedTenantId: urlGroupId }));
              setProfileExists(true);
            } else {
              // Ne jamais basculer profileExists à false sur erreur réseau : maintenir null pour afficher l'écran d'attente réseau
              setProfileExists(prev => (prev === true ? true : null));
              setProfileNetworkWaiting(true);
            }
            setCheckingProfile(false);
            setLoading(false);
          });
        } else {
          setProfileData(null);
          setProfileExists(null);
          setProfileNetworkWaiting(false);
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

  // Watchdog de sécurité anti-blocage (chargement infini)
  // Si le chargement ou la vérification du profil dure plus de 3.5 secondes, débloquer vers l'écran d'attente réseau (sans basculer vers Onboarding)
  useEffect(() => {
    if (!loading && !checkingProfile && !isWaitingForProfile) return;

    const watchdogTimer = setTimeout(() => {
      console.warn("App - Watchdog de sécurité déclenché : passage en attente réseau sécurisée.");
      const currentUser = auth.currentUser;
      const isFounder = isEmergencyFounderIdentity(currentUser);
      if (currentUser && isFounder && !profileData) {
        setProfileData(buildFounderEmergencyProfile({ currentUser, resolvedTenantId: urlGroupId }));
        setProfileExists(true);
      } else if (currentUser && !profileData) {
        setProfileNetworkWaiting(true);
      }
      setCheckingProfile(false);
      setLoading(false);
    }, 3500);

    return () => clearTimeout(watchdogTimer);
  }, [loading, checkingProfile, isWaitingForProfile, profileData]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard'); // Réinitialiser navigation view on sign out
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  const userTags = resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);

  const [accessDeniedToast, setAccessDeniedToast] = useState(false);

  // Privilèges étendus et profil effectif (déclarés au niveau racine avant les retours conditionnels)
  const isPrivilegedUser = Boolean(
    isSystemOrSuperAdminOrMestre ||
    isAdministrativeUser ||
    isSystemSuperAdminIdentity(profileData, user)
  );

  const effectiveProfileData = profileData || (isPrivilegedUser
    ? buildFounderEmergencyProfile({ currentUser: user, resolvedTenantId: urlGroupId, associationName })
    : null);

  const hasAccessMestre = isMasterKeyActive || 
    effectiveProfileData?.role === 'mestre' || 
    effectiveProfileData?.role === 'super-admin' || 
    effectiveProfileData?.role === 'admin' || 
    effectiveProfileData?.isSystemAdmin === true ||
    canAccessMestre(effectiveProfileData, permissionsMatrice, userTags);

  const memberTabsVisibility = associationData?.memberTabsVisibility || {};

  // Vérification stricte d'activation d'un Pôle complet (Niveau 1)
  const isPoleEnabled = (poleId) => {
    if (poleId === 'accueil' || poleId === 'mon-espace') return true;

    if (poleId === 'vitrine') {
      const hasVitrineAccess = associationData?.appAccess?.vitrine ?? associationData?.appAccess?.mostrador;
      if (hasVitrineAccess === false) return false;
      if (enabledModules?.vitrine === false) return false;
      return true;
    }

    if (poleId === 'config') {
      if (enabledModules?.config === false) return false;
      return true;
    }

    if (poleId === 'gouvernance' && enabledModules?.gouvernance === false) return false;
    if (poleId === 'secretariat' && enabledModules?.secretariat === false) return false;
    if (poleId === 'diffusion' && enabledModules?.diffusion === false) return false;
    if (poleId === 'tresorerie' && enabledModules?.tresorerie === false) return false;
    if (poleId === 'logistique' && enabledModules?.logistique === false && enabledModules?.commandes === false) return false;
    if (poleId === 'lutherie' && enabledModules?.lutherie === false) return false;

    // Costumerie : désactivé si costumerie === false OU (si costumerie non défini et vestiaire === false)
    if (poleId === 'costumerie' || poleId === 'vestiaire') {
      if (enabledModules?.costumerie === false) return false;
      if (enabledModules?.costumerie === undefined && enabledModules?.vestiaire === false) return false;
    }

    if (poleId === 'studio' && enabledModules?.studioSocial === false) return false;

    // Pédagogie : désactivé si pedagogie === false OU (si non défini, repli sur mestre + studioSocial)
    if (poleId === 'pedagogie') {
      if (enabledModules?.pedagogie === false) return false;
      if (enabledModules?.pedagogie === undefined && (enabledModules?.mestre === false && enabledModules?.studioSocial === false)) return false;
    }

    if (poleId === 'mestre' && enabledModules?.mestre === false) return false;

    return true;
  };

  // Vérification stricte d'activation d'un Onglet (Niveau 2 SaaS)
  const isModuleEnabled = (tabId, poleId) => {
    if (!enabledModules) return true;

    // Vitrine : vérifier l'accès appAccess (vitrine ou mostrador) et le toggle module
    if (poleId === 'vitrine' || (tabId && tabId.startsWith('vitrine-'))) {
      const hasVitrineAccess = associationData?.appAccess?.vitrine ?? associationData?.appAccess?.mostrador;
      if (hasVitrineAccess === false) return false;
      if (enabledModules.vitrine === false) return false;
      return true;
    }

    // Config : toujours actif au niveau module si pas explicitement désactivé
    if (poleId === 'config' || (tabId && tabId.startsWith('config-'))) {
      if (enabledModules.config === false) return false;
      return true;
    }

    // Pôles complets d'administration
    if (poleId && poleId !== 'mon-espace' && !isPoleEnabled(poleId)) return false;

    // --- RÈGLES À 2 NIVEAUX POUR L'ESPACE MEMBRE ('mon-espace') ---
    if (poleId === 'mon-espace' || !poleId) {
      if (tabId === 'materiel') {
        const hasParent = enabledModules.logistique !== false || enabledModules.lutherie !== false;
        if (!hasParent || memberTabsVisibility.materiel === false) return false;
        return true;
      }

      if (tabId === 'vestiaire') {
        if (!isPoleEnabled('costumerie')) return false;
        if (associationData?.wardrobeMemberMode === 'disabled') {
          const hasCostumerieAdmin = isMasterKeyActive || canAccessPole('costumerie', effectiveProfileData, permissionsMatrice, userTags);
          if (!hasCostumerieAdmin) return false;
        }
        if (memberTabsVisibility.vestiaire === false) return false;
        return true;
      }

      if (tabId === 'atelier') {
        const hasParent = isPoleEnabled('lutherie') || isPoleEnabled('costumerie');
        if (!hasParent || memberTabsVisibility.atelier === false) return false;
        return true;
      }

      if (tabId === 'mon-parcours') {
        if (!isPoleEnabled('pedagogie')) return false;
        if (enabledModules.monParcoursGlobal === false) return false;
        if (memberTabsVisibility.monParcours === false) return false;
        return true;
      }

      if (tabId === 'repertoire') {
        const hasParent = isPoleEnabled('pedagogie') || isPoleEnabled('mestre');
        if (!hasParent) return false;
        const effectiveFeatures = features || associationData?.features;
        const role = (effectiveProfileData?.role || '').toLowerCase();
        const isMestreOrAdmin = role === 'mestre' || role === 'super-admin' || role === 'admin' || effectiveProfileData?.isSystemAdmin === true;
        const hasAccessMestreLocal = isMasterKeyActive || isMestreOrAdmin;
        const isRepertoireAllowed = memberTabsVisibility.repertoire === true || effectiveFeatures?.repertoireEleves === true || hasAccessMestreLocal;
        if (!isRepertoireAllowed) return false;
        return true;
      }

      if (tabId === 'trombinoscope') {
        if (memberTabsVisibility.trombinoscope === false) return false;
        return true;
      }

      if (tabId === 'varal') {
        if (enabledModules.studioSocial === false) return false;
        if (memberTabsVisibility.varal === false) return false;
        return true;
      }

      if (tabId === 'covoiturage') {
        if (enabledModules.covoiturage === false || memberTabsVisibility.covoiturage === false) return false;
        return true;
      }

      if (tabId === 'forum' && enabledModules.forum === false) return false;
    }

    // Tab-level checks pour les pôles métiers d'administration
    if (['gigs-pipeline', 'ca-prestations'].includes(tabId) && enabledModules.diffusion === false) return false;
    if (['dashboard-finance', 'cotisations', 'events-finances', 'operations-diverses', 'frais-km', 'reports-exports', 'ca-finances'].includes(tabId) && enabledModules.tresorerie === false) return false;
    if (['inventory', 'logistics-kits', 'logistics-carpool'].includes(tabId) && enabledModules.logistique === false) return false;
    if (['orders', 'orders-manager'].includes(tabId) && enabledModules.commandes === false) return false;
    if (['inventory-projects', 'instrument-models', 'inventory-parts', 'inventory-supplies', 'workshop-tools', 'varal-lutherie'].includes(tabId) && enabledModules.lutherie === false) return false;
    if (['wardrobe-inventory', 'wardrobe-couture', 'wardrobe-sizes', 'wardrobe-projects', 'wardrobe-models', 'wardrobe-pieces', 'wardrobe-supplies', 'wardrobe-tools', 'varal-costumerie'].includes(tabId)) {
      if (enabledModules.costumerie === false) return false;
      if (enabledModules.costumerie === undefined && enabledModules.vestiaire === false) return false;
    }
    if (['export-annu', 'studio-events', 'varal-secretariat', 'secretariat-documents'].includes(tabId) && enabledModules.secretariat === false) return false;
    if (['studio-social', 'studio-lexique', 'varal-manager', 'newsletter', 'varal-photos', 'studio-communication'].includes(tabId) && enabledModules.studioSocial === false) return false;
    if (['reunion-manager', 'ca-reunions'].includes(tabId) && enabledModules.reunions === false) return false;
    if (tabId === 'forum' && enabledModules.forum === false) return false;
    if (['mestre-repertoire', 'mestre-sante-troupe', 'mestre-pedagogy-dashboard', 'varal-manager', 'mestre-pedagogy-qcm', 'mestre-orientation', 'mestre-categories', 'mestre-events', 'mestre-stage-layout', 'mestre-mot-mestre'].includes(tabId) && enabledModules.mestre === false) return false;

    return true;
  };

  // Garde de routage de sécurité réactif (placé au sommet de App() avec les autres hooks)
  useEffect(() => {
    if (currentPole === 'mon-espace' && currentTab && currentTab !== 'dashboard') {
      if (!isModuleEnabled(currentTab, 'mon-espace')) {
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
      }
    } else if (currentPole && currentPole !== 'accueil' && currentPole !== 'mon-espace') {
      if (!isPoleEnabled(currentPole)) {
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
      }
    }
  }, [currentPole, currentTab, enabledModules, associationData?.memberTabsVisibility]);

  // Interception ProtectedRoutes : si le membre standard tente d'accéder à un pôle ou onglet réservé
  useEffect(() => {
    if (!profileData || profileData.isNew) return;
    // Si l'utilisateur est Mestre (ou direction/admin) et navigue vers le pôle mestre, vitrine ou config, l'accès est garanti d'office
    if ((currentPole === 'mestre' || currentPole === 'vitrine' || currentPole === 'config' || currentPole === null) && isPrivilegedUser) {
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

  // Déclenché à la fin de l'onboarding : redirection automatique et fluide vers le tableau de bord adhérent
  const handleOnboardingComplete = () => {
    markKnownCompletedProfile(user?.uid);
    setCurrentRoute('/app');
    setCurrentPole('accueil');
    setCurrentTab('dashboard');
    if (typeof window !== 'undefined') {
      window.history.pushState({ currentPole: 'accueil', currentTab: 'dashboard' }, '', '/app');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { currentPole: 'accueil', currentTab: 'dashboard' } }));
    }
  };

  // 1. Écran de chargement (uniquement pour l'application privée Organizador, jamais bloquant sur la Vitrine)
  if (!isVitrineMode && (loading || checkingProfile || isWaitingForProfile)) {
    return (
      <div style={brandingStyle} className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[var(--cordel-bg)] text-[var(--cordel-text)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs sm:max-w-sm w-full">
          <LoadingSeal
            associationData={associationData}
            branding={branding}
            associationName={associationName}
            currentGroupId={profileData?.groupId || urlGroupId}
            size="large"
            className="mb-2 mx-auto"
          />
          <div className="relative w-16 h-16 select-none animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--cordel-border)]/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cordel-wood border-r-transparent border-b-transparent border-l-transparent"></div>
          </div>
          <span className="font-black text-xs uppercase tracking-widest text-cordel-wood animate-pulse">
            {checkingProfile ? t('dashboard.loadingProfile') : t('common.loading')}
          </span>
          <button
            type="button"
            onClick={() => {
              setProfileNetworkWaiting(true);
              setCheckingProfile(false);
              setLoading(false);
            }}
            className="mt-3 text-[11px] font-bold uppercase tracking-wider text-cordel-wood/80 hover:text-cordel-wood underline cursor-pointer transition-opacity"
          >
            {t('common.directAccessBtn', 'Accéder directement')}
          </button>
        </div>
      </div>
    );
  }

  // 2. Routage dynamique : Vitrine Publique One-Page (Mostrador), Racine, Setup
  const isDemoVitrine = isDemoMode() && isVitrineMode;
  const isDemoPath = (currentRoute === '/demo' || currentRoute === '/demo/' || currentRoute.startsWith('/demo/') || isDemoMode()) && !isVitrineMode;
  const isRootPath = (!currentRoute || currentRoute === '/' || currentRoute === '' || currentRoute === '/index.html' || currentRoute.startsWith('/?') || currentRoute.startsWith('/#')) && !isDemoPath && !isVitrineMode;
  const isSetupPath = !isVitrineMode && currentRoute.startsWith('/setup');
  const isLoginPath = (currentRoute === '/login' || currentRoute === '/login/') && !isDemoPath && !isVitrineMode;

  const isInternalPath = INTERNAL_APP_ROUTE_PREFIXES.some(prefix => currentRoute === prefix || currentRoute.startsWith(prefix + '/') || currentRoute.startsWith(prefix + '?'));
  const isAppPath = !isVitrineMode && (currentRoute.startsWith('/app') || isInternalPath || isDemoPath || (Boolean(user) && !isLoginPath && !isSetupPath));
  const isVitrinePath = isVitrineMode || isDemoVitrine || (!isRootPath && !isSetupPath && !isAppPath && !isLoginPath);

  if (isSetupPath) {
    return (
      <React.Suspense fallback={
        <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-cordel-bg">
          <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-cordel-wood">{t('common.loadingAssistant', "Chargement de l'assistant...")}</span>
        </div>
      }>
        <HubSetupWizard brandingStyle={brandingStyle} onComplete={() => navigateToRoute('/app')} />
        <ReloadPrompt />
      </React.Suspense>
    );
  }

  if (isRootPath || isVitrinePath) {
    return (
      <VitrineRouteShell
        appMode={appMode}
        isRootPath={isRootPath}
        isVitrineMode={isVitrineMode}
        isDemoVitrine={isDemoVitrine}
        currentRoute={currentRoute}
        isTenantLoading={isTenantLoading}
        tenantError={tenantError}
        urlGroupId={urlGroupId}
        user={user}
        profileData={profileData}
        permissionsMatrice={permissionsMatrice}
        userTags={userTags}
        isAdministrativeUser={isAdministrativeUser}
        associationData={associationData}
        associationName={associationName}
        branding={branding}
        brandingStyle={brandingStyle}
        navigateToRoute={navigateToRoute}
      />
    );
  }

  // 3. Utilisateur non connecté : affichage de l'écran de connexion (Login.jsx)
  if (!user) {
    return (
      <>
        <Login branding={branding} associationName={associationName} onGroupChange={setLoginSelectedGroupId} onSuccess={() => navigateToRoute('/app')} />
        <ReloadPrompt />
      </>
    );
  }

  // 4. Déverrouillage absolu de l'Onboarding pour le Mestre / Admin / Super-Admin / Fondateur
  const isProfileComplete = checkIsProfileComplete(profileData, isPrivilegedUser, user?.uid);

  // Clause d'exclusion prioritaire absolue : un Mestre, Super-Admin, Admin ou compte Fondateur
  // ne doit JAMAIS se voir bloqué par l'Onboarding adhérent.
  if (!isPrivilegedUser) {
    // 4a. Sécurisation : Compte membre archivé ou suspendu -> Blocage immédiat de l'accès privé
    if (profileData && isMemberArchived(profileData)) {
      return (
        <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
          <ArchivedAccountScreen
            profileData={profileData}
            branding={branding}
            onSignOut={handleSignOut}
          />
          <ReloadPrompt />
        </div>
      );
    }

    // 4a-bis. Réseau lent (> 3,5s) ou micro-coupure : ne jamais basculer vers Onboarding si l'absence de profil n'est pas formellement prouvée
    if (profileExists === null || (!profileData && hasKnownCompletedProfile(user?.uid))) {
      return (
        <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
          <ProfileNetworkRetryScreen
            user={user}
            onRetry={() => {
              setProfileNetworkWaiting(false);
              setCheckingProfile(true);
            }}
            onProfileRecovered={(recoveredData) => {
              setProfileData(recoveredData);
              setProfileExists(true);
              setProfileNetworkWaiting(false);
              setCheckingProfile(false);
              setLoading(false);
            }}
            onSignOut={handleSignOut}
          />
          <ReloadPrompt />
        </div>
      );
    }

    if (!checkingProfile && profileExists !== null && (!profileExists || !profileData || !isProfileComplete)) {
      return (
        <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
          <React.Suspense fallback={<div className="flex-1 flex justify-center items-center py-12 animate-pulse text-xs font-bold select-none">⏳ Initialisation...</div>}>
            <Onboarding
              user={user}
              branding={branding}
              onComplete={handleOnboardingComplete}
              profileData={profileData}
              onProfileRecovered={(recoveredData) => {
                setProfileData(recoveredData);
                setProfileExists(true);
                setProfileNetworkWaiting(false);
                handleOnboardingComplete();
              }}
              onSignOut={handleSignOut}
            />
          </React.Suspense>
          <ReloadPrompt />
        </div>
      );
    }

    // 4b. Sécurisation : Compte nouvellement inscrit en attente de validation par le bureau (isNew === true)
    if (profileData?.isNew === true) {
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
  }

  // 5. Utilisateur connecté avec profil valide -> Rendu de l'Espace Membre Privé (/app)

  const checkTabAccess = (tabId, poleId) => {
    // 0. Strict Global Feature Basculer vérifier (Hides & blocks for EVERYONE including super-admin if OFF)
    if (!isModuleEnabled(tabId, poleId)) return false;

    // Master Key Bypass ONLY if Break-Glass Technical Intervention Mode is ACTIVE
    if (isMasterKeyActive) return true;

    // Centralized access rule vérifier by roles and tags
    return canAccessTabPermission(tabId, poleId, profileData, permissionsMatrice, userTags);
  };

  const hasAccessGouvernance = isMasterKeyActive || canAccessPole('gouvernance', profileData, permissionsMatrice, userTags) || checkTabAccess('ca-reunions', 'gouvernance') || checkTabAccess('ca-reports', 'gouvernance') || checkTabAccess('ca-documents', 'gouvernance') || checkTabAccess('ca-finances', 'gouvernance') || checkTabAccess('ca-prestations', 'gouvernance');
  const hasAccessDiffusion = isMasterKeyActive || canAccessPole('diffusion', profileData, permissionsMatrice, userTags) || checkTabAccess('gigs-pipeline', 'diffusion');
  const hasAccessTresorerie = isMasterKeyActive || canAccessPole('tresorerie', profileData, permissionsMatrice, userTags) || checkTabAccess('dashboard-finance', 'tresorerie') || checkTabAccess('cotisations', 'tresorerie') || checkTabAccess('events-finances', 'tresorerie') || checkTabAccess('operations-diverses', 'tresorerie') || checkTabAccess('frais-km', 'tresorerie') || checkTabAccess('reports-exports', 'tresorerie');
  const hasAccessSecretariat = isMasterKeyActive || canAccessPole('secretariat', profileData, permissionsMatrice, userTags) || checkTabAccess('export-annu', 'secretariat') || checkTabAccess('studio-events', 'secretariat') || checkTabAccess('varal-secretariat', 'secretariat') || checkTabAccess('secretariat-documents', 'secretariat');
  const hasAccessLogistique = isMasterKeyActive || canAccessPole('logistique', profileData, permissionsMatrice, userTags) || checkTabAccess('inventory', 'logistique') || checkTabAccess('logistics-kits', 'logistique') || checkTabAccess('logistics-carpool', 'logistique') || checkTabAccess('orders', 'logistique') || checkTabAccess('orders-manager', 'logistique');
  const hasAccessLutherie = isMasterKeyActive || canAccessPole('lutherie', profileData, permissionsMatrice, userTags) || checkTabAccess('instrument-models', 'lutherie') || checkTabAccess('inventory-projects', 'lutherie') || checkTabAccess('inventory-parts', 'lutherie') || checkTabAccess('inventory-supplies', 'lutherie') || checkTabAccess('workshop-tools', 'lutherie') || checkTabAccess('varal-lutherie', 'lutherie');
  const hasAccessCostumerie = isMasterKeyActive || canAccessPole('costumerie', profileData, permissionsMatrice, userTags) || checkTabAccess('wardrobe-projects', 'costumerie') || checkTabAccess('wardrobe-models', 'costumerie') || checkTabAccess('wardrobe-pieces', 'costumerie') || checkTabAccess('wardrobe-supplies', 'costumerie') || checkTabAccess('wardrobe-tools', 'costumerie') || checkTabAccess('wardrobe-sizes', 'costumerie') || checkTabAccess('varal-costumerie', 'costumerie');
  const hasAccessStudio = isMasterKeyActive || canAccessPole('studio', profileData, permissionsMatrice, userTags) || checkTabAccess('studio-social', 'studio') || checkTabAccess('newsletter', 'studio') || checkTabAccess('varal-photos', 'studio') || checkTabAccess('studio-communication', 'studio') || checkTabAccess('studio-lexique', 'studio');
  const hasAccessPedagogie = isMasterKeyActive || canAccessPole('pedagogie', profileData, permissionsMatrice, userTags) || checkTabAccess('mestre-pedagogy-dashboard', 'pedagogie') || checkTabAccess('varal-manager', 'pedagogie') || checkTabAccess('mestre-pedagogy-qcm', 'pedagogie');
  const hasAccessVitrine = isSystemOrSuperAdminOrMestre || isMasterKeyActive || canAccessPole('vitrine', profileData, permissionsMatrice, userTags) || checkTabAccess('vitrine-general', 'vitrine') || checkTabAccess('vitrine-editor', 'vitrine');
  const hasAccessConfig = isSystemOrSuperAdminOrMestre || isMasterKeyActive || canAccessPole('config', profileData, permissionsMatrice, userTags) || checkTabAccess('config-identity', 'config') || checkTabAccess('config-profile', 'config') || checkTabAccess('config-agenda', 'config') || checkTabAccess('config-security', 'config') || checkTabAccess('config-comms', 'config') || checkTabAccess('config-modules', 'config');

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
      const basePath = window.location.pathname.startsWith('/app') ? window.location.pathname : '/app';
      const cleanUrl = basePath + (searchParams.toString() ? '?' + searchParams.toString() : '');
      const stateUpdate = {};
      keys.forEach(k => { stateUpdate[k] = null; });
      window.history.replaceState({ ...window.history.state, ...stateUpdate }, '', cleanUrl);
    }
  };

  const handleNavigateToPole = (poleId, targetTab = null) => {
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

    // Garde de navigation pour l'espace membre : vérifier que l'onglet cible est bien activé
    if (poleId === 'mon-espace' && targetTab && !isModuleEnabled(targetTab, 'mon-espace')) {
      setAccessDeniedToast(true);
      setTimeout(() => setAccessDeniedToast(false), 4000);
      setCurrentPole('accueil');
      setCurrentTab('dashboard');
      return;
    }

    setCurrentPole(poleId);
    if (poleId === 'accueil') {
      cleanUrlParams(['eventId', 'threadId']);
      setCurrentTab(targetTab || 'dashboard');
      setDashboardKey(prev => prev + 1);
      return;
    }
    // Nettoyer les paramètres de deep-link lorsqu'on quitte les pôles respectifs
    if (poleId !== 'mon-espace') {
      cleanUrlParams(['threadId']);
    }
    cleanUrlParams(['eventId']);

    if (targetTab) {
      setCurrentTab(targetTab);
      return;
    }

    const poleObj = POLES_CONFIG.find(p => p.id === poleId);
    if (poleObj && poleObj.tabs.length > 0) {
      const allowedTab = poleObj.tabs.find(tab => checkTabAccess(tab.id, poleId));
      setCurrentTab(allowedTab ? allowedTab.id : poleObj.tabs[0].id);
    } else {
      setCurrentTab(null);
    }
  };



  const handleNavigateToView = (viewName, extraOptions = null) => {
    if (activeMestreEventDetails) {
      setActiveMestreEventDetails(null);
    }

    if (viewName === 'forum' && extraOptions?.userId) {
      setActivePrivateChatUserId(extraOptions.userId);
      setInitialPrivateMessage(extraOptions.message || '');
    }

    if (viewName === 'forum' && extraOptions?.conversationId) {
      setActiveConversationId(extraOptions.conversationId);
    }

    if (viewName === 'forum' && extraOptions?.tab) {
      setForumInitialTab(extraOptions.tab);
    }

    if (viewName === 'forum' && extraOptions?.threadId) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('threadId', extraOptions.threadId);
      window.history.pushState({}, '', window.location.pathname + '?' + searchParams.toString());
    } else if (viewName !== 'forum') {
      cleanUrlParams(['threadId']);
    }

    if (viewName === 'forum' && extraOptions?.channelId) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('channelId', extraOptions.channelId);
      window.history.pushState({}, '', window.location.pathname + '?' + searchParams.toString());
    } else if (viewName !== 'forum') {
      cleanUrlParams(['channelId']);
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
      case 'porte-voix':
        setCurrentPole('mon-espace');
        setCurrentTab('forum');
        break;
      case 'varal':
      case 'documents':
        if (extraOptions?.categoryKey || extraOptions?.category || extraOptions?.ropeId) {
          const cat = extraOptions.categoryKey || extraOptions.category || extraOptions.ropeId;
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.set('varalCat', cat);
          window.history.pushState({ ...window.history.state, varalCat: cat }, '', window.location.pathname + '?' + searchParams.toString());
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        setCurrentPole('mon-espace');
        setCurrentTab('varal');
        break;
      case 'repertoire':
        setCurrentPole('mon-espace');
        setCurrentTab('repertoire');
        break;
      case 'export-annu':
        setCurrentPole('secretariat');
        setCurrentTab('export-annu');
        break;
      case 'reunion-manager':
      case 'ca-reunions':
        setCurrentPole('gouvernance');
        setCurrentTab('ca-reunions');
        break;
      case 'activity-reports':
      case 'secretariat-reports':
      case 'ca-reports':
        setCurrentPole('gouvernance');
        setCurrentTab('ca-reports');
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
        setCurrentPole('mon-espace');
        setCurrentTab('materiel');
        break;
      case 'inventory':
        setCurrentPole('logistique');
        setCurrentTab('inventory');
        break;
      case 'logistics-pupitres':
        setCurrentPole('logistique');
        setCurrentTab('inventory');
        break;
      case 'logistics-kits':
        setCurrentPole('logistique');
        setCurrentTab('logistics-kits');
        break;
      case 'vestiaire':
      case 'mon-vestiaire':
        setCurrentPole('mon-espace');
        setCurrentTab('vestiaire');
        break;
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
      case 'tresorerie':
      case 'cotisations':
      case 'cotisation':
      case 'adhesions':
        if (hasAccessTresorerie) {
          setCurrentPole('tresorerie');
          setCurrentTab('dashboard-finance');
        } else {
          setCurrentPole('mon-espace');
          setCurrentTab('cotisation');
        }
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
      case 'member-layout':
        setCurrentPole('config');
        setCurrentTab('config-member-layout');
        break;
      case 'studio-social':
        setCurrentPole('studio');
        setCurrentTab('studio-social');
        break;
      case 'studio-lexique':
        setCurrentPole('studio');
        setCurrentTab('studio-lexique');
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
        if (extraOptions?.eventId) {
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.set('eventId', extraOptions.eventId);
          if (extraOptions?.openHub) {
            searchParams.set('openHub', 'true');
          }
          window.history.pushState(
            { ...window.history.state, eventId: extraOptions.eventId, openHub: Boolean(extraOptions.openHub) },
            '',
            window.location.pathname + '?' + searchParams.toString()
          );
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        setCurrentPole('mon-espace');
        setCurrentTab('agenda');
        break;
      case 'mestre-categories':
        setCurrentPole('mestre');
        setCurrentTab('mestre-categories');
        break;
      case 'mestre-repertoire':
        setCurrentPole('mestre');
        setCurrentTab('mestre-repertoire');
        break;
      case 'mestre-orientation':
        setCurrentPole('mestre');
        setCurrentTab('mestre-orientation');
        break;
      case 'mestre-events':
      case 'mestre-stage-layout':
        setCurrentPole('mestre');
        setCurrentTab('mestre-stage-layout');
        break;
      case 'mestre-sequenceur':
        setCurrentPole('mestre');
        setCurrentTab('mestre-repertoire');
        break;
      case 'mestre-mot-mestre':
        setCurrentPole('mestre');
        setCurrentTab('mestre-mot-mestre');
        break;
      case 'secretariat-documents':
        setCurrentPole('secretariat');
        setCurrentTab('secretariat-documents');
        break;
      case 'config-agenda':
        setCurrentPole('config');
        setCurrentTab('config-agenda');
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

  /**
   * Déclenchement instantané d'une discussion privée 1-à-1 depuis la modale des membres en ligne
   * Ferme la présence, crée ou récupère la conversation et bascule sur le Porte-Voix.
   */
  const handleStartDirectChat = async (targetUserId) => {
    if (!targetUserId) return;
    try {
      const convId = await createDirectConversation(targetUserId);
      handleNavigateToView('forum', {
        conversationId: convId || null,
        userId: targetUserId,
        tab: 'direct'
      });
    } catch (err) {
      console.warn("Erreur lors de l'ouverture du chat direct depuis la présence :", err);
      handleNavigateToView('forum', { userId: targetUserId, tab: 'direct' });
    }
  };

  /**
   * Gestionnaire central de navigation interne déclenchée par le Centre de Notifications,
   * le Mégaphone et le Deep Linking SPA sans rechargement de page.
   */
  const handleNotificationNavigate = (targetUrl, notification = null) => {
    if ((!targetUrl || typeof targetUrl !== 'string') && notification?.type !== 'push_reminder') return;

    if (targetUrl && isExternalActionLink(targetUrl)) {
      if (typeof window !== 'undefined') {
        window.open(targetUrl.trim(), '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const { pathname: path, searchParams: params } = extractDeepLinkTarget(targetUrl || '/app');
    const basePath = '/app';

    // 0. Relance d'activation des notifications Push en 1 clic (?setup-push=1 ou type === 'push_reminder')
    if (params.get('setup-push') === '1' || notification?.type === 'push_reminder') {
      setCurrentPole('accueil');
      setCurrentTab('dashboard');
      setCurrentRoute(basePath);
      const newSearchParams = new URLSearchParams(window.location.search);
      newSearchParams.set('setup-push', '1');
      window.history.pushState({}, '', `${basePath}?${newSearchParams.toString()}`);
      window.dispatchEvent(new CustomEvent('open-push-activation-modal'));
      return;
    }

    // 1. Résolution unifiée via la table de correspondance (Mégaphone + Cloche + Badges + Discussions)
    const resolved = resolveInternalDestination(targetUrl, { hasAccessTresorerie });
    if (resolved) {
      setCurrentPole(resolved.poleId);
      setCurrentTab(resolved.tabId);
      setCurrentRoute(basePath);

      if (resolved.tabId === 'agenda') {
        cleanUrlParams(['threadId']);
        const newSearchParams = new URLSearchParams(window.location.search);
        if (resolved.eventId) newSearchParams.set('eventId', resolved.eventId);
        if (resolved.eventTab) newSearchParams.set('tab', resolved.eventTab);
        if (params.get('focus')) newSearchParams.set('focus', params.get('focus'));
        if (params.get('hub')) newSearchParams.set('hub', params.get('hub'));
        const newUrl = basePath + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
        window.history.pushState(
          {
            ...window.history.state,
            currentPole: resolved.poleId,
            currentTab: resolved.tabId,
            eventId: resolved.eventId,
            tab: resolved.eventTab
          },
          '',
          newUrl
        );
        window.dispatchEvent(new PopStateEvent('popstate'));
        if (resolved.focusComments) {
          setTimeout(() => {
            document.getElementById('event-tab-discussion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 250);
        }
        return;
      }

      if (resolved.tabId === 'forum') {
        cleanUrlParams(['eventId']);
        if (resolved.forumInitialTab) setForumInitialTab(resolved.forumInitialTab);
        if (resolved.conversationId) setActiveConversationId(resolved.conversationId);
        if (resolved.chatUserId) setActivePrivateChatUserId(resolved.chatUserId);

        const newSearchParams = new URLSearchParams(window.location.search);
        if (resolved.threadId) newSearchParams.set('threadId', resolved.threadId);
        if (params.get('tab')) newSearchParams.set('tab', params.get('tab'));
        if (resolved.conversationId) newSearchParams.set('conversationId', resolved.conversationId);
        if (resolved.chatUserId) newSearchParams.set('chatUserId', resolved.chatUserId);

        const newUrl = basePath + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
        window.history.pushState(
          {
            ...window.history.state,
            currentPole: resolved.poleId,
            currentTab: resolved.tabId,
            threadId: resolved.threadId,
            tab: params.get('tab'),
            conversationId: resolved.conversationId,
            chatUserId: resolved.chatUserId
          },
          '',
          newUrl
        );
        return;
      }

      cleanUrlParams(['eventId', 'threadId']);
      window.history.pushState({ currentPole: resolved.poleId, currentTab: resolved.tabId }, '', basePath);

      if (resolved.scrollToId) {
        setTimeout(() => {
          document.getElementById(resolved.scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
      return;
    }

    // 2. Repli sur le gestionnaire de vues génériques SPA
    const cleanViewName = path.replace(/^\/(app\/)?/, '').split('?')[0];
    if (cleanViewName) {
      setCurrentRoute(basePath);
      handleNavigateToView(cleanViewName);
    }
  };

  return (
    <TerminologyProvider majoriteFeminine={majoriteFeminine} universeId={associationData?.universeId || 'maracatu'}>
      <ViewSimulatorProvider
        realProfileData={profileData}
        tagsDisponibles={tagsDisponibles}
        groupId={profileData?.groupId}
      >
        <LicenseProvider groupId={profileData?.groupId} associationSettings={associationData}>
          <div style={brandingStyle} className="min-h-[100dvh] flex flex-col w-full relative">
            {isDemoMode() && <DemoTopBanner />}
            {accessDeniedToast && (
              <div className="fixed top-4 right-4 z-50 bg-amber-900 text-amber-100 font-extrabold text-xs px-4 py-3 rounded-[6px_10px_8px_12px] border-2 border-amber-600 shadow-[3px_3px_0px_0px_#181716] flex items-center gap-2 animate-bounce">
                <span>🔒</span> {t('common.accessRestrictedToast', "Accès restreint : vous n'avez pas les droits nécessaires pour accéder à cet espace.")}
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
              onNotificationNavigate={handleNotificationNavigate}
              polesList={POLES_CONFIG}
              profileData={profileData}
              onSignOut={handleSignOut}
              unreadPrivateMessagesCount={unreadConversationsCount || unreadPrivateMessagesCount || 0}
              onStartDirectChat={handleStartDirectChat}
              permissionsMatrice={permissionsMatrice}
              enabledModules={enabledModules}
              activerPresenceEnLigne={activerPresenceEnLigne}
              breakGlassActive={breakGlassActive}
              onToggleBreakGlass={handleToggleBreakGlass}
              tagsDisponibles={tagsDisponibles}
              isBirthdayMonth={isUserBirthdayMonth}
              enableIndividualProgression={associationData?.enableIndividualProgression || false}
              features={features}
            >
              <React.Suspense fallback={
                <div className="flex-1 flex flex-col justify-center items-center py-12">
                  <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
                  <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                    {t('dashboard.loadingPage')}
                  </span>
                </div>
              }>
                <ErrorBoundary key={`${currentPole || 'accueil'}-${currentTab || 'principale'}`} resetKey={`${currentPole || 'accueil'}-${currentTab || 'principale'}`} title={`Pôle ${currentPole || 'Accueil'} - ${currentTab || 'Principale'}`}>
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
                    enabledModules={enabledModules}
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
                ) : currentTab === 'repertoire' ? (
                  <MemberRepertoireView
                    groupId={profileData?.groupId}
                    user={user}
                    profileData={profileData}
                    sequenceurUrl={sequenceurUrl}
                  />
                ) : currentTab === 'atelier' ? (
                  <MonAtelier 
                    user={user} 
                    profileData={profileData} 
                    enabledModules={enabledModules}
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : currentTab === 'materiel' ? (
                  <UserMateriel 
                    user={user} 
                    profileData={profileData} 
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : currentTab === 'vestiaire' ? (
                  (associationData?.wardrobeMemberMode === 'disabled' && !hasAccessCostumerie) ? (
                    <div className="max-w-md mx-auto text-center py-12 p-6 bg-cordel-bg rounded-lg border-2 border-cordel-master-dark/20 shadow-md">
                      <span className="text-3xl mb-2 block">👗</span>
                      <h3 className="text-sm font-black uppercase text-cordel-wood mb-1">Vestiaire Adhérent Non Disponible</h3>
                      <p className="text-xs text-cordel-master-dark/80 mb-4">Le vestiaire n'est pas activé pour les adhérents dans cette association.</p>
                      <button
                        type="button"
                        onClick={() => handleNavigateToPole('accueil')}
                        className="px-4 py-2 text-xs font-black uppercase bg-cordel-wood text-white rounded border border-encre-noire shadow-[2px_2px_0px_0px_#181716] cursor-pointer"
                      >
                        Retour à l'accueil
                      </button>
                    </div>
                  ) : (
                    <MonVestiaire 
                      userId={user?.uid} 
                      groupId={profileData?.groupId} 
                      userChecklist={profileData?.userCostumeChecklist || {}} 
                      userSection={profileData?.instrument || ''} 
                      userEmail={user?.email || ''}
                      onBack={() => handleNavigateToPole('accueil')} 
                      wardrobeMemberMode={associationData?.wardrobeMemberMode || 'personal'}
                      associationData={associationData}
                      profileData={profileData}
                      onNavigateToTab={(tab) => handleNavigateToView(tab)}
                      onNavigateToPole={(pole, tab) => handleNavigateToPole(pole, tab)}
                    />
                  )
                ) : currentTab === 'trombinoscope' ? (
                  <Trombinoscope 
                    user={user} 
                    profileData={profileData} 
                    groupId={profileData?.groupId || urlGroupId}
                    onBack={() => handleNavigateToPole('accueil')} 
                    onContactUser={(otherUserId) => {
                      setActivePrivateChatUserId(otherUserId);
                      handleNavigateToView('forum');
                    }}
                  />
                ) : currentTab === 'forum' ? (
                  <ErrorBoundary title="Forum & Discussions">
                    <Forum 
                      user={user} 
                      profileData={profileData} 
                      onBack={() => handleNavigateToPole('accueil')} 
                      activePrivateChatUserId={activePrivateChatUserId}
                      initialConversationId={activeConversationId}
                      initialPrivateMessage={initialPrivateMessage}
                      initialTab={forumInitialTab}
                      onClearActivePrivateChat={() => {
                        setActivePrivateChatUserId(null);
                        setActiveConversationId(null);
                        setInitialPrivateMessage('');
                        cleanUrlParams(['conversationId', 'chatUserId']);
                      }}
                      breakGlassActive={breakGlassActive}
                      onNavigateToView={handleNavigateToView}
                    />
                  </ErrorBoundary>
                ) : (currentTab === 'export-annu' && (hasAccessSecretariat || hasAccessStudio)) ? (
                  <AdminExport 
                    user={user}
                    profileData={profileData}
                    groupId={profileData?.groupId || urlGroupId}
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'system-admin' && hasAccessConfig) ? (
                  <SystemAdminPanel 
                    user={user} 
                    profileData={profileData} 
                    groupId={profileData?.groupId || urlGroupId}
                    associationName={associationName}
                    onBack={() => handleNavigateToPole('accueil')} 
                    onNavigateToView={handleNavigateToView}
                  />
                ) : (currentTab === 'tag-manager' && hasAccessConfig) ? (
                  <TagManager 
                    groupId={profileData?.groupId || urlGroupId}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    onBack={() => setCurrentTab('export-annu')} 
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
                ) : (['orders', 'orders-manager', 'commandes'].includes(currentTab) && (hasAccessLogistique || hasAccessTresorerie)) ? (
                  <OrdersManager 
                    groupId={profileData?.groupId}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    hasAccessLogistique={hasAccessLogistique || hasAccessTresorerie}
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
                    onNavigateToView={handleNavigateToView}
                  />
                ) : (currentTab === 'instrument-models' && hasAccessLutherie) ? (
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                    onNavigateToView={handleNavigateToView}
                  />
                ) : (currentTab === 'studio-lexique' && hasAccessStudio) ? (
                  <StudioLexiqueManager 
                    groupId={profileData?.groupId}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    user={user}
                    profileData={profileData}
                    onBack={() => handleNavigateToPole('accueil')} 
                    onNavigateToView={handleNavigateToView}
                  />
                // Pôle Gouvernance (Conseil d'Administration)
                ) : (currentTab === 'ca-reunions' && hasAccessGouvernance) ? (
                  <ReunionManager 
                    groupId={profileData?.groupId}
                    user={user}
                    profileData={profileData}
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'ca-reports' && hasAccessGouvernance) ? (
                  <SecretariatReportsView 
                    groupId={profileData?.groupId} 
                  />
                ) : (currentTab === 'ca-documents' && hasAccessGouvernance) ? (
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
                      <WidgetDocuments 
                        role={profileData?.role} 
                        isSystemAdmin={profileData?.isSystemAdmin} 
                        groupId={profileData?.groupId} 
                        user={user}
                        profileData={profileData}
                        poleId="secretariat"
                        userTags={userTags}
                        canWrite={hasAccessGouvernance}
                        onNavigateToView={handleNavigateToView}
                      />
                    </React.Suspense>
                  </div>
                ) : (currentTab === 'ca-finances' && hasAccessGouvernance) ? (
                  <TreasuryManager 
                    groupId={profileData?.groupId}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    hasAccessTresorerie={hasAccessTresorerie || hasAccessGouvernance}
                    profileData={profileData}
                    initialTab="dashboard-finance"
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'ca-prestations' && hasAccessGouvernance) ? (
                  <GigsPipelineManager
                    groupId={profileData?.groupId}
                    initialTab="pipeline"
                    hasAccessDiffusion={hasAccessDiffusion || hasAccessGouvernance}
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
                ) : (currentTab === 'secretariat-documents' && hasAccessSecretariat) ? (
                  <SecretariatDocuments 
                    groupId={profileData?.groupId}
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'varal-secretariat' && (hasAccessSecretariat || hasAccessStudio)) ? (
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                ) : (currentTab === 'mestre-pedagogy-qcm' && hasAccessPedagogie) ? (
                  <MestreAutoEvalConfig 
                    profileData={profileData}
                  />
                ) : (['varal-manager', 'varal-pedagogy'].includes(currentTab) && hasAccessPedagogie) ? (
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                ) : (currentTab === 'mestre-repertoire' && hasAccessMestre) ? (
                  <MestreRepertoireView 
                    groupId={profileData?.groupId || urlGroupId || ''} 
                    user={user}
                    profileData={profileData}
                    sequenceurUrl={sequenceurUrl}
                    features={features}
                  />
                ) : (currentTab === 'mestre-categories' && hasAccessMestre) ? (
                  <MestreCustomCategories 
                    groupId={profileData?.groupId} 
                    onBack={() => setCurrentTab('mestre-orientation')}
                  />
                ) : (currentTab === 'mestre-orientation' && hasAccessMestre) ? (
                  <MestreOrientationCasting 
                    user={user}
                    profileData={profileData}
                    onNavigateToMember={() => {
                      setCurrentTab('trombinoscope');
                    }}
                  />
                ) : (currentTab === 'mestre-stage-layout' && hasAccessMestre) ? (
                  <MestreStageLayout 
                    groupId={profileData?.groupId} 
                    user={user}
                    profileData={profileData}
                    selectedEventId={selectedMestreEventId}
                    onSelectEventId={setSelectedMestreEventId}
                    onOpenDetails={(evt) => setActiveMestreEventDetails(evt)}
                  />
                ) : (currentTab === 'mestre-mot-mestre' && hasAccessMestre) ? (
                  <MestreMotMestre 
                    groupId={profileData?.groupId}
                    profileData={profileData}
                  />
                ) : (currentTab === 'config-identity' && (hasAccessConfig || checkTabAccess('config-identity', 'config'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    profileData={profileData}
                    permissionsMatrice={permissionsMatrice}
                    effectiveUserTags={userTags}
                    activeTabProp="identity"
                    mode="identity-only"
                    onBack={() => handleNavigateToPole('accueil')} 
                    onReopenOnboarding={() => setShowOnboardingWizard(true)}
                  />
                ) : (currentTab === 'config-profile' && (hasAccessConfig || checkTabAccess('config-profile', 'config'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    profileData={profileData}
                    permissionsMatrice={permissionsMatrice}
                    effectiveUserTags={userTags}
                    mode="profile-only"
                    activeTabProp="organisation"
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'config-agenda' && (hasAccessConfig || checkTabAccess('config-agenda', 'config'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    profileData={profileData}
                    permissionsMatrice={permissionsMatrice}
                    effectiveUserTags={userTags}
                    mode="agenda-only"
                    activeTabProp="agenda"
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'config-security' && (hasAccessConfig || checkTabAccess('config-security', 'config'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    profileData={profileData}
                    permissionsMatrice={permissionsMatrice}
                    effectiveUserTags={userTags}
                    activeTabProp="security"
                    mode="security-only"
                    onNavigateToView={(view) => setCurrentTab(view)}
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'config-comms' && (hasAccessConfig || checkTabAccess('config-comms', 'config'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    profileData={profileData}
                    permissionsMatrice={permissionsMatrice}
                    effectiveUserTags={userTags}
                    mode="comms-only"
                    activeTabProp="comms"
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (currentTab === 'config-modules' && (hasAccessConfig || checkTabAccess('config-modules', 'config'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
                    role={profileData?.role}
                    isSystemAdmin={profileData?.isSystemAdmin}
                    profileData={profileData}
                    permissionsMatrice={permissionsMatrice}
                    effectiveUserTags={userTags}
                    activeTabProp="modules"
                    mode="modules-only"
                    onBack={() => handleNavigateToPole('accueil')} 
                  />
                ) : (['vitrine-editor', 'vitrine-general', 'vitrine-presentation', 'vitrine-organisateur', 'vitrine-galerie', 'vitrine-recrutement', 'vitrine-reseaux', 'vitrine-apparence'].includes(currentTab) && (hasAccessVitrine || checkTabAccess(currentTab, 'vitrine') || checkTabAccess('vitrine-editor', 'vitrine'))) ? (
                  <AssociationSettings 
                    groupId={profileData?.groupId}
                    associationData={associationData}
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
                  <div className="w-full max-w-none">
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
                      isFullPage={true}
                    />
                  </div>
                ) : currentTab === 'varal' ? (
                  <div className="w-full max-w-none">
                    <React.Suspense fallback={<div className="animate-pulse py-6 text-xs text-center opacity-65">{t('common.loading')}</div>}>
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
                ) : (currentTab === 'cotisation' || (currentTab === 'dashboard-finance' && !hasAccessTresorerie)) ? (
                  <div className="flex flex-col gap-3 w-full max-w-3xl mx-auto">
                    <div className="flex justify-start select-none">
                      <button
                        type="button"
                        onClick={() => handleNavigateToPole('accueil')}
                        className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] cursor-pointer flex items-center gap-1.5"
                      >
                        <span>⬅️</span>
                        <span>{t('common.back') || "Retour à l'accueil"}</span>
                      </button>
                    </div>
                    <WidgetTreasury
                      groupId={profileData?.groupId}
                      profileData={profileData}
                      user={user}
                    />
                  </div>
                ) : (
                  <Dashboard 
                    key={dashboardKey}
                    user={user} 
                    profileData={effectiveProfileData || profileData} 
                    onNavigateToTrombi={() => handleNavigateToView('trombinoscope')} 
                    onNavigateToView={handleNavigateToView}
                    onNotificationNavigate={handleNotificationNavigate}
                    onNavigateToPole={handleNavigateToPole}
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
                <ErrorBoundary compact title="Onboarding">
                  <OnboardingWizard
                    isOpen={showOnboardingWizard}
                    onClose={() => setShowOnboardingWizard(false)}
                    groupId={profileData?.groupId || (new URLSearchParams(window.location.search).get('groupe'))}
                    associationSettings={associationData || {}}
                    onCompleteSuccess={() => setShowOnboardingWizard(false)}
                  />
                </ErrorBoundary>
              </React.Suspense>

              {/* Modale d'aiguillage du partage entrant (Web Share Target API) */}
              {sharedPayload && (
                <ShareTargetModal
                  sharedPayload={sharedPayload}
                  user={user}
                  profileData={effectiveProfileData || profileData}
                  groupId={profileData?.groupId || urlGroupId || ''}
                  canPublishAnnonce={canPublishAnnonces(
                    effectiveProfileData || profileData,
                    permissionsMatrice,
                    userTags,
                    breakGlassActive
                  )}
                  onClose={clearShareTarget}
                  onNavigateToView={handleNavigateToView}
                />
              )}
            </LayoutShell>
            <ReloadPrompt />
          </div>
        </LicenseProvider>
      </ViewSimulatorProvider>
    </TerminologyProvider>
  );
}
