import React, { useState, useMemo } from 'react';
import useModalEscape from '../../../hooks/useModalEscape';
import { isMemberArchived } from '../../../utils/memberUtils';

/**
 * Modale d'affectation rapide en 2 clics depuis une ligne du Grand Tableau Synoptique :
 * 1. Candidatures externes en attente ou flexibles disponibles (affectation en 1 clic),
 * 2. Membre actif de l'association,
 * 3. Raccourcis d'ajout d'un externe manuel ou d'un proche sur ce créneau.
 */
export default function VolunteerSlotQuickAssignModal({
  shift = null,
  pendingApplications = [],
  acceptedApplications = [],
  allUsers = [],
  saving = false,
  onAssignApplicationToShift,
  onAddMemberByManager,
  onOpenManualExternalForShift,
  onOpenGuestForShift,
  onClose,
  tr
}) {
  const [selectedUid, setSelectedUid] = useState('');
  const isOpen = Boolean(shift);
  useModalEscape(isOpen, onClose, saving);

  const candidateApps = useMemo(() => {
    if (!shift) return [];
    const alreadyIds = new Set((shift.inscrits || []).filter((i) => i.type === 'external').map((i) => i.applicationId));
    const list = [
      ...(pendingApplications || []),
      ...(acceptedApplications || []).filter((a) => !alreadyIds.has(a.id) && (a.isFlexible || !(a.assignedShiftIds || []).includes(shift.id)))
    ];
    const seen = new Set();
    return list.filter((a) => {
      if (!a?.id || alreadyIds.has(a.id) || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [shift, pendingApplications, acceptedApplications]);

  const availableMembers = useMemo(() => {
    if (!shift) return [];
    const registeredUids = new Set((shift.inscrits || []).filter((i) => i.type === 'member').map((i) => i.uid));
    return (allUsers || [])
      .filter((u) => u && (u.id || u.uid) && !isMemberArchived(u) && !registeredUids.has(u.id || u.uid) && (u.prenom || u.nom || u.displayName))
      .map((u) => ({ id: String(u.id || u.uid), label: `${u.prenom || ''} ${u.nom || u.displayName || ''}`.trim() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [shift, allUsers]);

  if (!isOpen) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  const handleAssignApp = async (app) => {
    const nextIds = Array.from(new Set([...(app.assignedShiftIds || []), shift.id]));
    const ok = await onAssignApplicationToShift(app, nextIds);
    if (ok) onClose();
  };

  const handleAddMember = async () => {
    if (!selectedUid) return;
    const ok = await onAddMemberByManager(shift, selectedUid);
    if (ok) { setSelectedUid(''); onClose(); }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-left">
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">＋ {t('agenda.volunteerQuickAssignModalTitle') || 'Affecter sur ce créneau'}</h4>
            <p className="text-[10px] font-semibold opacity-80 truncate">{shift.nomTache} {shift.horaires ? `• ${shift.horaires}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-3 text-xs max-h-[78vh] overflow-y-auto">
          {candidateApps.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-ocre)]">
                📥 {t('agenda.volunteerQuickAssignCandidates') || 'Candidatures externes / flexibles disponibles'} ({candidateApps.length})
              </span>
              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
                {candidateApps.map((app) => {
                  const wantedHere = (app.requestedShiftIds || []).includes(shift.id);
                  return (
                    <div key={app.id} className="p-2 rounded border border-[var(--theme-border)]/30 bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold block truncate">{app.prenom} {app.nom} {app.isFlexible && '🔀'} {wantedHere && '⭐'}</span>
                        {app.disponibilitesNote && <span className="text-[10px] italic opacity-75 block truncate">{app.disponibilitesNote}</span>}
                      </div>
                      <button type="button" disabled={saving} onClick={() => handleAssignApp(app)} className="px-2.5 py-1 rounded bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase shrink-0 cursor-pointer">
                        ✓ {t('agenda.volunteerQuickAssignHereBtn') || 'Affecter'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {availableMembers.length > 0 && (
            <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-[var(--theme-border)]/20">
              <span className="text-[10px] font-black uppercase tracking-wider">{t('agenda.volunteerManagerAddMember') || 'Affecter un membre de la troupe'}</span>
              <div className="flex items-center gap-1.5">
                <select value={selectedUid} onChange={(e) => setSelectedUid(e.target.value)} className="theme-input py-1 px-2 text-xs flex-1">
                  <option value="">{t('agenda.volunteerSelectMemberPlaceholder') || 'Choisir un membre...'}</option>
                  {availableMembers.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <button type="button" disabled={!selectedUid || saving} onClick={handleAddMember} className="px-2.5 py-1 rounded bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase disabled:opacity-40 cursor-pointer">＋</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
            <button type="button" onClick={() => { onClose(); onOpenManualExternalForShift(shift); }} className="flex-1 px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--cordel-bg)] text-[10px] font-black uppercase cursor-pointer">
              🌐 ＋ {t('agenda.volunteerAddExternalShortBtn') || 'Externe manuel'}
            </button>
            <button type="button" onClick={() => { onClose(); onOpenGuestForShift(shift); }} className="flex-1 px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--cordel-bg)] text-[10px] font-black uppercase cursor-pointer">
              🤝 ＋ {t('agenda.volunteerAddGuestBtn') || 'Inscrire un proche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
