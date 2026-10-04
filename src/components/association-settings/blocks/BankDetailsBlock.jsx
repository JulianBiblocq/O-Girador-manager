import React from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../LanguageContext';

export default function BankDetailsBlock({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        {t('settings.identity.bankDetailsBlock.coordonneesBancairesFacturation')}
      </h3>
      <div className="flex flex-col gap-3 text-left">
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
          {t('settings.identity.bankDetailsBlock.cesInformationsApparaitrontSurVos')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mention Exonération TVA */}
          <div className="flex flex-col gap-1">
            <label htmlFor="mentionTVA" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {t('settings.identity.bankDetailsBlock.mentionDExonerationTva')}
            </label>
            <input 
              id="mentionTVA"
              type="text"
              value={formData.mentionTVA || ''}
              onChange={(e) => handleChange('mentionTVA', e.target.value)}
              disabled={saving}
              placeholder={t('settings.identity.bankDetailsBlock.exTvaNonApplicableArt')}
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          {/* RIB / IBAN */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ribIban" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              {t('settings.identity.bankDetailsBlock.coordonneesBancairesIbanBic')}
            </label>
            <input 
              id="ribIban"
              type="text"
              value={formData.ribIban || formData.iban || ''}
              onChange={(e) => {
                handleChange('ribIban', e.target.value);
                handleChange('iban', e.target.value);
              }}
              disabled={saving}
              placeholder={t('settings.identity.bankDetailsBlock.exFr76300040001234')}
              className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>
        </div>

        {/* Titulaire du compte bancaire (Optional) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="titulaireCompte" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            {t('settings.identity.bankDetailsBlock.titulaireDuCompteBancaire')}
          </label>
          <input 
            id="titulaireCompte"
            type="text"
            value={formData.titulaireCompte || ''}
            onChange={(e) => handleChange('titulaireCompte', e.target.value)}
            disabled={saving}
            placeholder={t('settings.identity.bankDetailsBlock.exAssociationOGirador')}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

      </div>
    </CordelCard>
  );
}
