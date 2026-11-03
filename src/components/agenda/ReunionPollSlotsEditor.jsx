/**
 * Sous-composant d'édition des créneaux proposés et de la restriction de vote
 * pour un sondage de réunion dans ReunionManager.jsx.
 */

import React from 'react';

export default function ReunionPollSlotsEditor({
  pollSlots = [],
  onAddSlot,
  onRemoveSlot,
  onSlotChange,
  pollRestrictionType = 'aucun',
  setPollRestrictionType,
  pollTarget = '',
  setPollTarget
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-dashed border-[var(--theme-border-color,#181716)]/15 pt-2">
      <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-cordel-rouge,#8b2a1a)] flex items-center justify-between">
        <span>Créneaux proposés (min. 2 dates)</span>
      </label>

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
        {pollSlots.map((slot, idx) => (
          <div key={idx} className="p-2 bg-[var(--cordel-paper,#fffdf8)]/80 rounded border border-[var(--theme-border-color,#181716)]/20 flex flex-col gap-1.5 relative">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-extrabold text-[var(--color-cordel-rouge,#8b2a1a)] uppercase">
                Option {idx + 1}
              </span>
              {idx >= 2 && (
                <button
                  type="button"
                  onClick={() => onRemoveSlot(idx)}
                  className="text-[var(--color-cordel-rouge,#8b2a1a)] text-[10px] font-bold px-1 cursor-pointer"
                >
                  ✖
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <input
                type="date"
                value={slot.date}
                onChange={(e) => onSlotChange(idx, 'date', e.target.value)}
                required
                className="theme-input text-[11px] py-1 bg-white"
              />
              <input
                type="time"
                value={slot.timeStart}
                onChange={(e) => onSlotChange(idx, 'timeStart', e.target.value)}
                required
                className="theme-input text-[11px] py-1 bg-white"
              />
              <input
                type="time"
                value={slot.timeEnd}
                onChange={(e) => onSlotChange(idx, 'timeEnd', e.target.value)}
                className="theme-input text-[11px] py-1 bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSlot}
        className="text-[9px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline text-left mt-0.5 cursor-pointer"
      >
        + Ajouter une date proposée
      </button>

      <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-dashed border-[var(--theme-border-color,#181716)]/15">
        <label className="text-[9px] uppercase font-bold tracking-wider">
          Restriction du vote
        </label>
        <select
          value={pollRestrictionType}
          onChange={(e) => {
            setPollRestrictionType(e.target.value);
            setPollTarget('');
          }}
          className="theme-input text-xs font-bold py-1 bg-white"
        >
          <option value="aucun">👥 Tous les membres</option>
          <option value="tag">🏷️ Par Étiquette (ex: C.A, Bureau)</option>
          <option value="instrument">🥁 Par Pupitre / Instrument</option>
        </select>
      </div>

      {pollRestrictionType === 'tag' && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider">Étiquette ciblée</label>
          <input
            type="text"
            value={pollTarget}
            onChange={(e) => setPollTarget(e.target.value)}
            placeholder="Ex: C.A, Bureau..."
            className="theme-input text-xs font-bold py-1 bg-white"
          />
        </div>
      )}

      {pollRestrictionType === 'instrument' && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider">Pupitre / Instrument ciblé</label>
          <select
            value={pollTarget}
            onChange={(e) => setPollTarget(e.target.value)}
            className="theme-input text-xs font-bold py-1 bg-white"
          >
            <option value="">-- Choisir l'instrument --</option>
            {['Alfaia', 'Caixa', 'Gonguê', 'Agbê', 'Mineiro', 'Timbal', 'Chant', 'Danse'].map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

