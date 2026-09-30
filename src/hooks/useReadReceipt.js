/**
 * useReadReceipt.js
 * Hook de détection passive de lecture via IntersectionObserver (70% de visibilité pendant > 1,5s).
 * Enregistre l'accusé de lecture horodaté dans Firestore sans réécrire tout le document.
 */

import { useEffect, useRef, useState } from 'react';
import { recordReadReceipt } from '../services/readReceiptService.js';

/**
 * @param {Object} options
 * @param {React.RefObject} options.targetRef - Référence de l'élément DOM du message
 * @param {string} options.collectionName - Collection Firestore ('announcements' ou 'forum')
 * @param {string} options.documentId - Identifiant du document Firestore
 * @param {string} options.authorId - Identifiant de l'auteur du message
 * @param {string} options.currentUserId - Identifiant de l'utilisateur connecté
 * @param {string} options.currentUserName - Nom complet ou prénom de l'utilisateur connecté
 * @param {boolean} [options.isAlreadyRead=false] - Indique si l'utilisateur a déjà lu
 * @param {boolean} [options.enabled=true] - Activation de l'observateur
 * @param {number} [options.minVisibility=0.7] - Seuil de visibilité minimum (70%)
 * @param {number} [options.minDurationMs=1500] - Durée minimale ininterrompue (1,5 seconde)
 * @param {Function} [options.onRead] - Callback déclenché après succès
 */
export function useReadReceipt({
  targetRef,
  collectionName,
  documentId,
  authorId,
  currentUserId,
  currentUserName,
  isAlreadyRead = false,
  enabled = true,
  minVisibility = 0.7,
  minDurationMs = 1500,
  onRead
}) {
  const [hasRecordedRead, setHasRecordedRead] = useState(Boolean(isAlreadyRead));
  const timerRef = useRef(null);
  const observerRef = useRef(null);

  // Synchronisation si le statut isAlreadyRead change depuis les props
  useEffect(() => {
    if (isAlreadyRead) {
      setHasRecordedRead(true);
    }
  }, [isAlreadyRead]);

  useEffect(() => {
    // Conditions d'exclusion : désactivé, déjà lu, non connecté ou auteur du message
    if (!enabled || hasRecordedRead || isAlreadyRead || !currentUserId || !documentId) {
      return;
    }
    if (authorId && currentUserId === authorId) {
      return;
    }

    const element = targetRef?.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const clearActiveTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleIntersection = (entries) => {
      const entry = entries[0];
      if (!entry) return;

      // Condition de lecture : au moins 70% de visibilité à l'écran
      if (entry.isIntersecting && entry.intersectionRatio >= minVisibility) {
        if (!timerRef.current) {
          timerRef.current = setTimeout(async () => {
            timerRef.current = null;
            // Enregistrement Firestore
            const result = await recordReadReceipt({
              collectionName,
              documentId,
              currentUserId,
              currentUserName,
              authorId,
              isAlreadyRead: hasRecordedRead
            });

            if (result.success) {
              setHasRecordedRead(true);
              if (onRead) onRead(result.luLe);
              // Déconnexion de l'observer une fois lu
              if (observerRef.current && element) {
                observerRef.current.unobserve(element);
              }
            }
          }, minDurationMs);
        }
      } else {
        // Si le message quitte l'écran ou descend sous 70% avant 1,5s, annuler le compte à rebours
        clearActiveTimer();
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: [minVisibility],
      root: null,
      rootMargin: '0px'
    });

    observerRef.current.observe(element);

    return () => {
      clearActiveTimer();
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
        observerRef.current.disconnect();
      }
    };
  }, [
    targetRef,
    collectionName,
    documentId,
    authorId,
    currentUserId,
    currentUserName,
    hasRecordedRead,
    isAlreadyRead,
    enabled,
    minVisibility,
    minDurationMs,
    onRead
  ]);

  return {
    isRead: hasRecordedRead || Boolean(isAlreadyRead)
  };
}
