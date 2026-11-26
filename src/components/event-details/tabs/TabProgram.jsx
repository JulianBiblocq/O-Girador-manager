import React from 'react';
import CordelCard from '../../CordelCard';
import EventRevisionProgram from '../EventRevisionProgram';
import EventStageLayoutSection from '../EventStageLayoutSection';
import EventWorkshopProgram from '../EventWorkshopProgram';

/**
 * Onglet Artistique, Scène & Ateliers (TabProgram)
 * 100 % dédié au programme de révision lié au Sequenciador, au plan de scène
 * et au programme de fabrication / lutherie (sans section Bénévoles, désormais dans TabVolunteers).
 */
export default function TabProgram({
  event, activeEvent, user, profileData, groupId, isAuthorized, currentConfig, allUsers, t,
  setlist, updatingSetlist, handleRemoveMorceau, assocSequenceurUrl,
  handleAddMorceau, handleAddRepertoirePiece, newMorceauTitre, setNewMorceauTitre,
  selectedCatalogRhythmUrl, setSelectedCatalogRhythmUrl, fileInputKey,
  setNewMorceauJsonFile, newMorceauNotes, setNewMorceauNotes,
  dancadorChoreoIds, handleAddDancadorChoreo, handleRemoveDancadorChoreo,
  onGoToStageLayoutEditor
}) {
  const targetEvent = activeEvent || event;
  const effectiveGroupId = groupId || targetEvent?.groupId || profileData?.groupId || user?.groupId || '';

  const showWorkshop = (event.type === 'atelier' || event.type === 'stage') && event.specialiteAtelier === 'fabrication';
  const showRevision = (event.includesPercussion !== false || (setlist && setlist.length > 0) || (event.linkedPatterns && event.linkedPatterns.length > 0)) && currentConfig?.agendaEnableRevisionProgram !== false;
  const showStageLayout = currentConfig?.agendaEnableStageLayout !== false && (event.isStageLayoutPublished || isAuthorized);

  if (!showWorkshop && !showRevision && !showStageLayout) {
    return (
      <CordelCard variant="default" useExtremeBorder={true} className="py-8 px-5 text-center">
        <span className="text-3xl block mb-2 opacity-50">🎵</span>
        <h4 className="font-bold text-sm text-cordel-wood mb-1">
          {t ? (t('agenda.noStageProgramTitle') || 'Aucun programme scénique ou atelier configuré') : 'Aucun programme scénique ou atelier configuré'}
        </h4>
        <p className="text-xs text-encre-noire/70 max-w-md mx-auto">
          {t ? (t('agenda.noStageProgramDesc') || 'Cet événement ne comporte pas de morceaux à réviser, de plan de scène ou de programme de fabrication.') : 'Cet événement ne comporte pas de morceaux à réviser, de plan de scène ou de programme de fabrication.'}
        </p>
      </CordelCard>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      {showWorkshop && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>🛠️</span><span>Programme de Fabrication &amp; Lutherie</span>
          </h4>
          <EventWorkshopProgram event={targetEvent} isAuthorized={isAuthorized} profileData={profileData} />
        </CordelCard>
      )}

      {showRevision && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>🧭</span><span>Fil conducteur</span>
          </h4>
          <EventRevisionProgram
            event={targetEvent} setlist={setlist} isAuthorized={isAuthorized}
            updatingSetlist={updatingSetlist} handleRemoveMorceau={handleRemoveMorceau}
            assocSequenceurUrl={assocSequenceurUrl} handleAddMorceau={handleAddMorceau}
            handleAddRepertoirePiece={handleAddRepertoirePiece}
            newMorceauTitre={newMorceauTitre} setNewMorceauTitre={setNewMorceauTitre}
            selectedCatalogRhythmUrl={selectedCatalogRhythmUrl} setSelectedCatalogRhythmUrl={setSelectedCatalogRhythmUrl}
            fileInputKey={fileInputKey} setNewMorceauJsonFile={setNewMorceauJsonFile}
            newMorceauNotes={newMorceauNotes} setNewMorceauNotes={setNewMorceauNotes}
            groupId={effectiveGroupId} dancadorChoreoIds={dancadorChoreoIds}
            handleAddDancadorChoreo={handleAddDancadorChoreo} handleRemoveDancadorChoreo={handleRemoveDancadorChoreo}
            linkedPatterns={event.linkedPatterns || []}
          />
        </CordelCard>
      )}

      {showStageLayout && (
        <CordelCard id="event-stage-layout" variant="default" useExtremeBorder={true} className="py-4 px-5">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🎪</span><span>{t ? (t('agenda.stagePlanAndLayout') || 'Plan de scène & Disposition') : 'Plan de scène & Disposition'}</span>
            </h4>
            {!event.isStageLayoutPublished && isAuthorized && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[var(--cordel-bg)] border border-[var(--color-cordel-ocre)] text-[var(--color-cordel-ocre)] rounded">
                Brouillon Mestre
              </span>
            )}
          </div>
          <EventStageLayoutSection
            event={event} user={user} profileData={profileData} allUsers={allUsers}
            isAuthorized={isAuthorized} t={t} readOnly={true} onGoToStageLayoutEditor={onGoToStageLayoutEditor}
          />
        </CordelCard>
      )}
    </div>
  );
}
