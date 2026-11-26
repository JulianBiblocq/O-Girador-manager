import {
  parseTimeMinutes,
  extractHorairesRange,
  computeVolunteerCoverage,
  isVolunteerShiftFull
} from './volunteerShiftUtils.js';
import { normalizeVolunteerToken } from './volunteerCoordinatorUtils.js';

/**
 * Utilitaires purs du Grand Tableau Synoptique des créneaux bénévoles :
 * calcul de durée (y compris passage minuit), jauges Cordel, KPIs dédoublonnés, filtres et tris.
 */

export function computeShiftDurationMinutes(shift = {}) {
  const parsed = extractHorairesRange(shift?.horaires);
  const startMins = parseTimeMinutes(shift?.heureDebut || parsed.heureDebut);
  const endMins = parseTimeMinutes(shift?.heureFin || parsed.heureFin);
  if (startMins === null || endMins === null) return null;
  return endMins <= startMins ? (endMins + 1440 - startMins) : (endMins - startMins);
}

export function formatShiftDurationLabel(shift = {}) {
  const mins = computeShiftDurationMinutes(shift);
  if (mins === null || mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

export function getShiftRemainingPlaces(shift = {}) {
  const quota = Number(shift?.quotaRequis) || 0;
  const count = shift?.inscrits?.length || 0;
  return quota > 0 ? Math.max(0, quota - count) : 0;
}

export function getShiftGaugeStatus(shift = {}) {
  const quota = Number(shift?.quotaRequis) || 0;
  const count = shift?.inscrits?.length || 0;
  if (count === 0) return 'empty';
  if (quota > 0 && count >= quota) return 'full';
  if (quota > 0 && count < quota) return 'partial';
  return 'open';
}

export function countUniqueVolunteersInShifts(shifts = []) {
  const seen = new Set();
  (shifts || []).forEach((sh) => {
    (sh?.inscrits || []).forEach((ins) => {
      if (!ins) return;
      if (ins.type === 'external') {
        seen.add(`ext:${ins.applicationId || normalizeVolunteerToken(`${ins.prenom}_${ins.nom}`)}`);
      } else if (ins.type === 'guest') {
        seen.add(`guest:${ins.parrainUid || ''}_${normalizeVolunteerToken(`${ins.prenom}_${ins.nom}`)}`);
      } else {
        seen.add(`mem:${ins.uid || ins.id || normalizeVolunteerToken(`${ins.prenom}_${ins.nom}`)}`);
      }
    });
  });
  return seen.size;
}

export function computeSynopticKpis(shifts = [], { pendingApplications = [], acceptedApplications = [] } = {}) {
  const cov = computeVolunteerCoverage(shifts);
  const remainingPlaces = (shifts || []).reduce((acc, s) => acc + getShiftRemainingPlaces(s), 0);
  const uniqueVolunteersCount = countUniqueVolunteersInShifts(shifts);
  const pendingFlex = (pendingApplications || []).filter((a) => Boolean(a?.isFlexible)).length;
  const unassignedAcceptedFlex = (acceptedApplications || []).filter(
    (a) => Boolean(a?.isFlexible) && (!Array.isArray(a?.assignedShiftIds) || a.assignedShiftIds.length === 0)
  ).length;

  return {
    shiftsCount: cov.shiftsCount,
    filledPosts: cov.filledPosts,
    totalRequired: cov.totalRequired,
    totalInscrits: cov.totalInscrits,
    remainingPlaces,
    uniqueVolunteersCount,
    flexiblesToPlaceCount: pendingFlex + unassignedAcceptedFlex,
    isComplete: cov.isComplete
  };
}

function compareChronological(a, b) {
  const dCmp = String(a?.dateJour || '9999-99-99').localeCompare(String(b?.dateJour || '9999-99-99'));
  if (dCmp !== 0) return dCmp;
  const hCmp = String(a?.heureDebut || '99:99').localeCompare(String(b?.heureDebut || '99:99'));
  if (hCmp !== 0) return hCmp;
  return String(a?.nomTache || '').localeCompare(String(b?.nomTache || ''));
}

function computeUnfilledPriority(shift) {
  const quota = Number(shift?.quotaRequis) || 0;
  const count = shift?.inscrits?.length || 0;
  if (quota > 0 && count === 0) return { bucket: 0, ratio: 0, missing: quota };
  if (quota > 0 && count < quota) return { bucket: 1, ratio: count / quota, missing: quota - count };
  if (quota === 0 && count === 0) return { bucket: 2, ratio: 0, missing: 0 };
  return { bucket: 3, ratio: 1, missing: 0 };
}

export function filterAndSortSynopticShifts(
  shifts = [],
  { dayFilter = 'all', commissionFilter = 'all', searchQuery = '', sortBy = 'chronological' } = {}
) {
  const normQuery = normalizeVolunteerToken(searchQuery);
  const filtered = (shifts || []).filter((sh) => {
    if (dayFilter !== 'all' && sh.dateJour !== dayFilter) return false;
    if (commissionFilter === 'general' && Boolean(sh.commissionId)) return false;
    if (commissionFilter !== 'all' && commissionFilter !== 'general' && sh.commissionId !== commissionFilter) return false;
    if (normQuery) {
      const inscritsTxt = (sh.inscrits || []).map((i) => `${i.prenom || ''} ${i.nom || ''}`).join(' ');
      const haystack = normalizeVolunteerToken(`${sh.nomTache || ''} ${sh.consigne || ''} ${sh.commissionTitre || ''} ${inscritsTxt}`);
      if (!haystack.includes(normQuery)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'unfilled_first') {
      const pa = computeUnfilledPriority(a), pb = computeUnfilledPriority(b);
      if (pa.bucket !== pb.bucket) return pa.bucket - pb.bucket;
      if (pa.ratio !== pb.ratio) return pa.ratio - pb.ratio;
      if (pa.missing !== pb.missing) return pb.missing - pa.missing;
      if (isVolunteerShiftFull(a) !== isVolunteerShiftFull(b)) return isVolunteerShiftFull(a) ? 1 : -1;
    }
    return compareChronological(a, b);
  });
}
