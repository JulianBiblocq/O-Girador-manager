/**
 * Hook personnalisé pour la gestion en temps réel des notifications internes In-App.
 * Écoute la sous-collection users/{userId}/in_app_notifications et fournit les méthodes
 * de marquage comme lu à l'unité ou en lot.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook d'abonnement aux notifications internes d'un membre.
 * 
 * @param {string} userId Identifiant de l'utilisateur connecté
 * @param {string} [groupId] Identifiant du groupe/association
 * @returns {object} { notifications, unreadCount, loading, markAsRead, markAllAsRead }
 */
export function useInAppNotifications(userId, groupId) {
  const [rawNotifications, setRawNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Écoute temps réel bornée aux 50 dernières alertes
  useEffect(() => {
    if (!userId) {
      setRawNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notifsColRef = collection(db, 'users', userId, 'in_app_notifications');
    // Limite de sécurité de 50 documents sans filtre d'inégalité pour garantir l'absence d'erreur d'index
    const q = query(notifsColRef, limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
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
        console.error("useInAppNotifications - Erreur écoute notifications :", error);
        setLoading(false);
      }
    );

    // Nettoyage impératif de la souscription Firestore au démontage
    return () => unsubscribe();
  }, [userId]);

  // Filtrage optionnel par groupId si pertinent
  const notifications = useMemo(() => {
    if (!groupId) return rawNotifications;
    return rawNotifications.filter((n) => !n.groupId || n.groupId === groupId);
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
    if (!userId || !notifId) return;

    try {
      const docRef = doc(db, 'users', userId, 'in_app_notifications', notifId);
      await updateDoc(docRef, { isRead: true, read: true });

      // Optimisation optimiste locale de l'état
      setRawNotifications((prev) =>
        prev.map((n) => (n.id === notifId || n.notifId === notifId ? { ...n, isRead: true, read: true } : n))
      );
    } catch (err) {
      console.error(`useInAppNotifications - Erreur marquage notification ${notifId} :`, err);
    }
  }, [userId]);

  /**
   * Marque toutes les notifications non lues comme lues en une seule transaction par lot (writeBatch).
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const unreadItems = notifications.filter((n) => (n.read !== undefined ? !n.read : !n.isRead));
    if (unreadItems.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadItems.forEach((item) => {
        const docRef = doc(db, 'users', userId, 'in_app_notifications', item.id || item.notifId);
        batch.update(docRef, { isRead: true, read: true });
      });

      await batch.commit();

      // Mise à jour optimiste locale
      setRawNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    } catch (err) {
      console.error("useInAppNotifications - Erreur marquage groupé des notifications :", err);
    }
  }, [userId, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
}
