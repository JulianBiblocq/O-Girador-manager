import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose, XiloCaixa, XiloChisel } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import XiloAvatar from './XiloAvatar';
import useConfirm from '../hooks/useConfirm';
import { useInventoryData } from '../hooks/useInventoryData';
import InventoryFilterBar from './inventory/InventoryFilterBar';
import InventoryItemCard from './inventory/InventoryItemCard';
import InventoryFormModal from './inventory/InventoryFormModal';
import { useAssociationSettings } from '../hooks/useAssociationSettings';
import InstrumentsCatalogBlock from './association-settings/blocks/InstrumentsCatalogBlock';
import AccessoriesKitsBlock from './association-settings/blocks/AccessoriesKitsBlock';


const INSTRUMENT_TYPES = ['Alfaia', 'Caixa', 'Agbê', 'Gonguê', 'Mineiro', 'Apito', 'Timbal', 'Autre'];
const ETAT_OPTIONS = ['Neuf', 'Bon', 'À réparer'];

const INSTRUMENT_ICONS = {
  Alfaia: 'icones/alfaia.svg',
  Caixa: 'icones/caixa.svg',
  Agbê: 'icones/agbe.svg',
  Gonguê: 'icones/gongue.svg',
  Mineiro: 'icones/mineiro.svg',
  Apito: 'icones/apito.svg',
  Timbal: 'icones/timbal.svg',
  Autre: 'favicon.svg'
};

