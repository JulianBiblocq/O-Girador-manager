import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

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
  const [draftFields, setDraftFields] = useState({}); // { [userId]: { telephone, tshirt, ... } }
  const [fieldsConfig, setFieldsConfig] = useState(null);
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

  // Real-time synchronization of custom tags list and fieldsConfig from associations collection
  useEffect(() => {
    if (!profileData?.groupId) return;

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.tagsDisponibles)) {
          setAvailableTags(data.tagsDisponibles);
        }
        if (data.fieldsConfig) {
          setFieldsConfig({ ...DEFAULT_FIELDS_CONFIG, ...data.fieldsConfig });
        } else {
          setFieldsConfig(DEFAULT_FIELDS_CONFIG);
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

  const handleFieldChange = (userId, fieldKey, value) => {
    setDraftFields((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [fieldKey]: value
      }
    }));
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

  const handleSavePermissions = async (targetUserId, currentUserItem) => {
    const currentRole = currentUserItem.role || 'membre';
    const currentTags = currentUserItem.tags || [];

    const newRole = draftRoles[targetUserId] !== undefined ? draftRoles[targetUserId] : currentRole;
    const newTags = draftTags[targetUserId] !== undefined ? draftTags[targetUserId] : (currentTags || []);

    const userDraft = draftFields[targetUserId] || {};
    const isEnabled = (key) => fieldsConfig?.[key]?.enabled === true;

    const updatePayload = {
      role: newRole,
      tags: newTags
    };

    if (isEnabled('telephone')) {
      updatePayload.telephone = userDraft.telephone !== undefined ? userDraft.telephone : (currentUserItem.telephone || '');
    }
    if (isEnabled('tailleTshirt')) {
      updatePayload.tailleTshirt = userDraft.tailleTshirt !== undefined ? userDraft.tailleTshirt : (currentUserItem.tailleTshirt || 'M');
    }
    if (isEnabled('droitImage')) {
      updatePayload.droitImage = userDraft.droitImage !== undefined ? userDraft.droitImage : (currentUserItem.droitImage !== undefined ? currentUserItem.droitImage : true);
    }
    if (isEnabled('aptitudeMedicale')) {
      updatePayload.aptitudeMedicale = userDraft.aptitudeMedicale !== undefined ? userDraft.aptitudeMedicale : (currentUserItem.aptitudeMedicale !== undefined ? currentUserItem.aptitudeMedicale : false);
    }
    if (isEnabled('lateralite')) {
      updatePayload.lateralite = userDraft.lateralite !== undefined ? userDraft.lateralite : (currentUserItem.lateralite || 'droitier');
    }
    if (isEnabled('dateNaissance')) {
      updatePayload.dateNaissance = userDraft.dateNaissance !== undefined ? userDraft.dateNaissance : (currentUserItem.dateNaissance || '');
    }

    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, updatePayload);
      
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
      setDraftFields((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      
      alert("Profil et permissions mis à jour avec succès !");
    } catch (error) {
      console.error("SystemAdminPanel - Erreur updateDoc :", error);
      alert("Erreur lors de la mise à jour.");
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
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => onNavigateToView('tag-manager')}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
          >
            🏷️ Étiquettes
          </button>
          <button 
            type="button"
            onClick={() => onNavigateToView('association-settings')}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
          >
            ⚙️ Paramètres
          </button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usersList.map((userItem) => {
              const currentRole = userItem.role || 'membre';
              const currentTags = userItem.tags || [];
              
              const draftRole = draftRoles[userItem.id];
              const draftTag = draftTags[userItem.id];
              const userDraft = draftFields[userItem.id] || {};
              
              const activeRole = draftRole !== undefined ? draftRole : currentRole;
              const activeTags = draftTag !== undefined ? draftTag : currentTags;

              // Check modifications for Role and Tags to toggle Save button
              const isRoleModified = draftRole !== undefined && draftRole !== currentRole;
              const sortedCurrentTags = [...currentTags].sort();
              const sortedActiveTags = [...activeTags].sort();
              const isTagsModified = JSON.stringify(sortedCurrentTags) !== JSON.stringify(sortedActiveTags);
              
              const isFieldModified = (key, currentVal) => {
                return userDraft[key] !== undefined && userDraft[key] !== currentVal;
              };
              const isAnyFieldModified = 
                isFieldModified('telephone', userItem.telephone) ||
                isFieldModified('tailleTshirt', userItem.tailleTshirt) ||
                isFieldModified('droitImage', userItem.droitImage) ||
                isFieldModified('aptitudeMedicale', userItem.aptitudeMedicale) ||
                isFieldModified('lateralite', userItem.lateralite) ||
                isFieldModified('dateNaissance', userItem.dateNaissance);

              const isModified = isRoleModified || isTagsModified || isAnyFieldModified;

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
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] font-semibold text-cordel-master-dark/70 mt-0.5">
                        {(!fieldsConfig || fieldsConfig.telephone?.enabled) && (
                          <>
                            <span>📞 {userItem.telephone || 'Non renseigné'}</span>
                            <span>•</span>
                          </>
                        )}
                        {(!fieldsConfig || fieldsConfig.tailleTshirt?.enabled) && (
                          <>
                            <span>👕 T-Shirt : <strong>{userItem.tailleTshirt || 'Non spécifié'}</strong></span>
                            {(!fieldsConfig || fieldsConfig.lateralite?.enabled) && <span>•</span>}
                          </>
                        )}
                        {(!fieldsConfig || fieldsConfig.lateralite?.enabled) && (
                          <span>👋 Main : <strong>{userItem.lateralite || 'Droitier'}</strong></span>
                        )}
                        {(!fieldsConfig || fieldsConfig.dateNaissance?.enabled) && (
                          <>
                            {((!fieldsConfig || fieldsConfig.lateralite?.enabled) || (!fieldsConfig || fieldsConfig.tailleTshirt?.enabled)) && <span>•</span>}
                            <span>🎂 Nais. : <strong>{userItem.dateNaissance || 'Non spécifié'}</strong></span>
                          </>
                        )}
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
                          onClick={() => handleSavePermissions(userItem.id, userItem)}
                          disabled={!isModified || savingId === userItem.id}
                          className={`text-xs px-3 py-1.5 font-bold uppercase tracking-wider ${
                            !isModified ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          {savingId === userItem.id ? "..." : "Sauver"}
                        </CordelButton>
                      </div>
                    </div>

                    {/* Custom Admin Fields Form (Only renders enabled custom fields) */}
                    {fieldsConfig && Object.values(fieldsConfig).some(f => f.enabled) && (
                      <div className="flex flex-col gap-3 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1.5">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Champs d'Association ({userItem.groupId})
                        </label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Telephone */}
                          {fieldsConfig.telephone?.enabled && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-cordel-wood">Téléphone</span>
                              <input
                                type="tel"
                                value={userDraft.telephone !== undefined ? userDraft.telephone : (userItem.telephone || '')}
                                onChange={(e) => handleFieldChange(userItem.id, 'telephone', e.target.value)}
                                disabled={savingId === userItem.id}
                                className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                                placeholder="Non renseigné"
                              />
                            </div>
                          )}

                          {/* Taille Tshirt */}
                          {fieldsConfig.tailleTshirt?.enabled && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-cordel-wood">Taille T-Shirt</span>
                              <select
                                value={userDraft.tailleTshirt !== undefined ? userDraft.tailleTshirt : (userItem.tailleTshirt || 'M')}
                                onChange={(e) => handleFieldChange(userItem.id, 'tailleTshirt', e.target.value)}
                                disabled={savingId === userItem.id}
                                className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                              >
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                              </select>
                            </div>
                          )}

                          {/* Latéralité */}
                          {fieldsConfig.lateralite?.enabled && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-cordel-wood">Latéralité</span>
                              <select
                                value={userDraft.lateralite !== undefined ? userDraft.lateralite : (userItem.lateralite || 'droitier')}
                                onChange={(e) => handleFieldChange(userItem.id, 'lateralite', e.target.value)}
                                disabled={savingId === userItem.id}
                                className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                              >
                                <option value="droitier">Droitier</option>
                                <option value="gaucher">Gaucher</option>
                              </select>
                            </div>
                          )}

                          {/* Date de naissance */}
                          {fieldsConfig.dateNaissance?.enabled && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-cordel-wood">Naissance</span>
                              <input
                                type="date"
                                value={userDraft.dateNaissance !== undefined ? userDraft.dateNaissance : (userItem.dateNaissance || '')}
                                onChange={(e) => handleFieldChange(userItem.id, 'dateNaissance', e.target.value)}
                                disabled={savingId === userItem.id}
                                className="theme-input text-[10px] font-bold py-1 px-1.5"
                              />
                            </div>
                          )}
                        </div>

                        {/* Checkboxes for right to image and medical fitness */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-0.5">
                          {fieldsConfig.droitImage?.enabled && (
                            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none">
                              <input
                                type="checkbox"
                                checked={userDraft.droitImage !== undefined ? userDraft.droitImage : (userItem.droitImage !== false)}
                                onChange={(e) => handleFieldChange(userItem.id, 'droitImage', e.target.checked)}
                                disabled={savingId === userItem.id}
                                className="w-3 h-3 cursor-pointer"
                              />
                              <span>Droit image</span>
                            </label>
                          )}

                          {fieldsConfig.aptitudeMedicale?.enabled && (
                            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none">
                              <input
                                type="checkbox"
                                checked={userDraft.aptitudeMedicale !== undefined ? userDraft.aptitudeMedicale : (userItem.aptitudeMedicale === true)}
                                onChange={(e) => handleFieldChange(userItem.id, 'aptitudeMedicale', e.target.checked)}
                                disabled={savingId === userItem.id}
                                className="w-3 h-3 cursor-pointer"
                              />
                              <span>Aptitude méd.</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}

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
