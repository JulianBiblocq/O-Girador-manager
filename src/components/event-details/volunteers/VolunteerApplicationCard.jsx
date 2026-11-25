import React from 'react';
import { isVolunteerShiftFull } from '../../../utils/volunteerShiftUtils';

/**
 * Carte unitaire d'une candidature bénévole externe en attente (`status === 'pending'`).
 * Affiche l'identité, le lien asso, les créneaux demandés ou le badge « Poste flexible »,
 * les puces logistiques compactes et les 3 actions rapides (Valider, Affecter, Refuser).
 */
export default function VolunteerApplicationCard({
  application,
  shiftsById = {},
  manageableShiftIds = new Set(),
  loading = false,
  onQuickValidate,
  onOpenAssign,
  onReject,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const fullName = `${application.prenom || ''} ${application.nom || ''}`.trim() || 'Bénévole';

  const freeManageableRequestedIds = (application.requestedShiftIds || []).filter((sid) => {
    const sh = shiftsById[sid];
    return Boolean(sh && manageableShiftIds.has(sid) && !isVolunteerShiftFull(sh));
  });
  const canDirectValidate = !application.isFlexible && freeManageableRequestedIds.length > 0;

  return (
    <div className="p-3 rounded-lg bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/40 shadow-xs flex flex-col gap-2 text-xs">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <strong className="font-black text-xs uppercase">{fullName}</strong>
            {application.lienAsso && (
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30">
                🤝 {t('agenda.volunteerFromRelation') || 'De la part de'} : {application.lienAsso}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap text-[10px] opacity-85">
            {application.telephone && (
              <a href={`tel:${application.telephone.replace(/\s+/g, '')}`} className="font-bold text-[var(--color-cordel-vert)] underline">
                📞 {application.telephone}
              </a>
            )}
            {application.email && (
              <a href={`mailto:${application.email}`} className="underline opacity-85">
                ✉️ {application.email}
              </a>
            )}
          </div>
        </div>

        {application.isFlexible && (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-black border border-[var(--theme-border)] bg-[var(--color-cordel-ocre)] text-white shrink-0">
            🔀 {t('agenda.volunteerFlexibleBadge') || 'Poste flexible'}
          </span>
        )}
      </div>

      {!application.isFlexible && (application.requestedShiftIds || []).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9.5px] font-bold opacity-75">
            {t('agenda.volunteerRequestedShifts') || 'Créneaux souhaités'} :
          </span>
          {application.requestedShiftIds.map((sid) => {
            const sh = shiftsById[sid];
            const full = sh ? isVolunteerShiftFull(sh) : false;
            return (
              <span
                key={sid}
                className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-[var(--theme-border)]/35 ${
                  full ? 'bg-[var(--color-cordel-ocre)] text-white' : 'bg-[var(--cordel-bg)]'
                }`}
              >
                {sh ? `${sh.nomTache}${sh.horaires ? ` (${sh.horaires})` : ''}` : sid}
                {full ? ` • ${t('agenda.volunteerFull') || 'Complet'}` : ''}
              </span>
            );
          })}
        </div>
      )}

      {application.disponibilitesNote && (
        <p className="text-[10px] italic opacity-85 bg-[var(--cordel-bg)]/70 px-2 py-1 rounded border border-dashed border-[var(--theme-border)]/20">
          💬 {application.disponibilitesNote}
        </p>
      )}

      {(application.regimeAlimentaire || application.tailleTshirt || application.hasVehicle || application.vehicleDetails || typeof application.isAdult === 'boolean') && (
        <div className="flex flex-wrap gap-1.5">
          {application.regimeAlimentaire && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25">🍽️ {application.regimeAlimentaire}</span>}
          {application.tailleTshirt && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25">👕 {application.tailleTshirt}</span>}
          {(application.hasVehicle || application.vehicleDetails) && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25">🚗 {application.vehicleDetails || (t('agenda.volunteerVehicleAvailable') || 'Véhicule dispo')}</span>}
          {typeof application.isAdult === 'boolean' && (
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-[var(--theme-border)]/30 ${application.isAdult ? 'bg-[var(--cordel-bg)]' : 'bg-[var(--color-cordel-ocre)] text-white'}`}>
              🪪 {application.isAdult ? (t('agenda.volunteerAdultYes') || 'Majeur (+18 ans)') : (t('agenda.volunteerAdultNo') || 'Mineur (-18 ans)')}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-dashed border-[var(--theme-border)]/20">
        {canDirectValidate && (
          <button
            type="button" disabled={loading} onClick={() => onQuickValidate(application, freeManageableRequestedIds)}
            className="px-2.5 py-1 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[9.5px] font-black uppercase cursor-pointer disabled:opacity-45"
          >
            ✅ {t('agenda.volunteerValidateBtn') || 'Valider'}
          </button>
        )}
        <button
          type="button" disabled={loading} onClick={() => onOpenAssign(application)}
          className="px-2.5 py-1 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-ocre)] text-white text-[9.5px] font-black uppercase cursor-pointer disabled:opacity-45"
        >
          🔀 {t('agenda.volunteerAssignShiftsBtn') || 'Affecter / Choisir poste(s)'}
        </button>
        <button
          type="button" disabled={loading} onClick={() => onReject(application)}
          className="px-2.5 py-1 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-rouge)] text-white text-[9.5px] font-black uppercase cursor-pointer disabled:opacity-45 ml-auto"
        >
          ✕ {t('agenda.volunteerRejectBtn') || 'Refuser'}
        </button>
      </div>
    </div>
  );
}
