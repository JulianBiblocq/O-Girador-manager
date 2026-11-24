import { isGeneralGroupConversation, resolveZapDisplayName } from './generalGroupChatUtils.js';
import { stripForbiddenMegaphones } from './sanitizeIcons.js';

/** Normalise une chaîne en minuscules sans accents (NFD) pour la recherche multi-langues. */
export function normalizeSearchText(value) {
  if (!value || typeof value !== 'string') return '';
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Nettoie les balises HTML enrichies (TipTap / citations) en texte brut lisible sans exécution DOM. */
export function stripRichHtml(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<(?:br|\/p|\/div|\/li|\/blockquote)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ').trim();
}

/** Résout le nom complet d'un auteur depuis `usersMap` ou les métadonnées embarquées. */
export function resolveSearchAuthorName(userId, fallbackName = '', usersMap = {}) {
  const u = userId ? usersMap?.[userId] : null;
  const fromMap = u ? `${u.prenom || ''} ${u.nom || ''}`.trim() || u.surnom || '' : '';
  return fromMap || String(fallbackName || '').trim() || '';
}

/** Découpe un extrait centré autour du 1er terme trouvé en 3 segments sûrs (`prefix`, `match`, `suffix`). */
export function buildSnippetParts(rawText, rawQuery, radius = 58) {
  const clean = String(rawText || '').trim();
  if (!clean) return { prefix: '', match: '', suffix: '' };
  const tokens = normalizeSearchText(rawQuery).split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return { prefix: clean.length > radius * 2 ? `${clean.slice(0, radius * 2)}…` : clean, match: '', suffix: '' };
  }
  const normChars = [], origIndices = [];
  for (let i = 0; i < clean.length; i++) {
    const base = clean[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let j = 0; j < base.length; j++) { normChars.push(base[j]); origIndices.push(i); }
  }
  const normFull = normChars.join('');
  const hitToken = tokens.find((tk) => normFull.includes(tk)) || '';
  const hitPos = hitToken ? normFull.indexOf(hitToken) : -1;
  if (hitPos === -1) {
    return { prefix: clean.length > radius * 2 ? `${clean.slice(0, radius * 2)}…` : clean, match: '', suffix: '' };
  }
  const startOrig = origIndices[hitPos];
  const endOrig = origIndices[Math.min(normChars.length - 1, hitPos + hitToken.length - 1)] + 1;
  const winStart = Math.max(0, startOrig - radius), winEnd = Math.min(clean.length, endOrig + radius);
  return {
    prefix: `${winStart > 0 ? '…' : ''}${clean.slice(winStart, startOrig)}`,
    match: clean.slice(startOrig, endOrig),
    suffix: `${clean.slice(endOrig, winEnd)}${winEnd < clean.length ? '…' : ''}`
  };
}

