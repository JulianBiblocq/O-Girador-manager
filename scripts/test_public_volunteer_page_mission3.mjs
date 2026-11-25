/**
 * Batterie de tests unitaires — Mission 3 / 4 :
 * Page publique « Coup de main » en marque blanche (Mostrador), QR Code & Partage
 *
 * Valide :
 * 1. Synchronisation des créneaux de commissions vers `publicCommissionShifts` sans fuite de budget/notes
 * 2. Calcul 100 % anonyme des places restantes (`computePublicAnonymousShifts`, zéro exposition de noms)
 * 3. Validation du formulaire public (créneau précis vs `isFlexible`, socle, RGPD, honeypot anti-spam)
 * 4. Construction de l'URL de partage (domaine personnalisé vs Mostrador vs localhost) & routage `/benevoles/:eventId`
 * 5. Gouvernance `< 140 L`, Mode Cliquet, rewrites `firebase.json` et parité stricte 1:1 `fr.js` / `pt.js`
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPublicCommissionShifts,
  computePublicAnonymousShifts,
  validatePublicVolunteerSubmission,
  buildPublicVolunteerCallUrl,
  buildPublicVolunteerRelativeHref
} from '../src/utils/publicVolunteerUtils.js';
import {
  extractPublicVolunteerEventId,
  isPublicVolunteerRoute,
  sanitizeLockedVitrinePathname,
  extractVitrineSlugFromPath,
  resolveIsVitrineMode
} from '../src/utils/vitrineLockUtils.js';
import { countRealLines } from '../.agents/hooks/pre_write_guard.mjs';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

console.log('=== 🧪 TEST MISSION 3 : PAGE PUBLIQUE COUP DE MAIN, QR CODE & PARTAGE ===');

// 1. Synchronisation publique des créneaux de commissions sans fuite interne
{
  const privateCommissions = [
    {
      id: 'comm_bar',
      titre: 'Buvette & Restauration',
      description: 'Note interne confidentielle : code cadenas frigo 4829',
      referentsIds: ['uid_secret_1'],
      budget: { demande: 850, alloue: 700, statusArbitrage: 'valide', motifRefus: 'Note trésorier' },
      jalons: [{ id: 'j1', titre: 'Commande fûts', notes: 'Fournisseur privé' }],
      creneauxBenevoles: [
        {
          id: 'c_bar_1',
          role: 'Service buvette set 1',
          horaireDebut: '19:00',
          horaireFin: '21:00',
          nbPlaces: 4,
          consigne: 'Tabliers fournis au comptoir',
          inscrits: ['uid_member_a'],
          inscritsIds: ['uid_member_a']
        }
      ]
    }
  ];

  const mirrored = buildPublicCommissionShifts(privateCommissions, '2026-06-21');
  assert.strictEqual(mirrored.length, 1);
  assert.deepStrictEqual(Object.keys(mirrored[0]).sort(), [
    'commissionId', 'commissionTitre', 'consigne', 'dateJour',
    'heureDebut', 'heureFin', 'horaires', 'id', 'nomTache', 'quotaRequis'
  ]);
  assert.strictEqual(mirrored[0].nomTache, 'Service buvette set 1');
  assert.strictEqual(mirrored[0].quotaRequis, 4);
  assert.strictEqual(mirrored[0].commissionTitre, 'Buvette & Restauration');

  const serializedMirror = JSON.stringify(mirrored);
  assert.strictEqual(serializedMirror.includes('4829'), false, 'Zéro note interne de commission');
  assert.strictEqual(serializedMirror.includes('budget'), false, 'Zéro donnée budgétaire');
  assert.strictEqual(serializedMirror.includes('uid_member_a'), false, 'Zéro UID inscrit dans la définition');
  console.log('✓ 1. Projection publique `publicCommissionShifts` sans fuite de budget ni note interne validée');
}

// 2. Calcul 100 % anonyme des places restantes (zéro nom, prénom ou coordonnée exposé)
{
  const publicEventDoc = {
    id: 'evt_festival_ete',
    date: '2026-06-21T18:00',
    publicVolunteerConfig: { enabled: true },
    volunteerShifts: [
      { id: 's_accueil', nomTache: 'Accueil public', dateJour: '2026-06-21', heureDebut: '18:00', heureFin: '20:00', quotaRequis: 2, consigne: 'Entrée principale' },
      { id: 's_volant', nomTache: 'Renfort logistique', dateJour: '2026-06-21', heureDebut: '22:00', heureFin: '23:30', quotaRequis: 0 }
    ],
    publicCommissionShifts: [
      { id: 'c_bar_1', nomTache: 'Service buvette', dateJour: '2026-06-21', heureDebut: '19:00', heureFin: '21:00', horaires: '19:00 - 21:00', quotaRequis: 4, consigne: '', commissionId: 'comm_bar', commissionTitre: 'Buvette' }
    ],
    covoiturage: {
      benevolatInscrits: {
        s_accueil: [
          { id: 'u1', type: 'member', uid: 'u1', prenom: 'Claire', nom: 'Dupont' },
          { id: 'g1', type: 'guest', prenom: 'Julien', nom: 'Martin', telephone: '0611223344', parrainUid: 'u1', parrainNom: 'Claire' }
        ],
        c_bar_1: [
          { id: 'ext_1', type: 'external', applicationId: 'app_1', prenom: 'Nadia', nom: 'Silva', lienAsso: 'Voisin' }
        ]
      }
    }
  };

  const anonShifts = computePublicAnonymousShifts(publicEventDoc);
  assert.deepStrictEqual(anonShifts.map((s) => s.id), ['s_accueil', 'c_bar_1', 's_volant']);

  // s_accueil : 2/2 -> remaining = 0, isFull = true
  assert.strictEqual(anonShifts[0].remaining, 0);
  assert.strictEqual(anonShifts[0].isFull, true);

  // c_bar_1 : 1/4 -> remaining = 3, isFull = false
  assert.strictEqual(anonShifts[1].remaining, 3);
  assert.strictEqual(anonShifts[1].isFull, false);

  // s_volant : quota 0 -> remaining = null, isFull = false
  assert.strictEqual(anonShifts[2].remaining, null);
  assert.strictEqual(anonShifts[2].isFull, false);

  const serializedAnon = JSON.stringify(anonShifts);
  for (const secretToken of ['Claire', 'Dupont', 'Julien', 'Martin', '0611223344', 'Nadia', 'Silva', 'inscrits":']) {
    assert.strictEqual(serializedAnon.includes(secretToken), false, `Zéro exposition de "${secretToken}" autorisée côté public`);
  }
  console.log('✓ 2. Calcul anonyme des places restantes (zéro exposition de noms ou coordonnées) validé');
}

// 3. Validation du formulaire public (créneau précis vs `isFlexible`, socle, RGPD, honeypot)
{
  const baseValidForm = {
    prenom: 'Lucas',
    nom: 'Pereira',
    email: 'lucas@example.org',
    telephone: '06 22 33 44 55',
    lienAsso: 'Ami de Tiago',
    isFlexible: false,
    requestedShiftIds: ['c_bar_1'],
    rgpdConsent: true
  };

  assert.strictEqual(validatePublicVolunteerSubmission(baseValidForm).valid, true);

  // Sans créneau et sans isFlexible -> invalide
  const noChoice = validatePublicVolunteerSubmission({ ...baseValidForm, requestedShiftIds: [], isFlexible: false });
  assert.strictEqual(noChoice.valid, false);
  assert.ok(noChoice.errors.includes('MISSING_SHIFT_OR_FLEXIBLE'));

  // Sans créneau précis mais `isFlexible === true` -> valide !
  const flexibleChoice = validatePublicVolunteerSubmission({ ...baseValidForm, requestedShiftIds: [], isFlexible: true });
  assert.strictEqual(flexibleChoice.valid, true);

  // Sans consentement RGPD -> invalide
  const noRgpd = validatePublicVolunteerSubmission({ ...baseValidForm, rgpdConsent: false });
  assert.strictEqual(noRgpd.valid, false);
  assert.ok(noRgpd.errors.includes('MISSING_RGPD_CONSENT'));

  // Honeypot anti-spam rempli -> rejeté
  const botAttempt = validatePublicVolunteerSubmission(baseValidForm, { honeypot: 'http://spam.bot' });
  assert.strictEqual(botAttempt.valid, false);
  assert.ok(botAttempt.errors.includes('HONEYPOT_SPAM'));
  console.log('✓ 3. Validation du formulaire (créneau précis vs Poste flexible, RGPD et honeypot) validée');
}

// 4. Construction de l'URL de partage & Routage `/benevoles/:eventId` sans redirection forcée
{
  // Domaine personnalisé Vitrine configuré (hors localhost)
  assert.strictEqual(
    buildPublicVolunteerCallUrl({
      eventId: 'evt_99',
      groupId: 'baquesol',
      associationSettings: { customDomains: ['baque-do-sol.fr'] },
      hostname: 'organizador.o-girador.com',
      origin: 'https://organizador.o-girador.com'
    }),
    'https://baque-do-sol.fr/benevoles/evt_99'
  );

  // Association sans domaine personnalisé (sous-domaine Mostrador mutualisé)
  assert.strictEqual(
    buildPublicVolunteerCallUrl({
      eventId: 'evt_99',
      groupId: 'baquesol',
      associationSettings: {},
      hostname: 'organizador.o-girador.com',
      origin: 'https://organizador.o-girador.com'
    }),
    'https://mostrador.o-girador.com/benevoles/evt_99?groupe=baquesol'
  );

  // Développement local (localhost:5173 et localhost:5175) avec ?groupe=...
  assert.strictEqual(
    buildPublicVolunteerCallUrl({
      eventId: 'evt_99',
      groupId: 'baquesol',
      associationSettings: { customDomains: ['baque-do-sol.fr'] },
      hostname: 'localhost',
      origin: 'http://localhost:5173'
    }),
    'http://localhost:5173/benevoles/evt_99?groupe=baquesol'
  );
  assert.strictEqual(
    buildPublicVolunteerCallUrl({
      eventId: 'evt_99',
      groupId: 'baquesol',
      hostname: 'localhost',
      origin: 'http://localhost:5175'
    }),
    'http://localhost:5175/benevoles/evt_99?groupe=baquesol'
  );

  assert.strictEqual(buildPublicVolunteerRelativeHref({ id: 'evt_99', groupId: 'baquesol' }, { isCustomDomain: true }), '/benevoles/evt_99');
  assert.strictEqual(buildPublicVolunteerRelativeHref({ id: 'evt_99', groupId: 'baquesol' }, { isCustomDomain: false }), '/benevoles/evt_99?groupe=baquesol');

  // Reconnaissance universelle de /benevoles/:eventId sans nettoyage destructif ni faux slug
  assert.strictEqual(extractPublicVolunteerEventId('/benevoles/evt_99'), 'evt_99');
  assert.strictEqual(extractPublicVolunteerEventId('/baquesol/benevoles/evt_99'), 'evt_99');
  assert.strictEqual(isPublicVolunteerRoute('/benevoles/evt_99'), true);
  assert.strictEqual(sanitizeLockedVitrinePathname('baque-do-sol.fr', '/benevoles/evt_99'), '/benevoles/evt_99');
  assert.strictEqual(extractVitrineSlugFromPath('/benevoles/evt_99', 'mostrador.o-girador.com'), null);
  assert.strictEqual(resolveIsVitrineMode({ hostname: 'localhost', pathname: '/benevoles/evt_99', appMode: 'organizador' }), true);
  assert.strictEqual(resolveIsVitrineMode({ hostname: 'organizador.o-girador.com', pathname: '/benevoles/evt_99', appMode: 'organizador' }), true);
  console.log('✓ 4. Construction des URLs de partage (domaine personnalisé vs localhost) & routage /benevoles/:eventId validés');
}

// 5. Gouvernance < 140 L, Mode Cliquet, firebase.json et parité 1:1 FR/PT
{
  const strictUnder140 = [
    'src/utils/publicVolunteerUtils.js',
    'src/services/publicCommissionShiftsSync.js',
    'src/utils/vitrineLockUtils.js',
    'src/components/public/VitrineRouteShell.jsx',
    'src/components/public/volunteers/PublicVolunteerCallPage.jsx',
    'src/components/public/volunteers/PublicVolunteerStatusScreen.jsx',
    'src/components/public/volunteers/PublicVolunteerShiftsSelector.jsx',
    'src/components/public/volunteers/PublicVolunteerFormFields.jsx',
    'src/components/event-details/volunteers/EventVolunteerShareModal.jsx',
    'src/components/agenda/VolunteerPublicCallConfigCard.jsx',
    'src/components/agenda/EventVolunteerShiftsEditor.jsx',
    'src/components/event-details/EventVolunteerSection.jsx',
    'src/utils/volunteerShiftUtils.js'
  ];

  for (const rel of strictUnder140) {
    const lines = countRealLines(fs.readFileSync(path.join(rootDir, rel), 'utf8'));
    assert.ok(lines < 140, `Plafond < 140 lignes dépassé pour ${rel} (${lines} L)`);
  }

  const fbJson = fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8');
  assert.ok(fbJson.includes('"/benevoles/**"'), 'firebase.json doit déclarer le rewrite /benevoles/** vers serveDynamicApp');

  assert.deepStrictEqual(Object.keys(fr.agenda), Object.keys(pt.agenda), 'Parité stricte 1:1 requise entre fr.agenda et pt.agenda');
  console.log('✓ 5. Plafond < 140 L, rewrites Hosting /benevoles/** et parité 1:1 FR/PT validés');
}

console.log('🎉 MISSION 3 : TOUS LES TESTS UNITAIRES SONT PASSÉS AVEC SUCCÈS !');
