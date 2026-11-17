import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { executeEventOrPollDeletion } from '../utils/eventDeletionUtils';

/**
 * Hook personnalisé pour contrôler l'état, la synchronisation Firestore
 * et la modale Cordel de suppression (silencieuse ou notifiée) d'un événement ou sondage.
 */
export function useEventDetailsController(event, onClose, _t, currentUserId = null) {
  const [liveEventData, setLiveEventData] = useState(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Synchronisation en temps réel du document d'événement spécifique
  useEffect(() => {
    if (!event?.id) return;
    const eventRef = doc(db, 'events', event.id);
    const unsubscribe = onSnapshot(
      eventRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setLiveEventData({ id: docSnap.id, ...docSnap.data() });
        } else {
          if (typeof window !== 'undefined') {
            const urlEventId = new URLSearchParams(window.location.search).get('eventId');
            if (urlEventId && urlEventId !== event.id) return;
          }
          if (onClose) onClose();
        }
      },
      (err) => {
        console.error('useEventDetailsController - Erreur snapshot live document :', err);
      }
    );
    return () => unsubscribe();
  }, [event?.id, onClose]);

  const activeEvent = liveEventData ? { ...event, ...liveEventData } : event;

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Ouvre la modale Cordel à 3 choix (remplace l'ancienne confirmation générique)
  const handleDeleteEvent = useCallback(() => {
    if (!activeEvent?.id) return;
    setIsDeleteModalOpen(true);
  }, [activeEvent?.id]);

  // Exécute la suppression effective selon le choix ({ sendPush: false | true })
  const handleConfirmDeleteEvent = useCallback(
    async ({ sendPush = false } = {}) => {
      if (!activeEvent?.id || deletingEvent) return;
      setDeletingEvent(true);
      try {
        await executeEventOrPollDeletion({
          db,
          event: activeEvent,
          actorUid: currentUserId,
          sendPush: Boolean(sendPush)
        });
        setIsDeleteModalOpen(false);
        if (onClose) onClose();
      } catch (err) {
        console.error('useEventDetailsController - Erreur lors de la suppression :', err);
        alert("Erreur lors de la suppression de l'événement.");
      } finally {
        setDeletingEvent(false);
      }
    },
    [activeEvent, currentUserId, deletingEvent, onClose]
  );

  const toggleEditing = useCallback(() => setIsEditingEvent((prev) => !prev), []);

  return {
    activeEvent,
    isEditingEvent,
    setIsEditingEvent,
    toggleEditing,
    toastMessage,
    setToastMessage,
    showToast,
    savingEvent,
    setSavingEvent,
    handleDeleteEvent,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingEvent,
    handleConfirmDeleteEvent
  };
}