/** Indexe et filtre de façon étanche les 4 sources : Le Zap, Porte-Voix, Groupes et MP. */
export function buildUnifiedSearchResults({
  queryText = '', accessibleThreads = [], channels = [], allInboxConversations = [],
  cachedConvMessages = [], hasLoadedConvCache = false, privateMessages = [],
  usersMap = {}, currentUserId = '', groupId = '', generalConvId = '',
  zapLabel = '💬 Le Zap', groupLabel = 'Groupe', directLabel = 'MP'
}) {
  const emptyCounts = { all: 0, zap: 0, forum: 0, groups: 0, direct: 0 };
  const tokens = normalizeSearchText(queryText).split(' ').filter(Boolean);
  if (tokens.length === 0) return { all: [], counts: emptyCounts };

  const matchesAll = (haystack) => tokens.every((tk) => haystack.includes(tk));
  const chanMap = new Map((channels || []).map((c) => [c.id, stripForbiddenMegaphones(c.name || '').trim() || c.name]));
  const convMap = new Map((allInboxConversations || []).map((c) => [c.id, c]));
  const seenMsgKeys = new Set(), items = [];

  (accessibleThreads || []).forEach((th) => {
    const chanName = (th.channelId && chanMap.get(th.channelId)) || stripForbiddenMegaphones(th.categorie || 'Général');
    const cleanTitle = stripForbiddenMegaphones(th.titre || '').trim() || th.titre || '';
    const rootBody = stripRichHtml(th.contenu || th.message || '');
    const rootAuthor = resolveSearchAuthorName(th.auteurId, th.auteurNom, usersMap);
    if (matchesAll(normalizeSearchText(`${cleanTitle} ${rootBody} ${rootAuthor} ${chanName}`))) {
      items.push({ id: `forum_root_${th.id}`, category: 'forum', threadId: th.id, channelId: th.channelId || null, replyIndex: 'root', title: `${chanName} · ${cleanTitle}`, authorName: rootAuthor, timestamp: th.dateCreation || th.derniereModification || '', snippetParts: buildSnippetParts(rootBody || cleanTitle, queryText) });
    }
    (Array.isArray(th.reponses) ? th.reponses : []).forEach((rep, idx) => {
      const repText = stripRichHtml(rep?.message || rep?.question || '');
      const repAuthor = resolveSearchAuthorName(rep?.auteurId || rep?.authorId, rep?.auteurNom || rep?.authorName, usersMap);
      if (repText && matchesAll(normalizeSearchText(`${repText} ${repAuthor} ${cleanTitle}`))) {
        items.push({ id: `forum_rep_${th.id}_${idx}`, category: 'forum', threadId: th.id, channelId: th.channelId || null, replyIndex: idx, title: `${chanName} · ${cleanTitle}`, authorName: repAuthor, timestamp: rep.dateCreation || th.derniereModification || '', snippetParts: buildSnippetParts(repText, queryText) });
      }
    });
  });

  const resolveConvMeta = (conv, convId) => {
    if (isGeneralGroupConversation(conv || convId, groupId)) return { category: 'zap', title: resolveZapDisplayName(conv?.name, zapLabel), otherId: null };
    if (conv?.type === 'group') return { category: 'groups', title: conv.name || groupLabel, otherId: null };
    const otherId = (conv?.participantIds || []).find((id) => id !== currentUserId) || null;
    return { category: 'direct', title: resolveSearchAuthorName(otherId, '', usersMap) || directLabel, otherId };
  };

  (cachedConvMessages || []).forEach((m) => {
    const conv = convMap.get(m.conversationId);
    const isZap = isGeneralGroupConversation(conv || m.conversationId, groupId) || m.conversationId === generalConvId;
    if (!isZap && !conv && !(Array.isArray(m.participantIds) && m.participantIds.includes(currentUserId))) return;
    const { category, title, otherId } = resolveConvMeta(conv, m.conversationId);
    const body = String(m.content || m.fileName || '').trim();
    const author = resolveSearchAuthorName(m.senderId, m.senderName, usersMap);
    seenMsgKeys.add(`${m.conversationId}_${m.timestamp}_${body}`);
    if (m.legacyMessageId) seenMsgKeys.add(`legacy_${m.legacyMessageId}`);
    if (matchesAll(normalizeSearchText(`${body} ${author} ${title}`))) {
      items.push({ id: `cmsg_${m.id}`, category, conversationId: isZap ? (generalConvId || m.conversationId) : m.conversationId, recipientId: otherId, messageId: m.id, rawMessage: m, title, authorName: author, timestamp: m.timestamp || '', snippetParts: buildSnippetParts(body || title, queryText) });
    }
  });

  (allInboxConversations || []).forEach((conv) => {
    if (conv.isLegacy) return;
    const { category, title, otherId } = resolveConvMeta(conv, conv.id);
    const lastBody = String(conv.lastMessage?.content || '').trim();
    if (hasLoadedConvCache && lastBody && seenMsgKeys.has(`${conv.id}_${conv.lastMessage?.timestamp || ''}_${lastBody}`)) return;
    const author = resolveSearchAuthorName(conv.lastMessage?.senderId, conv.lastMessage?.senderName, usersMap);
    if (matchesAll(normalizeSearchText(`${lastBody} ${author} ${title}`))) {
      items.push({ id: `conv_${conv.id}`, category, conversationId: conv.id, recipientId: otherId, messageId: null, title, authorName: author, timestamp: conv.lastMessage?.timestamp || conv.updatedAt || '', snippetParts: buildSnippetParts(lastBody || title, queryText) });
    }
  });

  (privateMessages || []).forEach((pm) => {
    const body = String(pm.content || '').trim();
    if (seenMsgKeys.has(`legacy_${pm.id}`)) return;
    const otherId = pm.senderId === currentUserId ? pm.recipientId : pm.senderId;
    const partnerConv = allInboxConversations.find((c) => !c.isLegacy && c.type !== 'group' && c.participantIds?.includes(otherId));
    if (partnerConv && seenMsgKeys.has(`${partnerConv.id}_${pm.timestamp}_${body}`)) return;
    const partnerName = resolveSearchAuthorName(otherId, '', usersMap) || directLabel;
    const author = resolveSearchAuthorName(pm.senderId, pm.senderName, usersMap);
    if (matchesAll(normalizeSearchText(`${body} ${author} ${partnerName}`))) {
      items.push({ id: `pmsg_${pm.id}`, category: 'direct', conversationId: partnerConv?.id || null, recipientId: otherId, messageId: pm.id, rawMessage: pm, title: partnerName, authorName: author, timestamp: pm.timestamp || '', snippetParts: buildSnippetParts(body, queryText) });
    }
  });

  items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  const counts = { all: items.length, zap: 0, forum: 0, groups: 0, direct: 0 };
  items.forEach((it) => { if (counts[it.category] !== undefined) counts[it.category] += 1; });
  return { all: items, counts };
}
