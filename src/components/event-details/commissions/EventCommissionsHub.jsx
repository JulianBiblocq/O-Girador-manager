import React, { useState, useMemo, useRef } from 'react';
import CommissionBarometer from './CommissionBarometer';
import CommissionCard from './CommissionCard';
import CommissionEditModal from './CommissionEditModal';
import CommissionHubHeader from './CommissionHubHeader';
import EventForumChannelLink from './EventForumChannelLink';
import { useEventCommissions } from '../../../hooks/useEventCommissions';
import { useVolunteerApplications } from '../../../hooks/useVolunteerApplications';
import { ensureProjectVaralRope } from '../../../utils/commissionVaralAdapter';
import { consolidateVolunteerShifts, computeVolunteerCoverage } from '../../../utils/volunteerShiftUtils';

/**
 * Tour de Contrôle des Commissions d'un Événement
 * Hub centralisé : baromètre de santé, passerelle Grand Tableau Bénévoles,
 * grille des commissions et modale d'édition.
 */
export default function EventCommissionsHub({
  event, allUsers = [], usersMap = {}, currentUserId = null,
  userProfile = null, onNavigateToView = null, onOpenVolunteersSynoptic = null,
  isAdmin = false, isMestre = false, onClose
}) {
  const eventId = event?.id;
  const {
    commissions, loading, stats, getCommissionProgress,
    addCommission, updateCommission, deleteCommission,
    getOrCreateCommissionThread, openOrCreateCommissionThread
  } = useEventCommissions(eventId, event);

  const [editingCommissionId, setEditingCommissionId] = useState(null);
  const [editingCommissionData, setEditingCommissionData] = useState(null);
  const [isCreatingCommission, setIsCreatingCommission] = useState(false);
  const backdropMouseDownRef = useRef(false);

  const canCreate = isAdmin || isMestre;
  const canDepositVaral = canCreate || commissions.some((c) => (c.referentsIds || []).includes(currentUserId));

  const allVolunteerShifts = useMemo(() => consolidateVolunteerShifts(event, commissions, usersMap), [event, commissions, usersMap]);
  const globalVolunteerCoverage = useMemo(() => computeVolunteerCoverage(allVolunteerShifts), [allVolunteerShifts]);

  const { canViewApplications, pendingApplications } = useVolunteerApplications({
    event, commissions, consolidatedShifts: allVolunteerShifts,
    user: currentUserId ? { uid: currentUserId } : null, profileData: userProfile, isAuthorized: canCreate
  });

  const handleOpenVaralDeposit = async () => {
    if (!eventId) return;
    if (event?.groupId) await ensureProjectVaralRope(event.groupId, event);
    const payload = { categoryId: `projet_${eventId}`, categoryNom: `🎪 Projet : ${event?.title || event?.titre || 'Événement'}`, lockCategory: true };
    if (typeof window !== 'undefined') { window.__ogPendingVaralShare = payload; window.dispatchEvent(new CustomEvent('open-shared-varal', { detail: payload })); }
    if (onNavigateToView) onNavigateToView('documents', { ropeId: `projet_${eventId}` });
    if (onClose) onClose();
  };

  const countdownText = useMemo(() => {
    const rawDate = event?.date || event?.startDate;
    if (!rawDate) return null;
    const diffDays = Math.ceil((new Date(rawDate).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `J-${diffDays}` : (diffDays === 0 ? "C'est aujourd'hui !" : `J+${Math.abs(diffDays)}`);
  }, [event]);

  const handleOpenCreate = () => { setEditingCommissionId(null); setEditingCommissionData(null); setIsCreatingCommission(true); };
  const handleOpenEdit = (comm) => { setEditingCommissionId(comm?.id || null); setEditingCommissionData(comm || null); setIsCreatingCommission(false); };
  const handleCloseModal = () => { console.trace('⚠️ FERMETURE MODALE : handleCloseModal'); setEditingCommissionId(null); setEditingCommissionData(null); setIsCreatingCommission(false); };
  const isModalOpen = isCreatingCommission || Boolean(editingCommissionId);
  const handleSaveCommission = async (formData) => (editingCommissionId ? updateCommission(eventId, editingCommissionId, formData) : addCommission(eventId, formData));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none overflow-y-auto"
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => { if (e.target?.isConnected && backdropMouseDownRef.current && e.target === e.currentTarget) onClose(); backdropMouseDownRef.current = false; }}
    >
      <div
        className="w-full max-w-5xl bg-cordel-bg-light border-0 sm:border-3 border-[var(--theme-border)] rounded-none sm:rounded-[10px_14px_9px_12px] shadow-none sm:shadow-[6px_6px_0px_0px_var(--theme-border)] flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[95vh] overflow-hidden my-auto"
        onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
      >
        <CommissionHubHeader
          event={event} countdownText={countdownText} globalVolunteerCoverage={globalVolunteerCoverage}
          pendingApplicationsCount={event?.hasCommissions !== false && canViewApplications ? pendingApplications.length : 0}
          canDepositVaral={canDepositVaral} canCreate={canCreate} onOpenVolunteersSynoptic={onOpenVolunteersSynoptic}
          onOpenVaralDeposit={handleOpenVaralDeposit} onOpenCreate={handleOpenCreate} onClose={onClose}
        />

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <CommissionBarometer stats={stats} />
          <EventForumChannelLink event={event} groupId={event?.groupId} canManage={canCreate} onNavigateToView={onNavigateToView} />

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-black uppercase text-encre-noire flex items-center gap-1.5 pt-1">
              <span>📋</span> Commissions actives ({commissions.length})
            </h3>
            {loading ? (
              <div className="p-8 text-center text-xs opacity-65 font-bold">Chargement des chantiers en cours...</div>
            ) : commissions.length === 0 ? (
              <div className="p-8 rounded-lg border-2 border-dashed border-encre-noire/30 text-center bg-cordel-bg/40 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🎪</span>
                <p className="text-xs font-bold text-encre-noire">Aucune commission n&apos;est encore configurée pour cet événement.</p>
                {canCreate && <button type="button" onClick={handleOpenCreate} className="mt-1 px-3 py-1.5 font-black text-xs rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white shadow-xs">+ Créer la première commission</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {commissions.map((comm) => (
                  <CommissionCard
                    key={comm.id} commission={comm} event={event} groupId={event?.groupId}
                    usersMap={usersMap} progress={getCommissionProgress(comm)}
                    volunteerCoverage={computeVolunteerCoverage(allVolunteerShifts.filter((s) => s.commissionId === comm.id))}
                    canManage={canCreate || (comm.referentsIds || []).includes(currentUserId)}
                    onManage={() => handleOpenEdit(comm)} onView={() => handleOpenEdit(comm)}
                    onNavigateToView={onNavigateToView} openOrCreateCommissionThread={openOrCreateCommissionThread}
                    getOrCreateCommissionThread={getOrCreateCommissionThread} userProfile={userProfile} onCloseHub={onClose}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CommissionEditModal
          commission={editingCommissionData} event={event} groupId={event?.groupId}
          allUsers={allUsers} usersMap={usersMap} canArbitrate={isAdmin} isOpen={isModalOpen}
          onClose={handleCloseModal} onSave={handleSaveCommission}
          onDelete={async (commId) => { await deleteCommission(eventId, commId); handleCloseModal(); }}
        />
      )}
    </div>
  );
}
