import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  normalizeWorkshopPolicy,
  doesMemberMatchTargetPupitres,
  resolveEventTargetPupitres,
  partitionWorkshopParticipants,
  computeWorkshopAttendanceBreakdown
} from '../src/utils/workshopSanctuaryUtils.js';
import { buildWorkshopReconfirmMessage } from '../src/utils/workshopSanctuaryNotifications.js';

const require = createRequire(import.meta.url);
const { buildMulticastMessage, buildNotifTag, UNIFIED_ALFAIA_NOTIF_TAG } = require('../functions/pushMessage.js');
const { buildDynamicManifestPayload } = require('../functions/manifestDynamicHelper.js');

console.log('🧪 RECETTE : BADGE ALFAIA UNIQUE & SANCTUARISATION SAAS DES ATELIERS PAR PUPITRE...');

// 1. Chantier 1 : Tag unique `organizador-alfaia` + `renotify: true` + manifest `purpose: "monochrome"`
{
  assert.equal(UNIFIED_ALFAIA_NOTIF_TAG, 'organizador-alfaia');
  assert.equal(buildNotifTag({ eventId: 'ev1' }, { groupId: 'g1', title: 'A', body: 'B', url: '/app' }), 'organizador-alfaia');
  assert.equal(buildNotifTag({ announcementId: 'an2' }, { groupId: 'g1', title: 'C', body: 'D', url: '/app' }), 'organizador-alfaia');

  const msgA = buildMulticastMessage({
    dataPayload: { eventId: 'ev_1', url: '/app/agenda?eventId=ev_1' },
    groupId: 'troupe_a',
    title: 'Atelier Caixas',
    body: 'Créneau retenu',
    assoIcon: '',
    tokens: ['tok1']
  });
  const msgB = buildMulticastMessage({
    dataPayload: { announcementId: 'ann_99', url: '/app' },
    groupId: 'troupe_a',
    title: 'Nouvelle annonce',
    body: 'Infos répétition',
    assoIcon: '',
    tokens: ['tok1']
  });

  assert.equal(msgA.android.notification.tag, 'organizador-alfaia');
  assert.equal(msgB.android.notification.tag, 'organizador-alfaia');
  assert.equal(msgA.webpush.notification.tag, 'organizador-alfaia');
  assert.equal(msgB.webpush.notification.tag, 'organizador-alfaia');
  assert.equal(msgA.webpush.notification.renotify, true);
  assert.equal(msgA.data.tag, 'organizador-alfaia');
  assert.equal(msgA.data.renotify, 'true');

  const swText = fs.readFileSync(path.resolve('public/firebase-messaging-sw.js'), 'utf8');
  assert.ok(swText.includes("getNotifications({ tag: ORGANIZADOR_ALFAIA_TAG })"), 'SW doit inspecter getNotifications avec le tag unique');
  assert.ok(swText.includes('renotify: true'), 'SW doit activer renotify: true');

  const staticManifest = JSON.parse(fs.readFileSync(path.resolve('public/manifest.json'), 'utf8'));
  assert.ok(staticManifest.icons.some((i) => i.purpose === 'any'));
  assert.ok(staticManifest.icons.some((i) => i.purpose === 'maskable'));
  assert.ok(staticManifest.icons.some((i) => i.purpose === 'monochrome' && i.src === '/icons/badge-alfaia-mono.png'));

  const dynManifest = buildDynamicManifestPayload({ effectiveHost: 'organizador.o-girador.com', groupId: 'troupe_a' });
  assert.ok(dynManifest.icons.some((i) => i.purpose === 'monochrome' && i.src.endsWith('/icons/badge-alfaia-mono.png')));
  console.log('✅ Chantier 1 validé : tag unique organizador-alfaia, renotify: true et icône monochrome WebAPK.');
}

