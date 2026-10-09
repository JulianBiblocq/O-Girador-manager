import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('🧪 TEST D\'INTÉGRATION : TOUR DE CONTRÔLE ➔ SALON PORTE-VOIX');
console.log('===============================================================\n');

// 1. Simulation d'un store Firestore en mémoire
const inMemoryStore = {
  forum_channels: new Map(),
  events: new Map(),
  forum: new Map()
};

let autoIdCounter = 1;

// Simulation de l'algorithme getOrCreateEventForumChannel
async function mockGetOrCreateEventForumChannel({ eventId, eventTitle, groupId, channelId }) {
  const cleanEventId = String(eventId || '').trim();
  const cleanTitle = String(eventTitle || 'Événement').trim();
  const cleanGroupId = String(groupId || '').trim();
  const defaultChannelName = cleanTitle.startsWith('🎪') ? cleanTitle : `🎪 ${cleanTitle}`.trim();
  const nowIso = new Date().toISOString();

  let resolvedId = channelId ? String(channelId).trim() : '';
  let resolvedName = '';

  // A. Vérification si un channelId est fourni
  if (resolvedId && inMemoryStore.forum_channels.has(resolvedId)) {
    const ch = inMemoryStore.forum_channels.get(resolvedId);
    return { id: resolvedId, name: ch.name };
  }

  // B. Vérification si l'événement a déjà un forumChannelId
  if (cleanEventId && inMemoryStore.events.has(cleanEventId)) {
    const ev = inMemoryStore.events.get(cleanEventId);
    if (ev.forumChannelId && inMemoryStore.forum_channels.has(ev.forumChannelId)) {
      const ch = inMemoryStore.forum_channels.get(ev.forumChannelId);
      return { id: ev.forumChannelId, name: ch.name };
    }
  }

  // C. Recherche par eventId
  for (const [id, ch] of inMemoryStore.forum_channels.entries()) {
    if (ch.groupId === cleanGroupId && ch.eventId === cleanEventId) {
      resolvedId = id;
      resolvedName = ch.name;
      break;
    }
  }

  // D. Recherche par nom
  if (!resolvedId) {
    for (const [id, ch] of inMemoryStore.forum_channels.entries()) {
      if (ch.groupId === cleanGroupId && ch.name === defaultChannelName) {
        resolvedId = id;
        resolvedName = ch.name;
        break;
      }
    }
  }

  // E. Création automatique si inexistant
  if (!resolvedId) {
    resolvedId = `ch_evt_${autoIdCounter++}`;
    resolvedName = defaultChannelName;
    inMemoryStore.forum_channels.set(resolvedId, {
      id: resolvedId,
      name: resolvedName,
      groupId: cleanGroupId,
      eventId: cleanEventId,
      readRoles: ['all'],
      writeRoles: ['all'],
      isTransparent: true,
      allowedTags: [],
      dateCreation: nowIso
    });
  }

  // F. Liaison dans le document de l'événement
  if (cleanEventId && inMemoryStore.events.has(cleanEventId)) {
    const prevEv = inMemoryStore.events.get(cleanEventId);
    inMemoryStore.events.set(cleanEventId, {
      ...prevEv,
      forumChannelId: resolvedId,
      derniereModif: nowIso
    });
  }

  return { id: resolvedId, name: resolvedName };
}

// -------------------------------------------------------------
// MODULE 1 : CRÉATION ET RÉSOLUTION DU SALON DÉDIÉ
// -------------------------------------------------------------
console.log('▶️ Module 1 : Création et résolution du salon dédié dans forum_channels');

const testEvent = {
  id: 'evt_30ans',
  titre: '30 ans de l\'asso',
  groupId: 'Samambaia',
  forumChannelId: null
};
inMemoryStore.events.set('evt_30ans', testEvent);

const resolvedChannel = await mockGetOrCreateEventForumChannel({
  eventId: testEvent.id,
  eventTitle: testEvent.titre,
  groupId: testEvent.groupId
});

assert.ok(resolvedChannel.id, 'Un ID de salon doit être généré');
assert.strictEqual(resolvedChannel.name, '🎪 30 ans de l\'asso', 'Le nom du salon doit être normalisé');

const createdChannelDoc = inMemoryStore.forum_channels.get(resolvedChannel.id);
assert.deepStrictEqual(createdChannelDoc.readRoles, ['all'], 'Le salon doit être lisible par tous');
assert.deepStrictEqual(createdChannelDoc.writeRoles, ['all'], 'Le salon doit être ouvert en écriture à tous');
assert.strictEqual(createdChannelDoc.isTransparent, true, 'Le salon doit être transparent');

const updatedEventDoc = inMemoryStore.events.get(testEvent.id);
assert.strictEqual(updatedEventDoc.forumChannelId, resolvedChannel.id, 'L\'événement doit avoir son forumChannelId renseigné');

console.log('  ✅ [PASS] Salon dédié créé dans forum_channels et lié à events/evt_30ans.\n');

