/**
 * Test unitaire et fonctionnel de la mécanique des accusés de lecture dynamiques
 * pour Le Porte-Voix (Messages privés 1-à-1 et Groupes fermés).
 */

import assert from 'assert';
import {
  getTimestampMs,
  isMessageReadByAll,
  shouldMarkConversationAsRead,
  formatReadReceiptDate,
  getReadReceiptStats
} from '../src/utils/readReceiptUtils.js';

console.log('🧪 Démarrage des tests unitaires pour MessageReadReceipt & readReceiptUtils...\n');

// --- Test 1 : getTimestampMs ---
console.log('1️⃣ Test de getTimestampMs :');
const now = new Date();
const nowIso = now.toISOString();
const nowMs = now.getTime();

assert.strictEqual(getTimestampMs(nowIso), nowMs, 'ISO string doit être converti en ms');
assert.strictEqual(getTimestampMs(nowMs), nowMs, 'Nombre en ms doit rester intact');
assert.strictEqual(getTimestampMs(now), nowMs, 'Objet Date doit être converti en ms');
assert.strictEqual(getTimestampMs({ toMillis: () => 12345 }), 12345, 'Firestore Timestamp toMillis() supporté');
assert.strictEqual(getTimestampMs({ toDate: () => now }), nowMs, 'Firestore Timestamp toDate() supporté');
assert.strictEqual(getTimestampMs(null), 0, 'Null doit retourner 0');
assert.strictEqual(getTimestampMs(undefined), 0, 'Undefined doit retourner 0');
assert.strictEqual(getTimestampMs('invalid-date'), 0, 'Date invalide doit retourner 0');
console.log('   ✅ getTimestampMs validé.');

// --- Test 2 : isMessageReadByAll en 1-à-1 direct ---
console.log('\n2️⃣ Test de isMessageReadByAll en discussion privée 1-à-1 :');
const t0 = new Date('2026-10-02T10:00:00Z').toISOString();
const t1_before = new Date('2026-10-02T09:59:00Z').toISOString();
const t2_after = new Date('2026-10-02T10:01:00Z').toISOString();

const authorId = 'user_author_1';
const recipientId = 'user_dest_2';

const messageSent = {
  id: 'msg_1',
  senderId: authorId,
  timestamp: t0,
  content: 'Salut !'
};

// Destinataire n'a pas lu (timestamp antérieur)
const readStatusUnread = {
  [recipientId]: t1_before,
  [authorId]: t0
};
assert.strictEqual(
  isMessageReadByAll({
    message: messageSent,
    currentUserId: authorId,
    readStatus: readStatusUnread,
    participantIds: [authorId, recipientId],
    isGroup: false
  }),
  false,
  'Doit retourner false si le destinataire a un timestamp antérieur (simple coche)'
);

// Destinataire n'a jamais ouvert la conversation (pas de clé dans readStatus)
assert.strictEqual(
  isMessageReadByAll({
    message: messageSent,
    currentUserId: authorId,
    readStatus: { [authorId]: t0 },
    participantIds: [authorId, recipientId],
    isGroup: false
  }),
  false,
  'Doit retourner false si le destinataire n’a aucune entrée dans readStatus'
);

// Destinataire a lu (timestamp postérieur ou égal)
const readStatusRead = {
  [recipientId]: t2_after,
  [authorId]: t0
};
assert.strictEqual(
  isMessageReadByAll({
    message: messageSent,
    currentUserId: authorId,
    readStatus: readStatusRead,
    participantIds: [authorId, recipientId],
    isGroup: false
  }),
  true,
  'Doit retourner true si le destinataire a ouvert après le message (double coche illuminée)'
);

// Tolérance de décalage d’horloge (500 ms avant le message)
const t_skew = new Date(new Date(t0).getTime() - 500).toISOString();
assert.strictEqual(
  isMessageReadByAll({
    message: messageSent,
    currentUserId: authorId,
    readStatus: { [recipientId]: t_skew },
    participantIds: [authorId, recipientId],
    isGroup: false
  }),
  true,
  'Doit tolérer un léger skew réseau de 500 ms'
);
console.log('   ✅ Discussion 1-à-1 validée.');

// --- Test 3 : isMessageReadByAll en Groupe fermé multi-destinataires ---
console.log('\n3️⃣ Test de isMessageReadByAll en Groupe fermé :');
const memberA = 'user_author_1';
const memberB = 'user_b';
const memberC = 'user_c';
const memberD = 'user_d';
const groupParticipants = [memberA, memberB, memberC, memberD];

const groupMsg = {
  id: 'msg_group_1',
  senderId: memberA,
  timestamp: t0,
  content: 'Répétition ce soir !'
};

