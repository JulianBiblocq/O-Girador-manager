import { resolveTypeEffectiveConfig } from './eventTypeConfigUtils';

/** Retourne la date locale courante au format YYYY-MM-DD (sans jamais utiliser l'heure courante). */
export function getTodayLocalDayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Détermine si le formulaire d'événement cible uniquement la Danse (sans Percussion). */
export function isDanceOnlyConfiguration(formData = {}) {
  const hasDance = formData.includesDance !== false;
  const noPercu = formData.includesPercussion === false || formData.niveauRequis === 'aucun';
  return Boolean(hasDance && noPercu);
}

/** Résout l'horaire type de début et de fin (Percussion/Général vs Danse uniquement) pour un type d'événement. */
export function resolveDefaultTimesForForm(formData = {}, eventTypeConfigs = {}) {
  const type = formData.type || 'repetition';
  const rawConfig = (eventTypeConfigs && eventTypeConfigs[type]) || {};
  const effective = resolveTypeEffectiveConfig(type, rawConfig);

  if (isDanceOnlyConfiguration(formData)) {
    return {
      startTime: effective.defaultDanceStartTime || '19:00',
      endTime: effective.defaultDanceEndTime || '20:00'
    };
  }
  return {
    startTime: effective.defaultStartTime || '20:00',
    endTime: effective.defaultEndTime || '22:00'
  };
}

/** Extrait la partie jour YYYY-MM-DD d'une chaîne ISO ou retourne la date du jour. */
export function extractDayPart(dateOrIsoStr) {
  const trimmed = String(dateOrIsoStr || '').trim();
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : getTodayLocalDayString();
}

/** Extrait la partie heure HH:mm d'une chaîne datetime-local (YYYY-MM-DDTHH:mm). */
export function extractTimePart(dateTimeStr) {
  const match = String(dateTimeStr || '').trim().match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

/** Construit le couple { date, dateFin } sur un jour donné avec les horaires types du formulaire. */
export function buildDefaultScheduleForDay(dayOrIsoStr, formData = {}, eventTypeConfigs = {}) {
  const dayPart = extractDayPart(dayOrIsoStr);
  const { startTime, endTime } = resolveDefaultTimesForForm(formData, eventTypeConfigs);
  return { date: `${dayPart}T${startTime}`, dateFin: `${dayPart}T${endTime}` };
}

/** Applique la bascule dynamique des horaires (Percussion <-> Danse ou changement de type). */
export function applyScheduleTransitionOnFormChange(prevForm = {}, nextForm = {}, eventTypeConfigs = {}) {
  const prevTimes = resolveDefaultTimesForForm(prevForm, eventTypeConfigs);
  const nextTimes = resolveDefaultTimesForForm(nextForm, eventTypeConfigs);
  if (prevTimes.startTime === nextTimes.startTime && prevTimes.endTime === nextTimes.endTime) return nextForm;

  const updated = { ...nextForm };
  const currentStartTime = extractTimePart(prevForm.date);
  const currentEndTime = extractTimePart(prevForm.dateFin);

  if (!prevForm.date || !currentStartTime || currentStartTime === prevTimes.startTime) {
    updated.date = `${extractDayPart(updated.date || prevForm.date)}T${nextTimes.startTime}`;
  }
  if (!prevForm.dateFin || !currentEndTime || currentEndTime === prevTimes.endTime) {
    updated.dateFin = `${extractDayPart(updated.dateFin || updated.date || prevForm.date)}T${nextTimes.endTime}`;
  }
  if (Array.isArray(updated.pollDates) && updated.pollDates.length > 0) {
    updated.pollDates = updated.pollDates.map((dStr) => {
      if (!dStr) return dStr;
      const tPart = extractTimePart(dStr);
      return (!tPart || tPart === prevTimes.startTime) ? `${extractDayPart(dStr)}T${nextTimes.startTime}` : dStr;
    });
  }
  return updated;
}

/** Calcule la date limite d'inscription d'un créneau en soustrayant N jours à sa dateDebut. */
export function computeRelativeDeadlineForSlot(slotDateStr, daysBefore = 7) {
  const trimmed = String(slotDateStr || '').trim();
  if (!trimmed) return '';
  const dayPart = extractDayPart(trimmed);
  const timePart = extractTimePart(trimmed) || '20:00';
  const [y, m, d] = dayPart.split('-').map(Number);
  if (!y || !m || !d) return '';

  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - Math.max(1, parseInt(daysBefore, 10) || 7));
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}T${timePart}`;
}

/** Résout la dateLimiteInscription effective d'un créneau selon registrationDeadlineMode ('none' | 'relative' | 'fixed'). */
export function resolveSlotRegistrationDeadline(slotDateStr, formData = {}) {
  const mode = formData.registrationDeadlineMode || (formData.dateLimiteInscription ? 'fixed' : 'none');
  if (mode === 'none') return '';
  if (mode === 'relative') return computeRelativeDeadlineForSlot(slotDateStr, formData.registrationDeadlineDaysBefore || 7);
  return formData.dateLimiteInscription || '';
}
