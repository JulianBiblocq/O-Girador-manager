import { useEffect, useState, useMemo, useRef } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Intervalle d'émission du battement de cœur de l'utilisateur actif (2 min 30 s)
const HEARTBEAT_INTERVAL_MS = 2.5 * 60 * 1000;

// Seuil d'inactivité au-delà duquel un membre est considéré hors ligne (5 minutes)
const ONLINE_TIMEOUT_MS = 5 * 60 * 1000;

// Fréquence d'évaluation locale du statut d'expiration (en mémoire, zéro requête réseau)
const LOCAL_TICK_INTERVAL_MS = 30 * 1000;

/**
 * Hook de présence en temps réel (< 160 lignes)
 * Gère le statut de l'utilisateur connecté et écoute les membres en ligne
 * avec filtrage strict par horodatage d'activité récente (TTL 5 minutes).
 */
export function usePresence(userId, groupId, isPresenceEnabled = true, afficherEnLigne = true, isAdmin = false) {
  const [rawOnlineDocs, setRawOnlineDocs] = useState([]);
  const [now, setNow] = useState(Date.now());
  const cleanedIdsRef = useRef(new Set());

  // 1. Ticker local d'expiration en mémoire : recalcul toutes les 30s sans aucun appel réseau Firestore
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, LOCAL_TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // 2. Gestion du statut de présence de l'utilisateur connecté (heartbeat et visibilité)
  useEffect(() => {
    if (!userId || !isPresenceEnabled) return;

    const userRef = doc(db, 'users', userId);

    const updateStatus = (isOnlineStatus) => {
      if (!auth.currentUser || auth.currentUser.uid !== userId) return;

      updateDoc(userRef, {
        isOnline: isOnlineStatus,
        lastActive: new Date().toISOString()
      }).catch(err => {
        if (err?.code !== 'permission-denied') {
          console.error("usePresence - Erreur de mise à jour du statut :", err);
        }
      });
    };

    if (afficherEnLigne === false) {
      updateStatus(false);
      return () => {
        updateStatus(false);
      };
    }

    // Marquer l'utilisateur en ligne dès la connexion
    updateStatus(true);

    // Heartbeat : rafraîchir l'horodatage si l'onglet est actif
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Détection immédiate du masquage ou de la fermeture de l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    };

    const handleUnload = () => {
      updateStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      updateStatus(false);
    };
  }, [userId, isPresenceEnabled, afficherEnLigne]);

  // 3. Écoute en temps réel des documents Firestore avec isOnline == true
  useEffect(() => {
    if (!groupId || !isPresenceEnabled) {
      setRawOnlineDocs([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('groupId', '==', groupId),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((docSnap) => {
        docs.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setRawOnlineDocs(docs);
    }, (err) => {
      console.error("usePresence - Erreur d'écoute des membres en ligne :", err);
    });

    return () => unsubscribe();
  }, [groupId, isPresenceEnabled]);

  // 4. Filtrage dynamique et auto-nettoyage des statuts périmés (TTL 5 minutes)
  const onlineMembers = useMemo(() => {
    if (!isPresenceEnabled || !groupId) return [];

    return rawOnlineDocs
      .filter((member) => {
        if (member.afficherEnLigne === false) return false;
        if (member.isOnline !== true) return false;
        if (!member.lastActive) return false;

        const lastActiveTime = new Date(member.lastActive).getTime();
        if (isNaN(lastActiveTime)) return false;

        const isFresh = (now - lastActiveTime) <= ONLINE_TIMEOUT_MS;

        // Auto-nettoyage opportuniste dans Firestore si l'utilisateur est admin et le statut périmé (> 15 min)
        if (!isFresh && isAdmin && (now - lastActiveTime > 15 * 60 * 1000)) {
          if (!cleanedIdsRef.current.has(member.id)) {
            cleanedIdsRef.current.add(member.id);
            updateDoc(doc(db, 'users', member.id), { isOnline: false }).catch(() => {});
          }
        }

        return isFresh;
      })
      .sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));
  }, [rawOnlineDocs, now, isPresenceEnabled, groupId, isAdmin]);

  const onlineCount = onlineMembers.length;

  return { onlineMembers, onlineCount };
}
