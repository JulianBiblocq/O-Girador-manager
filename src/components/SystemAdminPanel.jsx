import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, deleteField, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import Tooltip from './Tooltip';
import { useTranslation } from './LanguageContext';
import { forceUpdateAndClearCache } from '../utils/pwaUtils';
import { XiloSettings, XiloPeople } from './XiloIcons';
import SystemUserList from './admin/SystemUserList';
import useConfirm from '../hooks/useConfirm';
import { getMigratedRoleAndTags, VALID_SYSTEM_ROLES } from '../utils/roleMigration';
import { telemetryService } from '../services/telemetryService';

const DEFAULT_FIELDS_CONFIG = {
  telephone: { key: "telephone", label: "Téléphone", enabled: true, filledBy: "member", isRequired: false },
  adresse: { key: "adresse", label: "Adresse physique", enabled: true, filledBy: "member", isRequired: false },
  surnom: { key: "surnom", label: "Surnom", enabled: true, filledBy: "member", isRequired: false },
  tailleTshirt: { key: "tailleTshirt", label: "Taille T-shirt", enabled: true, filledBy: "member", isRequired: false },
  taillePantalon: { key: "taillePantalon", label: "Taille Pantalon/Bas", enabled: true, filledBy: "member", isRequired: false },
  droitImage: { key: "droitImage", label: "Droit à l'image", enabled: true, filledBy: "member", isRequired: false },
  aptitudeMedicale: { key: "aptitudeMedicale", label: "Aptitude médicale", enabled: true, filledBy: "member", isRequired: false },
  lateralite: { key: "lateralite", label: "Latéralité (Gaucher/Droitier)", enabled: true, filledBy: "member", isRequired: false },
  dateNaissance: { key: "dateNaissance", label: "Date de naissance", enabled: true, filledBy: "member", isRequired: false },
  niveaux: { key: "niveaux", label: "Affichage des niveaux dans le trombinoscope", enabled: true, filledBy: "admin", isRequired: false }
};

