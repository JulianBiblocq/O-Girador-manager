import { useEffect, useState, useMemo, useRef } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { canonicalizeGroupId } from '../utils/tenantUtils';

// Intervalles de pulsation, seuils d'expiration et périodes de grâce
const HEARTBEAT_INTERVAL_MS = 2.5 * 60 * 1000;
const ONLINE_TIMEOUT_MS = 5 * 60 * 1000;
const VISIBILITY_GRACE_PERIOD_MS = 2 * 60 * 1000;
const LOCAL_TICK_INTERVAL_MS = 30 * 1000;

/**
 * Hook de présence en temps réel (< 170 lignes)
 * Gère le statut de l'utilisateur connecté et écoute les membres en ligne
 * avec filtrage strict par horodatage d'activité récente (TTL 5 minutes),
 * période de grâce contre les micro-coupures de visibilité et normalisation multi-casse du groupId.
 */
export function usePresence(userId, groupId, isPresenceEnabled = true, afficherEnLigne = true, isAdmin = false) {
  const [rawOnlineDocs, setRawOnlineDocs] = useState([]);
  const [now, setNow] = useState(Date.now());
  const cleanedIdsRef = useRef(new Set());
  const hideTimerRef = useRef(null);

  // 1. Ticker local d'expiration en mémoire : recalcul toutes les 30s sans appel réseau
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), LOCAL_TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // 2. Gestion du statut de présence de l'utilisateur connecté (heartbeat, grâce de visibilité)
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
      return () => updateStatus(false);
    }

    // Mise à jour initiale sécurisée avec retry si l'authentification est en cours d'initialisation
    let retryTimer = null;
    const attemptInitialOnline = () => {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        retryTimer = setTimeout(attemptInitialOnline, 500);
        return;
      }
      updateStatus(true);
    };
    attemptInitialOnline();

    // Heartbeat périodique : rafraîchir l'horodatage si l'onglet est actif
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') updateStatus(true);
    }, HEARTBEAT_INTERVAL_MS);

    // Détection de visibilité avec période de grâce pour éviter les oscillations intempestives
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        updateStatus(true);
      } else {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => updateStatus(false), VISIBILITY_GRACE_PERIOD_MS);
      }
    };

    const handleUnload = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      updateStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      clearInterval(heartbeatTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      updateStatus(false);
    };
  }, [userId, isPresenceEnabled, afficherEnLigne]);

  // 3. Écoute en temps réel des documents Firestore avec support multi-casse du groupId
  useEffect(() => {
    if (!groupId || !isPresenceEnabled) {
      setRawOnlineDocs([]);
      return;
    }

    const canonicalGroup = canonicalizeGroupId(groupId);
    const rawTrimmed = typeof groupId === 'string' ? groupId.trim() : '';
    const variants = Array.from(new Set([
      canonicalGroup,
      rawTrimmed,
      canonicalGroup ? canonicalGroup.toLowerCase() : '',
      rawTrimmed ? rawTrimmed.toLowerCase() : ''
    ].filter(Boolean)));

    const usersRef = collection(db, 'users');
    const variantMaps = new Map();

    const rebuildMergedList = () => {
      const mergedMap = new Map();
      variantMaps.forEach(docsList => {
        docsList.forEach(d => mergedMap.set(d.id, d));
      });
      setRawOnlineDocs(Array.from(mergedMap.values()));
    };

    const unsubscribes = variants.map(variant => {
      const q = query(usersRef, where('groupId', '==', variant), where('isOnline', '==', true));
      return onSnapshot(q, (snapshot) => {
        const docs = [];
        snapshot.forEach(docSnap => docs.push({ id: docSnap.id, ...docSnap.data() }));
        variantMaps.set(variant, docs);
        rebuildMergedList();
      }, (err) => {
        console.error("usePresence - Erreur d'écoute des membres en ligne :", err);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [groupId, isPresenceEnabled]);

  // 4. Filtrage dynamique et auto-nettoyage des statuts périmés (TTL 5 minutes)
  const onlineMembers = useMemo(() => {
    if (!isPresenceEnabled || !groupId) return [];

    return rawOnlineDocs
      .filter((member) => {
        if (member.afficherEnLigne === false || member.isOnline !== true || !member.lastActive) return false;
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

  return { onlineMembers, onlineCount: onlineMembers.length };
}
