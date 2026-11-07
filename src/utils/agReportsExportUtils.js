import {
  computeTerritorialStats,
  computeVolunteeringAndActivity,
  computeAudienceAndDiffusion,
  resolveMemberReportPupitre
} from './secretariatMetrics';

/** Calcule les indicateurs consolidés du rapport d'AG sur la période sélectionnée. */
export function computeAgReportIndicators({
  rawUsers = [], rawEvents = [], rawCouture = [], rawParts = [],
  rawInventory = [], rawTransactions = [], rawGigs = [], assocInfo = null, isWithinRange
}) {
  const totalMembers = rawUsers.length;
  const activeMembers = rawUsers.filter((u) => !u.statutActuel || u.statutActuel === 'active').length;
  let cotisationsUpToDate = 0;
  let cotisationsPending = 0;
  const pupitresCount = {};

  rawUsers.forEach((u) => {
    if (u.paymentStatus === 'paid' || u.cotisationPaid === true) cotisationsUpToDate++;
    else cotisationsPending++;
    const cleanPupitre = resolveMemberReportPupitre(u);
    pupitresCount[cleanPupitre] = (pupitresCount[cleanPupitre] || 0) + 1;
  });

  const sortedPupitres = Object.entries(pupitresCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, percent: totalMembers ? Math.round((count / totalMembers) * 100) : 0 }));

  const filteredEvents = rawEvents.filter((e) => isWithinRange(e.date));
  const eventsByType = { prestation: 0, repetition: 0, stage: 0, atelier: 0, reunion: 0, autre: 0 };
  let totalPresencesAll = 0;
  let totalPresencesPrestations = 0;
  let prestationCountWithPresence = 0;

  filteredEvents.forEach((e) => {
    const type = e.type || 'autre';
    if (eventsByType[type] !== undefined) eventsByType[type]++;
    else eventsByType.autre++;
    const presents = (e.inscriptions || []).filter((i) => i.status === 'present').length + ((e.invitesExternes || []).length);
    totalPresencesAll += presents;
    if (type === 'prestation') { totalPresencesPrestations += presents; prestationCountWithPresence++; }
  });

  const avgPresencePrestation = prestationCountWithPresence > 0 ? (totalPresencesPrestations / prestationCountWithPresence).toFixed(1) : '0';
  const totalCouture = rawCouture.length;
  const coutureFinished = rawCouture.filter((p) => ['termine', 'completed', 'clos'].includes(p.status)).length;
  const coutureInProgress = totalCouture - coutureFinished;
  const totalParts = rawParts.length;
  const totalInstruments = rawInventory.length;
  const instrumentsInService = rawInventory.filter((i) => !i.status || ['En service', 'En stock'].includes(i.status)).length;
  const instrumentsMaintenance = rawInventory.filter((i) => ['Maintenance', 'HS', 'En réparation'].includes(i.status)).length;

  let recettesGlobales = 0;
  let depensesGlobales = 0;
  rawTransactions.filter((tx) => isWithinRange(tx.date)).forEach((tx) => {
    const amt = Number(tx.montant) || 0;
    if (tx.type === 'recette') recettesGlobales += amt;
    else if (tx.type === 'depense') depensesGlobales += amt;
  });
  filteredEvents.forEach((e) => {
    recettesGlobales += Number(e.montantRecette) || 0;
    depensesGlobales += Number(e.montantDepense) || 0;
  });

  const assocAddress = assocInfo?.adresseSiegeSocial || assocInfo?.adresse || '';
  return {
    totalMembers, activeMembers, cotisationsUpToDate, cotisationsPending, sortedPupitres,
    totalEvents: filteredEvents.length, eventsByType, totalPresencesAll, avgPresencePrestation,
    totalCouture, coutureFinished, coutureInProgress, totalParts, totalInstruments,
    instrumentsInService, instrumentsMaintenance, recettesGlobales, depensesGlobales,
    soldeNet: recettesGlobales - depensesGlobales,
    territorialStats: computeTerritorialStats(rawUsers, assocAddress),
    volunteeringStats: computeVolunteeringAndActivity(filteredEvents, activeMembers, assocInfo || {}),
    audienceStats: computeAudienceAndDiffusion(rawGigs, assocInfo?.vitrineViews || 0, isWithinRange)
  };
}

