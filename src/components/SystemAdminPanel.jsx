import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';
import { XiloSettings, XiloPeople } from './XiloIcons';
import SystemUserList from './admin/SystemUserList';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member", isRequired: false },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member", isRequired: false },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member", isRequired: false },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member", isRequired: false },
  taillePantalon: { key: "taillePantalon", label: "Taille Pantalon/Bas", enabled: true, filledBy: "member", isRequired: false },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member", isRequired: false },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member", isRequired: false },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member", isRequired: false },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member", isRequired: false }
};

export default function SystemAdminPanel({ profileData, onBack, onNavigateToView }) {
  const { t } = useTranslation();

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

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
    if (isEnabled('adresse')) {
      updatePayload.adresseRue = userDraft.adresseRue !== undefined ? userDraft.adresseRue : (currentUserItem.adresseRue || '');
      updatePayload.adresseCP = userDraft.adresseCP !== undefined ? userDraft.adresseCP : (currentUserItem.adresseCP || '');
      updatePayload.adresseVille = userDraft.adresseVille !== undefined ? userDraft.adresseVille : (currentUserItem.adresseVille || '');
      
      updatePayload.adresse = deleteField();
    }
    if (isEnabled('surnom')) {
      updatePayload.surnom = userDraft.surnom !== undefined ? userDraft.surnom : (currentUserItem.surnom || '');
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
    if (window.confirm(translate('pwa.confirmForceUpdate', "Voulez-vous vraiment vider le cache et forcer la mise à jour ?"))) {
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
                {translate('pwa.maintenanceTitle', 'Maintenance & Cache')}
              </h4>
              <p className="text-[10px] opacity-75 font-semibold leading-relaxed">
                {translate('pwa.maintenanceDesc', 'Si des utilisateurs rencontrent des difficultés suite à une mise à jour, forcez la purge du cache local.')}
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

          {/* User list component */}
          <SystemUserList
            usersList={usersList}
            draftRoles={draftRoles}
            draftTags={draftTags}
            draftFields={draftFields}
            draftLevels={draftLevels}
            draftDanceLevels={draftDanceLevels}
            savingId={savingId}
            availableTags={availableTags}
            fieldsConfig={fieldsConfig}
            associationName={associationName}
            handleRoleChange={handleRoleChange}
            handleTagToggle={handleTagToggle}
            handleLevelChange={handleLevelChange}
            handleDanceLevelChange={handleDanceLevelChange}
            handleFieldChange={handleFieldChange}
            handleSavePermissions={handleSavePermissions}
            handleToggleArchive={handleToggleArchive}
          />
        </div>
      )}
    </div>
  );
}
