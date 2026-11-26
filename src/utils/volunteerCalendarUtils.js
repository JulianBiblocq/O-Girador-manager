import { parseDateLinear, formatGoogleCalendarDate, buildGoogleCalendarUrl, openGoogleCalendar } from './calendarUtils.js';
import { parseTimeMinutes, normalizeHHMM, extractHorairesRange } from './volunteerShiftUtils.js';
import { resolveShiftDayOfContacts } from './volunteerMemoUtils.js';

/**
 * Export Google Agenda et fichier .ics (1 ou N VEVENT) des créneaux bénévoles.
 * Gère les créneaux de nuit passant minuit (J+1), le repli 2h et les contacts Jour J hors-ligne.
 */

export function addDaysToIsoDay(isoDay = '', days = 1) {
  const m = String(isoDay || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days)).toISOString().slice(0, 10);
}

export function resolveVolunteerShiftDates(shift = {}, event = {}, defaultDurationHours = 2) {
  const rawEventDate = String(event?.date || event?.dateDebut || '');
  const eventDay = /^\d{4}-\d{2}-\d{2}/.test(rawEventDate) ? rawEventDate.slice(0, 10) : '';
  const baseDay = /^\d{4}-\d{2}-\d{2}$/.test(String(shift?.dateJour || '')) ? shift.dateJour : eventDay;
  const parsedRange = extractHorairesRange(shift?.horaires);
  const hStart = normalizeHHMM(shift?.heureDebut || shift?.horaireDebut || parsedRange.heureDebut);
  const hEnd = normalizeHHMM(shift?.heureFin || shift?.horaireFin || parsedRange.heureFin);
  const durationMs = Math.max(0.5, Number(defaultDurationHours) || 2) * 3600 * 1000;

  if (baseDay && hStart) {
    const startLocalIso = `${baseDay}T${hStart}:00`;
    const startDate = parseDateLinear(startLocalIso);
    if (hEnd) {
      const sMins = parseTimeMinutes(hStart), eMins = parseTimeMinutes(hEnd);
      const crossesMidnight = sMins !== null && eMins !== null && eMins <= sMins;
      const endLocalIso = `${crossesMidnight ? addDaysToIsoDay(baseDay, 1) : baseDay}T${hEnd}:00`;
      return { startDate, endDate: parseDateLinear(endLocalIso), startLocalIso, endLocalIso, crossesMidnight };
    }
    return { startDate, endDate: new Date(startDate.getTime() + durationMs), startLocalIso, endLocalIso: '', crossesMidnight: false };
  }

  const fallbackTime = normalizeHHMM((rawEventDate.split('T')[1] || '').slice(0, 5)) || '18:00';
  const fallbackIso = baseDay ? `${baseDay}T${fallbackTime}:00` : rawEventDate;
  const startDate = parseDateLinear(fallbackIso);
  return { startDate, endDate: new Date(startDate.getTime() + durationMs), startLocalIso: fallbackIso || '', endLocalIso: '', crossesMidnight: false };
}

export function buildVolunteerShiftCalendarTitle(shift = {}, event = {}, { guestName = '' } = {}) {
  const task = String(shift?.nomTache || 'Bénévolat').trim();
  const guestSuffix = guestName ? ` (${String(guestName).trim()})` : '';
  return `🤝 ${task}${guestSuffix} — ${String(event?.titre || event?.title || 'Événement').trim()}`;
}

export function buildVolunteerShiftCalendarDescription(
  shift = {}, { event = {}, commissions = [], allUsers = [], guestName = '', eventUrl = '' } = {}
) {
  const lines = [`Commission : ${shift?.commissionTitre || 'Général'}`];
  if (guestName) lines.push(`Proche inscrit : ${guestName}`);
  if (shift?.horaires) lines.push(`Horaires : ${shift.horaires}`);
  if (shift?.consigne) lines.push(`Consigne : ${shift.consigne}`);

  const contacts = resolveShiftDayOfContacts(shift, { event, commissions, allUsers });
  if (contacts.length > 0) {
    lines.push(`Contact Jour J : ${contacts.map((c) => `${c.prenom}${c.nom ? ` ${c.nom}` : ''}${c.telephone ? ` (${c.telephone})` : ''}`).join(' / ')}`);
  }

  const resolvedUrl = String(eventUrl || '').trim() || (
    typeof window !== 'undefined' && window.location?.origin && event?.id
      ? `${window.location.origin}/?eventId=${encodeURIComponent(event.id)}&tab=volunteers`
      : (event?.id ? `https://organizador.o-girador.com/?eventId=${encodeURIComponent(event.id)}&tab=volunteers` : '')
  );
  if (resolvedUrl) lines.push(`Lien événement : ${resolvedUrl}`);
  return lines.join('\n');
}

export function buildVolunteerShiftGoogleCalendarUrl(shift = {}, options = {}) {
  const { event = {}, guestName = '' } = options;
  const { startDate, endDate } = resolveVolunteerShiftDates(shift, event);
  return buildGoogleCalendarUrl(
    { titre: buildVolunteerShiftCalendarTitle(shift, event, { guestName }), dateDebut: startDate, dateFin: endDate, lieu: event?.lieu || '' },
    { customDetails: buildVolunteerShiftCalendarDescription(shift, options) }
  );
}

export function openVolunteerShiftGoogleCalendar(shift = {}, options = {}) {
  const { event = {}, guestName = '' } = options;
  const { startDate, endDate } = resolveVolunteerShiftDates(shift, event);
  openGoogleCalendar(
    { titre: buildVolunteerShiftCalendarTitle(shift, event, { guestName }), dateDebut: startDate, dateFin: endDate, lieu: event?.lieu || '' },
    { customDetails: buildVolunteerShiftCalendarDescription(shift, options) }
  );
}

function escapeIcsText(raw = '') {
  return String(raw || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

export function buildVolunteerShiftsIcsContent(entries = [], options = {}) {
  const { event = {}, associationName = '' } = options;
  const prodName = String(associationName || 'O Girador').replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'O Girador';
  const uidDomain = prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'o-girador';
  const stamp = formatGoogleCalendarDate(new Date());
  const normalizedEntries = (entries || []).map((it) => (it?.shift ? it : { shift: it, guestName: '' })).filter((e) => e?.shift);

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${prodName}//Volunteer Shifts//FR`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  normalizedEntries.forEach(({ shift, guestName = '' }, idx) => {
    const { startDate, endDate } = resolveVolunteerShiftDates(shift, event);
    lines.push(
      'BEGIN:VEVENT',
      `UID:vol-${event?.id || 'evt'}-${shift.id || idx}-${guestName ? 'guest' : 'self'}@${uidDomain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatGoogleCalendarDate(startDate)}`,
      `DTEND:${formatGoogleCalendarDate(endDate)}`,
      `SUMMARY:${escapeIcsText(buildVolunteerShiftCalendarTitle(shift, event, { guestName }))}`,
      `DESCRIPTION:${escapeIcsText(buildVolunteerShiftCalendarDescription(shift, { ...options, guestName }))}`,
      `LOCATION:${escapeIcsText(event?.lieu || '')}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadVolunteerShiftsIcs(entries = [], options = {}) {
  const icsContent = buildVolunteerShiftsIcsContent(entries, options);
  if (typeof document === 'undefined') return icsContent;
  const safeTitle = String(options.filename || options.event?.titre || 'benevolat').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const url = URL.createObjectURL(new Blob([icsContent], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `${safeTitle}_creneaux.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  return icsContent;
}
