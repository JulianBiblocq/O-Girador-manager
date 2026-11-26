import React, { useMemo } from 'react';
import VolunteerGuestModal from './VolunteerGuestModal';
import VolunteerShiftAssignModal from './VolunteerShiftAssignModal';
import VolunteerExternalManualModal from './VolunteerExternalManualModal';
import VolunteerExternalDetailsModal from './VolunteerExternalDetailsModal';
import VolunteerExternalDispatchModal from './VolunteerExternalDispatchModal';
import EventVolunteerShareModal from './EventVolunteerShareModal';
import VolunteerSlotQuickAssignModal from './VolunteerSlotQuickAssignModal';
import VolunteerParticipantQuickModal from './VolunteerParticipantQuickModal';

/**
 * Conteneur dédié aux modales d'interaction et de pilotage de l'onglet « 🤝 Bénévoles ».
 */
export default function VolunteerCoordinatorModals({
  event,
  commissions = [],
  allUsers = [],
  manageableShifts = [],
  shiftsById = {},
  pendingApplications = [],
  acceptedApplications = [],
  applicationsById = {},
  loadingShiftId = null,
  actionLoadingId = null,
  guestModalShift,
  setGuestModalShift,
  assignModalApp,
  setAssignModalApp,
  manualModalConfig,
  setManualModalConfig,
  detailsTarget,
  setDetailsTarget,
  participantModalTarget,
  setParticipantModalTarget,
  dispatchAppId,
  setDispatchAppId,
  isShareModalOpen,
  setIsShareModalOpen,
  quickAssignShift,
  setQuickAssignShift,
  addGuestToShift,
  addMemberByManager,
  acceptApplication,
  createManualExternalVolunteer,
  removeExternalFromShift,
  handleRemoveAnyInscrit,
  tr
}) {
  const manageableShiftIds = useMemo(() => new Set((manageableShifts || []).map((s) => s.id)), [manageableShifts]);

  const detailsApplications = useMemo(() => {
    if (!detailsTarget) return [];
    if (detailsTarget === 'all') return acceptedApplications;
    const found = applicationsById[detailsTarget.applicationId];
    return found ? [found] : [{ id: detailsTarget.applicationId || detailsTarget.id, prenom: detailsTarget.prenom, nom: detailsTarget.nom, lienAsso: detailsTarget.lienAsso, assignedShiftIds: [] }];
  }, [detailsTarget, acceptedApplications, applicationsById]);

  return (
    <>
      <VolunteerGuestModal shift={guestModalShift} isOpen={Boolean(guestModalShift)} saving={Boolean(guestModalShift && loadingShiftId === guestModalShift.id)} onClose={() => setGuestModalShift(null)} onSubmitGuest={addGuestToShift} tr={tr} />
      <VolunteerShiftAssignModal application={assignModalApp} manageableShifts={manageableShifts} saving={Boolean(assignModalApp && actionLoadingId === assignModalApp.id)} onClose={() => setAssignModalApp(null)} onConfirmAssign={acceptApplication} tr={tr} />
      <VolunteerExternalManualModal
        isOpen={Boolean(manualModalConfig)}
        initialShiftIds={manualModalConfig?.shiftId ? [manualModalConfig.shiftId] : []}
        event={event} manageableShifts={manageableShifts} saving={actionLoadingId === 'manual'}
        onClose={() => setManualModalConfig(null)} onSubmitExternal={createManualExternalVolunteer} tr={tr}
      />
      <VolunteerExternalDetailsModal
        isOpen={Boolean(detailsTarget)} applications={detailsApplications} shiftsById={shiftsById}
        manageableShiftIds={manageableShiftIds} actionLoadingId={actionLoadingId}
        onRemoveFromShift={removeExternalFromShift}
        onOpenDispatchForApp={(app) => { setDetailsTarget(null); setDispatchAppId(app.id); }}
        onClose={() => setDetailsTarget(null)} tr={tr}
      />
      <VolunteerParticipantQuickModal
        target={participantModalTarget} allUsers={allUsers}
        onRemove={handleRemoveAnyInscrit} onClose={() => setParticipantModalTarget(null)} tr={tr}
      />
      <VolunteerExternalDispatchModal
        isOpen={Boolean(dispatchAppId)} applications={acceptedApplications}
        initialAppId={dispatchAppId === 'all' ? null : dispatchAppId} event={event}
        shiftsById={shiftsById} commissions={commissions} allUsers={allUsers}
        onClose={() => setDispatchAppId(null)} tr={tr}
      />
      <EventVolunteerShareModal isOpen={isShareModalOpen} event={event} onClose={() => setIsShareModalOpen(false)} tr={tr} />
      <VolunteerSlotQuickAssignModal
        shift={quickAssignShift} pendingApplications={pendingApplications}
        acceptedApplications={acceptedApplications} allUsers={allUsers}
        saving={Boolean(actionLoadingId || loadingShiftId)}
        onAssignApplicationToShift={acceptApplication} onAddMemberByManager={addMemberByManager}
        onOpenManualExternalForShift={(sh) => setManualModalConfig({ shiftId: sh.id })}
        onOpenGuestForShift={(sh) => setGuestModalShift(sh)}
        onClose={() => setQuickAssignShift(null)} tr={tr}
      />
    </>
  );
}