export default function InventoryManager({ groupId, onBack, role, isSystemAdmin, hasAccessLogistique }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const getInstrumentTypeLabel = (type) => {
    if (type === 'Autre') return t('inventory.other') || 'Autre';
    return type;
  };

  const getEtatLabel = (etat) => {
    switch (etat) {
      case 'Neuf': return t('inventory.etatNeuf') || 'Neuf';
      case 'Bon': return t('inventory.etatBon') || 'Bon';
      case 'À réparer': return t('inventory.etatRepair') || 'À réparer';
      default: return etat;
    }
  };

  // Contrôle de sécurité : Mestre, Super-Admin, Admin Système ou Accès Logistique
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessLogistique === true;

  const {
    formData: settingsData,
    handleChange: handleSettingsChange,
    handleSave: handleSaveSettings,
    saving: savingSettings
  } = useAssociationSettings(groupId, isAuthorized, onBack, t);

  const [showConfig, setShowConfig] = useState(false);

  const {
    instruments,
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
    handleSave,
    handleDelete,
    handleToggleBorrowStatus,
    handleApproveMovement,
    handleRejectMovement
  } = useInventoryData(groupId, isAuthorized, t);

  const pendingMovements = instruments.filter(inst => inst.pendingMovement);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'nom', direction: 'asc' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignationToggle = (userId) => {
    setFormData(prev => {
      const copy = [...prev.assignations];
      const index = copy.indexOf(userId);
      if (index > -1) {
        copy.splice(index, 1);
      } else {
        copy.push(userId);
      }
      return { ...prev, assignations: copy };
    });
  };

  const handleAssignBorrower = async (instId, borrowerId) => {
    if (!instId || !borrowerId) return;
    try {
      const docRef = doc(db, 'inventory', instId);
      await updateDoc(docRef, {
        status: 'Emprunté',
        borrowedBy: borrowerId
      });
    } catch (error) {
      console.error("InventoryManager - Error assigning borrower:", error);
      alert(t('common.saveError'));
    }
  };

  const handleInlineFieldChange = async (instId, fieldName, value) => {
    if (!instId || !fieldName) return;
    try {
      const docRef = doc(db, 'inventory', instId);
      await updateDoc(docRef, {
        [fieldName]: value
      });
    } catch (error) {
      console.error(`InventoryManager - Error updating ${fieldName}:`, error);
      alert(t('common.saveError') || "Erreur lors de la sauvegarde.");
    }
  };

  const handleReturnInstrument = async (instId) => {
    if (!instId) return;
    try {
      const docRef = doc(db, 'inventory', instId);
      await updateDoc(docRef, {
        status: 'En stock',
        borrowedBy: null
      });
    } catch (error) {
      console.error("InventoryManager - Error returning instrument:", error);
      alert(t('common.saveError'));
    }
  };

  const getKitCompletionText = (inst) => {
    const kit = (settingsData.logisticsKits || []).find(k => k.pupitre === inst.type);
    if (!kit || !kit.accessories || kit.accessories.length === 0) return "-";
    const checked = inst.kitChecklist || [];
    const validChecked = checked.filter(acc => kit.accessories.includes(acc)).length;
    if (validChecked === kit.accessories.length) return "Complet";
    if (validChecked === 0) return "Vide";
    return `${validChecked}/${kit.accessories.length}`;
  };

  const getKitCompletionRatio = (inst) => {
    const kit = (settingsData.logisticsKits || []).find(k => k.pupitre === inst.type);
    if (!kit || !kit.accessories || kit.accessories.length === 0) return -1;
    const checked = inst.kitChecklist || [];
    const validChecked = checked.filter(acc => kit.accessories.includes(acc)).length;
    return validChecked / kit.accessories.length;
  };

  // Generate and download CSV export of the complete inventory
  const handleExportCSV = () => {
    if (instruments.length === 0) return;

    // 1. Headers
    const headers = [
      "Nom de l'instrument",
      "Famille/Pupitre",
      "État",
      "Statut",
      "Emprunteur"
    ];

    // 2. Rows mapping
    const rows = instruments.map(inst => {
      const nom = inst.nom || "";
      const type = getInstrumentTypeLabel(inst.type);
      const etat = getEtatLabel(inst.etat);
      
      // Status formatting
      let statusStr = "Au local";
      if (inst.status === "Emprunté") {
        statusStr = "Emprunté";
      } else if (inst.status === "En réparation") {
        statusStr = "En réparation";
      }
      
      // Borrower resolution
      const borrowerName = inst.borrowedBy ? (usersMap[inst.borrowedBy] || "Inconnu") : "";

      return [
        nom,
        type,
        etat,
        statusStr,
        borrowerName
      ];
    });

    // 3. Formater CSV string (semicolon separator, UTF-8 BOM, double quotes around values)
    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    // 4. Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `O_Girador_Inventaire_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrer local state
  const filteredInstruments = instruments.filter(inst => {
    if (filter === "association") return inst.proprietaire === "Association";
    if (filter === "personal") return inst.proprietaire !== "Association";
    if (filter === "repair") return inst.etat === "À réparer" || inst.etat === "Para consertar";
    return true;
  });

  // Gérer Header Click for column sorting
  const handleSortHeaderClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Dynamic trier of filtered instruments
  const sortedInstruments = React.useMemo(() => {
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
          valA = a.proprietaire !== "Association" ? (usersMap[a.proprietaire] || '') : "Association";
          valB = b.proprietaire !== "Association" ? (usersMap[b.proprietaire] || '') : "Association";
          break;
        case 'localisation':
          valA = a.localisationPhysique !== "Local" ? (usersMap[a.localisationPhysique] || 'Chez un membre') : "Local";
          valB = b.localisationPhysique !== "Local" ? (usersMap[b.localisationPhysique] || 'Chez un membre') : "Local";
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
          valA = getKitCompletionRatio(a);
          valB = getKitCompletionRatio(b);
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
  }, [filteredInstruments, sortConfig, usersMap]);

  // Fonction utilitaire pour afficher trier indicator chevrons
  const renderSortChevron = (key) => {
    if (sortConfig.key !== key) {
      return <span className="opacity-30 text-[9px] ml-1 font-bold select-none">↕️</span>;
    }
    return (
      <span className="text-[10px] ml-1 font-black text-cordel-wood select-none">
        {sortConfig.direction === 'asc' ? '🔼' : '🔽'}
      </span>
    );
  };

  // Afficher Access Denied card if security fails
  if (!isAuthorized) {
    return (
      <>
        <div className="text-center py-12 select-none">
          <CordelCard variant="default" useExtremeBorder={true} className="p-8">
            <h2 className="text-xl font-bold text-cordel-wood">🚨 {t('layoutEditor.accessDenied')}</h2>
            <p className="text-xs opacity-75 mt-3 leading-relaxed">
              {t('inventory.accessDeniedDesc')}
            </p>
            <div className="mt-6 flex justify-center">
              <CordelButton variant="default" onClick={onBack} className="text-xs">
                ← {t('common.back')}
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 text-left">
        {/* Header bar */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
          <button 
            type="button" 
            onClick={onBack} 
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            ← {t('common.back')}
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-1">
            <XiloCaixa size={14} /> {t('inventory.title')}
          </h2>
        </div>

        {/* Configuration Section (Accordeon) */}
        <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-2">
          <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowConfig(!showConfig)}>
            <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
              ⚙️ Paramètres & Configuration Logistique
            </h3>
            <span className="text-xs font-black">{showConfig ? '▲ Masquer' : '▼ Déployer'}</span>
          </div>

          {showConfig && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left">
              <InstrumentsCatalogBlock 
                formData={settingsData}
                handleChange={handleSettingsChange}
                saving={savingSettings}
                t={t}
              />
              <AccessoriesKitsBlock 
                formData={settingsData}
                handleChange={handleSettingsChange}
                saving={savingSettings}
                t={t}
              />
              <div className="flex justify-end mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
                <CordelButton
                  type="submit"
                  variant="ocre"
                  useExtremeBorder={true}
                  disabled={savingSettings}
                  className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
                >
                  {savingSettings ? "Enregistrement..." : "💾 Enregistrer Configuration"}
                </CordelButton>
              </div>
            </form>
          )}
        </CordelCard>

        {/* Mouvements en attente */}
        {pendingMovements.length > 0 && (
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-2 bg-cordel-ocre/10 border-cordel-ocre">
            <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase mb-3 flex items-center gap-2">
              ⏳ Mouvements en attente ({pendingMovements.length})
            </h3>
            <div className="flex flex-col gap-3">
              {pendingMovements.map(inst => {
                const { type, fromUserId, toUserId, date, note } = inst.pendingMovement;
                const fromName = usersMap[fromUserId] || 'Un membre';
                const toName = toUserId ? (usersMap[toUserId] || 'un membre') : '';
                
                let message = '';
                if (type === 'return_to_local') {
                  message = `${fromName} déclare avoir rendu l'instrument au local.`;
                } else if (type === 'transfer') {
                  message = `${fromName} déclare avoir transmis l'instrument à ${toName}.`;
                }

                return (
                  <div key={inst.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/50 border border-dashed border-cordel-master-dark/20 rounded">
                    <div className="flex flex-col gap-1 text-left">
                      <div className="text-xs font-bold text-encre-noire flex items-center gap-1.5">
                        <img src={INSTRUMENT_ICONS[inst.type] || INSTRUMENT_ICONS['Autre']} alt={inst.type} className="w-4 h-4 object-contain opacity-70" />
                        <span>{inst.nom}</span>
                      </div>
                      <div className="text-[10px] text-cordel-master-dark/80">{message}</div>
                      {note && (
                        <div className="text-[9px] italic text-cordel-wood bg-cordel-wood/5 p-1.5 rounded mt-1 border-l-2 border-cordel-wood">
                          "{note}"
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleRejectMovement(inst)}
                        className="p-1.5 bg-cordel-rouge/10 text-cordel-rouge rounded hover:bg-cordel-rouge/20 border border-cordel-rouge/30 transition-colors"
                        title="Refuser"
                      >
                        <XiloClose size={12} />
                      </button>
                      <button 
                        onClick={() => handleApproveMovement(inst)}
                        className="px-3 py-1 bg-cordel-vert text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_#181716] hover:brightness-110 active:translate-y-[1px] active:shadow-none transition-all"
                      >
                        ✅ Valider
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CordelCard>
        )}

        {/* Form view */}
        {isFormOpen ? (
          <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 relative">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
              className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              <XiloClose size={10} />
            </button>

            <h3 className="panel-title text-sm font-bold text-cordel-wood mb-4">
              {editingId ? t('inventory.editTitle') : t('inventory.addTitle')}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-3.5">
              {/* Nom */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('inventory.instNameLabel')}
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  placeholder={t('inventory.instNamePlaceholder')}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('inventory.instTypeLabel')}
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    {INSTRUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Etat */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    État
                  </label>
                  <select
                    name="etat"
                    value={formData.etat}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    {ETAT_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Kit Accessoires Dynamique */}
              <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/15">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark mb-1 flex items-center justify-between">
                  <span>Kit Accessoires</span>
                  {(() => {
                    const kit = (settingsData?.logisticsKits || []).find(k => k.pupitre === formData.type);
                    if (kit && kit.accessories && kit.accessories.length > 0) {
                      const checked = formData.kitChecklist || [];
                      const validChecked = checked.filter(acc => kit.accessories.includes(acc)).length;
                      return (
                        <span className="text-[9px] bg-cordel-master-dark/10 px-1 rounded text-cordel-master-dark">
                          {validChecked}/{kit.accessories.length}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </label>
                <div className="flex flex-col gap-1.5 p-2 bg-cordel-bg-light/50 border border-encre-noire/10 rounded">
                  {(() => {
                    const kit = (settingsData?.logisticsKits || []).find(k => k.pupitre === formData.type);
                    
                    if (!kit || !kit.accessories || kit.accessories.length === 0) {
                      return (
                        <span className="text-[9px] text-stone-500 italic">
                          Aucun kit configuré pour cet instrument.
                        </span>
                      );
                    }

                    const checkedList = formData.kitChecklist || [];

                    return kit.accessories.map(acc => {
                      const isChecked = checkedList.includes(acc);
                      return (
                        <label
                          key={acc}
                          className={`flex items-center gap-2 p-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            isChecked ? 'bg-cordel-master-light/50 text-cordel-wood' : 'hover:bg-stone-100 text-encre-noire'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newChecked = e.target.checked
                                ? [...checkedList, acc]
                                : checkedList.filter(item => item !== acc);
                              setFormData(prev => ({ ...prev, kitChecklist: newChecked }));
                            }}
                            disabled={saving}
                            className="w-3.5 h-3.5 text-cordel-wood rounded cursor-pointer"
                          />
                          <span>{acc}</span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Proprietaire */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Propriétaire
                </label>
                <select
                  name="proprietaire"
                  value={formData.proprietaire}
                  onChange={handleInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="Association">Association</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>Personnel : {u.prenom} {u.nom}</option>
                  ))}
                </select>
              </div>

              {/* Localisation Physique */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Localisation Physique
                </label>
                <select
                  name="localisationPhysique"
                  value={formData.localisationPhysique}
                  onChange={handleInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="Local">Local de l'association</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>Chez : {u.prenom} {u.nom}</option>
                  ))}
                </select>
              </div>

              {/* Statut d'emprunt */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Statut de l'instrument
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="En stock">En stock</option>
                  <option value="Emprunté">Emprunté</option>
                  <option value="En réparation">En réparation</option>
                </select>
              </div>

              {/* Emprunteur (sélectionnable si statut === 'Emprunté') */}
              {formData.status === 'Emprunté' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Emprunteur
                  </label>
                  <select
                    name="borrowedBy"
                    value={formData.borrowedBy}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    <option value="">-- Non spécifié --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assignations (Pills selector) */}
              <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-2">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Assignations (Membres désignés)
                </label>
                <div className="max-h-24 overflow-y-auto border border-dashed border-encre-noire/25 rounded p-2 flex flex-wrap gap-1.5 bg-[#fdfaf2] dark:bg-[#201d1a]">
                  {usersList.length === 0 ? (
                    <span className="text-[10px] opacity-60 font-semibold">Aucun membre disponible</span>
                  ) : (
                    usersList.map((u) => {
                      const isAssigned = formData.assignations.includes(u.id);
                      const fullName = `${u.prenom} ${u.nom}`;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          disabled={saving}
                          onClick={() => handleAssignationToggle(u.id)}
                          className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                            isAssigned 
                              ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1px_1px_0px_0px_#181716]' 
                              : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
                          }`}
                        >
                          {isAssigned && "🪢 "}
                          <XiloAvatar src={u.photoURL} name={fullName} size={14} />
                          <span>{fullName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-between items-center mt-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingId, formData.nom)}
                    disabled={saving}
                    className="text-[9px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-3 py-1.5 border border-encre-noire rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer disabled:opacity-50"
                  >
                    🗑️ Retirer
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <CordelButton
                    type="button"
                    variant="default"
                    disabled={saving}
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs px-3 py-1.5"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={saving || !formData.nom.trim()}
                    className="text-xs px-4 py-1.5 font-bold"
                  >
                    {saving ? "..." : "Enregistrer"}
                  </CordelButton>
                </div>
              </div>
            </form>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-4">
            {/* BARRE DE FILTRES ET D'ACTIONS REUTILISABLE */}
            <InventoryFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filter={filter}
              setFilter={setFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onOpenAdd={handleOpenAdd}
              t={t}
            />

            {/* Instruments List / Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
              </div>
            ) : sortedInstruments.length === 0 ? (
              <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
                <p className="text-xs font-bold opacity-75">{t('inventory.noInstrumentsFilter') || "Aucun instrument trouvé pour ce filtre."}</p>
              </CordelCard>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW WITH CLICKABLE SORTABLE HEADERS */
              <div className="w-full max-h-[calc(100vh-280px)] overflow-x-auto overflow-y-auto border-2 border-encre-noire rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-cordel-card-bg relative">
                <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                  <thead className="bg-cordel-bg-light border-b-2 border-encre-noire text-[10px] uppercase tracking-wider text-cordel-wood font-black select-none sticky top-0 z-20">
                    <tr>
                      <th 
                        onClick={() => handleSortHeaderClick('nom')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 left-0 z-30 bg-cordel-bg-light"
                        title="Cliquer pour trier par Nom / Réf"
                      >
                        <div className="flex items-center gap-1">
                          <span>Nom / Réf</span>
                          {renderSortChevron('nom')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('type')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par Famille / Type"
                      >
                        <div className="flex items-center gap-1">
                          <span>Famille / Type</span>
                          {renderSortChevron('type')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('proprietaire')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par Propriétaire"
                      >
                        <div className="flex items-center gap-1">
                          <span>Propriétaire</span>
                          {renderSortChevron('proprietaire')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('localisation')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par Localisation"
                      >
                        <div className="flex items-center gap-1">
                          <span>Localisation</span>
                          {renderSortChevron('localisation')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('etat')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par État"
                      >
                        <div className="flex items-center gap-1">
                          <span>État</span>
                          {renderSortChevron('etat')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('kit')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par Kit"
                      >
                        <div className="flex items-center gap-1 justify-center">
                          <span>Kit</span>
                          {renderSortChevron('kit')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('status')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par Statut / Prêt"
                      >
                        <div className="flex items-center gap-1">
                          <span>Statut / Prêt</span>
                          {renderSortChevron('status')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortHeaderClick('assignations')}
                        className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
                        title="Cliquer pour trier par Assignations"
                      >
                        <div className="flex items-center gap-1">
                          <span>Assignations</span>
                          {renderSortChevron('assignations')}
                        </div>
                      </th>
                      <th className="p-3 text-right sticky top-0 z-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-encre-noire/10 font-medium">
                    {sortedInstruments.map((inst) => {
                      const iconPath = INSTRUMENT_ICONS[inst.type] || 'favicon.svg';

                      return (
                        <tr key={inst.id} className="hover:bg-cordel-hover/50 transition-colors">
                          {/* Nom / Réf (Sticky Column Input) */}
                          <td className="p-2 border-r border-encre-noire/15 font-extrabold text-encre-noire sticky left-0 z-10 bg-cordel-bg shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] min-w-[170px]">
                            <div className="flex items-center gap-2">
                              <img src={iconPath} alt={inst.type} className="w-5 h-5 object-contain shrink-0" />
                              <input
                                type="text"
                                key={inst.id + '_nom_' + inst.nom}
                                defaultValue={inst.nom}
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val && val !== inst.nom) {
                                    handleInlineFieldChange(inst.id, 'nom', val);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.target.blur();
                                }}
                                className="theme-input text-xs font-extrabold py-1 px-1.5 bg-white/80 focus:bg-white border-encre-noire/20 hover:border-encre-noire w-full rounded"
                                placeholder="Nom de l'instrument"
                                title="Cliquer pour modifier le nom"
                              />
                            </div>
                          </td>

                          {/* Type / Famille (Dropdown) */}
                          <td className="p-2 border-r border-encre-noire/10 min-w-[120px]">
                            <select
                              value={inst.type || 'Alfaia'}
                              onChange={(e) => handleInlineFieldChange(inst.id, 'type', e.target.value)}
                              className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light/90 border-encre-noire/20 hover:border-encre-noire w-full rounded text-cordel-wood cursor-pointer"
                              title="Modifier la famille d'instrument"
                            >
                              {INSTRUMENT_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>

                          {/* Propriétaire (Dropdown) */}
                          <td className="p-2 border-r border-encre-noire/10 min-w-[155px]">
                            <select
                              value={inst.proprietaire || 'Association'}
                              onChange={(e) => handleInlineFieldChange(inst.id, 'proprietaire', e.target.value)}
                              className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light/90 border-encre-noire/20 hover:border-encre-noire w-full rounded text-cordel-master-dark cursor-pointer"
                              title="Modifier le propriétaire"
                            >
                              <option value="Association">🏢 Association</option>
                              <optgroup label="Membres">
                                {usersList.map(u => (
                                  <option key={u.id} value={u.id}>👤 {u.prenom} {u.nom}</option>
                                ))}
                              </optgroup>
                            </select>
                          </td>

                          {/* Localisation (Dropdown) */}
                          <td className="p-2 border-r border-encre-noire/10 min-w-[155px]">
                            <select
                              value={inst.localisationPhysique || 'Local'}
                              onChange={(e) => handleInlineFieldChange(inst.id, 'localisationPhysique', e.target.value)}
                              className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light/90 border-encre-noire/20 hover:border-encre-noire w-full rounded text-encre-noire cursor-pointer"
                              title="Modifier le lieu de stockage"
                            >
                              <option value="Local">📍 Local</option>
                              <optgroup label="Chez un membre">
                                {usersList.map(u => (
                                  <option key={u.id} value={u.id}>🏠 Chez {u.prenom} {u.nom}</option>
                                ))}
                              </optgroup>
                            </select>
                          </td>

                          {/* État (Dropdown) */}
                          <td className="p-2 border-r border-encre-noire/10 min-w-[110px]">
                            <select
                              value={inst.etat || 'Bon'}
                              onChange={(e) => handleInlineFieldChange(inst.id, 'etat', e.target.value)}
                              className={`theme-input text-xs font-extrabold py-1 px-2 rounded border w-full cursor-pointer ${
                                inst.etat === 'À réparer' || inst.etat === 'Para consertar'
                                  ? 'bg-red-50 text-red-700 border-red-400 font-black'
                                  : inst.etat === 'Neuf'
                                    ? 'bg-green-50 text-green-700 border-green-400'
                                    : 'bg-cordel-bg-light/90 text-cordel-wood border-encre-noire/20'
                              }`}
                              title="Modifier l'état"
                            >
                              {ETAT_OPTIONS.map(eOpt => (
                                <option key={eOpt} value={eOpt}>{getEtatLabel(eOpt)}</option>
                              ))}
                            </select>
                          </td>

                          {/* Kit Accessoires (Texte Résumé) */}
                          <td className="p-2 border-r border-encre-noire/10 min-w-[70px] text-center text-[10px] font-bold text-encre-noire/80">
                            {getKitCompletionText(inst)}
                          </td>

                          {/* Statut / Prêt (Dropdown & Borrower) */}
                          <td className="p-2 border-r border-encre-noire/10 min-w-[160px]">
                            <div className="flex flex-col gap-1">
                              <select
                                value={inst.status || 'En stock'}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus !== 'Emprunté') {
                                    handleInlineFieldChange(inst.id, 'status', newStatus);
                                    if (inst.borrowedBy) {
                                      handleInlineFieldChange(inst.id, 'borrowedBy', null);
                                    }
                                  } else {
                                    handleInlineFieldChange(inst.id, 'status', 'Emprunté');
                                  }
                                }}
                                className={`text-[10px] font-black uppercase py-1 px-2 rounded border w-full cursor-pointer ${
                                  inst.status === 'Emprunté'
                                    ? 'bg-amber-100 border-amber-400 text-amber-800'
                                    : inst.status === 'En réparation'
                                      ? 'bg-red-100 border-red-400 text-red-800'
                                      : 'bg-green-100 border-green-400 text-green-800'
                                }`}
                                title="Modifier le statut d'utilisation"
                              >
                                <option value="En stock">En stock</option>
                                <option value="Emprunté">Emprunté</option>
                                <option value="En réparation">En réparation</option>
                              </select>

                              {inst.status === 'Emprunté' && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <select
                                    value={inst.borrowedBy || ''}
                                    onChange={(e) => handleAssignBorrower(inst.id, e.target.value)}
                                    className="theme-input text-[9px] font-bold py-0.5 px-1 bg-white border-amber-400 w-full"
                                    title="Membre emprunteur"
                                  >
                                    <option value="">🤝 Emprunteur...</option>
                                    {usersList.map(u => (
                                      <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                                    ))}
                                  </select>
                                  {inst.borrowedBy && (
                                    <button
                                      type="button"
                                      onClick={() => handleReturnInstrument(inst.id)}
                                      className="text-[8px] font-black uppercase bg-cordel-wood text-white px-1.5 py-1 rounded border border-encre-noire hover:brightness-110 cursor-pointer shrink-0"
                                      title="Restituer l'instrument"
                                    >
                                      ↩️
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Assignations */}
                          <td className="p-2 border-r border-encre-noire/10">
                            {inst.assignations && inst.assignations.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {inst.assignations.map(uid => {
                                  const u = usersList.find(userObj => userObj.id === uid);
                                  if (!u) return null;
                                  const fullName = `${u.prenom} ${u.nom}`;
                                  return (
                                    <span key={uid} className="inline-flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded border border-dashed border-encre-noire/20 text-[9px] font-semibold">
                                      <XiloAvatar src={u.photoURL} name={fullName} size={14} />
                                      <span>{fullName}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] opacity-40 italic">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(inst)}
                                className="p-1.5 border border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                                title="Formulaire d'édition complet (assignations, etc.)"
                              >
                                <XiloChisel size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(inst.id, inst.nom)}
                                className="p-1.5 border border-red-700 bg-red-50 hover:bg-red-100 text-red-700 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer text-[10px]"
                                title="Supprimer de l'inventaire"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* VUE EN CARTES AVEC LE COMPOSANT REUTILISABLE INVENTORYITEMCARD */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedInstruments.map((inst) => (
                  <InventoryItemCard
                    key={inst.id}
                    item={inst}
                    usersMap={usersMap}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onToggleBorrow={handleToggleBorrowStatus}
                    kitCompletionText={getKitCompletionText(inst)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODALE DE FORMULAIRE REUTILISABLE */}
        <InventoryFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          formData={formData}
          setFormData={setFormData}
          saving={saving}
          editingId={editingId}
          usersList={usersList}
          settingsData={settingsData}
          onSave={handleSave}
          t={t}
        />
      </div>
    </>
  );
}