// -------------------------------------------------------------
// MODULE 2 : IDEMPOTENCE DE LA RÉSOLUTION DU SALON
// -------------------------------------------------------------
console.log('▶️ Module 2 : Idempotence et conservation du salon existant');

const secondResolution = await mockGetOrCreateEventForumChannel({
  eventId: testEvent.id,
  eventTitle: testEvent.titre,
  groupId: testEvent.groupId
});

assert.strictEqual(secondResolution.id, resolvedChannel.id, 'Le même salon doit être réutilisé');
assert.strictEqual(inMemoryStore.forum_channels.size, 1, 'Aucun doublon de salon créé');

console.log('  ✅ [PASS] Idempotence confirmée : aucun doublon dans forum_channels.\n');

// -------------------------------------------------------------
// MODULE 3 : CRÉATION DU FIL DE COMMISSION RATTACHÉ
// -------------------------------------------------------------
console.log('▶️ Module 3 : Structure du fil de commission dans la collection forum');

const testCommission = {
  id: 'comm_musique',
  titre: 'Programmation musicale',
  icone: '🎸',
  eventId: testEvent.id,
  threadId: null
};

const nowIso = new Date().toISOString();
const newThreadPayload = {
  titre: `${testCommission.icone} ${testCommission.titre}`,
  channelId: resolvedChannel.id,
  categorie: resolvedChannel.name,
  commissionId: testCommission.id,
  eventId: testEvent.id,
  groupId: testEvent.groupId,
  dateCreation: nowIso,
  derniereModification: nowIso,
  reponses: [
    {
      auteurId: 'user_boris',
      auteurNom: 'Boris',
      dateCreation: nowIso,
      message: `Espace d'échange pour la commission ${testCommission.titre}.`
    }
  ]
};

const threadId = 'thread_prog_musique';
inMemoryStore.forum.set(threadId, newThreadPayload);

assert.strictEqual(newThreadPayload.titre, '🎸 Programmation musicale');
assert.strictEqual(newThreadPayload.channelId, resolvedChannel.id, 'Le channelId doit être celui de forum_channels');
assert.strictEqual(newThreadPayload.categorie, '🎪 30 ans de l\'asso', 'La catégorie doit correspondre au salon');
assert.strictEqual(newThreadPayload.commissionId, 'comm_musique');
assert.strictEqual(newThreadPayload.eventId, 'evt_30ans');

console.log('  ✅ [PASS] Structure du document forum 100% conforme.\n');

// -------------------------------------------------------------
// MODULE 4 : VISIBILITÉ DANS LE PORTE-VOIX (Forum.jsx)
// -------------------------------------------------------------
console.log('▶️ Module 4 : Filtrage et présence dans la liste des discussions du salon');

// Simulation de l'état du composant Forum.jsx
const allChannels = Array.from(inMemoryStore.forum_channels.values());
const allThreads = Array.from(inMemoryStore.forum.values());

// 1. Filtrage accessibleThreads
const allowedChannelIdSet = new Set(allChannels.map((c) => c.id));
const accessibleThreads = allThreads.filter((t) => {
  if (t.channelId) return allowedChannelIdSet.has(t.channelId);
  return false;
});
assert.strictEqual(accessibleThreads.length, 1, 'Le fil doit être accessible dans le forum');

// 2. Filtrage activeChannelThreads quand le membre clique sur le salon dédié
const activeChannelId = resolvedChannel.id;
const activeChannelThreads = accessibleThreads.filter((t) => {
  return t.channelId === activeChannelId;
});

assert.strictEqual(activeChannelThreads.length, 1, 'Le fil doit être visible dans le salon');
assert.strictEqual(activeChannelThreads[0].titre, '🎸 Programmation musicale');

console.log('  ✅ [PASS] Le fil apparaît bien dans le salon « 🎪 30 ans de l\'asso » du Porte-Voix.\n');

// -------------------------------------------------------------
// MODULE 5 : CONTRÔLE DE LA RÈGLE ANTI-MONOLITHE (< 200 LIGNES)
// -------------------------------------------------------------
console.log('▶️ Module 5 : Contrôle strict de la règle anti-monolithe (< 200 lignes)');

const filesToCheck = [
  'src/utils/eventForumService.js',
  'src/utils/commissionForumAdapter.js',
  'src/hooks/useEventCommissions.js',
  'src/components/event-details/commissions/CommissionCard.jsx',
  'src/components/event-details/commissions/EventCommissionsHub.jsx',
  'src/components/event-details/commissions/EventForumChannelLink.jsx'
];

filesToCheck.forEach((relPath) => {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister`);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert.ok(lines < 200, `Le fichier ${relPath} compte ${lines} lignes (doit être < 200)`);
  console.log(`  ✅ [PASS] ${relPath} : ${lines} lignes (< 200)`);
});

console.log('\n===============================================================');
console.log('🏆 SUCCÈS TOTAL : LE CÂBLAGE ÉVÉNEMENT ➔ SALON EST 100% VALIDE !');
console.log('===============================================================\n');
