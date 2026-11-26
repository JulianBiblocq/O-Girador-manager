import React, { useState } from 'react';
import VolunteerInscritBadge from './VolunteerInscritBadge';
import VolunteerCalendarExportMenu from './VolunteerCalendarExportMenu';
import { isVolunteerShiftFull, detectStageScheduleConflict } from '../../../utils/volunteerShiftUtils';

/**
 * Carte d'un créneau bénévole : jauge visuelle Cordel, verrouillage au quota,
 * alerte douce de conflit scène/balance, inscrits (membre, proche, externe) et ajustement référent/admin.
 */
export default function VolunteerShiftCard({
  shift, event, commissions = [], associationName = '', currentUserUid, allUsers = [], isArtisticPresent = false,
  canManage = false, showCommissionBadge = false, loading = false,
  onToggleSelf, onOpenGuestModal, onInspectExternal, onRemoveInscrit, onAddMemberByManager, tr
}) {
  const [selectedUid, setSelectedUid] = useState('');
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const inscrits = shift.inscrits || [];
  const quota = Number(shift.quotaRequis) || 0;
  const isFull = isVolunteerShiftFull(shift);
  const isUserRegistered = Boolean(currentUserUid && inscrits.some((i) => i.type === 'member' && i.uid === currentUserUid));
  const hasStageConflict = Boolean(isArtisticPresent && detectStageScheduleConflict(shift, event));
  const evtDay = String(event?.date || event?.dateDebut || '').slice(0, 10);
  const pct = quota > 0 ? Math.min(100, Math.round((inscrits.length / quota) * 100)) : 0;

  return (
    <div className="flex flex-col justify-between bg-[var(--theme-input-bg)]/80 p-3 rounded-lg border border-dashed border-[var(--theme-border)]/25 shadow-xs gap-2.5">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h5 className="font-black text-xs uppercase leading-tight">{shift.nomTache}</h5>
              {(showCommissionBadge || shift.commissionTitre) && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25">
                  {shift.commissionTitre || (t('agenda.volunteerGeneralShort') || 'Général')}
                </span>
              )}
            </div>
            <span className="text-[10px] opacity-80 font-semibold block mt-0.5">
              ⏱️ {shift.dateJour && shift.dateJour !== evtDay ? `${shift.dateJour} • ` : ''}{shift.horaires || (t('agenda.volunteerFreeSchedule') || 'Horaire libre')}
            </span>
            {shift.consigne && <p className="text-[10px] italic opacity-80 mt-1">💡 {shift.consigne}</p>}
          </div>

          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border border-[var(--theme-border)] text-white shrink-0 ${
            quota > 0 && inscrits.length >= quota ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'
          }`}>
            {quota > 0
              ? `${inscrits.length} / ${quota} ${t('agenda.volunteerRegisteredShort') || 'inscrits'}`
              : `${inscrits.length} ${t('agenda.volunteerRegisteredShort') || 'inscrits'}`}
          </span>
        </div>

        {quota > 0 && (
          <div className="w-full h-1.5 rounded-full bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 overflow-hidden">
            <div className={`h-full transition-all ${isFull ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'}`} style={{ width: `${pct}%` }} />
          </div>
        )}

        {hasStageConflict && (
          <div className="px-2.5 py-1.5 rounded border border-[var(--color-cordel-ocre)] bg-[var(--cordel-bg)] text-[var(--color-cordel-ocre)] text-[10px] font-bold leading-snug">
            ⚠️ {t('agenda.volunteerStageConflictWarning') || 'Attention : ce créneau chevauche les horaires de balance ou de jeu'}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <button
            type="button"
            disabled={loading || !currentUserUid || (!isUserRegistered && isFull && !canManage)}
            onClick={() => onToggleSelf(shift)}
            className={`text-[9.5px] font-black uppercase border border-[var(--theme-border)] px-2.5 py-1 rounded cursor-pointer disabled:opacity-50 ${
              isUserRegistered ? 'bg-[var(--color-cordel-ocre)] text-white'
              : isFull && !canManage ? 'bg-[var(--cordel-bg)] opacity-60'
              : 'bg-[var(--color-cordel-vert)] text-white'
            }`}
          >
            {isUserRegistered
              ? `✕ ${t('agenda.volunteerLeave') || 'Me retirer'}`
              : (isFull && !canManage)
                ? (t('agenda.volunteerFull') || 'Complet')
                : `＋ ${t('agenda.volunteerTakeShift') || 'Je prends ce créneau'}`}
          </button>

          {currentUserUid && (!isFull || canManage) && (
            <button
              type="button" disabled={loading} onClick={() => onOpenGuestModal(shift)}
              className="text-[9.5px] font-bold border border-[var(--theme-border)]/50 bg-[var(--cordel-bg)] hover:bg-[var(--theme-hover-bg)] px-2 py-1 rounded cursor-pointer"
            >
              ＋ {t('agenda.volunteerAddGuestBtn') || 'Inscrire un proche'}
            </button>
          )}

          {isUserRegistered && (
            <VolunteerCalendarExportMenu mode="single" shift={shift} event={event} commissions={commissions} allUsers={allUsers} associationName={associationName} tr={tr} />
          )}
        </div>
      </div>

      <div className="border-t border-dashed border-[var(--theme-border)]/15 pt-2 flex flex-col gap-1.5">
        {inscrits.length === 0 ? (
          <span className="text-[10px] italic opacity-60">{t('agenda.volunteerNoRegisteredYet') || 'Aucun bénévole inscrit.'}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {inscrits.map((ins) => (
              <VolunteerInscritBadge
                key={ins.id} inscrit={ins} shift={shift} allUsers={allUsers}
                currentUserUid={currentUserUid} canManage={canManage}
                onInspectExternal={onInspectExternal} onRemoveInscrit={onRemoveInscrit} tr={tr}
              />
            ))}
          </div>
        )}

        {canManage && allUsers.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <select value={selectedUid} onChange={(e) => setSelectedUid(e.target.value)} className="theme-input py-0.5 px-1.5 text-[10px] flex-1">
              <option value="">{t('agenda.volunteerManagerAddMember') || 'Ajuster : ajouter un adhérent...'}</option>
              {allUsers.map((u) => <option key={u.id} value={u.id}>{`${u.prenom || ''} ${u.nom || u.displayName || ''}`.trim()}</option>)}
            </select>
            <button type="button" disabled={!selectedUid || loading} onClick={() => { onAddMemberByManager(shift, selectedUid); setSelectedUid(''); }} className="px-2 py-0.5 text-[10px] font-black rounded border border-[var(--theme-border)] bg-[var(--cordel-bg)] cursor-pointer disabled:opacity-40">＋</button>
          </div>
        )}
      </div>
    </div>
  );
}
