import { normalizeVolunteerShift } from './volunteerShiftUtils.js';

/**
 * Utilitaires purs de la page publique d'appel à bénévoles (`/benevoles/:eventId`) :
 * - Extraction structurelle sans fuite des créneaux de commissions (`publicCommissionShifts`)
 * - Calcul 100 % anonyme des places restantes (zéro nom/prénom/coordonnée exposé)
 * - Validation du formulaire public (créneau précis vs `isFlexible`, socle, RGPD, honeypot)
 * - Construction de l'URL canonique de partage (domaine personnalisé vs Mostrador vs localhost)
 */

export function buildPublicCommissionShifts(commissions = [], eventDateJour = '') {
  const list = [];
  (commissions || []).forEach((comm) => {
    if (!comm?.id) return;
    (comm.creneauxBenevoles || []).forEach((raw, idx) => {
      const norm = normalizeVolunteerShift(raw, {
        index: idx,
        eventDateJour,
        commissionId: comm.id,
        commissionTitre: comm.titre || ''
      });
      list.push({
        id: norm.id,
        nomTache: norm.nomTache,
        dateJour: norm.dateJour,
        heureDebut: norm.heureDebut,
        heureFin: norm.heureFin,
        horaires: norm.horaires,
        quotaRequis: norm.quotaRequis,
        consigne: norm.consigne,
        commissionId: norm.commissionId,
        commissionTitre: norm.commissionTitre
      });
    });
  });
  return list;
}

export function computePublicAnonymousShifts(event = {}) {
  const rawDate = String(event?.date || event?.dateDebut || '');
  const eventDateJour = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : '';
  const ssotInscritsMap = event?.covoiturage?.benevolatInscrits || null;
  const byId = new Map();

  const registerShift = (rawShift, idx) => {
    const norm = normalizeVolunteerShift(rawShift, { index: idx, eventDateJour, ssotInscritsMap });
    if (byId.has(norm.id)) return;
    const inscritsCount = norm.inscrits.length;
    const quotaRequis = Number(norm.quotaRequis) || 0;
    const remaining = quotaRequis > 0 ? Math.max(0, quotaRequis - inscritsCount) : null;
    byId.set(norm.id, {
      id: norm.id,
      nomTache: norm.nomTache,
      dateJour: norm.dateJour,
      heureDebut: norm.heureDebut,
      heureFin: norm.heureFin,
      horaires: norm.horaires,
      quotaRequis,
      consigne: norm.consigne,
      commissionId: norm.commissionId,
      commissionTitre: norm.commissionTitre,
      inscritsCount,
      remaining,
      isFull: quotaRequis > 0 && remaining === 0
    });
  };

  (event?.volunteerShifts || []).forEach((s, i) => registerShift(s, i));
  (event?.publicCommissionShifts || []).forEach((s, i) => registerShift(s, i));

  return Array.from(byId.values()).sort((a, b) => {
    const dCmp = (a.dateJour || eventDateJour || '9999-99-99').localeCompare(b.dateJour || eventDateJour || '9999-99-99');
    return dCmp !== 0 ? dCmp : (a.heureDebut || '99:99').localeCompare(b.heureDebut || '99:99');
  });
}

export function validatePublicVolunteerSubmission(form = {}, { honeypot = '' } = {}) {
  const errors = [];
  if (String(honeypot || '').trim() !== '') errors.push('HONEYPOT_SPAM');
  if (!String(form.prenom || '').trim()) errors.push('MISSING_FIRST_NAME');
  if (!String(form.nom || '').trim()) errors.push('MISSING_LAST_NAME');
  const email = String(form.email || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('INVALID_EMAIL');
  if (!String(form.telephone || '').trim()) errors.push('MISSING_PHONE');
  if (!String(form.lienAsso || '').trim()) errors.push('MISSING_RELATION');
  const hasShifts = Array.isArray(form.requestedShiftIds) && form.requestedShiftIds.filter(Boolean).length > 0;
  if (!form.isFlexible && !hasShifts) errors.push('MISSING_SHIFT_OR_FLEXIBLE');
  if (form.rgpdConsent !== true) errors.push('MISSING_RGPD_CONSENT');
  return { valid: errors.length === 0, errors };
}

export function buildPublicVolunteerCallUrl({
  eventId,
  groupId = '',
  associationSettings = {},
  origin = '',
  hostname = '',
  isDemo = false
} = {}) {
  const eid = encodeURIComponent(String(eventId || '').trim());
  const gid = String(groupId || associationSettings?.id || associationSettings?.groupId || '').trim();
  const effHost = String(hostname || '').trim().toLowerCase() || (origin ? new URL(origin).hostname.toLowerCase() : '');
  const isLocal = effHost === 'localhost' || effHost === '127.0.0.1';

  if (isDemo) {
    const base = origin ? origin.replace(/\/+$/, '') : '';
    return `${base}/benevoles/${eid}?demo=true${gid ? `&groupe=${encodeURIComponent(gid)}` : ''}`;
  }
  if (isLocal) {
    const base = (origin || 'http://localhost:5175').replace(/\/+$/, '');
    return `${base}/benevoles/${eid}${gid ? `?groupe=${encodeURIComponent(gid)}` : ''}`;
  }

  const rawCustom = (typeof associationSettings?.customDomain === 'string' && associationSettings.customDomain.trim())
    || (Array.isArray(associationSettings?.customDomains) && typeof associationSettings.customDomains[0] === 'string' ? associationSettings.customDomains[0].trim() : '');
  if (rawCustom) {
    const cleanDomain = rawCustom.replace(/\/+$/, '');
    const domainOrigin = /^https?:\/\//i.test(cleanDomain) ? cleanDomain : `https://${cleanDomain}`;
    return `${domainOrigin}/benevoles/${eid}`;
  }

  return `https://mostrador.o-girador.com/benevoles/${eid}${gid ? `?groupe=${encodeURIComponent(gid)}` : ''}`;
}

export function buildPublicVolunteerRelativeHref(event = {}, { isCustomDomain = false, isDemo = false } = {}) {
  const eid = encodeURIComponent(String(event?.id || '').trim());
  const gid = String(event?.groupId || '').trim();
  if (isDemo) return `/benevoles/${eid}?demo=true${gid ? `&groupe=${encodeURIComponent(gid)}` : ''}`;
  if (isCustomDomain) return `/benevoles/${eid}`;
  return `/benevoles/${eid}${gid ? `?groupe=${encodeURIComponent(gid)}` : ''}`;
}
