import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MemberRepertoireHeader from './MemberRepertoireHeader';
import MemberPieceCard from './MemberPieceCard';
import MemberMediaModals from './MemberMediaModals';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import { buildResolutionDictionaries, resolvePieceLiveTechnicalData, getPieceTablature } from '../../utils/repertoireMatcher';
import { subscribeGroupTrainings, subscribeUserAisance } from '../../services/aisanceService';

/**
 * Vue Répertoire côté Adhérent / Élève (< 220 lignes).
 * Présentation en grille responsive 2 colonnes (PC) / 1 colonne (mobile)
 * avec accordéons repliables et bascule globale Tout déplier / replier.
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
  const [expandedPieces, setExpandedPieces] = useState(new Set());

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
    return () => { unsubTrainings(); unsubAisance(); };
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

  // 4. Déploiement et centrage automatique si ciblé par URL ou passerelle
  useEffect(() => {
    const focusPiece = (id) => {
      if (!id) return;
      setExpandedPieces((prev) => new Set([...prev, id]));
      setTimeout(() => {
        const el = document.getElementById(`piece-card-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-amber-400');
          setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 3000);
        }
      }, 350);
    };
    try {
      const pId = new URLSearchParams(window.location.search).get('pieceId');
      if (pId) focusPiece(pId);
    } catch (_e) {}
    const onCustom = (e) => focusPiece(e.detail?.pieceId);
    window.addEventListener('open-repertoire-piece', onCustom);
    return () => window.removeEventListener('open-repertoire-piece', onCustom);
  }, [pieces]);

  // 5. Dictionnaires de résolution pour mapping direct O(1)
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

  // Vérifie si tous les morceaux sont actuellement dépliés
  const allExpanded = useMemo(() => {
    return resolvedPieces.length > 0 && resolvedPieces.every((p) => expandedPieces.has(p.id));
  }, [resolvedPieces, expandedPieces]);

  // Bascule globale : tout déplier ou tout replier
  const handleToggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedPieces(new Set());
    } else {
      setExpandedPieces(new Set(resolvedPieces.map((p) => p.id)));
    }
  };

  // Bascule individuelle de l'accordéon d'un morceau
  const handleToggleExpand = (pieceId) => {
    setExpandedPieces((prev) => {
      const next = new Set(prev);
      if (next.has(pieceId)) next.delete(pieceId);
      else next.add(pieceId);
      return next;
    });
  };

  // Mutation : Demande de révision
  const handleToggleRevision = async (pieceId) => {
    if (!effectiveUserId || !groupId || !pieceId) return;
    const newVal = !revisionsDemandees[pieceId];
    setRevisionsDemandees((prev) => ({ ...prev, [pieceId]: newVal }));
    const pRef = doc(db, 'users', effectiveUserId, 'parcours', groupId);
    try { await updateDoc(pRef, { [`revisionsDemandees.${pieceId}`]: newVal }); }
    catch { await setDoc(pRef, { revisionsDemandees: { [pieceId]: newVal } }, { merge: true }); }
  };

  // Mutation : Curseur de confort
  const handleSetComfortLevel = async (pieceId, level) => {
    if (!effectiveUserId || !groupId || !pieceId) return;
    setPiecesProgress((prev) => ({ ...prev, [pieceId]: { ...(prev[pieceId] || {}), confort: level } }));
    const pRef = doc(db, 'users', effectiveUserId, 'parcours', groupId);
    try { await updateDoc(pRef, { [`piecesProgress.${pieceId}.confort`]: level }); }
    catch { await setDoc(pRef, { piecesProgress: { [pieceId]: { confort: level } } }, { merge: true }); }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-5xl mx-auto pb-8">
      {/* En-tête & Barre de recherche avec bascule Tout déplier / replier */}
      <MemberRepertoireHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        allExpanded={allExpanded}
        onToggleAllExpanded={handleToggleAllExpanded}
        hasPieces={resolvedPieces.length > 0}
      />

      {/* Grille responsive 2 colonnes (PC) / 1 colonne (mobile) */}
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-stone-500 animate-pulse">Chargement du répertoire...</div>
      ) : resolvedPieces.length === 0 ? (
        <div className="p-8 text-center bg-white/70 border-2 border-dashed border-cordel-master-dark/30 rounded-lg text-xs font-bold text-stone-600">
          {searchQuery ? 'Aucun morceau ne correspond à votre recherche.' : "Aucun morceau n'est actuellement au programme de la saison."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {resolvedPieces.map((piece) => (
            <MemberPieceCard
              key={piece.id} piece={piece} userId={effectiveUserId} groupId={groupId}
              profileData={profileData} trainings={trainings} aisanceMap={aisanceMap}
              isRevisionRequested={Boolean(revisionsDemandees[piece.id])}
              comfortLevel={piecesProgress[piece.id]?.confort || 0}
              isExpanded={expandedPieces.has(piece.id)}
              onToggleExpand={() => handleToggleExpand(piece.id)}
              onToggleRevision={handleToggleRevision}
              onSetComfortLevel={handleSetComfortLevel}
              onOpenTablature={(p) => setActiveTablaturePiece({ ...p, tablature: getPieceTablature(p) })}
              onOpenToada={(t, p) => setActiveToadaToView(t ? { ...t, piece: p } : null)}
              onOpenCulture={(c, p, docs) => setActiveCultureDocToView(c ? { ...c, piece: p, docs: docs || (c ? [c] : []) } : null)}
              sequenceurUrl={sequenceurUrl}
            />
          ))}
        </div>
      )}

      {/* Modales de consultation multimédia */}
      <MemberMediaModals
        activeTablaturePiece={activeTablaturePiece} onCloseTablature={() => setActiveTablaturePiece(null)}
        activeToadaToView={activeToadaToView} onCloseToada={() => setActiveToadaToView(null)}
        activeCultureDocToView={activeCultureDocToView} onCloseCulture={() => setActiveCultureDocToView(null)}
        groupId={groupId} profileData={profileData}
      />
    </div>
  );
}
