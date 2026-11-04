import React from 'react';

/**
 * Sous-composant des horaires types (Percussion / Général et sous-créneau Danse),
 * règles d'inscription et lien Cloud par défaut pour un type d'événement (< 140 lignes).
 */
export default function EventTypeScheduleConfigSection({
  type, config, rawConfig, onChangeConfig, handleToggle, handleDeadlineChange, handleUrlChange, saving, t
}) {
  const normType = String(type || '').trim().toLowerCase();
  const showDanceSlot = normType.includes('repetition') || normType.includes('répétition') || Boolean(config.includesDance);

  const handleTimeFieldChange = (field, value) => {
    onChangeConfig(type, { ...rawConfig, [field]: value });
  };

  return (
    <>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood mb-2.5 border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
          <span>🕒</span>
          <span>Horaires types par défaut (Pré-remplissage automatique)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5 p-2.5 rounded bg-amber-50/40 border border-amber-300/40">
            <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
              <span>🥁</span> <span>Horaire type (Général / Percussion)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[8.5px] font-bold uppercase text-stone-600">Début</label>
                <input type="time" value={config.defaultStartTime || '20:00'} onChange={(e) => handleTimeFieldChange('defaultStartTime', e.target.value)} disabled={saving} className="theme-input text-xs font-bold py-1 px-2 bg-white" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[8.5px] font-bold uppercase text-stone-600">Fin</label>
                <input type="time" value={config.defaultEndTime || '22:00'} onChange={(e) => handleTimeFieldChange('defaultEndTime', e.target.value)} disabled={saving} className="theme-input text-xs font-bold py-1 px-2 bg-white" />
              </div>
            </div>
          </div>

          {showDanceSlot && (
            <div className="flex flex-col gap-1.5 p-2.5 rounded bg-pink-50/40 border border-pink-300/40">
              <span className="text-[10px] font-black uppercase text-pink-900 flex items-center gap-1">
                <span>💃</span> <span>Sous-créneau spécifique Danse</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[8.5px] font-bold uppercase text-stone-600">Début Danse</label>
                  <input type="time" value={config.defaultDanceStartTime || '19:00'} onChange={(e) => handleTimeFieldChange('defaultDanceStartTime', e.target.value)} disabled={saving} className="theme-input text-xs font-bold py-1 px-2 bg-white" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[8.5px] font-bold uppercase text-stone-600">Fin Danse</label>
                  <input type="time" value={config.defaultDanceEndTime || '20:00'} onChange={(e) => handleTimeFieldChange('defaultDanceEndTime', e.target.value)} disabled={saving} className="theme-input text-xs font-bold py-1 px-2 bg-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood mb-2.5 border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
          <span>🔒</span>
          <span>{t('settings.agenda.eventTypeConfigCard.reglesDInscriptionDePresence')}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <label className={`flex items-start gap-2.5 p-2.5 rounded border transition-colors cursor-pointer select-none ${
            config.requiresValidation ? 'bg-amber-50/60 border-amber-400/60' : 'bg-cordel-bg-light/50 border-cordel-master-dark/20 hover:bg-cordel-bg-light'
          }`}>
            <input type="checkbox" checked={config.requiresValidation} onChange={(e) => handleToggle('requiresValidation', e.target.checked)} disabled={saving} className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0 mt-0.5" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-encre-noire">
                {t('settings.agenda.eventTypeConfigCard.validationObligatoireParUnAdministrateur')}
              </span>
              <span className="text-[9.5px] text-neutral-500 font-medium leading-relaxed mt-0.5">
                {t('settings.agenda.eventTypeConfigCard.lesInscriptionsDesMembresSont')}
              </span>
            </div>
          </label>

          <div className="flex flex-col justify-between gap-1 p-2.5 rounded bg-cordel-bg-light/50 border border-cordel-master-dark/20">
            <label className="text-[10px] font-bold uppercase tracking-wider text-encre-noire flex items-center gap-1">
              <span>⏳</span>
              <span>{t('settings.agenda.eventTypeConfigCard.delaiLimiteDInscriptionAvant')}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" step="1"
                placeholder={t('settings.agenda.eventTypeConfigCard.ex48Cloture48hAvant')}
                value={config.defaultDeadlineHours ?? ''}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                disabled={saving}
                className="theme-input text-xs font-bold py-1 px-2 bg-white w-36 border border-cordel-master-dark/30 rounded"
              />
              <span className="text-[10px] text-stone-600 font-bold">{t('settings.agenda.eventTypeConfigCard.heuresAvant')}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood mb-1.5 border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
          <span>☁️</span>
          <span>{t('settings.agenda.eventTypeConfigCard.lienCloudDepotParDefaut')}</span>
        </h4>
        <input
          type="url"
          placeholder="https://framaspace.org/... ou Google Drive spécifique à ce type"
          value={config.defaultDropUrl || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={saving}
          className="theme-input text-xs font-semibold py-1.5 px-2 bg-white w-full"
        />
      </div>
    </>
  );
}
