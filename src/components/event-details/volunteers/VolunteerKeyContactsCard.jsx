import React, { useMemo } from 'react';
import { resolveVolunteerKeyContacts } from '../../../utils/volunteerCoordinatorUtils';

/**
 * Annuaire dynamique des numéros utiles bénévoles Jour J (zéro double saisie) :
 * - mode `compact` : encart condensé 1 ligne pour les membres (Référent(s) Bénévoles + Accueil),
 * - mode complet : annuaire complet incluant les référents des commissions ayant des créneaux,
 * - mode `isPrintMode` : bloc A4 noir sur blanc pour `RoadbookVolunteersPrintSheet.jsx`.
 */
export default function VolunteerKeyContactsCard({
  event = {},
  commissions = [],
  allUsers = [],
  compact = false,
  isPrintMode = false,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const { volunteerReferents, dayOfContacts, commissionReferents, allContacts } = useMemo(
    () => resolveVolunteerKeyContacts({ event, commissions, allUsers, includeCommissions: !compact }),
    [event, commissions, allUsers, compact]
  );

  if (allContacts.length === 0) return null;

  if (isPrintMode) {
    return (
      <div className="border border-black p-1.5 rounded mb-2 text-[8.5px] leading-snug">
        <div className="font-black uppercase border-b border-black/40 pb-0.5 mb-1">
          📞 {t('agenda.volunteerKeyContactsTitle') || 'Numéros utiles — Coordination Bénévoles Jour J'}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {allContacts.map((c) => (
            <span key={c.key}>
              <strong>{c.roleLabel} :</strong> {c.fullName}{c.telephone ? ` (${c.telephone})` : ''}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    const primaryList = volunteerReferents.length > 0 ? volunteerReferents : dayOfContacts;
    if (primaryList.length === 0) return null;
    return (
      <div className="px-3 py-2 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-extrabold uppercase text-[10px] tracking-wider text-[var(--cordel-wood)]">
          📞 {t('agenda.volunteerKeyContactsCompactLabel') || 'Contact Bénévoles Jour J'} :
        </span>
        {primaryList.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1.5 font-bold">
            <span>{c.icone} {c.prenom}{c.nom ? ` ${c.nom.charAt(0)}.` : ''} <span className="opacity-70 text-[10px]">({c.roleLabel})</span></span>
            {c.telephone && (
              <a href={`tel:${c.telephone.replace(/\s+/g, '')}`} className="px-1.5 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white text-[10px] font-black">
                📞 {c.telephone}
              </a>
            )}
          </span>
        ))}
      </div>
    );
  }

  const renderGroup = (title, items) => items.length > 0 && (
    <div className="flex flex-col gap-1">
      <span className="text-[9.5px] uppercase font-extrabold tracking-wider opacity-75">{title}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
        {items.map((c) => (
          <div key={c.key} className="p-2 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/30 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="font-bold block truncate">{c.icone} {c.fullName}</span>
              <span className="text-[10px] opacity-75 block truncate">{c.roleLabel}</span>
            </div>
            {c.telephone ? (
              <a href={`tel:${c.telephone.replace(/\s+/g, '')}`} className="px-2 py-1 rounded bg-[var(--color-cordel-vert)] text-white text-[10px] font-black shrink-0">
                📞 {c.telephone}
              </a>
            ) : <span className="text-[10px] italic opacity-50">—</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-3 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/35 flex flex-col gap-2.5 text-left">
      <h5 className="text-[11px] font-black uppercase tracking-wider text-[var(--cordel-wood)]">
        📞 {t('agenda.volunteerKeyContactsTitle') || 'Numéros utiles — Coordination Bénévoles Jour J'}
      </h5>
      {renderGroup(t('agenda.volunteerReferentsGroupTitle') || 'Référent(s) Bénévoles de la date', volunteerReferents)}
      {renderGroup(t('agenda.volunteerDayOfGroupTitle') || 'Accueil & Organisation Jour J', dayOfContacts)}
      {renderGroup(t('agenda.volunteerCommissionRefsGroupTitle') || 'Référents des commissions avec créneaux', commissionReferents)}
    </div>
  );
}
