import React from 'react';

/**
 * Sous-composant des niveaux requis et tenues vestimentaires par discipline (Percussion & Danse)
 * extrait de EventFormFields.jsx (Règle du Boy Scout).
 */
export default function EventDisciplineDressCodeFields({
  formData,
  handleChange,
  saving = false,
  customCategories = [],
  combinedCostumeOptions = [],
  tr
}) {
  if (formData.includesPercussion === false && formData.includesDance === false) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Percussion : Niveau & Tenue */}
      {formData.includesPercussion !== false && (
        <div className="flex flex-col gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 rounded border border-amber-300/40">
          <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1">
            🥁 {tr('agenda.percussionSectionTitle') || 'Pupitre Percussion'}
          </span>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold text-stone-600">
              {tr('agenda.requiredLevel') || 'Niveau requis'}
            </label>
            <select
              name="niveauRequis"
              value={formData.niveauRequis || 'tous'}
              onChange={handleChange}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 bg-white"
            >
              <option value="tous">👥 Tous les niveaux</option>
              <option value="aucun">Aucun</option>
              {customCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold text-stone-600">
              {tr('agenda.percussionOutfit') || 'Tenue Percussion'}
            </label>
            <select
              name="dressCodePercussion"
              value={formData.dressCodePercussion || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 bg-white"
            >
              <option value="">{tr('agenda.outfitFreeOption') || '-- Libre / Non spécifiée --'}</option>
              {combinedCostumeOptions.map((opt) => (
                <option key={`perc-${opt.id}`} value={opt.name}>{opt.displayName || opt.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Danse : Niveau & Tenue */}
      {formData.includesDance !== false && (
        <div className="flex flex-col gap-2 p-2.5 bg-pink-50/50 dark:bg-pink-950/10 rounded border border-pink-300/40">
          <span className="text-[10px] font-black uppercase text-pink-900 dark:text-pink-300 flex items-center gap-1">
            💃 {tr('agenda.danceSectionTitle') || 'Section Danse'}
          </span>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold text-stone-600">
              {tr('agenda.requiredLevel') || 'Niveau requis'}
            </label>
            <select
              name="niveauDanseRequis"
              value={formData.niveauDanseRequis || 'aucun'}
              onChange={handleChange}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 bg-white"
            >
              <option value="aucun">Aucun</option>
              <option value="tous">👥 Tous les niveaux</option>
              {customCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold text-stone-600">
              {tr('agenda.danceOutfit') || 'Tenue Danse'}
            </label>
            <select
              name="dressCodeDanse"
              value={formData.dressCodeDanse || ''}
              onChange={handleChange}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 bg-white"
            >
              <option value="">{tr('agenda.outfitFreeOption') || '-- Libre / Non spécifiée --'}</option>
              {combinedCostumeOptions.map((opt) => (
                <option key={`danse-${opt.id}`} value={opt.name}>{opt.displayName || opt.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

