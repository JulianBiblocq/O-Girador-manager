/**
 * Batterie de tests unitaires — Mission 4 / 4 (Finale) :
 * Mémo Jour J (Membres & Externes), Feuille d'émargement Roadbook A4,
 * Export CSV Cuisine / T-shirts (dédoublonné) & Heures AG CERFA 12156 (zéro double comptage).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveShiftDayOfContacts,
  extractUserPersonalMemoEntries,
  generateExternalVolunteerMessage
} from '../src/utils/volunteerMemoUtils.js';
import { buildVolunteersAndLogisticsCsvData } from '../src/utils/volunteerCsvExportUtils.js';
import {
  calculateShiftDurationHours,
  calculateSingleEventShiftVolunteerHours
} from '../src/utils/volunteerHoursMetrics.js';
import { computeVolunteeringAndActivity } from '../src/utils/secretariatMetrics.js';
import { countRealLines } from '../.agents/hooks/pre_write_guard.mjs';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

console.log('=== 🧪 TEST MISSION 4 : MÉMOS JOUR J, EXPORT CSV DÉDOUBLONNÉ & HEURES CERFA 12156 ===');

// 1. Génération des mémos Jour J / Remerciements (FR & PT-BR) et Mémo personnel membre
{
  const allUsers = [
    { id: 'uid_ref_bar', prenom: 'Claire', nom: 'Dupont', telephone: '06 11 22 33 44' },
    { id: 'uid_orga', prenom: 'Tiago', nom: 'Rocha', telephone: '06 99 88 77 66' }
  ];
  const commissions = [{ id: 'comm_bar', titre: 'Buvette', referentsIds: ['uid_ref_bar'] }];
  const event = {
    id: 'evt_fete',
    titre: 'Grande Noite de Carnaval',
    date: '2026-06-21T20:00',
    lieu: 'Salle de la Cité',
    contactsJourJ: { referentGroupeId: 'uid_orga' }
  };
  const consolidatedShifts = [
    {
      id: 's_bar_1', nomTache: 'Service buvette', dateJour: '2026-06-21', horaires: '19:00 - 21:00',
      heureDebut: '19:00', heureFin: '21:00', consigne: 'Tabliers au comptoir', commissionId: 'comm_bar', commissionTitre: 'Buvette',
      inscrits: [
        { id: 'uid_mem_1', type: 'member', uid: 'uid_mem_1', prenom: 'Léo', nom: 'B.' },
        { id: 'g_1', type: 'guest', prenom: 'Marc', nom: 'V.', parrainUid: 'uid_mem_1', parrainNom: 'Léo' }
      ]
    },
    {
      id: 's_gen_1', nomTache: 'Accueil billetterie', dateJour: '2026-06-21', horaires: '18:00 - 19:00',
      heureDebut: '18:00', heureFin: '19:00', consigne: 'Caisse auprès du trésorier', commissionId: null, commissionTitre: '',
      inscrits: [{ id: 'uid_other', type: 'member', uid: 'uid_other', prenom: 'Autre', nom: 'X.' }]
    }
  ];

  // Mémo personnel pour uid_mem_1 : voit son créneau + celui de son proche Marc, mais pas uid_other
  const personalEntries = extractUserPersonalMemoEntries(consolidatedShifts, 'uid_mem_1');
  assert.strictEqual(personalEntries.length, 2);
  assert.strictEqual(personalEntries[0].kind, 'self');
  assert.strictEqual(personalEntries[1].kind, 'guest');
  assert.strictEqual(personalEntries[1].guestName, 'Marc V.');

  // Contact Jour J : référent commission pour s_bar_1, repli organisateur pour s_gen_1
  const barContacts = resolveShiftDayOfContacts(consolidatedShifts[0], { event, commissions, allUsers });
  assert.strictEqual(barContacts[0].prenom, 'Claire');
  assert.strictEqual(barContacts[0].telephone, '06 11 22 33 44');
  const genContacts = resolveShiftDayOfContacts(consolidatedShifts[1], { event, commissions, allUsers });
  assert.strictEqual(genContacts[0].prenom, 'Tiago');

  // Génération des messages externes FR et PT (memo_jour_j & thank_you)
  const appExt = {
    id: 'app_nadia', prenom: 'Nadia', nom: 'Silva',
    email: 'nadia@example.org', telephone: '06 55 44 33 22',
    assignedShiftIds: ['s_bar_1']
  };
  const shiftsById = Object.fromEntries(consolidatedShifts.map((s) => [s.id, s]));

  const memoFr = generateExternalVolunteerMessage({
    mode: 'memo_jour_j', locale: 'fr', application: appExt, event, associationName: 'Baque do Sol', shiftsById, commissions, allUsers
  });
  assert.ok(memoFr.subject.includes('[Baque do Sol]') && memoFr.subject.includes('Grande Noite de Carnaval'));
  assert.ok(memoFr.body.includes('Bonjour Nadia'));
  assert.ok(memoFr.body.includes('19:00 - 21:00 — Service buvette'));
  assert.ok(memoFr.body.includes('Tabliers au comptoir'));
  assert.ok(memoFr.body.includes('Claire (06 11 22 33 44)'));
  assert.ok(memoFr.whatsappUrl.startsWith('https://wa.me/33655443322?text='));
  assert.ok(memoFr.mailtoUrl.startsWith('mailto:nadia%40example.org?subject='));

  const memoPt = generateExternalVolunteerMessage({
    mode: 'memo_jour_j', locale: 'pt', application: appExt, event, associationName: 'Baque do Sol', shiftsById, commissions, allUsers
  });
  assert.ok(memoPt.body.includes('Olá Nadia'));
  assert.ok(memoPt.body.includes('Seus turnos'));

  const thanksFr = generateExternalVolunteerMessage({
    mode: 'thank_you', locale: 'fr', application: appExt, event, associationName: 'Baque do Sol'
  });
  assert.ok(thanksFr.body.includes('immense merci') && thanksFr.body.includes('Baque do Sol'));

  const thanksPt = generateExternalVolunteerMessage({
    mode: 'thank_you', locale: 'pt', application: appExt, event, associationName: 'Baque do Sol'
  });
  assert.ok(thanksPt.body.includes('agradecer de coração') && thanksPt.body.includes('Baque do Sol'));
  console.log('✓ 1. Génération des mémos Jour J / Remerciements (FR/PT) et contact référent validés');
}

// 2. Dédoublonnage strict des tailles de T-shirts et régimes repas dans l'export CSV multi-créneaux
{
  const allUsers = [
    { id: 'u_claire', uid: 'u_claire', prenom: 'Claire', nom: 'Dupont', email: 'claire@asso.org', telephone: '0601020304', tailleTshirt: 'S', dietaryRestrictions: ['Sans lactose'], allergies: 'Arachides' }
  ];
  const acceptedApplications = [
    { id: 'app_nadia', prenom: 'Nadia', nom: 'Silva', email: 'nadia@ext.org', telephone: '0611223344', lienAsso: 'Amie', regimeAlimentaire: 'Végétarienne', tailleTshirt: 'M', hasVehicle: true, vehicleDetails: 'Break', isAdult: true }
  ];

  // Nadia (externe, M, Végétarienne) prend 3 créneaux ; Claire (membre, S, Arachides) prend 2 créneaux ; 1 proche sur 1 créneau
  const consolidatedShifts = [
    {
      id: 'sh_1', dateJour: '2026-06-21', horaires: '17:00 - 19:00', nomTache: 'Montage', commissionTitre: 'Logistique',
      inscrits: [
        { id: 'ext_app_nadia', type: 'external', applicationId: 'app_nadia', prenom: 'Nadia', nom: 'Silva' },
        { id: 'u_claire', type: 'member', uid: 'u_claire', prenom: 'Claire', nom: 'Dupont' }
      ]
    },
    {
      id: 'sh_2', dateJour: '2026-06-21', horaires: '19:00 - 21:00', nomTache: 'Buvette Set 1', commissionTitre: 'Buvette',
      inscrits: [
        { id: 'ext_app_nadia', type: 'external', applicationId: 'app_nadia', prenom: 'Nadia', nom: 'Silva' },
        { id: 'g_julien', type: 'guest', prenom: 'Julien', nom: 'Martin', telephone: '0677889900', parrainUid: 'u_claire', parrainNom: 'Claire' }
      ]
    },
    {
      id: 'sh_3', dateJour: '2026-06-21', horaires: '21:00 - 23:00', nomTache: 'Buvette Set 2', commissionTitre: 'Buvette',
      inscrits: [
        { id: 'ext_app_nadia', type: 'external', applicationId: 'app_nadia', prenom: 'Nadia', nom: 'Silva' },
        { id: 'u_claire', type: 'member', uid: 'u_claire', prenom: 'Claire', nom: 'Dupont' }
      ]
    }
  ];

  const csvResult = buildVolunteersAndLogisticsCsvData({
    event: { titre: 'Festival Solstice', date: '2026-06-21' },
    consolidatedShifts,
    acceptedApplications,
    allUsers
  });

  assert.ok(csvResult.csvContent.startsWith('\uFEFF'), 'BOM UTF-8 obligatoire en tête du CSV');
  assert.strictEqual(csvResult.shiftRowsCount, 6, 'Bloc 1 doit lister les 6 affectations de créneaux');
  assert.strictEqual(csvResult.uniquePeopleCount, 3, 'Bloc 2 doit dédoublonner à exactement 3 personnes uniques');
  assert.deepStrictEqual(csvResult.tshirtCounts, { M: 1, S: 1 }, '1 seul T-shirt M et 1 seul T-shirt S malgré les créneaux multiples');
  assert.strictEqual(csvResult.dietaryList.length, 2, '2 personnes uniques ayant un régime/allergie');
  assert.ok(csvResult.csvContent.includes('"[ ]"'), 'Colonnes à cocher Arrivé / Tickets remis présentes');
  console.log('✓ 2. Export CSV (UTF-8 BOM + `;`) et dédoublonnage multi-créneaux T-shirts / Cuisine validés');
}

// 3. Calcul exact des heures CERFA 12156 avec ZÉRO double comptage
{
  assert.strictEqual(calculateShiftDurationHours({ heureDebut: '18:00', heureFin: '20:30' }), 2.5);
  assert.strictEqual(calculateShiftDurationHours({ heureDebut: '22:30', heureFin: '01:00' }), 2.5, 'Passage minuit géré');
  assert.strictEqual(calculateShiftDurationHours({ horaires: 'Toute la soirée' }), 2.0, 'Repli sécurité 2h sans HH:MM');

  // Concert de 20:00 à 23:00 (3.0 h) avec 1 musicien présent (u_musicien) et 1 membre non-présent (u_blesse)
  const concertEvent = {
    id: 'evt_cerfa_test',
    type: 'prestation',
    status: 'confirme',
    date: '2026-06-21T20:00',
    dateFin: '2026-06-21T23:00',
    inscriptions: [
      { userId: 'u_musicien', status: 'present' },
      { userId: 'u_blesse', status: 'absent' }
    ],
    volunteerShifts: [
      // 1) Montage 18:00 - 20:30 par u_musicien (présent au concert 20:00-23:00) -> 2.0 h hors concert (18:00-20:00), 0.5 h déduite !
      { id: 's_montage', dateJour: '2026-06-21', heureDebut: '18:00', heureFin: '20:30', inscrits: [{ id: 'u_musicien', type: 'member', uid: 'u_musicien' }] },
      // 2) Créneau pendant le concert 21:00 - 22:00 par u_musicien -> 0 h (100 % couvert par présence artistique) !
      { id: 's_pendant', dateJour: '2026-06-21', heureDebut: '21:00', heureFin: '22:00', inscrits: [{ id: 'u_musicien', type: 'member', uid: 'u_musicien' }] },
      // 3) Créneau pendant le concert 20:30 - 22:00 (1.5 h) par u_blesse (membre absent sur scène), un guest et un external -> 3 x 1.5 h = 4.5 h !
      {
        id: 's_buvette', dateJour: '2026-06-21', heureDebut: '20:30', heureFin: '22:00',
        inscrits: [
          { id: 'u_blesse', type: 'member', uid: 'u_blesse' },
          { id: 'g_1', type: 'guest', prenom: 'Ami', parrainUid: 'u_musicien' },
          { id: 'ext_1', type: 'external', applicationId: 'app_1', prenom: 'Nadia' }
        ]
      },
      // 4) Démontage lendemain 2026-06-22 de 10:00 à 12:00 par u_musicien -> 2.0 h !
      { id: 's_lendemain', dateJour: '2026-06-22', heureDebut: '10:00', heureFin: '12:00', inscrits: [{ id: 'u_musicien', type: 'member', uid: 'u_musicien' }] }
    ]
  };

  // Total shift hours attendus : 2.0 (montage hors concert) + 0 (pendant concert) + 4.5 (3x1.5h non-présents) + 2.0 (lendemain) = 8.5 h
  const shiftHours = calculateSingleEventShiftVolunteerHours(concertEvent, 3.0);
  assert.strictEqual(shiftHours, 8.5, 'Zéro double comptage sur le musicien présent + 100 % sur absents/proches/externes + lendemain');

  const stats = computeVolunteeringAndActivity([concertEvent], 10, { forfaitHeuresAdmin: 120, forfaitHeuresArtisanat: 80 });
  assert.strictEqual(stats.totalCollectiveVolunteerHours, 3.0, '1 musicien présent x 3h = 3.0 h collectives');
  assert.strictEqual(stats.totalShiftVolunteerHours, 8.5, 'totalShiftVolunteerHours exposé');
  assert.strictEqual(stats.totalCerfaVolunteerHours, 211.5, '3.0 + 8.5 + 120 + 80 = 211.5 h valorisées CERFA');
  console.log('✓ 3. Calcul exact des heures CERFA 12156 avec zéro double comptage validé');
}

// 4. Contrôle intégral < 140 L (Missions 1 à 4) et parité 1:1 FR/PT
{
  const allMissionFilesUnder140 = [
    'src/utils/volunteerShiftUtils.js',
    'src/utils/volunteerApplicationUtils.js',
    'src/utils/publicVolunteerUtils.js',
    'src/utils/volunteerMemoUtils.js',
    'src/utils/volunteerCsvExportUtils.js',
    'src/utils/volunteerHoursMetrics.js',
    'src/utils/agReportsExportUtils.js',
    'src/services/volunteerApplicationService.js',
    'src/services/publicCommissionShiftsSync.js',
    'src/hooks/useVolunteerShifts.js',
    'src/hooks/useVolunteerApplications.js',
    'src/components/agenda/EventVolunteerShiftsEditor.jsx',
    'src/components/agenda/VolunteerShiftFormCard.jsx',
    'src/components/agenda/VolunteerPublicCallConfigCard.jsx',
    'src/components/event-details/EventVolunteerSection.jsx',
    'src/components/event-details/volunteers/VolunteerShiftCard.jsx',
    'src/components/event-details/volunteers/VolunteerInscritBadge.jsx',
    'src/components/event-details/volunteers/VolunteerGuestModal.jsx',
    'src/components/event-details/volunteers/VolunteerPersonalMemoBanner.jsx',
    'src/components/event-details/volunteers/VolunteerApplicationsInbox.jsx',
    'src/components/event-details/volunteers/VolunteerApplicationCard.jsx',
    'src/components/event-details/volunteers/VolunteerShiftAssignModal.jsx',
    'src/components/event-details/volunteers/VolunteerLogisticFields.jsx',
    'src/components/event-details/volunteers/VolunteerExternalManualModal.jsx',
    'src/components/event-details/volunteers/VolunteerExternalDetailsModal.jsx',
    'src/components/event-details/volunteers/VolunteerExternalDispatchModal.jsx',
    'src/components/event-details/volunteers/EventVolunteerShareModal.jsx',
    'src/components/event-details/volunteers/RoadbookVolunteersPrintSheet.jsx',
    'src/components/public/volunteers/PublicVolunteerCallPage.jsx',
    'src/components/public/volunteers/PublicVolunteerStatusScreen.jsx',
    'src/components/public/volunteers/PublicVolunteerShiftsSelector.jsx',
    'src/components/public/volunteers/PublicVolunteerFormFields.jsx',
    'src/components/secretariat/reports/ReportVolunteerCard.jsx',
    'src/components/secretariat/SecretariatReportsView.jsx'
  ];

  for (const rel of allMissionFilesUnder140) {
    const lines = countRealLines(fs.readFileSync(path.join(rootDir, rel), 'utf8'));
    assert.ok(lines < 140, `Plafond < 140 lignes dépassé pour ${rel} (${lines} L)`);
  }

  assert.deepStrictEqual(Object.keys(fr.agenda), Object.keys(pt.agenda), 'Parité 1:1 fr.agenda / pt.agenda');
  assert.deepStrictEqual(Object.keys(fr.governance), Object.keys(pt.governance), 'Parité 1:1 fr.governance / pt.governance');
  console.log('✓ 4. Plafond < 140 L (34 modules Missions 1 à 4) et parité 1:1 FR/PT validés');
}

console.log('🎉 MISSION 4 : TOUS LES TESTS UNITAIRES SONT PASSÉS AVEC SUCCÈS !');
