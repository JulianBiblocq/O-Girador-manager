import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import { downloadVolunteersAndLogisticsCSV } from '../../utils/volunteerCsvExportUtils';
import { useTranslation } from '../LanguageContext';
import { useVolunteerShifts } from '../../hooks/useVolunteerShifts';
import { useVolunteerApplications } from '../../hooks/useVolunteerApplications';
import VolunteerShiftCard from './volunteers/VolunteerShiftCard';
import VolunteerGuestModal from './volunteers/VolunteerGuestModal';
import VolunteerPersonalMemoBanner from './volunteers/VolunteerPersonalMemoBanner';
import VolunteerApplicationsInbox from './volunteers/VolunteerApplicationsInbox';
import VolunteerShiftAssignModal from './volunteers/VolunteerShiftAssignModal';
import VolunteerExternalManualModal from './volunteers/VolunteerExternalManualModal';
import VolunteerExternalDetailsModal from './volunteers/VolunteerExternalDetailsModal';
import VolunteerExternalDispatchModal from './volunteers/VolunteerExternalDispatchModal';
import EventVolunteerShareModal from './volunteers/EventVolunteerShareModal';

/**
 * Section consolidée des créneaux bénévoles d'un événement : mémo Jour J membre,
 * sas de validation externe, envoi des mémos/remerciements, export CSV et partage QR.
 */
