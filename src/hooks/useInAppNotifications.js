/**
 * Hook personnalisé pour la gestion en temps réel des notifications internes In-App.
 * Écoute la sous-collection users/{userId}/in_app_notifications et fournit les méthodes
 * de marquage comme lu à l'unité ou en lot.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { collection, query, limit, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { isDemoMode } from '../demo/demoManager';
import { playNotificationSound } from '../utils/soundService';

// Variable mémorisant si la suppression physique 'delete' est autorisée par les règles distantes Firestore.
// Vaut null initialement, puis true ou false après première vérification.
let isHardDeletePermitted = null;

/**
 * Hook d'abonnement aux notifications internes d'un membre.
 * 
 * @param {string} userId Identifiant de l'utilisateur connecté
 * @param {string} [groupId] Identifiant du groupe/association
 * @returns {object} { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }
 */
export function useInAppNotifications(userId, groupId) {
  const [rawNotifications, setRawNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstSnapshotRef = useRef(true);

  // Écoute temps réel bornée aux 50 dernières alertes
  useEffect(() => {
    isFirstSnapshotRef.current = true;

    // Garde-fou 1 : En mode Démo ou avec un profil factice / simulé, aucune souscription Firestore distante
    if (
      isDemoMode() ||
      !userId ||
      String(userId).startsWith('demo_') ||
      String(userId).startsWith('simulated-')
    ) {
      setRawNotifications([]);
      setLoading(false);
      return;
    }

    // Garde-fou 2 : Les règles Firestore distantes exigent request.auth.uid == userId
    // Si la session n'est pas encore prête ou si l'utilisateur connecté ne correspond pas à userId,
    // on évite d'interroger Firestore pour ne pas déclencher d'erreur de permission.
    const currentAuthUid = auth?.currentUser?.uid;
    if (!currentAuthUid || currentAuthUid !== userId) {
      setRawNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notifsColRef = collection(db, 'users', userId, 'in_app_notifications');
    // Limite de sécurité de 50 documents sans filtre d'inégalité pour garantir l'absence d'erreur d'index
    const q = query(notifsColRef, limit(50));

    let unsubscribe = () => {};

    try {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Déclenchement de la signature sonore uniquement pour les alertes arrivant après le premier chargement
          if (!isFirstSnapshotRef.current) {
            const hasNewUnread = snapshot.docChanges().some((change) => {
              if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data();
                if (data.isDeleted || data.deleted) return false;
                const isUnread = data.read !== undefined ? !data.read : !data.isRead;
                const matchesGroup = !groupId || !data.groupId || data.groupId === groupId;
                return isUnread && matchesGroup;
              }
              return false;
            });

            if (hasNewUnread) {
              playNotificationSound();
            }
          } else {
            isFirstSnapshotRef.current = false;
          }

          const fetched = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Ignorer les alertes ayant fait l'objet d'une suppression logique (soft-delete)
            if (data.isDeleted || data.deleted) return;
            fetched.push({
              id: docSnap.id,
              notifId: docSnap.id,
              ...data
            });
          });

          // Tri antéchronologique en JavaScript (les plus récentes en premier)
          fetched.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          setRawNotifications(fetched);
          setLoading(false);
        },
        (error) => {
          const isPermErr = error?.code === 'permission-denied' || error?.message?.toLowerCase().includes('permission');
          if (isPermErr) {
            console.warn("useInAppNotifications - Accès aux notifications restreint ou session non synchronisée.");
          } else {
            console.error("useInAppNotifications - Erreur écoute notifications :", error);
          }
          setRawNotifications([]);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("useInAppNotifications - Exception lors de la souscription aux notifications :", err);
      setRawNotifications([]);
      setLoading(false);
    }

    // Nettoyage impératif de la souscription Firestore au démontage
    return () => unsubscribe();
  }, [userId, groupId, auth?.currentUser?.uid]);

  // Filtrage optionnel par groupId si pertinent et exclusion stricte des éléments supprimés
  const notifications = useMemo(() => {
    const active = rawNotifications.filter((n) => !n.isDeleted && !n.deleted);
    if (!groupId) return active;
    return active.filter((n) => !n.groupId || n.groupId === groupId);
  }, [rawNotifications, groupId]);

  // Compteur d'éléments non lus (supporte read et isRead)
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => (n.read !== undefined ? !n.read : !n.isRead)).length;
  }, [notifications]);

  /**
   * Marque une notification spécifique comme lue.
   * 
   * @param {string} notifId Identifiant du document à marquer comme lu
   */
  const markAsRead = useCallback(async (notifId) => {
    if (!notifId) return;

    // Optimisation optimiste locale de l'état
    setRawNotifications((prev) =>
      prev.map((n) => (n.id === notifId || n.notifId === notifId ? { ...n, isRead: true, read: true } : n))
    );

    const currentAuthUid = auth?.currentUser?.uid;
    if (
      isDemoMode() ||
      !userId ||
      !currentAuthUid ||
      currentAuthUid !== userId ||
      String(userId).startsWith('demo_') ||
      String(userId).startsWith('simulated-')
    ) {
      return;
    }

    try {
      const docRef = doc(db, 'users', userId, 'in_app_notifications', notifId);
      await updateDoc(docRef, { isRead: true, read: true });
    } catch (err) {
      if (err?.code !== 'permission-denied') {
        console.error(`useInAppNotifications - Erreur marquage notification ${notifId} :`, err);
      }
    }

    // Marquage idempotent dans la collection racine 'notifications' si le document y est présent
    try {
      const rootDocRef = doc(db, 'notifications', notifId);
      await updateDoc(rootDocRef, { isRead: true, read: true });
    } catch {
      // Ignorer si non présent dans la collection racine ou restriction de sécurité
    }
  }, [userId]);

  /**
   * Marque toutes les notifications non lues comme lues en une seule transaction par lot (writeBatch).
   */
  const markAllAsRead = useCallback(async () => {
    const unreadItems = notifications.filter((n) => (n.read !== undefined ? !n.read : !n.isRead));
    if (unreadItems.length === 0) return;

    // Mise à jour optimiste locale
    setRawNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));

    const currentAuthUid = auth?.currentUser?.uid;
    if (
      isDemoMode() ||
      !userId ||
      !currentAuthUid ||
      currentAuthUid !== userId ||
      String(userId).startsWith('demo_') ||
      String(userId).startsWith('simulated-')
    ) {
      return;
    }

    try {
      const batch = writeBatch(db);
      unreadItems.forEach((item) => {
        const docRef = doc(db, 'users', userId, 'in_app_notifications', item.id || item.notifId);
        batch.update(docRef, { isRead: true, read: true });
      });

      await batch.commit();
    } catch (err) {
      if (err?.code !== 'permission-denied') {
        console.error("useInAppNotifications - Erreur marquage groupé des notifications :", err);
      }
    }
  }, [userId, notifications]);

  /**
   * Supprime une notification spécifique.
   * Procède à une éviction optimiste immédiate de l'interface utilisateur, puis applique
   * une suppression physique (deleteDoc) ou logique résiliente (updateDoc) en conformité
   * avec les règles de sécurité Firestore en vigueur.
   * 
   * @param {string} notifId Identifiant de la notification à supprimer
   */
  const deleteNotification = useCallback(async (notifId) => {
    if (!notifId) return;

    // 1. Éviction optimiste immédiate dans l'état local pour une réactivité instantanée à l'écran
    setRawNotifications((prev) =>
      prev.filter((n) => n.id !== notifId && n.notifId !== notifId)
    );

    const currentAuthUid = auth?.currentUser?.uid;
    if (
      isDemoMode() ||
      !userId ||
      !currentAuthUid ||
      currentAuthUid !== userId ||
      String(userId).startsWith('demo_') ||
      String(userId).startsWith('simulated-')
    ) {
      return;
    }

    const docRef = doc(db, 'users', userId, 'in_app_notifications', notifId);

    // 2. Si les permissions Firestore restreignent déjà la suppression physique,
    // appliquer directement la suppression logique autorisée sans requête réseau superflue.
    if (isHardDeletePermitted === false) {
      try {
        await updateDoc(docRef, {
          isDeleted: true,
          deleted: true,
          isRead: true,
          read: true,
          deletedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err?.code !== 'permission-denied') {
          console.error(`useInAppNotifications - Erreur marquage suppression ${notifId} :`, err);
        }
      }
      return;
    }

    // 3. Tentative de suppression définitive physique avec repli résilient si non autorisée
    try {
      await deleteDoc(docRef);
      isHardDeletePermitted = true;
    } catch (err) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        // Enregistrement de la contrainte des règles Firestore pour les prochains appels
        isHardDeletePermitted = false;
        try {
          await updateDoc(docRef, {
            isDeleted: true,
            deleted: true,
            isRead: true,
            read: true,
            deletedAt: new Date().toISOString()
          });
        } catch (updateErr) {
          if (updateErr?.code !== 'permission-denied') {
            console.error(`useInAppNotifications - Erreur repli suppression logique ${notifId} :`, updateErr);
          }
        }
      } else {
        console.error(`useInAppNotifications - Erreur suppression notification ${notifId} :`, err);
      }
    }
  }, [userId]);

  /**
   * Supprime l'ensemble des notifications affichées.
   * Procède à une purge optimiste locale immédiate, puis persiste via batch (delete ou soft-delete).
   */
  const clearAllNotifications = useCallback(async () => {
    if (notifications.length === 0) return;

    // 1. Purge optimiste locale immédiate
    const idsToDelete = new Set(notifications.map((n) => n.id || n.notifId));
    setRawNotifications((prev) => prev.filter((n) => !idsToDelete.has(n.id || n.notifId)));

    const currentAuthUid = auth?.currentUser?.uid;
    if (
      isDemoMode() ||
      !userId ||
      !currentAuthUid ||
      currentAuthUid !== userId ||
      String(userId).startsWith('demo_') ||
      String(userId).startsWith('simulated-')
    ) {
      return;
    }

    const nowIso = new Date().toISOString();

    // 2. Si les permissions restreignent la suppression physique, bascule immédiate sur update batch
    if (isHardDeletePermitted === false) {
      try {
        const batch = writeBatch(db);
        notifications.forEach((item) => {
          const docId = item.id || item.notifId;
          if (docId) {
            const docRef = doc(db, 'users', userId, 'in_app_notifications', docId);
            batch.update(docRef, {
              isDeleted: true,
              deleted: true,
              isRead: true,
              read: true,
              deletedAt: nowIso
            });
          }
        });
        await batch.commit();
      } catch (err) {
        if (err?.code !== 'permission-denied') {
          console.error("useInAppNotifications - Erreur suppression collective logique :", err);
        }
      }
      return;
    }

    // 3. Tentative de suppression par lot physique avec repli résilient
    try {
      const batch = writeBatch(db);
      notifications.forEach((item) => {
        const docId = item.id || item.notifId;
        if (docId) {
          const docRef = doc(db, 'users', userId, 'in_app_notifications', docId);
          batch.delete(docRef);
        }
      });
      await batch.commit();
      isHardDeletePermitted = true;
    } catch (err) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        isHardDeletePermitted = false;
        try {
          const fallbackBatch = writeBatch(db);
          notifications.forEach((item) => {
            const docId = item.id || item.notifId;
            if (docId) {
              const docRef = doc(db, 'users', userId, 'in_app_notifications', docId);
              fallbackBatch.update(docRef, {
                isDeleted: true,
                deleted: true,
                isRead: true,
                read: true,
                deletedAt: nowIso
              });
            }
          });
          await fallbackBatch.commit();
        } catch (fallbackErr) {
          if (fallbackErr?.code !== 'permission-denied') {
            console.error("useInAppNotifications - Erreur repli suppression collective logique :", fallbackErr);
          }
        }
      } else {
        console.error("useInAppNotifications - Erreur suppression collective des notifications :", err);
      }
    }
  }, [userId, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };
}
