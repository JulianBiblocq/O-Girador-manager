import React, { useState } from 'react';
import {
  openVolunteerShiftGoogleCalendar,
  downloadVolunteerShiftsIcs
} from '../../../utils/volunteerCalendarUtils';

/**
 * Menu compact d'export d'un ou plusieurs créneaux bénévoles vers Google Agenda
 * et Apple / Outlook (.ics autonome hors réseau avec consigne et téléphone référent).
 */
export default function VolunteerCalendarExportMenu({
  mode = 'single',
  shift = null,
  guestName = '',
  entries = [],
  event = {},
  commissions = [],
  allUsers = [],
  associationName = '',
  tr
}) {
  const [open, setOpen] = useState(false);
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const ctxOptions = { event, commissions, allUsers, associationName };

  if (mode === 'bulk') {
    if (!Array.isArray(entries) || entries.length < 2) return null;
    return (
      <button
        type="button"
        onClick={() => downloadVolunteerShiftsIcs(entries, ctxOptions)}
        className="px-2.5 py-1 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
      >
        📅 {t('agenda.volunteerAddAllShiftsIcsBtn') || 'Ajouter tous mes créneaux (.ics)'}
      </button>
    );
  }

  if (!shift) return null;

  return (
    <div className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="px-2 py-0.5 rounded border border-[var(--theme-border)]/45 bg-[var(--cordel-bg)] hover:bg-[var(--theme-hover-bg)] text-[9.5px] font-black cursor-pointer inline-flex items-center gap-1"
      >
        <span>📅 {t('agenda.volunteerCalendarBtnShort') || 'Agenda'} ▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[6px_9px_6px_8px] shadow-[3px_3px_0px_0px_var(--theme-border)] py-1 z-50 flex flex-col text-[10px]">
            <button
              type="button"
              onClick={() => {
                openVolunteerShiftGoogleCalendar(shift, { ...ctxOptions, guestName });
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 font-black text-left hover:bg-[var(--theme-hover-bg)] cursor-pointer flex items-center gap-1.5"
            >
              <span>🔵</span>
              <span>{t('agenda.volunteerCalendarGoogle') || 'Google Agenda'}</span>
            </button>
            <div className="border-t border-dashed border-[var(--theme-border)]/20 my-0.5" />
            <button
              type="button"
              onClick={() => {
                downloadVolunteerShiftsIcs([{ shift, guestName }], ctxOptions);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 font-black text-left hover:bg-[var(--theme-hover-bg)] cursor-pointer flex items-center gap-1.5"
            >
              <span>🍏</span>
              <span>{t('agenda.volunteerCalendarIcs') || 'Apple & Outlook (.ics)'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
