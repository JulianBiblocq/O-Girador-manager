import React, { useState } from 'react';
import CordelButton from '../../CordelButton';
import { useTranslation } from '../../LanguageContext';

/**
 * Formulaire compact d'ajout d'une question personnalisée pour l'adhésion.
 */
export default function CustomFieldAddForm({ onAdd, saving }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [required, setRequired] = useState(false);
  const [target, setTarget] = useState('both');
  const [options, setOptions] = useState('');

  const FIELD_TYPES = [
    { value: 'text', label: t('settings.organization.customFieldAddForm.texteCourt') },
    { value: 'textarea', label: t('settings.organization.customFieldAddForm.texteLong') },
    { value: 'number', label: t('settings.organization.customFieldAddForm.nombre') },
    { value: 'date', label: t('common.date') || 'Date' },
    { value: 'select', label: t('settings.organization.customFieldAddForm.listeDeroulante') },
    { value: 'multiselect', label: t('settings.organization.customFieldAddForm.choixMultiples') },
    { value: 'checkbox', label: t('settings.organization.customFieldAddForm.caseACocher') }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `field_${Date.now()}_${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: name.trim(),
      type,
      required,
      target,
      options: ['select', 'multiselect'].includes(type) && options.trim()
        ? options.split(',').map(o => o.trim()).filter(Boolean)
        : []
    });
    setName('');
    setType('text');
    setRequired(false);
    setTarget('both');
    setOptions('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-stone-50 border border-stone-200 rounded flex flex-col gap-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[9px] uppercase font-bold text-cordel-master-dark block mb-0.5">
            {t('settings.organization.customFieldAddForm.nomDeLaQuestion')}
          </label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('settings.organization.customFieldAddForm.exRegimeAlimentaire')}
            className="theme-input text-xs font-bold py-1 bg-white w-full"
          />
        </div>
        
        <div>
          <label className="text-[9px] uppercase font-bold text-cordel-master-dark block mb-0.5">
            {t('settings.organization.customFieldAddForm.typeDeReponse')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="theme-input text-xs font-bold py-1 bg-white w-full cursor-pointer"
          >
            {FIELD_TYPES.map(tOption => (
              <option key={tOption.value} value={tOption.value}>{tOption.label}</option>
            ))}
          </select>
        </div>
      </div>

      {['select', 'multiselect'].includes(type) && (
        <div>
          <label className="text-[9px] uppercase font-bold text-cordel-master-dark block mb-0.5">
            {t('settings.organization.customFieldAddForm.optionsSepareesParUneVirgule')}
          </label>
          <input 
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder={t('settings.organization.customFieldAddForm.exVegetarienVeganSansGluten')}
            className="theme-input text-xs font-bold py-1 bg-white w-full"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-dashed border-stone-200">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input 
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-[10px] font-bold text-stone-700">
            {t('settings.organization.customFieldAddForm.reponseObligatoire')}
          </span>
        </label>

        <CordelButton 
          type="submit"
          variant="ocre"
          useExtremeBorder={true}
          disabled={saving || !name.trim()}
          className="py-1 px-3 text-[10px] font-black uppercase tracking-wider self-end sm:self-auto cursor-pointer"
        >
          {t('settings.organization.customFieldAddForm.ajouterLaQuestion')}
        </CordelButton>
      </div>
    </form>
  );
}
