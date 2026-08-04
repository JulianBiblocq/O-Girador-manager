import React, { useState, useEffect } from 'react';
import EventToggleSwitch from './EventToggleSwitch';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

const toDateValue = (rawDate) => {
  if (!rawDate) return '';
  const cleanStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
  return '';
};

const toTimeValue = (rawTime, rawDate) => {
  if (rawTime && /^\d{2}:\d{2}/.test(rawTime)) return rawTime.substring(0, 5);
  if (rawDate && rawDate.includes('T')) {
    const timePart = rawDate.split('T')[1];
    if (timePart && /^\d{2}:\d{2}/.test(timePart)) return timePart.substring(0, 5);
  }
  return '';
};

/**
 * EventsDataGridRow - Interactive table row allowing inline editing for all event fields.
 * Keeps local state to maintain input focus during typing and saves to Firestore on blur/change.
 */
function EventsDataGridRow({
  event,
  onUpdateField,
  onToggleField,
  updatingEventId,
  updatingField,
  lieuxImportants = [],
  defaultLocationsByEventType = {},
  customCategories = DEFAULT_CUSTOM_CATEGORIES
}) {
  const isUpdatingRow = updatingEventId === event.id;

  // Local form state to prevent losing focus during keystrokes
  const [localData, setLocalData] = useState({
    titre: event.titre || '',
    type: event.type || 'prestation',
    description: event.description || '',
    date: toDateValue(event.date),
    heureDebut: toTimeValue(event.heureDebut, event.date),
    heureFin: toTimeValue(event.heureFin, event.dateFin),
    lieuSimple: event.lieuSimple || event.lieu || '',
    dateLimiteInscription: toDateValue(event.dateLimiteInscription || event.dateLimite),
    niveauRequis: event.niveauRequis || event.niveauPercussion || 'tous',
    niveauDanseRequis: event.niveauDanseRequis || event.niveauDanse || 'aucun',
    tenueRequise: event.tenueRequise || event.tenue || ''
  });

  // Sync local data when event prop changes externally
  useEffect(() => {
    setLocalData({
      titre: event.titre || '',
      type: event.type || 'prestation',
      description: event.description || '',
      date: toDateValue(event.date),
      heureDebut: toTimeValue(event.heureDebut, event.date),
      heureFin: toTimeValue(event.heureFin, event.dateFin),
      lieuSimple: event.lieuSimple || event.lieu || '',
      dateLimiteInscription: toDateValue(event.dateLimiteInscription || event.dateLimite),
      niveauRequis: event.niveauRequis || event.niveauPercussion || 'tous',
      niveauDanseRequis: event.niveauDanseRequis || event.niveauDanse || 'aucun',
      tenueRequise: event.tenueRequise || event.tenue || ''
    });
  }, [event]);

  const handleChange = (field, value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field, originalValue) => {
    const currentValue = localData[field];
    if (currentValue !== originalValue) {
      onUpdateField(event.id, field, currentValue);
    }
  };

  const handleKeyDown = (e, field, originalValue) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleSelectChange = (field, value, originalValue) => {
    let newLieu = localData.lieuSimple;
    if (field === 'type' && defaultLocationsByEventType[value]) {
      const defaultLieuId = defaultLocationsByEventType[value];
      const foundLieu = (lieuxImportants || []).find(l => l.id === defaultLieuId);
      if (foundLieu) {
        newLieu = foundLieu.nom && foundLieu.adresse ? `${foundLieu.nom} - ${foundLieu.adresse}` : (foundLieu.adresse || foundLieu.nom);
        onUpdateField(event.id, 'lieuSimple', newLieu);
      }
    }
    setLocalData((prev) => ({ ...prev, [field]: value, lieuSimple: newLieu }));
    if (value !== originalValue) {
      onUpdateField(event.id, field, value);
    }
  };

  return (
    <tr className="hover:bg-[var(--cordel-hover)] transition-colors border-b border-[var(--encre-noire)]/15">
      {/* 1. Titre (Sticky Column) */}
      <td className="p-2 border-r-2 border-[var(--encre-noire)]/30 font-bold sticky left-0 z-10 bg-[var(--cordel-card-bg)] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
        <input
          type="text"
          value={localData.titre}
          onChange={(e) => handleChange('titre', e.target.value)}
          onBlur={() => handleBlur('titre', event.titre || '')}
          onKeyDown={(e) => handleKeyDown(e, 'titre', event.titre || '')}
          placeholder="Titre..."
          className="theme-input w-full min-w-[150px] py-1 px-2 text-xs font-extrabold"
        />
      </td>

      {/* 2. Type */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10">
        <select
          value={localData.type}
          onChange={(e) => handleSelectChange('type', e.target.value, event.type || 'prestation')}
          className="theme-input w-full text-[11px] py-1 px-2 font-bold capitalize cursor-pointer"
        >
          <option value="prestation">Prestation</option>
          <option value="repetition">Répétition</option>
          <option value="stage">Stage</option>
          <option value="atelier">Atelier</option>
          <option value="reunion">Réunion</option>
          <option value="general">Général</option>
        </select>
      </td>

      {/* 3. Description */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[180px]">
        <input
          type="text"
          value={localData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description', event.description || '')}
          onKeyDown={(e) => handleKeyDown(e, 'description', event.description || '')}
          placeholder="Description..."
          className="theme-input w-full py-1 px-2 text-xs font-normal"
        />
      </td>

      {/* 4. Date */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[130px]">
        <input
          type="date"
          value={localData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          onBlur={() => handleBlur('date', toDateValue(event.date))}
          className="theme-input w-full py-1 px-2 text-xs font-bold"
        />
      </td>

      {/* 5. Heure début */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[95px]">
        <input
          type="time"
          value={localData.heureDebut}
          onChange={(e) => handleChange('heureDebut', e.target.value)}
          onBlur={() => handleBlur('heureDebut', toTimeValue(event.heureDebut, event.date))}
          className="theme-input w-full py-1 px-1.5 text-xs text-center font-bold"
        />
      </td>

      {/* 6. Heure fin */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[95px]">
        <input
          type="time"
          value={localData.heureFin}
          onChange={(e) => handleChange('heureFin', e.target.value)}
          onBlur={() => handleBlur('heureFin', toTimeValue(event.heureFin, event.dateFin))}
          className="theme-input w-full py-1 px-1.5 text-xs text-center font-bold"
        />
      </td>

      {/* 7. Lieu simple */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[160px]">
        {lieuxImportants.length > 0 ? (
          <select
            value={localData.lieuSimple}
            onChange={(e) => {
              const val = e.target.value;
              handleSelectChange('lieuSimple', val, event.lieuSimple || event.lieu || '');
            }}
            className="theme-input w-full py-1 px-1 text-xs font-semibold bg-amber-50/60 border border-amber-300"
          >
            <option value={localData.lieuSimple}>{localData.lieuSimple || "📍 Choisir un lieu..."}</option>
            <optgroup label="📍 Lieux habituels de l'association">
              {lieuxImportants.map((lieu) => {
                const label = lieu.nom && lieu.adresse ? `${lieu.nom} - ${lieu.adresse}` : (lieu.adresse || lieu.nom);
                return (
                  <option key={lieu.id} value={label}>
                    📍 {lieu.nom}
                  </option>
                );
              })}
            </optgroup>
          </select>
        ) : (
          <input
            type="text"
            value={localData.lieuSimple}
            onChange={(e) => handleChange('lieuSimple', e.target.value)}
            onBlur={() => handleBlur('lieuSimple', event.lieuSimple || event.lieu || '')}
            onKeyDown={(e) => handleKeyDown(e, 'lieuSimple', event.lieuSimple || event.lieu || '')}
            placeholder="Lieu..."
            className="theme-input w-full py-1 px-2 text-xs"
          />
        )}
      </td>

      {/* 8. Date limite */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[130px]">
        <input
          type="date"
          value={localData.dateLimiteInscription}
          onChange={(e) => handleChange('dateLimiteInscription', e.target.value)}
          onBlur={() => handleBlur('dateLimiteInscription', toDateValue(event.dateLimiteInscription || event.dateLimite))}
          className="theme-input w-full py-1 px-2 text-xs font-bold"
        />
      </td>

      {/* 9. Niveau perc */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[120px]">
        <select
          value={localData.niveauRequis}
          onChange={(e) => handleSelectChange('niveauRequis', e.target.value, event.niveauRequis || event.niveauPercussion || 'tous')}
          className="theme-input w-full text-[11px] py-1 px-2 font-bold cursor-pointer"
        >
          <option value="tous">👥 Tous</option>
          <option value="aucun">Aucun</option>
          {customCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </td>

      {/* 10. Niveau danse */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[120px]">
        <select
          value={localData.niveauDanseRequis}
          onChange={(e) => handleSelectChange('niveauDanseRequis', e.target.value, event.niveauDanseRequis || event.niveauDanse || 'aucun')}
          className="theme-input w-full text-[11px] py-1 px-2 font-bold cursor-pointer"
        >
          <option value="aucun">Aucun</option>
          <option value="tous">👥 Tous</option>
          {customCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </td>

      {/* 11. Tenue */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 min-w-[120px]">
        <input
          type="text"
          value={localData.tenueRequise}
          onChange={(e) => handleChange('tenueRequise', e.target.value)}
          onBlur={() => handleBlur('tenueRequise', event.tenueRequise || event.tenue || '')}
          onKeyDown={(e) => handleKeyDown(e, 'tenueRequise', event.tenueRequise || event.tenue || '')}
          placeholder="Tenue..."
          className="theme-input w-full py-1 px-2 text-xs"
        />
      </td>

      {/* 12. Inclut perc (Interactive Toggle) */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 text-center select-none min-w-[95px]">
        <div className="flex items-center justify-center gap-1.5">
          <EventToggleSwitch
            checked={Boolean(event.includesPercussion)}
            onChange={() => onToggleField(event.id, 'includesPercussion', Boolean(event.includesPercussion))}
            disabled={isUpdatingRow && updatingField === 'includesPercussion'}
            activeColor="bg-amber-600 dark:bg-amber-500"
            label={`Toggle Percussion pour ${event.titre}`}
          />
          <img src="/icones/alfaia.svg" alt="Percussion" className="w-3.5 h-3.5 object-contain dark:invert shrink-0 opacity-80" />
        </div>
      </td>

      {/* 13. Inclut danse (Interactive Toggle) */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 text-center select-none min-w-[95px]">
        <div className="flex items-center justify-center gap-1.5">
          <EventToggleSwitch
            checked={Boolean(event.includesDance)}
            onChange={() => onToggleField(event.id, 'includesDance', Boolean(event.includesDance))}
            disabled={isUpdatingRow && updatingField === 'includesDance'}
            activeColor="bg-pink-600 dark:bg-pink-500"
            label={`Toggle Danse pour ${event.titre}`}
          />
          <span className="text-xs shrink-0">💃</span>
        </div>
      </td>

      {/* 14. Soumis à validation (Interactive Toggle) */}
      <td className="p-2 border-r border-[var(--encre-noire)]/10 text-center select-none min-w-[125px]">
        <div className="flex items-center justify-center gap-1.5">
          <EventToggleSwitch
            checked={Boolean(event.requiresValidation)}
            onChange={() => onToggleField(event.id, 'requiresValidation', Boolean(event.requiresValidation))}
            disabled={isUpdatingRow && updatingField === 'requiresValidation'}
            activeColor="bg-emerald-600 dark:bg-emerald-500"
            label={`Toggle Validation pour ${event.titre}`}
          />
          <span className="text-xs shrink-0">🔒</span>
        </div>
      </td>

      {/* 15. Inscriptions requises (Interactive Toggle) */}
      <td className="p-2 text-center select-none min-w-[125px]">
        <div className="flex items-center justify-center gap-1.5">
          <EventToggleSwitch
            checked={event.enableInscriptions !== false}
            onChange={() => onToggleField(event.id, 'enableInscriptions', event.enableInscriptions !== false)}
            disabled={isUpdatingRow && updatingField === 'enableInscriptions'}
            activeColor="bg-blue-600 dark:bg-blue-500"
            label={`Toggle Inscriptions pour ${event.titre}`}
          />
          <span className="text-xs shrink-0">📝</span>
        </div>
      </td>
    </tr>
  );
}

export default React.memo(EventsDataGridRow);
