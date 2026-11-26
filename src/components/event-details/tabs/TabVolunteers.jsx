import React, { useState, useEffect, useMemo } from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../LanguageContext';
import { useVolunteerShifts } from '../../../hooks/useVolunteerShifts';
import { useVolunteerApplications } from '../../../hooks/useVolunteerApplications';
import { downloadVolunteersAndLogisticsCSV } from '../../../utils/volunteerCsvExportUtils';
import VolunteerPersonalMemoBanner from '../volunteers/VolunteerPersonalMemoBanner';
import VolunteerKeyContactsCard from '../volunteers/VolunteerKeyContactsCard';
import VolunteerQuickShiftCreator from '../volunteers/VolunteerQuickShiftCreator';
import VolunteerShiftCard from '../volunteers/VolunteerShiftCard';
import VolunteerSynopticTable from '../volunteers/VolunteerSynopticTable';
import VolunteerApplicationsPanel from '../volunteers/VolunteerApplicationsPanel';
import VolunteerDayOfOpsPanel from '../volunteers/VolunteerDayOfOpsPanel';
import VolunteerCoordinatorModals from '../volunteers/VolunteerCoordinatorModals';

/**
 * Onglet conditionnel « 🤝 Bénévoles » à 2 vitesses :
 * - Adhérent standard : Mémo Jour J personnel + Agenda, contact référent condensé et cartes d'inscription.
 * - Coordinateur (`isEventVolunteerCoordinator`) : 4 sous-vues (Cartes, Grand Tableau, Candidatures & Appel public, Accueil Jour J & Exports).
 */
