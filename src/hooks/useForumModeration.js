import { useState, useCallback } from 'react';
import { doc, updateDoc, deleteDoc, writeBatch, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useForumModeration(groupId) {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Déplace un sujet (thread) vers un autre salon (channelId) et/ou change sa catégorie
   */
  const moveThread = useCallback(async (threadId, newChannelId, newCategory = null) => {
    if (!threadId || !newChannelId) return false;
    setActionLoading(true);
    setError(null);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const updates = {
        channelId: newChannelId,
        derniereModification: new Date().toISOString()
      };
      if (newCategory) {
        updates.categorie = newCategory;
      }
      await updateDoc(threadRef, updates);
      return true;
    } catch (err) {
      console.error("Error moving thread:", err);
      setError(err.message || "Erreur lors du déplacement de la discussion.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Épingle ou désépingle un sujet
   */
  const togglePinThread = useCallback(async (threadId, currentPinnedStatus) => {
    if (!threadId) return false;
    setActionLoading(true);
    setError(null);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const nextStatus = !currentPinnedStatus;
      await updateDoc(threadRef, {
        isPinned: nextStatus,
        pinnedAt: nextStatus ? new Date().toISOString() : null
      });
      return true;
    } catch (err) {
      console.error("Error toggling pin status:", err);
      setError(err.message || "Erreur lors de la modification du statut d'épinglage.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Supprime un sujet complet
   */
  const deleteThread = useCallback(async (threadId) => {
    if (!threadId) return false;
    setActionLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'forum', threadId));
      return true;
    } catch (err) {
      console.error("Error deleting thread:", err);
      setError(err.message || "Erreur lors de la suppression de la discussion.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Édite le titre ou la catégorie d'un sujet
   */
  const editThreadDetails = useCallback(async (threadId, newTitle, newCategory) => {
    if (!threadId || !newTitle) return false;
    setActionLoading(true);
    setError(null);
    try {
      const threadRef = doc(db, 'forum', threadId);
      await updateDoc(threadRef, {
        titre: newTitle.trim(),
        categorie: newCategory,
        derniereModification: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Error updating thread details:", err);
      setError(err.message || "Erreur lors de la mise à jour de la discussion.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Supprime une réponse spécifique dans un sujet par son index
   */
  const deleteReply = useCallback(async (threadId, replyIndex) => {
    if (!threadId || replyIndex === undefined || replyIndex === null) return false;
    setActionLoading(true);
    setError(null);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const docSnap = await getDoc(threadRef);
      if (!docSnap.exists()) throw new Error("Discussion introuvable");

      const data = docSnap.data();
      const currentReplies = data.reponses || [];
      if (replyIndex < 0 || replyIndex >= currentReplies.length) return false;

      const updatedReplies = currentReplies.filter((_, idx) => idx !== replyIndex);
      await updateDoc(threadRef, {
        reponses: updatedReplies
      });
      return true;
    } catch (err) {
      console.error("Error deleting reply:", err);
      setError(err.message || "Erreur lors de la suppression du message.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Édite le contenu texte d'une réponse par son index
   */
  const editReply = useCallback(async (threadId, replyIndex, newMessageText) => {
    if (!threadId || replyIndex === undefined || !newMessageText) return false;
    setActionLoading(true);
    setError(null);
    try {
      const threadRef = doc(db, 'forum', threadId);
      const docSnap = await getDoc(threadRef);
      if (!docSnap.exists()) throw new Error("Discussion introuvable");

      const data = docSnap.data();
      const currentReplies = data.reponses || [];
      if (replyIndex < 0 || replyIndex >= currentReplies.length) return false;

      const updatedReplies = [...currentReplies];
      updatedReplies[replyIndex] = {
        ...updatedReplies[replyIndex],
        message: newMessageText.trim(),
        isEdited: true,
        editedAt: new Date().toISOString()
      };

      await updateDoc(threadRef, {
        reponses: updatedReplies,
        derniereModification: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Error editing reply:", err);
      setError(err.message || "Erreur lors de la modification du message.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Déplace une réponse de `sourceThreadId` vers `targetThreadId`
   */
  const moveReplyToThread = useCallback(async (sourceThreadId, replyIndex, targetThreadId) => {
    if (!sourceThreadId || replyIndex === undefined || !targetThreadId) return false;
    setActionLoading(true);
    setError(null);
    try {
      const sourceRef = doc(db, 'forum', sourceThreadId);
      const targetRef = doc(db, 'forum', targetThreadId);

      const sourceSnap = await getDoc(sourceRef);
      const targetSnap = await getDoc(targetRef);

      if (!sourceSnap.exists() || !targetSnap.exists()) {
        throw new Error("Sujet source ou sujet cible introuvable.");
      }

      const sourceData = sourceSnap.data();
      const targetData = targetSnap.data();

      const sourceReplies = sourceData.reponses || [];
      if (replyIndex < 0 || replyIndex >= sourceReplies.length) return false;

      const replyToMove = sourceReplies[replyIndex];
      const newSourceReplies = sourceReplies.filter((_, idx) => idx !== replyIndex);
      const newTargetReplies = [...(targetData.reponses || []), replyToMove];

      const batch = writeBatch(db);
      batch.update(sourceRef, { reponses: newSourceReplies });
      batch.update(targetRef, {
        reponses: newTargetReplies,
        derniereModification: new Date().toISOString()
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error("Error moving reply to thread:", err);
      setError(err.message || "Erreur lors du déplacement du message.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  /**
   * Extrait une réponse pour en faire un nouveau sujet
   */
  const extractReplyToNewThread = useCallback(async (sourceThreadId, replyIndex, newThreadTitle, newChannelId, newCategory, userProfile) => {
    if (!sourceThreadId || replyIndex === undefined || !newThreadTitle || !newChannelId) return false;
    setActionLoading(true);
    setError(null);
    try {
      const sourceRef = doc(db, 'forum', sourceThreadId);
      const sourceSnap = await getDoc(sourceRef);
      if (!sourceSnap.exists()) throw new Error("Sujet source introuvable.");

      const sourceData = sourceSnap.data();
      const sourceReplies = sourceData.reponses || [];
      if (replyIndex < 0 || replyIndex >= sourceReplies.length) return false;

      const replyToExtract = sourceReplies[replyIndex];
      const newSourceReplies = sourceReplies.filter((_, idx) => idx !== replyIndex);

      const nowIso = new Date().toISOString();
      const newThreadRef = await addDoc(collection(db, 'forum'), {
        groupId: groupId || sourceData.groupId,
        channelId: newChannelId,
        categorie: newCategory || 'Général',
        titre: newThreadTitle.trim(),
        auteurId: replyToExtract.auteurId || userProfile?.uid || 'mod',
        auteurNom: replyToExtract.auteurNom || `${userProfile?.prenom || ''} ${userProfile?.nom || ''}`.trim() || 'Modérateur',
        dateCreation: replyToExtract.dateCreation || nowIso,
        derniereModification: nowIso,
        reponses: [
          {
            auteurId: replyToExtract.auteurId,
            auteurNom: replyToExtract.auteurNom,
            message: replyToExtract.message,
            dateCreation: replyToExtract.dateCreation || nowIso,
            targetTag: replyToExtract.targetTag || null
          }
        ]
      });

      await updateDoc(sourceRef, {
        reponses: newSourceReplies
      });

      return newThreadRef.id;
    } catch (err) {
      console.error("Error extracting reply to new thread:", err);
      setError(err.message || "Erreur lors de la création de la discussion à partir du message.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [groupId]);

  /**
   * Met à jour la position / l'ordre des salons/catégories
   */
  const updateChannelOrder = useCallback(async (channelId, newPosition) => {
    if (!channelId) return false;
    setActionLoading(true);
    setError(null);
    try {
      const chRef = doc(db, 'forum_channels', channelId);
      await updateDoc(chRef, {
        order: newPosition,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Error updating channel order:", err);
      setError(err.message || "Erreur lors du réordonnancement du salon.");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    actionLoading,
    error,
    moveThread,
    togglePinThread,
    deleteThread,
    editThreadDetails,
    deleteReply,
    editReply,
    moveReplyToThread,
    extractReplyToNewThread,
    updateChannelOrder
  };
}
