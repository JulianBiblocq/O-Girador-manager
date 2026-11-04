import React from 'react';
import CordelCard from '../CordelCard';
import { XiloEye, XiloSparkles } from '../XiloIcons';

/**
 * Carte 1 du profil en lecture : Informations publiques d'pupitre et vœux d'orientation
 * (sans répétition du prénom/nom/surnom/rôle déjà présents dans l'en-tête).
 */
export default function ProfilePublicCard({ profileData, t, translate }) {
  return (
    <CordelCard variant="default" useExtremeBorder={true} className="flex flex-col gap-2.5 p-3.5 text-left">
      <div className="flex items-center gap-2 border-b border-dashed border-emerald-600/30 pb-1.5">
        <XiloEye size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
        <h4 className="font-black text-xs uppercase text-emerald-900 dark:text-emerald-300">
          {t('userProfile.cardPublicTitle')}
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-encre-noire font-semibold">
        <div>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">
            {translate('onboarding.pupitre', t('userProfile.pupitrePrincipal'))}
          </span>
          <span className="font-extrabold text-cordel-wood flex items-center gap-1.5 flex-wrap">
            {profileData?.instrument || <span className="italic font-normal opacity-60">{t('userProfile.pendingValidation')}</span>}
            {profileData?.sousInstrument && (
              <span className="text-[10px] font-bold text-cordel-master-dark/80 bg-black/5 px-1.5 py-0.5 rounded border border-cordel-master-dark/15">
                {t('userProfile.attribution')} : {profileData.sousInstrument}
              </span>
            )}
            {profileData?.instrument?.toLowerCase().includes('alfaia') && Array.isArray(profileData?.competencesAlfaia) && profileData.competencesAlfaia.length > 0 && (
              <span className="text-[10px] font-bold text-cordel-master-dark/80 bg-black/5 px-1.5 py-0.5 rounded border border-cordel-master-dark/15">
                {t('userProfile.voix')} : {profileData.competencesAlfaia.join(', ')}
              </span>
            )}
          </span>
        </div>
        {profileData?.instrumentSecondaire && (
          <div>
            <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 block">{t('userProfile.pupitreSecondaire')}</span>
            <span className="font-bold">{profileData.instrumentSecondaire}</span>
          </div>
        )}
        {(profileData?.voeuPrincipal || profileData?.voeuSecondaire || profileData?.voeuTertiaire) && (
          <div className="col-span-1 sm:col-span-2 bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 p-2 rounded">
            <span className="text-[10px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1 mb-1">
              <XiloSparkles size={12} /> {t('userProfile.voeuxOrientation')}
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {profileData?.voeuPrincipal && <span className="bg-white/70 px-2 py-0.5 rounded border border-cordel-master-dark/15"><strong className="text-cordel-wood">{t('userProfile.voeu1')}</strong> {profileData.voeuPrincipal}</span>}
              {profileData?.voeuSecondaire && <span className="bg-white/70 px-2 py-0.5 rounded border border-cordel-master-dark/15"><strong className="text-cordel-wood">{t('userProfile.voeu2')}</strong> {profileData.voeuSecondaire}</span>}
              {profileData?.voeuTertiaire && <span className="bg-white/70 px-2 py-0.5 rounded border border-cordel-master-dark/15"><strong className="text-cordel-wood">{t('userProfile.voeu3')}</strong> {profileData.voeuTertiaire}</span>}
            </div>
          </div>
        )}
      </div>
    </CordelCard>
  );
}

