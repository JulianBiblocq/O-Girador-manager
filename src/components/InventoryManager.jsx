import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose, XiloChisel, XiloCaixa } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import XiloAvatar from './XiloAvatar';
import useConfirm from '../hooks/useConfirm';

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
  Autre: 'favicon.svg' // default logo icon fallback
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

  const [instruments, setInstruments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "association", "personal", "repair"
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [sortConfig, setSortConfig] = useState({ key: 'nom', direction: 'asc' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null for create, id for edit
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    type: 'Alfaia',
    etat: 'Bon',
    proprietaire: 'Association',
    localisationPhysique: 'Local',
    assignations: [],
    status: 'En stock',
    borrowedBy: ''
  });

  // Security Check: Mestres, Super-Admins and System Admins only
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessLogistique === true;

  // Real-time synchronization of users list in the group
  useEffect(() => {
    if (!isAuthorized || !groupId) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUsers = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort users by last name
      fetchedUsers.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setUsersList(fetchedUsers);
    }, (error) => {
      console.error("InventoryManager - Erreur onSnapshot users :", error);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // Real-time synchronization of the group's instrument inventory
  useEffect(() => {
    if (!isAuthorized || !groupId) {
      setLoading(false);
      return;
    }

    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedInstruments = [];
      querySnapshot.forEach((doc) => {
        fetchedInstruments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort instruments by name
      fetchedInstruments.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setInstruments(fetchedInstruments);
      setLoading(false);
    }, (error) => {
      console.error("InventoryManager - Erreur onSnapshot inventory :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // Map UIDs to full names for direct O(1) resolution
  const usersMap = usersList.reduce((acc, u) => {
    acc[u.id] = `${u.prenom} ${u.nom}`;
    return acc;
  }, {});

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

  const handleOpenAdd = () => {
    setFormData({
      nom: '',
      type: 'Alfaia',
      etat: 'Bon',
      proprietaire: 'Association',
      localisationPhysique: 'Local',
      assignations: [],
      status: 'En stock',
      borrowedBy: ''
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (inst) => {
    setFormData({
      nom: inst.nom || '',
      type: inst.type || 'Alfaia',
      etat: inst.etat || 'Bon',
      proprietaire: inst.proprietaire || 'Association',
      localisationPhysique: inst.localisationPhysique || 'Local',
      assignations: inst.assignations || [],
      status: inst.status || 'En stock',
      borrowedBy: inst.borrowedBy || ''
    });
    setEditingId(inst.id);
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupId || !formData.nom.trim()) return;

    setSaving(true);
    try {
      const payload = {
        nom: formData.nom.trim(),
        type: formData.type,
        etat: formData.etat,
        proprietaire: formData.proprietaire,
        localisationPhysique: formData.localisationPhysique,
        assignations: formData.assignations,
        status: formData.status || 'En stock',
        borrowedBy: formData.borrowedBy || null,
        groupId: groupId
      };

      if (editingId) {
        // Edit existing instrument
        const docRef = doc(db, 'inventory', editingId);
        await updateDoc(docRef, payload);
      } else {
        // Create new instrument
        const collRef = collection(db, 'inventory');
        await addDoc(collRef, payload);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Erreur Firebase Inventaire :", error);
      alert(`${t('common.saveError')} : ${error.message}`);
    } finally {
      setSaving(false);
    }
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

  const handleDelete = async (instId, name) => {
    const confirmDelete = await confirm({
      title: "Supprimer de l'inventaire",
      message: (t('inventory.deleteConfirm') || `Voulez-vous vraiment retirer "${name}" de l'inventaire ?`).replace('{name}', name),
      confirmText: "Oui, retirer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!confirmDelete) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'inventory', instId));
      setIsFormOpen(false);
    } catch (error) {
      console.error("Erreur Firebase Inventaire :", error);
      alert(`${t('common.saveError')} : ${error.message}`);
    } finally {
      setSaving(false);
    }
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

    // 3. Format CSV string (semicolon separator, UTF-8 BOM, double quotes around values)
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

  // Filter local state
  const filteredInstruments = instruments.filter(inst => {
    if (filter === "association") return inst.proprietaire === "Association";
    if (filter === "personal") return inst.proprietaire !== "Association";
    if (filter === "repair") return inst.etat === "À réparer" || inst.etat === "Para consertar";
    return true;
  });

  // Handle Header Click for column sorting
  const handleSortHeaderClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Dynamic sort of filtered instruments
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

  // Helper to render sort indicator chevrons
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

  // Render Access Denied card if security fails
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
            {/* Filter buttons, View mode & Add trigger */}
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Dropdown for filters */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light pr-8"
                >
                  <option value="all">{(t('inventory.filterAll') || "Filtre : Tous ({count})").replace('{count}', instruments.length)}</option>
                  <option value="association">{(t('inventory.filterAssoc') || "Association ({count})").replace('{count}', instruments.filter(i=>i.proprietaire==='Association').length)}</option>
                  <option value="personal">{(t('inventory.filterPersonal') || "Matériel Personnel ({count})").replace('{count}', instruments.filter(i=>i.proprietaire!=='Association').length)}</option>
                  <option value="repair">{(t('inventory.filterRepair') || "À réparer ({count})").replace('{count}', instruments.filter(i=>i.etat==='À réparer' || i.etat==='Para consertar').length)}</option>
                </select>

                {/* View Mode Toggle (Tableau vs Cartes) */}
                <div className="inline-flex rounded-md border border-encre-noire/30 p-0.5 bg-cordel-bg-light select-none">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded cursor-pointer transition-all ${
                      viewMode === 'table'
                        ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                        : 'text-cordel-master-dark hover:bg-black/5'
                    }`}
                  >
                    📊 Tableau
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded cursor-pointer transition-all ${
                      viewMode === 'cards'
                        ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                        : 'text-cordel-master-dark hover:bg-black/5'
                    }`}
                  >
                    🎴 Cartes
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <CordelButton
                  type="button"
                  variant="default"
                  useExtremeBorder={false}
                  onClick={handleExportCSV}
                  disabled={instruments.length === 0}
                  className="text-[10px] px-3 py-2 uppercase tracking-widest font-black shrink-0 flex items-center gap-1.5"
                >
                  📥 {t('inventory.exportCSV') || "Exporter (CSV)"}
                </CordelButton>

                <CordelButton
                  variant="ocre"
                  useExtremeBorder={true}
                  onClick={handleOpenAdd}
                  className="text-[10px] px-3 py-2 uppercase tracking-widest font-black shrink-0"
                >
                  {t('inventory.addBtn')}
                </CordelButton>
              </div>
            </div>

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
                      const isPersonal = inst.proprietaire !== "Association";
                      const ownerName = isPersonal ? (usersMap[inst.proprietaire] || "Chargement...") : "Association";
                      const isAtHome = inst.localisationPhysique !== "Local";
                      const locName = isAtHome ? (usersMap[inst.localisationPhysique] || "Chez un membre") : "Local";

                      return (
                        <tr key={inst.id} className="hover:bg-cordel-hover/50 transition-colors">
                          {/* Nom (Sticky Column) */}
                          <td className="p-3 border-r border-encre-noire/15 font-extrabold text-encre-noire sticky left-0 z-10 bg-cordel-bg shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                            <div className="flex items-center gap-2">
                              <img src={iconPath} alt={inst.type} className="w-5 h-5 object-contain shrink-0" />
                              <span className="truncate">{inst.nom}</span>
                            </div>
                          </td>
                          {/* Type */}
                          <td className="p-3 border-r border-encre-noire/10 text-cordel-wood font-bold">
                            🛠️ {inst.type}
                          </td>
                          {/* Propriétaire */}
                          <td className="p-3 border-r border-encre-noire/10 text-cordel-master-dark font-semibold">
                            {ownerName}
                          </td>
                          {/* Localisation */}
                          <td className="p-3 border-r border-encre-noire/10">
                            📍 {locName}
                          </td>
                          {/* État */}
                          <td className="p-3 border-r border-encre-noire/10">
                            <span className={`theme-stamp-badge ${inst.etat === 'À réparer' || inst.etat === 'Para consertar' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[8px] px-1.5 py-0.5`}>
                              {inst.etat}
                            </span>
                          </td>
                          {/* Statut / Prêt */}
                          <td className="p-3 border-r border-encre-noire/10">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block w-fit ${
                                inst.status === 'Emprunté'
                                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                                  : inst.status === 'En réparation'
                                    ? 'bg-red-100 border-red-400 text-red-800'
                                    : 'bg-green-100 border-green-400 text-green-800'
                              }`}>
                                {inst.status || 'En stock'}
                              </span>
                              {inst.status === 'Emprunté' ? (
                                <div className="flex items-center gap-1.5 text-[9px]">
                                  <span className="truncate">👤 {usersMap[inst.borrowedBy] || "Membre"}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleReturnInstrument(inst.id)}
                                    className="text-[8px] font-black uppercase bg-cordel-wood text-white px-1.5 py-0.5 rounded border border-encre-noire hover:brightness-110 cursor-pointer"
                                  >
                                    ↩️ Restitué
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value=""
                                  onChange={(e) => handleAssignBorrower(inst.id, e.target.value)}
                                  className="theme-input text-[9px] font-bold py-0.5 px-1 bg-white max-w-[130px]"
                                >
                                  <option value="">🤝 Prêter à...</option>
                                  {usersList.map(u => (
                                    <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          {/* Assignations */}
                          <td className="p-3 border-r border-encre-noire/10">
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
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(inst)}
                                className="p-1.5 border border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                                title="Modifier l'instrument"
                              >
                                <XiloChisel size={10} />
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
              /* CARD VIEW WITH SORTED INSTRUMENTS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedInstruments.map((inst) => {
                  const iconPath = INSTRUMENT_ICONS[inst.type] || 'favicon.svg';
                  const isPersonal = inst.proprietaire !== "Association";
                  const ownerName = isPersonal ? (usersMap[inst.proprietaire] || "Chargement...") : "Association";
                  const isAtHome = inst.localisationPhysique !== "Local";
                  const locName = isAtHome ? (usersMap[inst.localisationPhysique] || "Chez un membre") : "Local";
                  
                  return (
                    <CordelCard 
                      key={inst.id}
                      variant="default"
                      useExtremeBorder={false}
                      className="p-3 bg-cordel-bg flex flex-col gap-2 w-full relative pr-12 text-left"
                    >
                      {/* Top Part: Icon + Info details */}
                      <div className="flex items-center gap-4 w-full">
                        {/* Left Side: Instrument Icon */}
                        <div className="w-10 h-10 border-2 border-encre-noire bg-cordel-bg-light rounded-[8px_6px_10px_7px] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#181716] select-none p-1.5">
                          <img src={iconPath} alt={inst.type} className="w-full h-full object-contain pointer-events-none" />
                        </div>

                        {/* Middle: Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs text-encre-noire leading-tight truncate">
                            {inst.nom}
                          </h4>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[8px] font-semibold text-cordel-master-dark/70">
                            <span>🛠️ {inst.type}</span>
                            <span>•</span>
                            <span>Proprio : <strong className="text-cordel-wood">{ownerName}</strong></span>
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[8px] font-semibold text-cordel-master-dark/70">
                            <span>📍 Localisation : <strong>{locName}</strong></span>
                            
                            {/* Assignations Display */}
                            {inst.assignations && inst.assignations.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  Assigné à : 
                                  <span className="flex flex-wrap gap-1.5 items-center">
                                    {inst.assignations.map(uid => {
                                      const u = usersList.find(userObj => userObj.id === uid);
                                      if (!u) return <strong key={uid} className="font-bold text-encre-noire">...</strong>;
                                      const fullName = `${u.prenom} ${u.nom}`;
                                      return (
                                        <span key={uid} className="inline-flex items-center gap-1 bg-white/40 dark:bg-black/10 px-1.5 py-0.5 rounded border border-dashed border-encre-noire/10 text-[9px] font-semibold text-encre-noire">
                                          <XiloAvatar src={u.photoURL} name={fullName} size={14} />
                                          <span>{fullName}</span>
                                        </span>
                                      );
                                    })}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Borrowing / Lending Controls Section */}
                      <div className="mt-1 pt-1.5 border-t border-dashed border-cordel-master-dark/15 flex flex-col gap-1.5 w-full">
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="text-[9px] font-black text-cordel-wood uppercase">Statut :</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                            inst.status === 'Emprunté'
                              ? 'bg-amber-100 border-amber-400 text-amber-800'
                              : inst.status === 'En réparation'
                                ? 'bg-red-100 border-red-400 text-red-800'
                                : 'bg-green-100 border-green-400 text-green-800'
                          }`}>
                            {inst.status || 'En stock'}
                          </span>
                        </div>

                        {inst.status === 'Emprunté' ? (
                          <div className="flex items-center justify-between gap-2 bg-white/40 dark:bg-black/10 p-1.5 rounded border border-dashed border-encre-noire/15">
                            <span className="text-[9px] font-bold text-cordel-master-dark/95 truncate">
                              👤 Emprunté par : <strong className="font-extrabold text-encre-noire">{usersMap[inst.borrowedBy] || "Membre"}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReturnInstrument(inst.id)}
                              className="text-[8px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-2.5 py-1.5 border border-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer shrink-0"
                            >
                              ↩️ Restitué
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-white/40 dark:bg-black/10 p-1.5 rounded border border-dashed border-encre-noire/15">
                            <span className="text-[9px] font-bold text-cordel-master-dark/95 shrink-0">
                              🤝 Prêter à :
                            </span>
                            <select
                              value=""
                              onChange={(e) => handleAssignBorrower(inst.id, e.target.value)}
                              className="theme-input text-[9px] font-bold py-0.5 px-1 bg-white shrink-0 max-w-[120px] ml-auto"
                            >
                              <option value="">-- Choisir --</option>
                              {usersList.map(u => (
                                <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Right top status tag stamp */}
                      <div className="absolute top-2 right-2 flex gap-1 select-none">
                        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' || inst.etat === 'Para consertar' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[6px] px-1 py-0 rotate-0`}>
                          {inst.etat}
                        </span>
                      </div>

                      {/* Right Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inst)}
                        className="absolute bottom-2 right-2 p-1.5 border border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center"
                        title="Modifier l'instrument"
                      >
                        <XiloChisel size={10} />
                      </button>
                    </CordelCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
