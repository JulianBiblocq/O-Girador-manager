import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MemberRepertoireHeader from './MemberRepertoireHeader';
import MemberPieceCard from './MemberPieceCard';
import MemberMediaModals from './MemberMediaModals';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import { useCantadorToadas } from '../../hooks/useCantadorToadas';
import { buildResolutionDictionaries, resolvePieceLiveTechnicalData, getPieceTablature } from '../../utils/repertoireMatcher';
import { subscribeGroupTrainings, subscribeUserAisance } from '../../services/aisanceService';
import { savePieceComfortAndVocal } from '../../utils/aisanceAutoSync';
import { useTranslation } from '../LanguageContext';

/**
 * Vue Répertoire côté Adhérent / Élève (< 130 lignes).
 * Présentation en grille responsive 2 colonnes (PC) / 1 colonne (mobile) avec suivi confort et vocal unifié.
 */
export default function MemberRepertoireView({ groupId, user, profileData, sequenceurUrl, onNavigateToView = null }) {
  const { t } = useTranslation();
  const effectiveUserId = user?.uid || profileData?.uid || profileData?.id;

  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [searchQuery, setSearchQuery] = useState('');
  const [revisionsDemandees, setRevisionsDemandees] = useState({});
  const [piecesProgress, setPiecesProgress] = useState({});
  const [trainings, setTrainings] = useState([]);
  const [aisanceMap, setAisanceMap] = useState({});
  const [expandedPieces, setExpandedPieces] = useState(new Set());
  const [activeTablaturePiece, setActiveTablaturePiece] = useState(null);
  const [activeToadaToView, setActiveToadaToView] = useState(null);
  const [activeCultureDocToView, setActiveCultureDocToView] = useState(null);

  const { rhythms } = useSequencerFirestoreData(groupId);
  const { choreographies } = useDancadorChoreographies(groupId);
  const { toadasList, cultureDocsList } = useRepertoireVaralDocs(groupId);
  const { toadaPacks } = useCantadorToadas(groupId);

  useEffect(() => {
    if (!groupId) return;
    return onSnapshot(collection(db, 'associations', groupId, 'repertoire'), (snap) => {
      const fetched = [];
      snap.forEach((d) => { if (d.data().statutSaison === 'saison') fetched.push({ id: d.id, ...d.data() }); });
      fetched.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
      setPieces(fetched);
      setLoading(false);
    }, (err) => { console.error('Erreur écoute répertoire adhérent :', err); setLoading(false); });
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsubTrainings = subscribeGroupTrainings(groupId, setTrainings);
    const unsubAisance = subscribeUserAisance(effectiveUserId, setAisanceMap);
    return () => { unsubTrainings(); unsubAisance(); };
  }, [groupId, effectiveUserId]);

  useEffect(() => {
    if (!effectiveUserId || !groupId) return;
    return onSnapshot(doc(db, 'users', effectiveUserId, 'parcours', groupId), (snap) => {
      const pData = snap.exists() ? snap.data() : {};
      setRevisionsDemandees(pData.revisionsDemandees || {});
      setPiecesProgress(pData.piecesProgress || {});
    }, (err) => console.warn('MemberRepertoireView - Erreur lecture parcours adhérent :', err));
  }, [effectiveUserId, groupId]);

  useEffect(() => {
    let t1, t2;
    const focusPiece = (id) => {
      if (!id) return;
      setExpandedPieces((prev) => new Set([...prev, id]));
      t1 = setTimeout(() => {
        const el = document.getElementById(`piece-card-${id}`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-4', 'ring-amber-400'); t2 = setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 3000); }
      }, 350);
    };
    try { const pId = new URLSearchParams(window.location.search).get('pieceId'); if (pId) focusPiece(pId); } catch {}
    const onCustom = (e) => focusPiece(e.detail?.pieceId);
    window.addEventListener('open-repertoire-piece', onCustom);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('open-repertoire-piece', onCustom); };
  }, [pieces]);

  const dicts = useMemo(() => buildResolutionDictionaries({ catalogRhythms: rhythms, toadasList, cultureDocsList, choreographies, toadaPacks }), [rhythms, toadasList, cultureDocsList, choreographies, toadaPacks]);
  const resolvedPieces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pieces.map((p) => resolvePieceLiveTechnicalData(p, dicts)).filter((p) => p && (!q || (p.titre || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q)));
  }, [pieces, dicts, searchQuery]);

  const allExpanded = useMemo(() => resolvedPieces.length > 0 && resolvedPieces.every((p) => expandedPieces.has(p.id)), [resolvedPieces, expandedPieces]);
  const handleToggleAllExpanded = () => setExpandedPieces(allExpanded ? new Set() : new Set(resolvedPieces.map((p) => p.id)));
  const handleToggleExpand = (pieceId) => setExpandedPieces((prev) => { const next = new Set(prev); if (next.has(pieceId)) next.delete(pieceId); else next.add(pieceId); return next; });

  const handleToggleRevision = async (pieceId) => {
    if (!effectiveUserId || !groupId || !pieceId) return;
    const newVal = !revisionsDemandees[pieceId];
    setRevisionsDemandees((prev) => ({ ...prev, [pieceId]: newVal }));
    const pRef = doc(db, 'users', effectiveUserId, 'parcours', groupId);
    try { await updateDoc(pRef, { [`revisionsDemandees.${pieceId}`]: newVal }); }
    catch { await setDoc(pRef, { revisionsDemandees: { [pieceId]: newVal } }, { merge: true }); }
  };

  const handleSetComfortLevel = async (pieceId, level) => {
    setPiecesProgress((prev) => ({ ...prev, [pieceId]: { ...(prev[pieceId] || {}), confort: level } }));
    await savePieceComfortAndVocal({ db, userId: effectiveUserId, groupId, pieceId, confort: level });
  };
  const handleSetVocalStage = async (pieceId, stage) => {
    setPiecesProgress((prev) => ({ ...prev, [pieceId]: { ...(prev[pieceId] || {}), vocalStage: stage } }));
    await savePieceComfortAndVocal({ db, userId: effectiveUserId, groupId, pieceId, vocalStage: stage });
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-none pb-8">
      <MemberRepertoireHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} allExpanded={allExpanded} onToggleAllExpanded={handleToggleAllExpanded} hasPieces={resolvedPieces.length > 0} />
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-stone-500 animate-pulse">{t('pedagogy.modals.chargementDuRepertoire')}</div>
      ) : resolvedPieces.length === 0 ? (
        <div className="p-8 text-center bg-white/70 border-2 border-dashed border-cordel-master-dark/30 rounded-lg text-xs font-bold text-stone-600">
          {searchQuery ? (t('repertoire.noPiecesFound') || 'Aucun morceau ne correspond à votre recherche.') : t('pedagogy.modals.aucunMorceauNEst')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {resolvedPieces.map((piece) => (
            <MemberPieceCard
              key={piece.id} piece={piece} userId={effectiveUserId} groupId={groupId} profileData={profileData} trainings={trainings} aisanceMap={aisanceMap}
              isRevisionRequested={Boolean(revisionsDemandees[piece.id])} comfortLevel={piecesProgress[piece.id]?.confort || 0} vocalStage={piecesProgress[piece.id]?.vocalStage || 'none'}
              isExpanded={expandedPieces.has(piece.id)} onToggleExpand={() => handleToggleExpand(piece.id)} onToggleRevision={handleToggleRevision}
              onSetComfortLevel={handleSetComfortLevel} onSetVocalStage={handleSetVocalStage} onComfortPromoted={(_, next) => handleSetComfortLevel(piece.id, next)}
              onOpenTablature={(p) => setActiveTablaturePiece({ ...p, tablature: getPieceTablature(p) })} onOpenToada={(tDoc, p) => setActiveToadaToView(tDoc ? { ...tDoc, piece: p } : null)}
              onOpenCulture={(cDoc, p, docs) => setActiveCultureDocToView(cDoc ? { ...cDoc, piece: p, docs: docs || (cDoc ? [cDoc] : []) } : null)} sequenceurUrl={sequenceurUrl} onNavigateToView={onNavigateToView}
            />
          ))}
        </div>
      )}
      <MemberMediaModals activeTablaturePiece={activeTablaturePiece} onCloseTablature={() => setActiveTablaturePiece(null)} activeToadaToView={activeToadaToView} onCloseToada={() => setActiveToadaToView(null)} activeCultureDocToView={activeCultureDocToView} onCloseCulture={() => setActiveCultureDocToView(null)} groupId={groupId} profileData={profileData} onNavigateToView={onNavigateToView} />
    </div>
  );
}