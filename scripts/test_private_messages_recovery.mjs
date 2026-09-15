import assert from 'node:assert';

console.log('🧪 Test: Récupération et fusion des messages privés historiques...');

// 1. Simulation des données
const currentUserId = 'user_julian';
const otherUserId = 'user_bob';

const legacyMessages = [
  {
    id: 'legacy_1',
    senderId: 'user_bob',
    recipientId: 'user_julian',
    content: 'Salut Julian ! Tu as le document ?',
    timestamp: '2026-09-01T10:00:00.000Z',
    read: true
  },
  {
    id: 'legacy_2',
    senderId: 'user_julian',
    recipientId: 'user_bob',
    content: 'Oui Bob, je te l envoie tout de suite.',
    timestamp: '2026-09-01T10:05:00.000Z',
    read: true
  }
];

const convMessages = [
  {
    id: 'modern_1',
    conversationId: 'conv_123',
    senderId: 'user_julian',
    content: 'Re-bonjour Bob, ceci est un nouveau message',
    timestamp: '2026-09-15T12:00:00.000Z'
  }
];

// 2. Logique de fusion unifiée (identique à PrivateChatView.jsx)
function mergeMessages(convMessages, legacyMessages, currentUserId) {
  const combined = [...convMessages];
  const modernLegacyIds = new Set(
    convMessages.map((m) => m.legacyMessageId || m.id).filter(Boolean)
  );
  const modernSignatures = new Set(
    convMessages.map((m) => `${m.senderId}_${m.timestamp}_${m.content}`)
  );

  legacyMessages.forEach((legacyMsg) => {
    const sig = `${legacyMsg.senderId}_${legacyMsg.timestamp}_${legacyMsg.content}`;
    if (!modernLegacyIds.has(legacyMsg.id) && !modernSignatures.has(sig)) {
      combined.push({
        ...legacyMsg,
        isLegacy: true
      });
    }
  });

  combined.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  return combined;
}

const merged = mergeMessages(convMessages, legacyMessages, currentUserId);

// Vérifications
assert.strictEqual(merged.length, 3, 'Les 3 messages (2 historiques + 1 nouveau) doivent être présents');
assert.strictEqual(merged[0].id, 'legacy_1', 'Le premier message doit être le plus ancien historique');
assert.strictEqual(merged[1].id, 'legacy_2', 'Le deuxième message doit être le deuxième historique');
assert.strictEqual(merged[2].id, 'modern_1', 'Le troisième message doit être le plus récent nouveau');

console.log('✅ Fusion et tri chronologique validés.');

// 3. Test de déduplication si un message legacy a déjà été importé
const convWithDuplicate = [
  ...convMessages,
  {
    id: 'modern_dup',
    legacyMessageId: 'legacy_1',
    senderId: 'user_bob',
    content: 'Salut Julian ! Tu as le document ?',
    timestamp: '2026-09-01T10:00:00.000Z'
  }
];

const dedupMerged = mergeMessages(convWithDuplicate, legacyMessages, currentUserId);
assert.strictEqual(dedupMerged.length, 3, 'Le message doublon ne doit pas être dupliqué');
console.log('✅ Déduplication validée.');

// 4. Test d enrichissement de la liste des conversations (identique à Forum.jsx)
const modernConversations = [
  {
    id: 'conv_123',
    type: 'direct',
    participantIds: ['user_julian', 'user_bob'],
    lastMessage: null,
    updatedAt: '2026-09-15T09:00:00.000Z',
    isUnread: false
  }
];

const privateMessagesForForum = [...legacyMessages];

function buildAllInboxConversations(modernConversations, privateMessages, currentUserId) {
  const legacyByPartner = {};
  privateMessages.forEach((msg) => {
    const otherId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
    if (!otherId) return;
    if (!legacyByPartner[otherId]) {
      legacyByPartner[otherId] = {
        latestMsg: null,
        hasUnread: false,
        messages: []
      };
    }
    legacyByPartner[otherId].messages.push(msg);
    if (
      !legacyByPartner[otherId].latestMsg ||
      new Date(msg.timestamp || 0) > new Date(legacyByPartner[otherId].latestMsg.timestamp || 0)
    ) {
      legacyByPartner[otherId].latestMsg = msg;
    }
    if (msg.recipientId === currentUserId && !msg.read) {
      legacyByPartner[otherId].hasUnread = true;
    }
  });

  const coveredPartnerIds = new Set();
  const enrichedModern = modernConversations.map((c) => {
    if (c.type === 'direct' && Array.isArray(c.participantIds)) {
      const otherId = c.participantIds.find((id) => id !== currentUserId);
      if (otherId) {
        coveredPartnerIds.add(otherId);
        const legacyInfo = legacyByPartner[otherId];
        if (legacyInfo && legacyInfo.latestMsg) {
          const hasModernLastMsg = Boolean(c.lastMessage?.content || c.lastMessage?.imageUrl);
          const modernTime = hasModernLastMsg ? new Date(c.lastMessage.timestamp || 0).getTime() : 0;
          const legacyTime = new Date(legacyInfo.latestMsg.timestamp || 0).getTime();

          const effectiveLastMessage =
            !hasModernLastMsg || legacyTime > modernTime
              ? {
                  content: legacyInfo.latestMsg.content,
                  senderId: legacyInfo.latestMsg.senderId,
                  timestamp: legacyInfo.latestMsg.timestamp
                }
              : c.lastMessage;

          const effectiveUpdatedAt =
            !c.updatedAt || legacyTime > new Date(c.updatedAt || 0).getTime()
              ? legacyInfo.latestMsg.timestamp || c.updatedAt
              : c.updatedAt;

          const effectiveIsUnread = c.isUnread || legacyInfo.hasUnread;

          return {
            ...c,
            lastMessage: effectiveLastMessage,
            updatedAt: effectiveUpdatedAt,
            isUnread: effectiveIsUnread
          };
        }
      }
    }
    return c;
  });

  return enrichedModern;
}

const enrichedConvs = buildAllInboxConversations(modernConversations, privateMessagesForForum, currentUserId);
assert.strictEqual(enrichedConvs[0].lastMessage.content, 'Oui Bob, je te l envoie tout de suite.');
console.log('✅ Enrichissement de la prévisualisation des conversations validé.');

console.log('🎉 Tous les tests unitaires de récupération des messages sont validés !');
