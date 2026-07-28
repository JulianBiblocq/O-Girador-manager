import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useForumModeration } from './useForumModeration';

/**
 * Hook personnalisé pour gérer l'abonnement en temps réel aux sujets du forum, le filtrage par salon et la modération.
 *
 * @param {string} groupId Identifiant du groupe/association
 * @param {Object} profileData Profil de l'utilisateur connecté
 * @param {Function} t Fonction de traduction
 */
export function useForumThreads(groupId, profileData, t) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [movingThread, setMovingThread] = useState(null);

  // Hook de modération du forum
  const {
    channels,
    hasWriteAccess,
    handleTogglePin,
    handleDeleteThread,
    handleMoveThread,
    handleUpdateThreadDetails,
    handleDeleteReply,
    handleEditReply,
    handleMoveReplyToThread,
    handleExtractReplyToNewThread
  } = useForumModeration(groupId, profileData, t);

  // Abonnements Firestore aux sujets du forum en temps réel
  useEffect(() => {
    if (!groupId) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const threadsRef = collection(db, 'forum_threads');
    const q = query(threadsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetched = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Trier : Épinglés en premier, puis par date de dernière modification
        fetched.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.derniereModification || b.dateCreation) - new Date(a.derniereModification || a.dateCreation);
        });

        setThreads(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("useForumThreads - Erreur snapshot forum_threads :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Filtrage des sujets selon le salon actif et la recherche textuelle
  const filteredThreads = useMemo(() => {
    let result = threads;

    // Filtre par salon actif
    if (activeChannelId && activeChannelId !== 'all') {
      result = result.filter(t => t.channelId === activeChannelId || (!t.channelId && activeChannelId === 'general'));
    }

    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        (t.titre && t.titre.toLowerCase().includes(qLower)) ||
        (t.auteurNom && t.auteurNom.toLowerCase().includes(qLower)) ||
        (t.categorie && t.categorie.toLowerCase().includes(qLower))
      );
    }

    return result;
  }, [threads, activeChannelId, searchQuery]);

  return {
    threads,
    filteredThreads,
    loading,
    channels,
    activeChannelId,
    setActiveChannelId,
    searchQuery,
    setSearchQuery,
    movingThread,
    setMovingThread,
    hasWriteAccess,
    handleTogglePin,
    handleDeleteThread,
    handleMoveThread,
    handleUpdateThreadDetails,
    handleDeleteReply,
    handleEditReply,
    handleMoveReplyToThread,
    handleExtractReplyToNewThread
  };
}
