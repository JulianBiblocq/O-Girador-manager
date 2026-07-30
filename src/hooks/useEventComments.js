import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook useEventComments
 * Gère la sous-collection Firestore events/{eventId}/comments en temps réel,
 * l'ajout de nouveaux commentaires et le déclenchement des notifications d'événements.
 * 
 * @param {string} eventId ID de l'événement
 * @param {Object} user Utilisateur connecté (Firebase Auth)
 * @param {Object} profileData Profil Firestore de l'utilisateur
 * @param {Object} event Données complètes de l'événement
 * @returns {Object} { comments, loading, sending, addComment, deleteComment }
 */
export function useEventComments(eventId, user, profileData, event) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Synchronisation en temps réel de la sous-collection events/{eventId}/comments
  useEffect(() => {
    if (!eventId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const q = query(commentsRef, orderBy('dateCreation', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = [];
      snapshot.forEach((docSnap) => {
        fetchedComments.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("useEventComments - Erreur lors de l'écoute des commentaires :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Envoi d'un nouveau commentaire et notification des destinataires
  const addComment = async (texte) => {
    if (!eventId || !texte || !texte.trim() || !user) return;

    setSending(true);
    const cleanText = texte.trim();
    const authorName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || profileData?.surnom || 'Membre';
    const authorPhoto = profileData?.photoURL || user.photoURL || null;
    const nowIso = new Date().toISOString();

    try {
      // 1. Écriture du commentaire dans la sous-collection events/{eventId}/comments
      const commentsRef = collection(db, 'events', eventId, 'comments');
      await addDoc(commentsRef, {
        auteurId: user.uid,
        auteurNom: authorName,
        auteurPhoto: authorPhoto,
        texte: cleanText,
        dateCreation: serverTimestamp(),
        dateCreationIso: nowIso
      });

      // 2. Récupération des paramètres de l'association pour l'étiquette de notification
      const groupId = event?.groupId || profileData?.groupId;
      let tagConfigured = '';

      if (groupId) {
        try {
          const assocRef = doc(db, 'associations', groupId);
          const assocSnap = await getDoc(assocRef);
          if (assocSnap.exists()) {
            tagConfigured = assocSnap.data().tagNotificationCommentairesEvenement || '';
          }
        } catch (assocErr) {
          console.error("useEventComments - Erreur lecture paramètres association :", assocErr);
        }
      }

      const eventTitle = event?.titre || event?.nom || 'Événement';
      const excerpt = cleanText.length > 90 ? cleanText.slice(0, 90) + '...' : cleanText;

      // 3. Notification pour l'étiquette configurée (ex: Bureau, Admins, Mestre)
      if (tagConfigured && groupId) {
        try {
          await addDoc(collection(db, 'notifications_queue'), {
            groupId: groupId,
            title: `💬 Question / Commentaire : ${eventTitle}`,
            body: `${authorName} : "${excerpt}"`,
            targetTag: tagConfigured,
            senderId: user.uid,
            eventId: eventId,
            createdAt: nowIso
          });
        } catch (notifErr) {
          console.error("useEventComments - Erreur envoi notification tag :", notifErr);
        }
      }

      // 4. Notification pour le créateur de l'événement (s'il n'est pas le commenteur lui-même)
      const eventCreatorId = event?.createdBy || event?.auteurId;
      if (eventCreatorId && eventCreatorId !== user.uid && groupId) {
        try {
          await addDoc(collection(db, 'notifications_queue'), {
            groupId: groupId,
            title: `💬 Nouveau commentaire sur votre événement : ${eventTitle}`,
            body: `${authorName} : "${excerpt}"`,
            recipientId: eventCreatorId,
            senderId: user.uid,
            eventId: eventId,
            createdAt: nowIso
          });
        } catch (notifErr) {
          console.error("useEventComments - Erreur envoi notification créateur :", notifErr);
        }
      }

    } catch (error) {
      console.error("useEventComments - Erreur lors de l'ajout du commentaire :", error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  // Suppression d'un commentaire
  const deleteComment = async (commentId) => {
    if (!eventId || !commentId) return;

    try {
      const commentRef = doc(db, 'events', eventId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error("useEventComments - Erreur lors de la suppression du commentaire :", error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    sending,
    addComment,
    deleteComment
  };
}