// Cas A : Seulement B et C ont lu, mais pas D
const partialGroupRead = {
  [memberA]: t0,
  [memberB]: t2_after,
  [memberC]: t2_after,
  [memberD]: t1_before
};
assert.strictEqual(
  isMessageReadByAll({
    message: groupMsg,
    currentUserId: memberA,
    readStatus: partialGroupRead,
    participantIds: groupParticipants,
    isGroup: true
  }),
  false,
  'Doit retourner false si 1 membre sur 3 n’a pas encore lu (simple coche)'
);

// Cas B : 100 % des destinataires (B, C et D) ont lu
const fullGroupRead = {
  [memberA]: t0,
  [memberB]: t2_after,
  [memberC]: t2_after,
  [memberD]: t2_after
};
assert.strictEqual(
  isMessageReadByAll({
    message: groupMsg,
    currentUserId: memberA,
    readStatus: fullGroupRead,
    participantIds: groupParticipants,
    isGroup: true
  }),
  true,
  'Doit retourner true si 100 % des destinataires ont lu (double coche illuminée)'
);

// Cas C : Messages legacy avec flag read: true
const legacyMsg = {
  id: 'msg_legacy',
  senderId: memberA,
  timestamp: t0,
  isLegacy: true,
  read: true
};
assert.strictEqual(
  isMessageReadByAll({
    message: legacyMsg,
    currentUserId: memberA,
    readStatus: {},
    participantIds: [memberA, memberB],
    isGroup: false
  }),
  true,
  'Doit honorer le flag read: true des messages historiques'
);
console.log('   ✅ Groupe fermé et legacy validés.');

// --- Test 4 : shouldMarkConversationAsRead (Garde-fou anti-boucle) ---
console.log('\n4️⃣ Test du garde-fou shouldMarkConversationAsRead :');

// Cas A : Conversation vide -> Pas d’écriture
assert.strictEqual(
  shouldMarkConversationAsRead({
    activeMessages: [],
    currentUserId: memberA,
    readStatus: {}
  }),
  false,
  'Conversation vide ne doit pas déclencher d’écriture'
);

// Cas B : Dernier message envoyé par soi-même -> Pas d’écriture
assert.strictEqual(
  shouldMarkConversationAsRead({
    activeMessages: [
      { senderId: memberB, timestamp: t1_before },
      { senderId: memberA, timestamp: t0 } // envoyé par soi
    ],
    currentUserId: memberA,
    readStatus: { [memberA]: t1_before }
  }),
  false,
  'Si le dernier message vient de soi, pas de déclenchement d’écriture'
);

// Cas C : Dernier message reçu plus récent que notre dernier readStatus -> DÉCLENCHEMENT
assert.strictEqual(
  shouldMarkConversationAsRead({
    activeMessages: [
      { senderId: memberB, timestamp: t2_after } // reçu après notre dernière lecture
    ],
    currentUserId: memberA,
    readStatus: { [memberA]: t0 } // lu à t0, message à t2_after
  }),
  true,
  'Doit déclencher l’écriture si un message reçu est plus récent que notre dernier acquittement'
);

// Cas D : Conversation déjà à jour -> PAS d’écriture superflue
assert.strictEqual(
  shouldMarkConversationAsRead({
    activeMessages: [
      { senderId: memberB, timestamp: t0 }
    ],
    currentUserId: memberA,
    readStatus: { [memberA]: t2_after } // déjà lu après
  }),
  false,
  'Ne doit PAS déclencher d’écriture si déjà acquitté'
);
console.log('   ✅ Garde-fou d’actualisation validé.');

// --- Test 5 : formatReadReceiptDate et getReadReceiptStats ---
console.log('\n5️⃣ Test de formatReadReceiptDate et getReadReceiptStats :');
assert.ok(formatReadReceiptDate(nowIso).startsWith('Lu le '), 'Doit formater avec le préfixe Lu le');

const stats = getReadReceiptStats(
  {
    user_b: { luLe: nowIso, nom: 'Bob' }
  },
  [
    { id: 'user_a', prenom: 'Alice' },
    { id: 'user_b', prenom: 'Bob' },
    { id: 'user_c', prenom: 'Charlie' }
  ],
  'user_a'
);
assert.strictEqual(stats.readCount, 1, '1 lecteur');
assert.strictEqual(stats.readers[0].userId, 'user_b');
assert.strictEqual(stats.unreadMembers.length, 1, '1 non-lecteur (Charlie)');
assert.strictEqual(stats.unreadMembers[0].userId, 'user_c');
console.log('   ✅ formatReadReceiptDate & getReadReceiptStats validés.');

console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
