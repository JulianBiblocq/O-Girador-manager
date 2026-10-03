import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import CordelButton from '../CordelButton';
import useModalEscape from '../../hooks/useModalEscape';

export default function InstrumentBaptismModal({ project, model, onClose, onValidate }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nom: `${model.nom} - ${project.nom}`,
    kitAccessoires: '',
    localisationPhysique: 'Local',
    proprietaire: 'Association'
  });

  // Fermeture accessible avec touche Échap
  useModalEscape(true, onClose);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      alert(t('lutherie.alertNameOrInventoryRequired'));
      return;
    }
    onValidate(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-md max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-encre-noire shadow-2xl overflow-hidden text-left mt-2 sm:mt-0">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/20 flex items-start justify-between gap-3 bg-cordel-bg-light">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-black text-cordel-wood uppercase flex items-center gap-2 break-words">
              <span>🥁</span> {t('lutherie.instrumentBaptismTitle')}
            </h3>
            <p className="text-[10px] text-stone-600 font-medium">
              {t('lutherie.instrumentBaptismDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">{t('lutherie.modelReadOnlyLabel')}</label>
              <input
                type="text"
                value={model.nom}
                readOnly
                className="theme-input bg-stone-100 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">{t('lutherie.nameOrInventoryNumberLabel')}</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="theme-input"
                placeholder={t('lutherie.nameOrInventoryPlaceholder')}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">{t('lutherie.physicalLocationLabel')}</label>
              <input
                type="text"
                name="localisationPhysique"
                value={formData.localisationPhysique}
                onChange={handleChange}
                className="theme-input"
                placeholder={t('lutherie.physicalLocationPlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">{t('lutherie.ownerLabel')}</label>
              <input
                type="text"
                name="proprietaire"
                value={formData.proprietaire}
                onChange={handleChange}
                className="theme-input"
                placeholder={t('lutherie.ownerPlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">{t('lutherie.initialAccessoriesKitLabel')}</label>
              <textarea
                name="kitAccessoires"
                value={formData.kitAccessoires}
                onChange={handleChange}
                className="theme-input h-16 resize-none"
                placeholder={t('lutherie.initialAccessoriesKitPlaceholder')}
              />
            </div>
          </div>

          {/* 3. Footer (Fixe) */}
          <div className="shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 bg-[var(--theme-bg)] flex justify-end gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <CordelButton variant="secondary" type="button" onClick={onClose} className="shrink-0">
              {t('lutherie.btnCancel')}
            </CordelButton>
            <CordelButton variant="vert" type="submit" className="shrink-0">
              {t('lutherie.btnCreateInstrument')}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
