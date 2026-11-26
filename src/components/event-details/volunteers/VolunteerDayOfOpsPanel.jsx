import React, { useMemo } from 'react';
import VolunteerKeyContactsCard from './VolunteerKeyContactsCard';
import RoadbookVolunteersPrintSheet from './RoadbookVolunteersPrintSheet';
import { buildVolunteersAndLogisticsCsvData } from '../../../utils/volunteerCsvExportUtils';

/**
 * Sous-vue 4 de l'onglet Bénévoles (« 🎪 Accueil Jour J & Exports ») :
 * numéros utiles, compteurs dédoublonnés Repas/Allergies & Tailles T-shirts,
 * Mémos Jour J / Remerciements, Export CSV et Impression A4 directe de la feuille d'émargement.
 */
export default function VolunteerDayOfOpsPanel({
  event = {},
  commissions = [],
  consolidatedShifts = [],
  acceptedApplications = [],
  allUsers = [],
  onOpenDispatchModal,
  onExportCsv,
  tr
}) {
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  const summary = useMemo(
    () => buildVolunteersAndLogisticsCsvData({ event, consolidatedShifts, acceptedApplications, allUsers }),
    [event, consolidatedShifts, acceptedApplications, allUsers]
  );

  const tshirtEntries = Object.entries(summary.tshirtCounts || {}).sort(([a], [b]) => a.localeCompare(b));

  const handlePrintSheet = () => {
    document.body.classList.add('printing-vol-qg-sheet');
    const cleanup = () => {
      document.body.classList.remove('printing-vol-qg-sheet');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2000);
  };

  return (
    <div className="flex flex-col gap-3.5 text-left">
      <style>{`
        @media print {
          body.printing-vol-qg-sheet * { visibility: hidden !important; }
          body.printing-vol-qg-sheet .vol-qg-print-area, body.printing-vol-qg-sheet .vol-qg-print-area * { visibility: visible !important; }
          body.printing-vol-qg-sheet .vol-qg-print-area {
            position: fixed !important; inset: 0 !important; width: 100% !important;
            background: #fff !important; color: #000 !important; padding: 8mm !important; display: block !important;
          }
        }
      `}</style>

      {/* Barre d'actions Accueil Jour J & Exports */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/35">
        {acceptedApplications.length > 0 && onOpenDispatchModal && (
          <button type="button" onClick={onOpenDispatchModal} className="px-3 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--cordel-wood)] text-white text-[10.5px] font-black uppercase cursor-pointer">
            ✉️ {t('agenda.volunteerDispatchBtn') || 'Mémos Jour J & Remerciements'}
          </button>
        )}
        <button type="button" onClick={onExportCsv} className="px-3 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-[10.5px] font-black uppercase cursor-pointer">
          📥 {t('agenda.volunteerExportCsvBtn') || 'Exporter Bénévoles, Repas & T-shirts (CSV)'}
        </button>
        <button type="button" onClick={handlePrintSheet} className="px-3 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10.5px] font-black uppercase cursor-pointer">
          🖨️ {t('agenda.volunteerPrintSheetA4Btn') || "Feuille d'émargement A4"}
        </button>
      </div>

      {/* Annuaire complet des numéros utiles */}
      <VolunteerKeyContactsCard event={event} commissions={commissions} allUsers={allUsers} compact={false} tr={tr} />

      {/* Compteurs dédoublonnés Cuisine / Allergies & Tailles de T-shirts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 flex flex-col gap-2">
          <h5 className="text-[10.5px] font-black uppercase tracking-wider text-[var(--cordel-wood)]">
            🍽️ {t('agenda.volunteerMealsSummaryTitle') || 'Repas, Régimes & Allergies (dédoublonnés)'} ({summary.dietaryList.length}/{summary.uniquePeopleCount})
          </h5>
          {summary.dietaryList.length === 0 ? (
            <p className="text-[11px] italic opacity-65">{t('agenda.volunteerNoDietaryDeclared') || 'Aucun régime ou allergie spécifique signalé.'}</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {summary.dietaryList.map((d, i) => (
                <div key={i} className="px-2 py-1 rounded bg-[var(--theme-card-bg)] border border-[var(--theme-border)]/25 flex items-center justify-between gap-2">
                  <span className="font-bold truncate">{d.nomComplet} <span className="opacity-65 text-[10px]">({d.type})</span></span>
                  <span className="text-[10.5px] font-semibold text-[var(--color-cordel-rouge)] shrink-0">{d.diet}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-[var(--cordel-bg)] border border-[var(--theme-border)]/30 flex flex-col gap-2">
          <h5 className="text-[10.5px] font-black uppercase tracking-wider text-[var(--cordel-wood)]">
            👕 {t('agenda.volunteerTshirtsSummaryTitle') || 'Tailles de T-shirts (1 par bénévole unique)'}
          </h5>
          {tshirtEntries.length === 0 ? (
            <p className="text-[11px] italic opacity-65">{t('agenda.volunteerNoTshirtsDeclared') || 'Aucune taille de T-shirt renseignée.'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tshirtEntries.map(([sz, count]) => (
                <span key={sz} className="px-2.5 py-1 rounded bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] font-black text-xs">
                  {sz} : {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aperçu écran de la feuille d'émargement + cible d'impression A4 dédiée */}
      <RoadbookVolunteersPrintSheet
        event={event} commissions={commissions} allUsers={allUsers}
        acceptedApplications={acceptedApplications} isManagerOrReferent={true} isPrintMode={false}
      />
      <div className="hidden vol-qg-print-area">
        <div className="border-b-2 border-black pb-1.5 mb-2 flex justify-between items-baseline text-black">
          <h1 className="text-sm font-black uppercase m-0">{event?.titre || 'Événement'} — QG Bénévoles</h1>
          <span className="text-[9px] font-bold">{String(event?.date || '').slice(0, 10)} {event?.lieu ? `• ${event.lieu}` : ''}</span>
        </div>
        <RoadbookVolunteersPrintSheet
          event={event} commissions={commissions} allUsers={allUsers}
          acceptedApplications={acceptedApplications} isManagerOrReferent={true} isPrintMode={true}
        />
      </div>
    </div>
  );
}
