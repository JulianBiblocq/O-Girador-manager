import React from 'react';
import CordelCard from '../CordelCard';
import PieceAisanceSection from '../member/PieceAisanceSection';
import PieceDirectionChallengesBar from './PieceDirectionChallengesBar';
import { isCantadorValidated, resolvePieceTrainings } from '../../utils/repertoireMatcher';
import { launchCantador } from '../../utils/trainingLauncher';
import { launchDancador } from '../../utils/dancadorLauncher';
import { useTranslation } from '../LanguageContext';

const VOCAL_PILLS = [
  { id: 'coro', icon: '🗣️', labelKey: 'pedagogy.vocal.stageCoro' },
  { id: 'simultane', icon: '🥁🗣️', labelKey: 'pedagogy.vocal.stageSimultane' },
  { id: 'puxador', icon: '👑🎙️', labelKey: 'pedagogy.vocal.stagePuxador' }
];

/**
 * Ligne d'accordéon compacte pour un morceau dans MonCarnetAisance (< 135 lignes).
 * Combine suivi confort instrumental/danse, suivi vocal 3 stades, défis signaux (ReflexGameModal / SignalTimelineModal) et passerelles directes.
 */
export default function AisancePieceAccordionRow({
  piece, isExpanded = false, onToggleExpand, currentComfort = null, currentVocalStage = 'none',
  isRevisionRequested = false, comfortLevels = [], onSelectComfort, onSelectVocalStage,
  onToggleRevision, onRevisePiece, onComfortPromoted, trainings = [], aisanceMap = {},
  userId, groupId, sequenceurUrl, profileData = null
}) {
  const { t } = useTranslation();
  if (!piece) return null;

  const hasRhythm = Boolean(piece.sequenceurId || piece.preset || piece.hasSequencer);
  const hasToada = Boolean(piece.activeToada || piece.toadaDocId || piece.hasToada);
  const hasDance = Boolean(piece.activeChoreography || piece.dancadorChoreoId || piece.hasChoreography);
  const hasTraining = resolvePieceTrainings(piece, trainings).length > 0;
  const hasSignals = Boolean(piece.sinaisDoMestre?.length > 0 || piece.activeSinaisDoMestre?.length > 0);
  const canOpenCantador = isCantadorValidated(piece, piece.activeCantadorPack);

  const handleOpenCantador = () => launchCantador({
    mode: 'eleve',
    songId: piece.toadaDocId || piece.activeToada?.id || piece.id,
    toadaId: piece.cantadorToadaId || piece.activeToada?.cantadorToadaId || undefined,
    groupId
  });

  const handleOpenDancador = () => {
    const choreoId = piece.dancadorChoreoId || piece.activeChoreography?.id || '';
    launchDancador({ choreoId, groupId });
  };

  return (
    <CordelCard id={`aisance-row-${piece.id}`} className="p-0 overflow-hidden border-2 border-encre-noire bg-[#fdfaf2]">
      <div
        onClick={onToggleExpand}
        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-stone-100/70 transition-colors ${
          isExpanded ? 'border-b-2 border-dashed border-cordel-master-dark/25 bg-white/80' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-black text-cordel-wood">{isExpanded ? '▾' : '▸'}</span>
          <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire truncate">{piece.titre}</h3>
          <div className="flex items-center gap-1 flex-wrap">
            {hasRhythm && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300">🥁 {t('pedagogy.carnet.badgeRhythm')}</span>}
            {hasToada && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-950">🗣️ {t('pedagogy.carnet.badgeToada')}</span>}
            {hasDance && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-900">💃 {t('pedagogy.carnet.badgeDance')}</span>}
            {hasTraining && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-950">⚡ {t('pedagogy.carnet.badgeTraining')}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {onToggleRevision && (
            <button
              type="button"
              onClick={() => onToggleRevision(piece.id)}
              className={`px-2 py-1 text-[9.5px] font-black uppercase rounded border cursor-pointer flex items-center gap-1 ${
                isRevisionRequested ? 'bg-[var(--color-cordel-ocre)] text-white border-encre-noire' : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-100'
              }`}
            >
              <span>🙋</span><span>{isRevisionRequested ? t('pedagogy.revisionRequestedNotice') : t('pedagogy.requestRevisionBtn')}</span>
            </button>
          )}
          <div className="flex items-center gap-1">
            {comfortLevels.map((lvl) => (
              <button
                key={lvl.level}
                type="button"
                onClick={() => onSelectComfort && onSelectComfort(piece.id, lvl.level)}
                className={`text-[9.5px] font-black uppercase px-2 py-1 rounded border cursor-pointer transition-all ${
                  currentComfort === lvl.level ? 'bg-cordel-wood text-white border-encre-noire shadow-2xs' : 'bg-white text-encre-noire/80 border-encre-noire/25 hover:bg-neutral-100'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 flex flex-col gap-3 text-left bg-[#fdfaf2]">
          {hasToada && (
            <div className="p-2.5 rounded bg-amber-50/70 border border-amber-300/80 flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">{t('pedagogy.vocal.sectionTitle')}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {VOCAL_PILLS.map((pill) => {
                  const active = currentVocalStage === pill.id;
                  return (
                    <button key={pill.id} type="button" onClick={() => onSelectVocalStage && onSelectVocalStage(piece.id, active ? 'none' : pill.id)} className={`px-2.5 py-1 rounded text-[10px] font-black border cursor-pointer transition-all ${active ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire shadow-2xs' : 'bg-white text-encre-noire border-encre-noire/25 hover:bg-amber-100/50'}`}>
                      {pill.icon} {t(pill.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSignals && (
            <PieceDirectionChallengesBar piece={piece} userId={userId} groupId={groupId} profileData={profileData} currentComfort={currentComfort} onComfortPromoted={onComfortPromoted} />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {canOpenCantador && <button type="button" onClick={handleOpenCantador} className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-[var(--color-cordel-ocre)] text-white border border-encre-noire cursor-pointer">🎙️ {t('pedagogy.carnet.btnPracticeCantadorDirect')}</button>}
            {hasDance && <button type="button" onClick={handleOpenDancador} className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-purple-800 text-white border border-encre-noire cursor-pointer">💃 {t('pedagogy.carnet.btnSeeChoreography')}</button>}
            {onRevisePiece && <button type="button" onClick={() => onRevisePiece(piece)} className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-[var(--color-cordel-vert)] text-white border border-encre-noire cursor-pointer">🎯 {t('pedagogy.carnet.btnReviseThisPiece')}</button>}
          </div>

          <PieceAisanceSection piece={piece} trainings={trainings} aisanceMap={aisanceMap} userId={userId} groupId={groupId} sequenceurUrl={sequenceurUrl} profileData={profileData} currentComfort={currentComfort} onComfortPromoted={onComfortPromoted} />
        </div>
      )}
    </CordelCard>
  );
}
