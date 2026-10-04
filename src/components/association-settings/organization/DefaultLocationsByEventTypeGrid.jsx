import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Grille de correspondance associant un lieu par défaut à chaque type d'événement.
 */
export default function DefaultLocationsByEventTypeGrid({ defaultLocations = {}, lieuxImportants = [], onChange }) {
  const { t } = useTranslation();

  const EVENT_TYPES = [
    { key: 'repetition', label: t('settings.organization.defaultLocationsByEventTypeGrid.repetitions') },
    { key: 'prestation', label: t('settings.organization.defaultLocationsByEventTypeGrid.prestations') },
    { key: 'stage', label: t('settings.organization.defaultLocationsByEventTypeGrid.stages') },
    { key: 'reunion', label: t('settings.organization.defaultLocationsByEventTypeGrid.reunionsAg') }
  ];

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
        {t('settings.organization.defaultLocationsByEventTypeGrid.lieuxParDefautSelonLe')}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
        {EVENT_TYPES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-stone-200">
            <span className="font-bold text-stone-700">{label}</span>
            <select
              value={defaultLocations[key] || ''}
              onChange={(e) => {
                const updated = { ...defaultLocations, [key]: e.target.value };
                onChange(updated);
              }}
              className="theme-input text-[10px] font-bold py-0.5 bg-stone-50 max-w-[160px] truncate"
            >
              <option value="">{t('settings.organization.defaultLocationsByEventTypeGrid.manuel')}</option>
              {lieuxImportants.map(l => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
