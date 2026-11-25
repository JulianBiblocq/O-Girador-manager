/**
 * Batterie de tests unitaires — Mission 2 / 4 :
 * Configuration de l'appel public « à la carte » & Sas de validation des bénévoles externes
 *
 * Valide :
 * 1. Normalisation `publicVolunteerConfig` et `volunteer_applications` (zéro `undefined`, zéro fallback `'default'`)
 * 2. Filtrage strict des droits : simple membre vs référent de commission (+ `isFlexible`) vs admin global + tri mémoire `createdAt`
 * 3. Synchronisation atomique `accepted` ⇄ `benevolatInscrits` sans aucune fuite de données sensibles dans `events`
 * 4. Gouvernance `< 140 lignes`, étanchéité SaaS (`if (!groupId || !eventId)`), absence d'`orderBy` serveur et parité 1:1 `fr.js` / `pt.js`
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizePublicVolunteerConfig,
  normalizeVolunteerApplication,
  resolveUserReferentCommissionIds,
  canAccessVolunteerApplications,
  resolveManageableShiftIds,
  filterApplicationsForViewer,
  buildExternalShiftInscrit,
  applyExternalAssignmentsToBenevolatMap
} from '../src/utils/volunteerApplicationUtils.js';
import { consolidateVolunteerShifts, computeVolunteerCoverage } from '../src/utils/volunteerShiftUtils.js';
import { countRealLines } from '../.agents/hooks/pre_write_guard.mjs';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

console.log('=== 🧪 TEST MISSION 2 : APPEL PUBLIC À LA CARTE & SAS DE VALIDATION EXTERNES ===');

// 1. Normalisation de la configuration publique et des candidatures (zéro `undefined`)
{
  const defaultCfg = normalizePublicVolunteerConfig(undefined);
  assert.deepStrictEqual(defaultCfg, {
    enabled: false,
    welcomeMessage: '',
    askDietary: false,
    askTshirtSize: false,
    askVehicle: false,
    askAdultStatus: false
  });
  assert.ok(Object.values(defaultCfg).every((v) => v !== undefined), 'Zéro undefined dans publicVolunteerConfig');

  const rawPartialApp = {
    prenom: '  Camille ',
    nom: ' Moreau ',
    email: undefined,
    telephone: ' 06 11 22 33 44 ',
    lienAsso: ' Voisin de Claire ',
    isFlexible: 1,
    requestedShiftIds: ['s_bar_1', '', null, 's_bar_1'],
    regimeAlimentaire: 'Sans gluten',
    hasVehicle: undefined,
    isAdult: undefined
  };
  const normApp = normalizeVolunteerApplication(rawPartialApp, {
    groupId: 'baquesol',
    eventId: 'evt_carnaval_2026',
    nowIso: '2026-06-10T10:00:00.000Z'
  });

  assert.strictEqual(normApp.groupId, 'baquesol');
  assert.strictEqual(normApp.eventId, 'evt_carnaval_2026');
  assert.strictEqual(normApp.status, 'pending');
  assert.strictEqual(normApp.source, 'public_form');
  assert.strictEqual(normApp.prenom, 'Camille');
  assert.strictEqual(normApp.nom, 'Moreau');
  assert.strictEqual(normApp.email, '');
  assert.strictEqual(normApp.telephone, '06 11 22 33 44');
  assert.strictEqual(normApp.lienAsso, 'Voisin de Claire');
  assert.strictEqual(normApp.isFlexible, true);
  assert.deepStrictEqual(normApp.requestedShiftIds, ['s_bar_1']);
  assert.deepStrictEqual(normApp.assignedShiftIds, []);
  assert.strictEqual(normApp.disponibilitesNote, '');
  assert.strictEqual(normApp.regimeAlimentaire, 'Sans gluten');
  assert.strictEqual(normApp.tailleTshirt, '');
  assert.strictEqual(normApp.hasVehicle, false);
  assert.strictEqual(normApp.vehicleDetails, '');
  assert.strictEqual(normApp.isAdult, null);
  assert.strictEqual(normApp.createdAt, '2026-06-10T10:00:00.000Z');
  assert.strictEqual(normApp.updatedAt, '2026-06-10T10:00:00.000Z');
  assert.strictEqual(normApp.validatedByUid, '');
  assert.strictEqual(normApp.validatedByName, '');
  assert.ok(Object.values(normApp).every((v) => v !== undefined), 'Zéro valeur undefined tolérée dans volunteer_applications');
  assert.ok(Object.keys(normApp).length <= 25, 'Respect strict de keys().size() <= 25 dans firestore.rules');

  // Zéro fallback 'default' si groupId absent
  const emptyTenantApp = normalizeVolunteerApplication({ prenom: 'Léo' }, {});
  assert.strictEqual(emptyTenantApp.groupId, '');
  console.log('✓ 1. Normalisation publicVolunteerConfig & volunteer_applications (zéro undefined) validée');
}

// 2. Filtrage des droits : simple membre vs référent de commission vs admin global + tri mémoire
{
  const commissions = [
    { id: 'comm_bar', titre: 'Buvette', referentsIds: ['uid_ref_bar'], creneauxBenevoles: [{ id: 's_bar_1' }] },
    { id: 'comm_secu', titre: 'Accueil & Sécurité', referentIds: ['uid_ref_secu'], creneauxBenevoles: [{ id: 's_secu_1' }] }
  ];
  const allShifts = [
    { id: 's_gen', nomTache: 'Montage général', commissionId: null },
    { id: 's_bar_1', nomTache: 'Service buvette', commissionId: 'comm_bar' },
    { id: 's_secu_1', nomTache: 'Entrée public', commissionId: 'comm_secu' }
  ];

  const applications = [
    { id: 'app_gen', createdAt: '2026-06-10T09:00:00Z', isFlexible: false, requestedShiftIds: ['s_gen'], assignedShiftIds: [] },
    { id: 'app_bar', createdAt: '2026-06-10T11:00:00Z', isFlexible: false, requestedShiftIds: ['s_bar_1'], assignedShiftIds: [] },
    { id: 'app_secu', createdAt: '2026-06-10T10:00:00Z', isFlexible: false, requestedShiftIds: ['s_secu_1'], assignedShiftIds: [] },
    { id: 'app_flex', createdAt: '2026-06-10T12:00:00Z', isFlexible: true, requestedShiftIds: [], assignedShiftIds: [] }
  ];

  // Simple adhérent : aucun accès, liste vide
  assert.strictEqual(canAccessVolunteerApplications({ isGlobalManager: false, commissions, userUid: 'uid_simple_member' }), false);
  assert.deepStrictEqual(
    filterApplicationsForViewer(applications, { isGlobalManager: false, commissions, allShifts, userUid: 'uid_simple_member' }),
    []
  );

  // Référent commission Buvette (non admin) : voit uniquement s_bar_1 + isFlexible (triées par createdAt décroissant)
  assert.deepStrictEqual(resolveUserReferentCommissionIds(commissions, 'uid_ref_bar'), ['comm_bar']);
  assert.strictEqual(canAccessVolunteerApplications({ isGlobalManager: false, commissions, userUid: 'uid_ref_bar' }), true);
  const barManageable = resolveManageableShiftIds({ isGlobalManager: false, commissions, allShifts, userUid: 'uid_ref_bar' });
  assert.deepStrictEqual(Array.from(barManageable), ['s_bar_1']);

  const barVisible = filterApplicationsForViewer(applications, {
    isGlobalManager: false, commissions, allShifts, userUid: 'uid_ref_bar'
  });
  assert.deepStrictEqual(barVisible.map((a) => a.id), ['app_flex', 'app_bar']);

  // Gestionnaire global (Admin / Mestre / Bureau) : voit 100 % des candidatures triées par createdAt
  const adminVisible = filterApplicationsForViewer(applications, {
    isGlobalManager: true, commissions, allShifts, userUid: 'uid_admin'
  });
  assert.deepStrictEqual(adminVisible.map((a) => a.id), ['app_flex', 'app_bar', 'app_secu', 'app_gen']);
  console.log('✓ 2. Confidentialité simple membre, périmètre référent (+ isFlexible) et vue globale admin validés');
}

// 3. Synchronisation atomique `accepted` ⇄ `benevolatInscrits` SANS fuite de données sensibles
{
  const sensitiveApp = {
    id: 'app_ext_42',
    prenom: 'Nadia',
    nom: 'Silva',
    email: 'nadia.secret@example.com',
    telephone: '0699887766',
    lienAsso: 'Amie de la trésorière',
    regimeAlimentaire: 'Allergie sévère arachides',
    tailleTshirt: 'M',
    hasVehicle: true,
    vehicleDetails: 'Fourgon 9m3',
    isAdult: true
  };

  const minimalInscrit = buildExternalShiftInscrit('app_ext_42', sensitiveApp);
  assert.deepStrictEqual(minimalInscrit, {
    id: 'ext_app_ext_42',
    type: 'external',
    applicationId: 'app_ext_42',
    prenom: 'Nadia',
    nom: 'Silva',
    lienAsso: 'Amie de la trésorière'
  });
  for (const forbiddenKey of ['email', 'telephone', 'regimeAlimentaire', 'tailleTshirt', 'hasVehicle', 'vehicleDetails', 'isAdult']) {
    assert.strictEqual(forbiddenKey in minimalInscrit, false, `Fuite interdite de ${forbiddenKey} dans events`);
  }

  const initialMap = {
    s_bar_1: [{ id: 'uid_1', type: 'member', uid: 'uid_1', prenom: 'Claire', nom: 'D.' }]
  };
  const updatedMap = applyExternalAssignmentsToBenevolatMap(initialMap, 'app_ext_42', sensitiveApp, ['s_bar_1', 's_accueil']);
  assert.strictEqual(updatedMap.s_bar_1.length, 2);
  assert.strictEqual(updatedMap.s_accueil.length, 1);
  assert.strictEqual(JSON.stringify(updatedMap).includes('nadia.secret@example.com'), false);
  assert.strictEqual(JSON.stringify(updatedMap).includes('0699887766'), false);
  assert.strictEqual(JSON.stringify(updatedMap).includes('arachides'), false);

  // Vérification de la consolidation avec un événement et calcul de jauge
  const consolidated = consolidateVolunteerShifts({
    id: 'evt_1',
    date: '2026-06-21T20:00',
    volunteerShifts: [
      { id: 's_bar_1', nomTache: 'Buvette', heureDebut: '19:00', heureFin: '21:00', quotaRequis: 2 },
      { id: 's_accueil', nomTache: 'Billetterie', heureDebut: '18:00', heureFin: '19:00', quotaRequis: 1 }
    ],
    covoiturage: { benevolatInscrits: updatedMap }
  });
  const cov = computeVolunteerCoverage(consolidated);
  assert.strictEqual(cov.filledPosts, 3);
  assert.strictEqual(cov.totalRequired, 3);
  assert.strictEqual(cov.isComplete, true);
  assert.strictEqual(consolidated[0].inscrits[0].type, 'external');
  assert.strictEqual(consolidated[0].inscrits[0].applicationId, 'app_ext_42');

  // Retrait d'un créneau : nettoyage propre sans doublon ni résidu
  const afterWithdraw = applyExternalAssignmentsToBenevolatMap(updatedMap, 'app_ext_42', sensitiveApp, ['s_bar_1']);
  assert.strictEqual(afterWithdraw.s_accueil.length, 0);
  assert.strictEqual(afterWithdraw.s_bar_1.length, 2);
  console.log('✓ 3. Synchronisation atomique accepted ⇄ benevolatInscrits sans fuite RGPD validée');
}

// 4. Gouvernance < 140 lignes, garde multi-tenant, absence d'orderBy serveur et parité FR/PT
{
  const strictUnder140Files = [
    // Lot 1
    'src/utils/volunteerShiftUtils.js',
    'src/hooks/useVolunteerShifts.js',
    'src/components/agenda/EventVolunteerShiftsEditor.jsx',
    'src/components/agenda/VolunteerShiftFormCard.jsx',
    'src/components/event-details/EventVolunteerSection.jsx',
    'src/components/event-details/volunteers/VolunteerGuestModal.jsx',
    'src/components/event-details/volunteers/VolunteerShiftCard.jsx',
    // Lot 2
    'src/utils/volunteerApplicationUtils.js',
    'src/services/volunteerApplicationService.js',
    'src/hooks/useVolunteerApplications.js',
    'src/components/agenda/VolunteerPublicCallConfigCard.jsx',
    'src/components/event-details/volunteers/VolunteerApplicationCard.jsx',
    'src/components/event-details/volunteers/VolunteerShiftAssignModal.jsx',
    'src/components/event-details/volunteers/VolunteerApplicationsInbox.jsx',
    'src/components/event-details/volunteers/VolunteerLogisticFields.jsx',
    'src/components/event-details/volunteers/VolunteerExternalManualModal.jsx',
    'src/components/event-details/volunteers/VolunteerExternalDetailsModal.jsx',
    'src/components/event-details/volunteers/VolunteerInscritBadge.jsx',
    'src/components/event-details/commissions/CommissionHubHeader.jsx',
    'src/components/event-details/commissions/EventCommissionsHub.jsx'
  ];

  for (const rel of strictUnder140Files) {
    const content = fs.readFileSync(path.join(rootDir, rel), 'utf8');
    const lines = countRealLines(content);
    assert.ok(lines < 140, `Plafond < 140 lignes dépassé pour ${rel} (${lines} lignes)`);
  }

  const hookSrc = fs.readFileSync(path.join(rootDir, 'src/hooks/useVolunteerApplications.js'), 'utf8');
  assert.ok(hookSrc.includes('if (!groupId || !eventId)'), 'Garde multi-tenant strict requis dans useVolunteerApplications.js');
  assert.ok(!hookSrc.includes('orderBy('), 'Aucun orderBy serveur ne doit être utilisé sur volunteer_applications');

  assert.deepStrictEqual(Object.keys(fr.agenda), Object.keys(pt.agenda), 'Parité stricte 1:1 requise entre fr.agenda et pt.agenda');
  console.log('✓ 4. Plafond < 140 L (Lots 1 & 2), garde multi-tenant, zéro orderBy serveur et parité FR/PT validés');
}

console.log('🎉 MISSION 2 : TOUS LES TESTS UNITAIRES SONT PASSÉS AVEC SUCCÈS !');
