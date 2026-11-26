/**
 * Détection rétrocompatible de l'activation du module Bénévoles sur un événement,
 * résolution des droits Coordinateurs Bénévoles Jour J et annuaire des contacts clés.
 */

export function normalizeVolunteerToken(raw = '') {
  return String(raw || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function extractCommissionReferentIds(commission = {}) {
  const raw = [
    ...(Array.isArray(commission?.referentsIds) ? commission.referentsIds : []),
    ...(Array.isArray(commission?.referentIds) ? commission.referentIds : []),
    ...(Array.isArray(commission?.referents) ? commission.referents : [])
  ];
  return Array.from(new Set(
    raw.map((it) => String(typeof it === 'string' ? it : (it?.id || it?.uid || '')).trim()).filter(Boolean)
  ));
}

export function isVolunteerCoordinatorCommission(commission = {}) {
  if (!commission || typeof commission !== 'object') return false;
  if (commission.isVolunteerCoordinator === true) return true;
  const norm = normalizeVolunteerToken(commission.titre || commission.title || '');
  return norm.includes('benevol') || norm.includes('voluntari');
}

export function hasActiveVolunteerModule(event = {}, commissions = []) {
  if (!event || typeof event !== 'object') return false;
  if (Boolean(event.enableVolunteers)) return true;
  if (Array.isArray(event.volunteerShifts) && event.volunteerShifts.length > 0) return true;
  if (Boolean(event.publicVolunteerConfig?.enabled)) return true;
  if (Array.isArray(commissions) && commissions.some((c) => Array.isArray(c?.creneauxBenevoles) && c.creneauxBenevoles.length > 0)) return true;
  return (!Array.isArray(commissions) || commissions.length === 0) && Array.isArray(event.publicCommissionShifts) && event.publicCommissionShifts.length > 0;
}

export function isEventVolunteerCoordinator({
  user = null, profileData = null, userUid = '', event = {}, commissions = [], canManageEvents = false
} = {}) {
  if (Boolean(canManageEvents)) return true;
  const role = String(profileData?.role || user?.role || '').toLowerCase();
  if (role === 'admin' || role === 'mestre' || profileData?.isMestre === true || user?.isMestre === true) return true;
  const uid = String(userUid || user?.uid || user?.id || profileData?.uid || profileData?.id || '').trim();
  if (!uid) return false;
  if (Array.isArray(event?.volunteerReferentIds) && event.volunteerReferentIds.includes(uid)) return true;
  return (commissions || []).some((c) => isVolunteerCoordinatorCommission(c) && extractCommissionReferentIds(c).includes(uid));
}

export function resolveVolunteerKeyContacts({
  event = {}, commissions = [], allUsers = [], includeCommissions = false
} = {}) {
  const usersById = {};
  (allUsers || []).forEach((u) => { if (u?.id) usersById[u.id] = u; if (u?.uid) usersById[u.uid] = u; });

  const toContact = (u, idFallback, category, roleLabel, icone = '🤝') => {
    if (!u) return null;
    const prenom = String(u.prenom || u.displayName || '').trim(), nom = String(u.nom || '').trim();
    const telephone = String(u.telephone || u.phone || '').trim();
    if (!prenom && !nom && !telephone) return null;
    const uid = String(u.id || u.uid || idFallback || '');
    return { key: `${category}_${uid}`, uid, prenom: prenom || 'Référent', nom, fullName: `${prenom} ${nom}`.trim() || 'Référent', telephone, category, roleLabel, icone };
  };

  const volunteerReferents = (Array.isArray(event?.volunteerReferentIds) ? event.volunteerReferentIds : [])
    .map((uid) => toContact(usersById[uid], uid, 'volunteer_referent', 'Référent Bénévoles', '🤝')).filter(Boolean);

  const volUids = new Set(volunteerReferents.map((c) => c.uid));
  const dayOfContacts = [];
  const cj = event?.contactsJourJ || {};
  if (cj.referentGroupeId && !volUids.has(cj.referentGroupeId)) {
    const grp = toContact(usersById[cj.referentGroupeId], cj.referentGroupeId, 'dayof_group', 'Accueil Jour J', '🎪');
    if (grp) dayOfContacts.push(grp);
  }
  if (cj.referentOrgaNom || cj.referentOrgaTel) {
    const nm = String(cj.referentOrgaNom || 'Organisation').trim();
    dayOfContacts.push({ key: 'dayof_orga', uid: '', prenom: nm, nom: '', fullName: nm, telephone: String(cj.referentOrgaTel || '').trim(), category: 'dayof_orga', roleLabel: 'Organisateur Jour J', icone: '📞' });
  }

  const commissionReferents = [];
  if (includeCommissions) {
    const shiftCommIds = new Set((event?.volunteerShifts || []).map((s) => s?.commissionId).filter(Boolean));
    (commissions || []).forEach((comm) => {
      if (!((Array.isArray(comm?.creneauxBenevoles) && comm.creneauxBenevoles.length > 0) || shiftCommIds.has(comm?.id))) return;
      extractCommissionReferentIds(comm).forEach((uid) => {
        const c = toContact(usersById[uid], uid, 'commission_referent', comm.titre || 'Commission', comm.icone || '📋');
        if (c) commissionReferents.push({ ...c, key: `comm_${comm.id}_${uid}` });
      });
    });
  }

  return { volunteerReferents, dayOfContacts, commissionReferents, allContacts: [...volunteerReferents, ...dayOfContacts, ...commissionReferents] };
}
