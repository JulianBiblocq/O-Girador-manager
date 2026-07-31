import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useGigsPipeline } from '../../hooks/useGigsPipeline';
import GigFormModal, { GIG_STATUSES } from './GigFormModal';
import GigDetailsModal from './GigDetailsModal';

export default function GigsPipelineManager({ groupId, onBack }) {
  const {
    gigs,
    loading,
    error,
    saving,
    createGig,
    updateGig,
    updateGigStatus,
    createAgendaOption,
    deleteGig
  } = useGigsPipeline(groupId);

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'table'
  const [filterStatus, setFilterStatus] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);

  // Filtrage des dossiers
  const filteredGigs = gigs.filter(gig => {
    if (filterStatus !== 'all' && gig.status !== filterStatus) return false;
    return true;
  });

  // Calculs des statistiques du Pipeline
  const totalActifs = gigs.filter(g => g.status !== '7_annule').length;
  const montantTotalEngage = gigs
    .filter(g => g.status !== '7_annule')
    .reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);

  const relancesDuesCount = gigs.filter(g => {
    if (!g.nextRelanceDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return g.nextRelanceDate <= today && g.status !== '6_valide' && g.status !== '7_annule';
  }).length;

  // Modales
  const handleOpenCreate = () => {
    setEditingGig(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (gig) => {
    setEditingGig(gig);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (gig) => {
    setSelectedGig(gig);
    setIsDetailsOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingGig) {
        await updateGig(editingGig.id, formData);
        alert("Dossier de prestation mis à jour avec succès !");
      } else {
        await createGig(formData);
        alert("Nouveau dossier de prestation créé avec succès !");
      }
      setIsFormOpen(false);
    } catch (err) {
      alert(err.message || "Erreur lors de la sauvegarde.");
    }
  };

  const handleDelete = async (gigId, eventName) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le dossier "${eventName}" ?`)) {
      try {
        await deleteGig(gigId);
      } catch (err) {
        alert(err.message || "Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-5xl mx-auto w-full">
      {/* En-tête du Pôle Diffusion */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              type="button" 
              onClick={onBack} 
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-95 cursor-pointer"
            >
              ⬅️ Retour
            </button>
          )}
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <span>🎷 Pôle Diffusion — Suivi des Prestations (Pipeline CRM)</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="text-xs font-black uppercase bg-cordel-vert text-white border border-encre-noire px-3.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span>➕ Nouveau dossier</span>
        </button>
      </div>

      {/* Introduction explicative */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-85 border border-dashed border-cordel-master-dark/30 p-3.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        🤝 <strong>Pôle Diffusion (Produção) :</strong> Centralisez et suivez en équipe les opportunités de concerts et prestations. Visualisez l'avancement de chaque dossier dans l'entonnoir (demande, option, devis, contrat, facturation).
      </div>

      {/* Synthèse des chiffres clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-stone-200">
          <span className="text-[10px] font-extrabold uppercase text-stone-500">Dossiers Actifs</span>
          <span className="text-lg font-black text-cordel-wood font-mono">{totalActifs} dossiers</span>
        </CordelCard>

        <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-emerald-300">
          <span className="text-[10px] font-extrabold uppercase text-emerald-900">Montant Engagé (Pipeline)</span>
          <span className="text-lg font-black text-emerald-800 font-mono">
            {montantTotalEngage.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </CordelCard>

        <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-amber-300">
          <span className="text-[10px] font-extrabold uppercase text-amber-900">Relances à Effectuer</span>
          <span className="text-lg font-black text-amber-800 font-mono">{relancesDuesCount} relance(s)</span>
        </CordelCard>
      </div>

      {/* Barre d'actions & Commutateur de Vue (Kanban / Tableau) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-100 border border-stone-200 rounded">
        {/* Choix de vue */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-stone-600">Mode d'affichage :</span>
          <div className="flex rounded border border-stone-300 overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer transition-all ${
                viewMode === 'kanban' ? 'bg-cordel-wood text-white' : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              📊 Vue par étapes
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-cordel-wood text-white' : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              📋 Vue Tableau
            </button>
          </div>
        </div>

        {/* Filtre par Statut */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-stone-600">Filtrer par étape :</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-bold px-2.5 py-1 border border-stone-300 rounded bg-white cursor-pointer"
          >
            <option value="all">Toutes les étapes</option>
            {GIG_STATUSES.map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenu Principal (Kanban ou Tableau) */}
      {loading ? (
        <div className="py-12 text-center text-xs font-bold animate-pulse text-stone-500">
          ⏳ Chargement des dossiers de prestations...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-xs font-bold text-red-600">{error}</div>
      ) : filteredGigs.length === 0 ? (
        <div className="py-12 text-center text-xs italic text-stone-500 bg-white p-6 rounded border border-dashed">
          Aucun dossier de prestation trouvé. Cliquez sur "Nouveau dossier" pour démarrer.
        </div>
      ) : viewMode === 'kanban' ? (
        /* VUE KANBAN (COLONNES PAR ÉTAPE) */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {GIG_STATUSES.filter(st => filterStatus === 'all' || filterStatus === st.id).map(statusObj => {
            const statusGigs = gigs.filter(g => g.status === statusObj.id);

            return (
              <div key={statusObj.id} className="flex flex-col gap-2 bg-stone-100/70 p-3 rounded-lg border border-stone-200 min-w-[240px]">
                {/* Entête de Colonne */}
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
                        onClick={() => handleOpenDetails(gig)}
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
      ) : (
        /* VUE TABLEAU (DATA-TABLE) */
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg">
          <div className="flex flex-col gap-2 overflow-x-auto">
            {/* Header de la Table */}
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
                        onClick={() => handleOpenDetails(gig)}
                        className="text-stone-700 hover:text-black font-bold text-xs cursor-pointer"
                        title="Voir détails"
                      >
                        🔍
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(gig)}
                        disabled={saving}
                        className="text-stone-700 hover:text-black font-bold text-xs cursor-pointer"
                        title="Éditer"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(gig.id, gig.eventName)}
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
      )}

      {/* Modale de Création / Modification */}
      <GigFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingGig}
        saving={saving}
      />

      {/* Modale de Détails & Actions de Workflow */}
      <GigDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        gig={selectedGig}
        onStatusChange={async (gigId, newStatus) => {
          try {
            await updateGigStatus(gigId, newStatus);
            setSelectedGig(prev => prev ? { ...prev, status: newStatus } : null);
          } catch (err) {
            alert(err.message);
          }
        }}
        onDeleteGig={async (gigId) => {
          await deleteGig(gigId);
          setIsDetailsOpen(false);
        }}
        onCreateAgendaOption={async (gig) => {
          await createAgendaOption(gig);
          setSelectedGig(prev => prev ? { ...prev, status: '2_option' } : null);
        }}
        saving={saving}
      />
    </div>
  );
}
