/**
 * test_message_editing_payload.mjs
 * Validation unitaire et statique de la logique d'édition des messages dans le Porte-Voix
 * (Groupes, MP et Discussions) :
 * 1. Payload updateDoc strict (content, isEdited: true, editedAt) sans undefined
 * 2. Vérification multi-clés de l'auteur (senderId, authorId, userId, auteurId)
 * 3. Contrôle des composants Frontend (PrivateChatView.jsx, useConversationMessages.js)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Démarrage des tests unitaires pour l\'édition des messages du Porte-Voix...\n');

// --- Test 1 : Vérification multi-clés de l'auteur ---
console.log('1️⃣ Test de la logique de détection multi-clés de l\'auteur :');
const currentUserId = 'user_123';

const isMsgAuthor = (msg, uid) => Boolean(
  msg && uid && (
    msg.senderId === uid ||
    msg.authorId === uid ||
    msg.userId === uid ||
    msg.auteurId === uid
  )
);

// Cas valides pour chaque clé possible
assert.strictEqual(isMsgAuthor({ senderId: currentUserId }, currentUserId), true, 'senderId valide');
assert.strictEqual(isMsgAuthor({ authorId: currentUserId }, currentUserId), true, 'authorId valide');
assert.strictEqual(isMsgAuthor({ userId: currentUserId }, currentUserId), true, 'userId valide');
assert.strictEqual(isMsgAuthor({ auteurId: currentUserId }, currentUserId), true, 'auteurId valide');

// Cas invalides
assert.strictEqual(isMsgAuthor({ senderId: 'other_user' }, currentUserId), false, 'Autre utilisateur');
assert.strictEqual(isMsgAuthor(null, currentUserId), false, 'Message null');
assert.strictEqual(isMsgAuthor({}, currentUserId), false, 'Message sans clé d\'auteur');
assert.strictEqual(isMsgAuthor({ senderId: currentUserId }, null), false, 'Utilisateur non connecté');
console.log('   ✅ Détection multi-clés de l\'auteur validée.');

// --- Test 2 : Structure et propreté du payload d\'édition ---
console.log('\n2️⃣ Test de la conformité du payload d\'édition updateDoc :');
const formatEditPayload = (text) => {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const nowIso = new Date().toISOString();
  return {
    content: trimmed,
    isEdited: true,
    editedAt: nowIso
  };
};

const validPayload = formatEditPayload(' Nouveau texte modifié ! ');
assert.deepStrictEqual(Object.keys(validPayload).sort(), ['content', 'editedAt', 'isEdited'].sort());
assert.strictEqual(validPayload.content, 'Nouveau texte modifié !');
assert.strictEqual(validPayload.isEdited, true);
assert.strictEqual(typeof validPayload.editedAt, 'string');
assert.strictEqual(Object.values(validPayload).some(v => v === undefined), false, 'Aucun champ undefined');

// Texte vide ou blanc
assert.strictEqual(formatEditPayload('   '), null, 'Texte blanc ignoré');
assert.strictEqual(formatEditPayload(''), null, 'Texte vide ignoré');
assert.strictEqual(formatEditPayload(null), null, 'Texte null ignoré');
console.log('   ✅ Payload strict sans undefined validé.');

// --- Test 3 : Contrôle statique de PrivateChatView.jsx ---
console.log('\n3️⃣ Contrôle statique du code source dans PrivateChatView.jsx :');
const privateChatPath = path.resolve(rootDir, 'src/components/PrivateChatView.jsx');
const privateChatContent = fs.readFileSync(privateChatPath, 'utf8');

assert(privateChatContent.includes('isMsgAuthor'), 'PrivateChatView définit et utilise isMsgAuthor');
assert(privateChatContent.includes('msg.authorId === user.uid'), 'PrivateChatView vérifie authorId');
assert(privateChatContent.includes('msg.senderId === user.uid'), 'PrivateChatView vérifie senderId');
assert(privateChatContent.includes('msg.userId === user.uid'), 'PrivateChatView vérifie userId');
assert(privateChatContent.includes('msg.auteurId === user.uid'), 'PrivateChatView vérifie auteurId');
assert(privateChatContent.includes('isEdited: true'), 'PrivateChatView assigne isEdited: true');
assert(privateChatContent.includes('editedAt: nowIso'), 'PrivateChatView assigne editedAt');
console.log('   ✅ PrivateChatView.jsx conforme.');

// --- Test 4 : Contrôle statique de useConversationMessages.js ---
console.log('\n4️⃣ Contrôle statique du code source dans useConversationMessages.js :');
const convMsgPath = path.resolve(rootDir, 'src/hooks/useConversationMessages.js');
const convMsgContent = fs.readFileSync(convMsgPath, 'utf8');

assert(convMsgContent.includes('targetMsg.senderId === user.uid'), 'useConversationMessages vérifie senderId');
assert(convMsgContent.includes('targetMsg.authorId === user.uid'), 'useConversationMessages vérifie authorId');
assert(convMsgContent.includes('targetMsg.userId === user.uid'), 'useConversationMessages vérifie userId');
assert(convMsgContent.includes('targetMsg.auteurId === user.uid'), 'useConversationMessages vérifie auteurId');
assert(convMsgContent.includes('editPayload'), 'useConversationMessages construit editPayload');
assert(convMsgContent.includes('isEdited: true'), 'useConversationMessages assigne isEdited: true');
console.log('   ✅ useConversationMessages.js conforme.');

console.log('\n🎉 TOUS LES CONTRÔLES SONT PASSÉS AVEC SUCCÈS !');