/** Exporte le Bilan AG consolidé au format CSV (UTF-8 BOM, séparateur point-virgule). */
export function exportAgSummaryCSV({ assocInfo, startDate, endDate, indicators }) {
  const ts = indicators.territorialStats;
  const vs = indicators.volunteeringStats;
  const as = indicators.audienceStats;
  const lines = [
    `RAPPORT CONSOLIDÉ - BILAN D'ASSEMBLÉE GÉNÉRALE`, `Association;${assocInfo?.nom || 'O Girador'}`,
    `Période de référence;Du ${startDate} au ${endDate}`, `Date d'édition;${new Date().toLocaleDateString('fr-FR')}`, '',
    `1. VIE ASSOCIATIVE, EFFECTIFS & ANCRAGE TERRITORIAL (CERFA)`, `Indicateur;Valeur`,
    `Total membres enregistrés;${indicators.totalMembers}`, `Membres actifs;${indicators.activeMembers}`,
    `Cotisations à jour;${indicators.cotisationsUpToDate}`, `Cotisations en attente ou partielles;${indicators.cotisationsPending}`,
    `Commune de rattachement du siège;${ts.siegeVille || 'Non renseignée'}${ts.siegeCP ? ` (${ts.siegeCP})` : ''}`,
    `Adhérents de la commune du siège;${ts.communeMembersCount} (${ts.communeMembersPercent}%)`,
    `Adhérents des communes extérieures;${ts.externalMembersCount} (${ts.externalMembersPercent}%)`,
    `Profils audités avec adresse;${ts.totalAudited} / ${ts.totalActiveMembers}`, '',
    `RÉPARTITION PAR PUPITRE`, `Pupitre / Section;Effectif;Pourcentage`,
    ...indicators.sortedPupitres.map((p) => `${p.name};${p.count};${p.percent}%`), '',
    `2. RAYONNEMENT SCÉNIQUE, PRATIQUE COLLECTIVE & BÉNÉVOLAT (CERFA 12156)`, `Indicateur;Valeur`,
    `Prestations publiques / Concerts;${indicators.eventsByType.prestation}`, `Répétitions régulières;${indicators.eventsByType.repetition}`,
    `Stages & Ateliers;${indicators.eventsByType.stage + indicators.eventsByType.atelier}`, `Réunions & Assemblées;${indicators.eventsByType.reunion}`,
    `TOTAL ÉVÉNEMENTS RÉALISÉS;${indicators.totalEvents}`, `Mobilisations cumulées (Présences réelles);${indicators.totalPresencesAll}`,
    `Moyenne de musiciens / sortie;${indicators.avgPresencePrestation}`, `Heures de jeu en public (scène);${vs.totalPublicPlayingHours} h`,
    `Heures-participants activité collective;${vs.totalCollectiveVolunteerHours} h`,
    `Forfaits annuels statutaires bureau & atelier;${vs.forfaitHeuresAdmin + vs.forfaitHeuresArtisanat} h`,
    `TOTAL HEURES DE BÉNÉVOLAT VALORISÉES (CERFA);${vs.totalCerfaVolunteerHours} h`, '',
    `3. CHANTIERS, ATELIERS & PATRIMOINE`, `Indicateur;Valeur`,
    `Projets costumes terminés;${indicators.coutureFinished}`, `Projets costumes en cours;${indicators.coutureInProgress}`,
    `Pièces de lutherie suivies;${indicators.totalParts}`, `Instruments opérationnels en service;${indicators.instrumentsInService}`,
    `Instruments en maintenance / réparation;${indicators.instrumentsMaintenance}`, '',
    `4. BILAN FINANCIER CONDENSÉ`, `Poste;Montant (€)`,
    `Recettes globales consolidées;${indicators.recettesGlobales.toFixed(2)} €`, `Dépenses globales consolidées;${indicators.depensesGlobales.toFixed(2)} €`,
    `RÉSULTAT NET D'EXERCICE;${indicators.soldeNet.toFixed(2)} €`, '',
    `5. RAYONNEMENT NUMÉRIQUE & VITRINE PUBLIQUE`, `Indicateur;Valeur`,
    `Consultations uniques de la vitrine;${as.vitrineViews}`, `Demandes de prestations reçues via le site;${as.vitrineRequestsTotal}`,
    `Dossiers de prestation concrétisés;${as.vitrineRequestsConverted}`, `Taux de concrétisation des demandes web;${as.conversionRate}%`
  ];
  triggerCsvDownload('\uFEFF' + lines.join('\n'), `Bilan_AG_${assocInfo?.nom || 'Association'}_${startDate}_au_${endDate}.csv`);
}

/** Exporte le détail d'assiduité événement par événement au format CSV. */
export function exportAgAttendanceCSV({ assocInfo, startDate, endDate, rawEvents = [], isWithinRange }) {
  const typeLabels = { prestation: 'Prestation', repetition: 'Répétition', stage: 'Stage', atelier: 'Atelier', reunion: 'Réunion' };
  const filtered = rawEvents.filter((e) => isWithinRange(e.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const rows = filtered.map((ev) => {
    const dateStr = ev.date ? (typeof ev.date === 'string' ? ev.date.substring(0, 10) : new Date(ev.date).toISOString().substring(0, 10)) : '';
    const presentCount = (ev.inscriptions || []).filter((i) => i.status === 'present').length + ((ev.invitesExternes || []).length);
    return [dateStr, ev.titre || '', typeLabels[ev.type] || ev.type || 'autre', ev.lieu || '', String(presentCount)];
  });
  const csv = '\uFEFF' + [['Date', 'Titre', 'Type', 'Lieu', 'Nombre de présents'], ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  triggerCsvDownload(csv, `Detail_Assiduite_Presences_${assocInfo?.nom || 'Association'}_${startDate}_au_${endDate}.csv`);
}

function triggerCsvDownload(csvContent, filename) {
  const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
