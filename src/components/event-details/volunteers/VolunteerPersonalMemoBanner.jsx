import React, { useMemo } from 'react';
import {
  extractUserPersonalMemoEntries,
  resolveShiftDayOfContacts
} from '../../../utils/volunteerMemoUtils';
import VolunteerCalendarExportMenu from './VolunteerCalendarExportMenu';

/**
 * Encart récapitulatif personnel « Mon Mémo Bénévole Jour J » côté membres.
 * Affiche ses créneaux + proches invités, le contact référent et l'export Google Agenda / .ics.
 */
export default function VolunteerPersonalMemoBanner({
  consolidatedShifts = [],
  currentUserUid = '',
  event = {},
  commissions = [],
  allUsers = [],
  associationName = '',
  tr
}) {
  const entries = useMemo(
    () => extractUserPersonalMemoEntries(consolidatedShifts, currentUserUid),
    [consolidatedShifts, currentUserUid]
  );

  const uniqueContacts = useMemo(() => {
    if (entries.length === 0) return [];
    const seen = new Set();
    const list = [];
    entries.forEach(({ shift }) => {
      resolveShiftDayOfContacts(shift, { event, commissions, allUsers }).forEach((c) => {
        const key = `${c.prenom}_${c.telephone}`.toLowerCase();
        if (!seen.has(key)) { seen.add(key); list.push(c); }
      });
    });
    return list;
  }, [entries, event, commissions, allUsers]);

  if (entries.length === 0) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const evtDay = String(event?.date || event?.dateDebut || '').slice(0, 10);

  return (
    <div className="p-3 rounded-lg bg-[var(--cordel-bg)] border-2 border-[var(--color-cordel-vert)] flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h5 className="text-[11px] font-black uppercase tracking-wider text-[var(--color-cordel-vert)] flex items-center gap-1.5">
          📌 {t('agenda.volunteerMyDayOfMemoTitle') || 'Mon Mémo Bénévole Jour J'} ({entries.length})
        </h5>
        {entries.length >= 2 && (
          <VolunteerCalendarExportMenu
            mode="bulk"
            entries={entries}
            event={event}
            commissions={commissions}
            allUsers={allUsers}
            associationName={associationName}
            tr={tr}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {entries.map(({ key, kind, guestName, shift }) => (
          <div key={key} className="p-2 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-[11px]">
                  ⏱️ {shift.dateJour && shift.dateJour !== evtDay ? `${shift.dateJour} • ` : ''}
                  {shift.horaires || (t('agenda.volunteerFreeSchedule') || 'Horaire libre')}
                </span>
                <span className="font-bold">— {shift.nomTache}</span>
                {shift.commissionTitre && (
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25">
                    {shift.commissionTitre}
                  </span>
                )}
                {kind === 'guest' && (
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30">
                    🤝 {t('agenda.volunteerMemoForGuestPrefix') || 'Proche inscrit'} : {guestName}
                  </span>
                )}
              </div>

              <VolunteerCalendarExportMenu
                mode="single"
                shift={shift}
                guestName={kind === 'guest' ? guestName : ''}
                event={event}
                commissions={commissions}
                allUsers={allUsers}
                associationName={associationName}
                tr={tr}
              />
            </div>
            {shift.consigne && <p className="text-[10px] italic opacity-80">💡 {shift.consigne}</p>}
          </div>
        ))}
      </div>

      {uniqueContacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-[var(--theme-border)]/20 text-[10.5px]">
          <span className="font-bold opacity-80">
            📞 {t('agenda.volunteerDayOfContactLabel') || "Contact Jour J en cas d'imprévu"} :
          </span>
          {uniqueContacts.map((c, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 font-bold">
              <span>{c.prenom}{c.role ? ` (${c.role})` : ''}</span>
              {c.telephone && (
                <a href={`tel:${c.telephone.replace(/\s+/g, '')}`} className="text-[var(--color-cordel-vert)] underline">
                  {c.telephone}
                </a>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
