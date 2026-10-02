import React, { useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventFormFields from './EventFormFields';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';
import { useTranslation } from '../LanguageContext';

/**
 * EventCreateForm - Formulaire de création d'événement unifié
 * Repose sur le composant modulaire EventFormFields (3 étages)
 */
export default function EventCreateForm({
  formData,
  setFormData,
  handleChange,
  handleSubmit,
  handleCloseForm,
  saving = false,
  dressCodes = [],
  wardrobeCostumes = [],
  createConfig = {},
  rawCreateConfig = {},
  associationEventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion'],
  adresseLocal = '',
  lieuxImportants = [],
  defaultLocationsByEventType = {},
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  eventTypeConfigs = {},
  t,
  groupId,
  defaultDropUrl = '',
  pupitresList = []
}) {
  const { t: contextT } = useTranslation();
  const tr = typeof t === 'function' ? t : contextT;

  const translate = (key, fallback) => {
    if (typeof tr === 'function') {
      const val = tr(key);
      if (val && val !== key) return val;
    }
    return fallback;
  };

  // Consolidation des options de costumes vestiaire + paramètres
  const combinedCostumeOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (wardrobeCostumes || []).forEach(item => {
      const name = typeof item === 'string' ? item : (item.name || item.title || item.titre || item.type || '');
      if (name && !seen.has(name)) {
        seen.add(name);
        const label = item.targetCategory ? `${name} (${item.targetCategory})` : name;
        list.push({ id: item.id || name, name, displayName: label, category: item.targetCategory || 'Vestiaire' });
      }
    });

    (dressCodes || []).forEach(dc => {
      const name = typeof dc === 'string' ? dc : (dc.name || dc.title || dc.type || '');
      if (name && !seen.has(name)) {
        seen.add(name);
        const label = dc.included ? `${name} (${dc.included})` : name;
        list.push({ id: dc.id || name, name, displayName: label, category: 'Paramètres' });
      }
    });

    return list;
  }, [wardrobeCostumes, dressCodes]);

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6 px-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood flex items-center justify-between">
        <span>{translate('widgetAgenda.createEventTitle', "Créer un événement")}</span>
        <span className="text-xs font-normal opacity-75 text-[var(--encre-noire)]">
          Saisie Express & Options rapides
        </span>
      </h4>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <EventFormFields
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          saving={saving}
          isEdit={false}
          eventTypeConfigs={eventTypeConfigs || rawCreateConfig}
          defaultLocationsByEventType={defaultLocationsByEventType}
          lieuxImportants={lieuxImportants}
          associationEventTypes={associationEventTypes}
          adresseLocal={adresseLocal}
          combinedCostumeOptions={combinedCostumeOptions}
          customCategories={customCategories}
          createConfig={createConfig}
          groupId={groupId}
          defaultDropUrl={defaultDropUrl}
          pupitresList={pupitresList}
          t={t}
        />

        {/* Boutons d'action du formulaire */}
        <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-[var(--cordel-border)]">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={handleCloseForm} 
            disabled={saving}
            className="text-xs px-4 py-2"
          >
            {tr('agenda.btnCancel')}
          </CordelButton>
          <CordelButton 
            type="submit"
            variant="vert" 
            useExtremeBorder={true}
            disabled={saving}
            className="text-xs px-5 py-2 font-bold"
          >
            {saving ? tr('common.saving') : "✅ " + tr('agenda.btnSaveEvent')}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
