/**
 * Sous-composant d'édition des créneaux bénévoles d'un événement dans le tiroir avancé
 * de EventFormFields.jsx.
 */

import React from 'react';

export default function EventVolunteerShiftsEditor({
  formData,
  setFormData,
  saving = false,
  tr
}) {
  const shifts = formData.volunteerShifts || [];

  const handleAddShift = () => {
    const newShifts = [...shifts, { label: '', horaires: '', neededCount: 1 }];
    setFormData((prev) => ({ ...prev, volunteerShifts: newShifts }));
  };

  const handleUpdateShift = (idx, field, value) => {
    const newShifts = [...shifts];
    newShifts[idx] = { ...newShifts[idx], [field]: value };
    setFormData((prev) => ({ ...prev, volunteerShifts: newShifts }));
  };

  const handleRemoveShift = (idx) => {
    const newShifts = shifts.filter((_, sIdx) => sIdx !== idx);
    setFormData((prev) => ({ ...prev, volunteerShifts: newShifts }));
  };

  return (
    <div className="border-t border-dashed border-[var(--theme-border-color,#181716)]/15 pt-3 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--color-cordel-rouge,#8b2a1a)] flex items-center gap-1">
          🤝 {typeof tr === 'function' ? tr('agenda.volunteerSlots') : 'Créneaux Bénévoles'}
        </h5>
        <button
          type="button"
          onClick={handleAddShift}
          disabled={saving}
          className="text-[9px] font-black uppercase tracking-wider bg-[var(--cordel-paper,#fffdf8)] border border-[var(--theme-border-color,#181716)] px-2 py-1 rounded cursor-pointer"
        >
          ＋ Ajouter un poste
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {shifts.length === 0 ? (
          <p className="text-[10px] italic opacity-60">Aucun créneau bénévole configuré.</p>
        ) : (
          shifts.map((shift, idx) => (
            <div key={idx} className="flex gap-2 items-end p-2 bg-[var(--cordel-bg,#f4ecd8)] border border-dashed border-[var(--theme-border-color,#181716)]/25 rounded relative">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold">Mission</label>
                <input
                  type="text"
                  value={shift.label}
                  placeholder="Accueil, Buvette..."
                  onChange={(e) => handleUpdateShift(idx, 'label', e.target.value)}
                  className="theme-input py-1 px-2 text-xs w-full"
                  required
                />
              </div>
              <div className="w-16 flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold">Besoin</label>
                <input
                  type="number"
                  min="1"
                  value={shift.neededCount}
                  onChange={(e) => handleUpdateShift(idx, 'neededCount', parseInt(e.target.value, 10) || 1)}
                  className="theme-input py-1 px-2 text-xs w-full text-center"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold">Horaires</label>
                <input
                  type="text"
                  value={shift.horaires}
                  placeholder="14:00 - 16:00"
                  onChange={(e) => handleUpdateShift(idx, 'horaires', e.target.value)}
                  className="theme-input py-1 px-2 text-xs w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveShift(idx)}
                className="text-[9.5px] font-black uppercase bg-[var(--color-cordel-rouge,#8b2a1a)] text-white border border-[var(--theme-border-color,#181716)] px-2 py-2 rounded cursor-pointer shrink-0"
                title="Supprimer ce créneau"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

