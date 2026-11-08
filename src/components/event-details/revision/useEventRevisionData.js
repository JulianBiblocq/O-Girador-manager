import { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useDancadorChoreographies, useDancadorSteps } from '../../../hooks/useDancadorData';
import { useSequencerFirestoreData } from '../../../hooks/useSequencerFirestoreData';
import { useRepertoireVaralDocs } from '../../../hooks/useRepertoireVaralDocs';
import useMestreSignals from '../../../hooks/useMestreSignals';
import { useCantadorToadas } from '../../../hooks/useCantadorToadas';
import { subscribeGroupTrainings } from '../../../services/aisanceService';
import { buildResolutionDictionaries } from '../../../utils/repertoireMatcher';
import { canonicalizeGroupId } from '../../../utils/tenantUtils';

/**
 * Détermine les badges de disciplines d'un morceau du fil conducteur.
 */
export function getDisciplineBadges(morceau, resolved) {
  const badges = [];
  const hasDanse = Boolean(morceau.dancadorChoreoId || resolved?.hasChoreography || morceau.type === 'danse');
  const hasChant = Boolean(morceau.toadaDocId || morceau.cantadorToadaId || resolved?.hasToada || resolved?.hasCantador || morceau.type === 'song');
  const hasCulture = Boolean(morceau.cultureDocId || (Array.isArray(morceau.cultureDocIds) && morceau.cultureDocIds.length > 0) || resolved?.hasCulture);
  const hasPercu = Boolean(morceau.sequenceurId || morceau.sequenceurType || morceau.jsonUrl || morceau.sequenceurUrl || resolved?.hasSequencer || (!hasDanse && !hasChant && !hasCulture));

  if (hasPercu) badges.push({ key: 'percu', label: 'Percussion', emoji: '🥁', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' });
  if (hasChant) badges.push({ key: 'chant', label: 'Chant', emoji: '🗣️', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' });
  if (hasDanse) badges.push({ key: 'danse', label: 'Danse', emoji: '💃', badgeClass: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300' });
  if (hasCulture) badges.push({ key: 'culture', label: 'Culture', emoji: '📖', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300' });
  return badges;
}

/**
 * Hook de chargement et de résolution des données transversales pour EventRevisionProgram (< 130 lignes).
 */
export function useEventRevisionData({ event, groupId, externalTrainingsList }) {
  const isEventDanse = useMemo(() => {
    if (!event) return false;
    if (event.isDanceOnly) return true;
    if (event.includesDance && event.includesPercussion === false) return true;
    const typeStr = String(event.type || '').toLowerCase();
    const specStr = String(event.specialiteAtelier || event.specialite || '').toLowerCase();
    const titleStr = String(event.titre || event.title || '').toLowerCase();
    if (['danse', 'cours_danse', 'stage_danse'].includes(typeStr)) return true;
    if (specStr.includes('danse') || specStr.includes('dance')) return true;
    if ((titleStr.includes('cours de danse') || titleStr.includes('atelier danse') || titleStr.includes('stage danse')) && !titleStr.includes('percu')) return true;
    return false;
  }, [event]);

  const { toadasList, toadasMap, cultureDocsList, cultureMap } = useRepertoireVaralDocs(groupId);
  const [repertoirePieces, setRepertoirePieces] = useState([]);
  const [loadingRepertoire, setLoadingRepertoire] = useState(true);

  useEffect(() => {
    const rawGroup = groupId || 'Samambaia';
    const targetGroupId = canonicalizeGroupId(rawGroup) || rawGroup;
    if (!targetGroupId) return;

    let unsubFallback = null;
    const colRef = collection(db, 'associations', targetGroupId, 'repertoire');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      if (list.length === 0 && targetGroupId !== targetGroupId.toLowerCase()) {
        if (unsubFallback) unsubFallback();
        const fallbackRef = collection(db, 'associations', targetGroupId.toLowerCase(), 'repertoire');
        unsubFallback = onSnapshot(fallbackRef, (fallbackSnap) => {
          const fallbackList = [];
          fallbackSnap.forEach((d) => fallbackList.push({ id: d.id, ...d.data() }));
          fallbackList.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
          setRepertoirePieces(fallbackList);
          setLoadingRepertoire(false);
        }, () => {
          setRepertoirePieces([]);
          setLoadingRepertoire(false);
        });
        return;
      }

      list.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
      setRepertoirePieces(list);
      setLoadingRepertoire(false);
    }, () => setLoadingRepertoire(false));

    return () => {
      unsub();
      if (unsubFallback) unsubFallback();
    };
  }, [groupId]);

  const activeRepertoirePieces = useMemo(
    () => repertoirePieces.filter((p) => p && !p.isArchived && !p.archived && p.statutSaison !== 'archive'),
    [repertoirePieces]
  );

  const [internalTrainingsList, setInternalTrainingsList] = useState([]);
  useEffect(() => {
    if (externalTrainingsList || !groupId) return;
    return subscribeGroupTrainings(groupId, setInternalTrainingsList);
  }, [groupId, externalTrainingsList]);

  const effectiveTrainingsList = externalTrainingsList || internalTrainingsList;
  const { signals } = useMestreSignals(groupId);
  const signalsMap = useMemo(() => new Map((signals || []).map((s) => [s.id, s])), [signals]);
  const { rhythms: allSequencerRhythms } = useSequencerFirestoreData(groupId);
  const { choreographies: allChoreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);
  const { steps: allSteps, loading: loadingSteps } = useDancadorSteps(groupId);
  const { toadaPacks } = useCantadorToadas();

  const resolutionDicts = useMemo(() => buildResolutionDictionaries({
    catalogRhythms: allSequencerRhythms || [],
    toadasList: toadasList || [],
    cultureDocsList: cultureDocsList || [],
    choreographies: allChoreographies || [],
    toadaPacks: toadaPacks || []
  }), [allSequencerRhythms, toadasList, cultureDocsList, allChoreographies, toadaPacks]);

  return {
    isEventDanse, toadasMap, cultureMap, repertoirePieces, activeRepertoirePieces,
    loadingRepertoire, effectiveTrainingsList, signalsMap, allSequencerRhythms,
    allChoreographies, loadingChoreos, allSteps, loadingSteps, resolutionDicts
  };
}
