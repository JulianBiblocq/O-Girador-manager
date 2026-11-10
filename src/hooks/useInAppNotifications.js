import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { playNotificationSound } from '../utils/soundService';

/**
 * Vérifie de manière unifiée si une notification interne est non-lue.
 */
function isNotificationUnread(notif) {
  if (!notif) return false;
  return notif.isRead !== true && notif.read !== true;
}

/**
 * Compare les identifiants de groupe de manière insensible à la casse.
 */
function matchesNotificationGroup(notifGroupId, activeGroupId) {
  if (!activeGroupId || !notifGroupId) return true;
  return String(notifGroupId).trim().toLowerCase() === String(activeGroupId).trim().toLowerCase();
}

/**
 * Extrait l'identifiant exact du document Firestore (`docId` prioritaire sur `id`).
 */
function resolveNotificationDocId(notifOrId) {
  if (!notifOrId) return null;
  if (typeof notifOrId === 'string') return notifOrId.trim() || null;
  if (typeof notifOrId === 'object') {
    return (notifOrId.docId || notifOrId.notifId || notifOrId.id || '').trim() || null;
  }
  return null;
}

/**
 * Hook personnalisé d'écoute en temps réel des notifications internes
 * de l'utilisateur dans `users/{uid}/in_app_notifications`.
 */
export function useInAppNotifications(uid, groupId = null) {
  const [rawNotifications, setRawNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const isFirstSnapshotRef = useRef(true);
  const seenDocIdsRef = useRef(new Set());

  useEffect(() => {
    if (!uid) {
      isFirstSnapshotRef.current = true;
      seenDocIdsRef.current = new Set();
      return;
    }

    isFirstSnapshotRef.current = true;
    seenDocIdsRef.current = new Set();
    const notifRef = collection(db, 'users', uid, 'in_app_notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isFirstSnapshotRef.current) {
          let hasNewUnread = false;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && !seenDocIdsRef.current.has(change.doc.id)) {
              const data = change.doc.data();
              if (isNotificationUnread(data) && matchesNotificationGroup(data.groupId, groupId)) {
                hasNewUnread = true;
              }
            }
          });
          if (hasNewUnread) {
            playNotificationSound();
          }
        }

        const nextSeenIds = new Set(seenDocIdsRef.current);
        const list = [];
        snapshot.forEach((docSnap) => {
          nextSeenIds.add(docSnap.id);
          const data = docSnap.data();
          let dateIso = data.dateCreation;
          if (!dateIso && data.createdAt) {
            if (typeof data.createdAt.toDate === 'function') {
              dateIso = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'string') {
              dateIso = data.createdAt;
            }
          }
          // Protection stricte : docSnap.id est placé APRÈS ...data pour ne jamais être écrasé par un champ interne data.id
          list.push({
            ...data,
            docId: docSnap.id,
            notifId: docSnap.id,
            id: docSnap.id,
            titre: data.titre || data.title || 'Notification',
            dateCreation: dateIso || new Date().toISOString()
          });
        });

        seenDocIdsRef.current = nextSeenIds;
        isFirstSnapshotRef.current = false;

        setRawNotifications(list);
        setDismissedIds((prev) => {
          if (prev.size === 0) return prev;
          const remainingIds = new Set(list.map((item) => item.docId || item.id));
          const next = new Set();
          prev.forEach((id) => {
            if (remainingIds.has(id)) next.add(id);
          });
          return next;
        });
        setLoading(false);
      },
      (err) => {
        console.warn('useInAppNotifications - Erreur écoute :', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, groupId]);

  const effectiveRaw = uid ? rawNotifications : [];
  const activeNotifications = effectiveRaw
    .filter((n) => !dismissedIds.has(n.docId || n.id))
    .map((n) => (readIds.has(n.docId || n.id) ? { ...n, isRead: true, read: true } : n));

  const notifications = groupId
    ? activeNotifications.filter((n) => matchesNotificationGroup(n.groupId, groupId))
    : activeNotifications;

  const unreadCount = notifications.filter((n) => isNotificationUnread(n)).length;

  const markAsRead = useCallback(
    async (notifOrId) => {
      const exactDocId = resolveNotificationDocId(notifOrId);
      if (!uid || !exactDocId) return;
      setReadIds((prev) => new Set(prev).add(exactDocId));
      try {
        const docRef = doc(db, 'users', uid, 'in_app_notifications', exactDocId);
        await updateDoc(docRef, { isRead: true, read: true });
      } catch (err) {
        console.warn('useInAppNotifications - Erreur markAsRead :', err);
      }
    },
    [uid]
  );

  const deleteNotification = useCallback(
    async (notifOrId) => {
      const exactDocId = resolveNotificationDocId(notifOrId);
      if (!uid || !exactDocId) return;
      setDismissedIds((prev) => new Set(prev).add(exactDocId));
      try {
        const docRef = doc(db, 'users', uid, 'in_app_notifications', exactDocId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('useInAppNotifications - Erreur deleteNotification :', err);
      }
    },
    [uid]
  );

  const markAllAsRead = useCallback(async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => isNotificationUnread(n));
    if (unread.length === 0) return;

    setReadIds((prev) => {
      const next = new Set(prev);
      unread.forEach((n) => next.add(n.docId || n.id));
      return next;
    });
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        const exactDocId = n.docId || n.id;
        if (exactDocId) {
          batch.update(doc(db, 'users', uid, 'in_app_notifications', exactDocId), { isRead: true, read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.warn('useInAppNotifications - Erreur markAllAsRead :', err);
    }
  }, [uid, notifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!uid || notifications.length === 0) return;
    setDismissedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.docId || n.id));
      return next;
    });
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        const exactDocId = n.docId || n.id;
        if (exactDocId) batch.delete(doc(db, 'users', uid, 'in_app_notifications', exactDocId));
      });
      await batch.commit();
    } catch (err) {
      console.warn('useInAppNotifications - Erreur clearAllNotifications :', err);
    }
  }, [uid, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    clearAllNotifications
  };
}