export default function EventVolunteerSection({ event, user, profileData = null, allUsers = [], isAuthorized = false, t }) {
  const { t: contextT } = useTranslation();
  const tr = typeof t === 'function' ? t : contextT;
  const [guestModalShift, setGuestModalShift] = useState(null);
  const [assignModalApp, setAssignModalApp] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [dispatchAppId, setDispatchAppId] = useState(null);

  const {
    commissions, consolidatedShifts, filteredShifts, coverage, isArtisticPresent,
    activeFilter, setActiveFilter, loadingShiftId, canManageShift,
    toggleSelfShift, addGuestToShift, addMemberByManager, removeInscrit
  } = useVolunteerShifts({ event, user, profileData, allUsers, isAuthorized });

  const {
    canViewApplications, actionLoadingId, pendingApplications, acceptedApplications,
    applicationsById, manageableShifts, acceptApplication, rejectApplication,
    createManualExternalVolunteer, removeExternalFromShift
  } = useVolunteerApplications({ event, commissions, consolidatedShifts, user, profileData, isAuthorized });

  const shiftsById = useMemo(() => Object.fromEntries(consolidatedShifts.map((s) => [s.id, s])), [consolidatedShifts]);
  const manageableShiftIds = useMemo(() => new Set(manageableShifts.map((s) => s.id)), [manageableShifts]);
  const isPublicCallEnabled = Boolean(event?.publicVolunteerConfig?.enabled);

  const commissionFilters = useMemo(() => {
    const map = new Map();
    (commissions || []).forEach((c) => { if (c?.id) map.set(c.id, { id: c.id, label: `${c.icone || '📋'} ${c.titre || 'Commission'}` }); });
    consolidatedShifts.forEach((s) => { if (s.commissionId && !map.has(s.commissionId)) map.set(s.commissionId, { id: s.commissionId, label: `📋 ${s.commissionTitre || 'Commission'}` }); });
    return Array.from(map.values()).filter((cf) => consolidatedShifts.some((s) => s.commissionId === cf.id));
  }, [commissions, consolidatedShifts]);

  const detailsApplications = useMemo(() => {
    if (!detailsTarget) return [];
    if (detailsTarget === 'all') return acceptedApplications;
    const found = applicationsById[detailsTarget.applicationId];
    return found ? [found] : [{ id: detailsTarget.applicationId || detailsTarget.id, prenom: detailsTarget.prenom, nom: detailsTarget.nom, lienAsso: detailsTarget.lienAsso, assignedShiftIds: [] }];
  }, [detailsTarget, acceptedApplications, applicationsById]);

  if (consolidatedShifts.length === 0 && !isPublicCallEnabled && (!canViewApplications || pendingApplications.length === 0)) {
    return <div className="text-center py-4 text-xs italic opacity-60">{tr('agenda.noVolunteersNeeded') || 'Aucun créneau bénévole requis pour cet événement.'}</div>;
  }

  const handleRemoveAnyInscrit = (sh, ins) => (ins?.type === 'external' ? removeExternalFromShift(sh.id, ins) : removeInscrit(sh, ins));
  const handleExportCsv = () => downloadVolunteersAndLogisticsCSV({ event, consolidatedShifts, acceptedApplications, allUsers });
  const hasCommissionTabs = commissionFilters.length > 0;

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <div className="text-left w-full flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-dashed border-[var(--theme-border)]/20 pb-2 flex-wrap">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-[var(--cordel-wood)] flex items-center gap-1.5">
            🤝 {tr('agenda.volunteerSlotsTitle') || 'Créneaux Bénévoles'}
          </h4>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isPublicCallEnabled && (
              <button type="button" onClick={() => setIsShareModalOpen(true)} className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--cordel-bg)] hover:bg-[var(--theme-hover-bg)] cursor-pointer">
                🔗 {tr('agenda.volunteerShareCallBtn') || "Partager l'appel / QR Code"}
              </button>
            )}
            {coverage.totalRequired > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-[var(--theme-border)] text-white ${coverage.isComplete ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'}`}>
                {coverage.filledPosts} / {coverage.totalRequired} {tr('agenda.volunteerPostsFilled') || 'postes pourvus'}
              </span>
            )}
          </div>
        </div>

        <VolunteerPersonalMemoBanner consolidatedShifts={consolidatedShifts} currentUserUid={user?.uid} event={event} commissions={commissions} allUsers={allUsers} tr={tr} />

        {canViewApplications && (
          <VolunteerApplicationsInbox
            pendingApplications={pendingApplications} acceptedCount={acceptedApplications.length} hasAnyVolunteer={coverage.totalInscrits > 0}
            shiftsById={shiftsById} manageableShifts={manageableShifts} actionLoadingId={actionLoadingId}
            onQuickValidate={acceptApplication} onOpenAssign={setAssignModalApp} onReject={rejectApplication}
            onOpenManualModal={() => setIsManualModalOpen(true)} onOpenAcceptedSummary={() => setDetailsTarget('all')}
            onOpenDispatchModal={() => setDispatchAppId(acceptedApplications[0]?.id || 'all')} onExportCsv={handleExportCsv} tr={tr}
          />
        )}

        {hasCommissionTabs && (
          <div className="flex flex-wrap items-center gap-1.5">
            {[{ id: 'all', label: tr('agenda.volunteerFilterAll') || 'Tous' }, { id: 'general', label: tr('agenda.volunteerGeneralShort') || 'Général' }, ...commissionFilters].map((pill) => (
              <button key={pill.id} type="button" onClick={() => setActiveFilter(pill.id)} className={`px-2.5 py-1 rounded-full text-[10px] font-black border cursor-pointer transition-colors ${activeFilter === pill.id ? 'bg-[var(--cordel-wood)] text-white border-[var(--theme-border)]' : 'bg-[var(--cordel-bg)] border-[var(--theme-border)]/30 hover:bg-[var(--theme-hover-bg)]'}`}>{pill.label}</button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredShifts.map((shift) => (
            <VolunteerShiftCard
              key={shift.id} shift={shift} event={event} currentUserUid={user?.uid} allUsers={allUsers}
              isArtisticPresent={isArtisticPresent} canManage={canManageShift(shift)} showCommissionBadge={hasCommissionTabs}
              loading={loadingShiftId === shift.id || Boolean(actionLoadingId)} onToggleSelf={toggleSelfShift}
              onOpenGuestModal={setGuestModalShift} onInspectExternal={(ins) => setDetailsTarget(ins)}
              onRemoveInscrit={handleRemoveAnyInscrit} onAddMemberByManager={addMemberByManager} commissions={commissions} tr={tr}
            />
          ))}
        </div>
      </div>

      <VolunteerGuestModal shift={guestModalShift} isOpen={Boolean(guestModalShift)} saving={Boolean(guestModalShift && loadingShiftId === guestModalShift.id)} onClose={() => setGuestModalShift(null)} onSubmitGuest={addGuestToShift} tr={tr} />
      <VolunteerShiftAssignModal application={assignModalApp} manageableShifts={manageableShifts} saving={Boolean(assignModalApp && actionLoadingId === assignModalApp.id)} onClose={() => setAssignModalApp(null)} onConfirmAssign={acceptApplication} tr={tr} />
      <VolunteerExternalManualModal isOpen={isManualModalOpen} event={event} manageableShifts={manageableShifts} saving={actionLoadingId === 'manual'} onClose={() => setIsManualModalOpen(false)} onSubmitExternal={createManualExternalVolunteer} tr={tr} />
      <VolunteerExternalDetailsModal isOpen={Boolean(detailsTarget)} applications={detailsApplications} shiftsById={shiftsById} manageableShiftIds={manageableShiftIds} actionLoadingId={actionLoadingId} onRemoveFromShift={removeExternalFromShift} onOpenDispatchForApp={(app) => { setDetailsTarget(null); setDispatchAppId(app.id); }} onClose={() => setDetailsTarget(null)} tr={tr} />
      <VolunteerExternalDispatchModal isOpen={Boolean(dispatchAppId)} applications={acceptedApplications} initialAppId={dispatchAppId === 'all' ? null : dispatchAppId} event={event} shiftsById={shiftsById} commissions={commissions} allUsers={allUsers} onClose={() => setDispatchAppId(null)} tr={tr} />
      <EventVolunteerShareModal isOpen={isShareModalOpen} event={event} onClose={() => setIsShareModalOpen(false)} tr={tr} />
    </CordelCard>
  );
}
