import React from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import XiloAvatar from './XiloAvatar';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloCaixa } from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import ProfileEditForm from './profile/ProfileEditForm';
const CordelImageEditor = React.lazy(() => import('./CordelImageEditor'));

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

export default function UserProfile({ user, profileData, onBack }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();

  const {
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saving,
    uploadingPhoto,
    myInstruments,
    loadingInst,
    demanderDroitImage,
    demanderAttestationSante,
    selectedImage,
    setSelectedImage,
    showEditor,
    setShowEditor,
    handleStartEdit,
    isFieldVisible,
    handlePhotoSelected,
    handleEditorComplete,
    handleChange,
    handleSave,
    handleDisconnect,
    handleForceUpdate
  } = useUserProfile(user, profileData, t);

  const fullName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`;

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

      {/* Avatar Container in Center */}
      <div className="flex flex-col items-center gap-3 py-4 select-none w-full">
        <div className="relative">
          <XiloAvatar src={profileData?.photoURL || user?.photoURL} name={fullName} size={110} />
          {/* Decorative stamp on avatar */}
          <div className="absolute -bottom-1 -right-2 z-20 flex flex-col gap-1 items-end select-none">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-12">
              {tRole(profileData?.role || 'membre', profileData?.genre)}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] -rotate-6">
              {profileData?.niveau === 'confirme' ? '🏆 ' + t('userProfile.levelConfirmSimple') : profileData?.niveau === 'debutant' ? '🌱 ' + t('userProfile.levelBeginner') : '🎵 ' + (t('common.none') || 'Aucun')}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] rotate-3">
              {profileData?.niveauDanse === 'confirme' ? '💃 ' + t('userProfile.levelConfirmSimple') : profileData?.niveauDanse === 'debutant' ? '🌱 ' + t('userProfile.levelBeginner') : '💃 ' + t('common.none')}
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
                const rotation = ((tag.charCodeAt(0) + idx) % 5) - 2;
                return (
                  <span 
                    key={`tag-${tag}`} 
                    className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2.5 py-1 bg-white/40"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    👤 {tag}
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
                    className="theme-stamp-badge theme-stamp-badge-dark text-[9px] px-2.5 py-1 bg-cordel-bg-light/80 border-dashed inline-flex items-center gap-1"
                    style={{ transform: `rotate(${rotation}deg)` }}
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
                {t('onboarding.genre') || "Genre"}
              </span>
              <span className="capitalize">{formData.genre === 'homme' ? t('onboarding.genderMale') : formData.genre === 'femme' ? t('onboarding.genderFemale') : t('onboarding.genderOther')}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                {t('onboarding.instrument') || "Instrument Principal"}
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
                        ({formData.publierTelephone ? "Public" : "Privé"})
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
                        {t('userProfile.pantSize') || "Taille Pantalon"}
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
                        ({formData.publierDateNaissance ? "Public" : "Privé"})
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
            ✏️ {t('userProfile.editBtn') || "Modifier mon profil"}
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
          demanderAttestationSante={demanderAttestationSante}
          t={t}
        />
      )}

      {/* Section Mon Matériel */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 select-none">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <XiloCaixa size={14} /> {t('userProfile.instrumentsHeading')}
        </h4>
        
        {loadingInst ? (
          <div className="flex justify-center items-center py-4">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : (() => {
          const personal = myInstruments.filter(inst => inst.proprietaire === user.uid);
          const borrowed = myInstruments.filter(inst => 
            (inst.status === 'Emprunté' && inst.borrowedBy === user.uid) ||
            (inst.proprietaire === 'Association' && inst.localisationPhysique === user.uid)
          );
          const localAssigned = myInstruments.filter(inst => inst.localisationPhysique === 'Local' && Array.isArray(inst.assignations) && inst.assignations.includes(user.uid));
          
          return (
            <div className="flex flex-col gap-3.5">
              {/* 1. Instruments Personnels */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  {t('userProfile.personalInsts')} ({personal.length})
                </span>
                {personal.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">{t('userProfile.noPersonal')}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {personal.map(inst => (
                      <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                          <span className="text-xs font-bold truncate">{inst.nom}</span>
                        </div>
                        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[6px] rotate-2`}>
                          {inst.etat}
                        </span>
                      </CordelCard>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Matériel Emprunté */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  {t('userProfile.borrowedInsts')} ({borrowed.length})
                </span>
                {borrowed.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">{t('userProfile.noBorrowed')}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {borrowed.map(inst => (
                      <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg-light/40 flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                          <span className="text-xs font-bold truncate">{inst.nom}</span>
                        </div>
                        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-dark'} text-[6px] -rotate-1`}>
                          {inst.etat}
                        </span>
                      </CordelCard>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Instruments assignés au local */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark opacity-75">
                  {t('userProfile.localAssignedInsts')} ({localAssigned.length})
                </span>
                {localAssigned.length === 0 ? (
                  <p className="text-[10px] italic opacity-60">{t('userProfile.noLocal')}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {localAssigned.map(inst => (
                      <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg-light/40 flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                          <span className="text-xs font-bold truncate">{inst.nom}</span>
                        </div>
                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[6px] rotate-3">
                          {inst.etat}
                        </span>
                      </CordelCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Disconnect & PWA Emergency Clean Buttons */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 items-center">
        <CordelButton 
          type="button"
          variant="ocre"
          onClick={handleForceUpdate}
          useExtremeBorder={true}
          className="w-full py-3 border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 select-none"
        >
          ⚡ {t('pwa.forceUpdateBtn')}
        </CordelButton>
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
    </div>
  );
}
