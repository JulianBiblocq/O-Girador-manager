import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose, XiloChisel, XiloCaixa } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import XiloAvatar from './XiloAvatar';

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
    const confirmDelete = window.confirm(
      (t('inventory.deleteConfirm') || `Voulez-vous vraiment retirer "{name}" de l'inventaire ?`).replace('{name}', name)
    );
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

  // Filter local state
  const filteredInstruments = instruments.filter(inst => {
    if (filter === "association") return inst.proprietaire === "Association";
    if (filter === "personal") return inst.proprietaire !== "Association";
    if (filter === "repair") return inst.etat === "À réparer";
    return true;
  });

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
            {/* Filter buttons & Add trigger */}
            <div className="flex justify-between items-center gap-2">
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

              <CordelButton
                variant="ocre"
                useExtremeBorder={true}
                onClick={handleOpenAdd}
                className="text-[10px] px-3 py-2 uppercase tracking-widest font-black shrink-0"
              >
                {t('inventory.addBtn')}
              </CordelButton>
            </div>

            {/* Instruments List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
              </div>
            ) : filteredInstruments.length === 0 ? (
              <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
                <p className="text-xs font-bold opacity-75">{t('inventory.noInstrumentsFilter') || "Aucun instrument trouvé pour ce filtre."}</p>
              </CordelCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredInstruments.map((inst) => {
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
                        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[6px] px-1 py-0 rotate-0`}>
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
