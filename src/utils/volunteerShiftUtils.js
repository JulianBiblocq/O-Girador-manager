/**
 * Modèle normalisé rétrocompatible, consolidation chronologique et détection de conflit scène
 * pour les créneaux bénévoles d'un événement et de ses commissions.
 */
const TIME_TOKEN_RE = /^(\d{1,2})(?::|h|H)(\d{2})?$/;
const RANGE_RE = /(\d{1,2}(?::|h|H)\d{0,2})\s*(?:-|–|—|à|a|->|➔)\s*(\d{1,2}(?::|h|H)\d{0,2})/g;
const SINGLE_TIME_RE = /\b(\d{1,2}(?::|h|H)\d{0,2})\b/g;

export function parseTimeMinutes(raw) {
  const m = String(raw || '').trim().match(TIME_TOKEN_RE);
  if (!m) return null;
  const hh = parseInt(m[1], 10), mm = m[2] ? parseInt(m[2], 10) : 0;
  return (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) ? hh * 60 + mm : null;
}

export function normalizeHHMM(raw) {
  const mins = parseTimeMinutes(raw);
  return mins === null ? '' : `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export function extractHorairesRange(horairesStr) {
  const m = RANGE_RE.exec(String(horairesStr || ''));
  RANGE_RE.lastIndex = 0;
  return m ? { heureDebut: normalizeHHMM(m[1]), heureFin: normalizeHHMM(m[2]) } : { heureDebut: '', heureFin: '' };
}

export function normalizeShiftInscrit(entry, idx = 0, usersMap = {}) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const uid = entry.trim();
    if (!uid) return null;
    const u = usersMap?.[uid];
    return { id: uid, type: 'member', uid, prenom: String(u?.prenom || (u ? '' : uid)).trim(), nom: String(u?.nom || u?.displayName || '').trim() };
  }
  if (typeof entry !== 'object') return null;
  if (entry.type === 'external' || Boolean(entry.applicationId)) {
    const appId = String(entry.applicationId || '').trim();
    return { id: String(entry.id || `ext_${appId || idx}`), type: 'external', applicationId: appId, prenom: String(entry.prenom || '').trim(), nom: String(entry.nom || '').trim(), lienAsso: String(entry.lienAsso || '').trim() };
  }
  if (entry.type === 'guest' || Boolean(entry.parrainUid)) {
    return { id: String(entry.id || `guest_${entry.parrainUid || 'x'}_${idx}`), type: 'guest', prenom: String(entry.prenom || '').trim(), nom: String(entry.nom || '').trim(), telephone: String(entry.telephone || '').trim(), parrainUid: String(entry.parrainUid || '').trim(), parrainNom: String(entry.parrainNom || '').trim() };
  }
  const uid = String(entry.uid || entry.userId || entry.id || '').trim(), u = uid ? usersMap?.[uid] : null;
  return { id: String(entry.id || uid || `member_${idx}`), type: 'member', uid, prenom: String(entry.prenom ?? u?.prenom ?? '').trim(), nom: String(entry.nom ?? u?.nom ?? u?.displayName ?? '').trim() };
}

export function normalizeVolunteerShift(rawShift = {}, options = {}) {
  const { index = 0, eventDateJour = '', commissionId = null, commissionTitre = '', ssotInscritsMap = null, usersMap = {} } = options;
  const resolvedCommId = rawShift.commissionId || commissionId || null;
  const id = String(rawShift.id || `shift_${resolvedCommId || 'evt'}_${index}`);
  const nomTache = String(rawShift.nomTache ?? rawShift.label ?? rawShift.role ?? rawShift.titre ?? rawShift.poste ?? '').trim();
  const parsed = extractHorairesRange(rawShift.horaires);
  const heureDebut = normalizeHHMM(rawShift.heureDebut || rawShift.horaireDebut || parsed.heureDebut);
  const heureFin = normalizeHHMM(rawShift.heureFin || rawShift.horaireFin || parsed.heureFin);
  const horaires = (heureDebut && heureFin) ? `${heureDebut} - ${heureFin}` : (String(rawShift.horaires || '').trim() || heureDebut);
  const rawQuota = rawShift.quotaRequis !== undefined ? rawShift.quotaRequis : (rawShift.neededCount ?? rawShift.nbPlaces ?? rawShift.places ?? 0);
  const quotaRequis = (rawQuota === null || rawQuota === '') ? 0 : Math.max(0, parseInt(rawQuota, 10) || 0);
  const srcList = (ssotInscritsMap && Array.isArray(ssotInscritsMap[id]))
    ? ssotInscritsMap[id]
    : (Array.isArray(rawShift.inscrits) ? rawShift.inscrits : (Array.isArray(rawShift.inscritsIds) ? rawShift.inscritsIds : []));
  return {
    id, nomTache, dateJour: String(rawShift.dateJour || eventDateJour || '').slice(0, 10),
    heureDebut, heureFin, horaires, quotaRequis, consigne: String(rawShift.consigne || '').trim(),
    commissionId: resolvedCommId, commissionTitre: String(rawShift.commissionTitre || commissionTitre || '').trim(),
    inscrits: srcList.map((it, i) => normalizeShiftInscrit(it, i, usersMap)).filter(Boolean)
  };
}

export function isVolunteerShiftFull(shift) {
  const quota = Number(shift?.quotaRequis) || 0;
  return quota > 0 && (shift?.inscrits?.length || 0) >= quota;
}

export function consolidateVolunteerShifts(event = {}, commissions = [], usersMap = {}) {
  const rawDate = String(event?.date || event?.dateDebut || '');
  const eventDateJour = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : '';
  const ssotInscritsMap = event?.covoiturage?.benevolatInscrits || null;
  const commById = Object.fromEntries((commissions || []).filter((c) => c?.id).map((c) => [c.id, c]));
  const byId = new Map();
  (event?.volunteerShifts || []).forEach((s, idx) => {
    const norm = normalizeVolunteerShift(s, { index: idx, eventDateJour, commissionTitre: commById[s?.commissionId]?.titre || '', ssotInscritsMap, usersMap });
    byId.set(norm.id, norm);
  });
  (commissions || []).forEach((comm) => {
    (comm?.creneauxBenevoles || []).forEach((c, idx) => {
      const norm = normalizeVolunteerShift(c, { index: idx, eventDateJour, commissionId: comm.id, commissionTitre: comm.titre || '', ssotInscritsMap, usersMap });
      if (!byId.has(norm.id)) byId.set(norm.id, norm);
    });
  });
  const extraCommShifts = (!commissions || commissions.length === 0) && Array.isArray(event?.publicCommissionShifts) ? event.publicCommissionShifts : [];
  extraCommShifts.forEach((c, idx) => { const n = normalizeVolunteerShift(c, { index: idx, eventDateJour, ssotInscritsMap, usersMap }); if (!byId.has(n.id)) byId.set(n.id, n); });
  return Array.from(byId.values()).sort((a, b) => {
    const dCmp = (a.dateJour || eventDateJour || '9999-99-99').localeCompare(b.dateJour || eventDateJour || '9999-99-99');
    return dCmp !== 0 ? dCmp : (a.heureDebut || '99:99').localeCompare(b.heureDebut || '99:99');
  });
}

export function computeVolunteerCoverage(shifts = []) {
  let totalRequired = 0, filledPosts = 0, totalInscrits = 0;
  (shifts || []).forEach((s) => {
    const count = s?.inscrits?.length || 0, q = Number(s?.quotaRequis) || 0;
    totalInscrits += count;
    if (q > 0) { totalRequired += q; filledPosts += Math.min(count, q); }
  });
  return { shiftsCount: shifts.length, totalRequired, filledPosts, totalInscrits, isComplete: shifts.length > 0 && totalRequired > 0 && filledPosts >= totalRequired };
}

export function isMemberArtisticPresent(event = {}, userId) {
  if (!userId || event?.type === 'reunion' || (event?.includesPercussion === false && event?.includesDance === false)) return false;
  return (event?.inscriptions || []).some((ins) => (ins.userId === userId || ins.uid === userId) && ins.status === 'present');
}

export function detectStageScheduleConflict(shift = {}, event = {}) {
  const evtStartDay = /^\d{4}-\d{2}-\d{2}/.test(String(event?.date || event?.dateDebut || '')) ? String(event.date || event.dateDebut).slice(0, 10) : '';
  const evtEndDay = /^\d{4}-\d{2}-\d{2}/.test(String(event?.dateFin || '')) ? String(event.dateFin).slice(0, 10) : evtStartDay;
  if (shift?.dateJour && evtStartDay && (shift.dateJour < evtStartDay || shift.dateJour > (evtEndDay || evtStartDay))) return false;
  const parsedShift = extractHorairesRange(shift?.horaires);
  const sStart = parseTimeMinutes(shift?.heureDebut || parsedShift.heureDebut);
  if (sStart === null) return false;
  const rawEnd = parseTimeMinutes(shift?.heureFin || parsedShift.heureFin);
  const sEnd = rawEnd === null ? sStart + 60 : (rawEnd <= sStart ? rawEnd + 1440 : rawEnd);
  const windows = [], rangeSpans = [];
  const addWin = (st, en) => { if (st !== null) windows.push([st, en === null ? st + 60 : (en <= st ? en + 1440 : en)]); };
  [event?.heureBalances, event?.horaireBalance, event?.heureRdvArtistique, event?.heureArrivee].forEach((t) => addWin(parseTimeMinutes(t), null));
  if (event?.heurePassage || event?.heureDebutJeu) addWin(parseTimeMinutes(event.heurePassage || event.heureDebutJeu), parseTimeMinutes(event.heureFinJeu));
  const passagesTxt = String(event?.horairesPassages || '');
  let m;
  while ((m = RANGE_RE.exec(passagesTxt)) !== null) { addWin(parseTimeMinutes(m[1]), parseTimeMinutes(m[2])); rangeSpans.push([m.index, m.index + m[0].length]); }
  while ((m = SINGLE_TIME_RE.exec(passagesTxt)) !== null) { if (!rangeSpans.some(([a, b]) => m.index >= a && m.index < b)) addWin(parseTimeMinutes(m[1]), null); }
  if (windows.length === 0 && event?.type !== 'reunion' && (event?.includesPercussion !== false || event?.includesDance !== false)) {
    const tStart = parseTimeMinutes((String(event?.date || event?.dateDebut || '').split('T')[1] || '').slice(0, 5));
    const tEnd = parseTimeMinutes((String(event?.dateFin || '').split('T')[1] || '').slice(0, 5));
    if (tStart !== null) addWin(tStart, tEnd ?? tStart + 120);
  }
  return windows.some(([wStart, wEnd]) => sStart < wEnd && wStart < sEnd);
}
