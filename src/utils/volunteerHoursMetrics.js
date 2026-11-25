import {
  consolidateVolunteerShifts,
  parseTimeMinutes,
  extractHorairesRange
} from './volunteerShiftUtils.js';

/**
 * Calcul pur des heures de créneaux bénévoles valorisables pour l'AG et le CERFA 12156-06.
 * Garantit zéro double comptage lorsqu'un membre est déjà compté `present` sur la plage de l'événement.
 */

const DEFAULT_FALLBACK_SHIFT_HOURS = 2.0;

function extractIsoDay(raw) {
  const s = String(raw || '').trim();
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}

function extractIsoTimeMinutes(raw) {
  const s = String(raw || '').trim();
  if (!s.includes('T')) return null;
  const timePart = s.split('T')[1]?.slice(0, 5) || '';
  return parseTimeMinutes(timePart);
}

function dayToLinearMinutes(dayStr) {
  const m = String(dayStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 60000);
}

export function calculateShiftDurationHours(shift = {}) {
  const parsed = extractHorairesRange(shift?.horaires);
  const startMin = parseTimeMinutes(shift?.heureDebut || parsed.heureDebut);
  const endMin = parseTimeMinutes(shift?.heureFin || parsed.heureFin);
  if (startMin === null || endMin === null) return DEFAULT_FALLBACK_SHIFT_HOURS;
  const diff = endMin > startMin ? endMin - startMin : (endMin + 1440) - startMin;
  return diff > 0 && diff <= 1440 ? diff / 60 : DEFAULT_FALLBACK_SHIFT_HOURS;
}

function resolveEventArtisticWindowLinear(event = {}, fallbackDurationHours = 4.0) {
  const startDay = extractIsoDay(event?.date || event?.dateDebut);
  const dayBase = dayToLinearMinutes(startDay);
  if (dayBase === null) return null;

  const startMin = parseTimeMinutes(event?.heureDebut) ?? extractIsoTimeMinutes(event?.date || event?.dateDebut);
  if (startMin === null) return null;
  const startLinear = dayBase + startMin;

  const endDay = extractIsoDay(event?.dateFin) || startDay;
  const endDayBase = dayToLinearMinutes(endDay);
  const endMin = parseTimeMinutes(event?.heureFin) ?? extractIsoTimeMinutes(event?.dateFin);

  if (endDayBase !== null && endMin !== null) {
    let endLinear = endDayBase + endMin;
    if (endLinear <= startLinear) endLinear += 1440;
    return [startLinear, endLinear];
  }
  return [startLinear, startLinear + Math.round((Number(fallbackDurationHours) || 4.0) * 60)];
}

export function calculateSingleEventShiftVolunteerHours(event = {}, fallbackEventDurationHours = 4.0) {
  const shifts = consolidateVolunteerShifts(event, event?.commissions || []);
  if (shifts.length === 0) return 0;

  const presentMemberUids = new Set(
    (event?.inscriptions || [])
      .filter((ins) => ins?.status === 'present' && (ins.userId || ins.uid))
      .map((ins) => String(ins.userId || ins.uid).trim())
  );

  const eventStartDay = extractIsoDay(event?.date || event?.dateDebut);
  const eventWindow = resolveEventArtisticWindowLinear(event, fallbackEventDurationHours);
  let totalHours = 0;

  shifts.forEach((shift) => {
    const inscrits = shift?.inscrits || [];
    if (inscrits.length === 0) return;

    const fullDuration = calculateShiftDurationHours(shift);
    const parsed = extractHorairesRange(shift?.horaires);
    const sStartMin = parseTimeMinutes(shift?.heureDebut || parsed.heureDebut);
    const sEndMin = parseTimeMinutes(shift?.heureFin || parsed.heureFin);
    const shiftDay = extractIsoDay(shift?.dateJour) || eventStartDay;
    const shiftDayBase = dayToLinearMinutes(shiftDay);

    inscrits.forEach((ins) => {
      const isPresentMember = ins?.type === 'member' && ins.uid && presentMemberUids.has(String(ins.uid).trim());
      if (!isPresentMember) {
        totalHours += fullDuration;
        return;
      }

      // Membre déjà compté `present` sur l'événement : ne créditer que la durée hors plage artistique
      if (sStartMin !== null && sEndMin !== null && shiftDayBase !== null && eventWindow) {
        const sStartLin = shiftDayBase + sStartMin;
        const sEndLin = sStartLin + (sEndMin > sStartMin ? sEndMin - sStartMin : (sEndMin + 1440) - sStartMin);
        const overlapMin = Math.max(0, Math.min(sEndLin, eventWindow[1]) - Math.max(sStartLin, eventWindow[0]));
        totalHours += Math.max(0, ((sEndLin - sStartLin) - overlapMin) / 60);
      } else if (shiftDay && eventStartDay && shiftDay !== eventStartDay) {
        totalHours += fullDuration;
      }
    });
  });

  return Math.round(totalHours * 10) / 10;
}

export function computeEventsVolunteerShiftHours(events = [], getEventDurationFn = null) {
  let sum = 0;
  (events || []).forEach((ev) => {
    const dur = typeof getEventDurationFn === 'function' ? getEventDurationFn(ev) : 4.0;
    sum += calculateSingleEventShiftVolunteerHours(ev, dur);
  });
  return Math.round(sum * 10) / 10;
}