export default function SystemAdminPanel({ profileData, associationName: propAssociationName, onBack, onNavigateToView }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

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
  const [draftAppRights, setDraftAppRights] = useState({}); // { [userId]: { sequenciador: boolean, dansador: boolean, orchestrador: boolean } }
  const [quotas, setQuotas] = useState({}); // { sequenciador: number, dansador: number, orchestrador: number }
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [associationName, setAssociationName] = useState(propAssociationName || '');

  useEffect(() => {
    if (propAssociationName) {
      setAssociationName(propAssociationName);
    }
  }, [propAssociationName]);

  // Synchronisation en temps réel de l'ensemble des profils membres
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
      querySnapshot.forEach((docSnap) => {
        const uData = docSnap.data();
        const migration = getMigratedRoleAndTags(uData);
        if (migration.needsMigration) {
          const uRef = doc(db, 'users', docSnap.id);
          updateDoc(uRef, {
            role: migration.newRole,
            tags: migration.newTags
          }).catch(err => {
            console.error("SystemAdminPanel - Erreur migration utilisateur :", err);
            telemetryService.logError(err, 'SystemAdminPanel_Migration', profileData?.groupId);
          });

          fetchedUsers.push({
            id: docSnap.id,
            ...uData,
            role: migration.newRole,
            tags: migration.newTags
          });
        } else {
          fetchedUsers.push({
            id: docSnap.id,
            ...uData
          });
        }
      });

      // Trier les membres par nom de famille
      fetchedUsers.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setUsersList(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("SystemAdminPanel - Erreur onSnapshot users :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData]);

  // Synchronisation temps réel de la liste des étiquettes et des paramètres depuis la collection associations
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
        if (data.quotas) {
          setQuotas(data.quotas);
        }
      }
    }, (error) => {
      console.error("SystemAdminPanel - Erreur onSnapshot associations :", error);
    });

    return () => unsubscribe();
  }, [profileData]);

  // Contrôle de sécurité ultime
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

  const handleAppRightToggle = (userId, appName, value) => {
    setDraftAppRights((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [appName]: value
      }
    }));
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

    const rawRole = draftRoles[targetUserId] !== undefined ? draftRoles[targetUserId] : currentRole;
    const migration = getMigratedRoleAndTags({ role: rawRole, tags: currentTags });
    const finalRole = VALID_SYSTEM_ROLES.includes(rawRole) ? rawRole : migration.newRole;
    const newTags = draftTags[targetUserId] !== undefined ? draftTags[targetUserId] : (migration.needsMigration ? migration.newTags : currentTags);
    const newLevel = draftLevels[targetUserId] !== undefined ? draftLevels[targetUserId] : currentLevel;
    const newDanceLevel = draftDanceLevels[targetUserId] !== undefined ? draftDanceLevels[targetUserId] : currentDanceLevel;

    const appRights = draftAppRights[targetUserId] || {};

    const userDraft = draftFields[targetUserId] || {};
    const isEnabled = (key) => fieldsConfig?.[key]?.enabled === true;

    const updatePayload = {
      role: finalRole,
      tags: newTags,
      niveau: newLevel,
      niveauDanse: newDanceLevel
    };

    if (appRights.sequenciador !== undefined) {
      updatePayload.canWriteSequenciador = appRights.sequenciador;
    }
    if (appRights.dansador !== undefined) {
      updatePayload.canWriteDansador = appRights.dansador;
    }
    if (appRights.orchestrador !== undefined) {
      updatePayload.canWriteOrchestrador = appRights.orchestrador;
    }

    if (isEnabled('telephone')) {
      updatePayload.telephone = userDraft.telephone !== undefined ? userDraft.telephone : (currentUserItem.telephone || '');
    }
    if (isEnabled('adresse')) {
      const defaultRue = currentUserItem.adresseRue || currentUserItem.adresse || '';
      updatePayload.adresseRue = userDraft.adresseRue !== undefined ? userDraft.adresseRue : defaultRue;
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
      
      // Effacer drafts upon success
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
      setDraftAppRights((prev) => {
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
      telemetryService.logError(error, 'SystemAdminPanel_SavePermissions', profileData?.groupId);
      alert(t('common.saveError'));
    } finally {
      setSavingId(null);
    }
  };

  // Validation d'une nouvelle inscription : passe isNew à false dans Firestore
  const handleValidateNewMember = async (targetUserId) => {
    if (!targetUserId) return;
    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { isNew: false });
      alert("Inscription validée avec succès ! Le membre n'est plus marqué comme nouveau.");
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de la validation du nouveau membre :", error);
      telemetryService.logError(error, 'SystemAdminPanel_ValidateNewMember', profileData?.groupId);
      alert("Erreur lors de la validation : " + (error.message || error));
    } finally {
      setSavingId(null);
    }
  };

  // Sauvegarde complète du profil d'un membre depuis la modale d'édition avancée
  const handleSaveFullModalProfile = async (targetUserId, updatedPayload) => {
    if (!targetUserId || !updatedPayload) return;
    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, updatedPayload);
      alert("Fiche membre mise à jour avec succès.");
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de la mise à jour complète du membre :", error);
      telemetryService.logError(error, 'SystemAdminPanel_SaveFullModalProfile', profileData?.groupId);
      alert("Erreur de sauvegarde : " + (error.message || error));
    } finally {
      setSavingId(null);
    }
  };


  const handleToggleArchive = async (targetUserId, shouldReactivate) => {
    const actionText = shouldReactivate ? "réactiver" : "archiver";
    const confirmation = await confirm({
      title: shouldReactivate ? "Réactiver le membre" : "Archiver le membre",
      message: `Voulez-vous vraiment ${actionText} ce membre ?`,
      confirmText: shouldReactivate ? "Oui, réactiver" : "Oui, archiver",
      cancelText: "Annuler",
      variant: shouldReactivate ? "warning" : "danger"
    });
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
      telemetryService.logError(error, 'SystemAdminPanel_ToggleArchive', profileData?.groupId);
      alert("Une erreur est survenue.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (targetUserId, userFullName) => {
    if (!targetUserId) return;
    const confirmation = await confirm({
      title: "Supprimer définitivement le membre",
      message: `Voulez-vous vraiment SUPPRIMER définitivement le membre "${userFullName || 'ce membre'}" ?\n\nCette action est irréversible et supprimera le profil de la base de données.`,
      confirmText: "Oui, supprimer définitivement",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!confirmation) return;

    setSavingId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await deleteDoc(userRef);
      alert(`Le membre ${userFullName || ''} a été définitivement supprimé.`);
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de la suppression du membre :", error);
      telemetryService.logError(error, 'SystemAdminPanel_DeleteUser', profileData?.groupId);
      alert("Erreur lors de la suppression : " + (error.message || error));
    } finally {
      setSavingId(null);
    }
  };

  const handleForceUpdate = async () => {
    const ok = await confirm({
      title: "Forcer la mise à jour",
      message: translate('pwa.confirmForceUpdate', "Voulez-vous vraiment vider le cache et forcer la mise à jour ?"),
      confirmText: "Oui, forcer la mise à jour",
      cancelText: "Annuler",
      variant: "warning"
    });
    if (ok) {
      forceUpdateAndClearCache();
    }
  };

  const handleNormalizeGroupIds = async () => {
    const confirmation = await confirm({
      title: "Normaliser les GroupIds",
      message: "Voulez-vous vraiment normaliser les groupIds en forçant la casse officielle ? (ex: 'samambaia' deviendra 'Samambaia').",
      confirmText: "Oui, normaliser",
      cancelText: "Annuler",
      variant: "warning"
    });
    if (!confirmation) return;

    setSavingId('normalizing_groups');
    try {
      let updatedCount = 0;
      const usersRef = collection(db, 'users');
      // On récupère tous les utilisateurs depuis Firestore directement pour être sûr
      const querySnapshot = await import('firebase/firestore').then(module => module.getDocs(usersRef));
      
      const batch = await import('firebase/firestore').then(module => module.writeBatch(db));
      let currentBatchSize = 0;

      querySnapshot.forEach((docSnap) => {
        const uData = docSnap.data();
        if (uData.groupId && typeof uData.groupId === 'string' && uData.groupId.toLowerCase() === 'samambaia' && uData.groupId !== 'Samambaia') {
          const uRef = doc(db, 'users', docSnap.id);
          batch.update(uRef, { groupId: 'Samambaia' });
          updatedCount++;
          currentBatchSize++;
        }
      });

      if (currentBatchSize > 0) {
        await batch.commit();
        alert(`${updatedCount} membres mis à jour (groupId normalisé à 'Samambaia').`);
      } else {
        alert("Aucun membre n'a de groupId nécessitant une normalisation.");
      }
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de la normalisation :", error);
      telemetryService.logError(error, 'SystemAdminPanel_NormalizeGroups', profileData?.groupId);
      alert("Une erreur est survenue lors de la normalisation.");
    } finally {
      setSavingId(null);
    }
  };

  const handleNormalizeAlfaias = async () => {
    const confirmation = await confirm({
      title: "Normaliser les pupitres Alfaia",
      message: "Voulez-vous vraiment normaliser les instruments Alfaia (Marcante, Meião, Repique) vers 'Alfaia' unique et initialiser les compétences pour tous les membres ?",
      confirmText: "Oui, normaliser",
      cancelText: "Annuler",
      variant: "warning"
    });
    if (!confirmation) return;

    setSavingId('normalizing_alfaias');
    try {
      let updatedCount = 0;
      const usersRef = collection(db, 'users');
      const querySnapshot = await import('firebase/firestore').then(module => module.getDocs(usersRef));
      
      const batch = await import('firebase/firestore').then(module => module.writeBatch(db));
      let currentBatchSize = 0;
      const arrayUnion = await import('firebase/firestore').then(module => module.arrayUnion);

      querySnapshot.forEach((docSnap) => {
        const uData = docSnap.data();
        let needsUpdate = false;
        const updatePayload = {};

        const checkAndNormalize = (fieldValue) => {
          if (typeof fieldValue === 'string' && fieldValue.toLowerCase().startsWith('alfaia ')) {
            return fieldValue.toLowerCase();
          }
          return null;
        };

        const instLower = checkAndNormalize(uData.instrument) || checkAndNormalize(uData.instrumentPrincipal);

        if (instLower) {
          needsUpdate = true;
          
          if (typeof uData.instrument === 'string' && uData.instrument.toLowerCase().startsWith('alfaia ')) {
            updatePayload.instrument = "Alfaia";
          }
          if (typeof uData.instrumentPrincipal === 'string' && uData.instrumentPrincipal.toLowerCase().startsWith('alfaia ')) {
            updatePayload.instrumentPrincipal = "Alfaia";
          }

          let competence = 'marcante';
          if (instLower.includes('meia') || instLower.includes('meiao') || instLower.includes('meião')) {
            competence = 'meião';
          } else if (instLower.includes('repique')) {
            competence = 'repique';
          }

          if (!uData.competencesAlfaia || !Array.isArray(uData.competencesAlfaia) || uData.competencesAlfaia.length === 0) {
            updatePayload.competencesAlfaia = [competence];
          } else {
            updatePayload.competencesAlfaia = arrayUnion(competence);
          }
        }

        if (needsUpdate) {
          const uRef = doc(db, 'users', docSnap.id);
          batch.update(uRef, updatePayload);
          updatedCount++;
          currentBatchSize++;
        }
      });

      if (currentBatchSize > 0) {
        await batch.commit();
        alert(`${updatedCount} fiches membres mises à jour (Pupitre Alfaia normalisé).`);
      } else {
        alert("Aucun membre n'a de pupitre Alfaia nécessitant une normalisation.");
      }
    } catch (error) {
      console.error("SystemAdminPanel - Erreur lors de la normalisation Alfaias :", error);
      telemetryService.logError(error, 'SystemAdminPanel_NormalizeAlfaias', profileData?.groupId);
      alert("Une erreur est survenue lors de la normalisation.");
    } finally {
      setSavingId(null);
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
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
                <span>{translate('pwa.maintenanceTitle', 'Maintenance & Cache')}</span>
                <Tooltip text="Recharge l'application et force le vidage des caches navigateurs pour appliquer les dernières mises à jour pour tous les utilisateurs." />
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

          {profileData?.isSystemAdmin && (
            <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3 text-left">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5 border-b border-dashed border-cordel-master-dark/15 pb-2">
                <span>Base de Données & Maintenance</span>
              </h4>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-cordel-master-dark">Normalisation GroupIds</span>
                  <p className="text-[10px] opacity-75 font-semibold leading-relaxed">
                    Normaliser la casse des identifiants de groupe dans Firestore (ex: "samambaia" vers "Samambaia").
                  </p>
                </div>
                <CordelButton 
                  type="button" 
                  variant="default" 
                  onClick={handleNormalizeGroupIds}
                  useExtremeBorder={true}
                  disabled={savingId === 'normalizing_groups'}
                  className="py-1.5 px-3 text-[10px] font-black uppercase tracking-wider shrink-0"
                >
                  {savingId === 'normalizing_groups' ? '⏳...' : '🪄 Normaliser'}
                </CordelButton>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1 border-t border-dashed border-cordel-master-dark/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-cordel-master-dark">Normalisation Pupitre Alfaia</span>
                  <p className="text-[10px] opacity-75 font-semibold leading-relaxed">
                    Convertit les anciens instruments ("Alfaia Marcante", etc.) en "Alfaia" et initialise la compétence associée pour chaque membre.
                  </p>
                </div>
                <CordelButton 
                  type="button" 
                  variant="default" 
                  onClick={handleNormalizeAlfaias}
                  useExtremeBorder={true}
                  disabled={savingId === 'normalizing_alfaias'}
                  className="py-1.5 px-3 text-[10px] font-black uppercase tracking-wider shrink-0"
                >
                  {savingId === 'normalizing_alfaias' ? '⏳...' : '🥁 Normaliser'}
                </CordelButton>
              </div>
            </CordelCard>
          )}

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

          {(() => {
            const baseUsage = {
              sequenciador: usersList.filter(u => u.canWriteSequenciador).length,
              dansador: usersList.filter(u => u.canWriteDansador).length,
              orchestrador: usersList.filter(u => u.canWriteOrchestrador).length,
            };

            const appRightsUsage = { ...baseUsage };
            Object.keys(draftAppRights).forEach(uid => {
              const rights = draftAppRights[uid];
              const user = usersList.find(u => u.id === uid);
              if (user) {
                if (rights.sequenciador !== undefined) {
                  if (rights.sequenciador && !user.canWriteSequenciador) appRightsUsage.sequenciador++;
                  if (!rights.sequenciador && user.canWriteSequenciador) appRightsUsage.sequenciador--;
                }
                if (rights.dansador !== undefined) {
                  if (rights.dansador && !user.canWriteDansador) appRightsUsage.dansador++;
                  if (!rights.dansador && user.canWriteDansador) appRightsUsage.dansador--;
                }
                if (rights.orchestrador !== undefined) {
                  if (rights.orchestrador && !user.canWriteOrchestrador) appRightsUsage.orchestrador++;
                  if (!rights.orchestrador && user.canWriteOrchestrador) appRightsUsage.orchestrador--;
                }
              }
            });

            return (
              <SystemUserList
                usersList={usersList}
                draftRoles={draftRoles}
                draftTags={draftTags}
                draftFields={draftFields}
                draftLevels={draftLevels}
                draftDanceLevels={draftDanceLevels}
                draftAppRights={draftAppRights}
                quotas={quotas}
                appRightsUsage={appRightsUsage}
                savingId={savingId}
                availableTags={availableTags}
                fieldsConfig={fieldsConfig}
                associationName={associationName}
                handleRoleChange={handleRoleChange}
                handleTagToggle={handleTagToggle}
                handleLevelChange={handleLevelChange}
                handleDanceLevelChange={handleDanceLevelChange}
                handleAppRightToggle={handleAppRightToggle}
                handleFieldChange={handleFieldChange}
                handleSavePermissions={handleSavePermissions}
                handleValidateNewMember={handleValidateNewMember}
                handleSaveFullModalProfile={handleSaveFullModalProfile}
                handleToggleArchive={handleToggleArchive}
                handleDeleteUser={handleDeleteUser}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
