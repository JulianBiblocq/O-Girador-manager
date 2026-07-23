import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import XiloAvatar from './XiloAvatar';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloCaixa } from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import ProfileEditForm from './profile/ProfileEditForm';
import CostumeChecklist from './profile/CostumeChecklist';
import ImageLightboxModal from './ImageLightboxModal';
const CordelImageEditor = React.lazy(() => import('./CordelImageEditor'));

import { formatTagGender } from '../utils/tagUtils';

const getInstrumentIconPath = (instName) => {
  if (!instName) return '/favicon.svg';
  const name = instName.toLowerCase().trim();
  if (name.includes('alfaia')) return '/icones/alfaia.svg';
  if (name.includes('agbê') || name.includes('agbe') || name.includes('sementes')) return '/icones/agbe.svg';
  if (name.includes('gonguê') || name.includes('gongue')) return '/icones/gongue.svg';
  if (name.includes('caixa') || name.includes('tarol') || name.includes('caisse')) return '/icones/caixa.svg';
  if (name.includes('chant') || name.includes('voix') || name.includes('singer') || name.includes('danse') || name.includes('dance') || name.includes('micro')) return '/icones/micro.svg';
  if (name.includes('timbal')) return '/icones/timbal.svg';
  if (name.includes('mineiro')) return '/icones/mineiro.svg';
  if (name.includes('apito') || name.includes('mestre') || name.includes('chef')) return '/icones/apito.svg';
  return '/favicon.svg';
};

