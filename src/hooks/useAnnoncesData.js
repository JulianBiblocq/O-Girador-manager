import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { setCachedAnnouncements } from '../utils/dashboardCacheUtils';
import useConfirm from './useConfirm';

/**
 * Hook personnalisé : useAnnoncesData
 * 
 * Centralise les abonnements temps réel Firestore pour les annonces,
 * les tags d'association et les membres du groupe.
 */
export function useAnnoncesData(groupId, t, announcements, setAnnouncements) {
  const { confirm } = useConfirm();
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [assocPermissionsMatrice, setAssocPermissionsMatrice] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(() => announcements.length === 0);

  // Synchronisation Firestore des annonces du groupe
  useEffect(() => {
    if (!groupId) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    if (announcements.length === 0) setLoading(true);

    const q = query(collection(db, 'announcements'), where('groupId', '==', groupId), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
      setAnnouncements(fetched);
      setCachedAnnouncements(groupId, fetched);
      setLoading(false);
    }, (error) => {
      console.error('useAnnoncesData - Erreur onSnapshot announcements :', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Écoute des tags et de la matrice de permissions
  useEffect(() => {
    if (!groupId) return;
    return onSnapshot(doc(db, 'associations', groupId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setTagsDisponibles(d.tagsDisponibles || []);
        if (d.permissionsMatrice) setAssocPermissionsMatrice(d.permissionsMatrice);
      }
    });
  }, [groupId]);

  // Écoute des membres pour le ciblage et les accusés
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', groupId));
    return onSnapshot(q, (snapshot) => {
      setAllMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [groupId]);

  const handleDeleteAnnouncement = async (annId, annTitre) => {
    const ok = await confirm({
      title: "Supprimer l'annonce",
      message: `${t('widgetAnnonces.deleteConfirm') || 'Voulez-vous supprimer'} "${annTitre}" ?`,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler',
      variant: 'danger'
    });
    if (ok) {
      try {
        await deleteDoc(doc(db, 'announcements', annId));
      } catch (err) {
        console.error('useAnnoncesData - Erreur suppression :', err);
      }
    }
  };

  return {
    tagsDisponibles,
    assocPermissionsMatrice,
    allMembers,
    loading,
    handleDeleteAnnouncement
  };
}
