import React, { useState, useEffect, useMemo } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloCaixa, XiloChisel } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import { useInventoryData } from '../hooks/useInventoryData';
import { useSuppliesData } from '../hooks/useSuppliesData';
import { useAssociationSettings } from '../hooks/useAssociationSettings';

// Sous-composants d'inventaire
import InventoryFilterBar from './inventory/InventoryFilterBar';
import InventoryItemCard from './inventory/InventoryItemCard';
import InventoryPartsView from './inventory/InventoryPartsView';
import InventoryProjectsView from './inventory/InventoryProjectsView';
import SuppliesListView from './inventory/SuppliesListView';
import WorkshopToolsListView from './inventory/WorkshopToolsListView';
import RepairDiagnosticModal from './inventory/RepairDiagnosticModal';
import InventoryMovementsBanner from './inventory/InventoryMovementsBanner';
import InstrumentsDataTable from './inventory/InstrumentsDataTable';
import InstrumentEditModal from './inventory/InstrumentEditModal';

// Blocs de configuration logistique
import InstrumentsCatalogBlock from './association-settings/blocks/InstrumentsCatalogBlock';
import AccessoriesKitsBlock from './association-settings/blocks/AccessoriesKitsBlock';
import CarpoolBlock from './association-settings/blocks/CarpoolBlock';

import { getKitCompletionRatio, getKitCompletionText } from './inventory/inventoryConstants';

/**
 * Gestionnaire et routeur d'onglets pour le parc d'instruments, les kits,
 * les pièces détachées, l'atelier et les matières premières.
 */
