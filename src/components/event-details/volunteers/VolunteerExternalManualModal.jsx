import React, { useState, useEffect } from 'react';
import useModalEscape from '../../../hooks/useModalEscape';
import { normalizePublicVolunteerConfig } from '../../../utils/volunteerApplicationUtils';
import { isVolunteerShiftFull } from '../../../utils/volunteerShiftUtils';
import VolunteerLogisticFields from './VolunteerLogisticFields';

const EMPTY_FORM = {
  prenom: '', nom: '', telephone: '', email: '', lienAsso: '', disponibilitesNote: '',
  regimeAlimentaire: '', tailleTshirt: '', hasVehicle: false, vehicleDetails: '', isAdult: null
};

/**
 * Modale « + Ajouter un bénévole externe » pour les gestionnaires et référents.
 * Enregistre directement le bénévole en `status: 'accepted'` et le synchronise sur les créneaux.
 */
export default function VolunteerExternalManualModal({
  isOpen = false, initialShiftIds = [], event = null, manageableShifts = [], saving = false, onClose, onSubmitExternal, tr
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  useModalEscape(isOpen, onClose, saving);

  useEffect(() => {
    if (isOpen) setSelectedShiftIds(Array.isArray(initialShiftIds) ? initialShiftIds.filter(Boolean) : []);
  }, [isOpen, initialShiftIds]);

  if (!isOpen) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const cfg = normalizePublicVolunteerConfig(event?.publicVolunteerConfig);
  const isValid = Boolean(form.prenom.trim() && form.nom.trim() && form.telephone.trim() && selectedShiftIds.length > 0);

  const toggleShift = (id) => setSelectedShiftIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || saving) return;
    const ok = await onSubmitExternal(form, selectedShiftIds);
    if (ok) { setForm(EMPTY_FORM); setSelectedShiftIds([]); onClose(); }
  };

  return (
    <div
      role="dialog" aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">
            🤝 {t('agenda.volunteerExternalManualTitle') || 'Ajouter un bénévole externe confirmé'}
          </h4>
          <button type="button" onClick={onClose} disabled={saving} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2.5 text-xs max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerGuestFirstName') || 'Prénom'} *</label>
              <input type="text" required value={form.prenom} disabled={saving} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="theme-input py-1 px-2 text-xs" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerGuestLastName') || 'Nom'} *</label>
              <input type="text" required value={form.nom} disabled={saving} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="theme-input py-1 px-2 text-xs" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerGuestPhone') || 'Téléphone (contact Jour J)'} *</label>
              <input type="tel" required value={form.telephone} disabled={saving} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="theme-input py-1 px-2 text-xs" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerExternalEmail') || 'E-mail (optionnel)'}</label>
              <input type="email" value={form.email} disabled={saving} onChange={(e) => setForm({ ...form, email: e.target.value })} className="theme-input py-1 px-2 text-xs" />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerExternalRelationLabel') || "De la part de qui / Lien avec l'asso"}</label>
            <input type="text" value={form.lienAsso} disabled={saving} placeholder={t('agenda.volunteerExternalRelationPlaceholder') || 'Ex. : Ami de la présidente, voisin...'} onChange={(e) => setForm({ ...form, lienAsso: e.target.value })} className="theme-input py-1 px-2 text-xs" />
          </div>

          <VolunteerLogisticFields config={cfg} form={form} onChange={setForm} disabled={saving} tr={tr} />

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerSelectShiftsLabel') || 'Sélectionner le(s) créneau(x) à affecter'} *</label>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
              {manageableShifts.map((sh) => {
                const checked = selectedShiftIds.includes(sh.id), full = isVolunteerShiftFull(sh), q = Number(sh.quotaRequis) || 0;
                return (
                  <label key={sh.id} className="flex items-center justify-between gap-2 p-1.5 rounded border border-[var(--theme-border)]/25 bg-[var(--theme-input-bg)] cursor-pointer">
                    <span className="flex items-center gap-2 min-w-0 truncate">
                      <input type="checkbox" checked={checked} onChange={() => toggleShift(sh.id)} className="accent-[var(--color-cordel-vert)]" />
                      <span className="font-bold truncate">{sh.nomTache}</span>
                      <span className="text-[10px] opacity-70 truncate">{sh.horaires || ''}</span>
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white shrink-0 ${full ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'}`}>
                      {q > 0 ? `${sh.inscrits?.length || 0}/${q}` : (sh.inscrits?.length || 0)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
            <button type="button" onClick={onClose} disabled={saving} className="px-3 py-1.5 rounded border border-[var(--theme-border)]/40 text-xs font-bold cursor-pointer">{t('agenda.btnCancel') || 'Annuler'}</button>
            <button type="submit" disabled={!isValid || saving} className="px-3.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-xs font-black uppercase disabled:opacity-40 cursor-pointer">
              {saving ? '...' : `＋ ${t('agenda.volunteerSaveExternalBtn') || 'Enregistrer et affecter'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
