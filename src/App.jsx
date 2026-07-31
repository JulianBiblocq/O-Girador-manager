import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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

import { lazyWithRetry } from './utils/pwaUtils';
import { resolveEffectiveUserTags } from './utils/tagUtils';
import { getMigratedRoleAndTags } from './utils/roleMigration';

const Onboarding = lazyWithRetry(() => import('./components/Onboarding'));
const Trombinoscope = lazyWithRetry(() => import('./components/Trombinoscope'));
const Forum = lazyWithRetry(() => import('./components/Forum'));
const UserProfile = lazyWithRetry(() => import('./components/UserProfile'));
const UserMateriel = lazyWithRetry(() => import('./components/profile/UserMateriel'));
const MonVestiaire = lazyWithRetry(() => import('./components/profile/MonVestiaire'));
const SystemAdminPanel = lazyWithRetry(() => import('./components/SystemAdminPanel'));
const LayoutEditor = lazyWithRetry(() => import('./components/LayoutEditor'));
const TagManager = lazyWithRetry(() => import('./components/TagManager'));
const InventoryManager = lazyWithRetry(() => import('./components/InventoryManager'));
const OrdersManager = lazyWithRetry(() => import('./components/OrdersManager'));
const WardrobeManager = lazyWithRetry(() => import('./components/mestre/WardrobeManager'));
const AssociationSettings = lazyWithRetry(() => import('./components/AssociationSettings'));
const TreasuryManager = lazyWithRetry(() => import('./components/TreasuryManager'));
const StudioSocial = lazyWithRetry(() => import('./components/StudioSocial'));
const StudioEventsManager = lazyWithRetry(() => import('./components/studio/StudioEventsManager'));
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
const MestreWorkshops = lazyWithRetry(() => import('./components/mestre/MestreWorkshops'));
const MestreMotMestre = lazyWithRetry(() => import('./components/mestre/MestreMotMestre'));
const WidgetAgenda = lazyWithRetry(() => import('./components/WidgetAgenda'));
const WidgetDocuments = lazyWithRetry(() => import('./components/WidgetDocuments'));
const AtelierCouture = lazyWithRetry(() => import('./components/profile/AtelierCouture'));

