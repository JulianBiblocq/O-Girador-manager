import React from 'react';
import CordelCard from '../../CordelCard';
import EventRSVPSection from '../EventRSVPSection';

/**
 * Onglet 1 : Mon RSVP & Consignes (TabRsvp)
 * Présente le vote individuel de présence du membre, le choix d'instrument, la gestion de sa famille,
 * ainsi que les consignes pratiques et la description de l'événement.
 *
 * @param {Object} props Propriétés du composant
 */
export default function TabRsvp({
  event,
  user,
  profileData,
  status,
  saving,
  isPrestationRestricted,
  isMusicLevelRestricted,
  isDanceLevelRestricted,
  existingResponse,
  instrumentChoisi,
  setInstrumentChoisi,
  isInstrumentLocked,
  transport,
  demandeRemboursementKm,
  handleStatusChange,
  handleSave,
  getMemberInstrumentOptions,
  getPupitreName,
  presentsByInstrument,
  allUsers,
  isAuthorized,
  handleValidatePending,
  handleUpdateMemberInstrument,
  isManualRegisterOpen,
  setIsManualRegisterOpen,
  unregisteredUsers,
  selectedManualUserId,
  setSelectedManualUserId,
  selectedManualInstrument,
  setSelectedManualInstrument,
  savingManualRegistration,
  handleManualRegister,
  handleManualUnregister,
  isRegistrationDeadlinePassed,
  t,
  currentConfig,
  handleAddInviteExterne,
  handleRemoveInviteExterne,
  instrumentsDisponibles,
  besoinTransportInstrument,
  setBesoinTransportInstrument,
  dependents,
  familyMembers,
  familyResponses,
  handleToggleFamilyMemberSelection,
  handleFamilyMemberStatusChange,
  handleFamilyMemberInstrumentChange,
  handleFamilySave,
  handleAddToGoogleCalendar,
  handleDownloadIcs
}) {
  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. Vote Individuel de Présence & Inscription */}
      {currentConfig?.agendaEnableInscriptions !== false && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2 mb-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🎟️</span>
              <span>Votre présence & Inscription</span>
            </h4>
            {existingResponse && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                existingResponse.status === 'present'
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : existingResponse.status === 'absent'
                  ? 'bg-red-100 border-red-400 text-red-800'
                  : 'bg-amber-100 border-amber-400 text-amber-800'
              }`}>
                {existingResponse.status === 'present' ? '✅ Présent' : existingResponse.status === 'absent' ? '❌ Absent' : '⏳ À confirmer'}
              </span>
            )}
          </div>

          <EventRSVPSection
            event={event}
            user={user}
            profileData={profileData}
            status={status}
            saving={saving}
            isPrestationRestricted={isPrestationRestricted}
            isMusicLevelRestricted={isMusicLevelRestricted}
            isDanceLevelRestricted={isDanceLevelRestricted}
            existingResponse={existingResponse}
            instrumentChoisi={instrumentChoisi}
            setInstrumentChoisi={setInstrumentChoisi}
            isInstrumentLocked={isInstrumentLocked}
            transport={transport}
            demandeRemboursementKm={demandeRemboursementKm}
            handleStatusChange={handleStatusChange}
            handleSave={handleSave}
            getMemberInstrumentOptions={getMemberInstrumentOptions}
            getPupitreName={getPupitreName}
            presentsByInstrument={presentsByInstrument}
            allUsers={allUsers}
            isAuthorized={isAuthorized}
            handleValidatePending={handleValidatePending}
            handleUpdateMemberInstrument={handleUpdateMemberInstrument}
            isManualRegisterOpen={isManualRegisterOpen}
            setIsManualRegisterOpen={setIsManualRegisterOpen}
            unregisteredUsers={unregisteredUsers}
            selectedManualUserId={selectedManualUserId}
            setSelectedManualUserId={setSelectedManualUserId}
            selectedManualInstrument={selectedManualInstrument}
            setSelectedManualInstrument={setSelectedManualInstrument}
            savingManualRegistration={savingManualRegistration}
            handleManualRegister={handleManualRegister}
            handleManualUnregister={handleManualUnregister}
            isRegistrationDeadlinePassed={isRegistrationDeadlinePassed}
            t={t}
            agendaRequireInstrument={currentConfig?.agendaRequireInstrument}
            agendaEnableMaybeStatus={currentConfig?.agendaEnableMaybeStatus}
            handleAddInviteExterne={handleAddInviteExterne}
            handleRemoveInviteExterne={handleRemoveInviteExterne}
            instrumentsDisponibles={instrumentsDisponibles}
            besoinTransportInstrument={besoinTransportInstrument}
            setBesoinTransportInstrument={setBesoinTransportInstrument}
            enableCarpool={event.enableCarpool !== false}
            dependents={dependents}
            familyMembers={familyMembers}
            familyResponses={familyResponses}
            handleToggleFamilyMemberSelection={handleToggleFamilyMemberSelection}
            handleFamilyMemberStatusChange={handleFamilyMemberStatusChange}
            handleFamilyMemberInstrumentChange={handleFamilyMemberInstrumentChange}
            handleFamilySave={handleFamilySave}
            handleAddToGoogleCalendar={handleAddToGoogleCalendar}
            handleDownloadIcs={handleDownloadIcs}
            mode="rsvp"
          />
        </CordelCard>
      )}

      {/* 2. Consignes & Description de l'organisateur */}
      {event.description && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-2.5 flex items-center gap-1.5">
            <span>📝</span>
            <span>Consignes & Informations pratiques</span>
          </h4>
          <div className="whitespace-pre-line text-xs font-medium text-encre-noire/90 leading-relaxed bg-cordel-bg-light/60 p-3 rounded-[6px] border border-dashed border-cordel-master-dark/15">
            {event.description}
          </div>
        </CordelCard>
      )}
    </div>
  );
}
