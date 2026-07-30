import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook usePendingMembersNotification
 * Écoute en temps réel les utilisateurs enregistrés avec le statut isNew: true.
 * Permet d'alimenter les notifications visuelles d'alerte dans la barre de navigation.
 * 
 * @param {Object} profileData Profil de l'utilisateur connecté
 * @returns {Object} { hasPendingMembers: boolean, pendingCount: number }
 */
export function usePendingMembersNotification(profileData) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Seuls les administrateurs et le mestre reçoivent ces alertes de nouveaux membres
    const isAuthorized = profileData?.isSystemAdmin === true || 
                         profileData?.role === 'super-admin' || 
                         profileData?.role === 'mestre' ||
                         profileData?.role === 'admin' ||
                         profileData?.role === 'bureau';

    if (!profileData || !isAuthorized) {
      setPendingCount(0);
      return;
    }

    const usersRef = collection(db, 'users');
    let q;

    if (profileData.isSystemAdmin === true) {
      // Un super admin système voit toutes les nouvelles inscriptions
      q = query(usersRef, where('isNew', '==', true));
    } else if (profileData.groupId) {
      // Un admin de groupe voit uniquement les nouveaux membres de son groupe
      q = query(usersRef, where('groupId', '==', profileData.groupId), where('isNew', '==', true));
    } else {
      q = query(usersRef, where('isNew', '==', true));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    }, (error) => {
      console.error("usePendingMembersNotification - Erreur lors de l'écoute des nouveaux membres :", error);
      setPendingCount(0);
    });

    return () => unsubscribe();
  }, [profileData]);

  return {
    hasPendingMembers: pendingCount > 0,
    pendingCount
  };
}
