import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Trombinoscope from './components/Trombinoscope';
import Forum from './components/Forum';
import UserProfile from './components/UserProfile';
import SystemAdminPanel from './components/SystemAdminPanel';
import LayoutShell from './components/LayoutShell';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'trombinoscope', 'forum', 'profil', 'system-admin'

  // Initialize dark mode from localStorage or system preferences on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
            console.log(`App - Associé ou basculé automatiquement vers le groupe : ${urlGroupId}`);
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

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
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

    return () => {
      unsubscribeAuth();
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
      <LayoutShell>
        <div className="flex-1 flex flex-col justify-center items-center py-12">
          <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
            {checkingProfile ? "Vérification du profil..." : "Chargement..."}
          </span>
        </div>
      </LayoutShell>
    );
  }

  // Not authenticated -> Show Login screen
  if (!user) {
    return <Login />;
  }

  // Authenticated but no profile in Firestore -> Show Onboarding
  if (!profileExists || !profileData) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // Authenticated and profile exists -> Render based on current view state
  return (
    <LayoutShell>
      {currentView === 'trombinoscope' ? (
        <Trombinoscope 
          user={user} 
          profileData={profileData} 
          onBack={() => setCurrentView('dashboard')} 
        />
      ) : currentView === 'forum' ? (
        <Forum 
          user={user} 
          profileData={profileData} 
          onBack={() => setCurrentView('dashboard')} 
        />
      ) : currentView === 'profil' ? (
        <UserProfile 
          user={user} 
          profileData={profileData} 
          onBack={() => setCurrentView('dashboard')} 
        />
      ) : (currentView === 'system-admin' && profileData?.isSystemAdmin) ? (
        <SystemAdminPanel 
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
        />
      )}
    </LayoutShell>
  );
}
