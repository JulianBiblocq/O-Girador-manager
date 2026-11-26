/**
 * Sous-composant d'édition du module Bénévolat d'un événement dans le tiroir avancé :
 * interrupteur `enableVolunteers`, référents bénévoles Jour J (`volunteerReferentIds`),
 * postes/créneaux et configuration de l'appel public Mostrador.
 */

import React from 'react';
import VolunteerShiftFormCard from './VolunteerShiftFormCard';
import VolunteerPublicCallConfigCard from './VolunteerPublicCallConfigCard';
import VolunteerReferentsSelector from './VolunteerReferentsSelector';
import { useEventCommissions } from '../../hooks/useEventCommissions';

export default function EventVolunteerShiftsEditor({
  formData,
  setFormData,
  allUsers = [],
  groupId = '',
  saving = false,
  tr
}) {
  const shifts = formData.volunteerShifts || [];
  const hasCommissions = Boolean(formData.hasCommissions);
  const eventId = formData.id || null;
  const { commissions } = useEventCommissions(hasCommissions && eventId ? eventId : null, formData);

  const eventDateJour = /^\d{4}-\d{2}-\d{2}/.test(String(formData.date || ''))
    ? String(formData.date).slice(0, 10)
    : '';

  const handleAddShift = () => {
    const newShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nomTache: '', label: '', dateJour: eventDateJour, heureDebut: '', heureFin: '',
      horaires: '', quotaRequis: 2, neededCount: 2, consigne: '', commissionId: null, commissionTitre: '', inscrits: []
    };
    setFormData((prev) => ({ ...prev, enableVolunteers: true, volunteerShifts: [...shifts, newShift] }));
  };

  const handleUpdateShift = (idx, updatedShift) => {
    const next = [...shifts];
    next[idx] = updatedShift;
    setFormData((prev) => ({ ...prev, volunteerShifts: next }));
  };

  const handleRemoveShift = (idx) => {
    setFormData((prev) => ({ ...prev, volunteerShifts: shifts.filter((_, sIdx) => sIdx !== idx) }));
  };

  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  return (
    <div className="border-t border-dashed border-[var(--theme-border)]/20 pt-3 flex flex-col gap-2.5">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(formData.enableVolunteers)}
            disabled={saving}
            onChange={(e) => setFormData((prev) => ({ ...prev, enableVolunteers: e.target.checked }))}
            className="w-4 h-4 accent-[var(--color-cordel-vert)] rounded cursor-pointer"
          />
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--color-cordel-rouge)] flex items-center gap-1">
            🤝 {t('agenda.volunteerSlots') || 'Créneaux Bénévoles'}
          </span>
        </label>
        <button
          type="button" onClick={handleAddShift} disabled={saving}
          className="text-[9px] font-black uppercase tracking-wider bg-[var(--theme-input-bg)] border border-[var(--theme-border)] px-2 py-1 rounded cursor-pointer"
        >
          ＋ {t('agenda.volunteerAddPostBtn') || 'Ajouter un poste'}
        </button>
      </div>

      <VolunteerReferentsSelector
        value={formData.volunteerReferentIds || []}
        onChange={(ids) => setFormData((prev) => ({ ...prev, volunteerReferentIds: ids }))}
        allUsers={allUsers}
        groupId={groupId || formData.groupId || ''}
        saving={saving}
        tr={tr}
      />

      <div className="flex flex-col gap-2">
        {shifts.length === 0 ? (
          <p className="text-[10px] italic opacity-60">
            {t('agenda.volunteerNoneConfigured') || 'Aucun créneau bénévole configuré.'}
          </p>
        ) : (
          shifts.map((shift, idx) => (
            <VolunteerShiftFormCard
              key={shift.id || idx} shift={shift} index={idx} eventDateJour={eventDateJour}
              hasCommissions={hasCommissions} commissions={commissions} saving={saving}
              onUpdate={handleUpdateShift} onRemove={handleRemoveShift} tr={tr}
            />
          ))
        )}
      </div>

      <VolunteerPublicCallConfigCard
        event={formData}
        config={formData.publicVolunteerConfig}
        onChange={(nextCfg) => setFormData((prev) => ({ ...prev, enableVolunteers: prev.enableVolunteers || Boolean(nextCfg?.enabled), publicVolunteerConfig: nextCfg }))}
        saving={saving}
        tr={tr}
      />
    </div>
  );
}
