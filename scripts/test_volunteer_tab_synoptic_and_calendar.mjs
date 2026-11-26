/**
 * Batterie de tests unitaires — Onglet Conditionnel « 🤝 Bénévoles »,
 * Référents Jour J, Grand Tableau Synoptique & Export Agenda (.ics / Google Agenda).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hasActiveVolunteerModule,
  isEventVolunteerCoordinator,
  resolveVolunteerKeyContacts
} from '../src/utils/volunteerCoordinatorUtils.js';
import { resolveTypeEffectiveConfig } from '../src/utils/eventTypeConfigUtils.js';
import { filterApplicationsForViewer, resolveManageableShiftIds } from '../src/utils/volunteerApplicationUtils.js';
import { resolveShiftDayOfContacts } from '../src/utils/volunteerMemoUtils.js';
import {
  computeShiftDurationMinutes,
  formatShiftDurationLabel,
  getShiftGaugeStatus,
  computeSynopticKpis,
  filterAndSortSynopticShifts
} from '../src/utils/volunteerSynopticUtils.js';
import {
  resolveVolunteerShiftDates,
  buildVolunteerShiftGoogleCalendarUrl,
  buildVolunteerShiftsIcsContent
} from '../src/utils/volunteerCalendarUtils.js';
import { countRealLines } from '../.agents/hooks/pre_write_guard.mjs';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

console.log('=== 🧪 TEST : ONGLET CONDITIONNEL BÉNÉVOLES, SYNOPTIQUE & EXPORT AGENDA ===');

// 1. Presets à la carte, visibilité conditionnelle et droits coordinateurs Jour J
{
  assert.strictEqual(resolveTypeEffectiveConfig('repetition', {}).enableVolunteers, false);
  assert.strictEqual(resolveTypeEffectiveConfig('reunion', {}).enableVolunteers, false);
  assert.strictEqual(resolveTypeEffectiveConfig('prestation', {}).enableVolunteers, true);
  assert.strictEqual(resolveTypeEffectiveConfig('forum', {}).enableVolunteers, true);
  assert.strictEqual(resolveTypeEffectiveConfig('repetition', { enableVolunteers: true }).enableVolunteers, true);

  assert.strictEqual(hasActiveVolunteerModule({ type: 'repetition', enableVolunteers: false }, []), false);
  assert.strictEqual(hasActiveVolunteerModule({ type: 'repetition', enableVolunteers: true }, []), true);
  assert.strictEqual(hasActiveVolunteerModule({ volunteerShifts: [{ id: 's1', nomTache: 'Accueil' }] }, []), true, 'Rétrocompatibilité volunteerShifts');
  assert.strictEqual(hasActiveVolunteerModule({ publicVolunteerConfig: { enabled: true } }, []), true, 'Rétrocompatibilité appel public');
  assert.strictEqual(hasActiveVolunteerModule({}, [{ id: 'c1', creneauxBenevoles: [{ id: 'cr1' }] }]), true, 'Rétrocompatibilité commissions');

  const evtNoComm = { id: 'evt_1', volunteerReferentIds: ['uid_ref_jourj'] };
  const commissions = [
    { id: 'c_bar', titre: 'Buvette', referentsIds: ['uid_ref_bar'], creneauxBenevoles: [{ id: 's_bar' }] },
    { id: 'c_vol', titre: 'Pôle Bénévoles & Accueil', referentsIds: ['uid_ref_vol'] },
    { id: 'c_pt', titre: 'Equipe de Voluntários', referentIds: ['uid_ref_pt'] }
  ];

  assert.strictEqual(isEventVolunteerCoordinator({ user: { uid: 'u_admin' }, event: evtNoComm, commissions, canManageEvents: true }), true);
  assert.strictEqual(isEventVolunteerCoordinator({ user: { uid: 'uid_ref_jourj' }, event: evtNoComm, commissions: [], canManageEvents: false }), true, 'volunteerReferentIds sans commission');
  assert.strictEqual(isEventVolunteerCoordinator({ user: { uid: 'uid_ref_vol' }, event: {}, commissions, canManageEvents: false }), true, 'Commission Bénévoles FR');
  assert.strictEqual(isEventVolunteerCoordinator({ user: { uid: 'uid_ref_pt' }, event: {}, commissions, canManageEvents: false }), true, 'Commission Voluntários PT');
  assert.strictEqual(isEventVolunteerCoordinator({ user: { uid: 'uid_ref_bar' }, event: {}, commissions, canManageEvents: false }), false, 'Référent Buvette non coordinateur global');
  assert.strictEqual(isEventVolunteerCoordinator({ user: { uid: 'uid_member' }, event: evtNoComm, commissions, canManageEvents: false }), false, 'Simple membre');

  // Déverrouillage 100 % des candidatures et créneaux pour volunteerReferentIds
  const apps = [
    { id: 'a1', createdAt: '2026-06-10T10:00:00Z', isFlexible: false, requestedShiftIds: ['s_bar'], assignedShiftIds: [] },
    { id: 'a2', createdAt: '2026-06-10T11:00:00Z', isFlexible: false, requestedShiftIds: ['s_gen'], assignedShiftIds: [] },
    { id: 'a3', createdAt: '2026-06-10T12:00:00Z', isFlexible: true, requestedShiftIds: [], assignedShiftIds: [] }
  ];
  const allShifts = [{ id: 's_gen', commissionId: null }, { id: 's_bar', commissionId: 'c_bar' }];
  const visibleForDateRef = filterApplicationsForViewer(apps, {
    isGlobalManager: false, event: evtNoComm, commissions, allShifts, userUid: 'uid_ref_jourj'
  });
  assert.strictEqual(visibleForDateRef.length, 3, 'Le référent bénévoles de la date voit 100 % des candidatures');
  assert.strictEqual(resolveManageableShiftIds({ isGlobalManager: false, event: evtNoComm, commissions, allShifts, userUid: 'uid_ref_jourj' }).size, 2);

  // Contacts clés bénévoles
  const allUsers = [
    { id: 'uid_ref_jourj', prenom: 'Inês', nom: 'Costa', telephone: '06 10 20 30 40' },
    { id: 'uid_ref_bar', prenom: 'Claire', nom: 'Dupont', telephone: '06 50 60 70 80' }
  ];
  const compactContacts = resolveVolunteerKeyContacts({ event: evtNoComm, commissions, allUsers, includeCommissions: false });
  assert.strictEqual(compactContacts.volunteerReferents.length, 1);
  assert.strictEqual(compactContacts.commissionReferents.length, 0);
  const fullContacts = resolveVolunteerKeyContacts({ event: evtNoComm, commissions, allUsers, includeCommissions: true });
  assert.strictEqual(fullContacts.commissionReferents.length, 1);
  assert.strictEqual(fullContacts.commissionReferents[0].prenom, 'Claire');

  // TabProgram épuré de EventVolunteerSection
  const tabProgramSrc = fs.readFileSync(path.join(rootDir, 'src/components/event-details/tabs/TabProgram.jsx'), 'utf8');
  assert.strictEqual(tabProgramSrc.includes('EventVolunteerSection'), false, 'TabProgram ne doit plus inclure EventVolunteerSection');
  console.log('✓ 1. Activation à la carte, visibilité onglet, droits coordinateurs et épuration de Scène validés');
}

// 2. Grand Tableau Synoptique : durée après minuit, KPIs dédoublonnés et tri postes dégarnis
{
  assert.strictEqual(computeShiftDurationMinutes({ heureDebut: '23:00', heureFin: '02:00' }), 180);
  assert.strictEqual(formatShiftDurationLabel({ heureDebut: '23:00', heureFin: '02:00' }), '3h');
  assert.strictEqual(formatShiftDurationLabel({ heureDebut: '18:30', heureFin: '21:00' }), '2h30');

  const shifts = [
    { id: 'sh_complet', nomTache: 'Accueil public', dateJour: '2026-06-21', heureDebut: '18:00', heureFin: '20:00', quotaRequis: 2, commissionId: null, inscrits: [{ id: 'u1', type: 'member', uid: 'u1', prenom: 'Léo', nom: 'B.' }, { id: 'g1', type: 'guest', parrainUid: 'u1', prenom: 'Marc', nom: 'V.' }] },
    { id: 'sh_partiel', nomTache: 'Buvette Set 1', dateJour: '2026-06-21', heureDebut: '20:00', heureFin: '23:00', quotaRequis: 4, commissionId: 'c_bar', commissionTitre: 'Buvette', inscrits: [{ id: 'u1', type: 'member', uid: 'u1', prenom: 'Léo', nom: 'B.' }] },
    { id: 'sh_vide', nomTache: 'Rangement nuit', dateJour: '2026-06-21', heureDebut: '23:00', heureFin: '02:00', quotaRequis: 3, commissionId: null, inscrits: [] }
  ];

  assert.strictEqual(getShiftGaugeStatus(shifts[0]), 'full');
  assert.strictEqual(getShiftGaugeStatus(shifts[1]), 'partial');
  assert.strictEqual(getShiftGaugeStatus(shifts[2]), 'empty');

  const kpis = computeSynopticKpis(shifts, {
    pendingApplications: [{ id: 'p_flex', isFlexible: true }, { id: 'p_fixed', isFlexible: false }],
    acceptedApplications: [{ id: 'a_flex_unassigned', isFlexible: true, assignedShiftIds: [] }]
  });
  assert.strictEqual(kpis.totalRequired, 9);
  assert.strictEqual(kpis.filledPosts, 3);
  assert.strictEqual(kpis.remainingPlaces, 6, '0 + 3 + 3 = 6 places restantes');
  assert.strictEqual(kpis.uniqueVolunteersCount, 2, 'Léo (sur 2 créneaux) + Marc (proche) = 2 personnes uniques');
  assert.strictEqual(kpis.flexiblesToPlaceCount, 2);

  const chrono = filterAndSortSynopticShifts(shifts, { sortBy: 'chronological' });
  assert.deepStrictEqual(chrono.map((s) => s.id), ['sh_complet', 'sh_partiel', 'sh_vide']);

  const unfilledFirst = filterAndSortSynopticShifts(shifts, { sortBy: 'unfilled_first' });
  assert.deepStrictEqual(
    unfilledFirst.map((s) => s.id),
    ['sh_vide', 'sh_partiel', 'sh_complet'],
    'Les postes à 0 inscrit puis partiellement dégarnis doivent remonter avant les postes complets'
  );

  const searchMarc = filterAndSortSynopticShifts(shifts, { searchQuery: 'marc' });
  assert.deepStrictEqual(searchMarc.map((s) => s.id), ['sh_complet']);
  console.log('✓ 2. Grand Tableau Synoptique (KPIs uniques, durée minuit, filtres et tri postes dégarnis) validé');
}

// 3. Export Agenda Google Agenda & .ics multi-VEVENT (passage minuit J+1 + consigne + téléphone référent)
{
  const allUsers = [
    { id: 'uid_ref_jourj', prenom: 'Inês', nom: 'Costa', telephone: '06 10 20 30 40' },
    { id: 'uid_ref_bar', prenom: 'Claire', nom: 'Dupont', telephone: '06 50 60 70 80' }
  ];
  const commissions = [{ id: 'c_bar', titre: 'Buvette', referentsIds: ['uid_ref_bar'] }];
  const event = {
    id: 'evt_solstice',
    titre: 'Fête du Solstice',
    date: '2026-06-21T19:00',
    lieu: 'Parc du Thabor, Rennes',
    volunteerReferentIds: ['uid_ref_jourj']
  };

  const shiftBar = {
    id: 'sh_bar', nomTache: 'Service buvette', dateJour: '2026-06-21',
    heureDebut: '20:00', heureFin: '22:30', horaires: '20:00 - 22:30',
    consigne: 'Demander les jetons au comptoir central', commissionId: 'c_bar', commissionTitre: 'Buvette'
  };
  const shiftNight = {
    id: 'sh_nuit', nomTache: 'Fermeture & Rangement', dateJour: '2026-06-21',
    heureDebut: '23:00', heureFin: '02:00', horaires: '23:00 - 02:00',
    consigne: 'Rassembler les barnums pliés près de la grille nord', commissionId: null, commissionTitre: ''
  };

  // Vérification du passage minuit 23:00 -> 02:00 à J+1 (2026-06-22)
  const nightDates = resolveVolunteerShiftDates(shiftNight, event);
  assert.strictEqual(nightDates.crossesMidnight, true);
  assert.strictEqual(nightDates.startLocalIso, '2026-06-21T23:00:00');
  assert.strictEqual(nightDates.endLocalIso, '2026-06-22T02:00:00', 'Passage minuit incrémenté à J+1');
  assert.strictEqual(nightDates.endDate.getTime() - nightDates.startDate.getTime(), 3 * 3600 * 1000);

  // Repli 2h si ancien créneau sans HH:MM
  const legacyDates = resolveVolunteerShiftDates({ id: 'sh_old', nomTache: 'Coup de main', horaires: 'Soirée' }, event);
  assert.strictEqual(legacyDates.endDate.getTime() - legacyDates.startDate.getTime(), 2 * 3600 * 1000);

  // Cascade contact Jour J : shiftNight (général) -> Inês (volunteerReferentIds)
  const nightContacts = resolveShiftDayOfContacts(shiftNight, { event, commissions, allUsers });
  assert.strictEqual(nightContacts[0].prenom, 'Inês');
  assert.strictEqual(nightContacts[0].telephone, '06 10 20 30 40');

  // Google Agenda URL (créneau pris pour un proche)
  const gcalUrl = buildVolunteerShiftGoogleCalendarUrl(shiftBar, {
    event, commissions, allUsers, guestName: 'Julien M.', eventUrl: 'https://organizador.o-girador.com/?eventId=evt_solstice'
  });
  const parsedUrl = new URL(gcalUrl);
  assert.ok(parsedUrl.searchParams.get('text').includes('🤝 Service buvette (Julien M.) — Fête du Solstice'));
  assert.strictEqual(parsedUrl.searchParams.get('location'), 'Parc du Thabor, Rennes');
  const gcalDetails = parsedUrl.searchParams.get('details');
  assert.ok(gcalDetails.includes('Commission : Buvette'));
  assert.ok(gcalDetails.includes('Demander les jetons au comptoir central'), 'Consigne présente dans Google Agenda');
  assert.ok(gcalDetails.includes('Claire Dupont (06 50 60 70 80)'), 'Téléphone référent présent dans Google Agenda');

  // Export .ics multi-VEVENT (2 créneaux dont celui passant minuit)
  const ics = buildVolunteerShiftsIcsContent(
    [{ shift: shiftBar, guestName: 'Julien M.' }, { shift: shiftNight, guestName: '' }],
    { event, commissions, allUsers, associationName: 'Baque do Sol' }
  );
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 2, '2 VEVENT attendus dans le fichier .ics groupé');
  assert.ok(ics.includes('Rassembler les barnums pliés près de la grille nord'), 'Consigne présente dans .ics');
  assert.ok(ics.includes('Inês Costa (06 10 20 30 40)'), 'Téléphone du Référent Bénévoles de la date présent dans .ics');
  assert.ok(ics.includes('Claire Dupont (06 50 60 70 80)'), 'Téléphone du Référent Commission présent dans .ics');
  console.log('✓ 3. Export Google Agenda & .ics multi-VEVENT (minuit J+1, consigne et téléphone référent) validé');
}

// 4. Gouvernance stricte < 140 lignes, zéro hex inline et parité 1:1 FR / PT
{
  const filesUnder140 = [
    'src/utils/volunteerCoordinatorUtils.js',
    'src/utils/volunteerSynopticUtils.js',
    'src/utils/volunteerCalendarUtils.js',
    'src/utils/volunteerMemoUtils.js',
    'src/utils/volunteerApplicationUtils.js',
    'src/utils/eventTypeConfigUtils.js',
    'src/utils/eventCreationUtils.js',
    'src/hooks/useEventVolunteerTabMeta.js',
    'src/hooks/useVolunteerShifts.js',
    'src/hooks/useVolunteerApplications.js',
    'src/components/agenda/VolunteerReferentsSelector.jsx',
    'src/components/agenda/EventQuickTogglesGrid.jsx',
    'src/components/agenda/EventVolunteerShiftsEditor.jsx',
    'src/components/agenda/EventFormAdvancedDrawer.jsx',
    'src/components/event-details/EventTabsNav.jsx',
    'src/components/event-details/EventVolunteerSection.jsx',
    'src/components/event-details/RoadbookModal.jsx',
    'src/components/event-details/commissions/CommissionHubHeader.jsx',
    'src/components/event-details/commissions/EventCommissionsHub.jsx',
    'src/components/event-details/commissions/CommissionBasicInfoFields.jsx',
    'src/components/event-details/tabs/TabProgram.jsx',
    'src/components/event-details/tabs/TabVolunteers.jsx',
    'src/components/event-details/volunteers/VolunteerCalendarExportMenu.jsx',
    'src/components/event-details/volunteers/VolunteerKeyContactsCard.jsx',
    'src/components/event-details/volunteers/VolunteerSynopticToolbar.jsx',
    'src/components/event-details/volunteers/VolunteerSynopticTable.jsx',
    'src/components/event-details/volunteers/VolunteerSlotQuickAssignModal.jsx',
    'src/components/event-details/volunteers/VolunteerParticipantQuickModal.jsx',
    'src/components/event-details/volunteers/VolunteerApplicationsPanel.jsx',
    'src/components/event-details/volunteers/VolunteerDayOfOpsPanel.jsx',
    'src/components/event-details/volunteers/VolunteerCoordinatorModals.jsx',
    'src/components/event-details/volunteers/VolunteerQuickShiftCreator.jsx',
    'src/components/event-details/volunteers/VolunteerPersonalMemoBanner.jsx',
    'src/components/event-details/volunteers/VolunteerShiftCard.jsx',
    'src/components/event-details/volunteers/VolunteerExternalManualModal.jsx',
    'src/components/event-details/volunteers/VolunteerExternalDispatchModal.jsx',
    'src/components/event-details/volunteers/RoadbookVolunteersPrintSheet.jsx',
    'src/components/public/volunteers/PublicVolunteerCallPage.jsx',
    'src/components/public/volunteers/PublicVolunteerStatusScreen.jsx'
  ];

  for (const rel of filesUnder140) {
    const content = fs.readFileSync(path.join(rootDir, rel), 'utf8');
    const lines = countRealLines(content);
    assert.ok(lines < 140, `Plafond < 140 lignes dépassé pour ${rel} (${lines} L)`);
  }

  assert.deepStrictEqual(Object.keys(fr.agenda), Object.keys(pt.agenda), 'Parité 1:1 fr.agenda / pt.agenda');
  assert.deepStrictEqual(
    Object.keys(fr.settings.agenda.eventTypeConfigCard),
    Object.keys(pt.settings.agenda.eventTypeConfigCard),
    'Parité 1:1 eventTypeConfigCard FR / PT'
  );
  console.log(`✓ 4. Plafond < 140 L (${filesUnder140.length} fichiers) et parité stricte 1:1 FR/PT validés`);
}

console.log('🎉 TOUS LES TESTS ONGLET BÉNÉVOLES, SYNOPTIQUE & EXPORT AGENDA SONT AU VERT !');
