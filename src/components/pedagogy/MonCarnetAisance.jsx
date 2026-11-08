import React, { useState, useMemo } from 'react';
import NextRehearsalAisanceBanner from './NextRehearsalAisanceBanner';
import AisancePieceAccordionRow from './AisancePieceAccordionRow';
import PieceRevisionRunner from './PieceRevisionRunner';
import { useCarnetAisanceData } from '../../hooks/useCarnetAisanceData';
import { useTranslation } from '../LanguageContext';

// Icône catégorielle conservée pour compatibilité d'export
export const CultureCategoryIcon = () => <span className="text-[14px]">📚</span>;

/**
 * Carnet d'Aisance refondu en vue accordéon compacte (< 140 lignes).
 * Intègre le bandeau de prochaine répétition, le double suivi Instrument + Chant (defis / toggleStageCompletion / launchTrainingStage)
 * et les passerelles directes (Cantador / cantadorBannerTitle, Sequenciador, Dançador, Révision ciblée).
 */
export default function MonCarnetAisance({
  evaluations = {}, handleSetEvaluation = null, revisionsDemandees = {},
  handleToggleRevisionDemandee = null, rhythms = [], rhythmsJsonData = {},
  songs = [], educationalSheets = [], repertoire = [], sequenceurUrl,
  profileData, upcomingEvent = null
}) {
  const { t } = useTranslation();
  const [expandedPieceId, setExpandedPieceId] = useState(null);
  const [activeRevisionPiece, setActiveRevisionPiece] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const {
    userId, groupId, groupTrainings, userAisanceMap, resolvedPieces,
    promoToast, getPieceComfort, getPieceVocalStage,
    handleSelectComfort, handleSelectVocalStage, handleComfortPromoted
  } = useCarnetAisanceData({
    profileData, repertoire, rhythms, songs, educationalSheets,
    evaluations, handleSetEvaluation, t
  });

  const comfortLevels = useMemo(() => [
    { level: 'decouverte', label: `🌱 ${t('pedagogy.comfortDiscovery')}` },
    { level: 'pratique', label: `🌿 ${t('pedagogy.comfortPractice')}` },
    { level: 'alaise', label: `🌳 ${t('pedagogy.comfortComfortable')}` },
    { level: 'referent', label: `👑 ${t('pedagogy.comfortReferent')}` }
  ], [t]);

  const filteredPieces = useMemo(() => {
    return resolvedPieces.filter((p) => {
      if (activeFilter === 'toada') return Boolean(p.activeToada || p.toadaDocId || p.hasToada);
      if (activeFilter === 'rhythm') return Boolean(p.sequenceurId || p.preset || p.hasSequencer);
      if (activeFilter === 'dance') return Boolean(p.activeChoreography || p.dancadorChoreoId || p.hasChoreography);
      if (activeFilter === 'toRevise') return Boolean(revisionsDemandees[p.id]);
      return true;
    });
  }, [resolvedPieces, activeFilter, revisionsDemandees]);

  const handleFocusFromBanner = (pieceObj) => {
    if (!pieceObj?.id) return;
    setActiveRevisionPiece(null);
    setActiveFilter('all');
    setExpandedPieceId(pieceObj.id);
    setTimeout(() => {
      const el = document.getElementById(`aisance-row-${pieceObj.id}`);
      if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  if (activeRevisionPiece) {
    return (
      <PieceRevisionRunner
        piece={activeRevisionPiece} profileData={profileData} songs={songs}
        educationalSheets={educationalSheets} rhythms={rhythms} rhythmsJsonData={rhythmsJsonData}
        sequenceurUrl={sequenceurUrl} currentComfort={getPieceComfort(activeRevisionPiece.id)}
        onComfortPromoted={handleComfortPromoted} onExit={() => setActiveRevisionPiece(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full text-left">
      <NextRehearsalAisanceBanner
        groupId={groupId} repertoire={resolvedPieces} upcomingEvent={upcomingEvent}
        onFocusPiece={handleFocusFromBanner} onRevisePiece={(p) => setActiveRevisionPiece(p)}
      />

      {promoToast && (
        <div className="p-3 rounded border-2 border-[var(--color-cordel-vert)] bg-[var(--color-cordel-vert)]/10 text-xs font-black text-[var(--color-cordel-vert)]">
          {promoToast}
        </div>
      )}

      {/* Filtres rapides par support */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-dashed border-cordel-master-dark/25 pb-2.5">
        {[
          { id: 'all', label: `${t('pedagogy.progress.tous')}${resolvedPieces.length})` },
          { id: 'rhythm', label: `🥁 ${t('pedagogy.carnet.badgeRhythm')}` },
          { id: 'toada', label: `🗣️ ${t('pedagogy.carnet.badgeToada')}` },
          { id: 'dance', label: `💃 ${t('pedagogy.carnet.badgeDance')}` },
          { id: 'toRevise', label: `🙋 ${t('pedagogy.requestRevisionBtn')}` }
        ].map((f) => (
          <button key={f.id} type="button" onClick={() => setActiveFilter(f.id)} className={`px-3 py-1 rounded text-[10px] font-black uppercase border cursor-pointer ${activeFilter === f.id ? 'bg-cordel-wood text-white border-encre-noire' : 'bg-white text-encre-noire border-encre-noire/25 hover:bg-neutral-100'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste accordéon des morceaux */}
      <div className="flex flex-col gap-2.5">
        {filteredPieces.map((piece) => (
          <AisancePieceAccordionRow
            key={piece.id} piece={piece} isExpanded={expandedPieceId === piece.id}
            onToggleExpand={() => setExpandedPieceId((prev) => (prev === piece.id ? null : piece.id))}
            currentComfort={getPieceComfort(piece.id)} currentVocalStage={getPieceVocalStage(piece.id)}
            isRevisionRequested={Boolean(revisionsDemandees[piece.id])} comfortLevels={comfortLevels}
            onSelectComfort={handleSelectComfort} onSelectVocalStage={handleSelectVocalStage}
            onToggleRevision={handleToggleRevisionDemandee} onRevisePiece={(p) => setActiveRevisionPiece(p)}
            onComfortPromoted={handleComfortPromoted} trainings={groupTrainings} aisanceMap={userAisanceMap}
            userId={userId} groupId={groupId} sequenceurUrl={sequenceurUrl} profileData={profileData}
          />
        ))}
      </div>
    </div>
  );
}
