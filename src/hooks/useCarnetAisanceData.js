import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeGroupTrainings, subscribeUserAisance } from '../services/aisanceService';
import { buildResolutionDictionaries, resolvePieceLiveTechnicalData } from '../utils/repertoireMatcher';
import { useDancadorChoreographies } from './useDancadorData';
import { savePieceComfortAndVocal, normalizeVocalStage } from '../utils/aisanceAutoSync';

/**
 * Hook de données et d'actions pour MonCarnetAisance (< 120 lignes).
 * Gère la résolution vivante des morceaux, les paliers d'entraînement et la persistance confort + chant.
 */
export function useCarnetAisanceData({
  profileData,
  repertoire = [],
  rhythms = [],
  songs = [],
  educationalSheets = [],
  evaluations = {},
  handleSetEvaluation = null,
  t
}) {
  const groupId = profileData?.groupId;
  const userId = profileData?.uid || profileData?.id;

  const [groupTrainings, setGroupTrainings] = useState([]);
  const [userAisanceMap, setUserAisanceMap] = useState({});
  const [piecesProgress, setPiecesProgress] = useState({});
  const [promoToast, setPromoToast] = useState(null);
  const { choreographies } = useDancadorChoreographies(groupId);

  useEffect(() => {
    if (!groupId) return undefined;
    return subscribeGroupTrainings(groupId, setGroupTrainings);
  }, [groupId]);

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeUserAisance(userId, setUserAisanceMap);
  }, [userId]);

  useEffect(() => {
    if (!userId || !groupId) return undefined;
    const parcoursRef = doc(db, 'users', userId, 'parcours', groupId);
    return onSnapshot(
      parcoursRef,
      (snap) => {
        if (snap.exists()) {
          setPiecesProgress(snap.data().piecesProgress || {});
        }
      },
      () => {}
    );
  }, [userId, groupId]);

  const resolvedPieces = useMemo(() => {
    const dicts = buildResolutionDictionaries({
      catalogRhythms: rhythms,
      toadasList: songs,
      cultureDocsList: educationalSheets,
      choreographies: choreographies || []
    });
    const activeRep = (repertoire || []).filter((p) => !p.isArchived);
    if (activeRep.length > 0) {
      return activeRep.map((p) => resolvePieceLiveTechnicalData(p, dicts)).filter(Boolean);
    }
    return (songs || [])
      .filter((s) => !s.isArchived)
      .map((s) => resolvePieceLiveTechnicalData({ id: s.id, titre: s.titre, toadaDocId: s.id, activeToada: s }, dicts))
      .filter(Boolean);
  }, [repertoire, rhythms, songs, educationalSheets, choreographies]);

  const handleSelectComfort = useCallback(async (pieceId, level) => {
    if (handleSetEvaluation) handleSetEvaluation(pieceId, level);
    await savePieceComfortAndVocal({ db, userId, groupId, pieceId, confort: level });
  }, [handleSetEvaluation, userId, groupId]);

  const handleSelectVocalStage = useCallback(async (pieceId, stage) => {
    const normalized = normalizeVocalStage(stage);
    setPiecesProgress((prev) => ({
      ...prev,
      [pieceId]: { ...(prev[pieceId] || {}), vocalStage: normalized }
    }));
    await savePieceComfortAndVocal({ db, userId, groupId, pieceId, vocalStage: normalized });
  }, [userId, groupId]);

  const handleComfortPromoted = useCallback((newComfort) => {
    const msg = newComfort === 'alaise'
      ? `🌳 ${t('pedagogy.carnet.toastAutoPromotedAlaise')}`
      : `🌿 ${t('pedagogy.carnet.toastAutoPromotedPratique')}`;
    setPromoToast(msg);
    setTimeout(() => setPromoToast(null), 4000);
  }, [t]);

  const getPieceComfort = useCallback((pieceId) => {
    return piecesProgress?.[pieceId]?.confort || evaluations?.[pieceId] || null;
  }, [piecesProgress, evaluations]);

  const getPieceVocalStage = useCallback((pieceId) => {
    return normalizeVocalStage(piecesProgress?.[pieceId]?.vocalStage);
  }, [piecesProgress]);

  return {
    userId, groupId, groupTrainings, userAisanceMap, resolvedPieces,
    promoToast, getPieceComfort, getPieceVocalStage,
    handleSelectComfort, handleSelectVocalStage, handleComfortPromoted
  };
}

