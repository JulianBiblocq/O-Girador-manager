import React from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloCaixa } from '../XiloIcons';

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

/**
 * UserMateriel Component
 * Displays member's personal instruments, borrowed association gear, and local assigned instruments.
 */
export default function UserMateriel({ user, profileData, onBack }) {
  const { t } = useTranslation();
  const { myInstruments, loadingInst } = useUserProfile(user, profileData, t);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const personal = myInstruments.filter(inst => inst.proprietaire === user?.uid);
  const borrowed = myInstruments.filter(inst => 
    (inst.status === 'Emprunté' && inst.borrowedBy === user?.uid) ||
    (inst.proprietaire === 'Association' && inst.localisationPhysique === user?.uid)
  );
  const localAssigned = myInstruments.filter(inst => 
    inst.localisationPhysique === 'Local' && 
    Array.isArray(inst.assignations) && 
    inst.assignations.includes(user?.uid)
  );

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs font-bold uppercase">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-black tracking-wider text-cordel-wood uppercase flex items-center gap-2">
          🎺 {translate('userProfile.instrumentsHeading', 'Mon Matériel & Instruments')}
        </span>
        <div className="w-12"></div>
      </div>

      {/* Description */}
      <p className="text-xs text-cordel-master-dark opacity-75 text-left leading-relaxed">
        Consultez la liste de vos instruments personnels, du matériel prêté par l'association et des instruments qui vous sont assignés au local.
      </p>

      {/* Content */}
      {loadingInst ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement de votre matériel...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-5 mt-2">
          {/* 1. Instruments Personnels */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-cordel-bg">
            <span className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
              <span>🎸 {t('userProfile.personalInsts')}</span>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px]">{personal.length}</span>
            </span>

            {personal.length === 0 ? (
              <p className="text-xs italic text-cordel-master-dark/60 py-2">{t('userProfile.noPersonal')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {personal.map(inst => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex items-center justify-between gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                        <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">{inst.type}</span>
                      </div>
                    </div>
                    <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[7px] shrink-0`}>
                      {inst.etat}
                    </span>
                  </CordelCard>
                ))}
              </div>
            )}
          </CordelCard>

          {/* 2. Matériel Emprunté */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-cordel-bg">
            <span className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
              <span>🎒 {t('userProfile.borrowedInsts')}</span>
              <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px]">{borrowed.length}</span>
            </span>

            {borrowed.length === 0 ? (
              <p className="text-xs italic text-cordel-master-dark/60 py-2">{t('userProfile.noBorrowed')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {borrowed.map(inst => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex items-center justify-between gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                        <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">Stock Association</span>
                      </div>
                    </div>
                    <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-dark'} text-[7px] shrink-0`}>
                      {inst.etat}
                    </span>
                  </CordelCard>
                ))}
              </div>
            )}
          </CordelCard>

          {/* 3. Instruments assignés au local */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-cordel-bg">
            <span className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
              <span>🏠 {t('userProfile.localAssignedInsts')}</span>
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px]">{localAssigned.length}</span>
            </span>

            {localAssigned.length === 0 ? (
              <p className="text-xs italic text-cordel-master-dark/60 py-2">{t('userProfile.noLocal')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {localAssigned.map(inst => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex items-center justify-between gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                        <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">Au Local</span>
                      </div>
                    </div>
                    <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] shrink-0">
                      {inst.etat}
                    </span>
                  </CordelCard>
                ))}
              </div>
            )}
          </CordelCard>
        </div>
      )}
    </div>
  );
}
