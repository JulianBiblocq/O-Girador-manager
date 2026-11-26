import React, { useState, useMemo } from 'react';
import VolunteerSynopticToolbar from './VolunteerSynopticToolbar';
import {
  computeSynopticKpis,
  filterAndSortSynopticShifts,
  formatShiftDurationLabel,
  getShiftGaugeStatus
} from '../../../utils/volunteerSynopticUtils';
import { isVolunteerShiftFull } from '../../../utils/volunteerShiftUtils';

/**
 * Grand Tableau Synoptique des créneaux bénévoles sur toute l'amplitude de l'événement.
 * Colonne Poste figée à gauche sur petit écran (`sticky left-0`), jauges Cordel,
 * pastilles nominatives (Membre / Proche / Externe) cliquables et bouton `+ Affecter` en 2 clics.
 */
export default function VolunteerSynopticTable({
  shifts = [], commissions = [], pendingApplications = [], acceptedApplications = [],
  event = {}, canManageShift, onInspectInscrit, onRemoveInscrit, onOpenQuickAssign, tr
}) {
  const [dayFilter, setDayFilter] = useState('all');
  const [commissionFilter, setCommissionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('chronological');
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  const commById = useMemo(() => Object.fromEntries((commissions || []).filter((c) => c?.id).map((c) => [c.id, c])), [commissions]);
  const dayOptions = useMemo(() => Array.from(new Set((shifts || []).map((s) => s.dateJour).filter(Boolean))).sort(), [shifts]);
  const commissionOptions = useMemo(() => {
    const map = new Map();
    (shifts || []).forEach((s) => {
      if (s.commissionId && !map.has(s.commissionId)) {
        const c = commById[s.commissionId];
        map.set(s.commissionId, { id: s.commissionId, label: `${c?.icone || '📋'} ${c?.titre || s.commissionTitre || 'Commission'}` });
      }
    });
    return Array.from(map.values());
  }, [shifts, commById]);

  const kpis = useMemo(() => computeSynopticKpis(shifts, { pendingApplications, acceptedApplications }), [shifts, pendingApplications, acceptedApplications]);
  const rows = useMemo(() => filterAndSortSynopticShifts(shifts, { dayFilter, commissionFilter, searchQuery, sortBy }), [shifts, dayFilter, commissionFilter, searchQuery, sortBy]);
  const evtDay = String(event?.date || event?.dateDebut || '').slice(0, 10);
  const gaugeCls = (st) => (st === 'empty' ? 'bg-[var(--color-cordel-rouge)] text-white' : st === 'partial' ? 'bg-[var(--color-cordel-ocre)] text-white' : 'bg-[var(--color-cordel-vert)] text-white');

  return (
    <div className="flex flex-col gap-3 text-left">
      <VolunteerSynopticToolbar
        kpis={kpis} dayOptions={dayOptions} commissionOptions={commissionOptions}
        dayFilter={dayFilter} onChangeDay={setDayFilter} commissionFilter={commissionFilter}
        onChangeCommission={setCommissionFilter} searchQuery={searchQuery} onChangeSearch={setSearchQuery}
        sortBy={sortBy} onChangeSort={setSortBy} tr={tr}
      />

      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs italic opacity-70 rounded-lg border border-dashed border-[var(--theme-border)]/30">
          {t('agenda.volunteerSynopticEmpty') || 'Aucun créneau ne correspond aux filtres sélectionnés.'}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border-2 border-[var(--theme-border)] bg-[var(--theme-card-bg)]">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--cordel-bg)] border-b-2 border-[var(--theme-border)] text-[10px] font-black uppercase tracking-wider">
                <th className="sticky left-0 z-20 bg-[var(--cordel-bg)] py-2 px-2.5 border-r border-[var(--theme-border)]/25">{t('agenda.volunteerColPost') || 'Poste & Consigne'}</th>
                <th className="py-2 px-2.5">{t('agenda.volunteerColCommission') || 'Commission / Pôle'}</th>
                <th className="py-2 px-2.5 whitespace-nowrap">{t('agenda.volunteerColSchedule') || 'Jour & Créneau'}</th>
                <th className="py-2 px-2.5 whitespace-nowrap">{t('agenda.volunteerColGauge') || 'Jauge'}</th>
                <th className="py-2 px-2.5">{t('agenda.volunteerColTeam') || 'Équipe inscrite'}</th>
                <th className="py-2 px-2.5 text-right whitespace-nowrap">{t('agenda.volunteerColAction') || 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sh) => {
                const comm = sh.commissionId ? commById[sh.commissionId] : null;
                const dur = formatShiftDurationLabel(sh), status = getShiftGaugeStatus(sh), full = isVolunteerShiftFull(sh);
                const count = sh.inscrits?.length || 0, quota = Number(sh.quotaRequis) || 0;
                const manageable = typeof canManageShift === 'function' ? canManageShift(sh) : true;
                return (
                  <tr key={sh.id} className="border-b border-dashed border-[var(--theme-border)]/20 hover:bg-[var(--theme-hover-bg)]/40 align-top">
                    <td className="sticky left-0 z-10 bg-[var(--theme-card-bg)] py-2 px-2.5 border-r border-[var(--theme-border)]/20 max-w-[190px]">
                      <span className="font-black block leading-snug">{sh.nomTache}</span>
                      {sh.consigne && <span className="text-[10px] italic opacity-75 block mt-0.5 line-clamp-2">💡 {sh.consigne}</span>}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap font-bold text-[11px]">
                      {sh.commissionId ? `${comm?.icone || '📋'} ${comm?.titre || sh.commissionTitre || 'Commission'}` : `🤝 ${t('agenda.volunteerGeneralShort') || 'Général'}`}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      {sh.dateJour && sh.dateJour !== evtDay && <span className="text-[10px] font-bold block opacity-75">📅 {sh.dateJour}</span>}
                      <span className="font-black">{sh.horaires || (t('agenda.volunteerFreeSchedule') || 'Horaire libre')}</span>
                      {dur && <span className="ml-1 text-[10px] opacity-75">({dur})</span>}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded border border-[var(--theme-border)] text-[10px] font-black ${gaugeCls(status)}`}>
                        {quota > 0 ? (full ? `✓ ${t('agenda.volunteerFull') || 'Complet'} (${count}/${quota})` : `${count} / ${quota}`) : `${count}`}
                      </span>
                    </td>
                    <td className="py-2 px-2.5">
                      {count === 0 ? <span className="text-[10px] italic opacity-55">—</span> : (
                        <div className="flex flex-wrap gap-1">
                          {sh.inscrits.map((ins) => {
                            const tag = ins.type === 'external' ? '🌐' : ins.type === 'guest' ? '🤝' : '👤';
                            const nm = `${ins.prenom || ''} ${ins.nom ? `${ins.nom.charAt(0)}.` : ''}`.trim() || 'Bénévole';
                            return (
                              <span key={ins.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 text-[10.5px] font-bold">
                                <button type="button" onClick={() => onInspectInscrit && onInspectInscrit(sh, ins)} className="cursor-pointer hover:underline text-left">{tag} {nm}</button>
                                {manageable && onRemoveInscrit && <button type="button" onClick={() => onRemoveInscrit(sh, ins)} className="text-[var(--color-cordel-rouge)] font-black cursor-pointer ml-0.5" title="Retirer">×</button>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right whitespace-nowrap">
                      {manageable && !full && onOpenQuickAssign && (
                        <button type="button" onClick={() => onOpenQuickAssign(sh)} className="px-2 py-1 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase cursor-pointer">
                          ＋ {t('agenda.volunteerQuickAssignBtn') || 'Affecter'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
