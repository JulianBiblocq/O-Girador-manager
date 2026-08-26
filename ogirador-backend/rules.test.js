const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const fs = require('fs');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-ogirador',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Règles de Sécurité Firestore', () => {

  describe('Accès non authentifié (Visiteurs)', () => {
    it('doit interdire la lecture des profils utilisateurs', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('users').doc('some_uid').get());
    });

    it('doit autoriser la lecture des associations (vitrine publique)', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(db.collection('associations').doc('ogirador').get());
    });

    it('doit interdire l\'écriture dans les événements', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('events').doc('event1').set({ nom: 'Concert' }));
    });
  });

  describe('Accès Membre (Authentifié sans droits spéciaux)', () => {
    const memberUid = 'membre123';
    
    async function setupMember(uid) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc(uid).set({
          role: 'membre',
          groupId: 'asso1',
          isSystemAdmin: false,
          hasAccessLogistique: false,
          statutActuel: 'active',
          tags: []
        });
      });
      return testEnv.authenticatedContext(uid).firestore();
    }

    it('doit autoriser la lecture des profils utilisateurs', async () => {
      const db = await setupMember(memberUid);
      await assertSucceeds(db.collection('users').doc('other_uid').get());
    });

    it('doit autoriser un membre à modifier son propre profil (champs permis)', async () => {
      const db = await setupMember(memberUid);
      await assertSucceeds(db.collection('users').doc(memberUid).update({
        nom: 'Nouveau Nom'
      }));
    });

    it('doit interdire à un membre de modifier son propre rôle', async () => {
      const db = await setupMember(memberUid);
      await assertFails(db.collection('users').doc(memberUid).update({
        role: 'admin'
      }));
    });

    it('doit autoriser la lecture de l\'inventaire', async () => {
      const db = await setupMember(memberUid);
      await assertSucceeds(db.collection('inventory').doc('item1').get());
    });

    it('doit interdire la création d\'un objet dans l\'inventaire', async () => {
      const db = await setupMember(memberUid);
      await assertFails(db.collection('inventory').doc('item1').set({ nom: 'Tambour' }));
    });

    it('doit autoriser un membre à modifier uniquement l\'état d\'un objet (ex: signaler casse)', async () => {
      const db = await setupMember(memberUid);
      await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
        await adminCtx.firestore().collection('inventory').doc('item1').set({ nom: 'Tambour', etat: 'bon' });
      });
      await assertSucceeds(db.collection('inventory').doc('item1').update({ etat: 'cassé' }));
      await assertFails(db.collection('inventory').doc('item1').update({ nom: 'Gros Tambour' }));
    });

    it('doit autoriser un membre à s\'inscrire à un événement (mise à jour du tableau inscriptions)', async () => {
      const db = await setupMember(memberUid);
      await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
        await adminCtx.firestore().collection('events').doc('event1').set({ nom: 'Répétition', inscriptions: [] });
      });
      await assertSucceeds(db.collection('events').doc('event1').update({
        inscriptions: [memberUid]
      }));
    });

    it('doit autoriser un membre à écrire dans le forum (si le channel le permet)', async () => {
      const db = await setupMember(memberUid);
      await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
        await adminCtx.firestore().collection('forum_channels').doc('chan1').set({
          groupId: 'asso1',
          writeRoles: ['all']
        });
      });
      await assertSucceeds(db.collection('forum_threads').doc('post1').set({
        channelId: 'chan1',
        authorId: memberUid,
        content: 'Hello !'
      }));
    });

    it('doit autoriser un membre à envoyer/créer une notification (notifications_queue)', async () => {
      const db = await setupMember(memberUid);
      await assertSucceeds(db.collection('notifications_queue').doc('notif1').set({
        message: 'Nouvelle notification'
      }));
    });

    it('doit autoriser un membre à envoyer un message privé', async () => {
      const db = await setupMember(memberUid);
      await assertSucceeds(db.collection('private_messages').doc('msg1').set({
        senderId: memberUid,
        recipientId: 'other_uid',
        content: 'Coucou'
      }));
    });
  });

  describe('Accès Admin / Bureau', () => {
    const adminUid = 'admin123';

    async function setupAdmin(uid) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc(uid).set({
          role: 'admin',
          tags: ['Bureau']
        });
      });
      return testEnv.authenticatedContext(uid).firestore();
    }

    it('doit autoriser un admin à modifier le rôle d\'un membre', async () => {
      const db = await setupAdmin(adminUid);
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('users').doc('membreCible').set({ role: 'membre' });
      });
      await assertSucceeds(db.collection('users').doc('membreCible').update({
        role: 'ca'
      }));
    });

    it('doit autoriser un admin à créer des événements', async () => {
      const db = await setupAdmin(adminUid);
      await assertSucceeds(db.collection('events').doc('event1').set({ nom: 'Répétition' }));
    });

    it('doit autoriser un admin à modifier l\'inventaire complet', async () => {
      const db = await setupAdmin(adminUid);
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('inventory').doc('item1').set({ nom: 'Ganza', etat: 'bon' });
      });
      await assertSucceeds(db.collection('inventory').doc('item1').update({ nom: 'Nouveau Ganza' }));
    });
  });

  describe('Accès avec Badges Spécifiques (Logistique, Modérateur)', () => {
    const logistiqueUid = 'logistique123';
    const modUid = 'mod123';

    async function setupLogistique(uid) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc(uid).set({
          role: 'membre',
          hasAccessLogistique: true
        });
      });
      return testEnv.authenticatedContext(uid).firestore();
    }

    async function setupModerateur(uid) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc(uid).set({
          role: 'membre',
          tags: ['Modérateur']
        });
      });
      return testEnv.authenticatedContext(uid).firestore();
    }

    it('doit interdire à un responsable Logistique de modifier le rôle d\'un autre membre', async () => {
      const db = await setupLogistique(logistiqueUid);
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('users').doc('membreCible').set({ role: 'membre' });
      });
      await assertFails(db.collection('users').doc('membreCible').update({
        role: 'ca'
      }));
    });

    it('doit interdire à un Modérateur de supprimer un événement', async () => {
      const db = await setupModerateur(modUid);
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('events').doc('event1').set({ nom: 'Concert' });
      });
      await assertFails(db.collection('events').doc('event1').delete());
    });
  });

  describe('Création de profil', () => {
    it('doit autoriser un membre à créer son profil avec adhesionBase: false', async () => {
      const db = testEnv.authenticatedContext('nouvelUid').firestore();
      await assertSucceeds(db.collection('users').doc('nouvelUid').set({
        role: 'membre',
        isSystemAdmin: false,
        hasAccessLogistique: false,
        paymentStatus: 'unpaid',
        statutActuel: 'active',
        adhesionBase: false,
        selectedOptions: [],
        tags: []
      }));
    });

    it('doit interdire à un membre de s\'octroyer adhesionBase: true à la création', async () => {
      const db = testEnv.authenticatedContext('nouvelUid2').firestore();
      await assertFails(db.collection('users').doc('nouvelUid2').set({
        role: 'membre',
        isSystemAdmin: false,
        hasAccessLogistique: false,
        paymentStatus: 'unpaid',
        statutActuel: 'active',
        adhesionBase: true,
        selectedOptions: [],
        tags: []
      }));
    });
  });

  describe('HelloAsso / Système (Sécurité Cloud Functions)', () => {
    it('doit interdire l\'écriture dans helloasso_logs (réservé aux Cloud Functions)', async () => {
      const memberCtx = testEnv.authenticatedContext('membre123');
      const adminCtx = testEnv.authenticatedContext('admin123');
      
      await assertFails(memberCtx.firestore().collection('associations').doc('asso1').collection('helloasso_logs').doc('log1').set({ data: 'test' }));
      await assertFails(adminCtx.firestore().collection('associations').doc('asso1').collection('helloasso_logs').doc('log1').set({ data: 'test' }));
    });
  });

  describe('Collections Mestre', () => {
    it('doit autoriser la création publique de prospects', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(unauthDb.collection('prospects').doc('newProspect').set({ email: 'test@test.com' }));
    });

    it('doit interdire la modification de prospects par le public', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('prospects').doc('newProspect').update({ email: 'test2@test.com' }));
    });

    it('doit interdire l\'écriture dans subscriptions mais autoriser la lecture par admin', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('users').doc('admin123').set({
          role: 'admin',
          isSystemAdmin: true,
          statutActuel: 'active'
        });
      });
      const adminDb = testEnv.authenticatedContext('admin123', { role: 'admin' }).firestore();
      await assertFails(adminDb.collection('subscriptions').doc('sub1').set({ active: true }));
      await assertSucceeds(adminDb.collection('subscriptions').doc('sub1').get());
    });
  });
});