const POLES_CONFIG = [
  {
    id: 'accueil',
    label: 'Accueil',
    tabs: []
  },
  {
    id: 'mon-espace',
    label: 'Espace',
    tabs: [
      { id: 'profil', label: 'Profil', labelKey: 'tabProfil' },
      { id: 'agenda', label: 'Agenda', labelKey: 'tabAgenda' },
      { id: 'materiel', label: 'Matériel', labelKey: 'tabMateriel' },
      { id: 'vestiaire', label: 'Vestiaire', labelKey: 'tabVestiaire' },
      { id: 'trombinoscope', label: 'Trombinoscope', labelKey: 'tabTrombinoscope' },
      { id: 'forum', label: 'Porte-voix', labelKey: 'tabForum' }
    ]
  },
  {
    id: 'troupe',
    label: 'Troupe',
    tabs: [
      { id: 'export-annu', label: 'Annuaire', labelKey: 'tabExportAnnu' },
      { id: 'tag-manager', label: 'Badges', labelKey: 'tabTagManager' },
      { id: 'instruments', label: 'Pupitres', labelKey: 'tabInstruments' }
    ]
  },
  {
    id: 'tresorerie',
    label: 'Trésorerie',
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
    tabs: [
      { id: 'inventory', label: 'Instruments', labelKey: 'tabInventory' },
      { id: 'orders-manager', label: 'Commandes', labelKey: 'tabOrders' }
    ]
  },
  {
    id: 'vestiaire',
    label: 'Vestiaire',
    labelKey: 'poleWardrobe',
    tabs: [
      { id: 'wardrobe-inventory', label: "Costumes", labelKey: 'tabWardrobeInventory' },
      { id: 'wardrobe-couture', label: 'Atelier Couture', labelKey: 'tabWardrobeCouture' },
      { id: 'wardrobe-sizes', label: 'Mensurations', labelKey: 'tabWardrobeSizes' }
    ]
  },
  {
    id: 'studio',
    label: 'Studio',
    tabs: [
      { id: 'studio-events', label: 'Événements', labelKey: 'tabStudioEvents' },
      { id: 'studio-social', label: 'Studio social', labelKey: 'tabStudioSocial' },
      { id: 'reunion-manager', label: 'Réunions', labelKey: 'tabReunions' },
      { id: 'varal-manager', label: 'Varal', labelKey: 'tabVaral' },
      { id: 'activity-reports', label: "Rapports", labelKey: 'tabActivityReports' },
      { id: 'mestre-forum-channels', label: 'Porte-voix', labelKey: 'tabMestreForumChannels' }
    ]
  },
  {
    id: 'mestre',
    label: 'Mestria',
    tabs: [
      { id: 'mestre-orientation', label: 'Casting', labelKey: 'tabMestreOrientation' },
      { id: 'mestre-events', label: 'Événements', labelKey: 'tabMestreEvents' },
      { id: 'mestre-stage-layout', label: 'Plan de Scène', labelKey: 'tabMestreStage' },
      { id: 'mestre-sequenceur', label: 'Séquenceur', labelKey: 'tabMestreSequenceur' },
      { id: 'mestre-workshops', label: 'Ateliers', labelKey: 'tabMestreWorkshops' },
      { id: 'mestre-mot-mestre', label: 'Annonces', labelKey: 'tabMestreMotMestre' }
    ]
  },
  {
    id: 'vitrine',
    label: 'Vitrine',
    labelKey: 'poleVitrine',
    tabs: [
      { id: 'vitrine-editor', label: 'Vitrine', labelKey: 'tabVitrine' }
    ]
  },
  {
    id: 'config',
    label: 'Configuration',
    tabs: [
      { id: 'config-identity', label: 'Identité', labelKey: 'tabConfigIdentity' },
      { id: 'config-communication', label: 'Communication & Newsletter', labelKey: 'tabConfigCommunication' },
      { id: 'config-profile', label: 'Organisation', labelKey: 'tabConfigProfile' },
      { id: 'config-security', label: 'Sécurité', labelKey: 'tabConfigSecurity' },
      { id: 'config-modules', label: 'Modules & Fonctionnalités', labelKey: 'tabConfigModules' },
      { id: 'config-logistics', label: 'Logistique', labelKey: 'tabConfigLogistics' },
      { id: 'config-documents', label: 'Documents', labelKey: 'tabConfigDocuments' },
      { id: 'config-agenda', label: "Configuration de l'agenda", labelKey: 'tabConfigAgenda' },
      { id: 'config-lieux', label: "Lieux & Salles", labelKey: 'tabConfigLieux' },
      { id: 'config-layout', label: 'Apparence', labelKey: 'tabConfigLayout' }
    ]
  }
];

