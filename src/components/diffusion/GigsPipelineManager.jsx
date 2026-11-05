import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import { useGigsPipeline } from '../../hooks/useGigsPipeline';
import GigFormModal, { GIG_STATUSES } from './GigFormModal';
import GigDetailsModal from './GigDetailsModal';
import GigEventCreateModal from './GigEventCreateModal';
import GigQuoteGeneratorModal from './GigQuoteGeneratorModal';
import DiffusionContactsManager from './DiffusionContactsManager';
import GigsPipelineBoardView from './GigsPipelineBoardView';
import useConfirm from '../../hooks/useConfirm';
import { matchesGigStatus } from '../../utils/diffusionUtils.js';
import { HorizontalRibbonContainer } from '../navigation/HorizontalTabRibbon';
import { useTranslation } from '../LanguageContext';

export { matchesGigStatus };

/**
 * Gestionnaire principal du Pôle Diffusion (Suivi des Prestations / Engagements & Carnet d'adresses CRM).
 * Occupe 100 % de la largeur disponible sur Desktop.
 */
export default function GigsPipelineManager({ groupId, associationSettings: propAssocSettings = {}, onBack: _onBack, initialTab = 'pipeline' }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState(initialTab); // 'pipeline' | 'contacts'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const {
    gigs,
    loading,
    error,
    saving,
    createGig,
    updateGig,
    updateGigStatus,
    deleteGig
  } = useGigsPipeline(groupId);

  const [associationSettings, setAssociationSettings] = useState(propAssocSettings);

  // Synchronisation en temps réel des paramètres de l'association (logo, nom, siret, mentions)
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsub = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAssociationSettings(docSnap.data());
      }
    }, (err) => {
      console.warn("GigsPipelineManager - Erreur lecture paramètres association :", err);
    });
    return () => unsub();
  }, [groupId]);

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'table'
  const [filterStatus, setFilterStatus] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);

  // Synchronisation temps réel du dossier actif avec le flux Firestore
  const activeGig = gigs.find((g) => g.id === selectedGig?.id) || selectedGig;

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  // Filtrage des dossiers avec tolérance des variantes de statut
  const filteredGigs = gigs.filter(gig => {
    if (filterStatus !== 'all' && !matchesGigStatus(gig.status, filterStatus)) return false;
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
    return g.nextRelanceDate <= today && g.status !== '6_paye' && g.status !== '6_valide' && g.status !== '7_annule';
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
    const isOk = await confirm(`Voulez-vous vraiment supprimer le dossier "${eventName}" ?`);
    if (isOk) {
      try {
        await deleteGig(gigId);
      } catch (err) {
        alert(err.message || "Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left select-none w-full max-w-none">
      {/* Barre de navigation interne Cordel : Pipeline vs Contacts CRM sous forme de ruban défilant pleine largeur */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-2 w-full">
        <div className="flex items-center min-w-0 flex-1 max-w-full overflow-hidden lg:overflow-visible">
          <HorizontalRibbonContainer activeTabId={activeTab} className="flex-1">
            <button
              type="button"
              data-tab-id="pipeline"
              data-tab-active={activeTab === 'pipeline' ? 'true' : 'false'}
              onClick={() => setActiveTab('pipeline')}
              className={`shrink-0 whitespace-nowrap min-h-[40px] px-3.5 py-1.5 text-sm font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'pipeline'
                  ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-[2px_2px_0px_0px_#181716] translate-x-[0.5px] translate-y-[0.5px]'
                  : 'bg-cordel-card-bg text-encre-noire/75 border-encre-noire/40 hover:border-encre-noire hover:text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              }`}
            >
              <span>🎯</span>
              <span>{t('diffusion.tabPipeline')}</span>
            </button>

            <button
              type="button"
              data-tab-id="contacts"
              data-tab-active={activeTab === 'contacts' ? 'true' : 'false'}
              onClick={() => setActiveTab('contacts')}
              className={`shrink-0 whitespace-nowrap min-h-[40px] px-3.5 py-1.5 text-sm font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                activeTab === 'contacts'
                  ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-[2px_2px_0px_0px_#181716] translate-x-[0.5px] translate-y-[0.5px]'
                  : 'bg-cordel-card-bg text-encre-noire/75 border-encre-noire/40 hover:border-encre-noire hover:text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              }`}
            >
              <span>📇</span>
              <span>{t('diffusion.tabCrm')}</span>
            </button>
          </HorizontalRibbonContainer>
        </div>

        {activeTab === 'pipeline' && (
          <button
            type="button"
            data-tour="gigs-add-button"
            onClick={handleOpenCreate}
            className="text-xs font-black uppercase bg-cordel-vert text-white border border-encre-noire px-3.5 py-1.5 min-h-[38px] rounded shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>{t('diffusion.btnNewDossier')}</span>
          </button>
        )}
      </div>

      {activeTab === 'contacts' ? (
        <DiffusionContactsManager groupId={groupId} associationSettings={associationSettings} />
      ) : (
        <>
          {/* Introduction explicative pleine largeur */}
          <div className="w-full text-xs text-encre-noire dark:text-cordel-bg-light opacity-85 border border-dashed border-cordel-master-dark/30 p-3.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
            🤝 {t('diffusion.bannerDesc')}
          </div>

          {/* Synthèse des 3 chiffres clés pleine largeur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-stone-200">
              <span className="text-[10px] font-extrabold uppercase text-stone-500">{t('diffusion.metricActiveDossiers')}</span>
              <span className="text-lg font-black text-cordel-wood font-mono">
                {totalActifs === 1 ? t('diffusion.metricDossiersCount', { count: totalActifs }) : t('diffusion.metricDossiersCountPlural', { count: totalActifs })}
              </span>
            </CordelCard>

            <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-emerald-300">
              <span className="text-[10px] font-extrabold uppercase text-emerald-900">{t('diffusion.metricCommittedAmount')}</span>
              <span className="text-lg font-black text-emerald-800 font-mono">
                {montantTotalEngage.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </CordelCard>

            <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-amber-300">
              <span className="text-[10px] font-extrabold uppercase text-amber-900">{t('diffusion.metricFollowUps')}</span>
              <span className="text-lg font-black text-amber-800 font-mono">
                {relancesDuesCount === 1 ? t('diffusion.metricFollowUpsCount', { count: relancesDuesCount }) : t('diffusion.metricFollowUpsCountPlural', { count: relancesDuesCount })}
              </span>
            </CordelCard>
          </div>

          {/* Barre d'actions & Commutateur de Vue (Kanban / Tableau) pleine largeur */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-100 border border-stone-200 rounded w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-stone-600">{t('diffusion.displayModeLabel')}</span>
              <div className="flex rounded border border-stone-300 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer transition-all ${
                    viewMode === 'kanban' ? 'bg-cordel-wood text-white' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  📊 {t('diffusion.viewSteps')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer transition-all ${
                    viewMode === 'table' ? 'bg-cordel-wood text-white' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  📋 {t('diffusion.viewTable')}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-stone-600">{t('diffusion.filterByStep')}</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 border border-stone-300 rounded bg-white cursor-pointer"
              >
                <option value="all">{t('diffusion.allSteps')}</option>
                {GIG_STATUSES.map(st => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contenu Principal (Kanban ou Tableau) */}
          <GigsPipelineBoardView
            gigs={gigs}
            filteredGigs={filteredGigs}
            loading={loading}
            error={error}
            saving={saving}
            viewMode={viewMode}
            filterStatus={filterStatus}
            onOpenDetails={handleOpenDetails}
            onOpenEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      {/* Modale de Création / Modification */}
      <GigFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingGig}
        saving={saving}
        groupId={groupId}
      />

      {/* Notification Toast interactive */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow-2xl border border-emerald-300 animate-bounce flex items-center gap-2">
          <span>✅</span>
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Modale de Détails & Actions de Workflow */}
      <GigDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        gig={activeGig}
        associationSettings={associationSettings}
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
        onOpenAgendaOptionModal={(gig) => {
          setSelectedGig(gig);
          setIsOptionModalOpen(true);
        }}
        onOpenQuoteGeneratorModal={(gig) => {
          setSelectedGig(gig);
          setIsQuoteModalOpen(true);
        }}
        onEditGig={(gigToEdit) => {
          setIsDetailsOpen(false);
          handleOpenEdit(gigToEdit);
        }}
        onUpdateGig={updateGig}
        saving={saving}
      />

      {/* Modale Officielle de Création d'Événement de l'Agenda */}
      <GigEventCreateModal
        isOpen={isOptionModalOpen}
        onClose={() => {
          setIsOptionModalOpen(false);
          if (activeGig) {
            setIsDetailsOpen(true);
          }
        }}
        gig={activeGig}
        groupId={groupId}
        onSuccess={() => {
          setToastNotification("Événement créé avec succès et option posée dans le pipeline Diffusion !");
          setTimeout(() => setToastNotification(null), 5000);
          if (activeGig) {
            setIsDetailsOpen(true);
          }
        }}
      />

      {/* Modale de Génération de Devis PDF commercial du Pôle Diffusion */}
      <GigQuoteGeneratorModal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          if (activeGig) {
            setIsDetailsOpen(true);
          }
        }}
        gig={activeGig}
        groupId={groupId}
        associationSettings={associationSettings}
        onSuccess={(devisNum) => {
          setToastNotification(`Devis ${devisNum} généré et statut du dossier mis à jour (Devis émis) !`);
          setTimeout(() => setToastNotification(null), 5000);
          if (activeGig) {
            setIsDetailsOpen(true);
          }
        }}
      />
    </div>
  );
}
