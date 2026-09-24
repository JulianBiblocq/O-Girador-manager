import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MemberPieceCard from './MemberPieceCard';
import MemberMediaModals from './MemberMediaModals';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import { buildResolutionDictionaries, resolvePieceLiveTechnicalData, getPieceTablature } from '../../utils/repertoireMatcher';
import { subscribeGroupTrainings, subscribeUserAisance } from '../../services/aisanceService';

/**
 * Vue Répertoire côté Adhérent / Élève (< 220 lignes).
 * Permet la consultation des morceaux au programme, la formulation
 * des demandes de révision, le suivi du confort et la pratique Speed Trainer.
 */
export default function MemberRepertoireView({ groupId, user, profileData, sequenceurUrl }) {
  const effectiveUserId = user?.uid || profileData?.uid || profileData?.id;

  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revisionsDemandees, setRevisionsDemandees] = useState({});
  const [piecesProgress, setPiecesProgress] = useState({});
  const [trainings, setTrainings] = useState([]);
  const [aisanceMap, setAisanceMap] = useState({});

  // Modales partagées
  const [activeTablaturePiece, setActiveTablaturePiece] = useState(null);
  const [activeToadaToView, setActiveToadaToView] = useState(null);
  const [activeCultureDocToView, setActiveCultureDocToView] = useState(null);

  // Catalogues vivants
  const { rhythms } = useSequencerFirestoreData(groupId);
  const { choreographies } = useDancadorChoreographies(groupId);
  const { toadasList, cultureDocsList } = useRepertoireVaralDocs(groupId);

  // 1. Écoute temps-réel du répertoire (filtré strictement sur la saison)
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const colRef = collection(db, 'associations', groupId, 'repertoire');
    const unsub = onSnapshot(colRef, (snap) => {
      const fetched = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.statutSaison === 'saison') fetched.push({ id: d.id, ...data });
      });
      fetched.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
      setPieces(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Erreur écoute répertoire adhérent :", err);
      setLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  // 2. Écoute des entraînements et du carnet d'aisance
  useEffect(() => {
    if (!groupId) return;
    const unsubTrainings = subscribeGroupTrainings(groupId, setTrainings);
    const unsubAisance = subscribeUserAisance(effectiveUserId, setAisanceMap);
    return () => {
      unsubTrainings();
      unsubAisance();
    };
  }, [groupId, effectiveUserId]);

  // 3. Écoute du parcours adhérent
  useEffect(() => {
    if (!effectiveUserId || !groupId) return;
    const pRef = doc(db, 'users', effectiveUserId, 'parcours', groupId);
    const unsub = onSnapshot(pRef, (snap) => {
      const pData = snap.exists() ? snap.data() : {};
      setRevisionsDemandees(pData.revisionsDemandees || {});
      setPiecesProgress(pData.piecesProgress || {});
    });
    return () => unsub();
  }, [effectiveUserId, groupId]);

  // 4. Dictionnaires de résolution pour mapping direct O(1)
  const dicts = useMemo(() => {
    return buildResolutionDictionaries({
      catalogRhythms: rhythms,
      toadasList,
      cultureDocsList,
      choreographies
    });
  }, [rhythms, toadasList, cultureDocsList, choreographies]);

  // 5. Morceaux résolus et filtrés par la recherche
  const resolvedPieces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pieces
      .map((p) => resolvePieceLiveTechnicalData(p, dicts))
      .filter((p) => {
        if (!p) return false;
        if (!q) return true;
        return (p.titre || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q);
      });
  }, [pieces, dicts, searchQuery]);

  // Mutation : Demande de révision
  const handleToggleRevision = async (pieceId) => {
    if (!effectiveUserId || !groupId || !pieceId) return;
    const newVal = !revisionsDemandees[pieceId];
    setRevisionsDemandees((prev) => ({ ...prev, [pieceId]: newVal }));
    const pRef = doc(db, 'users', effectiveUserId, 'parcours', groupId);
    try {
      await updateDoc(pRef, { [`revisionsDemandees.${pieceId}`]: newVal });
    } catch {
      await setDoc(pRef, { revisionsDemandees: { [pieceId]: newVal } }, { merge: true });
    }
  };

  // Mutation : Curseur de confort
  const handleSetComfortLevel = async (pieceId, level) => {
    if (!effectiveUserId || !groupId || !pieceId) return;
    setPiecesProgress((prev) => ({ ...prev, [pieceId]: { ...(prev[pieceId] || {}), confort: level } }));
    const pRef = doc(db, 'users', effectiveUserId, 'parcours', groupId);
    try {
      await updateDoc(pRef, { [`piecesProgress.${pieceId}.confort`]: level });
    } catch {
      await setDoc(pRef, { piecesProgress: { [pieceId]: { confort: level } } }, { merge: true });
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-4xl mx-auto pb-8">
      {/* En-tête & Barre de recherche */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b-2 border-dashed border-cordel-master-dark/30">
        <div>
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <span>📜</span>
            <span>Répertoire de la Saison</span>
          </h2>
          <p className="text-[11px] font-bold text-encre-noire/70 mt-0.5">
            Morceaux au programme, entraînements Speed Trainer et demandes de révision
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="🔍 Rechercher un morceau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full text-xs font-bold py-1.5 px-3 bg-cordel-bg-light border-2 border-encre-noire rounded"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Liste des morceaux ou état vide */}
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-stone-500 animate-pulse">
          Chargement du répertoire...
        </div>
      ) : resolvedPieces.length === 0 ? (
        <div className="p-8 text-center bg-white/70 border-2 border-dashed border-cordel-master-dark/30 rounded-lg text-xs font-bold text-stone-600">
          {searchQuery ? 'Aucun morceau ne correspond à votre recherche.' : 'Aucun morceau n\'est actuellement au programme de la saison.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resolvedPieces.map((piece) => (
            <MemberPieceCard
              key={piece.id}
              piece={piece}
              userId={effectiveUserId}
              groupId={groupId}
              trainings={trainings}
              aisanceMap={aisanceMap}
              isRevisionRequested={Boolean(revisionsDemandees[piece.id])}
              comfortLevel={piecesProgress[piece.id]?.confort || 0}
              onToggleRevision={handleToggleRevision}
              onSetComfortLevel={handleSetComfortLevel}
              onOpenTablature={(p) => setActiveTablaturePiece({ ...p, tablature: getPieceTablature(p) })}
              onOpenToada={(t) => setActiveToadaToView(t)}
              onOpenCulture={(c) => setActiveCultureDocToView(c)}
              sequenceurUrl={sequenceurUrl}
            />
          ))}
        </div>
      )}

      {/* Modales de consultation multimédia */}
      <MemberMediaModals
        activeTablaturePiece={activeTablaturePiece}
        onCloseTablature={() => setActiveTablaturePiece(null)}
        activeToadaToView={activeToadaToView}
        onCloseToada={() => setActiveToadaToView(null)}
        activeCultureDocToView={activeCultureDocToView}
        onCloseCulture={() => setActiveCultureDocToView(null)}
        groupId={groupId}
        profileData={profileData}
      />
    </div>
  );
}
