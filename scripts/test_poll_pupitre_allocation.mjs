import assert from 'node:assert/strict';
import {
  resolveMemberPollPupitres,
  buildPollPupitreMatrix,
  computeOptimalPupitreAllocation
} from '../src/utils/pollAllocationUtils.js';

const TARGET_PUPITRES = ['Alfaias', 'Caixas', 'Gonguê', 'Agbê'];

// Jeu d'utilisateurs (4 pupitres + 1 membre archivé qui doit être exclu)
const ALL_USERS = [
  // 4 joueurs d'Alfaia (dont 1 utilise la sous-voix Marcante et le singulier Alfaia)
  { id: 'a1', prenom: 'João', nom: 'Silva', instrumentPrincipal: 'Alfaia' },
  { id: 'a2', prenom: 'Maria', nom: 'Costa', instrumentPrincipal: 'Marcante' },
  { id: 'a3', prenom: 'Pedro', nom: 'Santos', instrument: 'Alfaias' },
  { id: 'a4', prenom: 'Ana', nom: 'Lima', instrumentsJoues: ['Repique', 'Agbê'] },
  // 3 joueurs de Caixa / Tarol
  { id: 'c1', prenom: 'Lucas', nom: 'Rocha', instrumentPrincipal: 'Caixa' },
  { id: 'c2', prenom: 'Clara', nom: 'Dias', instrumentPrincipal: 'Tarol' },
  { id: 'c3', prenom: 'Bruno', nom: 'Alves', instrumentPrincipal: 'Caixas' },
  // 2 joueurs de Gonguê
  { id: 'g1', prenom: 'Sofia', nom: 'Melo', instrumentPrincipal: 'Gonguê' },
  { id: 'g2', prenom: 'Tiago', nom: 'Nunes', instrumentPrincipal: 'Gonguê' },
  // 3 joueurs d'Agbê
  { id: 'x1', prenom: 'Camila', nom: 'Pinto', instrumentPrincipal: 'Agbê' },
  { id: 'x2', prenom: 'Rafael', nom: 'Gomes', instrumentPrincipal: 'Agbê' },
  { id: 'x3', prenom: 'Beatriz', nom: 'Vieira', instrumentPrincipal: 'Agbê' },
  // Membre archivé (ne doit pas être compté)
  { id: 'arch1', prenom: 'Fantôme', nom: 'Archivé', instrumentPrincipal: 'Alfaia', isArchived: true, archived: true }
];

// 4 créneaux de lundis proposés (4 dates x 4 pupitres)
const POLL_EVENTS = [
  {
    id: 'lundi_1',
    optionIndex: 1,
    date: '2026-11-09T19:30',
    votes: {
      // Lundi 1 : idéal pour Caixas (3/3 dispo), moyen pour Alfaias (2/4)
      a1: 'dispo', a2: 'dispo',
      c1: 'dispo', c2: 'dispo', c3: 'dispo',
      g1: 'indispo',
      x1: 'dispo'
    }
  },
  {
    id: 'lundi_2',
    optionIndex: 2,
    date: '2026-11-16T19:30',
    votes: {
      // Lundi 2 : idéal pour Alfaias (4/4 dispo)
      a1: 'dispo', a2: 'dispo', a3: 'dispo', a4: 'dispo',
      c1: 'dispo',
      g1: 'dispo',
      x1: 'indispo'
    }
  },
  {
    id: 'lundi_3',
    optionIndex: 3,
    date: '2026-11-23T19:30',
    votes: {
      // Lundi 3 : idéal pour Agbê (3/3 dispo)
      a1: 'indispo',
      c1: 'indispo',
      g1: 'dispo',
      x1: 'dispo', x2: 'dispo', x3: 'dispo'
    }
  },
  {
    id: 'lundi_4',
    optionIndex: 4,
    date: '2026-11-30T19:30',
    votes: {
      // Lundi 4 : idéal pour Gonguê (2/2 dispo)
      a1: 'dispo',
      c1: 'dispo',
      g1: 'dispo', g2: 'dispo',
      x1: 'dispo'
    }
  }
];

console.log('🧪 Test 1 : Résolution canonique des pupitres principaux et secondaires...');
const resolvedA4 = resolveMemberPollPupitres(ALL_USERS[3], TARGET_PUPITRES, []);
assert.equal(resolvedA4.primaryPupitre, 'Alfaias', 'Repique doit être rattaché à Alfaias');
assert.deepEqual(resolvedA4.secondaryPupitres, ['Agbê'], 'Agbê doit être détecté en pupitre secondaire');

console.log('🧪 Test 2 : Calcul matriciel 4 dates × 4 pupitres & exclusion des archivés...');
const matrix = buildPollPupitreMatrix({
  pollEvents: POLL_EVENTS,
  allUsers: ALL_USERS,
  targetPupitres: TARGET_PUPITRES,
  linkedInstruments: []
});

assert.equal(matrix.lundi_2.Alfaias.count, 4, '4 Alfaias dispo sur lundi_2');
assert.equal(matrix.lundi_2.Alfaias.totalPupitre, 4, '4 Alfaias actifs au total (archivé exclu)');
assert.equal(matrix.lundi_2.Alfaias.percentage, 100, '100% des Alfaias dispo sur lundi_2');
assert.equal(matrix.lundi_2.Agbê.secondaryAvailableMembers.length, 1, 'Ana (a4) détectée en renfort secondaire Agbê sur lundi_2');

console.log('🧪 Test 3 : Optimisation par backtracking exact sur 4 dates × 4 pupitres...');
const result = computeOptimalPupitreAllocation(matrix, POLL_EVENTS, TARGET_PUPITRES);

assert.equal(result.allocation.Caixas, 'lundi_1', 'Caixas doit recevoir lundi_1 (3/3)');
assert.equal(result.allocation.Alfaias, 'lundi_2', 'Alfaias doit recevoir lundi_2 (4/4)');
assert.equal(result.allocation.Agbê, 'lundi_3', 'Agbê doit recevoir lundi_3 (3/3)');
assert.equal(result.allocation.Gonguê, 'lundi_4', 'Gonguê doit recevoir lundi_4 (2/2)');
assert.equal(result.totalPresents, 12, 'Le total optimal des présents doit être 4 + 3 + 2 + 3 = 12');

console.log('✅ Tous les tests unitaires de répartition par pupitre (4 dates × 4 pupitres) ont réussi !');
