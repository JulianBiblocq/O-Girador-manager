import assert from 'node:assert';
import { canPublishAnnonces } from '../src/utils/permissionUtils.js';

console.log('🧪 Démarrage du test unitaire : canPublishAnnonces...');

// 1. Rôles directeurs par défaut
const mestreUser = { role: 'mestre', tags: [] };
const adminUser = { role: 'admin', tags: [] };
const bureauUser = { role: 'bureau', tags: [] };
const standardUser = { role: 'membre', tags: [] };

assert.strictEqual(canPublishAnnonces(mestreUser), true, 'Mestre doit pouvoir publier');
assert.strictEqual(canPublishAnnonces(adminUser), true, 'Admin doit pouvoir publier');
assert.strictEqual(canPublishAnnonces(bureauUser), true, 'Bureau doit pouvoir publier');
assert.strictEqual(canPublishAnnonces(standardUser), false, 'Membre sans badge ne doit pas pouvoir publier');

// 2. Administrateur système technique
const sysAdmin = { role: 'membre', isSystemAdmin: true, tags: [] };
assert.strictEqual(canPublishAnnonces(sysAdmin), true, 'isSystemAdmin doit pouvoir publier');

// 3. Matrice de permissions avec badge CA
const matriceCA = {
  'annonces-publish': ['ca']
};

const caMember = { role: 'membre', tags: ['CA'] };
const dancerMember = { role: 'membre', tags: ['Danseurs'] };

assert.strictEqual(canPublishAnnonces(caMember, matriceCA), true, 'Membre avec badge CA doit pouvoir publier si configuré dans la matrice');
assert.strictEqual(canPublishAnnonces(dancerMember, matriceCA), false, 'Membre Danseurs ne doit pas pouvoir publier si seul CA est configuré');

// 4. Matrice avec badges multiples (Modérateur, Communication, CA)
const matriceMulti = {
  'annonces-publish': ['ca', 'modérateur', 'communication']
};

const modMember = { role: 'membre', tags: ['Modérateur'] };
const commMember = { role: 'membre', tags: ['Communication'] };

assert.strictEqual(canPublishAnnonces(modMember, matriceMulti), true, 'Membre Modérateur doit pouvoir publier');
assert.strictEqual(canPublishAnnonces(commMember, matriceMulti), true, 'Membre Communication doit pouvoir publier');

// 5. Prise en charge des objets badges / étiquettes
const modObjMember = { role: 'membre', tags: [{ id: 'moderateur', nomM: 'Modérateur' }] };
const matriceObj = { 'annonces-publish': ['moderateur'] };
assert.strictEqual(canPublishAnnonces(modObjMember, matriceObj), true, 'Prise en charge des badges sous forme d\'objets validée');

// 6. Mode d'urgence Break-Glass
const superAdminNoBreakGlass = { role: 'super-admin', tags: [] };
assert.strictEqual(canPublishAnnonces(superAdminNoBreakGlass, matriceCA, [], false), true, 'Super-admin sans break-glass passe car rôle directeur');
const breakGlassUser = { uid: 'iA0SweEHyOPzAPGIDVZdeKAV2mk1', role: 'membre', tags: [] };
assert.strictEqual(canPublishAnnonces(breakGlassUser, matriceCA, [], true), true, 'Super-admin avec break-glass actif passe d\'office');

console.log('✅ Tous les tests canPublishAnnonces ont réussi avec succès !');
