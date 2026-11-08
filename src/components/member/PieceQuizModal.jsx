import React from 'react';
import PieceRevisionRunner from '../pedagogy/PieceRevisionRunner';
import useMestreSignals from '../../hooks/useMestreSignals';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';

/**
 * Modale Cordel du Mode « Réviser ce morceau » (< 60 lignes).
 * Encapsule PieceRevisionRunner avec synchronisation automatique du confort (syncComfortAfterPractice).
 */
export default function PieceQuizModal({
  isOpen,
  onClose,
  piece,
  groupId = null,
  profileData = null,
  sequenceurUrl = undefined,
  currentComfort = null,
  onComfortPromoted = null
}) {
  const effectiveGroupId = groupId || profileData?.groupId || null;
  const { signals: catalogSignals = [] } = useMestreSignals(effectiveGroupId);
  const { rhythms = [] } = useSequencerRhythms(effectiveGroupId);
  const { toadasList = [], cultureDocsList = [] } = useRepertoireVaralDocs(effectiveGroupId);

  if (!isOpen || !piece) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-3xl my-auto">
        <PieceRevisionRunner
          piece={piece}
          profileData={profileData || { groupId: effectiveGroupId }}
          songs={toadasList}
          educationalSheets={cultureDocsList}
          rhythms={rhythms}
          mestreSignals={catalogSignals}
          sequenceurUrl={sequenceurUrl}
          currentComfort={currentComfort}
          onComfortPromoted={onComfortPromoted}
          onExit={onClose}
        />
      </div>
    </div>
  );
}
