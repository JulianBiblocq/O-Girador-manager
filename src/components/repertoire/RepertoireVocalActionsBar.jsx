/**
 * RepertoireVocalActionsBar.jsx
 * Micro-composant d'actions vocales côte à côte sur les cartes du Répertoire et modales Toada :
 * 1. [ S'entraîner / Cantador ] (SSO direct vers Cantador en mode élève ou studio)
 * 2. [ Partition ] (modale A4 Portrait 2 portées / Tablature 4 étages + export .musicxml) (< 115 lignes).
 */
import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { launchCantador } from '../../utils/trainingLauncher';
import { isCantadorValidated } from '../../utils/repertoireMatcher';
import { buildRepertoireCantadorUrl, resolveRepertoireVocalFlags } from '../../utils/repertoireCantadorUrl';
import ToadaScoreSheetModal from './ToadaScoreSheetModal';

export { buildRepertoireCantadorUrl };

export default function RepertoireVocalActionsBar({
  piece = null,
  toadaDoc = null,
  groupId = null,
  isMestreView = false,
  compact = false,
}) {
  const { t } = useTranslation();
  const [scoreOpen, setScoreOpen] = useState(false);

  const resolvedDoc = toadaDoc || piece?.activeToada || null;
  const { songId, toadaId, hasAnyVocalLink, hasScoreSource, mode } = resolveRepertoireVocalFlags(
    piece,
    resolvedDoc,
    isMestreView
  );

  const isValidated =
    isCantadorValidated(piece, piece?.activeCantadorPack) || isCantadorValidated(resolvedDoc);
  const showTrainBtn = isMestreView ? hasAnyVocalLink : isValidated;
  const showScoreBtn = hasScoreSource || isValidated;

  if (!showTrainBtn && !showScoreBtn) return null;

  const btnSizeClass = compact
    ? 'px-2 py-0.5 text-[9.5px] uppercase tracking-wider'
    : 'px-2.5 py-1 text-xs';

  const handleOpenCantador = (e) => {
    e.stopPropagation();
    launchCantador({ songId, toadaId: toadaId || undefined, mode, groupId });
  };

  const handleOpenScore = (e) => {
    e.stopPropagation();
    setScoreOpen(true);
  };

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap select-none" onClick={(e) => e.stopPropagation()}>
      {showTrainBtn && (
        <button
          type="button"
          onClick={handleOpenCantador}
          className={`${btnSizeClass} font-black rounded border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-950 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs`}
          title={isMestreView ? t('repertoire.tooltipVocalLab') : t('repertoire.tooltipTrainInCantador')}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
          </svg>
          <span>{isMestreView ? t('repertoire.btnStudioShort') : t('repertoire.btnTrainShort')}</span>
        </button>
      )}

      {showScoreBtn && (
        <button
          type="button"
          onClick={handleOpenScore}
          className={`${btnSizeClass} font-black rounded border border-stone-400 bg-stone-50 hover:bg-stone-100 text-encre-noire transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs`}
          title={t('repertoire.tooltipScoreSheet')}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>{t('repertoire.btnScoreSheet')}</span>
        </button>
      )}

      {scoreOpen && (
        <ToadaScoreSheetModal
          isOpen={scoreOpen}
          onClose={() => setScoreOpen(false)}
          piece={piece}
          toadaDoc={resolvedDoc}
          groupId={groupId}
        />
      )}
    </span>
  );
}
