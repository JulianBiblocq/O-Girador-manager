import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function InstrumentBaptismModal({ project, model, onClose, onValidate }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nom: `${model.nom} - ${project.nom}`,
    kitAccessoires: '',
    localisationPhysique: 'Local',
    proprietaire: 'Association'
  });

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md">
        <CordelCard variant="default" className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
            <div>
              <h3 className="text-sm font-black text-cordel-wood uppercase flex items-center gap-2">
                <span>🥁</span> {t('lutherie.instrumentBaptismTitle')}
              </h3>
              <p className="text-[10px] text-stone-600 font-medium">
                {t('lutherie.instrumentBaptismDesc')}
              </p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer">×</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton variant="secondary" type="button" onClick={onClose}>
                {t('lutherie.btnCancel')}
              </CordelButton>
              <CordelButton variant="vert" type="submit">
                {t('lutherie.btnCreateInstrument')}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
