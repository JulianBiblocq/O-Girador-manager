import React from 'react';
import CordelCard from '../CordelCard';
import { GIG_STATUSES } from './GigFormModal';
import { matchesGigStatus } from '../../utils/diffusionUtils';
import { useTranslation } from '../LanguageContext';

/**
 * Vue Kanban (colonnes par étape) et Tableau des dossiers du Pipeline Diffusion.
 * Occupe 100 % de la largeur disponible sur Desktop.
 */
export default function GigsPipelineBoardView({
  gigs,
  filteredGigs,
  loading,
  error,
  saving,
  viewMode,
  filterStatus,
  onOpenDetails,
  onOpenEdit,
  onDelete
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-bold animate-pulse text-stone-500 w-full">
        ⏳ Chargement des dossiers de prestations...
      </div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-xs font-bold text-red-600 w-full">{error}</div>;
  }

  if (filteredGigs.length === 0) {
    return (
      <div className="py-12 text-center text-xs italic text-stone-500 bg-white p-6 rounded border border-dashed w-full" data-tour="gigs-kanban-board">
        {t('diffusion.emptyDossiersNotice')}
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <div className="w-full max-w-full overflow-x-auto pb-4" data-tour="gigs-kanban-board">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-w-[750px] w-full">
          {GIG_STATUSES.filter(st => filterStatus === 'all' || filterStatus === st.id).map(statusObj => {
            const statusGigs = gigs.filter(g => matchesGigStatus(g.status, statusObj.id));

            return (
              <div key={statusObj.id} className="flex flex-col gap-2 bg-stone-100/70 p-3 rounded-lg border border-stone-200 min-w-[220px]">
                {/* En-tête de Colonne */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-300">
                  <h4 className="text-[11px] font-extrabold uppercase text-stone-800 flex items-center gap-1">
                    <span>{statusObj.label}</span>
                  </h4>
                  <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">
                    {statusGigs.length}
                  </span>
                </div>

                {/* Cartes dans la colonne */}
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {statusGigs.length === 0 ? (
                    <div className="text-[10px] italic text-stone-400 py-6 text-center">
                      Aucun dossier
                    </div>
                  ) : (
                    statusGigs.map(gig => (
                      <div
                        key={gig.id}
                        onClick={() => onOpenDetails(gig)}
                        className="bg-white p-3 rounded border border-stone-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-1.5 text-left border-l-4 border-l-cordel-wood"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-xs font-black text-stone-900 leading-snug">{gig.eventName}</h5>
                        </div>

                        {gig.organizer && (
                          <span className="text-[10px] font-semibold text-stone-600">🏢 {gig.organizer}</span>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                          <span>📅 {gig.date || 'À définir'}</span>
                          <span className="font-mono font-extrabold text-cordel-wood">
                            {(parseFloat(gig.amount) || 0).toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg w-full">
      <div className="flex flex-col gap-2 overflow-x-auto w-full max-w-full">
        {/* En-tête de la Table */}
        <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-2 min-w-[700px] px-1">
          <div className="col-span-3 text-left">Événement & Organisateur</div>
          <div className="col-span-2 text-left">Date & Lieu</div>
          <div className="col-span-2 text-right">Budget (€)</div>
          <div className="col-span-2 text-center">Étape Statut</div>
          <div className="col-span-2 text-left">Prochaine relance</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {/* Lignes de la Table */}
        <div className="flex flex-col gap-1.5 min-w-[700px] max-h-[500px] overflow-y-auto pr-1">
          {filteredGigs.map(gig => {
            const statusObj = GIG_STATUSES.find(s => s.id === gig.status) || GIG_STATUSES[0];

            return (
              <div
                key={gig.id}
                className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-stone-200 py-2 px-1 hover:bg-stone-50/80 rounded"
              >
                <div className="col-span-3 text-left flex flex-col">
                  <span className="font-bold text-stone-900">{gig.eventName}</span>
                  {gig.organizer && <span className="text-[10px] text-stone-500">🏢 {gig.organizer}</span>}
                </div>

                <div className="col-span-2 text-left text-[11px] text-stone-700">
                  <div>📅 {gig.date || '-'}</div>
                  <div className="text-[10px] text-stone-500 truncate">{gig.location}</div>
                </div>

                <div className="col-span-2 text-right font-mono font-bold text-stone-900">
                  {(parseFloat(gig.amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${statusObj.color}`}>
                    {statusObj.label}
                  </span>
                </div>

                <div className="col-span-2 text-left font-mono text-[11px] text-amber-900 font-semibold">
                  {gig.nextRelanceDate ? `⏰ ${gig.nextRelanceDate}` : '-'}
                </div>

                <div className="col-span-1 flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(gig)}
                    className="text-stone-700 hover:text-black font-bold text-xs cursor-pointer"
                    title="Voir détails"
                  >
                    🔍
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEdit(gig)}
                    disabled={saving}
                    className="text-stone-700 hover:text-black font-bold text-xs cursor-pointer"
                    title="Éditer"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(gig.id, gig.eventName)}
                    disabled={saving}
                    className="text-red-700 hover:text-red-900 font-bold text-xs cursor-pointer"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CordelCard>
  );
}

