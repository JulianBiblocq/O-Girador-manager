/**
 * Batterie de tests unitaires — Mission 1 / 4 : Créneaux Bénévoles Enrichis
 * Valide :
 * 1. La rétrocompatibilité 100 % des anciens volunteerShifts et creneauxBenevoles + membres & proches invités
 * 2. Le calcul de quota complet et de jauge consolidée (X / Y postes pourvus) + tri chronologique
 * 3. La détection pure de chevauchement horaire scène / balance (et exclusion veille/lendemain)
 * 4. La compatibilité stricte Firestore SSOT pour un adhérent standard + plafond < 140 L + parité FR/PT
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeVolunteerShift,
  isVolunteerShiftFull,
  consolidateVolunteerShifts,
  computeVolunteerCoverage,
  detectStageScheduleConflict,
  isMemberArtisticPresent
} from '../src/utils/volunteerShiftUtils.js';
import { countRealLines } from '../.agents/hooks/pre_write_guard.mjs';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

console.log('=== 🧪 TEST MISSION 1 : CRÉNEAUX BÉNÉVOLES ENRICHIS & FUSION COMMISSIONS ===');

// 1. Rétrocompatibilité des anciens créneaux & normalisation inscrits (member + guest)
{
  const usersMap = {
    uid_claire: { id: 'uid_claire', prenom: 'Claire', nom: 'Dupont' },
    uid_tiago: { id: 'uid_tiago', prenom: 'Tiago', nom: 'Rocha' }
  };

  const legacyShift = {
    id: 'legacy_1',
    nomTache: 'Tenue de la buvette',
    horaires: '20:00 - 22:00',
    inscrits: [
      'uid_claire',
      { uid: 'uid_tiago', nom: 'Rocha' },
      { id: 'g1', type: 'guest', prenom: 'Julien', nom: 'Martin', telephone: '0611223344', parrainUid: 'uid_claire', parrainNom: 'Claire' }
    ]
  };

  const norm = normalizeVolunteerShift(legacyShift, { eventDateJour: '2026-06-21', usersMap });
  assert.strictEqual(norm.id, 'legacy_1');
  assert.strictEqual(norm.nomTache, 'Tenue de la buvette');
  assert.strictEqual(norm.dateJour, '2026-06-21');
  assert.strictEqual(norm.heureDebut, '20:00');
  assert.strictEqual(norm.heureFin, '22:00');
  assert.strictEqual(norm.horaires, '20:00 - 22:00');
  assert.strictEqual(norm.quotaRequis, 0, 'Ancien créneau sans neededCount doit être sans limite fixe (0)');
  assert.strictEqual(norm.inscrits.length, 3);
  assert.deepStrictEqual(norm.inscrits[0], { id: 'uid_claire', type: 'member', uid: 'uid_claire', prenom: 'Claire', nom: 'Dupont' });
  assert.strictEqual(norm.inscrits[1].type, 'member');
  assert.strictEqual(norm.inscrits[1].uid, 'uid_tiago');
  assert.strictEqual(norm.inscrits[2].type, 'guest');
  assert.strictEqual(norm.inscrits[2].parrainUid, 'uid_claire');
  assert.strictEqual(norm.inscrits[2].telephone, '0611223344');

  // Rétrocompatibilité format éditeur historique { label, neededCount, horaires }
  const legacyEditorShift = normalizeVolunteerShift({ label: 'Accueil billetterie', neededCount: 3, horaires: '18h30 - 20h00' }, { index: 2 });
  assert.strictEqual(legacyEditorShift.nomTache, 'Accueil billetterie');
  assert.strictEqual(legacyEditorShift.quotaRequis, 3);
  assert.strictEqual(legacyEditorShift.heureDebut, '18:30');
  assert.strictEqual(legacyEditorShift.heureFin, '20:00');
  console.log('✓ 1. Rétrocompatibilité des anciens volunteerShifts et normalisation member/guest validées');
}

// 2. Calcul de quota complet, consolidation chronologique et jauge X / Y
{
  const mockEvent = {
    id: 'evt_fest',
    date: '2026-06-21T20:00',
    volunteerShifts: [
      { id: 's_soir', nomTache: 'Rangement scène', dateJour: '2026-06-21', heureDebut: '23:00', heureFin: '23:59', quotaRequis: 2, inscrits: [] },
      { id: 's_veille', nomTache: 'Montage barnum', dateJour: '2026-06-20', heureDebut: '17:00', heureFin: '19:00', quotaRequis: 2, inscrits: ['u1'] },
      { id: 's_libre', nomTache: 'Brigade volante', quotaRequis: null, horaires: 'Toute la soirée', inscrits: ['u1', 'u2'] }
    ],
    covoiturage: {
      voitures: [],
      recherchePlace: [],
      benevolatInscrits: {
        s_soir: [
          { id: 'u1', type: 'member', uid: 'u1', prenom: 'Claire', nom: 'D.' },
          { id: 'g1', type: 'guest', prenom: 'Julien', nom: 'M.', telephone: '0600000000', parrainUid: 'u1', parrainNom: 'Claire' }
        ]
      }
    }
  };

  const mockCommissions = [
    {
      id: 'comm_bar',
      titre: 'Buvette',
      creneauxBenevoles: [
        { id: 'c_bar_1', role: 'Ouverture fûts', horaireDebut: '18:00', horaireFin: '20:00', nbPlaces: 2, inscrits: ['u2'] }
      ]
    }
  ];

  const consolidated = consolidateVolunteerShifts(mockEvent, mockCommissions);
  assert.strictEqual(consolidated.length, 4);
  assert.deepStrictEqual(
    consolidated.map((s) => s.id),
    ['s_veille', 'c_bar_1', 's_soir', 's_libre'],
    'Tri chronologique strict par dateJour puis heureDebut requis'
  );

  const soirShift = consolidated.find((s) => s.id === 's_soir');
  assert.strictEqual(isVolunteerShiftFull(soirShift), true, '2/2 inscrits via SSOT benevolatInscrits doit verrouiller le quota');
  assert.strictEqual(isVolunteerShiftFull(consolidated.find((s) => s.id === 's_veille')), false, '1/2 ne doit pas être complet');
  assert.strictEqual(isVolunteerShiftFull(consolidated.find((s) => s.id === 's_libre')), false, 'Quota null/0 ne doit jamais être complet');

  const cov = computeVolunteerCoverage(consolidated);
  assert.strictEqual(cov.totalRequired, 6, 'Somme des quotas fixes : 2 + 2 + 2 = 6');
  assert.strictEqual(cov.filledPosts, 4, 'Postes pourvus sur quotas : 1 + 1 + 2 = 4');
  assert.strictEqual(cov.isComplete, false);
  console.log('✓ 2. Verrouillage au quota, consolidation chronologique et jauge X / Y validés');
}

// 3. Détection pure de chevauchement horaire scène / balance
{
  const artisticEvent = {
    id: 'evt_concert',
    type: 'prestation',
    date: '2026-06-21T14:00',
    dateFin: '2026-06-21T23:59',
    horairesPassages: 'Balance 16h00 - 17h00 | Passage scène 20:30 - 22:00',
    inscriptions: [
      { userId: 'u_present', status: 'present' },
      { userId: 'u_absent', status: 'absent' }
    ]
  };

  assert.strictEqual(isMemberArtisticPresent(artisticEvent, 'u_present'), true);
  assert.strictEqual(isMemberArtisticPresent(artisticEvent, 'u_absent'), false);

  // Chevauche la balance (16:00 - 17:00)
  assert.strictEqual(detectStageScheduleConflict({ dateJour: '2026-06-21', heureDebut: '16:30', heureFin: '18:00' }, artisticEvent), true);
  // Créneau creux entre balance et jeu (18:00 - 20:30 : touche la borne 20:30 sans la chevaucher)
  assert.strictEqual(detectStageScheduleConflict({ dateJour: '2026-06-21', heureDebut: '18:00', heureFin: '20:30' }, artisticEvent), false);
  // Chevauche le jeu sur scène (20:30 - 22:00)
  assert.strictEqual(detectStageScheduleConflict({ dateJour: '2026-06-21', heureDebut: '21:00', heureFin: '23:00' }, artisticEvent), true);
  // Même horaire mais la veille (montage J-1) -> aucun conflit
  assert.strictEqual(detectStageScheduleConflict({ dateJour: '2026-06-20', heureDebut: '20:30', heureFin: '22:00' }, artisticEvent), false);

  // Repli sur [event.date, event.dateFin] quand horairesPassages est vide
  const simpleEvent = { type: 'prestation', date: '2026-06-21T20:00', dateFin: '2026-06-21T22:00' };
  assert.strictEqual(detectStageScheduleConflict({ heureDebut: '18:00', heureFin: '20:00' }, simpleEvent), false);
  assert.strictEqual(detectStageScheduleConflict({ heureDebut: '19:30', heureFin: '21:00' }, simpleEvent), true);
  console.log('✓ 3. Détection pure de conflit horaire scène / balance validée');
}

// 4. Garantie de compatibilité Firestore adhérent standard + Gouvernance < 140 L + Parité FR/PT
{
  const newFiles = [
    'src/utils/volunteerShiftUtils.js',
    'src/hooks/useVolunteerShifts.js',
    'src/components/agenda/VolunteerShiftFormCard.jsx',
    'src/components/event-details/volunteers/VolunteerGuestModal.jsx',
    'src/components/event-details/volunteers/VolunteerShiftCard.jsx'
  ];
  for (const rel of newFiles) {
    const lines = countRealLines(fs.readFileSync(path.join(rootDir, rel), 'utf8'));
    assert.ok(lines < 140, `Le nouveau fichier ${rel} doit faire < 140 lignes (${lines} L)`);
  }

  assert.deepStrictEqual(Object.keys(fr.agenda), Object.keys(pt.agenda), 'Parité stricte 1:1 requise entre fr.agenda et pt.agenda');

  const rulesPath = path.resolve(rootDir, '..', 'o-girador-orquestrador', 'firestore.rules');
  if (fs.existsSync(rulesPath)) {
    const rules = fs.readFileSync(rulesPath, 'utf8');
    assert.ok(rules.includes("'covoiturage'") && rules.includes('isActiveMember()'), 'La clé covoiturage doit être autorisée aux membres actifs dans firestore.rules');
  }
  console.log('✓ 4. Plafond < 140 L, parité 1:1 FR/PT et compatibilité Firestore membre validés');
}

console.log('🎉 MISSION 1 : TOUS LES TESTS UNITAIRES SONT PASSÉS AVEC SUCCÈS !');
