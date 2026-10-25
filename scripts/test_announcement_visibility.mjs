import assert from 'node:assert';
import {
  isAnnouncementVisibleForUser,
  resolveTargetRecipientIds,
  resolveTargetUserDisplayNames
} from '../src/utils/announcementUtils.js';

console.log('🧪 Test unitaire : announcementUtils.js...');

// 1. Visibilité avec targetUserIds uniquement (aucun tag coché)
const annNominativeOnly = {
  id: 'ann-1',
  publishOnApp: true,
  cibles: [],
  targetUserIds: ['user-1', 'user-2']
};

assert.strictEqual(
  isAnnouncementVisibleForUser({ announcement: annNominativeOnly, userId: 'user-1' }),
  true,
  'Membre ciblé doit voir la pancarte'
);
assert.strictEqual(
  isAnnouncementVisibleForUser({ announcement: annNominativeOnly, userId: 'user-3' }),
  false,
  'Membre non ciblé ne doit pas voir la pancarte nominative'
);

// 2. Exception Admin / Auteur
assert.strictEqual(
  isAnnouncementVisibleForUser({
    announcement: { ...annNominativeOnly, auteurId: 'author-user' },
    userId: 'author-user'
  }),
  true,
  'Auteur doit toujours voir sa pancarte même s\'il n\'est pas dans targetUserIds'
);
assert.strictEqual(
  isAnnouncementVisibleForUser({
    announcement: annNominativeOnly,
    userId: 'admin-user',
    userRole: 'admin',
    canPublish: true
  }),
  true,
  'Admin/Modérateur doit toujours voir la pancarte pour gestion'
);

// 3. Combinaison étiquette / pupitre ET membres nominatifs
const annCombined = {
  id: 'ann-2',
  publishOnApp: true,
  cibles: ['Percussions'],
  targetUserIds: ['user-flute']
};

assert.strictEqual(
  isAnnouncementVisibleForUser({
    announcement: annCombined,
    userId: 'user-flute',
    userTags: ['Flûte']
  }),
  true,
  'Membre ciblé nominativement voit la pancarte combinée'
);
assert.strictEqual(
  isAnnouncementVisibleForUser({
    announcement: annCombined,
    userId: 'user-perc',
    userTags: ['Percussions']
  }),
  true,
  'Membre du pupitre ciblé voit la pancarte combinée'
);
assert.strictEqual(
  isAnnouncementVisibleForUser({
    announcement: annCombined,
    userId: 'user-autre',
    userTags: ['Danse']
  }),
  false,
  'Membre hors pupitre et hors liste nominative ne la voit pas'
);

// 4. Ciblage global 'Tous'
const annTous = {
  id: 'ann-3',
  publishOnApp: true,
  cibles: ['Tous'],
  targetUserIds: []
};
assert.strictEqual(
  isAnnouncementVisibleForUser({ announcement: annTous, userId: 'any-user' }),
  true,
  'Tout le monde voit une pancarte ciblée pour Tous'
);

// 5. Test de résolution dédoublonnée des destinataires (Set)
const sampleMembers = [
  { id: 'u1', prenom: 'Alice', nom: 'Dubois', tags: ['Percussions'], statutActuel: 'active' },
  { id: 'u2', prenom: 'Bob', nom: 'Martin', tags: ['Percussions'], statutActuel: 'active' },
  { id: 'u3', prenom: 'Charlie', nom: 'Durand', tags: ['Danse'], statutActuel: 'active' },
  { id: 'u4', prenom: 'David', nom: 'Inactif', tags: ['Percussions'], statutActuel: 'inactive' }
];

const recipients = resolveTargetRecipientIds({
  announcement: {
    cibles: ['Percussions'],
    targetUserIds: ['u1', 'u3'] // u1 est à la fois dans le pupitre et dans targetUserIds
  },
  allMembers: sampleMembers,
  authorId: 'u1'
});

// u1 est exclu car auteurId, u2 est inclus car Percussions, u3 est inclus car nominatif, u4 est exclu car inactif
assert.deepStrictEqual(recipients.sort(), ['u2', 'u3'].sort());

// 6. Test d'affichage des noms
const names = resolveTargetUserDisplayNames(['u1', 'u3'], sampleMembers);
assert.deepStrictEqual(names, ['Alice Dubois', 'Charlie Durand']);

console.log('✅ Tous les tests announcementUtils ont réussi avec succès !');
