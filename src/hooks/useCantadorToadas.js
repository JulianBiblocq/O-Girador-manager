import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { buildGroupVariants } from '../utils/tenantUtils';

/**
 * Hook personnalisé réactif pour écouter le catalogue des packs de Toadas
 * publiés depuis Cantador (collection racine `toada_packs`), strictement isolé par `groupId`.
 *
 * @param {string|null} groupId - Identifiant de l'association active
 * @returns {{ toadaPacks: Array, loadingToadaPacks: boolean, errorToadaPacks: any }}
 */
export function useCantadorToadas(groupId = null) {
  const [toadaPacks, setToadaPacks] = useState([]);
  const [loadingToadaPacks, setLoadingToadaPacks] = useState(Boolean(groupId));
  const [errorToadaPacks, setErrorToadaPacks] = useState(null);

  useEffect(() => {
    const variants = buildGroupVariants(groupId).slice(0, 10);
    if (variants.length === 0) {
      setToadaPacks([]);
      setErrorToadaPacks(null);
      setLoadingToadaPacks(false);
      return;
    }

    setLoadingToadaPacks(true);
    setErrorToadaPacks(null);

    const collRef = collection(db, 'toada_packs');
    const byGroupMap = new Map();
    const byTenantMap = new Map();

    const normalizePack = (d) => {
      const data = d.data() || {};
      const title = data.title || data.metadata?.title || data.metadata?.toada || data.project?.title || d.id;
      const bpm = data.project?.bpm || data.metadata?.bpm || null;
      const timeSignature = data.project?.timeSignature || data.metadata?.timeSignature || null;
      const patternsCount = Array.isArray(data.patterns) ? data.patterns.length : 0;
      return { id: d.id, ...data, title, bpm, timeSignature, patternsCount };
    };

    const syncMergedPacks = () => {
      const merged = new Map([...byTenantMap, ...byGroupMap]);
      const packs = Array.from(merged.values());
      packs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setToadaPacks(packs);
      setLoadingToadaPacks(false);
    };

    const qGroup = query(collRef, where('groupId', 'in', variants));
    const unsubGroup = onSnapshot(
      qGroup,
      (snapshot) => {
        byGroupMap.clear();
        snapshot.forEach((d) => byGroupMap.set(d.id, normalizePack(d)));
        syncMergedPacks();
      },
      (err) => {
        console.warn('[useCantadorToadas] Écoute toada_packs différée (permissions ou hors ligne) :', err);
        setErrorToadaPacks(err);
        setLoadingToadaPacks(false);
      }
    );

    const qTenant = query(collRef, where('tenantId', 'in', variants));
    const unsubTenant = onSnapshot(
      qTenant,
      (snapshot) => {
        byTenantMap.clear();
        snapshot.forEach((d) => byTenantMap.set(d.id, normalizePack(d)));
        syncMergedPacks();
      },
      () => {}
    );

    return () => {
      unsubGroup();
      unsubTenant();
    };
  }, [groupId]);

  return {
    toadaPacks,
    loadingToadaPacks,
    errorToadaPacks,
  };
}
