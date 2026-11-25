import React, { useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import { consolidateVolunteerShifts } from '../../../utils/volunteerShiftUtils';
import { downloadVolunteersAndLogisticsCSV } from '../../../utils/volunteerCsvExportUtils';

/**
 * Feuille d'émargement « Accueil QG Bénévoles » (écran & impression Roadbook A4 noir sur blanc).
 * Respecte strictement le cloisonnement RGPD :
 * - Gestionnaire / Référent : tableau complet avec Téléphone, Repas/T-shirt et cases `[ ] Arrivé` / `[ ] Repas remis`.
 * - Simple membre : n'expose aucun téléphone privé, e-mail ni allergie des externes ou proches d'autrui.
 */
export default function RoadbookVolunteersPrintSheet({
  event = {},
  commissions = [],
  allUsers = [],
  acceptedApplications = [],
  isManagerOrReferent = false,
  isPrintMode = false
}) {
  const { t } = useTranslation();

  const usersMap = useMemo(() => {
    const m = {};
    (allUsers || []).forEach((u) => { if (u?.id) m[u.id] = u; if (u?.uid) m[u.uid] = u; });
    return m;
  }, [allUsers]);

  const appsMap = useMemo(() => {
    const m = {};
    (acceptedApplications || []).forEach((a) => { if (a?.id) m[a.id] = a; });
    return m;
  }, [acceptedApplications]);

  const shifts = useMemo(
    () => consolidateVolunteerShifts(event, commissions, usersMap),
    [event, commissions, usersMap]
  );

  const rows = useMemo(() => {
    const list = [];
    const evtDay = String(event?.date || event?.dateDebut || '').slice(0, 10);
    shifts.forEach((sh) => {
      const slotLabel = `${sh.dateJour && sh.dateJour !== evtDay ? `${sh.dateJour} ` : ''}${sh.horaires || 'Jour J'} — ${sh.nomTache}${sh.commissionTitre ? ` (${sh.commissionTitre})` : ''}`;
      (sh.inscrits || []).forEach((ins) => {
        if (ins.type === 'external') {
          const app = appsMap[ins.applicationId] || {};
          const diet = isManagerOrReferent ? [app.regimeAlimentaire, app.tailleTshirt ? `T-shirt ${app.tailleTshirt}` : ''].filter(Boolean).join(' • ') : '';
          list.push({
            key: `${sh.id}_${ins.id}`,
            slotLabel,
            person: `${ins.prenom || app.prenom || ''} ${ins.nom || app.nom || ''}`.trim() || 'Bénévole',
            profile: t('agenda.volunteerProfileExternal') || 'Externe',
            phone: isManagerOrReferent ? (app.telephone || '') : '',
            logistics: diet
          });
        } else if (ins.type === 'guest') {
          list.push({
            key: `${sh.id}_${ins.id}`,
            slotLabel,
            person: `${ins.prenom || ''} ${ins.nom ? (isManagerOrReferent ? ins.nom : `${ins.nom[0]}.`) : ''}`.trim(),
            profile: `${t('agenda.volunteerProfileGuest') || 'Proche'}${ins.parrainNom ? ` (${ins.parrainNom})` : ''}`,
            phone: isManagerOrReferent ? (ins.telephone || '') : '',
            logistics: ''
          });
        } else {
          const u = usersMap[ins.uid] || {};
          const memberDiet = isManagerOrReferent
            ? [...(u.dietaryRestrictions || []), u.allergies ? `Allergie: ${u.allergies}` : '', u.tailleTshirt ? `T-shirt ${u.tailleTshirt}` : ''].filter(Boolean).join(' • ')
            : '';
          list.push({
            key: `${sh.id}_${ins.id}`,
            slotLabel,
            person: `${ins.prenom || u.prenom || ''} ${ins.nom || u.nom || ''}`.trim() || 'Membre',
            profile: t('agenda.volunteerProfileMember') || 'Membre',
            phone: isManagerOrReferent ? (u.telephone || u.phone || '') : '',
            logistics: memberDiet
          });
        }
      });
    });
    return list;
  }, [shifts, event, appsMap, usersMap, isManagerOrReferent, t]);

  if (!isManagerOrReferent || rows.length === 0) return null;

  const handleExport = () => downloadVolunteersAndLogisticsCSV({
    event, consolidatedShifts: shifts, acceptedApplications, allUsers
  });

  return (
    <div className={isPrintMode ? 'border border-black p-2 rounded mt-2.5 text-[8.5px] leading-tight break-inside-avoid' : 'bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)] text-xs'}>
      <div className={`flex items-center justify-between gap-2 flex-wrap ${isPrintMode ? 'border-b border-black pb-1 mb-1.5' : 'mb-2'}`}>
        <h3 className={`font-black uppercase tracking-wider ${isPrintMode ? 'text-[10px] text-black' : 'text-xs text-[var(--color-cordel-encre)]'}`}>
          📋 {t('agenda.volunteerQgSheetTitle') || "Accueil QG Bénévoles — Feuille d'émargement"} ({rows.length})
        </h3>
        {!isPrintMode && (
          <button
            type="button" onClick={handleExport}
            className="px-2.5 py-1 rounded border border-[var(--theme-border)] bg-[var(--cordel-bg)] text-[10px] font-black cursor-pointer"
          >
            📥 {t('agenda.volunteerExportCsvBtn') || 'Exporter Bénévoles, Repas & T-shirts (CSV)'}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black/40 font-black uppercase text-[8.5px]">
              <th className="py-1 pr-2">{t('agenda.volunteerQgColShift') || 'Créneau & Poste'}</th>
              <th className="py-1 pr-2">{t('agenda.volunteerQgColPerson') || 'Bénévole'}</th>
              <th className="py-1 pr-2">{t('agenda.volunteerQgColProfile') || 'Profil'}</th>
              <th className="py-1 pr-2">{t('agenda.volunteerQgColPhone') || 'Téléphone'}</th>
              <th className="py-1 pr-2">{t('agenda.volunteerQgColLogistics') || 'Repas / T-shirt'}</th>
              <th className="py-1 pr-2 whitespace-nowrap">{t('agenda.volunteerQgColArrived') || 'Arrivé'}</th>
              <th className="py-1 whitespace-nowrap">{t('agenda.volunteerQgColMealGiven') || 'Repas / Tickets remis'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-dotted border-black/25">
                <td className="py-1 pr-2 font-semibold">{r.slotLabel}</td>
                <td className="py-1 pr-2 font-bold">{r.person}</td>
                <td className="py-1 pr-2">{r.profile}</td>
                <td className="py-1 pr-2 font-mono">{r.phone || '—'}</td>
                <td className="py-1 pr-2">{r.logistics || '—'}</td>
                <td className="py-1 pr-2 font-mono font-bold">[ &nbsp; ]</td>
                <td className="py-1 font-mono font-bold">[ &nbsp; ]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
