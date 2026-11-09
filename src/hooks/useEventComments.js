import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendEventDiscussionNotifications } from '../services/notificationService';

/**
 * Hook useEventComments
 * Gère la sous-collection Firestore events/{eventId}/comments en temps réel,
 * l'ajout de nouveaux commentaires et le déclenchement des notifications (Cloche 🔔 + Push).
 */
export function useEventComments(eventId, user, profileData, event) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const commentsRef = collection(db, 'events', eventId, 'comments');

    const unsubscribe = onSnapshot(
      commentsRef,
      (snapshot) => {
        const fetchedComments = [];
        snapshot.forEach((docSnap) => {
          fetchedComments.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });

        fetchedComments.sort((a, b) => {
          const timeA = a.dateCreation?.toDate
            ? a.dateCreation.toDate().getTime()
            : a.dateCreationIso
              ? new Date(a.dateCreationIso).getTime()
              : 0;
          const timeB = b.dateCreation?.toDate
            ? b.dateCreation.toDate().getTime()
            : b.dateCreationIso
              ? new Date(b.dateCreationIso).getTime()
              : 0;
          return timeA - timeB;
        });

        setComments(fetchedComments);
        setLoading(false);
      },
      (error) => {
        console.error("useEventComments - Erreur lors de l'écoute des commentaires :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const addComment = async (texte) => {
    if (!eventId || !texte || !texte.trim() || !user) return;

    setSending(true);
    const cleanText = texte.trim();
    const authorName =
      `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() ||
      profileData?.surnom ||
      'Membre';
    const authorPhoto = profileData?.photoURL || user.photoURL || null;
    const nowIso = new Date().toISOString();

    try {
      const rawGroupId = profileData?.groupId || user?.groupId || event?.groupId;
      if (!rawGroupId || typeof rawGroupId !== 'string' || !rawGroupId.trim()) {
        throw new Error("Impossible d'ajouter un commentaire : groupId introuvable dans le profil utilisateur.");
      }
      const effectiveGroupId = rawGroupId.trim().toLowerCase();

      const commentsRef = collection(db, 'events', eventId, 'comments');
      const commentPayload = {
        eventId,
        groupId: effectiveGroupId,
        auteurId: user.uid,
        auteurNom: authorName,
        auteurPhoto: authorPhoto,
        texte: cleanText,
        dateCreation: serverTimestamp(),
        dateCreationIso: nowIso
      };

      const docRef = await addDoc(commentsRef, commentPayload);

      setComments((prev) => {
        if (prev.some((c) => c.id === docRef.id)) return prev;
        return [...prev, { id: docRef.id, ...commentPayload, dateCreation: new Date() }];
      });

      // Diffusion groupée (Cloche 🔔 + Push FCM) à tous les membres actifs concernés par l'événement
      try {
        let fullEvent = event;
        if (!fullEvent || !fullEvent.inscriptions) {
          const eventDocSnap = await getDoc(doc(db, 'events', eventId));
          if (eventDocSnap.exists()) {
            fullEvent = { id: eventDocSnap.id, ...eventDocSnap.data() };
          }
        }
        await sendEventDiscussionNotifications({
          event: fullEvent || { id: eventId, titre: event?.titre || 'Événement', groupId: effectiveGroupId },
          authorName,
          text: cleanText,
          currentUserId: user.uid,
          groupId: effectiveGroupId
        });
      } catch (notifErr) {
        console.warn('useEventComments - Erreur envoi notifications discussion :', notifErr);
      }
    } catch (error) {
      console.error("useEventComments - Erreur lors de l'ajout du commentaire :", error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!eventId || !commentId) return;
    try {
      const commentRef = doc(db, 'events', eventId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('useEventComments - Erreur lors de la suppression du commentaire :', error);
      throw error;
    }
  };

  return {
    comments: eventId ? comments : [],
    loading: eventId ? loading : false,
    sending,
    addComment,
    deleteComment
  };
}
