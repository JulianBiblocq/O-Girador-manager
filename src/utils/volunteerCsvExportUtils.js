/**
 * Export CSV complet des bénévoles (UTF-8 avec BOM `\uFEFF`, séparateur `;`) :
 * - Bloc 1 : Planning & Émargement détaillé créneau par créneau
 * - Bloc 2 : Synthèse dédoublonnée par personne unique (Tailles de T-shirts & Régimes/Allergies cuisine)
 */

function escCsv(val) {
  return `"${String(val ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""').trim()}"`;
}

function extractMemberDiet(u = {}) {
  const parts = [];
  if (Array.isArray(u.dietaryRestrictions) && u.dietaryRestrictions.length > 0) parts.push(u.dietaryRestrictions.join(', '));
  if (typeof u.regimeAlimentaire === 'string' && u.regimeAlimentaire.trim()) parts.push(u.regimeAlimentaire.trim());
  if (typeof u.allergies === 'string' && u.allergies.trim()) parts.push(`Allergies: ${u.allergies.trim()}`);
  return parts.join(' | ');
}

function resolveAdultLabel(val, dateNaissance = '') {
  if (val === true) return 'Majeur';
  if (val === false) return 'Mineur';
  if (dateNaissance && /^\d{4}-\d{2}-\d{2}/.test(dateNaissance)) {
    const age = (Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (!isNaN(age)) return age >= 18 ? 'Majeur' : 'Mineur';
  }
  return '';
}

export function buildVolunteersAndLogisticsCsvData({
  event = {},
  consolidatedShifts = [],
  acceptedApplications = [],
  allUsers = []
} = {}) {
  const usersMap = {};
  (allUsers || []).forEach((u) => { if (u?.id) usersMap[u.id] = u; if (u?.uid) usersMap[u.uid] = u; });
  const appsMap = {};
  (acceptedApplications || []).forEach((a) => { if (a?.id) appsMap[a.id] = a; });

  const eventDay = String(event?.date || event?.dateDebut || '').slice(0, 10);
  const shiftRows = [];
  const uniquePeople = new Map();

  const registerUniquePerson = (personKey, info, shiftLabel = '') => {
    if (!uniquePeople.has(personKey)) {
      uniquePeople.set(personKey, { ...info, shifts: shiftLabel ? [shiftLabel] : [] });
    } else if (shiftLabel) {
      const existing = uniquePeople.get(personKey);
      if (!existing.shifts.includes(shiftLabel)) existing.shifts.push(shiftLabel);
    }
  };

  (consolidatedShifts || []).forEach((sh) => {
    const day = sh.dateJour || eventDay;
    const shiftLabel = `${sh.nomTache}${sh.horaires ? ` (${sh.horaires})` : ''}`;

    (sh.inscrits || []).forEach((ins) => {
      if (ins.type === 'external') {
        const app = appsMap[ins.applicationId] || {};
        const prenom = ins.prenom || app.prenom || '', nom = ins.nom || app.nom || '';
        const diet = String(app.regimeAlimentaire || '').trim(), tshirt = String(app.tailleTshirt || '').trim().toUpperCase();
        const vehicle = app.vehicleDetails || (app.hasVehicle ? 'Oui' : '');
        const adult = resolveAdultLabel(app.isAdult);
        shiftRows.push([day, sh.horaires || '', sh.nomTache, sh.commissionTitre || 'Général', prenom, nom, 'Externe', ins.lienAsso || app.lienAsso || '', app.telephone || '', app.email || '', diet, tshirt, vehicle, adult, '[ ]', '[ ]']);
        registerUniquePerson(`ext:${ins.applicationId || `${prenom}_${nom}`.toLowerCase()}`, { nomComplet: `${prenom} ${nom}`.trim(), type: 'Externe', diet, tshirt }, shiftLabel);
      } else if (ins.type === 'guest') {
        const prenom = ins.prenom || '', nom = ins.nom || '';
        shiftRows.push([day, sh.horaires || '', sh.nomTache, sh.commissionTitre || 'Général', prenom, nom, 'Proche', ins.parrainNom ? `Proche de ${ins.parrainNom}` : '', ins.telephone || '', '', '', '', '', '', '[ ]', '[ ]']);
        registerUniquePerson(`guest:${ins.parrainUid || ''}_${`${prenom}_${nom}`.toLowerCase()}`, { nomComplet: `${prenom} ${nom}`.trim(), type: 'Proche', diet: '', tshirt: '' }, shiftLabel);
      } else {
        const u = usersMap[ins.uid] || {};
        const prenom = ins.prenom || u.prenom || '', nom = ins.nom || u.nom || u.displayName || '';
        const diet = extractMemberDiet(u), tshirt = String(u.tailleTshirt || '').trim().toUpperCase();
        const vehicle = String(u.vehicleDetails || u.vehicule || (u.hasVehicle ? 'Oui' : '')).trim();
        const adult = resolveAdultLabel(u.isAdult, u.dateNaissance);
        shiftRows.push([day, sh.horaires || '', sh.nomTache, sh.commissionTitre || 'Général', prenom, nom, 'Membre', 'Adhérent', u.telephone || u.phone || '', u.email || '', diet, tshirt, vehicle, adult, '[ ]', '[ ]']);
        registerUniquePerson(`mem:${ins.uid || `${prenom}_${nom}`.toLowerCase()}`, { nomComplet: `${prenom} ${nom}`.trim(), type: 'Membre', diet, tshirt }, shiftLabel);
      }
    });
  });

  // Inclure aussi les externes validés qui n'auraient pas encore d'entrée dans consolidatedShifts
  (acceptedApplications || []).forEach((app) => {
    registerUniquePerson(`ext:${app.id}`, {
      nomComplet: `${app.prenom || ''} ${app.nom || ''}`.trim(),
      type: 'Externe',
      diet: String(app.regimeAlimentaire || '').trim(),
      tshirt: String(app.tailleTshirt || '').trim().toUpperCase()
    });
  });

  const tshirtCounts = {};
  const dietaryList = [];
  uniquePeople.forEach((p) => {
    if (p.tshirt) tshirtCounts[p.tshirt] = (tshirtCounts[p.tshirt] || 0) + 1;
    if (p.diet) dietaryList.push({ nomComplet: p.nomComplet, type: p.type, diet: p.diet, shifts: p.shifts.join(', ') });
  });

  const lines = [
    ['BLOC 1 — PLANNING & ÉMARGEMENT PAR CRÉNEAU', event?.titre || 'Événement'].map(escCsv).join(';'),
    ['Date', 'Horaires', 'Poste', 'Commission', 'Prénom', 'Nom', 'Type', 'Lien / Parrain', 'Téléphone', 'E-mail', 'Régime / Allergies', 'Taille T-shirt', 'Véhicule', 'Statut Majeur', 'Arrivé', 'Tickets remis'].map(escCsv).join(';'),
    ...shiftRows.map((r) => r.map(escCsv).join(';')),
    '',
    ['BLOC 2 — SYNTHÈSE UNIQUE PAR PERSONNE (SANS DOUBLON MULTI-CRÉNEAUX)', `Total bénévoles uniques : ${uniquePeople.size}`].map(escCsv).join(';'),
    ['SYNTHÈSE TAILLES DE T-SHIRTS', 'Quantité'].map(escCsv).join(';'),
    ...Object.entries(tshirtCounts).sort(([a], [b]) => a.localeCompare(b)).map(([sz, count]) => [sz, String(count)].map(escCsv).join(';')),
    '',
    ['SYNTHÈSE CUISINE — RÉGIMES ALIMENTAIRES & ALLERGIES', 'Profil', 'Régime / Allergies', 'Créneaux assurés'].map(escCsv).join(';'),
    ...dietaryList.map((d) => [d.nomComplet, d.type, d.diet, d.shifts].map(escCsv).join(';'))
  ];

  return {
    csvContent: '\uFEFF' + lines.join('\n'),
    shiftRowsCount: shiftRows.length,
    uniquePeopleCount: uniquePeople.size,
    tshirtCounts,
    dietaryList
  };
}

export function downloadVolunteersAndLogisticsCSV(params = {}) {
  const { csvContent } = buildVolunteersAndLogisticsCsvData(params);
  if (typeof document === 'undefined') return csvContent;
  const safeTitle = String(params.event?.titre || 'Evenement').replace(/[^a-zA-Z0-9-_]/g, '_');
  const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `Benevoles_Repas_Tshirts_${safeTitle}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return csvContent;
}
