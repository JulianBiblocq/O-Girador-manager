import { useEffect, useState } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function usePresence(userId, groupId) {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // 1. Manage current user presence status with strict quota optimization
  useEffect(() => {
    if (!userId) return;

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

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    };

    // Handle page unload / close
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
  }, [userId]);

  // 2. Real-time subscription to online members of the group
  useEffect(() => {
    if (!groupId) {
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

      // Sort alphabetically by prenom
      activeMembers.sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));

      setOnlineMembers(activeMembers);
      setOnlineCount(activeMembers.length);
    }, (err) => {
      console.error("usePresence - Erreur d'écoute des membres en ligne :", err);
    });

    return () => unsubscribe();
  }, [groupId]);

  return { onlineMembers, onlineCount };
}