export default function App() {
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
  const [initialPrivateMessage, setInitialPrivateMessage] = useState('');
  const [dashboardKey, setDashboardKey] = useState(0);

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
  }, [profileData?.dateNaissance]);

  // Load branding in real-time
  useEffect(() => {
    let activeGroupId = profileData?.groupId || null;
    
    if (!activeGroupId) {
      const searchParams = new URLSearchParams(window.location.search);
      activeGroupId = searchParams.get('groupe') || null;
    }

    if (!activeGroupId) {
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
      setBranding(null);
      setAssociationName('');
      setMajoriteFeminine(false);
      setSequenceurUrl('');
      setPermissionsMatrice(null);
      setTagsDisponibles([]);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, user]);

  // Dynamic favicon customization based on association branding
  useEffect(() => {
    const faviconElement = document.getElementById("favicon") || document.querySelector("link[rel*='icon']");
    if (faviconElement) {
      faviconElement.href = branding?.logoUrl ? branding.logoUrl : "/favicon.svg";
    }
  }, [branding?.logoUrl]);

  // Personnalisation dynamique du titre du document HTML et de la PWA selon le nom de l'association
  useEffect(() => {
    const fullAppName = associationName ? `O Girador ${associationName}` : "O Girador Samambaia";
    document.title = fullAppName;

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta) {
      appleTitleMeta.setAttribute('content', fullAppName);
    }
  }, [associationName]);

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

  // Initialize theme: force light theme by default, disable dark mode completely
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

      // Update favicon and apple-touch-icon with branded canvas icon
      let faviconElement = document.querySelector('link#favicon') || document.querySelector('link[rel="icon"]');
      if (faviconElement && iconDataUrl) {
        faviconElement.href = iconDataUrl;
      }
      let appleIconElement = document.querySelector('link[rel="apple-touch-icon"]');
      if (appleIconElement && iconDataUrl) {
        appleIconElement.href = iconDataUrl;
      }

      // Update meta theme-color
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

    const handleDeepLinkNavigation = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname || '';

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
    };

    handleDeepLinkNavigation();

    // Écoute des événements de navigation (ex: clic notification Push quand déjà ouvert)
    window.addEventListener('popstate', handleDeepLinkNavigation);
    return () => window.removeEventListener('popstate', handleDeepLinkNavigation);
  }, [user, profileData]);

  // Sync unread private messages count
  useEffect(() => {
    if (!user?.uid) {
      setUnreadPrivateMessagesCount(0);
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
    }, (error) => {
      console.error("App - Error syncing unread messages:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    let unsubscribeProfile = null;
    let unsubscribeAuth = null;
    let isMounted = true;

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
          setLoading(false);
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
      setCurrentView('dashboard'); // Reset navigation view on sign out
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  // Called after onboarding completes successfully
  const handleOnboardingComplete = () => {
    // No need to fetch manually, the onSnapshot listener handles it automatically
  };

  // 1. Écran de chargement (Authentification ou chargement Firestore)
  if (loading || checkingProfile) {
    const logoSrc = branding?.logoUrl || '/Pictures/logo-samambaia.png';
    return (
      <div style={brandingStyle} className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[var(--cordel-bg)] text-[var(--cordel-text)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs sm:max-w-sm w-full">
          {logoSrc && (
            <img 
              src={logoSrc} 
              alt="Logo Association" 
              className="max-w-xs max-h-36 object-contain w-auto h-auto mb-2 select-none" 
            />
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

  // 2. Route Racine '/' -> Vitrine Publique One-Page enveloppée par PublicThemeProvider
  if (currentRoute === '/' || currentRoute === '' || currentRoute === '/index.html') {
    return (
      <PublicThemeProvider groupId={profileData?.groupId}>
        <PublicHome
          groupId={profileData?.groupId}
          user={user}
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

  // 4. Utilisateur connecté mais profil Firestore manquant -> Onboarding
  if (!profileExists || !profileData) {
    return (
      <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
        <React.Suspense fallback={<div className="flex-1 flex justify-center items-center py-12 animate-pulse text-xs font-bold select-none">⏳ Initialisation...</div>}>
          <Onboarding user={user} branding={branding} onComplete={handleOnboardingComplete} />
        </React.Suspense>
        <ReloadPrompt />
      </div>
    );
  }

  // 5. Utilisateur connecté avec profil valide -> Rendu de l'Espace Membre Privé (/app)
  const isSystemOrSuperAdminOrMestre = profileData?.isSystemAdmin || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  const isMasterKeyActive = isSystemOrSuperAdminOrMestre && breakGlassActive;
  const userTags = resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);

  const isModuleEnabled = (tabId, poleId) => {
    if (!enabledModules) return true;

    // Check Pole-level module toggle
    if (poleId === 'tresorerie' && enabledModules.tresorerie === false) return false;
    if (poleId === 'logistique' && enabledModules.logistique === false && enabledModules.commandes === false) return false;
    if (poleId === 'vestiaire' && enabledModules.vestiaire === false) return false;
    if (poleId === 'mestre' && enabledModules.mestre === false) return false;

    // Check Tab-level module toggle
    if (['dashboard-finance', 'cotisations', 'events-finances', 'operations-diverses', 'frais-km', 'reports-exports'].includes(tabId) && enabledModules.tresorerie === false) return false;
    if (tabId === 'inventory' && enabledModules.logistique === false) return false;
    if (tabId === 'orders-manager' && enabledModules.commandes === false) return false;
    if (['vestiaire', 'wardrobe-inventory', 'wardrobe-couture', 'wardrobe-sizes'].includes(tabId) && enabledModules.vestiaire === false) return false;
    if (['studio-social', 'varal-manager'].includes(tabId) && enabledModules.studioSocial === false) return false;
    if (tabId === 'reunion-manager' && enabledModules.reunions === false) return false;
    if (['forum', 'mestre-forum-channels'].includes(tabId) && enabledModules.forum === false) return false;
    if (['mestre-orientation', 'mestre-events', 'mestre-stage-layout', 'mestre-sequenceur', 'mestre-workshops', 'mestre-mot-mestre'].includes(tabId) && enabledModules.mestre === false) return false;

    return true;
  };

  const checkTabAccess = (tabId, poleId) => {
    // 0. Strict Global Feature Toggle check (Hides & blocks for EVERYONE including super-admin if OFF)
    if (!isModuleEnabled(tabId, poleId)) return false;

    // Master Key Bypass ONLY if Break-Glass Technical Intervention Mode is ACTIVE
    if (isMasterKeyActive) return true;

    // Public member tabs
    if (['profil', 'agenda', 'materiel', 'vestiaire', 'trombinoscope', 'forum', 'dashboard', 'varal'].includes(tabId)) {
      return true;
    }

    if (tabId === 'vitrine-editor') {
      if (profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true) {
        return true;
      }
    }

    if (!userTags || userTags.length === 0) return false;

    // 1. Direct tab permission check in permissionsMatrice
    const tabTags = permissionsMatrice?.[tabId];
    if (Array.isArray(tabTags) && tabTags.length > 0) {
      return userTags.some(t => tabTags.includes(t));
    }

    // 2. Fallback to Pole-level permission check for backward compatibility
    if (poleId) {
      const poleTags = permissionsMatrice?.[poleId];
      if (Array.isArray(poleTags) && poleTags.length > 0) {
        return userTags.some(t => poleTags.includes(t));
      }
    }

    return false;
  };

  const hasAccessTroupe = isMasterKeyActive || checkTabAccess('export-annu', 'troupe') || checkTabAccess('tag-manager', 'troupe') || checkTabAccess('instruments', 'troupe');
  const hasAccessLogistique = isMasterKeyActive || checkTabAccess('inventory', 'logistique') || checkTabAccess('orders-manager', 'logistique');
  const hasAccessTresorerie = isMasterKeyActive || checkTabAccess('dashboard-finance', 'tresorerie') || checkTabAccess('cotisations', 'tresorerie') || checkTabAccess('events-finances', 'tresorerie') || checkTabAccess('operations-diverses', 'tresorerie') || checkTabAccess('frais-km', 'tresorerie') || checkTabAccess('reports-exports', 'tresorerie');
  const hasAccessStudio = isMasterKeyActive || checkTabAccess('studio-events', 'studio') || checkTabAccess('studio-social', 'studio') || checkTabAccess('reunion-manager', 'studio') || checkTabAccess('varal-manager', 'studio') || checkTabAccess('activity-reports', 'studio') || checkTabAccess('mestre-forum-channels', 'studio');
  const hasAccessVestiaire = isMasterKeyActive || checkTabAccess('wardrobe-inventory', 'vestiaire') || checkTabAccess('wardrobe-couture', 'vestiaire') || checkTabAccess('wardrobe-sizes', 'vestiaire');
  const hasAccessMestre = isMasterKeyActive || checkTabAccess('mestre-orientation', 'mestre') || checkTabAccess('mestre-events', 'mestre') || checkTabAccess('mestre-stage-layout', 'mestre') || checkTabAccess('mestre-sequenceur', 'mestre') || checkTabAccess('mestre-workshops', 'mestre') || checkTabAccess('mestre-mot-mestre', 'mestre');
  const hasAccessVitrine = isMasterKeyActive || checkTabAccess('vitrine-editor', 'vitrine');
  const hasAccessConfig = isMasterKeyActive || checkTabAccess('config-identity', 'config') || checkTabAccess('config-communication', 'config') || checkTabAccess('config-profile', 'config') || checkTabAccess('config-security', 'config') || checkTabAccess('config-modules', 'config') || checkTabAccess('config-logistics', 'config') || checkTabAccess('config-documents', 'config') || checkTabAccess('config-agenda', 'config') || checkTabAccess('config-lieux', 'config') || checkTabAccess('config-layout', 'config');
  const hasAccessForumMod = isMasterKeyActive || userTags.some(t => ['Modérateur', 'Modérateur Forum', 'Gestionnaire Porte-voix', 'Porte-voix'].includes(t));

  const handleNavigateToPole = (poleId) => {
    setCurrentPole(poleId);
    if (poleId === 'accueil') {
      setCurrentTab('dashboard');
      setDashboardKey(prev => prev + 1);
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
    if (viewName === 'forum' && extraOptions?.userId) {
      setActivePrivateChatUserId(extraOptions.userId);
      setInitialPrivateMessage(extraOptions.message || '');
    }

    switch (viewName) {
      case 'dashboard':
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
        setDashboardKey(prev => prev + 1);
        break;
      case 'profile':
      case 'profil':
        setCurrentPole('mon-espace');
        setCurrentTab('profil');
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
        setCurrentPole('troupe');
        setCurrentTab('export-annu');
        break;
      case 'system-admin':
        setCurrentPole('troupe');
        setCurrentTab('system-admin');
        break;
      case 'tag-manager':
        setCurrentPole('troupe');
        setCurrentTab('tag-manager');
        break;
      case 'materiel':
      case 'inventory':
        setCurrentPole('logistique');
        setCurrentTab('inventory');
        break;
      case 'vestiaire':
      case 'wardrobe-inventory':
        setCurrentPole('vestiaire');
        setCurrentTab('wardrobe-inventory');
        break;
      case 'orders-manager':
        setCurrentPole('logistique');
        setCurrentTab('orders-manager');
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
      case 'studio-events':
        setCurrentPole('studio');
        setCurrentTab('studio-events');
        break;
      case 'studio-social':
        setCurrentPole('studio');
        setCurrentTab('studio-social');
        break;
      case 'varal-manager':
        setCurrentPole('studio');
        setCurrentTab('varal-manager');
        break;
      case 'reunion-manager':
        setCurrentPole('studio');
        setCurrentTab('reunion-manager');
        break;
      case 'activity-reports':
        setCurrentPole('studio');
        setCurrentTab('activity-reports');
        break;
      case 'agenda':
        setCurrentPole('accueil');
        setCurrentTab('agenda');
        break;
      case 'varal':
        setCurrentPole('accueil');
        setCurrentTab('varal');
        break;
      default:
        setCurrentPole('accueil');
        setCurrentTab('dashboard');
    }
  };

  return (
    <TerminologyProvider majoriteFeminine={majoriteFeminine}>
      <div style={brandingStyle} className="min-h-screen flex flex-col w-full">
        <LayoutShell 
          logoUrl={branding?.logoUrl} 
          associationName={associationName}
          sequenceurUrl={sequenceurUrl}
          currentPole={currentPole}
          onNavigateToPole={handleNavigateToPole}
          currentTab={currentTab}
          onNavigateToTab={(tab) => setCurrentTab(tab)}
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
            ) : (currentTab === 'export-annu' && hasAccessTroupe) ? (
              <AdminExport 
                user={user}
                profileData={profileData}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'system-admin' && hasAccessTroupe) ? (
              <SystemAdminPanel 
                user={user} 
                profileData={profileData} 
                associationName={associationName}
                onBack={() => handleNavigateToPole('accueil')} 
                onNavigateToView={handleNavigateToView}
              />
            ) : (currentTab === 'tag-manager' && hasAccessTroupe) ? (
              <TagManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => setCurrentTab('export-annu')} 
              />
            ) : (currentTab === 'instruments' && hasAccessTroupe) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="instruments-only"
                activeTabProp="organisation"
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
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'orders-manager' && hasAccessLogistique) ? (
              <OrdersManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (['wardrobe-inventory', 'wardrobe-couture', 'wardrobe-sizes'].includes(currentTab) && hasAccessVestiaire) ? (
              <WardrobeManager
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessVestiaire}
                hasAccessVestiaire={hasAccessVestiaire}
                activeTab={
                  currentTab === 'wardrobe-inventory' ? 'inventory' :
                  currentTab === 'wardrobe-couture' ? 'couture' : 'sizes'
                }
                onBack={() => handleNavigateToPole('accueil')}
              />
            ) : (currentTab === 'studio-events' && hasAccessStudio) ? (
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
            ) : (currentTab === 'reunion-manager' && hasAccessStudio) ? (
              <ReunionManager 
                groupId={profileData?.groupId}
                user={user}
                profileData={profileData}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'varal-manager' && hasAccessStudio) ? (
               <VaralManager 
                 groupId={profileData?.groupId}
                 role={profileData?.role}
                 isSystemAdmin={profileData?.isSystemAdmin}
                 onBack={() => handleNavigateToPole('accueil')} 
               />
            ) : (currentTab === 'activity-reports' && hasAccessStudio) ? (
              <ActivityReports 
                groupId={profileData?.groupId}
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'mestre-forum-channels' && (hasAccessStudio || hasAccessMestre || hasAccessForumMod)) ? (
              <ForumChannelsManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => handleNavigateToPole('accueil')} 
              />
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
            ) : (currentTab === 'mestre-sequenceur' && hasAccessMestre) ? (
              <MestreSequenceur 
                groupId={profileData?.groupId}
                sequenceurUrl={sequenceurUrl}
              />
            ) : (currentTab === 'mestre-workshops' && hasAccessMestre) ? (
              <MestreWorkshops 
                groupId={profileData?.groupId}
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
              />
            ) : (currentTab === 'config-communication' && checkTabAccess('config-communication', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="communication"
                mode="communication-only"
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
            ) : (currentTab === 'config-security' && checkTabAccess('config-security', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="security"
                mode="security-only"
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
            ) : (currentTab === 'config-logistics' && checkTabAccess('config-logistics', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                activeTabProp="logistics"
                mode="logistics-only"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-documents' && checkTabAccess('config-documents', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="documents-only"
                activeTabProp="finance"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-agenda' && checkTabAccess('config-agenda', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="agenda-only"
                activeTabProp="agenda"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-lieux' && checkTabAccess('config-lieux', 'config')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="lieux-only"
                activeTabProp="lieux"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'vitrine-editor' && checkTabAccess('vitrine-editor', 'vitrine')) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                mode="public-theme-only"
                activeTabProp="public-theme"
                onBack={() => handleNavigateToPole('accueil')} 
              />
            ) : (currentTab === 'config-layout' && checkTabAccess('config-layout', 'config')) ? (
              <LayoutEditor 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
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
              />
            )}
            </ErrorBoundary>
          </React.Suspense>
        </LayoutShell>
        <ReloadPrompt />
      </div>
    </TerminologyProvider>
  );
}
