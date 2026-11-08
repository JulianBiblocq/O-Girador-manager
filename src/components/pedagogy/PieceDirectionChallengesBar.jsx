import React, { useState, useEffect, useMemo } from 'react';
import ReflexGameModal from './ReflexGameModal';
import SignalTimelineModal from './SignalTimelineModal';
import { subscribeUserReflexes, subscribeUserConducteurs } from '../../services/aisanceService';
import { useTranslation } from '../LanguageContext';

/**
 * Barre compacte des défis de direction musicale pour un morceau (< 115 lignes).
 * S'affiche uniquement si le morceau possède des sinaisDoMestre (sinaisDoMestre.length > 0).
 * Affiche le compteur 🎯 Réflexes Temps 1 : X / Y, le badge 📜 Conducteur validé,
 * et les boutons [ ⚡ Défi Réflexe Temps 1 ] et [ 🖐️ Conducteur des Signaux ].
 */
export default function PieceDirectionChallengesBar({
  piece,
  userId,
  groupId,
  profileData = null,
  mestreSignals = [],
  currentComfort = null,
  timelineValidated = false,
  onComfortPromoted = null
}) {
  const { t } = useTranslation();
  const [isReflexOpen, setIsReflexOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [reflexesData, setReflexesData] = useState({});
  const [conducteursData, setConducteursData] = useState({});
  const [localTimelineValid, setLocalTimelineValid] = useState(false);

  const effectiveUserId = userId || profileData?.uid || profileData?.id;
  const effectiveGroupId = groupId || profileData?.groupId;

  const rawSignals = useMemo(() => {
    if (Array.isArray(piece?.sinaisDoMestre) && piece.sinaisDoMestre.length > 0) return piece.sinaisDoMestre;
    if (Array.isArray(piece?.activeSinaisDoMestre) && piece.activeSinaisDoMestre.length > 0) return piece.activeSinaisDoMestre;
    if (Array.isArray(piece?.preset?.sinaisDoMestre) && piece.preset.sinaisDoMestre.length > 0) return piece.preset.sinaisDoMestre;
    if (Array.isArray(piece?.preset?.parsedData?.sinaisDoMestre) && piece.preset.parsedData.sinaisDoMestre.length > 0) {
      return piece.preset.parsedData.sinaisDoMestre;
    }
    return [];
  }, [piece]);

  useEffect(() => {
    if (!effectiveUserId || rawSignals.length === 0) return undefined;
    const unsubReflex = subscribeUserReflexes(effectiveUserId, setReflexesData);
    const unsubCond = subscribeUserConducteurs(effectiveUserId, setConducteursData);
    return () => {
      if (unsubReflex) unsubReflex();
      if (unsubCond) unsubCond();
    };
  }, [effectiveUserId, rawSignals.length]);

  if (!piece || rawSignals.length === 0) return null;

  const overrides = piece.signalOverrides || {};
  const interactiveTotal = rawSignals.filter((sig, idx) => {
    const sigId = sig.signalId || sig.id || `sig_${idx}`;
    const ov = overrides[sigId];
    return !(ov && (ov.mode === 'cueOnly' || ov.mode === 'repere' || ov.isInteractive === false));
  }).length || rawSignals.length;

  const pieceReflexEntries = Object.entries(reflexesData || {})
    .filter(([k, v]) => v && typeof v === 'object' && (v.pieceId === piece.id || k.startsWith(`${piece.id}_`)))
    .map(([, v]) => v);
  const bestDone = pieceReflexEntries.reduce((max, r) => Math.max(max, Number(r.score) || 0), 0);
  const totalCount = pieceReflexEntries[0]?.totalSignals || interactiveTotal;

  const isTimelineDone = Boolean(
    timelineValidated || localTimelineValid || conducteursData?.[`${piece.id}_conductor`]?.perfectScore
  );

  return (
    <div className="p-2.5 rounded bg-amber-50/85 border border-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood bg-white px-2 py-0.5 rounded border border-amber-300">
          🎯 {t('pedagogy.reflex.reflexCounterLabel', { done: bestDone, total: totalCount })}
        </span>
        {isTimelineDone && (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white border border-encre-noire">
            📜 {t('pedagogy.reflex.timelineValidatedBadge')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsReflexOpen(true)}
          className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-cordel-wood text-white border border-encre-noire hover:brightness-110 cursor-pointer transition-all"
        >
          ⚡ {t('pedagogy.reflex.btnReflexChallenge')}
        </button>
        <button
          type="button"
          onClick={() => setIsTimelineOpen(true)}
          className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-[var(--color-cordel-ocre)] text-white border border-encre-noire hover:brightness-110 cursor-pointer transition-all"
        >
          🖐️ {t('pedagogy.reflex.btnSignalTimeline')}
        </button>
      </div>

      {isReflexOpen && (
        <ReflexGameModal
          isOpen={isReflexOpen} onClose={() => setIsReflexOpen(false)} piece={piece}
          profileData={profileData} groupId={effectiveGroupId} currentComfort={currentComfort}
          onComfortPromoted={onComfortPromoted}
        />
      )}
      {isTimelineOpen && (
        <SignalTimelineModal
          isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} piece={piece}
          mestreSignals={mestreSignals} profileData={profileData} userId={effectiveUserId}
          groupId={effectiveGroupId} currentComfort={currentComfort} onComfortPromoted={onComfortPromoted}
          onValidated={() => setLocalTimelineValid(true)}
        />
      )}
    </div>
  );
}