export default function UserProfile({ user, profileData, onBack, onNavigateToTuto }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const {
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saving,
    uploadingPhoto,
    myInstruments,
    loadingInst,
    tagsDisponibles,
    demanderDroitImage,
    demanderAttestationSante,
    selectedImage,
    setSelectedImage,
    showEditor,
    setShowEditor,
    handleStartEdit,
    isFieldVisible,
    isFieldRequired,
    getMissingRequiredFields,
    validationError,
    handlePhotoSelected,
    handleEditorComplete,
    handleChange,
    handleSave,
    handleDisconnect,
    handleForceUpdate
  } = useUserProfile(user, profileData, t);

  const fullName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`;

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
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
  const missingLabels = missingKeys.map(k => FIELD_LABELS[k] || k);

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          {t('userProfile.title')}
        </span>
        <div className="w-12"></div> {/* Spacer for alignment */}
      </div>

      {/* Missing Required Fields Alert Banner */}
      {missingKeys.length > 0 && (
        <div className="bg-amber-100 dark:bg-amber-950/40 border-2 border-dashed border-amber-600 text-amber-900 dark:text-amber-200 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-left shadow-sm animate-fade-in select-none">
          <div className="flex flex-col">
            <span className="font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 text-[10px]">
              ⚠️ Profil incomplet - Informations obligatoires manquantes
            </span>
            <span className="font-bold mt-0.5">
              Veuillez compléter : {missingLabels.join(', ')}.
            </span>
          </div>
          {!isEditing && (
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleStartEdit}
              className="text-[10px] py-1.5 px-3 uppercase font-black shrink-0"
            >
              ✏️ Renseigner maintenant
            </CordelButton>
          )}
        </div>
      )}

      {/* Avatar Container in Center */}
      <div className="flex flex-col items-center gap-3 py-4 select-none w-full">
        <div 
          className="relative cursor-pointer group hover:scale-105 transition-transform" 
          onClick={() => (profileData?.photoURL || user?.photoURL) && setLightboxOpen(true)}
          title="Cliquer pour agrandir la photo"
        >
          <XiloAvatar src={profileData?.photoURL || user?.photoURL} name={fullName} size={110} />
          {/* Decorative stamp on avatar */}
          <div className="absolute -bottom-1 -right-2 z-20 flex flex-col gap-1 items-end select-none">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-12">
              {tRole(profileData?.role || 'membre', profileData?.genre)}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] -rotate-6">
              {profileData?.niveau === 'confirme' ? '🏆 ' + translate('userProfile.levelConfirmSimple', "Confirmé") : profileData?.niveau === 'debutant' ? '🌱 ' + translate('userProfile.levelBeginner', "Débutant") : '🎵 ' + translate('common.none', 'Aucun')}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] rotate-3">
              {profileData?.niveauDanse === 'confirme' ? '💃 ' + translate('userProfile.levelConfirmSimple', "Confirmé") : profileData?.niveauDanse === 'debutant' ? '🌱 ' + translate('userProfile.levelBeginner', "Débutant") : '💃 ' + translate('common.none', 'Aucun')}
            </span>
          </div>
        </div>

        {/* User Name & Main Role */}
        <div className="flex flex-col items-center gap-1 w-full text-center">
          <h2 className="font-cactus font-black text-2xl uppercase tracking-wider text-encre-noire">
            {fullName}
          </h2>
          <span className="text-xs font-black uppercase tracking-widest text-cordel-wood">
            {tRole(profileData?.role || 'membre', profileData?.genre)}
          </span>
        </div>

        {/* Roles & Instruments Badges */}
        <div className="flex flex-wrap gap-2.5 justify-center items-center w-full px-2 max-w-2xl border-b border-dashed border-cordel-master-dark/10 pb-4">
          {profileData?.tags && profileData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {profileData.tags.map((tag, idx) => {
                const formattedTag = formatTagGender(tag, profileData?.genre, profileData?.majoriteFeminine, tagsDisponibles);
                const tagStr = typeof tag === 'string' ? tag : (tag.id || idx);
                const rotation = ((String(tagStr).charCodeAt(0) + idx) % 5) - 2;
                return (
                  <span 
                    key={`tag-${tagStr}`} 
                    className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2.5 py-1 bg-white/40"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    👤 {formattedTag}
                  </span>
                );
              })}
            </div>
          )}

          {((profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0) || profileData?.instrument) && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {(profileData.instrumentsJoues && profileData.instrumentsJoues.length > 0 
                ? profileData.instrumentsJoues 
                : [profileData.instrument].filter(Boolean)
              ).map((inst, idx) => {
                const rotation = ((inst.charCodeAt(0) + idx) % 5) - 2;
                return (
                  <span 
                    key={`inst-${inst}`} 
                    className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2.5 py-1 bg-cordel-bg-light/80 border-dashed"
                    style={{ 
                      transform: `rotate(${rotation}deg)`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <img src={getInstrumentIconPath(inst)} alt={inst} className="w-3.5 h-3.5 object-contain dark:invert" />
                    <span>{inst}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload picture button */}
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <div className="flex flex-wrap justify-center gap-2">
            <label className="relative overflow-hidden text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 select-none">
              📸 {uploadingPhoto ? "⏳ " + t('userProfile.uploading') : t('userProfile.changePhoto')}
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
            {user.email}
          </span>
        </div>
      </div>

      {/* Profile Modification Form */}
      {!isEditing ? (
        <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/10 pb-1 flex items-center justify-between">
            <span>📁 {t('userProfile.personalInfo')}</span>
            {profileData?.adresse && !profileData?.adresseRue && (
              <span className="text-[7.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-300/30 uppercase animate-pulse">
                Format adresse à mettre à jour
              </span>
            )}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs text-encre-noire font-semibold">
            <div>
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                {t('userProfile.firstName')} / {t('userProfile.lastName')}
              </span>
              <span className="font-extrabold text-sm">{fullName}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                {translate('onboarding.genre', "Genre")}
              </span>
              <span className="capitalize">{formData.genre === 'homme' ? t('onboarding.genderMale') : formData.genre === 'femme' ? t('onboarding.genderFemale') : t('onboarding.genderOther')}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                {translate('onboarding.instrument', "Instrument Principal")}
              </span>
              <span className="font-bold">{formData.instrument}</span>
            </div>
            {isFieldVisible('surnom') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.surnom')}
                </span>
                <span>{formData.surnom || <span className="italic opacity-60">Non renseigné</span>}</span>
              </div>
            )}
            {isFieldVisible('telephone') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.phone')}
                </span>
                <span>
                  {formData.telephone ? (
                    <>
                      {formData.telephone}{' '}
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-wider">
                        ({(formData.afficherTelephone !== false && formData.publierTelephone !== false) ? "Public dans le Trombinoscope" : "Masqué dans le Trombinoscope"})
                      </span>
                    </>
                  ) : (
                    <span className="italic opacity-60">Non renseigné</span>
                  )}
                </span>
              </div>
            )}
            {isFieldVisible('adresse') && (
              <div className="md:col-span-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.adresse')}
                </span>
                <span>
                  {profileData?.adresseRue 
                    ? `${profileData.adresseRue}, ${profileData.adresseCP} ${profileData.adresseVille}`
                    : (profileData?.adresse || <span className="italic opacity-60">Non renseignée</span>)
                  }
                  <span className="text-[8px] font-bold opacity-60 uppercase tracking-wider ml-1.5">
                    ({formData.visibiliteAdresse === 'ville' ? "Ville uniquement dans le Trombinoscope" : formData.visibiliteAdresse === 'masquee' ? "Masquée dans le Trombinoscope" : "Complète dans le Trombinoscope"})
                  </span>
                </span>
              </div>
            )}
            {(isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
              <div className="col-span-1 sm:col-span-2 border-t border-dashed border-cordel-master-dark/15 pt-2 mt-1">
                <span className="text-[10px] uppercase font-black text-cordel-wood block mb-2">
                  👔 Mensurations / Costumes
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {isFieldVisible('tailleTshirt') && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                        {t('userProfile.tshirtSize')}
                      </span>
                      <span className="font-bold">{formData.tailleTshirt}</span>
                    </div>
                  )}
                  {isFieldVisible('taillePantalon') && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                        {translate('userProfile.pantSize', "Taille Pantalon")}
                      </span>
                      <span className="font-bold">{formData.taillePantalon}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {isFieldVisible('lateralite') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.lateralite')}
                </span>
                <span className="capitalize">{formData.lateralite === 'droitier' ? t('onboarding.handRight') : t('onboarding.handLeft')}</span>
              </div>
            )}
            {isFieldVisible('dateNaissance') && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.birthdate')}
                </span>
                <span>
                  {formData.dateNaissance ? (
                    <>
                      {new Date(formData.dateNaissance).toLocaleDateString()}{' '}
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-wider">
                        {(formData.afficherDateNaissance || formData.publierDateNaissance) ? "Public dans le Trombinoscope" : "Masqué dans le Trombinoscope"}
                      </span>
                    </>
                  ) : (
                    <span className="italic opacity-60">Non renseigné</span>
                  )}
                </span>
              </div>
            )}
            {demanderDroitImage && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.imageRights')}
                </span>
                <span>{formData.droitImage ? "✅ Accordé" : "❌ Refusé"}</span>
              </div>
            )}
            {demanderAttestationSante && (
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.medicalCert')}
                </span>
                <span>{formData.aptitudeMedicale ? "✅ Attesté" : "❌ Non attesté"}</span>
              </div>
            )}
          </div>

          <CordelButton 
            type="button" 
            variant="ocre" 
            useExtremeBorder={true}
            onClick={handleStartEdit}
            className="w-full mt-2 py-3 font-bold uppercase tracking-wider text-xs"
          >
            ✏️ {translate('userProfile.editBtn', "Modifier mon profil")}
          </CordelButton>
        </CordelCard>
      ) : (
        <ProfileEditForm
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSave={handleSave}
          setIsEditing={setIsEditing}
          saving={saving}
          isFieldVisible={isFieldVisible}
          isFieldRequired={isFieldRequired}
          validationError={validationError}
          demanderAttestationSante={demanderAttestationSante}
          t={t}
        />
      )}

      {/* Disconnect Button */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 items-center">
        <CordelButton 
          type="button"
          variant="default"
          onClick={handleDisconnect}
          useExtremeBorder={true}
          className="w-full py-3 !bg-cordel-wood !text-cordel-bg-light border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 select-none"
        >
          🚪 {t('userProfile.disconnectBtn')}
        </CordelButton>
      </div>

      {/* Editor Modal Overlay */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--cordel-bg)] max-w-md w-full rounded-lg shadow-xl overflow-hidden relative border-4 border-encre-noire max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <React.Suspense fallback={
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
                  <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                    Chargement de l'éditeur...
                  </span>
                </div>
              }>
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
        </div>
      )}
      {/* Lightbox Photo Modal */}
      <ImageLightboxModal 
        isOpen={lightboxOpen}
        photoURL={profileData?.photoURL || user?.photoURL}
        name={fullName}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
