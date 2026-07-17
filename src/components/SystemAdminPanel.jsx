import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';
import { XiloSettings, XiloPeople } from './XiloIcons';
import { generateImageCharterPDF, generateMedicalAttestationPDF } from '../utils/pdfGenerator';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member" },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member" },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member" },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member" },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member" },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member" }
};

export default function SystemAdminPanel({ user, profileData, onBack, onNavigateToView }) {
  const { t } = useTranslation();
  const [usersList, setUsersList] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [draftRoles, setDraftRoles] = useState({}); // { [userId]: newRole }
  const [draftTags, setDraftTags] = useState({}); // { [userId]: [tag1, tag2, ...] }
  const [draftFields, setDraftFields] = useState({}); // { [userId]: { telephone, tshirt, ... } }
  const [draftLevels, setDraftLevels] = useState({}); // { [userId]: 'debutant' | 'confirme' }
  const [draftDanceLevels, setDraftDanceLevels] = useState({}); // { [userId]: 'aucun' | 'debutant' | 'confirme' }
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [associationName, setAssociationName] = useState('');

  // Synchronize all user profiles in real-time
  useEffect(() => {
    if (!profileData) return;
    const isAuthorized = profileData.isSystemAdmin === true || profileData.role === 'super-admin' || profileData.role === 'mestre';
    if (!isAuthorized) return;

    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = profileData.isSystemAdmin === true
      ? query(usersRef)
      : query(usersRef, where('groupId', '==', profileData.groupId));

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
  }, [profileData]);

  // Real-time synchronization of custom tags list and fieldsConfig from associations collection
  useEffect(() => {
    if (!profileData || !profileData.groupId) return;
    const isAuthorized = profileData.isSystemAdmin === true || profileData.role === 'super-admin' || profileData.role === 'mestre';
    if (!isAuthorized) return;

    const assocRef = doc(db, 'associations', profileData.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nom) {
          setAssociationName(data.nom);
        }
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
  }, [profileData]);

  // Ultimate Security Verification
  const isAuthorized = profileData?.isSystemAdmin === true || profileData?.role === 'super-admin' || profileData?.role === 'mestre';
  if (!profileData || !isAuthorized) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-cordel-wood text-cordel-bg-light rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] select-none">
          🚨
        </div>
        <h2 className="text-xl font-bold text-cordel-wood uppercase tracking-wider">{t('systemAdmin.accessDenied')}</h2>
        <p className="text-xs opacity-75 mt-2 font-semibold">
          {t('systemAdmin.accessDeniedDesc')}
        </p>
        <CordelButton variant="default" onClick={onBack} className="mt-6 px-5 py-2 text-xs">
          {t('common.back')}
        </CordelButton>
      </div>
    );
  }

  const handleRoleChange = (userId, value) => {
    setDraftRoles((prev) => ({ ...prev, [userId]: value }));
  };

  const handleLevelChange = (userId, value) => {
    setDraftLevels((prev) => ({ ...prev, [userId]: value }));
  };

  const handleDanceLevelChange = (userId, value) => {
    setDraftDanceLevels((prev) => ({ ...prev, [userId]: value }));
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
    const currentLevel = currentUserItem.niveau || 'aucun';
    const currentDanceLevel = currentUserItem.niveauDanse || 'aucun';

    const newRole = draftRoles[targetUserId] !== undefined ? draftRoles[targetUserId] : currentRole;
    const newTags = draftTags[targetUserId] !== undefined ? draftTags[targetUserId] : (currentTags || []);
    const newLevel = draftLevels[targetUserId] !== undefined ? draftLevels[targetUserId] : currentLevel;
    const newDanceLevel = draftDanceLevels[targetUserId] !== undefined ? draftDanceLevels[targetUserId] : currentDanceLevel;

    const userDraft = draftFields[targetUserId] || {};
    const isEnabled = (key) => fieldsConfig?.[key]?.enabled === true;

    const updatePayload = {
      role: newRole,
      tags: newTags,
      niveau: newLevel,
      niveauDanse: newDanceLevel
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
      setDraftLevels((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      setDraftDanceLevels((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      setDraftFields((prev) => {
        const copy = { ...prev };
        delete copy[targetUserId];
        return copy;
      });
      
      alert(t('common.saveSuccess'));
    } catch (error) {
      console.error("SystemAdminPanel - Erreur updateDoc :", error);
      alert(t('common.saveError'));
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (targetUserId, targetUserName) => {
    const confirmation = window.confirm(`Voulez-vous vraiment supprimer le membre "${targetUserName}" ? Cette action est irréversible.`);
    if (!confirmation) return;

    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await deleteDoc(userRef);
      alert("Membre supprimé avec succès.");
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de la suppression :", error);
      alert("Erreur lors de la suppression du membre.");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleArchive = async (targetUserId, shouldReactivate) => {
    const actionText = shouldReactivate ? "réactiver" : "archiver";
    const confirmation = window.confirm(`Voulez-vous vraiment ${actionText} ce membre ?`);
    if (!confirmation) return;

    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        statutActuel: shouldReactivate ? 'active' : 'archived'
      });
      alert(`Membre ${shouldReactivate ? 'réactivé' : 'archivé'} avec succès.`);
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de l'archivage/réactivation :", error);
      alert("Une erreur est survenue.");
    } finally {
      setSavingId(null);
    }
  };

  const handleForceUpdate = () => {
    if (window.confirm(t('pwa.confirmForceUpdate') || "Voulez-vous vraiment vider le cache et forcer la mise à jour ?")) {
      forceUpdateAndClearCache();
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          {t('systemAdmin.title')}
        </span>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => onNavigateToView('tag-manager')}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
          >
            🏷️ {t('tags.managerTitle')}
          </button>
          <button 
            type="button"
            onClick={() => onNavigateToView('association-settings')}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
          >
            <XiloSettings size={12} /> {t('common.settings')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ {t('systemAdmin.loading')}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* PWA Cache Action Card */}
          <CordelCard variant="ocre" useExtremeBorder={false} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex flex-col gap-1">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
                {t('pwa.maintenanceTitle') || 'Maintenance & Cache'}
              </h4>
              <p className="text-[10px] opacity-75 font-semibold leading-relaxed">
                {t('pwa.maintenanceDesc') || 'Si des utilisateurs rencontrent des difficultés suite à une mise à jour, forcez la purge du cache local.'}
              </p>
            </div>
            <CordelButton 
              type="button" 
              variant="default" 
              onClick={handleForceUpdate}
              useExtremeBorder={true}
              className="py-2.5 px-4 text-xs font-black uppercase tracking-wider shrink-0 !bg-cordel-wood !text-cordel-bg-light"
            >
              ⚡ {t('pwa.forceUpdateBtn')}
            </CordelButton>
          </CordelCard>

          {/* Global Statistics Card */}
          <CordelCard variant="default" useExtremeBorder={true} className="py-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">
              {t('systemAdmin.globalStats')}
            </h3>
            <p className="text-sm font-bold text-encre-noire leading-relaxed flex items-center justify-center gap-1.5">
              <XiloPeople size={14} /> {t('systemAdmin.totalRegistered')} : <span className="text-base font-black text-cordel-wood">{usersList.length}</span>
            </p>
          </CordelCard>

          {/* Users List Title */}
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase pl-1 mt-2">
            {t('systemAdmin.usersHeading')}
          </h3>

          {/* User grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usersList.map((userItem) => {
              const currentRole = userItem.role || 'membre';
              const currentTags = userItem.tags || [];
              const currentLevel = userItem.niveau || 'aucun';
              const currentDanceLevel = userItem.niveauDanse || 'aucun';
              
              const draftRole = draftRoles[userItem.id];
              const draftTag = draftTags[userItem.id];
              const draftLevel = draftLevels[userItem.id];
              const draftDanceLevel = draftDanceLevels[userItem.id];
              const userDraft = draftFields[userItem.id] || {};
              
              const activeRole = draftRole !== undefined ? draftRole : currentRole;
              const activeTags = draftTag !== undefined ? draftTag : currentTags;
              const activeLevel = draftLevel !== undefined ? draftLevel : currentLevel;
              const activeDanceLevel = draftDanceLevel !== undefined ? draftDanceLevel : currentDanceLevel;

              // Check modifications for Role and Tags to toggle Save button
              const isRoleModified = draftRole !== undefined && draftRole !== currentRole;
              const sortedCurrentTags = [...currentTags].sort();
              const sortedActiveTags = [...activeTags].sort();
              const isTagsModified = JSON.stringify(sortedCurrentTags) !== JSON.stringify(sortedActiveTags);
              const isLevelModified = draftLevel !== undefined && draftLevel !== currentLevel;
              const isDanceLevelModified = draftDanceLevel !== undefined && draftDanceLevel !== currentDanceLevel;
              
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

              const isModified = isRoleModified || isTagsModified || isAnyFieldModified || isLevelModified || isDanceLevelModified;
              const isArchived = userItem.statutActuel === 'archived';

              return (
                <CordelCard 
                  key={userItem.id} 
                  variant="default" 
                  useExtremeBorder={false} 
                  className={`py-4 relative pr-4 ${isArchived ? 'opacity-65 grayscale-[30%] border-dashed border-cordel-master-dark/30' : ''}`}
                >
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
                      <p className="text-[9px] font-bold text-cordel-wood mt-0.5 flex flex-wrap gap-x-2">
                        <span>📦 Groupe : <span className="font-mono">{userItem.groupId || 'Aucun'}</span></span>
                        <span>•</span>
                        <span>🏆 Percu : <strong className="uppercase">{userItem.niveau === 'confirme' ? 'Confirmé' : userItem.niveau === 'debutant' ? 'Débutant' : 'Aucun'}</strong></span>
                        <span>•</span>
                        <span>💃 Danse : <strong className="uppercase">{userItem.niveauDanse === 'confirme' ? 'Confirmé' : userItem.niveauDanse === 'debutant' ? 'Débutant' : 'Aucun'}</strong></span>
                      </p>

                      {/* Display member instruments */}
                      {(() => {
                        const userInstruments = userItem.instrumentsJoues && userItem.instrumentsJoues.length > 0
                          ? userItem.instrumentsJoues
                          : [userItem.instrument].filter(Boolean);
                        
                        if (userInstruments.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userInstruments.map((inst) => (
                              <span 
                                key={inst} 
                                className="inline-block text-[8px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire/30 px-1.5 py-0.5 rounded-[3px]"
                              >
                                🎵 {inst}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Role Control Panel */}
                    <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1">
                      <div className="flex flex-col gap-1 flex-1 min-w-[90px]">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          {t('systemAdmin.roleLabel') || "Rôle"}
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

                      <div className="flex flex-col gap-1 flex-1 min-w-[90px]">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          {t('systemAdmin.musicLevel') || "Niveau Musique"}
                        </label>
                        <select
                          value={activeLevel}
                          onChange={(e) => handleLevelChange(userItem.id, e.target.value)}
                          disabled={savingId === userItem.id}
                          className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
                        >
                          <option value="aucun">Aucun</option>
                          <option value="debutant">Débutant</option>
                          <option value="confirme">Confirmé</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 flex-1 min-w-[90px]">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          {t('systemAdmin.danceLevel') || "Niveau Danse"}
                        </label>
                        <select
                          value={activeDanceLevel}
                          onChange={(e) => handleDanceLevelChange(userItem.id, e.target.value)}
                          disabled={savingId === userItem.id}
                          className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
                        >
                          <option value="aucun">Aucun</option>
                          <option value="debutant">Débutant</option>
                          <option value="confirme">Confirmé</option>
                        </select>
                      </div>

                      {/* Action buttons (Save, Archive/Reactivate & Delete) */}
                      <div className="self-end pb-0.5 flex flex-wrap gap-2">
                        <CordelButton
                          type="button"
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

                        {userItem.id !== user.uid && (
                          <CordelButton
                            type="button"
                            variant={isArchived ? 'vert' : 'default'}
                            useExtremeBorder={true}
                            onClick={() => handleToggleArchive(userItem.id, isArchived)}
                            disabled={savingId === userItem.id}
                            className="text-xs px-3 py-1.5 font-bold uppercase tracking-wider"
                          >
                            {isArchived ? "Réactiver" : "Archiver"}
                          </CordelButton>
                        )}

                        {userItem.id !== user.uid && (
                          <CordelButton
                            type="button"
                            variant="rouge"
                            useExtremeBorder={true}
                            onClick={() => handleDeleteUser(userItem.id, `${userItem.prenom} ${userItem.nom}`)}
                            disabled={savingId === userItem.id}
                            className="text-xs px-3 py-1.5 font-bold uppercase tracking-wider"
                          >
                            Supprimer
                          </CordelButton>
                        )}
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

                    {/* PDF Generation section */}
                    {(userItem.droitImage === true || userItem.aptitudeMedicale === true) && (
                      <div className="flex flex-wrap gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1.5">
                        <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark w-full">
                          Documents Signés (PDF)
                        </label>
                        {userItem.droitImage === true && (
                          <button
                            type="button"
                            onClick={() => generateImageCharterPDF(userItem, associationName)}
                            className="text-[9px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
                          >
                            📄 Télécharger Charte Image PDF
                          </button>
                        )}
                        {userItem.aptitudeMedicale === true && (
                          <button
                            type="button"
                            onClick={() => generateMedicalAttestationPDF(userItem, associationName)}
                            className="text-[9px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
                          >
                            📄 Télécharger Attestation Santé PDF
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stamp badge representing current live role and archived status */}
                  <div className="absolute right-4 top-4 select-none flex flex-col items-end gap-1">
                    <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px]">
                      {currentRole}
                    </span>
                    {isArchived && (
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-red-600 text-red-600 font-extrabold uppercase rotate-[-3deg]">
                        Archivé
                      </span>
                    )}
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