export default function TabVolunteers({
  event, user, profileData = null, allUsers = [], isAuthorized = false,
  associationName = '', initialSubView = null, t
}) {
  const { t: contextT } = useTranslation();
  const tr = typeof t === 'function' ? t : contextT;
  const [subView, setSubView] = useState(initialSubView || 'cards');
  const [guestModalShift, setGuestModalShift] = useState(null);
  const [assignModalApp, setAssignModalApp] = useState(null);
  const [manualModalConfig, setManualModalConfig] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [participantModalTarget, setParticipantModalTarget] = useState(null);
  const [dispatchAppId, setDispatchAppId] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [quickAssignShift, setQuickAssignShift] = useState(null);

  const {
    isCoordinator, commissions, consolidatedShifts, filteredShifts, coverage, isArtisticPresent,
    activeFilter, setActiveFilter, loadingShiftId, canManageShift,
    toggleSelfShift, addGuestToShift, addMemberByManager, removeInscrit
  } = useVolunteerShifts({ event, user, profileData, allUsers, isAuthorized });

  const {
    actionLoadingId, pendingApplications, acceptedApplications, applicationsById, manageableShifts,
    acceptApplication, rejectApplication, createManualExternalVolunteer, removeExternalFromShift
  } = useVolunteerApplications({ event, commissions, consolidatedShifts, user, profileData, isAuthorized });

  useEffect(() => {
    if (initialSubView && isCoordinator) setSubView(initialSubView);
  }, [initialSubView, isCoordinator]);

  const shiftsById = useMemo(() => Object.fromEntries(consolidatedShifts.map((s) => [s.id, s])), [consolidatedShifts]);
  const commissionFilters = useMemo(() => {
    const map = new Map();
    (commissions || []).forEach((c) => { if (c?.id) map.set(c.id, { id: c.id, label: `${c.icone || '📋'} ${c.titre || 'Commission'}` }); });
    consolidatedShifts.forEach((s) => { if (s.commissionId && !map.has(s.commissionId)) map.set(s.commissionId, { id: s.commissionId, label: `📋 ${s.commissionTitre || 'Commission'}` }); });
    return Array.from(map.values()).filter((cf) => consolidatedShifts.some((s) => s.commissionId === cf.id));
  }, [commissions, consolidatedShifts]);

  const handleRemoveAnyInscrit = (sh, ins) => (ins?.type === 'external' ? removeExternalFromShift(sh.id, ins) : removeInscrit(sh, ins));
  const handleInspectInscrit = (sh, ins) => (ins?.type === 'external' ? setDetailsTarget(ins) : setParticipantModalTarget({ shift: sh, inscrit: ins }));
  const handleExportCsv = () => downloadVolunteersAndLogisticsCSV({ event, consolidatedShifts, acceptedApplications, allUsers });

  const activeView = isCoordinator ? subView : 'cards';
  const navTabs = [
    { id: 'cards', label: `🙋 ${tr('agenda.volunteerSubTabCards') || 'Cartes & Inscription'}` },
    { id: 'synoptic', label: `📊 ${tr('agenda.volunteerSubTabSynoptic') || 'Grand Tableau'}` },
    { id: 'applications', label: `📥 ${tr('agenda.volunteerSubTabApplications') || 'Candidatures & Appel public'}`, badge: pendingApplications.length || null },
    { id: 'dayof', label: `🎪 ${tr('agenda.volunteerSubTabDayOf') || 'Accueil Jour J & Exports'}` }
  ];

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-4 sm:px-5">
      <div className="flex flex-col gap-3.5 text-left">
        {isCoordinator && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-dashed border-[var(--theme-border)]/25 pb-2.5">
            {navTabs.map((nt) => (
              <button key={nt.id} type="button" onClick={() => setSubView(nt.id)} className={`px-2.5 py-1.5 rounded text-[10.5px] font-black uppercase tracking-wide border cursor-pointer inline-flex items-center gap-1.5 ${activeView === nt.id ? 'bg-[var(--cordel-wood)] text-white border-[var(--theme-border)]' : 'bg-[var(--cordel-bg)] border-[var(--theme-border)]/30 hover:bg-[var(--theme-hover-bg)]'}`}>
                <span>{nt.label}</span>
                {nt.badge && <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-cordel-ocre)] text-white text-[9px] border border-[var(--theme-border)]">{nt.badge}</span>}
              </button>
            ))}
          </div>
        )}

        {activeView === 'cards' && (
          <div className="flex flex-col gap-3">
            <VolunteerPersonalMemoBanner consolidatedShifts={consolidatedShifts} currentUserUid={user?.uid} event={event} commissions={commissions} allUsers={allUsers} associationName={associationName} tr={tr} />
            <VolunteerKeyContactsCard event={event} commissions={commissions} allUsers={allUsers} compact={true} tr={tr} />
            <VolunteerQuickShiftCreator event={event} canManageEvents={isAuthorized} tr={tr} />

            {commissionFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {[{ id: 'all', label: tr('agenda.volunteerFilterAll') || 'Tous' }, { id: 'general', label: tr('agenda.volunteerGeneralShort') || 'Général' }, ...commissionFilters].map((pill) => (
                  <button key={pill.id} type="button" onClick={() => setActiveFilter(pill.id)} className={`px-2.5 py-1 rounded-full text-[10px] font-black border cursor-pointer ${activeFilter === pill.id ? 'bg-[var(--cordel-wood)] text-white border-[var(--theme-border)]' : 'bg-[var(--cordel-bg)] border-[var(--theme-border)]/30'}`}>{pill.label}</button>
                ))}
              </div>
            )}

            {filteredShifts.length === 0 ? (
              <p className="text-center py-5 text-xs italic opacity-65">{tr('agenda.noVolunteersNeeded') || 'Aucun créneau bénévole publié pour le moment.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredShifts.map((shift) => (
                  <VolunteerShiftCard key={shift.id} shift={shift} event={event} commissions={commissions} associationName={associationName} currentUserUid={user?.uid} allUsers={allUsers} isArtisticPresent={isArtisticPresent} canManage={canManageShift(shift)} showCommissionBadge={commissionFilters.length > 0} loading={loadingShiftId === shift.id || Boolean(actionLoadingId)} onToggleSelf={toggleSelfShift} onOpenGuestModal={setGuestModalShift} onInspectExternal={(ins) => setDetailsTarget(ins)} onRemoveInscrit={handleRemoveAnyInscrit} onAddMemberByManager={addMemberByManager} tr={tr} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'synoptic' && <VolunteerSynopticTable shifts={consolidatedShifts} commissions={commissions} pendingApplications={pendingApplications} acceptedApplications={acceptedApplications} event={event} canManageShift={canManageShift} onInspectInscrit={handleInspectInscrit} onRemoveInscrit={handleRemoveAnyInscrit} onOpenQuickAssign={setQuickAssignShift} tr={tr} />}
        {activeView === 'applications' && <VolunteerApplicationsPanel event={event} canManageEvents={isAuthorized} pendingApplications={pendingApplications} acceptedApplications={acceptedApplications} hasAnyVolunteer={coverage.totalInscrits > 0} shiftsById={shiftsById} manageableShifts={manageableShifts} actionLoadingId={actionLoadingId} onQuickValidate={acceptApplication} onOpenAssign={setAssignModalApp} onReject={rejectApplication} onOpenManualModal={() => setManualModalConfig({})} onOpenAcceptedSummary={() => setDetailsTarget('all')} onOpenDispatchModal={() => setDispatchAppId(acceptedApplications[0]?.id || 'all')} onExportCsv={handleExportCsv} onOpenShareModal={() => setIsShareModalOpen(true)} tr={tr} />}
        {activeView === 'dayof' && <VolunteerDayOfOpsPanel event={event} commissions={commissions} consolidatedShifts={consolidatedShifts} acceptedApplications={acceptedApplications} allUsers={allUsers} onOpenDispatchModal={() => setDispatchAppId(acceptedApplications[0]?.id || 'all')} onExportCsv={handleExportCsv} tr={tr} />}
      </div>

      <VolunteerCoordinatorModals event={event} commissions={commissions} allUsers={allUsers} manageableShifts={manageableShifts} shiftsById={shiftsById} pendingApplications={pendingApplications} acceptedApplications={acceptedApplications} applicationsById={applicationsById} loadingShiftId={loadingShiftId} actionLoadingId={actionLoadingId} guestModalShift={guestModalShift} setGuestModalShift={setGuestModalShift} assignModalApp={assignModalApp} setAssignModalApp={setAssignModalApp} manualModalConfig={manualModalConfig} setManualModalConfig={setManualModalConfig} detailsTarget={detailsTarget} setDetailsTarget={setDetailsTarget} participantModalTarget={participantModalTarget} setParticipantModalTarget={setParticipantModalTarget} dispatchAppId={dispatchAppId} setDispatchAppId={setDispatchAppId} isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen} quickAssignShift={quickAssignShift} setQuickAssignShift={setQuickAssignShift} addGuestToShift={addGuestToShift} addMemberByManager={addMemberByManager} acceptApplication={acceptApplication} createManualExternalVolunteer={createManualExternalVolunteer} removeExternalFromShift={removeExternalFromShift} handleRemoveAnyInscrit={handleRemoveAnyInscrit} tr={tr} />
    </CordelCard>
  );
}
