import React from 'react';
import CordelCard from '../../CordelCard';
import EventRevisionProgram from '../EventRevisionProgram';
import EventStageLayoutSection from '../EventStageLayoutSection';
import EventVolunteerSection from '../EventVolunteerSection';
import EventWorkshopProgram from '../EventWorkshopProgram';

/**
 * Onglet 3 : Artistique, Scène & Ateliers (TabProgram)
 * Regroupe le programme de révision/morceaux liés au Séquenceur, le plan de scène scénographique,
 * les postes et créneaux bénévoles, ainsi que le programme de fabrication/lutherie.
 *
 * @param {Object} props Propriétés du composant
 */
export default function TabProgram({
  event,
  activeEvent,
  user,
  profileData,
  isAuthorized,
  currentConfig,
  allUsers,
  t,
  // Props Révision & Morceaux
  setlist,
  updatingSetlist,
  handleRemoveMorceau,
  assocSequenceurUrl,
  handleAddMorceau,
  newMorceauTitre,
  setNewMorceauTitre,
  selectedCatalogRhythmUrl,
  setSelectedCatalogRhythmUrl,
  fileInputKey,
  setNewMorceauJsonFile,
  newMorceauNotes,
  setNewMorceauNotes,
  dancadorChoreoIds,
  handleAddDancadorChoreo,
  handleRemoveDancadorChoreo,
  // Props Plan de scène
  onGoToStageLayoutEditor
}) {
  const showWorkshop = (event.type === 'atelier' || event.type === 'stage') && event.specialiteAtelier === 'fabrication';
  const showRevision = (event.includesPercussion !== false || (setlist && setlist.length > 0) || (event.linkedPatterns && event.linkedPatterns.length > 0)) && currentConfig?.agendaEnableRevisionProgram !== false;
  const showStageLayout = currentConfig?.agendaEnableStageLayout !== false && (event.isStageLayoutPublished || isAuthorized);
  const showVolunteers = currentConfig?.agendaEnableVolunteerShifts !== false && event.volunteerShifts && event.volunteerShifts.length > 0;

  const hasAnyContent = showWorkshop || showRevision || showStageLayout || showVolunteers;

  if (!hasAnyContent) {
    return (
      <CordelCard variant="default" useExtremeBorder={true} className="py-8 px-5 text-center">
        <span className="text-3xl block mb-2 opacity-50">🎵</span>
        <h4 className="font-bold text-sm text-cordel-wood mb-1">
          Aucun programme scénique ou atelier configuré
        </h4>
        <p className="text-xs text-encre-noire/70 max-w-md mx-auto">
          Cet événement ne comporte pas de morceaux à réviser, de plan de scène ou de créneaux bénévoles requis.
        </p>
      </CordelCard>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. Programme de Fabrication & Lutherie (Ateliers / Stages) */}
      {showWorkshop && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>🛠️</span>
            <span>Programme de Fabrication & Lutherie</span>
          </h4>
          <EventWorkshopProgram
            event={activeEvent || event}
            isAuthorized={isAuthorized}
            profileData={profileData}
          />
        </CordelCard>
      )}

      {/* 2. Fil conducteur de la séance (Morceaux, Intentions & Séquenceur) */}
      {showRevision && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>🧭</span>
            <span>Fil conducteur</span>
          </h4>
          <EventRevisionProgram
            setlist={setlist}
            isAuthorized={isAuthorized}
            updatingSetlist={updatingSetlist}
            handleRemoveMorceau={handleRemoveMorceau}
            assocSequenceurUrl={assocSequenceurUrl}
            handleAddMorceau={handleAddMorceau}
            newMorceauTitre={newMorceauTitre}
            setNewMorceauTitre={setNewMorceauTitre}
            selectedCatalogRhythmUrl={selectedCatalogRhythmUrl}
            setSelectedCatalogRhythmUrl={setSelectedCatalogRhythmUrl}
            fileInputKey={fileInputKey}
            setNewMorceauJsonFile={setNewMorceauJsonFile}
            newMorceauNotes={newMorceauNotes}
            setNewMorceauNotes={setNewMorceauNotes}
            groupId={event?.groupId}
            dancadorChoreoIds={dancadorChoreoIds}
            handleAddDancadorChoreo={handleAddDancadorChoreo}
            handleRemoveDancadorChoreo={handleRemoveDancadorChoreo}
            linkedPatterns={event.linkedPatterns || []}
          />
        </CordelCard>
      )}

      {/* 3. Plan de Scène & Placement */}
      {showStageLayout && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🎪</span>
              <span>Plan de scène & Disposition</span>
            </h4>
            {!event.isStageLayoutPublished && isAuthorized && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 border border-amber-400 text-amber-900 rounded">
                Brouillon Mestre
              </span>
            )}
          </div>
          <EventStageLayoutSection
            event={event}
            user={user}
            profileData={profileData}
            allUsers={allUsers}
            isAuthorized={isAuthorized}
            t={t}
            readOnly={true}
            onGoToStageLayoutEditor={onGoToStageLayoutEditor}
          />
        </CordelCard>
      )}

      {/* 4. Missions & Créneaux Bénévoles */}
      {showVolunteers && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>🙋</span>
            <span>Missions bénévoles & Créneaux requis</span>
          </h4>
          <EventVolunteerSection
            event={event}
            user={user}
            allUsers={allUsers}
            t={t}
          />
        </CordelCard>
      )}
    </div>
  );
}
