import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function SystemAdminPanel({ user, profileData, onBack }) {
  // Ultimate Security Verification
  if (!profileData || profileData.isSystemAdmin !== true) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-cordel-wood text-cordel-bg-light rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] select-none">
          🚨
        </div>
        <h2 className="text-xl font-bold text-cordel-wood uppercase tracking-wider">Accès Refusé</h2>
        <p className="text-xs opacity-75 mt-2 font-semibold">
          Vous n'avez pas les privilèges requis pour accéder au panneau d'administration globale.
        </p>
        <CordelButton variant="default" onClick={onBack} className="mt-6 px-5 py-2 text-xs">
          Retourner au tableau de bord
        </CordelButton>
      </div>
    );
  }

  const [usersList, setUsersList] = useState([]);
  const [draftRoles, setDraftRoles] = useState({}); // { [userId]: newRole }
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Synchronize all user profiles in real-time
  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = query(usersRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUsers = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort users by last name
      fetchedUsers.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setUsersList(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("SystemAdminPanel - Erreur onSnapshot users :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = (userId, value) => {
    setDraftRoles((prev) => ({ ...prev, [userId]: value }));
  };

  const handleSaveRole = async (targetUserId) => {
    const newRole = draftRoles[targetUserId];
    if (!newRole) return; // No change made

    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { role: newRole });
      
      // Clear draft role state for this user upon success
      setDraftRoles((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      
      alert("Le rôle de l'utilisateur a été mis à jour avec succès !");
    } catch (error) {
      console.error("SystemAdminPanel - Erreur updateDoc :", error);
      alert("Erreur lors de la mise à jour du rôle.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ⬅️ Retour
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          Tour de Contrôle
        </span>
        <div className="w-12"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Global Statistics Card */}
          <CordelCard variant="default" useExtremeBorder={true} className="py-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">
              Statistiques Globales
            </h3>
            <p className="text-sm font-bold text-encre-noire leading-relaxed">
              👥 Total des inscrits : <span className="text-base font-black text-cordel-wood">{usersList.length}</span>
            </p>
          </CordelCard>

          {/* Users List Title */}
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase pl-1 mt-2">
            Gestion des Utilisateurs
          </h3>

          {/* User grid */}
          <div className="flex flex-col gap-3">
            {usersList.map((userItem) => {
              const currentRole = userItem.role || 'membre';
              const draftRole = draftRoles[userItem.id];
              const isModified = draftRole !== undefined && draftRole !== currentRole;
              const activeRole = draftRole !== undefined ? draftRole : currentRole;

              return (
                <CordelCard key={userItem.id} variant="default" useExtremeBorder={false} className="py-4 relative pr-4">
                  <div className="flex flex-col gap-3 text-left">
                    {/* User Identification info */}
                    <div>
                      <h4 className="font-extrabold text-sm text-encre-noire leading-tight truncate">
                        {userItem.prenom} {userItem.nom}
                      </h4>
                      <p className="text-[9px] font-semibold text-cordel-master-dark/70 break-all select-all mt-0.5">
                        ✉️ {userItem.email}
                      </p>
                      <p className="text-[9px] font-bold text-cordel-wood mt-0.5">
                        📦 Groupe : <span className="font-mono">{userItem.groupId || 'Aucun'}</span>
                      </p>
                    </div>

                    {/* Role Control Panel */}
                    <div className="flex items-center gap-3 border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Rôle de l'utilisateur
                        </label>
                        <select
                          value={activeRole}
                          onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                          disabled={savingId === userItem.id}
                          className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
                        >
                          <option value="membre">Membre</option>
                          <option value="mestre">Mestre</option>
                          <option value="super-admin">Super-Admin</option>
                        </select>
                      </div>

                      {/* Action save button (Only clickable when modified) */}
                      <div className="self-end pb-0.5">
                        <CordelButton
                          variant={isModified ? "ocre" : "default"}
                          useExtremeBorder={true}
                          onClick={() => handleSaveRole(userItem.id)}
                          disabled={!isModified || savingId === userItem.id}
                          className={`text-xs px-3 py-1.5 font-bold uppercase tracking-wider ${
                            !isModified ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          {savingId === userItem.id ? "..." : "Sauver"}
                        </CordelButton>
                      </div>
                    </div>
                  </div>

                  {/* Stamp badge representing current live role */}
                  <div className="absolute right-4 top-4 select-none">
                    <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px]">
                      {currentRole}
                    </span>
                  </div>
                </CordelCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
