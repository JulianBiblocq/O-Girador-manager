import React from 'react';
import { normalizeVolunteerShift } from '../../utils/volunteerShiftUtils';

/**
 * Carte dédiée de création / édition d'un créneau bénévole enrichi (3 lignes aérées :
 * Ligne 1 Poste + Quota explicite + Suppression, Ligne 2 Date + Début + Fin, Ligne 3 Consigne + Commission).
 */
export default function VolunteerShiftFormCard({
  shift,
  index,
  eventDateJour = '',
  hasCommissions = false,
  commissions = [],
  saving = false,
  onUpdate,
  onRemove,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const norm = normalizeVolunteerShift(shift, { index, eventDateJour });

  const emitPatch = (patch) => {
    const nextDebut = patch.heureDebut !== undefined ? patch.heureDebut : norm.heureDebut;
    const nextFin = patch.heureFin !== undefined ? patch.heureFin : norm.heureFin;
    const nextHoraires = (nextDebut && nextFin)
      ? `${nextDebut} - ${nextFin}`
      : (patch.horaires !== undefined ? patch.horaires : (nextDebut || shift.horaires || ''));
    const nextNom = patch.nomTache !== undefined ? patch.nomTache : norm.nomTache;
    const nextQuota = patch.quotaRequis !== undefined ? patch.quotaRequis : norm.quotaRequis;

    onUpdate(index, {
      ...shift,
      id: shift.id || norm.id,
      nomTache: nextNom,
      label: nextNom,
      dateJour: patch.dateJour !== undefined ? patch.dateJour : (shift.dateJour || ''),
      heureDebut: nextDebut,
      heureFin: nextFin,
      horaires: nextHoraires,
      quotaRequis: nextQuota,
      neededCount: nextQuota,
      consigne: patch.consigne !== undefined ? patch.consigne : norm.consigne,
      commissionId: patch.commissionId !== undefined ? patch.commissionId : norm.commissionId,
      commissionTitre: patch.commissionTitre !== undefined ? patch.commissionTitre : norm.commissionTitre
    });
  };

  const handleCommissionChange = (e) => {
    const commId = e.target.value || null;
    const found = commissions.find((c) => c.id === commId);
    emitPatch({ commissionId: commId, commissionTitre: found?.titre || '' });
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[var(--cordel-bg)] border border-dashed border-[var(--theme-border)]/35 rounded">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerTaskLabel') || 'Poste / Mission'} *</label>
          <input
            type="text" value={shift.nomTache ?? shift.label ?? ''} required disabled={saving}
            placeholder={t('agenda.volunteerTaskPlaceholder') || 'Ex. : Tenue de la buvette'}
            onChange={(e) => emitPatch({ nomTache: e.target.value })}
            className="theme-input py-1.5 px-2.5 text-xs w-full"
          />
        </div>

        <div className="flex items-end justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerQuotaLabel') || 'Quota (0 = libre)'}</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" max="99" value={norm.quotaRequis} disabled={saving}
                onChange={(e) => emitPatch({ quotaRequis: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="theme-input w-20 py-1.5 pl-2.5 pr-1.5 text-xs font-bold text-left tabular-nums"
              />
              <span className="text-[10.5px] font-bold opacity-80 whitespace-nowrap">
                {t('agenda.volunteerQuotaUnitShort') || 'places'}
              </span>
            </div>
          </div>

          <button
            type="button" onClick={() => onRemove(index)} disabled={saving}
            className="text-[9.5px] font-black uppercase bg-[var(--color-cordel-rouge)] text-white border border-[var(--theme-border)] px-2.5 py-1.5 rounded cursor-pointer shrink-0"
            title={t('agenda.volunteerDeleteShift') || 'Supprimer ce créneau'}
          >✕</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerDateOptional') || 'Date (veille/lend.)'}</label>
          <input type="date" value={shift.dateJour || eventDateJour || ''} disabled={saving} onChange={(e) => emitPatch({ dateJour: e.target.value })} className="theme-input py-1.5 px-2 text-xs w-full" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerStartTime') || 'Début'}</label>
          <input type="time" value={norm.heureDebut} disabled={saving} onChange={(e) => emitPatch({ heureDebut: e.target.value })} className="theme-input py-1.5 px-2 text-xs w-full" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerEndTime') || 'Fin'}</label>
          <input type="time" value={norm.heureFin} disabled={saving} onChange={(e) => emitPatch({ heureFin: e.target.value })} className="theme-input py-1.5 px-2 text-xs w-full" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerConsigneLabel') || 'Consigne pratique (optionnel)'}</label>
          <input
            type="text" value={shift.consigne || ''} disabled={saving}
            placeholder={t('agenda.volunteerConsignePlaceholder') || 'Ex. : Clés auprès du référent bar'}
            onChange={(e) => emitPatch({ consigne: e.target.value })}
            className="theme-input py-1.5 px-2.5 text-xs w-full"
          />
        </div>
        {hasCommissions && (
          <div className="sm:w-52 shrink-0 flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerCommissionLink') || 'Commission rattachée'}</label>
            <select value={norm.commissionId || ''} disabled={saving} onChange={handleCommissionChange} className="theme-input py-1.5 px-2 text-xs w-full cursor-pointer">
              <option value="">{t('agenda.volunteerGeneralFilter') || 'Général (événement)'}</option>
              {commissions.map((c) => <option key={c.id} value={c.id}>{c.icone || '📋'} {c.titre}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
