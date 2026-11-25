/**
 * Utilitaires purs pour l'appel public à bénévoles et le sas `volunteer_applications`.
 * Garantit zéro valeur `undefined`, le filtrage par périmètre référent et l'absence
 * totale de fuite de données personnelles sensibles dans le document `events`.
 */

export function normalizePublicVolunteerConfig(raw = {}, defaultWelcome = '') {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: Boolean(src.enabled),
    welcomeMessage: String(src.welcomeMessage ?? defaultWelcome ?? ''),
    askDietary: Boolean(src.askDietary),
    askTshirtSize: Boolean(src.askTshirtSize),
    askVehicle: Boolean(src.askVehicle),
    askAdultStatus: Boolean(src.askAdultStatus)
  };
}

export function normalizeVolunteerApplication(raw = {}, context = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const nowIso = String(context.nowIso || new Date().toISOString());
  const cleanIds = (arr) => (Array.isArray(arr) ? Array.from(new Set(arr.map((x) => String(x || '').trim()).filter(Boolean))) : []);
  const status = ['pending', 'accepted', 'rejected'].includes(src.status) ? src.status : 'pending';
  const source = ['public_form', 'manual_internal'].includes(src.source) ? src.source : 'public_form';

  return {
    groupId: String(src.groupId ?? context.groupId ?? '').trim(),
    eventId: String(src.eventId ?? context.eventId ?? '').trim(),
    status,
    source,
    prenom: String(src.prenom ?? '').trim(),
    nom: String(src.nom ?? '').trim(),
    email: String(src.email ?? '').trim(),
    telephone: String(src.telephone ?? '').trim(),
    lienAsso: String(src.lienAsso ?? '').trim(),
    isFlexible: Boolean(src.isFlexible),
    requestedShiftIds: cleanIds(src.requestedShiftIds),
    assignedShiftIds: cleanIds(src.assignedShiftIds),
    disponibilitesNote: String(src.disponibilitesNote ?? '').trim(),
    regimeAlimentaire: String(src.regimeAlimentaire ?? '').trim(),
    tailleTshirt: String(src.tailleTshirt ?? '').trim(),
    hasVehicle: Boolean(src.hasVehicle),
    vehicleDetails: String(src.vehicleDetails ?? '').trim(),
    isAdult: typeof src.isAdult === 'boolean' ? src.isAdult : null,
    createdAt: String(src.createdAt || nowIso),
    updatedAt: String(src.updatedAt || src.createdAt || nowIso),
    validatedByUid: String(src.validatedByUid ?? '').trim(),
    validatedByName: String(src.validatedByName ?? '').trim()
  };
}

export function resolveUserReferentCommissionIds(commissions = [], userUid = '') {
  const uid = String(userUid || '').trim();
  if (!uid) return [];
  return (commissions || [])
    .filter((c) => c?.id && (
      (Array.isArray(c.referentsIds) && c.referentsIds.includes(uid)) ||
      (Array.isArray(c.referentIds) && c.referentIds.includes(uid))
    ))
    .map((c) => c.id);
}

export function canAccessVolunteerApplications({ isGlobalManager = false, commissions = [], userUid = '' } = {}) {
  if (isGlobalManager) return true;
  return resolveUserReferentCommissionIds(commissions, userUid).length > 0;
}

export function resolveManageableShiftIds({ isGlobalManager = false, commissions = [], allShifts = [], userUid = '' } = {}) {
  if (isGlobalManager) return new Set((allShifts || []).map((s) => s.id).filter(Boolean));
  const refCommIds = new Set(resolveUserReferentCommissionIds(commissions, userUid));
  if (refCommIds.size === 0) return new Set();
  const ids = new Set();
  (allShifts || []).forEach((s) => { if (s?.id && s?.commissionId && refCommIds.has(s.commissionId)) ids.add(s.id); });
  (commissions || []).forEach((c) => {
    if (c?.id && refCommIds.has(c.id)) (c.creneauxBenevoles || []).forEach((cr) => { if (cr?.id) ids.add(cr.id); });
  });
  return ids;
}

export function filterApplicationsForViewer(applications = [], options = {}) {
  if (!canAccessVolunteerApplications(options)) return [];
  const sorted = [...(applications || [])].sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')));
  if (options.isGlobalManager) return sorted;
  const manageableIds = resolveManageableShiftIds(options);
  return sorted.filter((app) => (
    Boolean(app?.isFlexible) ||
    (app?.requestedShiftIds || []).some((sid) => manageableIds.has(sid)) ||
    (app?.assignedShiftIds || []).some((sid) => manageableIds.has(sid))
  ));
}

export function buildExternalShiftInscrit(applicationId, appData = {}) {
  const appId = String(applicationId || '').trim();
  return {
    id: `ext_${appId}`,
    type: 'external',
    applicationId: appId,
    prenom: String(appData?.prenom ?? '').trim(),
    nom: String(appData?.nom ?? '').trim(),
    lienAsso: String(appData?.lienAsso ?? '').trim()
  };
}

export function applyExternalAssignmentsToBenevolatMap(currentMap = {}, applicationId, appData = {}, targetShiftIds = []) {
  const appId = String(applicationId || '').trim();
  if (!appId) return { ...(currentMap || {}) };
  const targetSet = new Set((targetShiftIds || []).map((s) => String(s || '').trim()).filter(Boolean));
  const minimalEntry = buildExternalShiftInscrit(appId, appData);
  const nextMap = {};

  const allKeys = new Set([...Object.keys(currentMap || {}), ...targetSet]);
  allKeys.forEach((shiftId) => {
    const existing = Array.isArray(currentMap?.[shiftId]) ? currentMap[shiftId] : [];
    const withoutApp = existing.filter((it) => !(it?.applicationId === appId || it?.id === `ext_${appId}`));
    nextMap[shiftId] = targetSet.has(shiftId) ? [...withoutApp, minimalEntry] : withoutApp;
  });
  return nextMap;
}
