import { useEffect, useState } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export function usePresence(userId, groupId, isPresenceEnabled = true, afficherEnLigne = true) {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // 1. Gestion du statut de présence de l'utilisateur avec optimisation stricte des quotas Firestore
  useEffect(() => {
    // Si la présence est désactivée globalement par l'association ou si userId est absent,
    // ne pas écrire sur Firestore et ne pas attacher d'écouteurs.
    if (!userId || !isPresenceEnabled) return;

    const userRef = doc(db, 'users', userId);

    const updateStatus = (isOnlineStatus) => {
      // Si l'utilisateur n'est plus connecté ou si la session a expiré, ne pas tenter l'écriture
      if (!auth.currentUser || auth.currentUser.uid !== userId) return;

      updateDoc(userRef, {
        isOnline: isOnlineStatus,
        lastActive: new Date().toISOString()
      }).catch(err => {
        // Ignorer silencieusement si la déconnexion a déjà invalidé les permissions
        if (err?.code !== 'permission-denied') {
          console.error("usePresence - Erreur de mise à jour du statut :", err);
        }
      });
    };

    // Si l'utilisateur a désactivé sa visibilité en ligne (mode discret)
    if (afficherEnLigne === false) {
      // Déclencher immédiatement un passage à isOnline: false sur Firestore pour le compte
      updateStatus(false);
      // Stopper l'émission du heartbeat et ne pas enregistrer d'écouteurs de visibilité
      return () => {
        updateStatus(false);
      };
    }

    // Marquer en ligne lorsque le composant est monté et que l'utilisateur est actif
    updateStatus(true);

    // Heartbeat : rafraîchir lastActive toutes les 8 minutes si le document est visible
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

    // Gérer la fermeture ou déchargement de la page
    const handleUnload = () => {
      updateStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Nettoyage des écouteurs et du timer de battement de cœur lors du démontage
    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      updateStatus(false);
    };
  }, [userId, isPresenceEnabled, afficherEnLigne]);

  // 2. Écoute en temps réel des membres en ligne du groupe (maintien de l'écoute en lecture)
  useEffect(() => {
    // Si la présence est désactivée par l'association ou si le groupe est absent,
    // réinitialiser immédiatement l'état et ne pas déclencher d'écouteur Firestore.
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

      // Tri alphabétique par prénom
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
