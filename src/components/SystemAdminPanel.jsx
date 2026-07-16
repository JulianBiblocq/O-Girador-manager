import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function SystemAdminPanel({ user, profileData, onBack, onNavigateToView }) {
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
  const [availableTags, setAvailableTags] = useState([]);
  const [draftRoles, setDraftRoles] = useState({}); // { [userId]: newRole }
  const [draftTags, setDraftTags] = useState({}); // { [userId]: [tag1, tag2, ...] }
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

  // Real-time synchronization of custom tags list from associations collection
  useEffect(() => {
    if (!profileData?.groupId) return;

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.tagsDisponibles)) {
          setAvailableTags(data.tagsDisponibles);
        }
      }
    }, (error) => {
      console.error("SystemAdminPanel - Erreur onSnapshot associations :", error);
    });

    return () => unsubscribe();
  }, [profileData?.groupId]);

  const handleRoleChange = (userId, value) => {
    setDraftRoles((prev) => ({ ...prev, [userId]: value }));
  };

  const handleTagToggle = (userId, tag, isChecked, currentTags = []) => {
    setDraftTags((prev) => {
      const userTags = prev[userId] !== undefined ? prev[userId] : (currentTags || []);
      let updatedTags;
      if (isChecked) {
        updatedTags = [...userTags, tag];
      } else {
        updatedTags = userTags.filter(t => t !== tag);
      }
      return { ...prev, [userId]: updatedTags };
    });
  };

  const handleSavePermissions = async (targetUserId, currentRole, currentTags) => {
    const newRole = draftRoles[targetUserId] !== undefined ? draftRoles[targetUserId] : currentRole;
    const newTags = draftTags[targetUserId] !== undefined ? draftTags[targetUserId] : (currentTags || []);

    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { 
        role: newRole,
        tags: newTags
      });
      
      // Clear drafts upon success
      setDraftRoles((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      setDraftTags((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      
      alert("Permissions de l'utilisateur mises à jour avec succès !");
    } catch (error) {
      console.error("SystemAdminPanel - Erreur updateDoc :", error);
      alert("Erreur lors de la mise à jour des permissions.");
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
        <button 
          type="button"
          onClick={() => onNavigateToView('tag-manager')}
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
        >
          🏷️ Étiquettes
        </button>
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
              const currentTags = userItem.tags || [];
              
              const draftRole = draftRoles[userItem.id];
              const draftTag = draftTags[userItem.id];
              
              const activeRole = draftRole !== undefined ? draftRole : currentRole;
              const activeTags = draftTag !== undefined ? draftTag : currentTags;

              // Check modifications for Role and Tags to toggle Save button
              const isRoleModified = draftRole !== undefined && draftRole !== currentRole;
              const sortedCurrentTags = [...currentTags].sort();
              const sortedActiveTags = [...activeTags].sort();
              const isTagsModified = JSON.stringify(sortedCurrentTags) !== JSON.stringify(sortedActiveTags);
              const isModified = isRoleModified || isTagsModified;

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
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-semibold text-cordel-master-dark/70 mt-0.5">
                        <span>📞 {userItem.telephone || 'Non renseigné'}</span>
                        <span>•</span>
                        <span>👕 T-Shirt : <strong>{userItem.tailleTshirt || 'Non spécifié'}</strong></span>
                      </div>
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
                          onClick={() => handleSavePermissions(userItem.id, currentRole, currentTags)}
                          disabled={!isModified || savingId === userItem.id}
                          className={`text-xs px-3 py-1.5 font-bold uppercase tracking-wider ${
                            !isModified ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          {savingId === userItem.id ? "..." : "Sauver"}
                        </CordelButton>
                      </div>
                    </div>

                    {/* Tags Selector Panel (Checkboxes) */}
                    {availableTags.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-3">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Étiquettes attribuées
                        </label>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-0.5">
                          {availableTags.map((tag) => {
                            const isChecked = activeTags.includes(tag);
                            return (
                              <label key={tag} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold select-none hover:opacity-80">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={savingId === userItem.id}
                                  onChange={(e) => handleTagToggle(userItem.id, tag, e.target.checked, currentTags)}
                                  className="rounded border-encre-noire text-cordel-wood focus:ring-cordel-wood w-3 h-3 cursor-pointer"
                                />
                                <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-1 py-0.5 normal-case tracking-normal rotate-0 bg-transparent shadow-none border-dashed border">
                                  {tag}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
