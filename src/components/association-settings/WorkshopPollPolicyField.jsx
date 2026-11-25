import React from 'react';
import CordelCard from '../CordelCard';
import { useTranslation } from '../LanguageContext';
import { normalizeWorkshopPolicy } from '../../utils/workshopSanctuaryUtils';

/**
 * Carte de configuration SaaS de la politique de gestion des votants hors-pupitre
 * lors de la validation d'un sondage de répartition d'ateliers par pupitre (< 65 lignes).
 */
export default function WorkshopPollPolicyField({ value = 'reconfirm', onChange, saving = false }) {
  const { t } = useTranslation();
  const currentPolicy = normalizeWorkshopPolicy(value);

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1.5 flex items-center gap-1.5">
        <span>🥁</span>
        <span>{t('settings.agenda.tabAgenda.workshopPollPolicyTitle')}</span>
      </h3>
      <p className="text-[10px] text-cordel-master-dark opacity-80 leading-relaxed mb-3">
        {t('settings.agenda.tabAgenda.workshopPollPolicyDesc')}
      </p>

      <div className="flex flex-col gap-1.5 text-left max-w-xl">
        <label htmlFor="workshopPollOtherPupitresPolicy" className="text-[9px] uppercase font-bold text-cordel-master-dark">
          {t('settings.agenda.tabAgenda.workshopPollPolicyLabel')}
        </label>
        <select
          id="workshopPollOtherPupitresPolicy"
          name="workshopPollOtherPupitresPolicy"
          value={currentPolicy}
          onChange={(e) => onChange && onChange('workshopPollOtherPupitresPolicy', normalizeWorkshopPolicy(e.target.value))}
          disabled={saving}
          className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
        >
          <option value="reconfirm">
            {t('settings.agenda.tabAgenda.workshopPollPolicyReconfirm')}
          </option>
          <option value="strict">
            {t('settings.agenda.tabAgenda.workshopPollPolicyStrict')}
          </option>
        </select>
      </div>
    </CordelCard>
  );
}
