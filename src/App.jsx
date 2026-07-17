import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LayoutShell from './components/LayoutShell';
import { TerminologyProvider } from './components/TerminologyContext';
import { useTranslation } from './components/LanguageContext';
import ReloadPrompt from './components/ReloadPrompt';

const Onboarding = React.lazy(() => import('./components/Onboarding'));
const Trombinoscope = React.lazy(() => import('./components/Trombinoscope'));
const Forum = React.lazy(() => import('./components/Forum'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));
const SystemAdminPanel = React.lazy(() => import('./components/SystemAdminPanel'));
const LayoutEditor = React.lazy(() => import('./components/LayoutEditor'));
const TagManager = React.lazy(() => import('./components/TagManager'));
const InventoryManager = React.lazy(() => import('./components/InventoryManager'));
const OrdersManager = React.lazy(() => import('./components/OrdersManager'));
const AssociationSettings = React.lazy(() => import('./components/AssociationSettings'));
const TreasuryManager = React.lazy(() => import('./components/TreasuryManager'));
const KilometricReimbursementManager = React.lazy(() => import('./components/KilometricReimbursementManager'));
const StudioSocial = React.lazy(() => import('./components/StudioSocial'));
const AdminExport = React.lazy(() => import('./components/AdminExport'));
const VaralManager = React.lazy(() => import('./components/VaralManager'));
const ReportsExports = React.lazy(() => import('./components/ReportsExports'));
const ReunionManager = React.lazy(() => import('./components/ReunionManager'));

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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'trombinoscope', 'forum', 'profil', 'system-admin', 'layout-editor', 'tag-manager'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [unreadPrivateMessagesCount, setUnreadPrivateMessagesCount] = useState(0);
  const [activePrivateChatUserId, setActivePrivateChatUserId] = useState(null);

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
      } else {
        setBranding(null);
        setAssociationName('');
        setMajoriteFeminine(false);
        setSequenceurUrl('');
        setPermissionsMatrice(null);
      }
    }, (error) => {
      console.error("App - Erreur onSnapshot branding :", error);
      setBranding(null);
      setAssociationName('');
      setMajoriteFeminine(false);
      setSequenceurUrl('');
      setPermissionsMatrice(null);
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

      // Draw circular text "★ O GIRADOR ★" at the bottom inside the ring
      ctx.font = 'bold 24px Courier New, Courier, monospace';
      ctx.fillStyle = textCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = "★ O GIRADOR ★";
      const radius = 175;
      const angleStep = 0.16;
      const startAngle = Math.PI / 2 - (label.length - 1) * angleStep / 2;

      for (let i = 0; i < label.length; i++) {
        const charAngle = startAngle + i * angleStep;
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

          const targetSize = 220;
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
          ctx.drawImage(img, 256 - w / 2, 220 - h / 2, w, h);
        } catch (err) {
          console.warn("App - Erreur logo Canvas PWA fallback text :", err);
          ctx.font = 'bold 36px Courier New, Courier, monospace';
          ctx.fillStyle = textCol;
          ctx.fillText(associationName ? associationName.substring(0, 10).toUpperCase() : 'RODA', 256, 210);
        }
      } else {
        ctx.font = 'bold 36px Courier New, Courier, monospace';
        ctx.fillStyle = textCol;
        ctx.fillText(associationName ? associationName.substring(0, 10).toUpperCase() : 'RODA', 256, 210);
      }

      const iconDataUrl = canvas.toDataURL('image/png');

      const manifest = {
        name: `O Girador - ${associationName || 'Maracatu'}`,
        short_name: associationName || 'O Girador',
        theme_color: primaryCol,
        background_color: bgCol,
        start_url: window.location.origin + (activeGroupId ? `/?groupe=${activeGroupId}` : '/'),
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: iconDataUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      };

      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(blob);

      let linkElement = document.querySelector('link[rel="manifest"]');
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'manifest';
        document.head.appendChild(linkElement);
      }
      linkElement.href = manifestUrl;
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
          // Real-time synchronization of the user profile document
          const profileRef = doc(db, 'users', currentUser.uid);
          unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfileData(docSnap.data());
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

  // Loading screen (Auth state resolving or Firestore lookup)
  if (loading || checkingProfile) {
    return (
      <div style={brandingStyle} className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[var(--cordel-bg)] text-[var(--cordel-text)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* A beautiful double ring spinner utilizing theme variables */}
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

  // Not authenticated -> Show Login screen
  if (!user) {
    return (
      <>
        <Login branding={branding} />
        <ReloadPrompt />
      </>
    );
  }

  // Authenticated but no profile in Firestore -> Show Onboarding
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

  // Authenticated and profile exists -> Render based on current view state
  const isSystemOrSuperAdminOrMestre = profileData?.isSystemAdmin || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  const userTags = profileData?.tags || [];

  const hasAccessTroupe = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.troupe?.includes(t));
  const hasAccessLogistique = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.logistique?.includes(t));
  const hasAccessTresorerie = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.tresorerie?.includes(t));
  const hasAccessStudio = isSystemOrSuperAdminOrMestre || userTags.some(t => permissionsMatrice?.studio?.includes(t));

  return (
    <TerminologyProvider majoriteFeminine={majoriteFeminine}>
      <div style={brandingStyle} className="min-h-screen flex flex-col w-full">
        <LayoutShell 
          logoUrl={branding?.logoUrl} 
          associationName={associationName}
          sequenceurUrl={sequenceurUrl}
          currentView={currentView}
          onNavigateToView={(view) => setCurrentView(view)}
          profileData={profileData}
          onSignOut={handleSignOut}
          unreadPrivateMessagesCount={unreadPrivateMessagesCount}
          permissionsMatrice={permissionsMatrice}
        >
          <React.Suspense fallback={
            <div className="flex-1 flex flex-col justify-center items-center py-12">
              <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
              <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                {t('dashboard.loadingPage')}
              </span>
            </div>
          }>
            {currentView === 'trombinoscope' ? (
              <Trombinoscope 
                user={user} 
                profileData={profileData} 
                onBack={() => setCurrentView('dashboard')} 
                onContactUser={(otherUserId) => {
                  setActivePrivateChatUserId(otherUserId);
                  setCurrentView('forum');
                }}
              />
            ) : currentView === 'forum' ? (
              <Forum 
                user={user} 
                profileData={profileData} 
                onBack={() => setCurrentView('dashboard')} 
                activePrivateChatUserId={activePrivateChatUserId}
                onClearActivePrivateChat={() => setActivePrivateChatUserId(null)}
              />
            ) : currentView === 'profil' ? (
              <UserProfile 
                user={user} 
                profileData={profileData} 
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'system-admin' && hasAccessTroupe) ? (
              <SystemAdminPanel 
                user={user} 
                profileData={profileData} 
                onBack={() => setCurrentView('dashboard')} 
                onNavigateToView={(view) => setCurrentView(view)}
              />
            ) : (currentView === 'layout-editor' && isSystemOrSuperAdminOrMestre) ? (
              <LayoutEditor 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'tag-manager' && hasAccessTroupe) ? (
              <TagManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => setCurrentView('system-admin')} 
              />
            ) : (currentView === 'inventory' && hasAccessLogistique) ? (
              <InventoryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'orders-manager' && hasAccessLogistique) ? (
              <OrdersManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessLogistique={hasAccessLogistique}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'treasury' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="cotisations"
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'kilometric-reimbursement' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="frais-km"
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'export-annu' && hasAccessTroupe) ? (
              <AdminExport 
                user={user}
                profileData={profileData}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'reports-exports' && hasAccessTresorerie) ? (
              <TreasuryManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                hasAccessTresorerie={hasAccessTresorerie}
                profileData={profileData}
                initialTab="reports-exports"
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'association-settings' && isSystemOrSuperAdminOrMestre) ? (
              <AssociationSettings 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => setCurrentView('system-admin')} 
              />
            ) : (currentView === 'studio-social' && hasAccessStudio) ? (
              <StudioSocial 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                branding={branding}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'varal-manager' && hasAccessStudio) ? (
              <VaralManager 
                groupId={profileData?.groupId}
                role={profileData?.role}
                isSystemAdmin={profileData?.isSystemAdmin}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (currentView === 'reunion-manager' && hasAccessStudio) ? (
              <ReunionManager 
                groupId={profileData?.groupId}
                user={user}
                profileData={profileData}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : (
              <Dashboard 
                user={user} 
                profileData={profileData} 
                onNavigateToTrombi={() => setCurrentView('trombinoscope')} 
                onNavigateToView={(view) => setCurrentView(view)}
                onSignOut={handleSignOut} 
                installPromptAvailable={installPromptAvailable}
                onTriggerInstall={triggerInstallPrompt}
                permissionsMatrice={permissionsMatrice}
              />
            )}
          </React.Suspense>
        </LayoutShell>
        <ReloadPrompt />
      </div>
    </TerminologyProvider>
  );
}
