import React from 'react';
import useModalEscape from '../../../hooks/useModalEscape';

/**
 * Modale / tiroir récapitulatif des bénévoles externes validés (coordonnées, infos logistiques
 * et déclenchement individuel d'envoi du Mémo Jour J / Mot de remerciement).
 */
export default function VolunteerExternalDetailsModal({
  isOpen = false,
  applications = [],
  shiftsById = {},
  manageableShiftIds = new Set(),
  actionLoadingId = null,
  onRemoveFromShift,
  onOpenDispatchForApp,
  onClose,
  tr
}) {
  useModalEscape(isOpen, onClose, Boolean(actionLoadingId));

  if (!isOpen) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  return (
    <div
      role="dialog" aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !actionLoadingId) onClose(); }}
    >
      <div
        className="w-full max-w-xl bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">
            📋 {t('agenda.volunteerExternalDetailsTitle') || 'Récapitulatif bénévoles externes validés'} ({applications.length})
          </h4>
          <button type="button" onClick={onClose} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-3 max-h-[78vh] overflow-y-auto text-xs">
          {applications.map((app) => {
            const fullName = `${app.prenom || ''} ${app.nom || ''}`.trim() || 'Bénévole';
            return (
              <div key={app.id} className="p-3 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/35 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong className="font-black uppercase">{fullName}</strong>
                    {app.lienAsso && (
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/30">
                        🤝 {app.lienAsso}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    {app.telephone && <a href={`tel:${app.telephone.replace(/\s+/g, '')}`} className="font-bold text-[var(--color-cordel-vert)] underline">📞 {app.telephone}</a>}
                    {app.email && <a href={`mailto:${app.email}`} className="underline">✉️ {app.email}</a>}
                    {onOpenDispatchForApp && (
                      <button
                        type="button" onClick={() => onOpenDispatchForApp(app)}
                        className="px-2 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] font-black text-[9.5px] cursor-pointer"
                      >
                        ✉️ {t('agenda.volunteerDispatchSingleBtn') || 'Mémo / Merci'}
                      </button>
                    )}
                  </div>
                </div>

                {(app.regimeAlimentaire || app.tailleTshirt || app.hasVehicle || app.vehicleDetails || typeof app.isAdult === 'boolean' || app.disponibilitesNote) && (
                  <div className="flex flex-wrap gap-1.5">
                    {app.regimeAlimentaire && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25">🍽️ {app.regimeAlimentaire}</span>}
                    {app.tailleTshirt && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25">👕 {app.tailleTshirt}</span>}
                    {(app.hasVehicle || app.vehicleDetails) && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25">🚗 {app.vehicleDetails || (t('agenda.volunteerVehicleAvailable') || 'Véhicule dispo')}</span>}
                    {typeof app.isAdult === 'boolean' && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25">🪪 {app.isAdult ? (t('agenda.volunteerAdultYes') || 'Majeur') : (t('agenda.volunteerAdultNo') || 'Mineur')}</span>}
                    {app.disponibilitesNote && <span className="text-[9.5px] italic px-1.5 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/20">💬 {app.disponibilitesNote}</span>}
                  </div>
                )}

                {(app.assignedShiftIds || []).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-dashed border-[var(--theme-border)]/20">
                    <span className="text-[9.5px] font-bold opacity-75">{t('agenda.volunteerAssignedPostsLabel') || 'Poste(s) assigné(s)'} :</span>
                    {app.assignedShiftIds.map((sid) => {
                      const sh = shiftsById[sid];
                      const canRemoveHere = manageableShiftIds.has(sid);
                      return (
                        <span key={sid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/35 text-[10px] font-semibold">
                          <span>{sh ? `${sh.nomTache}${sh.horaires ? ` (${sh.horaires})` : ''}` : sid}</span>
                          {canRemoveHere && onRemoveFromShift && (
                            <button
                              type="button" disabled={actionLoadingId === app.id}
                              onClick={() => onRemoveFromShift(sid, { id: `ext_${app.id}`, type: 'external', applicationId: app.id })}
                              className="text-[var(--color-cordel-rouge)] font-black cursor-pointer ml-0.5"
                              title={t('agenda.volunteerRemoveBtn') || 'Retirer'}
                            >×</button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
