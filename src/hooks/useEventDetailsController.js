import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useConfirm from './useConfirm';

/**
 * Hook personnalisé pour contrôler l'état, la synchronisation Firestore et les actions d'édition/suppression d'un événement.
 *
 * @param {Object} event Événement source
 * @param {Function} onClose Callback de fermeture de la fiche
 * @param {Function} t Fonction de traduction
 */
export function useEventDetailsController(event, onClose, t) {
  const { confirm } = useConfirm();
  const [liveEventData, setLiveEventData] = useState(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const toastTimerRef = useRef(null);

  // Nettoyage du timer au démontage
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
          // L'événement a été supprimé de la base de données (ex: lors de la résolution d'un sondage)
          if (onClose) {
            onClose();
          }
        }
      },
      (err) => {
        console.error("useEventDetailsController - Erreur snapshot live document :", err);
      }
    );
    return () => unsubscribe();
  }, [event?.id, onClose]);

  const activeEvent = liveEventData ? { ...event, ...liveEventData } : event;

  // Affichage sécurisé des notifications toast
  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Action de suppression d'événement
  const handleDeleteEvent = useCallback(async () => {
    if (!event?.id) return;
    const ok = await confirm({
      title: t('common.deleteConfirmTitle') || "Supprimer l'événement",
      message: t('common.deleteConfirmMessage') || "Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.",
      confirmText: t('common.delete') || "Supprimer",
      cancelText: t('common.cancel') || "Annuler",
      variant: "danger"
    });

    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'events', event.id));
      if (onClose) onClose();
    } catch (err) {
      console.error("useEventDetailsController - Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression de l'événement.");
    }
  }, [event?.id, confirm, onClose, t]);

  const toggleEditing = useCallback(() => {
    setIsEditingEvent(prev => !prev);
  }, []);

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
    handleDeleteEvent
  };
}
