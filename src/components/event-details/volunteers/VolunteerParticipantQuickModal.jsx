import React from 'react';
import useModalEscape from '../../../hooks/useModalEscape';

/**
 * Fiche rapide de coordonnées et infos logistiques d'un Membre ou d'un Proche
 * ouverte au clic sur sa pastille dans le Grand Tableau Synoptique par un coordinateur.
 */
export default function VolunteerParticipantQuickModal({
  target = null,
  allUsers = [],
  onRemove,
  onClose,
  tr
}) {
  const isOpen = Boolean(target?.inscrit && target?.shift);
  useModalEscape(isOpen, onClose, false);
  if (!isOpen) return null;

  const { shift, inscrit } = target;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const isGuest = inscrit.type === 'guest';
  const member = !isGuest ? (allUsers || []).find((u) => u.id === inscrit.uid || u.uid === inscrit.uid) : null;
  const fullName = `${inscrit.prenom || member?.prenom || ''} ${inscrit.nom || member?.nom || ''}`.trim() || 'Bénévole';
  const phone = String(isGuest ? (inscrit.telephone || '') : (member?.telephone || member?.phone || '')).trim();
  const email = !isGuest ? String(member?.email || '').trim() : '';
  const diet = !isGuest
    ? [...(member?.dietaryRestrictions || []), member?.regimeAlimentaire || '', member?.allergies ? `Allergie : ${member.allergies}` : ''].filter(Boolean).join(' • ')
    : '';
  const tshirt = !isGuest ? String(member?.tailleTshirt || '').trim().toUpperCase() : '';

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-left">
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">
            {isGuest ? '🤝' : '👤'} {fullName}
          </h4>
          <button type="button" onClick={onClose} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 font-bold text-[10px]">
              {isGuest ? `${t('agenda.volunteerProfileGuest') || 'Proche'}${inscrit.parrainNom ? ` (${inscrit.parrainNom})` : ''}` : (t('agenda.volunteerProfileMember') || 'Membre')}
            </span>
            <span className="text-[10.5px] opacity-80 font-semibold">{shift.nomTache} {shift.horaires ? `(${shift.horaires})` : ''}</span>
          </div>

          {phone ? (
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="px-2.5 py-1.5 rounded bg-[var(--color-cordel-vert)] text-white font-black text-xs inline-flex items-center gap-1.5 self-start">
              📞 {phone}
            </a>
          ) : (
            <span className="text-[11px] italic opacity-65">{t('agenda.volunteerNoPhoneAvailable') || 'Aucun téléphone renseigné'}</span>
          )}

          {email && <a href={`mailto:${email}`} className="underline text-[11px]">✉️ {email}</a>}

          {(diet || tshirt) && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-dashed border-[var(--theme-border)]/20">
              {diet && <span className="px-2 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25 text-[10px] font-semibold">🍽️ {diet}</span>}
              {tshirt && <span className="px-2 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25 text-[10px] font-semibold">👕 {tshirt}</span>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
            {onRemove && (
              <button
                type="button"
                onClick={() => { onRemove(shift, inscrit); onClose(); }}
                className="px-3 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-rouge)] text-white text-[10px] font-black uppercase cursor-pointer"
              >
                ✕ {t('agenda.volunteerRemoveBtn') || 'Retirer du créneau'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
