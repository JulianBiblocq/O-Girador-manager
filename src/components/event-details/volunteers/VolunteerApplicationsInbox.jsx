import React from 'react';
import VolunteerApplicationCard from './VolunteerApplicationCard';

/**
 * Encart « 📥 Propositions externes à valider (X) » & barre d'outils gestionnaire/référent :
 * ajout manuel externe, récapitulatif externes validés, envoi des mémos/remerciements et export CSV.
 */
export default function VolunteerApplicationsInbox({
  pendingApplications = [],
  acceptedCount = 0,
  hasAnyVolunteer = false,
  shiftsById = {},
  manageableShifts = [],
  actionLoadingId = null,
  onQuickValidate,
  onOpenAssign,
  onReject,
  onOpenManualModal,
  onOpenAcceptedSummary,
  onOpenDispatchModal,
  onExportCsv,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const manageableShiftIds = new Set((manageableShifts || []).map((s) => s.id));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {manageableShifts.length > 0 && (
            <button
              type="button" onClick={onOpenManualModal}
              className="px-2.5 py-1 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              ＋ {t('agenda.volunteerAddExternalBtn') || 'Ajouter un bénévole externe'}
            </button>
          )}
          {acceptedCount > 0 && (
            <>
              <button
                type="button" onClick={onOpenAcceptedSummary}
                className="px-2.5 py-1 rounded border border-[var(--theme-border)]/50 bg-[var(--cordel-bg)] hover:bg-[var(--theme-hover-bg)] text-[10px] font-bold cursor-pointer"
              >
                📋 {t('agenda.volunteerAcceptedExternalsBtn') || 'Externes validés'} ({acceptedCount})
              </button>
              {onOpenDispatchModal && (
                <button
                  type="button" onClick={onOpenDispatchModal}
                  className="px-2.5 py-1 rounded border border-[var(--theme-border)]/50 bg-[var(--cordel-bg)] hover:bg-[var(--theme-hover-bg)] text-[10px] font-bold cursor-pointer"
                >
                  ✉️ {t('agenda.volunteerDispatchBtn') || 'Mémos & Remerciements externes'}
                </button>
              )}
            </>
          )}
          {(hasAnyVolunteer || acceptedCount > 0) && onExportCsv && (
            <button
              type="button" onClick={onExportCsv}
              className="px-2.5 py-1 rounded border border-[var(--theme-border)]/50 bg-[var(--cordel-bg)] hover:bg-[var(--theme-hover-bg)] text-[10px] font-bold cursor-pointer"
            >
              📥 {t('agenda.volunteerExportCsvBtn') || 'Exporter Bénévoles, Repas & T-shirts (CSV)'}
            </button>
          )}
        </div>
      </div>

      {pendingApplications.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--cordel-bg)] border-2 border-[var(--color-cordel-ocre)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-[var(--cordel-wood)] flex items-center gap-1.5">
              📥 {t('agenda.volunteerInboxTitle') || 'Propositions externes à valider'} ({pendingApplications.length})
            </h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingApplications.map((app) => (
              <VolunteerApplicationCard
                key={app.id} application={app} shiftsById={shiftsById}
                manageableShiftIds={manageableShiftIds} loading={actionLoadingId === app.id}
                onQuickValidate={onQuickValidate} onOpenAssign={onOpenAssign} onReject={onReject} tr={tr}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
