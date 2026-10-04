import React from 'react';
import { useTranslation } from '../../../LanguageContext';
import CordelCard from '../../CordelCard';

export default function SequenceurLinkBlock({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const { sequenceurUrl = '' } = formData || {};

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        {t('settings.communication.sequenceurLinkBlock.lienSequenceur')}
      </h3>
      <div className="flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-1">
          <label htmlFor="sequenceurUrl" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            {t('settings.communication.sequenceurLinkBlock.urlRacineDuSequenceurDe')}
          </label>
          <input 
            id="sequenceurUrl"
            type="url"
            value={sequenceurUrl}
            onChange={(e) => handleChange('sequenceurUrl', e.target.value)}
            disabled={saving}
            placeholder={t('settings.communication.sequenceurLinkBlock.exHttpsMonSequenceurApp')}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>
      </div>
    </CordelCard>
  );
}
