import React, { useState, useCallback } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import XiloAvatar from './XiloAvatar';
import { resolveCategory } from '../utils/categoryUtils';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import ProfileEditForm from './profile/ProfileEditForm';
import ProfilePublicCard from './profile/ProfilePublicCard';
import ProfileContactAndStageAccordions from './profile/ProfileContactAndStageAccordions';
import ProfileDietAndVehicleAccordions from './profile/ProfileDietAndVehicleAccordions';
import ImageLightboxModal from './ImageLightboxModal';
import FamilyMembersManager from './profile/FamilyMembersManager';
import NotificationDiagnostic from './profile/NotificationDiagnostic';
import MemberExpenseSection from './expenses/MemberExpenseSection';
import QRScannerModal from './auth/QRScannerModal';
const CordelImageEditor = React.lazy(() => import('./CordelImageEditor'));

import { formatTagGender, filterUserAssignedTags } from '../utils/tagUtils';
import { getInstrumentIconPath } from '../utils/instrumentUtils';
import { useViewSimulator } from '../context/ViewSimulatorContext';

const ACCORDION_STORAGE_KEY = 'organizador_profile_accordions_v1';

export default function UserProfile({ user, profileData, associationName, enabledModules = {} }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // État de pliage des accordéons avec persistance localStorage (repliés par défaut sur mobile < 768px)
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem(ACCORDION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorer erreurs localStorage
    }
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    return {
      contact: isDesktop,
      stage: isDesktop,
      diet: isDesktop,
      vehicle: isDesktop
    };
  });

  const toggleSection = useCallback((key) => {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorer erreurs localStorage
      }
      return next;
    });
  }, []);

  const isCostumerieEnabled =
    enabledModules?.costumerie !== false &&
    (enabledModules?.costumerie !== undefined || enabledModules?.vestiaire !== false);

  const { isSimulating, effectiveProfile } = useViewSimulator();
  const currentProfile = isSimulating && effectiveProfile ? effectiveProfile : profileData;

  const {
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saving,
    uploadingPhoto,
    universe,
    instrumentsDisponibles,
    linkedInstruments,
    tagsDisponibles,
    demanderDroitImage,
    demanderAttestationSante,
    selectedImage,
    setSelectedImage,
    showEditor,
    setShowEditor,
    notificationPermission,
    isSubscribingPush,
    handleEnableNotifications,
    handleStartEdit,
    isFieldVisible,
    isFieldRequired,
    getMissingRequiredFields,
    validationError,
    isInstrumentsValid,
    handlePhotoSelected,
    handleEditorComplete,
    handleChange,
    handleSave,
    handleDisconnect
  } = useUserProfile(user, currentProfile, t);

  const fullName = `${currentProfile?.prenom || ''} ${currentProfile?.nom || ''}`.trim();
  const roleLabel = tRole(profileData?.role || 'membre', profileData?.genre);
  const hasCustomPhoto = Boolean(profileData?.photoURL || user?.photoURL);

  // Déduplication stricte des badges de rôle pour ne jamais afficher « MESTRE » plusieurs fois
  const deduplicatedTags = React.useMemo(() => {
    const rawTags = filterUserAssignedTags(currentProfile?.tags, tagsDisponibles) || [];
    const seen = new Set([
      String(roleLabel || '').trim().toLowerCase(),
      String(profileData?.role || '').trim().toLowerCase()
    ]);
    const result = [];
    rawTags.forEach((tag) => {
      const formatted = formatTagGender(
        tag,
        profileData?.genre,
        profileData?.majoriteFeminine,
        tagsDisponibles
      );
      const norm = String(formatted || '').trim().toLowerCase();
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        result.push({ raw: tag, formatted });
      }
    });
    return result;
  }, [currentProfile?.tags, tagsDisponibles, roleLabel, profileData?.role, profileData?.genre, profileData?.majoriteFeminine]);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const translateDiet = (diet) => {
    if (!diet) return '';
    const d = String(diet).toLowerCase().trim();
    if (d.includes('végétar') || d.includes('vegetar')) return t('userProfile.dietVegetarian');
    if (d.includes('végan') || d.includes('vegan') || d.includes('végétal')) return t('userProfile.dietVegan');
    if (d.includes('omnivore') || d.includes('onívoro')) return t('userProfile.dietOmnivore');
    if (d.includes('porc') || d.includes('suína') || d.includes('suino')) return t('userProfile.dietNoPork');
    if (d.includes('gluten') || d.includes('glúten')) return t('userProfile.dietGlutenFree');
    return diet;
  };

  const FIELD_LABELS = {
    telephone: 'Téléphone',
    surnom: 'Surnom',
    adresse: 'Adresse',
    tailleTshirt: 'Taille T-shirt',
    taillePantalon: 'Taille Pantalon',
    lateralite: 'Latéralité',
    dateNaissance: 'Date de naissance',
    droitImage: "Droit à l'image",
    aptitudeMedicale: 'Aptitude médicale'
  };

  const missingKeys = getMissingRequiredFields ? getMissingRequiredFields() : [];
  const missingLabels = missingKeys.map((k) => FIELD_LABELS[k] || k);
  const currentNiveau = profileData?.niveauMusique || profileData?.niveau;

  return (
    <div className="flex flex-col gap-3.5 text-left max-w-3xl mx-auto w-full">
      {/* Bannière d'alerte en cas de champs obligatoires manquants */}
      {missingKeys.length > 0 && (
        <div className="bg-amber-100 dark:bg-amber-950/40 border-2 border-dashed border-amber-600 text-amber-900 dark:text-amber-200 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-left shadow-sm animate-fade-in select-none">
          <div className="flex flex-col">
            <span className="font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 text-[10px]">
              ⚠️ {t('userProfile.incompleteAlert')}
            </span>
            <span className="font-bold mt-0.5">
              {t('userProfile.pleaseComplete')} {missingLabels.join(', ')}.
            </span>
          </div>
          {!isEditing && (
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleStartEdit}
              className="text-[10px] py-1.5 px-3 uppercase font-black shrink-0"
            >
              ✏️ {t('userProfile.fillNow')}
            </CordelButton>
          )}
        </div>
      )}

      {/* Carte 1 : En-tête du Profil (Avatar, Nom, Surnom, Rôle unique, Photo et bouton Modifier) */}
      <CordelCard variant="default" useExtremeBorder={true} className="flex flex-col items-center gap-2.5 pt-5 pb-4 px-4 select-none w-full relative">
        <div
          className="relative inline-block cursor-pointer group hover:scale-105 transition-transform"
          onClick={() => hasCustomPhoto && setLightboxOpen(true)}
          title={t('userProfile.photoEnlargeTitle')}
        >
          <XiloAvatar src={profileData?.photoURL || user?.photoURL} name={fullName} size={100} />
          {/* Sceaux de niveau uniquement (pas de doublon du rôle sur l'avatar) */}
          <div className="absolute bottom-0 -right-2 z-10 flex flex-col gap-1 items-end pointer-events-none select-none max-w-[130px]">
            {currentNiveau && currentNiveau !== 'aucun' && (
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7.5px] font-black uppercase tracking-wider -rotate-[4deg] shadow-xs">
                🎵 {resolveCategory(currentNiveau)}
              </span>
            )}
            {profileData?.niveauDanse && profileData.niveauDanse !== 'aucun' && (
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7.5px] font-black uppercase tracking-wider rotate-[2deg] shadow-xs">
                💃 {resolveCategory(profileData.niveauDanse)}
              </span>
            )}
          </div>
        </div>

        {/* Nom complet, surnom intégré et rôle unique */}
        <div className="flex flex-col items-center gap-0.5 w-full text-center mt-1">
          <h2 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-wider text-encre-noire leading-tight">
            {fullName}
          </h2>
          {isFieldVisible('surnom') && formData.surnom && (
            <span className="text-xs font-extrabold italic text-cordel-master-dark/80">
              « {formData.surnom} »
            </span>
          )}
          <span className="text-[11px] font-black uppercase tracking-widest text-cordel-wood mt-0.5">
            {roleLabel}
          </span>
        </div>

        {/* Badges de fonctions (dédupliqués) et d'instruments */}
        {(deduplicatedTags.length > 0 || (profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0) || profileData?.instrument) && (
          <div className="flex flex-wrap gap-2 justify-center items-center w-full px-2 max-w-2xl border-b border-dashed border-cordel-master-dark/10 pb-3">
            {deduplicatedTags.map(({ raw, formatted }, idx) => {
              const tagStr = typeof raw === 'string' ? raw : raw.id || idx;
              const rotation = ((String(tagStr).charCodeAt(0) + idx) % 5) - 2;
              return (
                <span
                  key={`tag-${tagStr}`}
                  className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 bg-white/40"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  👤 {formatted}
                </span>
              );
            })}

            {((profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0) || profileData?.instrument) &&
              (profileData.instrumentsJoues && profileData.instrumentsJoues.length > 0
                ? profileData.instrumentsJoues
                : [profileData.instrument].filter(Boolean)
              ).map((inst, idx) => {
                const rotation = ((inst.charCodeAt(0) + idx) % 5) - 2;
                return (
                  <span
                    key={`inst-${inst}`}
                    className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2 py-0.5 bg-cordel-bg-light/80 border-dashed inline-flex items-center gap-1"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <img src={getInstrumentIconPath(inst)} alt={inst} className="w-3.5 h-3.5 object-contain dark:invert" />
                    <span>{inst}</span>
                  </span>
                );
              })}
          </div>
        )}

        {/* Boutons photo, email et bouton principal Modifier mon profil */}
        <div className="flex flex-col items-center gap-2 w-full max-w-md">
          {!hasCustomPhoto && (
            <div className="bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/25 p-2 rounded-[6px] text-center w-full shadow-sm">
              <p className="text-[10px] text-cordel-master-dark font-semibold leading-relaxed">
                💡 <span className="font-extrabold text-cordel-wood">{t('userProfile.photoTipTitle')}</span> {t('userProfile.photoTipDesc')}
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <label className="relative overflow-hidden text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 select-none">
              📸 {uploadingPhoto ? '⏳ ' + t('userProfile.uploading') : t('userProfile.changePhoto')}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingPhoto || saving}
                onChange={handlePhotoSelected}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            <label className="relative overflow-hidden text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 select-none">
              📷 {t('userProfile.takePhoto')}
              <input
                type="file"
                accept="image/*"
                capture="user"
                disabled={uploadingPhoto || saving}
                onChange={handlePhotoSelected}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
          </div>

          <span className="text-[9px] font-bold tracking-widest text-cordel-master-dark opacity-60 break-all px-4 text-center">
            {user?.email}
          </span>

          {!isEditing && (
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleStartEdit}
              className="w-full mt-1 py-2.5 font-black uppercase tracking-wider text-xs shadow-[2.5px_2.5px_0px_0px_#181716]"
            >
              ✏️ {translate('userProfile.editBtn', 'Modifier mon profil')}
            </CordelButton>
          )}
        </div>
      </CordelCard>

      {/* Détails du profil en lecture (Carte publique + Accordéons) ou Formulaire d'édition */}
      {!isEditing ? (
        <div className="flex flex-col gap-3">
          <ProfilePublicCard profileData={profileData} t={t} translate={translate} />
          <ProfileContactAndStageAccordions
            profileData={profileData}
            formData={formData}
            associationName={associationName}
            locale={locale}
            t={t}
            isFieldVisible={isFieldVisible}
            isCostumerieEnabled={isCostumerieEnabled}
            demanderDroitImage={demanderDroitImage}
            demanderAttestationSante={demanderAttestationSante}
            openSections={openSections}
            toggleSection={toggleSection}
          />
          <ProfileDietAndVehicleAccordions
            profileData={profileData}
            formData={formData}
            universe={universe}
            t={t}
            translateDiet={translateDiet}
            openSections={openSections}
            toggleSection={toggleSection}
          />
        </div>
      ) : (
        <ProfileEditForm
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSave={handleSave}
          setIsEditing={setIsEditing}
          saving={saving}
          isCostumerieEnabled={isCostumerieEnabled}
          isFieldVisible={isFieldVisible}
          isFieldRequired={isFieldRequired}
          validationError={validationError}
          isInstrumentsValid={isInstrumentsValid}
          demanderDroitImage={demanderDroitImage}
          demanderAttestationSante={demanderAttestationSante}
          instrumentsDisponibles={instrumentsDisponibles}
          linkedInstruments={linkedInstruments}
          universeId={universe}
          t={t}
        />
      )}

      {/* 3 blocs utilitaires du bas (repliés par défaut) */}
      <MemberExpenseSection
        groupId={profileData?.groupId}
        currentUser={user}
        profileData={profileData}
      />

      <NotificationDiagnostic
        notificationPermission={notificationPermission}
        isSubscribingPush={isSubscribingPush}
        onEnableNotifications={handleEnableNotifications}
      />

      <FamilyMembersManager
        user={user}
        profileData={profileData}
        instrumentsDisponibles={instrumentsDisponibles}
        t={t}
      />

      {/* Boutons Connexion PC & Déconnexion */}
      <div className="mt-2 pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col sm:flex-row gap-3 items-center">
        <CordelButton
          type="button"
          variant="ocre"
          onClick={() => setShowQrScanner(true)}
          useExtremeBorder={true}
          className="w-full sm:flex-1 py-3 border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 font-black transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 select-none"
        >
          📸 {t('userProfile.btnConnectPc')}
        </CordelButton>

        <CordelButton
          type="button"
          variant="default"
          onClick={handleDisconnect}
          useExtremeBorder={true}
          className="w-full sm:flex-1 py-3 !bg-cordel-wood !text-cordel-bg-light border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 select-none"
        >
          🚪 {t('userProfile.btnSignOut')}
        </CordelButton>
      </div>

      <QRScannerModal isOpen={showQrScanner} onClose={() => setShowQrScanner(false)} />

      {showEditor && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full max-h-[95vh] overflow-y-auto">
            <React.Suspense
              fallback={
                <CordelCard variant="default" useExtremeBorder={true} className="p-8 flex flex-col items-center justify-center bg-cordel-bg">
                  <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
                  <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                    Chargement de l'éditeur...
                  </span>
                </CordelCard>
              }
            >
              <CordelImageEditor
                imageSrc={selectedImage}
                lang={locale}
                onComplete={handleEditorComplete}
                onCancel={() => {
                  setShowEditor(false);
                  setSelectedImage(null);
                }}
              />
            </React.Suspense>
          </div>
        </div>
      )}

      <ImageLightboxModal
        isOpen={lightboxOpen}
        photoURL={profileData?.photoURL || user?.photoURL}
        name={fullName}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
