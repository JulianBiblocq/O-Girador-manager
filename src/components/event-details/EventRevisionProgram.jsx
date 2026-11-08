import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import RepertoireVideoModal from '../mestre/RepertoireVideoModal';
import SignalZoomModal from '../mestre/SignalZoomModal';
import PieceLyricsModal from '../member/PieceLyricsModal';
import PieceCultureModal from '../member/PieceCultureModal';
import { openSequencerWithCrossApp } from '../../utils/sequencerUrlUtils';
import { launchDancador } from '../../utils/dancadorLauncher';
import { resolvePieceTrainings } from '../../utils/resolvePieceTrainings';
import { resolvePieceLiveTechnicalData } from '../../utils/repertoireMatcher';
import TrainingCompactCard from '../pedagogy/TrainingCompactCard';
import { useTranslation } from '../LanguageContext';
import { useEventRevisionData } from './revision/useEventRevisionData';
import EventRevisionSetlistItem from './revision/EventRevisionSetlistItem';
import EventRevisionFilConducteurFooter from './revision/EventRevisionFilConducteurFooter';
import EventRevisionDanceTab from './revision/EventRevisionDanceTab';

/**
 * Programme de révision d'un événement : Fil conducteur transversal & Onglet Danse (< 135 lignes).
 * Intègre openSequencerWithCrossApp, launchDancador (chorégraphies + stepsForChoreo) et TrainingCompactCard (mode="rehearsal").
 */
