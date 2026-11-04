import React from 'react';
import { computeRelativeDeadlineForSlot } from '../../utils/eventScheduleUtils';

const RELATIVE_DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14];

/**
 * Sélecteur du mode de clôture des inscriptions (Aucune / Délai relatif J-N / Date fixe).
 * Extrait de EventFormFields.jsx (Règle du Boy Scout, < 140 lignes).
 */
export default function EventDeadlineModeField({
  formData,
  setFormData,
  handleChange,
  saving = false,
  tr
}) {
  const mode = formData.registrationDeadlineMode || (formData.dateLimiteInscription ? 'fixed' : 'none');
  const daysBefore = Number(formData.registrationDeadlineDaysBefore) || 7;
  const isPollMode = Boolean(formData.isPoll || formData.status === 'sondage' || formData.pollGroupId);

  const handleModeChange = (newMode) => {
    setFormData((prev) => {
      const nextDays = Number(prev.registrationDeadlineDaysBefore) || 7;
      let nextDeadline = prev.dateLimiteInscription || '';
      if (newMode === 'none') {
        nextDeadline = '';
      } else if (newMode === 'relative') {
        nextDeadline = prev.date ? computeRelativeDeadlineForSlot(prev.date, nextDays) : '';
      }
      return {
        ...prev,
        registrationDeadlineMode: newMode,
        registrationDeadlineDaysBefore: nextDays,
        dateLimiteInscription: nextDeadline
      };
    });
  };

  const handleDaysBeforeChange = (newDays) => {
    const parsed = Number(newDays) || 7;
    setFormData((prev) => ({
      ...prev,
      registrationDeadlineMode: 'relative',
      registrationDeadlineDaysBefore: parsed,
      dateLimiteInscription: prev.date ? computeRelativeDeadlineForSlot(prev.date, parsed) : ''
    }));
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded border border-cordel-master-dark/20 bg-cordel-bg-light/50">
      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
        <span>⏳</span>
        <span>{tr('agenda.deadlineRsvp') || "Date limite d'inscription"}</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 select-none">
        <button
          type="button"
          onClick={() => handleModeChange('none')}
          disabled={saving}
          className={`px-2 py-1.5 rounded text-[10px] font-black uppercase border transition-all cursor-pointer ${
            mode === 'none'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-amber-50'
          }`}
        >
          🔓 Aucune limite
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('relative')}
          disabled={saving}
          className={`px-2 py-1.5 rounded text-[10px] font-black uppercase border transition-all cursor-pointer ${
            mode === 'relative'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-amber-50'
          }`}
        >
          🗓️ Délai avant chaque date
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('fixed')}
          disabled={saving}
          className={`px-2 py-1.5 rounded text-[10px] font-black uppercase border transition-all cursor-pointer ${
            mode === 'fixed'
              ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-amber-50'
          }`}
        >
          📌 Date fixe précise
        </button>
      </div>

      {mode === 'relative' && (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-stone-700">Clôturer :</span>
            <select
              value={daysBefore}
              onChange={(e) => handleDaysBeforeChange(e.target.value)}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 px-2 bg-white w-auto"
            >
              {RELATIVE_DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} {d > 1 ? 'jours avant' : 'jour avant'}
                </option>
              ))}
            </select>
            <span className="text-[10px] font-semibold text-stone-600">chaque créneau</span>
          </div>
          <p className="text-[9.5px] font-semibold text-amber-900 bg-amber-50/80 px-2 py-1 rounded border border-amber-300/60">
            {isPollMode
              ? `🔄 Clôture glissante : chaque date du sondage sera verrouillée individuellement à J-${daysBefore} (les dates suivantes restent ouvertes).`
              : `🔒 Clôture automatique calculée à J-${daysBefore} avant la date de l'événement.`}
          </p>
        </div>
      )}

      {mode === 'fixed' && (
        <input
          type="datetime-local"
          name="dateLimiteInscription"
          value={formData.dateLimiteInscription || ''}
          onChange={handleChange}
          disabled={saving}
          className="theme-input w-full text-xs font-bold bg-white mt-1"
        />
      )}
    </div>
  );
}

