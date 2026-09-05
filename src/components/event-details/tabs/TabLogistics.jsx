import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import CordelCard from '../../CordelCard';
import EventCarpoolSection from '../EventCarpoolSection';
import EventRSVPSection from '../EventRSVPSection';

/**
 * Onglet 2 : Convoi, Véhicules & Présences (TabLogistics)
 * Regroupe la gestion complète du covoiturage (convois, chauffeurs, jauge, passagers, places externes)
 * et le tableau nominatif d'émargement et de présence par pupitre avec les invités extérieurs.
 *
 * @param {Object} props Propriétés du composant
 */
export default function TabLogistics({
  event,
  user,
  profileData,
  isAuthorized,
  currentConfig,
  // Props Covoiturage
  enableCarpoolReimbursement,
  indemniteKilometrique,
  convoiDrivers,
  individualDrivers,
  submittingCovoit,
  joiningVoitureId,
  setJoiningVoitureId,
  joinForm,
  setJoinForm,
  demandeRemboursementKm,
  handleToggleRemboursement,
  handleRetirerVoiture,
  handleQuitterVoiture,
  handleConfirmJoin,
  handleChercherPlace,
  handleAnnulerCherchePlace,
  showProposerForm,
  setShowProposerForm,
  voitureForm,
  setVoitureForm,
  handleProposerVoiture,
  reimbursementRule,
  handleAssignPassenger,
  handleRemovePassenger,
  // Props Tableau de présence (mode attendance)
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
  handleStatusChange,
  handleSave,
  getMemberInstrumentOptions,
  getPupitreName,
  presentsByInstrument,
  allUsers,
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
  const [activatingCarpool, setActivatingCarpool] = useState(false);

  const handleEnableCarpool = async () => {
    if (!event.id || activatingCarpool) return;
    setActivatingCarpool(true);
    try {
      const evRef = doc(db, 'events', event.id);
      await updateDoc(evRef, { enableCarpool: true });
    } catch (err) {
      console.error("Erreur lors de l'activation du covoiturage :", err);
    } finally {
      setActivatingCarpool(false);
    }
  };

  const presentsCount = ((event.inscriptions || []).filter(ins => ins.status === 'present').length) + ((event.invitesExternes || []).length);
  const voituresCount = (event.covoiturage?.voitures || []).length;

  return (
    <div className="flex flex-col gap-4 text-left">
            {/* 1. Module de Covoiturage & Logistique Convoi */}
      {currentConfig?.agendaEnableCarpool && event.enableCarpool !== false ? (
        <div>
          <EventCarpoolSection
            event={event}
            user={user}
            profileData={profileData}
            isAuthorized={isAuthorized}
            enableCarpoolReimbursement={enableCarpoolReimbursement}
            indemniteKilometrique={indemniteKilometrique}
            convoiDrivers={convoiDrivers}
            individualDrivers={individualDrivers}
            submittingCovoit={submittingCovoit}
            joiningVoitureId={joiningVoitureId}
            setJoiningVoitureId={setJoiningVoitureId}
            joinForm={joinForm}
            setJoinForm={setJoinForm}
            demandeRemboursementKm={demandeRemboursementKm}
            handleToggleRemboursement={handleToggleRemboursement}
            handleRetirerVoiture={handleRetirerVoiture}
            handleQuitterVoiture={handleQuitterVoiture}
            handleConfirmJoin={handleConfirmJoin}
            handleChercherPlace={handleChercherPlace}
            handleAnnulerCherchePlace={handleAnnulerCherchePlace}
            showProposerForm={showProposerForm}
            setShowProposerForm={setShowProposerForm}
            voitureForm={voitureForm}
            setVoitureForm={setVoitureForm}
            handleProposerVoiture={handleProposerVoiture}
            reimbursementRule={reimbursementRule}
            handleAssignPassenger={handleAssignPassenger}
            handleRemovePassenger={handleRemovePassenger}
          />
        </div>
      ) : currentConfig?.agendaEnableCarpool && (
        <CordelCard variant="default" useExtremeBorder={false} className="py-4 px-5 text-center flex flex-col items-center gap-2">
          <span className="text-2xl">🚗</span>
          <p className="text-xs font-semibold text-stone-600">
            Le covoiturage n'est pas activé pour cet événement.
          </p>
          {isAuthorized && (
            <button
              type="button"
              onClick={handleEnableCarpool}
              disabled={activatingCarpool}
              className="mt-1 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
            >
              {activatingCarpool ? "Activation..." : "＋ Activer le covoiturage pour cet événement"}
            </button>
          )}
        </CordelCard>
      )}

      {/* 2. Tableau Nominatif des Présences par Pupitre & Invités Externes */}
      {currentConfig?.agendaEnableInscriptions !== false && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2 mb-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>👥</span>
              <span>Tableau de présence ({presentsCount} inscrit{presentsCount > 1 ? 's' : ''})</span>
            </h4>
            <span className="text-[10px] font-semibold text-encre-noire/70">
              Répartition par pupitres & invités
            </span>
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
            mode="attendance"
          />
        </CordelCard>
      )}
    </div>
  );
}