export default function EventRevisionProgram({
  event = null, setlist = [], isAuthorized, updatingSetlist, handleRemoveMorceau,
  assocSequenceurUrl, handleAddMorceau, handleAddRepertoirePiece, newMorceauTitre,
  setNewMorceauTitre, newMorceauNotes, setNewMorceauNotes, groupId,
  dancadorChoreoIds = [], handleAddDancadorChoreo, handleRemoveDancadorChoreo,
  linkedPatterns = [], trainingsList: externalTrainingsList
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('filConducteur');
  const [activeVideoToWatch, setActiveVideoToWatch] = useState(null);
  const [activeSignalToZoom, setActiveSignalToZoom] = useState(null);
  const [activeToadaToView, setActiveToadaToView] = useState(null);
  const [activeCultureToView, setActiveCultureToView] = useState(null);

  const {
    isEventDanse, toadasMap, cultureMap, repertoirePieces, activeRepertoirePieces,
    loadingRepertoire, effectiveTrainingsList, signalsMap, allSequencerRhythms,
    allChoreographies, loadingChoreos, allSteps, loadingSteps, resolutionDicts
  } = useEventRevisionData({ event, groupId, externalTrainingsList });

  // Déduplication des rythmes orphelins non représentés dans la setlist
  const linkedSequencerRhythms = useMemo(() => {
    const representedSeqIds = new Set(
      (setlist || []).flatMap((m) => [m.sequenceurId, m.pieceId, m.id, m.jsonUrl]).filter(Boolean)
    );
    return (allSequencerRhythms || []).filter(
      (r) => (linkedPatterns || []).includes(r.id) && !representedSeqIds.has(r.id)
    );
  }, [allSequencerRhythms, linkedPatterns, setlist]);

  const eventChoreographies = allChoreographies.filter((c) => dancadorChoreoIds.includes(c.id));

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-0 px-0 overflow-hidden">
      <div className="flex border-b-2 border-dashed border-cordel-master-dark/15 bg-cordel-bg-light">
        <button type="button" onClick={() => setActiveTab('filConducteur')} className={`flex-1 py-3 text-xs font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'filConducteur' ? 'text-cordel-wood border-b-4 border-cordel-wood bg-white' : 'text-cordel-master-dark/50 hover:text-cordel-wood/70'}`}>
          <span>🧭</span><span>{t('agenda.filConducteurTitle') || 'Fil conducteur'}</span>
          {setlist.length > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cordel-wood/10 text-cordel-wood font-black">{setlist.length}</span>}
        </button>
        <button type="button" onClick={() => setActiveTab('danse')} className={`flex-1 py-3 text-xs font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'danse' ? 'text-cordel-wood border-b-4 border-cordel-wood bg-white' : 'text-cordel-master-dark/50 hover:text-cordel-wood/70'}`}>
          <span>💃</span><span>{t('agenda.danceTrackTitle') || 'Danse'}</span>
          {eventChoreographies.length > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cordel-wood/10 text-cordel-wood font-black">{eventChoreographies.length}</span>}
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'filConducteur' && (
          <div className="animate-fadeIn">
            <div className="p-3 mb-4 rounded bg-[#fdfaf2] border border-dashed border-[var(--color-cordel-ocre,#c05621)]/50 text-[11px] font-bold text-encre-noire/80 italic flex items-start gap-2 shadow-xs">
              <span className="text-base shrink-0 select-none">🧭</span>
              <span className="leading-snug">{t('agenda.filConducteurNotice') || "Ce fil conducteur donne les intentions de travail de la séance. Il s'adapte en direct selon les forces en présence et les ajustements du moment."}</span>
            </div>

            {setlist.length === 0 && linkedSequencerRhythms.length === 0 ? (
              <p className="text-[11px] italic opacity-60 mb-4">{t('agenda.programEmpty') || "Le programme de cet événement n'a pas encore été défini."}</p>
            ) : (
              <div className="flex flex-col gap-2.5 mb-4">
                {setlist.map((morceau, index) => {
                  const resolved = resolvePieceLiveTechnicalData(morceau, resolutionDicts) || morceau;
                  const matchedRepPiece = repertoirePieces.find((rp) => rp.id === (morceau.pieceId || morceau.id) || (rp.titre && morceau.titre && rp.titre.toLowerCase() === morceau.titre.toLowerCase()));
                  const pieceTrainings = resolvePieceTrainings({ ...(matchedRepPiece || {}), ...resolved, ...morceau, notes: morceau.notes }, effectiveTrainingsList);
                  return (
                    <EventRevisionSetlistItem
                      key={morceau.id || morceau.pieceId || `piece_${index}`}
                      morceau={morceau} resolved={resolved} pieceTrainings={pieceTrainings}
                      TrainingCardComponent={TrainingCompactCard} trainingMode="rehearsal"
                      openSequencer={openSequencerWithCrossApp} onOpenDancador={launchDancador}
                      isEventDanse={isEventDanse} isAuthorized={isAuthorized} updatingSetlist={updatingSetlist}
                      handleRemoveMorceau={handleRemoveMorceau} assocSequenceurUrl={assocSequenceurUrl} groupId={groupId}
                      toadasMap={toadasMap} cultureMap={cultureMap} signalsMap={signalsMap}
                      onWatchVideo={setActiveVideoToWatch} onZoomSignal={setActiveSignalToZoom}
                      onViewToada={setActiveToadaToView} onViewCulture={setActiveCultureToView}
                    />
                  );
                })}
                <EventRevisionFilConducteurFooter
                  linkedSequencerRhythms={linkedSequencerRhythms} assocSequenceurUrl={assocSequenceurUrl}
                  isEventDanse={isEventDanse} isAuthorized={isAuthorized} updatingSetlist={updatingSetlist}
                  loadingRepertoire={loadingRepertoire} activeRepertoirePieces={activeRepertoirePieces}
                  newMorceauTitre={newMorceauTitre} setNewMorceauTitre={setNewMorceauTitre}
                  newMorceauNotes={newMorceauNotes} setNewMorceauNotes={setNewMorceauNotes}
                  handleAddMorceau={handleAddMorceau} handleAddRepertoirePiece={handleAddRepertoirePiece}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'danse' && (
          <EventRevisionDanceTab
            loadingChoreos={loadingChoreos} loadingSteps={loadingSteps}
            eventChoreographies={eventChoreographies} allChoreographies={allChoreographies}
            allSteps={allSteps} dancadorChoreoIds={dancadorChoreoIds} repertoirePieces={repertoirePieces}
            isAuthorized={isAuthorized} updatingSetlist={updatingSetlist}
            handleAddDancadorChoreo={handleAddDancadorChoreo} handleRemoveDancadorChoreo={handleRemoveDancadorChoreo}
            assocSequenceurUrl={assocSequenceurUrl} groupId={groupId} onOpenDancador={launchDancador}
          />
        )}
      </div>

      <RepertoireVideoModal isOpen={Boolean(activeVideoToWatch)} onClose={() => setActiveVideoToWatch(null)} video={activeVideoToWatch} />
      <SignalZoomModal isOpen={Boolean(activeSignalToZoom)} onClose={() => setActiveSignalToZoom(null)} signal={activeSignalToZoom} />
      {activeToadaToView && <PieceLyricsModal isOpen={Boolean(activeToadaToView)} onClose={() => setActiveToadaToView(null)} song={activeToadaToView} groupId={groupId} />}
      {activeCultureToView && <PieceCultureModal isOpen={Boolean(activeCultureToView)} onClose={() => setActiveCultureToView(null)} cultureDocs={[activeCultureToView]} initialDocId={activeCultureToView?.id} />}
    </CordelCard>
  );
}
