import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getGeneralConversationId } from '../utils/generalGroupChatUtils';
import { buildUnifiedSearchResults } from '../utils/communicationSearchUtils';

/**
 * Hook de recherche hybride (Le Zap, Porte-Voix, Groupes & Messages Privés) (< 140 lignes).
 * Niveau 1 : RAM instantanée (0 lecture) | Niveau 2 (>= 2 car., debounce 300 ms) : getDocs borné en cache session.
 */
export function useCommunicationSearch({
  user, groupId, accessibleThreads = [], channels = [], allInboxConversations = [],
  privateMessages = [], usersMap = {}, zapLabel = '💬 Le Zap', groupLabel = 'Groupe', directLabel = 'MP'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cachedMessages, setCachedMessages] = useState([]);
  const [hasLoadedCache, setHasLoadedCache] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const userUid = user?.uid || '';
  const normalizedGroupId = String(groupId || '').trim().toLowerCase();
  const generalConvId = useMemo(() => getGeneralConversationId(normalizedGroupId), [normalizedGroupId]);
  const cacheKey = `${userUid}__${normalizedGroupId}`;
  const cacheRef = useRef({ key: '', loaded: false, inFlight: false, items: [] });

  useEffect(() => {
    if (cacheRef.current.key !== cacheKey) {
      cacheRef.current = { key: cacheKey, loaded: false, inFlight: false, items: [] };
      setCachedMessages([]);
      setHasLoadedCache(false);
      setLoadingMessages(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmed), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadConversationMessagesCache = useCallback(async (force = false) => {
    if (!userUid || !normalizedGroupId) return;
    if (!force && cacheRef.current.key === cacheKey && (cacheRef.current.loaded || cacheRef.current.inFlight)) return;

    cacheRef.current.key = cacheKey;
    cacheRef.current.inFlight = true;
    setLoadingMessages(true);
    try {
      const msgCol = collection(db, 'conversation_messages');
      const fetchZap = async () => {
        if (!generalConvId) return null;
        try {
          return await getDocs(query(msgCol, where('conversationId', '==', generalConvId), limit(250)));
        } catch {
          return await getDocs(query(msgCol, where('conversationId', '==', generalConvId), where('participantIds', 'array-contains', userUid), limit(250)));
        }
      };

      const [partRes, zapRes] = await Promise.allSettled([
        getDocs(query(msgCol, where('participantIds', 'array-contains', userUid), limit(400))),
        fetchZap()
      ]);

      const mergedMap = new Map();
      if (partRes.status === 'fulfilled' && partRes.value) {
        partRes.value.forEach((docSnap) => {
          const d = docSnap.data();
          const docGroup = String(d.groupId || '').trim().toLowerCase();
          if (docGroup === normalizedGroupId || String(d.conversationId || '').toLowerCase() === generalConvId) {
            mergedMap.set(docSnap.id, { id: docSnap.id, ...d });
          }
        });
      }
      if (zapRes.status === 'fulfilled' && zapRes.value) {
        zapRes.value.forEach((docSnap) => mergedMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
      }

      const sorted = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );
      cacheRef.current = { key: cacheKey, loaded: true, inFlight: false, items: sorted };
      setCachedMessages(sorted);
      setHasLoadedCache(true);
    } catch (err) {
      console.warn('useCommunicationSearch - Indexation messages restreinte :', err?.message || err);
      cacheRef.current.inFlight = false;
    } finally {
      setLoadingMessages(false);
    }
  }, [userUid, normalizedGroupId, generalConvId, cacheKey]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) loadConversationMessagesCache(false);
  }, [debouncedQuery, loadConversationMessagesCache]);

  const effectiveQuery = debouncedQuery || (searchQuery.trim().length === 1 ? searchQuery.trim() : '');
  const { all, counts } = useMemo(
    () => buildUnifiedSearchResults({
      queryText: effectiveQuery, accessibleThreads, channels, allInboxConversations,
      cachedConvMessages: cachedMessages, hasLoadedConvCache: hasLoadedCache, privateMessages,
      usersMap, currentUserId: userUid, groupId: normalizedGroupId, generalConvId, zapLabel, groupLabel, directLabel
    }),
    [effectiveQuery, accessibleThreads, channels, allInboxConversations, cachedMessages, hasLoadedCache, privateMessages, usersMap, userUid, normalizedGroupId, generalConvId, zapLabel, groupLabel, directLabel]
  );

  const filteredResults = useMemo(
    () => (categoryFilter === 'all' ? all : all.filter((it) => it.category === categoryFilter)),
    [all, categoryFilter]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCategoryFilter('all');
  }, []);

  return {
    searchQuery, setSearchQuery, categoryFilter, setCategoryFilter,
    isSearchActive: Boolean(searchQuery.trim()), filteredResults, counts,
    loadingMessages, hasLoadedCache, refreshCache: () => loadConversationMessagesCache(true), clearSearch
  };
}
