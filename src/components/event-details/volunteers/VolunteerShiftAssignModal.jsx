import React, { useState, useEffect } from 'react';
import useModalEscape from '../../../hooks/useModalEscape';
import { isVolunteerShiftFull } from '../../../utils/volunteerShiftUtils';

/**
 * Modale légère d'affectation d'un candidat externe (Poste flexible ou créneau initial complet)
 * sur un ou plusieurs créneaux bénévoles disponibles avec affichage des quotas X/Y.
 */
export default function VolunteerShiftAssignModal({
  application = null,
  manageableShifts = [],
  saving = false,
  onClose,
  onConfirmAssign,
  tr
}) {
  const isOpen = Boolean(application);
  const [selectedIds, setSelectedIds] = useState([]);
  useModalEscape(isOpen, onClose, saving);

  useEffect(() => {
    if (!application) { setSelectedIds([]); return; }
    const preselected = (application.requestedShiftIds || []).filter((sid) => {
      const sh = manageableShifts.find((s) => s.id === sid);
      return Boolean(sh && !isVolunteerShiftFull(sh));
    });
    setSelectedIds(preselected);
  }, [application, manageableShifts]);

  if (!isOpen) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const fullName = `${application.prenom || ''} ${application.nom || ''}`.trim();

  const toggleShift = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0 || saving) return;
    const ok = await onConfirmAssign(application, selectedIds);
    if (ok) onClose();
  };

  return (
    <div
      role="dialog" aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="w-full max-w-md bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">
              🔀 {t('agenda.volunteerAssignShiftsBtn') || 'Affecter / Choisir poste(s)'}
            </h4>
            <p className="text-[10px] opacity-80 truncate">{fullName}{application.disponibilitesNote ? ` • ${application.disponibilitesNote}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {t('agenda.volunteerSelectShiftsLabel') || 'Sélectionner le(s) créneau(x) à affecter'} :
          </span>

          {manageableShifts.length === 0 ? (
            <p className="text-xs italic opacity-70 py-2">
              {t('agenda.volunteerNoShiftAvailable') || "Créez d'abord au moins un créneau bénévole pour affecter ce renfort."}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
              {manageableShifts.map((sh) => {
                const full = isVolunteerShiftFull(sh);
                const checked = selectedIds.includes(sh.id);
                const count = sh.inscrits?.length || 0;
                const quota = Number(sh.quotaRequis) || 0;
                return (
                  <label
                    key={sh.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded border cursor-pointer ${
                      checked ? 'bg-[var(--cordel-bg)] border-[var(--color-cordel-vert)]' : 'bg-[var(--theme-input-bg)] border-[var(--theme-border)]/30'
                    } ${full && !checked ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox" checked={checked} disabled={saving || (full && !checked)}
                        onChange={() => toggleShift(sh.id)}
                        className="w-3.5 h-3.5 accent-[var(--color-cordel-vert)] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold block truncate">{sh.nomTache}</span>
                        <span className="text-[10px] opacity-75 block truncate">
                          {sh.commissionTitre ? `${sh.commissionTitre} • ` : ''}{sh.horaires || (t('agenda.volunteerFreeSchedule') || 'Horaire libre')}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded border border-[var(--theme-border)] text-white shrink-0 ${
                      full ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'
                    }`}>
                      {quota > 0 ? `${count}/${quota}` : count}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
            <button type="button" onClick={onClose} disabled={saving} className="px-3 py-1.5 rounded border border-[var(--theme-border)]/40 text-xs font-bold cursor-pointer">
              {t('agenda.btnCancel') || 'Annuler'}
            </button>
            <button
              type="submit" disabled={selectedIds.length === 0 || saving}
              className="px-3.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
            >
              {saving ? '...' : `✅ ${t('agenda.volunteerConfirmAssignBtn') || 'Valider et affecter'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
