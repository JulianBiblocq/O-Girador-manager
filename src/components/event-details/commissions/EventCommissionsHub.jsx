import React, { useState, useMemo, useRef } from 'react';
import CommissionBarometer from './CommissionBarometer';
import CommissionCard from './CommissionCard';
import CommissionEditModal from './CommissionEditModal';
import EventForumChannelLink from './EventForumChannelLink';
import { useEventCommissions } from '../../../hooks/useEventCommissions';

/**
 * Tour de Contrôle des Commissions d'un Événement (Bloc 1)
 * Hub centralisé : baromètre de santé, grille des commissions et modale d'édition.
 */
export default function EventCommissionsHub({
  event, allUsers = [], usersMap = {}, currentUserId = null,
  userProfile = null, onNavigateToView = null, isAdmin = false, isMestre = false, onClose
}) {
  const eventId = event?.id;
  const {
    commissions, loading, stats, getCommissionProgress,
    addCommission, updateCommission, deleteCommission,
    getOrCreateCommissionThread, openOrCreateCommissionThread
  } = useEventCommissions(eventId, event);

  // Identification stable de la commission en cours d'édition (anti-démontage lors des snapshots Firestore)
  const [editingCommissionId, setEditingCommissionId] = useState(null);
  const [editingCommissionData, setEditingCommissionData] = useState(null);
  const [isCreatingCommission, setIsCreatingCommission] = useState(false);
  const backdropMouseDownRef = useRef(false);

  // Droits globaux (création & arbitrage budgétaire)
  const canCreate = isAdmin || isMestre;

  // Calcul du compte à rebours
  const countdownText = useMemo(() => {
    const rawDate = event?.date || event?.startDate;
    if (!rawDate) return null;
    const eventTime = new Date(rawDate).getTime();
    const nowTime = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((eventTime - nowTime) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `J-${diffDays}`;
    if (diffDays === 0) return "C'est aujourd'hui !";
    return `J+${Math.abs(diffDays)}`;
  }, [event]);

  const handleOpenCreate = () => { setEditingCommissionId(null); setEditingCommissionData(null); setIsCreatingCommission(true); };
  const handleOpenEdit = (comm) => { setEditingCommissionId(comm?.id || null); setEditingCommissionData(comm || null); setIsCreatingCommission(false); };
  const handleCloseModal = () => {
    console.trace("⚠️ FERMETURE MODALE DÉCLENCHÉE PAR : handleCloseModal (Tour de Contrôle)");
    setEditingCommissionId(null); setEditingCommissionData(null); setIsCreatingCommission(false);
  };
  const isModalOpen = isCreatingCommission || Boolean(editingCommissionId);
  const handleSaveCommission = async (formData) => {
    if (editingCommissionId) await updateCommission(eventId, editingCommissionId, formData);
    else await addCommission(eventId, formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (!e.target || !e.target.isConnected) return;
        if (backdropMouseDownRef.current && e.target === e.currentTarget) {
          console.trace("⚠️ FERMETURE MODALE DÉCLENCHÉE PAR : Clic backdrop EventCommissionsHub");
          onClose();
        }
        backdropMouseDownRef.current = false;
      }}
    >
      <div
        className="w-full max-w-5xl bg-cordel-bg-light border-3 border-encre-noire rounded-[10px_14px_9px_12px] shadow-[6px_6px_0px_0px_#181716] flex flex-col max-h-[95vh] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête Cordel de la Tour de Contrôle */}
        <div className="px-4 py-3 border-b-2 border-encre-noire bg-cordel-bg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl">🎪</span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-encre-noire truncate">
                  Tour de Contrôle — {event?.title || event?.titre || 'Événement'}
                </h2>
                {countdownText && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black border border-encre-noire bg-[var(--color-cordel-ocre)] text-white shrink-0">
                    {countdownText}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-600 truncate">
                Coordination générale des chantiers et des commissions associatives
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canCreate && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-3 py-1.5 font-black text-xs rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 shadow-xs flex items-center gap-1"
              >
                <span>+</span>
                <span className="hidden sm:inline">Nouvelle commission</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                console.trace("⚠️ FERMETURE MODALE DÉCLENCHÉE PAR : Bouton ✕ EventCommissionsHub");
                onClose();
              }}
              className="w-8 h-8 rounded border border-encre-noire bg-white flex items-center justify-center font-black text-sm hover:bg-stone-100"
              title="Fermer la Tour de Contrôle"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corps défilant du Hub */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Baromètre de santé global */}
          <CommissionBarometer stats={stats} />

          {/* Liaison Salon Porte-Voix */}
          <EventForumChannelLink
            event={event}
            groupId={event?.groupId}
            canManage={canCreate}
            onNavigateToView={onNavigateToView}
          />

          {/* Grille des commissions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-black uppercase text-encre-noire flex items-center gap-1.5">
                <span>📋</span> Commissions actives ({commissions.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-stone-500 font-bold">
                Chargement des chantiers en cours...
              </div>
            ) : commissions.length === 0 ? (
              <div className="p-8 rounded-lg border-2 border-dashed border-encre-noire/30 text-center bg-cordel-bg/40 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🎪</span>
                <p className="text-xs font-bold text-encre-noire">
                  Aucune commission n'est encore configurée pour cet événement.
                </p>
                {canCreate && (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="mt-1 px-3 py-1.5 font-black text-xs rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 shadow-xs"
                  >
                    + Créer la première commission
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {commissions.map((comm) => {
                  const isReferent = (comm.referentsIds || []).includes(currentUserId);
                  const canManage = canCreate || isReferent;

                  return (
                    <CommissionCard
                      key={comm.id} commission={comm} event={event} groupId={event?.groupId}
                      usersMap={usersMap} progress={getCommissionProgress(comm)} canManage={canManage}
                      onManage={() => handleOpenEdit(comm)} onView={() => handleOpenEdit(comm)}
                      onNavigateToView={onNavigateToView} openOrCreateCommissionThread={openOrCreateCommissionThread}
                      getOrCreateCommissionThread={getOrCreateCommissionThread} userProfile={userProfile}
                      onCloseHub={onClose}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale d'édition / création */}
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
