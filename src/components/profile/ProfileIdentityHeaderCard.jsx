import React from 'react';
import XiloAvatar from '../XiloAvatar';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { resolveCategory } from '../../utils/categoryUtils';
import { getInstrumentIconPath } from '../../utils/instrumentUtils';

/**
 * Carte d'identité principale en haut de la page « Mon Profil ».
 * S'étend sur toute la largeur du conteneur (w-full) avec avatar, nom, rôle,
 * badges d'instruments/fonctions, actions photo et bouton « Modifier mon profil ».
 */
export default function ProfileIdentityHeaderCard({
  user,
  profileData,
  formData,
  fullName,
  roleLabel,
  currentNiveau,
  hasCustomPhoto,
  deduplicatedTags = [],
  uploadingPhoto,
  saving,
  isEditing,
  isFieldVisible,
  handlePhotoSelected,
  handleStartEdit,
  onOpenLightbox,
  t,
  translate
}) {
  const instrumentsList =
    profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0
      ? profileData.instrumentsJoues
      : [profileData?.instrument].filter(Boolean);

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pt-5 pb-4 px-4 sm:px-6 select-none w-full relative"
    >
      {/* Gauche / Centre : Avatar + Identité + Badges */}
      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 min-w-0">
        <div
          className="relative inline-block cursor-pointer group hover:scale-105 transition-transform shrink-0"
          onClick={() => hasCustomPhoto && onOpenLightbox()}
          title={t('userProfile.photoEnlargeTitle')}
        >
          <XiloAvatar src={profileData?.photoURL || user?.photoURL} name={fullName} size={100} />
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

        <div className="flex flex-col items-center sm:items-start gap-1.5 min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2">
            <h2 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-wider text-encre-noire leading-tight">
              {fullName}
            </h2>
            {isFieldVisible('surnom') && formData.surnom && (
              <span className="text-xs font-extrabold italic text-cordel-master-dark/80">
                « {formData.surnom} »
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-cordel-wood">
              {roleLabel}
            </span>
            {user?.email && (
              <span className="text-[10px] font-bold tracking-wider text-cordel-master-dark/65 break-all">
                • {user.email}
              </span>
            )}
          </div>

          {(deduplicatedTags.length > 0 || instrumentsList.length > 0) && (
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start items-center w-full pt-1">
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

              {instrumentsList.map((inst, idx) => {
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
        </div>
      </div>

      {/* Droite : Actions Photo & Bouton Modifier mon profil */}
      <div className="flex flex-col items-center xl:items-end gap-2 w-full xl:w-auto xl:min-w-[260px] shrink-0 border-t xl:border-t-0 border-dashed border-cordel-master-dark/15 pt-3 xl:pt-0">
        {!hasCustomPhoto && (
          <div className="bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/25 p-2 rounded-[6px] text-center xl:text-right w-full max-w-md">
            <p className="text-[10px] text-cordel-master-dark font-semibold leading-relaxed">
              💡 <span className="font-extrabold text-cordel-wood">{t('userProfile.photoTipTitle')}</span> {t('userProfile.photoTipDesc')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center xl:justify-end gap-2">
          <label className="relative overflow-hidden text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 select-none">
            📸 {uploadingPhoto ? '⏳ ' + t('userProfile.uploading') : t('userProfile.changePhoto')}
            <input type="file" accept="image/*" disabled={uploadingPhoto || saving} onChange={handlePhotoSelected} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </label>
          <label className="relative overflow-hidden text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 select-none">
            📷 {t('userProfile.takePhoto')}
            <input type="file" accept="image/*" capture="user" disabled={uploadingPhoto || saving} onChange={handlePhotoSelected} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </label>
        </div>

        {!isEditing && (
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleStartEdit}
            className="w-full sm:w-auto sm:min-w-[240px] mt-1 py-2.5 px-5 font-black uppercase tracking-wider text-xs shadow-[2.5px_2.5px_0px_0px_#181716]"
          >
            ✏️ {translate('userProfile.editBtn', 'Modifier mon profil')}
          </CordelButton>
        )}
      </div>
    </CordelCard>
  );
}

