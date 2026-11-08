import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeGroupTrainings, computeTrainingStages } from '../services/aisanceService';
import { normalizeString } from '../utils/repertoireMatcher';
import { computeTroupeChallengeMetrics } from '../utils/pedagogyDashboardCalculations';
import { useSequencerFirestoreData } from './useSequencerFirestoreData';
import { useDancadorSteps, useDancadorChoreographies } from './useDancadorData';

/** Hook de chargement et de synchronisation des données du Cockpit Pédagogique Mestre (< 135 lignes). */
export function useMestrePedagogyData({ groupId, isAuthorized }) {
  const [loadingData, setLoadingData] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { rhythms: sequencerRhythms, loading: loadingSequencer } = useSequencerFirestoreData(groupId);
  const { steps: dancadorSteps } = useDancadorSteps(groupId);
  const { choreographies: dancadorChoreos } = useDancadorChoreographies(groupId);
  const [usersData, setUsersData] = useState([]);
  const [evaluationsMap, setEvaluationsMap] = useState({});
  const [piecesProgressMap, setPiecesProgressMap] = useState({});
  const [revisionsDemandeesMap, setRevisionsDemandeesMap] = useState({});
  const [assocInstruments, setAssocInstruments] = useState([]);
  const [songs, setSongs] = useState([]);
  const [fiches, setFiches] = useState([]);
  const [rhythmMetaList, setRhythmMetaList] = useState([]);
  const [groupTrainings, setGroupTrainings] = useState([]);
  const [userAisanceMap, setUserAisanceMap] = useState({});
  const [userReflexesMap, setUserReflexesMap] = useState({});
  const [repertoire, setRepertoire] = useState([]);

  useEffect(() => {
    if (!groupId || !isAuthorized) return;
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('groupId', '==', groupId)));
        const users = [];
        usersSnap.forEach((d) => {
          const uData = d.data();
          const isActif = uData.statutActuel !== 'archived' && uData.statutActuel !== 'inactive' && uData.status !== 'archived' && uData.status !== 'inactive';
          if (isActif) users.push({ id: d.id, ...uData });
        });
        setUsersData(users);

        const evals = {};
        const revs = {};
        const progress = {};
        await Promise.all(users.map(async (u) => {
          try {
            const snap = await getDoc(doc(db, 'users', u.id, 'parcours', groupId));
            const pData = snap.exists() ? snap.data() : {};
            evals[u.id] = pData.evaluations || {};
            revs[u.id] = pData.revisionsDemandees || {};
            progress[u.id] = pData.piecesProgress || {};
          } catch {
            evals[u.id] = {}; revs[u.id] = {}; progress[u.id] = {};
          }
        }));
        setEvaluationsMap(evals);
        setRevisionsDemandeesMap(revs);
        setPiecesProgressMap(progress);

        try {
          const assocSnap = await getDoc(doc(db, 'associations', groupId));
          if (assocSnap.exists()) {
            const aData = assocSnap.data();
            setAssocInstruments(aData.instrumentsDisponibles || aData.instrumentsActifs || []);
          }
        } catch { /* ignore */ }

        const docsSnap = await getDocs(query(collection(db, 'documents'), where('groupId', '==', groupId)));
        const fetchedSongs = [];
        const fetchedFiches = [];
        docsSnap.forEach((d) => {
          const data = d.data();
          if (data.type === 'song') fetchedSongs.push({ id: d.id, ...data });
          if (data.type === 'fiche_pedagogique' || data.type === 'culture_fiche') fetchedFiches.push({ id: d.id, ...data });
        });
        setSongs(fetchedSongs);
        setFiches(fetchedFiches);

        const metaSnap = await getDocs(collection(db, 'associations', groupId, 'rhythmMetadata'));
        setRhythmMetaList(metaSnap.docs.map((d) => ({ id: d.id, titre: d.data().titre || d.data().title || d.id, ...d.data() })));

        try {
          const repSnap = await getDocs(collection(db, 'associations', groupId, 'repertoire'));
          setRepertoire(repSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch { /* ignore */ }

        const aisance = {};
        const reflexes = {};
        await Promise.all(users.map(async (u) => {
          try {
            const aSnap = await getDocs(collection(db, 'users', u.id, 'aisance'));
            const uAisance = {};
            aSnap.forEach((ad) => {
              if (ad.id === 'reflexes') reflexes[u.id] = ad.data();
              else if (ad.id !== 'conducteurs' && ad.id !== 'vocal') uAisance[ad.id] = ad.data().stagesCompleted || [];
            });
            aisance[u.id] = uAisance;
          } catch { aisance[u.id] = {}; }
        }));
        setUserAisanceMap(aisance);
        setUserReflexesMap(reflexes);
      } catch (err) {
        console.error('Erreur chargement données pédagogiques :', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [groupId, isAuthorized, refreshTrigger]);

  useEffect(() => {
    if (!groupId || !isAuthorized) return undefined;
    return subscribeGroupTrainings(groupId, setGroupTrainings);
  }, [groupId, isAuthorized]);

  const resolvedTrainings = useMemo(() => (groupTrainings || []).map((tr) => {
    const matchedPiece = (repertoire || []).find((p) => (
      (p.sequenceurId && p.sequenceurId === tr.presetId) ||
      (p.presetId && p.presetId === tr.presetId) ||
      (tr.presetId && p.id === tr.presetId) ||
      (normalizeString(p.titre) && normalizeString(p.titre) === normalizeString(tr.title || tr.titre || tr.name))
    ));
    return { ...tr, matchedPiece, repertoireTitle: matchedPiece?.titre || tr.title || tr.titre || 'Morceau', stages: computeTrainingStages(tr) };
  }), [groupTrainings, repertoire]);

  const troupeChallengeMetrics = useMemo(() => computeTroupeChallengeMetrics(usersData, userReflexesMap), [usersData, userReflexesMap]);

  return {
    isLoading: loadingData || loadingSequencer, setLoadingData, setRefreshTrigger,
    sequencerRhythms, dancadorSteps, dancadorChoreos, usersData, evaluationsMap, setEvaluationsMap,
    piecesProgressMap, revisionsDemandeesMap, assocInstruments, songs, fiches, rhythmMetaList,
    repertoire, userAisanceMap, resolvedTrainings, troupeChallengeMetrics
  };
}