// 2. Chantier 2 : Tri 5 Caixas vs 10 autres pupitres (sondage + rattrapage en production + horsPupitre)
{
  assert.equal(normalizeWorkshopPolicy(undefined), 'reconfirm');
  assert.equal(normalizeWorkshopPolicy('reconfirm'), 'reconfirm');
  assert.equal(normalizeWorkshopPolicy('strict'), 'strict');

  const pupitresList = ['Alfaias', 'Caixas', 'Gonguê', 'Agbê'];
  const linked = [{ name: 'Surdos', instruments: ['Surdo 1', 'Surdo 2', 'Surdo 3'] }];

  assert.equal(doesMemberMatchTargetPupitres({ instrumentPrincipal: 'Caixa' }, ['Caixas'], pupitresList), true);
  assert.equal(doesMemberMatchTargetPupitres({ instrumentPrincipal: 'Tarol' }, ['Caixas'], pupitresList), true);
  assert.equal(doesMemberMatchTargetPupitres({ instrumentPrincipal: 'Alfaia' }, ['Caixas'], pupitresList), false);
  assert.equal(doesMemberMatchTargetPupitres({ instrumentPrincipal: 'Surdo 2' }, ['Surdos'], ['Surdos', 'Caixa'], linked), true);

  // Simulation exacte du cas réel : 5 joueurs de Caixa + 10 joueurs d'autres pupitres ayant voté Disponible
  const allUsersMap = {};
  const pollInscriptions = [];
  for (let i = 1; i <= 5; i++) {
    const uid = `caixa_${i}`;
    const inst = i === 5 ? 'Tarol' : 'Caixa';
    allUsersMap[uid] = { id: uid, name: `Caixa ${i}`, instrumentPrincipal: inst };
    pollInscriptions.push({ userId: uid, userName: `Caixa ${i}`, status: 'present', pollVote: 'dispo', instrument: inst, instrumentChoisi: inst });
  }
  for (let i = 1; i <= 10; i++) {
    const uid = `other_${i}`;
    const inst = i <= 6 ? 'Alfaia' : (i <= 8 ? 'Agbê' : 'Gonguê');
    allUsersMap[uid] = { id: uid, name: `Autre ${i}`, instrumentPrincipal: inst };
    pollInscriptions.push({ userId: uid, userName: `Autre ${i}`, status: 'present', pollVote: 'dispo', instrument: inst, instrumentChoisi: inst });
  }

  const slotEvent = { id: 'slot_caixas', titre: 'Atelier — Option 1', status: 'sondage', isPoll: true, inscriptions: pollInscriptions };

  // Mode 'reconfirm' (par défaut)
  const reconfirmRes = partitionWorkshopParticipants({
    event: slotEvent,
    targetPupitres: ['Caixas'],
    policy: 'reconfirm',
    allUsersMap,
    pupitresList,
    mode: 'poll_validation'
  });
  const presentCountReconfirm = reconfirmRes.inscriptions.filter((i) => i.status === 'present').length;
  const pendingReconfirmCount = reconfirmRes.inscriptions.filter((i) => i.status === 'pending_reconfirm').length;
  assert.equal(presentCountReconfirm, 5, 'Seuls les 5 joueurs de Caixas doivent être comptés en Présent (et non 15)');
  assert.equal(pendingReconfirmCount, 10, 'Les 10 votants hors-pupitre doivent passer en pending_reconfirm');
  assert.equal(reconfirmRes.reconfirmRecipients.length, 10);

  // Mode 'strict'
  const strictRes = partitionWorkshopParticipants({
    event: slotEvent,
    targetPupitres: ['Caixas'],
    policy: 'strict',
    allUsersMap,
    pupitresList,
    mode: 'poll_validation'
  });
  assert.equal(strictRes.inscriptions.length, 5, 'En mode strict, seuls les 5 titulaires restent inscrits');
  assert.equal(strictRes.removedStrictUsers.length, 10);

  // Simulation d'adhérents hors-pupitre : 2 re-confirment ("Oui, je participe"), 8 restent en attente
  const afterTwoReconfirmed = reconfirmRes.inscriptions.map((ins) => {
    if (ins.userId === 'other_1' || ins.userId === 'other_2') {
      return { ...ins, status: 'present', horsPupitre: true, isTargetPupitreMember: false, reconfirmedAt: '2026-11-25T12:00:00.000Z' };
    }
    return ins;
  });
  const breakdown = computeWorkshopAttendanceBreakdown({
    event: { id: 'slot_caixas', status: 'confirme', pollAssignedPupitres: ['Caixas'], inscriptions: afterTwoReconfirmed },
    allUsersMap,
    pupitresList
  });
  assert.equal(breakdown.titulairesPresents.length, 5, 'Sous-total Titulaires Caixas = 5');
  assert.equal(breakdown.autresPupitresPresents.length, 2, 'Sous-total Autres pupitres = 2');
  assert.equal(breakdown.pendingReconfirmList.length, 8, '8 membres restent en attente de re-confirmation');

  // Outil de rattrapage immédiat sur un atelier DÉJÀ confirmé en production (où les 15 votants sont restés en present)
  const legacyConfirmedWorkshop = {
    id: 'prod_workshop_caixas',
    type: 'atelier',
    titre: 'Atelier — Caixas',
    status: 'confirme',
    isPoll: false,
    inscriptions: pollInscriptions.map(({ pollVote: _pv, ...rest }) => ({ ...rest, status: 'present' }))
  };
  assert.deepEqual(resolveEventTargetPupitres(legacyConfirmedWorkshop, pupitresList), ['Caixas']);
  const catchupRes = partitionWorkshopParticipants({
    event: legacyConfirmedWorkshop,
    targetPupitres: ['Caixas'],
    policy: 'reconfirm',
    allUsersMap,
    pupitresList,
    mode: 'catchup'
  });
  assert.equal(catchupRes.titulairesPresent.length, 5, 'Rattrapage prod : 5 titulaires Caixas conservés en Présent');
  assert.equal(catchupRes.reconfirmRecipients.length, 10, 'Rattrapage prod : 10 hors-pupitre basculés en pending_reconfirm');
  assert.ok(buildWorkshopReconfirmMessage('lun. 30 nov.', 'Caixas').includes('confirme sur la fiche'));
  console.log('✅ Chantier 2 validé : tri SaaS reconfirm/strict, ventilation sous-totaux et outil de rattrapage prod.');
}

// 3. Audit du plafond < 145 lignes sur tous les nouveaux modules créés
const newModules = [
  'src/utils/workshopSanctuaryUtils.js',
  'src/utils/workshopSanctuaryNotifications.js',
  'src/components/association-settings/WorkshopPollPolicyField.jsx',
  'src/components/event-details/WorkshopPendingReconfirmBanner.jsx',
  'src/components/event-details/WorkshopAttendanceBreakdownBar.jsx',
  'src/components/event-details/WorkshopSanctuaryMestreCard.jsx'
];
for (const rel of newModules) {
  const txt = fs.readFileSync(path.resolve(rel), 'utf8');
  const lines = txt.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length;
  assert.ok(lines < 145, `${rel} dépasse le plafond (< 145 L) : ${lines} L`);
  assert.ok(!/samambaia/i.test(txt), `Zéro nom d'association codé en dur autorisé dans ${rel}`);
}
console.log('✅ Gouvernance modulaire (< 145 L) et étanchéité SaaS vérifiées.');
