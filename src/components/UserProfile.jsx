import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import XiloAvatar from './XiloAvatar';
import { resolveCategory } from '../utils/categoryUtils';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { 
  XiloEye, 
  XiloEyeOff, 
  XiloLock, 
  XiloShield, 
  XiloTrombinoscope, 
  XiloPhone, 
  XiloHome, 
  XiloBirthday, 
  XiloPin, 
  XiloShirt, 
  XiloHand, 
  XiloSparkles, 
  XiloDocument, 
  XiloUser 
} from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import ProfileEditForm from './profile/ProfileEditForm';
import CostumeChecklist from './profile/CostumeChecklist';
import ImageLightboxModal from './ImageLightboxModal';
import FamilyMembersManager from './profile/FamilyMembersManager';
import NotificationDiagnostic from './profile/NotificationDiagnostic';
import QRScannerModal from './auth/QRScannerModal';
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

import { generateImageCharterPDF, generateMedicalAttestationPDF } from '../utils/pdfGenerator';

export default function UserProfile({ user, profileData, associationName, onBack, onNavigateToTuto }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  const {
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saving,
    uploadingPhoto,
    myInstruments,
    loadingInst,
    instrumentsDisponibles,
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
    isInstrumentsValid,
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
  
  const currentNiveau = profileData?.niveauMusique || profileData?.niveau;

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
              {currentNiveau && currentNiveau !== 'aucun' ? '🎵 ' + resolveCategory(currentNiveau) : '🎵 ' + translate('common.none', 'Aucun')}
            </span>
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px] rotate-3">
              {profileData?.niveauDanse && profileData?.niveauDanse !== 'aucun' ? '💃 ' + resolveCategory(profileData.niveauDanse) : '💃 ' + translate('common.none', 'Aucun')}
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
        <div className="flex flex-col items-center gap-2 mt-1 w-full max-w-md">
          <div className="bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/25 p-2.5 rounded-[6px] text-center w-full shadow-sm">
            <p className="text-[10px] text-cordel-master-dark font-semibold leading-relaxed">
              💡 <span className="font-extrabold text-cordel-wood">Photo de profil :</span> Choisissez une photo où votre visage est bien visible afin d'aider les autres membres du groupe à vous reconnaître facilement dans le Trombinoscope !
            </p>
          </div>

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

      {/* Profile Details in 3 Reassuring Cards */}
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          {/* CARTE 1 : PROFIL PUBLIC */}
          <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
            <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-500/40 p-3 rounded-[6px] text-left">
              <div className="flex items-center gap-2.5">
                <XiloEye size={22} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-black text-xs uppercase text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    1. Mon Profil Public (Trombinoscope)
                  </h4>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-200 opacity-90 font-medium">
                    Ces informations apparaissent publiquement sur votre fiche dans le Trombinoscope de l'association.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs text-encre-noire font-semibold text-left">
              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {t('userProfile.firstName')} / {t('userProfile.lastName')}
                </span>
                <span className="font-extrabold text-sm flex items-center gap-1">
                  <XiloUser size={14} className="text-cordel-wood" /> {fullName}
                </span>
              </div>

              {isFieldVisible('surnom') && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                    {t('userProfile.surnom')}
                  </span>
                  <span className="font-bold text-cordel-wood">{formData.surnom ? `"${formData.surnom}"` : <span className="italic opacity-50 font-normal">Aucun</span>}</span>
                </div>
              )}

              <div>
                <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                  {translate('onboarding.instrument', "Instrument Principal")}
                </span>
                <span className="font-extrabold text-cordel-wood">{profileData?.instrument || <span className="italic">En attente de validation</span>}</span>
              </div>

              {profileData?.instrumentSecondaire && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                    Instrument Secondaire
                  </span>
                  <span className="font-bold">{profileData.instrumentSecondaire}</span>
                </div>
              )}

              {(profileData?.voeuPrincipal || profileData?.voeuSecondaire || profileData?.voeuTertiaire) && (
                <div className="col-span-1 md:col-span-2 bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 p-2.5 rounded mt-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1 mb-1">
                    <XiloSparkles size={12} /> Vœux d'Orientation Musicale (Transmis au Mestre) :
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {profileData?.voeuPrincipal && (
                      <span className="bg-white/70 dark:bg-black/20 px-2 py-1 rounded border border-cordel-master-dark/15">
                        <strong className="text-cordel-wood">Vœu 1 :</strong> {profileData.voeuPrincipal}
                      </span>
                    )}
                    {profileData?.voeuSecondaire && (
                      <span className="bg-white/70 dark:bg-black/20 px-2 py-1 rounded border border-cordel-master-dark/15">
                        <strong className="text-cordel-wood">Vœu 2 :</strong> {profileData.voeuSecondaire}
                      </span>
                    )}
                    {profileData?.voeuTertiaire && (
                      <span className="bg-white/70 dark:bg-black/20 px-2 py-1 rounded border border-cordel-master-dark/15">
                        <strong className="text-cordel-wood">Vœu 3 :</strong> {profileData.voeuTertiaire}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CordelCard>

          {/* CARTE 2 : COORDONNÉES & CONFIDENTIALITÉ */}
          <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
            <div className="bg-amber-50/90 dark:bg-amber-950/30 border-2 border-dashed border-amber-500/40 p-3 rounded-[6px] text-left">
              <div className="flex items-center gap-2.5">
                <XiloLock size={22} className="text-amber-700 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-black text-xs uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    2. Coordonnées & Visibilité Annuaire
                  </h4>
                  <p className="text-[10px] text-amber-800 dark:text-amber-200 opacity-90 font-medium">
                    Contrôle des informations partagées dans le trombinoscope des membres.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs text-encre-noire font-semibold text-left">
              {isFieldVisible('telephone') && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1">
                    <XiloPhone size={12} /> {t('userProfile.phone')}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="font-extrabold">{formData.telephone || <span className="italic opacity-50">Non renseigné</span>}</span>
                    {formData.telephone && (
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                        (formData.afficherTelephone !== false && formData.publierTelephone !== false)
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}>
                        {(formData.afficherTelephone !== false && formData.publierTelephone !== false) 
                          ? <><XiloEye size={10} /> Numéro visible</> 
                          : <><XiloEyeOff size={10} /> Masqué aux membres</>
                        }
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isFieldVisible('dateNaissance') && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1">
                    <XiloBirthday size={12} /> {t('userProfile.birthdate')}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span>
                      {formData.dateNaissance 
                        ? (formData.afficherDateNaissance 
                            ? new Date(formData.dateNaissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                            : new Date(formData.dateNaissance).toLocaleDateString('fr-FR')) 
                        : <span className="italic opacity-50">Non renseigné</span>
                      }
                    </span>
                    {formData.dateNaissance && (
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                        formData.afficherDateNaissance
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}>
                        {formData.afficherDateNaissance 
                          ? <><XiloBirthday size={10} /> Anniversaire visible (Jour/Mois)</> 
                          : <><XiloEyeOff size={10} /> Masqué aux membres</>
                        }
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isFieldVisible('adresse') && (
                <div className="col-span-1 md:col-span-2 bg-cordel-bg-light/60 p-2.5 rounded border border-dashed border-cordel-master-dark/20">
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1">
                    <XiloHome size={12} /> {t('userProfile.adresse')} (Admin & Logistique)
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-0.5">
                    <span className="font-bold">
                      {formData.adresse || (profileData?.adresseRue ? `${profileData.adresseRue}, ${profileData.adresseCP || ''} ${profileData.adresseVille || ''}` : <span className="italic opacity-50">Non renseignée</span>)}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${
                      formData.afficherVille
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : 'bg-amber-100 text-amber-900 border-amber-400'
                    }`}>
                      {formData.afficherVille 
                        ? <><XiloPin size={10} /> Ville visible ({profileData?.adresseVille || formData.adresseVille || 'Ville'})</> 
                        : <><XiloEyeOff size={10} /> Adresse masquée aux membres</>
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CordelCard>

          {/* CARTE 3 : LOGISTIQUE, PLACEMENT SCÉNIQUE & SANTÉ */}
          <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
            <div className="bg-sky-50/90 dark:bg-sky-950/30 border-2 border-dashed border-sky-500/40 p-3 rounded-[6px] text-left">
              <div className="flex items-center gap-2.5">
                <XiloShield size={22} className="text-sky-700 dark:text-sky-400 shrink-0" />
                <div>
                  <h4 className="font-black text-xs uppercase text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                    3. Placement Scénique, Costumes & Santé (Confidentiel Mestre / Admin)
                  </h4>
                  <p className="text-[10px] text-sky-800 dark:text-sky-200 opacity-90 font-medium">
                    Réservé au Mestre (placement sur scène dans le Séquenceur) et aux administrateurs. <strong>Ne sera jamais affiché dans le trombinoscope.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-xs text-encre-noire font-semibold text-left">
              {isFieldVisible('lateralite') && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 flex items-center gap-1">
                    <XiloHand size={12} /> {t('userProfile.lateralite')} (Séquenceur Mestre)
                  </span>
                  <span className="capitalize font-extrabold text-cordel-wood">{formData.lateralite === 'droitier' ? t('onboarding.handRight') : t('onboarding.handLeft')}</span>
                </div>
              )}

              {(isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
                <div className="col-span-1 md:col-span-2 border-t border-dashed border-cordel-master-dark/15 pt-2 mt-1">
                  <span className="text-[10px] uppercase font-black text-cordel-wood flex items-center gap-1 mb-1">
                    <XiloShirt size={12} /> Mensurations / Taille des Costumes
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {isFieldVisible('tailleTshirt') && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                          T-shirt
                        </span>
                        <span className="font-extrabold text-sm">{formData.tailleTshirt}</span>
                      </div>
                    )}
                    {isFieldVisible('taillePantalon') && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                          Pantalon / Bas
                        </span>
                        <span className="font-extrabold text-sm">{formData.taillePantalon}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {demanderDroitImage && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                    {t('userProfile.imageRights')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formData.droitImage ? "✅ Accordé" : "❌ Refusé"}</span>
                    {formData.droitImage && (
                      <button 
                        type="button" 
                        onClick={() => generateImageCharterPDF(profileData, associationName)}
                        className="text-[9px] font-bold text-cordel-wood hover:underline ml-1 flex items-center gap-1"
                      >
                        <XiloDocument size={12} /> Télécharger PDF
                      </button>
                    )}
                  </div>
                </div>
              )}

              {demanderAttestationSante && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
                    {t('userProfile.medicalCert')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formData.aptitudeMedicale ? "✅ Attesté sur l'honneur" : "❌ Non attesté"}</span>
                    {formData.aptitudeMedicale && (
                      <button 
                        type="button" 
                        onClick={() => generateMedicalAttestationPDF(profileData, associationName)}
                        className="text-[9px] font-bold text-cordel-wood hover:underline ml-1 flex items-center gap-1"
                      >
                        <XiloDocument size={12} /> Télécharger PDF
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Préférences Alimentaires & Allergies */}
              <div className="col-span-1 md:col-span-2 border-t border-dashed border-cordel-master-dark/15 pt-2 mt-1">
                <span className="text-[10px] uppercase font-black text-cordel-wood flex items-center gap-1 mb-1">
                  🍽️ Préférences Alimentaires & Allergies (Confidentiel Admin)
                </span>
                <div className="flex flex-col gap-1 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 inline-block mr-1">Régime :</span>
                    {formData.dietaryRestrictions && formData.dietaryRestrictions.length > 0 ? (
                      <span className="font-extrabold text-cordel-wood bg-cordel-bg-light px-2 py-0.5 rounded border border-dashed border-cordel-master-dark/20">
                        {formData.dietaryRestrictions.join(', ')}
                      </span>
                    ) : (
                      <span className="italic opacity-50">Aucun régime spécifique</span>
                    )}
                  </div>
                  <div className="mt-0.5">
                    <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 inline-block mr-1">Allergies / Précisions :</span>
                    {formData.allergies && formData.allergies.trim() ? (
                      <span className="font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                        ⚠️ {formData.allergies.trim()}
                      </span>
                    ) : (
                      <span className="italic opacity-50">Aucune allergie signalée</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CordelCard>

          {/* Edit Button */}
          <CordelButton 
            type="button" 
            variant="ocre" 
            useExtremeBorder={true}
            onClick={handleStartEdit}
            className="w-full py-3.5 font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_0px_#181716]"
          >
            ✏️ {translate('userProfile.editBtn', "Modifier mon profil")}
          </CordelButton>
        </div>
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
          isInstrumentsValid={isInstrumentsValid}
          demanderDroitImage={demanderDroitImage}
          demanderAttestationSante={demanderAttestationSante}
          instrumentsDisponibles={instrumentsDisponibles}
          t={t}
        />
      )}

      {/* Notification Diagnostic Section */}
      <NotificationDiagnostic 
        notificationPermission={notificationPermission}
        isSubscribingPush={isSubscribingPush}
        onEnableNotifications={handleEnableNotifications}
      />

      {/* Family / Dependent Members Section */}
      <FamilyMembersManager
        user={user}
        profileData={profileData}
        instrumentsDisponibles={instrumentsDisponibles}
        t={t}
      />

      {/* Disconnect & QR Scanner Buttons */}
      <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col sm:flex-row gap-3 items-center">
        <CordelButton 
          type="button"
          variant="ocre"
          onClick={() => setShowQrScanner(true)}
          useExtremeBorder={true}
          className="w-full sm:flex-1 py-3 border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 font-black transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 select-none"
        >
          📸 Connecter un PC
        </CordelButton>

        <CordelButton 
          type="button"
          variant="default"
          onClick={handleDisconnect}
          useExtremeBorder={true}
          className="w-full sm:flex-1 py-3 !bg-cordel-wood !text-cordel-bg-light border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 font-bold transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 select-none"
        >
          🚪 {t('userProfile.disconnectBtn')}
        </CordelButton>
      </div>

      {/* QR Code Scanner Modal */}
      <QRScannerModal 
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
      />

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
