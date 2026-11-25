import React, { useState } from 'react';
import useModalEscape from '../../../hooks/useModalEscape';

/**
 * Mini-modale Cordel d'inscription d'un proche non-adhérent sur un créneau bénévole.
 * Renseigne Prénom, Nom et Téléphone Jour J, rattachés au membre parrain connecté.
 */
export default function VolunteerGuestModal({
  shift = null,
  isOpen = false,
  saving = false,
  onClose,
  onSubmitGuest,
  tr
}) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');

  useModalEscape(isOpen, onClose, saving);

  if (!isOpen || !shift) return null;

  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const isValid = Boolean(prenom.trim() && nom.trim() && telephone.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || saving) return;
    const ok = await onSubmitGuest(shift, {
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim()
    });
    if (ok) {
      setPrenom('');
      setNom('');
      setTelephone('');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
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
              🤝 {t('agenda.volunteerGuestModalTitle') || 'Inscrire un proche en renfort'}
            </h4>
            <p className="text-[10px] opacity-75 truncate">{shift.nomTache} {shift.horaires ? `• ${shift.horaires}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 text-xs">
          <p className="text-[11px] opacity-80 leading-snug">
            {t('agenda.volunteerGuestPrivacyNote') || "Le numéro de téléphone ne sera visible que par vous, les référents de la commission et l'équipe d'organisation pour le Jour J."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerGuestFirstName') || 'Prénom'} *</label>
              <input
                type="text" required value={prenom} disabled={saving} autoFocus
                placeholder="Ex. : Julien"
                onChange={(e) => setPrenom(e.target.value)}
                className="theme-input py-1.5 px-2.5 text-xs w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerGuestLastName') || 'Nom'} *</label>
              <input
                type="text" required value={nom} disabled={saving}
                placeholder="Ex. : Martin"
                onChange={(e) => setNom(e.target.value)}
                className="theme-input py-1.5 px-2.5 text-xs w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold">{t('agenda.volunteerGuestPhone') || 'Téléphone (contact Jour J)'} *</label>
            <input
              type="tel" required value={telephone} disabled={saving}
              placeholder="Ex. : 06 12 34 56 78"
              onChange={(e) => setTelephone(e.target.value)}
              className="theme-input py-1.5 px-2.5 text-xs w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
            <button
              type="button" onClick={onClose} disabled={saving}
              className="px-3 py-1.5 rounded border border-[var(--theme-border)]/40 text-xs font-bold cursor-pointer"
            >
              {t('agenda.btnCancel') || 'Annuler'}
            </button>
            <button
              type="submit" disabled={!isValid || saving}
              className="px-3.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
            >
              {saving ? '...' : `＋ ${t('agenda.volunteerConfirmGuestBtn') || 'Inscrire ce proche'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
