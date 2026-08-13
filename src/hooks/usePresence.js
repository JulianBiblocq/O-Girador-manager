import { useEffect, useState } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function usePresence(userId, groupId, isPresenceEnabled = true) {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // 1. Manage current user presence status with strict quota & privacy optimization
  useEffect(() => {
    // Early Return: if presence is disabled by association settings or userId is missing,
    // DO NOT write isOnline / lastActive to Firebase, DO NOT définir up timers or listeners.
    if (!userId || !isPresenceEnabled) return;

    const userRef = doc(db, 'users', userId);

    const updateStatus = (isOnlineStatus) => {
      updateDoc(userRef, {
        isOnline: isOnlineStatus,
        lastActive: new Date().toISOString()
      }).catch(err => {
        console.error("usePresence - Erreur de mise à jour du statut :", err);
      });
    };

    // Mark online when component mounts / user is active
    updateStatus(true);

    // Heartbeat: refresh lastActive every 8 minutes if document is visible
    const HEARTBEAT_INTERVAL = 8 * 60 * 1000; // 8 minutes
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      }
    }, HEARTBEAT_INTERVAL);

    // Gérer le changement de visibilité de l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    };

    // Gérer la fermeture / déchargement de la page
    const handleUnload = () => {
      updateStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Cleanup listeners and heartbeat timer on unmount
    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      updateStatus(false);
    };
  }, [userId, isPresenceEnabled]);

  // 2. Real-time subscription to online members of the group
  useEffect(() => {
    // Early Return: if presence is disabled by association settings or groupId is missing,
    // DO NOT trigger onSnapshot listener, réinitialiser state immediately.
    if (!groupId || !isPresenceEnabled) {
      setOnlineMembers([]);
      setOnlineCount(0);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('groupId', '==', groupId),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activeMembers = [];
      querySnapshot.forEach((docSnap) => {
        activeMembers.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // Trier alphabetically by prenom
      activeMembers.sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));

      setOnlineMembers(activeMembers);
      setOnlineCount(activeMembers.length);
    }, (err) => {
      console.error("usePresence - Erreur d'écoute des membres en ligne :", err);
    });

    return () => unsubscribe();
  }, [groupId, isPresenceEnabled]);

  return { onlineMembers, onlineCount };
}