export default function InventoryManager({ 
  groupId, 
  onBack, 
  role, 
  isSystemAdmin, 
  hasAccessLogistique, 
  hasAccessLutherie,
  profileData,
  activeTabProp,
  hideSubTabs = false,
  onNavigateToView
}) {
  const { t } = useTranslation();
  const shouldShowSubTabs = !hideSubTabs && !activeTabProp;

  // Contrôle RBAC : Mestre, Super-Admin, Admin Système, Accès Logistique ou Accès Lutherie
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessLogistique === true || hasAccessLutherie === true;

  const { 
    formData: settings = {}, 
    saving: savingSettings, 
    handleSave: handleSaveSettings, 
    handleChange: handleUpdateSetting 
  } = useAssociationSettings(groupId, isAuthorized, onBack, t);

  const {
    supplies, 
    tools, 
    loading: suppliesLoading,
    addSupply, 
    updateSupply, 
    deleteSupply, 
    adjustSupplyStock,
    addTool, 
    updateTool, 
    deleteTool
  } = useSuppliesData(groupId, 'lutherie');

  const [activeTab, setActiveTab] = useState(activeTabProp || 'instruments');

  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  const [diagnosticInstrument, setDiagnosticInstrument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'nom', direction: 'asc' });

  // Hook centralisé de données d'inventaire
  const {
    instruments,
    instrumentModels,
    usersList,
    usersMap,
    loading,
    saving,
    isFormOpen,
    setIsFormOpen,
    editingId,
    formData,
    setFormData,
    handleOpenAdd,
    handleOpenEdit,
    handleApproveMovement,
    handleRejectMovement,
    handleInlineFieldChange,
    handleAssignBorrower,
    handleReturnInstrument,
    handleSaveWithSupplies,
    handleDeleteWithSupplies,
    handleExportCSV,

    // Pièces détachées
    inventoryParts,
    isPartFormOpen,
    setIsPartFormOpen,
    editingPartId,
    partFormData,
    setPartFormData,
    handleOpenPartAdd,
    handleOpenPartEdit,
    handleSavePart,
    handleDeletePart,
    handleSplitPart
  } = useInventoryData(groupId, isAuthorized, t);

  // Mouvements d'emprunt/restitution en attente de confirmation
  const pendingMovements = useMemo(
    () => instruments.filter((inst) => inst.pendingMovement),
    [instruments]
  );

  // Filtrage des instruments selon la recherche et la catégorie
  const filteredInstruments = useMemo(() => {
    return instruments.filter((inst) => {
      // Filtre catégorie
      if (filter === 'association' && inst.proprietaire !== 'Association') return false;
      if (filter === 'personal' && inst.proprietaire === 'Association') return false;
      if (filter === 'repair' && inst.etat !== 'À réparer' && inst.etat !== 'Para consertar') return false;

      // Filtre recherche textuelle
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nom = (inst.nom || '').toLowerCase();
        const type = (inst.type || '').toLowerCase();
        const prop = (inst.proprietaire !== 'Association' ? usersMap[inst.proprietaire] || '' : 'association').toLowerCase();
        const emprunteur = (inst.borrowedBy ? usersMap[inst.borrowedBy] || '' : '').toLowerCase();
        return nom.includes(q) || type.includes(q) || prop.includes(q) || emprunteur.includes(q);
      }
      return true;
    });
  }, [instruments, filter, searchQuery, usersMap]);

  // Tri dynamique des instruments filtrés
  const sortedInstruments = useMemo(() => {
    const list = [...filteredInstruments];
    if (!sortConfig.key) return list;

    return list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortConfig.key) {
        case 'nom':
          valA = a.nom || '';
          valB = b.nom || '';
          break;
        case 'type':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'proprietaire':
          valA = a.proprietaire !== 'Association' ? (usersMap[a.proprietaire] || '') : 'Association';
          valB = b.proprietaire !== 'Association' ? (usersMap[b.proprietaire] || '') : 'Association';
          break;
        case 'localisation':
          valA = a.localisationPhysique !== 'Local' ? (usersMap[a.localisationPhysique] || 'Chez un membre') : 'Local';
          valB = b.localisationPhysique !== 'Local' ? (usersMap[b.localisationPhysique] || 'Chez un membre') : 'Local';
          break;
        case 'etat':
          valA = a.etat || '';
          valB = b.etat || '';
          break;
        case 'status':
          valA = a.status || 'En stock';
          valB = b.status || 'En stock';
          break;
        case 'assignations':
          valA = (a.assignations || []).length;
          valB = (b.assignations || []).length;
          break;
        case 'kit':
          valA = getKitCompletionRatio(a, settings?.logisticsKits);
          valB = getKitCompletionRatio(b, settings?.logisticsKits);
          break;
        default:
          valA = a[sortConfig.key] || '';
          valB = b[sortConfig.key] || '';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? comp : -comp;
    });
  }, [filteredInstruments, sortConfig, usersMap, settings?.logisticsKits]);

  const handleSortHeaderClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignationToggle = (userId) => {
    setFormData((prev) => {
      const copy = [...(prev.assignations || [])];
      const index = copy.indexOf(userId);
      if (index > -1) {
        copy.splice(index, 1);
      } else {
        copy.push(userId);
      }
      return { ...prev, assignations: copy };
    });
  };

  // Écran d'accès refusé si non autorisé
  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 {(t && t('layoutEditor.accessDenied')) || "Accès réservé"}</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {(t && t('inventory.accessDeniedDesc')) || "Vous n'avez pas les droits nécessaires pour accéder à l'inventaire logistique."}
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ← {(t && t('common.back')) || "Retour"}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Barre d'en-tête de vue */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
        <button 
          type="button" 
          onClick={onBack} 
          disabled={saving}
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
        >
          ← {(t && t('common.back')) || "Retour"}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-1">
          {activeTab === 'pupitres' ? (
            <><XiloCaixa size={14} /> {(t && t('tabLogisticsPupitres')) || "Pupitres"}</>
          ) : activeTab === 'kits' ? (
            <>🎒 {(t && t('tabLogisticsKits')) || "Accessoires & Kits"}</>
          ) : activeTab === 'carpool' ? (
            <>🚗 {(t && t('tabLogisticsCarpool')) || "Covoiturage & Convois"}</>
          ) : activeTab === 'projects' ? (
            <><XiloChisel size={14} /> {(t && t('tabInventoryProjects')) || "Établi & Chantiers"}</>
          ) : activeTab === 'parts' ? (
            <><XiloChisel size={14} /> {(t && t('tabInventoryParts')) || "Pièces Détachées"}</>
          ) : activeTab === 'supplies' ? (
            <><XiloChisel size={14} /> {(t && t('tabInventorySupplies')) || "Matières Premières"}</>
          ) : activeTab === 'tools' ? (
            <><XiloChisel size={14} /> {(t && t('tabWorkshopTools')) || "Outillage"}</>
          ) : (
            <><XiloCaixa size={14} /> {(t && (t('tabInventory') || t('inventory.title'))) || "Instruments"}</>
          )}
        </h2>
      </div>

      {/* Barre de sous-onglets logistiques */}
      {shouldShowSubTabs && (
        <div className="border-b-2 border-cordel-master-dark/20">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'instruments', label: 'Instruments' },
              { id: 'pupitres', label: 'Pupitres' },
              { id: 'kits', label: 'Kits & Accessoires' },
              { id: 'carpool', label: 'Covoiturage & Convois' },
              { id: 'parts', label: 'Pièces Détachées' },
              { id: 'projects', label: 'Projets' },
              { id: 'supplies', label: 'Matières Premières' },
              { id: 'tools', label: 'Outillage' }
            ].map((tabItem) => (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setActiveTab(tabItem.id)}
                className={`px-4 py-2.5 font-extrabold uppercase tracking-widest text-[10px] transition-colors rounded-t-lg border-b-2 cursor-pointer ${
                  activeTab === tabItem.id
                    ? 'bg-cordel-bg text-cordel-wood border-cordel-wood shadow-xs'
                    : 'text-cordel-master-dark hover:text-cordel-wood border-transparent hover:bg-white/30'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET : INSTRUMENTS */}
      <div className={activeTab === 'instruments' ? 'block' : 'hidden'}>
        <InventoryMovementsBanner 
          pendingMovements={pendingMovements}
          usersMap={usersMap}
          onApproveMovement={handleApproveMovement}
          onRejectMovement={handleRejectMovement}
        />

        <div className="flex flex-col gap-4">
          <InventoryFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filter={filter}
            setFilter={setFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenAdd={handleOpenAdd}
            onExportCSV={() => handleExportCSV(sortedInstruments, usersMap)}
            t={t}
          />

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement de l'inventaire...</span>
            </div>
          ) : sortedInstruments.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs font-bold opacity-75">
                {(t && t('inventory.noInstrumentsFilter')) || "Aucun instrument trouvé pour ce filtre."}
              </p>
            </CordelCard>
          ) : viewMode === 'table' ? (
            <InstrumentsDataTable 
              instruments={sortedInstruments}
              usersList={usersList}
              usersMap={usersMap}
              sortConfig={sortConfig}
              onSortHeaderClick={handleSortHeaderClick}
              onInlineFieldChange={handleInlineFieldChange}
              onAssignBorrower={handleAssignBorrower}
              onReturnInstrument={handleReturnInstrument}
              onOpenEdit={handleOpenEdit}
              onDelete={(id) => handleDeleteWithSupplies(id, supplies)}
              onDiagnose={setDiagnosticInstrument}
              logisticsKits={settings?.logisticsKits}
              t={t}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedInstruments.map((inst) => (
                <InventoryItemCard
                  key={inst.id}
                  item={inst}
                  usersMap={usersMap}
                  onEdit={handleOpenEdit}
                  onDelete={(id) => handleDeleteWithSupplies(id, supplies)}
                  onToggleBorrow={handleInlineFieldChange}
                  onDiagnose={setDiagnosticInstrument}
                  inventoryParts={inventoryParts}
                  kitCompletionText={getKitCompletionText(inst, settings?.logisticsKits)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALE D'ÉDITION COMPLETE DE L'INSTRUMENT */}
      <InstrumentEditModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onInputChange={handleInputChange}
        onAssignationToggle={handleAssignationToggle}
        onSave={(e) => handleSaveWithSupplies(e, supplies)}
        onDelete={(id) => handleDeleteWithSupplies(id, supplies)}
        saving={saving}
        usersList={usersList}
        instrumentModels={instrumentModels}
        inventoryParts={inventoryParts}
        logisticsKits={settings?.logisticsKits}
        supplies={supplies}
        t={t}
      />

      {/* MODALE DE DIAGNOSTIC ATELIER */}
      {diagnosticInstrument && (
        <RepairDiagnosticModal
          instrument={diagnosticInstrument}
          inventoryParts={inventoryParts}
          instrumentModels={instrumentModels}
          onClose={() => setDiagnosticInstrument(null)}
          t={t}
        />
      )}

      {/* ONGLET : PIÈCES DÉTACHÉES */}
      {activeTab === 'parts' && (
        <InventoryPartsView
          groupId={groupId}
          instruments={instruments}
          inventoryParts={inventoryParts}
          instrumentModels={instrumentModels}
          isPartFormOpen={isPartFormOpen}
          setIsPartFormOpen={setIsPartFormOpen}
          editingPartId={editingPartId}
          partFormData={partFormData}
          handlePartInputChange={(e) => {
            const { name, value } = e.target;
            setPartFormData((prev) => ({ ...prev, [name]: value }));
          }}
          handleOpenPartAdd={handleOpenPartAdd}
          handleOpenPartEdit={handleOpenPartEdit}
          handleSavePart={handleSavePart}
          handleDeletePart={handleDeletePart}
          handleSplitPart={handleSplitPart}
          saving={saving}
          t={t}
        />
      )}

      {/* ONGLET : PROJETS D'ATELIER */}
      <div className={activeTab === 'projects' ? 'block' : 'hidden'}>
        <InventoryProjectsView 
          groupId={groupId} 
          isAuthorized={isAuthorized} 
          profileData={profileData}
          t={t} 
          inventoryParts={inventoryParts}
          onNavigateToView={onNavigateToView}
          onCreateInstrument={async (instData) => {
            try {
              if (instData) {
                setFormData(instData);
                handleOpenAdd();
              }
              return true;
            } catch {
              return false;
            }
          }}
        />
      </div>

      {/* ONGLET : MATIÈRES PREMIÈRES */}
      {activeTab === 'supplies' && (
        <div className="bg-cordel-bg p-4 rounded-b-lg border-x-2 border-b-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716]">
          <SuppliesListView 
            supplies={supplies} 
            loading={suppliesLoading} 
            addSupply={addSupply} 
            updateSupply={updateSupply} 
            deleteSupply={deleteSupply} 
            adjustSupplyStock={adjustSupplyStock}
            domaine="lutherie"
            models={instrumentModels}
          />
        </div>
      )}

      {/* ONGLET : OUTILLAGE */}
      {activeTab === 'tools' && (
        <div className="bg-cordel-bg p-4 rounded-b-lg border-x-2 border-b-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716]">
          <WorkshopToolsListView 
            tools={tools} 
            loading={suppliesLoading} 
            addTool={addTool} 
            updateTool={updateTool} 
            deleteTool={deleteTool} 
            domaine="lutherie"
            models={instrumentModels}
            membersList={usersList}
          />
        </div>
      )}

      {/* ONGLET : GESTION DES PUPITRES ET CATALOGUE */}
      {activeTab === 'pupitres' && (
        <div className="bg-cordel-bg p-5 rounded-b-lg border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] flex flex-col gap-4 text-left">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">
              🎺 Gestion des Pupitres & Catalogue des Instruments
            </h3>
            <p className="text-[10px] text-cordel-master-dark/75 leading-relaxed">
              Configurez les familles de pupitres, les attributions de couleurs et les modèles du parc instrumental.
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="flex flex-col gap-4">
            <InstrumentsCatalogBlock 
              formData={settings}
              handleChange={handleUpdateSetting}
              saving={savingSettings}
              t={t}
            />
            <div className="flex justify-end pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer les Pupitres"}
              </CordelButton>
            </div>
          </form>
        </div>
      )}

      {/* ONGLET : KITS ET ACCESSOIRES LOGISTIQUE */}
      {activeTab === 'kits' && (
        <div className="bg-cordel-bg p-5 rounded-b-lg border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] flex flex-col gap-4 text-left">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">
              🎒 Gestion des Kits & Accessoires Logistiques
            </h3>
            <p className="text-[10px] text-cordel-master-dark/75 leading-relaxed">
              Configurez les kits de transport, housses, mailloches, sangles et accessoires opérationnels par pupitre.
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="flex flex-col gap-4">
            <AccessoriesKitsBlock 
              formData={settings}
              handleChange={handleUpdateSetting}
              saving={savingSettings}
              t={t}
              groupId={groupId}
              supplies={supplies}
            />
            <div className="flex justify-end pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer les Kits"}
              </CordelButton>
            </div>
          </form>
        </div>
      )}

      {/* ONGLET : COVOITURAGE & CONVOIS */}
      {activeTab === 'carpool' && (
        <div className="bg-cordel-bg p-5 rounded-b-lg border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] flex flex-col gap-4 text-left">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">
              🚗 Configuration Covoiturage & Convois
            </h3>
            <p className="text-[10px] text-cordel-master-dark/75 leading-relaxed">
              Définissez le barème kilométrique, le point de rassemblement habituel pour les départs en convoi et les règles de calcul.
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="flex flex-col gap-4">
            <CarpoolBlock 
              formData={settings}
              handleChange={handleUpdateSetting}
              saving={savingSettings}
              groupId={groupId}
            />
            <div className="flex justify-end pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer les Paramètres Covoiturage"}
              </CordelButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
