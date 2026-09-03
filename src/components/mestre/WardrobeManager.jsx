import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import CostumeSizesTable from './CostumeSizesTable';
import CostumesAdminManager from './CostumesAdminManager';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import WardrobeBlock from '../association-settings/blocks/WardrobeBlock';
import useHardwareBack from '../../hooks/useHardwareBack';
import { useSuppliesData } from '../../hooks/useSuppliesData';
import SuppliesListView from '../inventory/SuppliesListView';
import WorkshopToolsListView from '../inventory/WorkshopToolsListView';

export default function WardrobeManager({ groupId, role, isSystemAdmin, hasAccessLogistique, onBack, activeTab = 'inventory' }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [allUsers, setAllUsers] = useState([]);
  
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessLogistique === true;
  
  const {
    formData,
    handleChange,
    handleSave,
    saving: savingSettings
  } = useAssociationSettings(groupId, isAuthorized, onBack, t);

  const {
    supplies, tools, loading: suppliesLoading,
    addSupply, updateSupply, deleteSupply, adjustSupplyStock,
    addTool, updateTool, deleteTool
  } = useSuppliesData(groupId, 'costumerie');

  // Costume Inventory State
  const [costumes, setCostumes] = useState([]);
  const [showCostumeForm, setShowCostumeForm] = useState(false);
  const [editingCostume, setEditingCostume] = useState(null);
  const [costumeForm, setCostumeForm] = useState({
    type: '',
    taille: 'M',
    etat: 'Bon',
    statut: 'local',
    emprunteurId: ''
  });

  // Couture Projects State
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    needs: '',
    cost: 0,
    status: 'a_commencer'
  });

  const [saving, setSaving] = useState(false);

  useHardwareBack(showCostumeForm, () => setShowCostumeForm(false));
  useHardwareBack(showProjectForm, () => setShowProjectForm(false));

  const profileData = useMemo(() => ({
    groupId,
    role,
    isSystemAdmin,
    hasAccessLogistique
  }), [groupId, role, isSystemAdmin, hasAccessLogistique]);

  // 1. Récupérer Users
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      fetched.sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));
      setAllUsers(fetched);
    }, (error) => {
      console.warn("WardrobeManager - Query users warning:", error?.message || error);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 2. Récupérer Costume Pieces Inventory
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'wardrobeInventory'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCostumes(fetched);
    }, (error) => {
      console.warn("WardrobeManager - Query wardrobeInventory warning:", error?.message || error);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 3. Récupérer Couture Projects
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'coutureProjects'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProjects(fetched);
    }, (error) => {
      console.warn("WardrobeManager - Query coutureProjects warning:", error?.message || error);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Costume Piece handlers
  const handleCostumeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!costumeForm.type.trim()) return;
    setSaving(true);
    try {
      const borrower = allUsers.find(u => u.id === costumeForm.emprunteurId);
      const payload = {
        groupId: groupId || '',
        type: (costumeForm.type || '').trim(),
        taille: costumeForm.taille || 'M',
        etat: costumeForm.etat || 'Bon',
        statut: costumeForm.statut || 'local',
        emprunteurId: costumeForm.statut === 'emprunte' ? (costumeForm.emprunteurId || '') : '',
        emprunteurNom: costumeForm.statut === 'emprunte' && borrower ? `${borrower.prenom || ''} ${borrower.nom || ''}`.trim() : ''
      };

      if (editingCostume) {
        await updateDoc(doc(db, 'wardrobeInventory', editingCostume.id), payload);
      } else {
        await addDoc(collection(db, 'wardrobeInventory'), payload);
      }

      setCostumeForm({ type: '', taille: 'M', etat: 'Bon', statut: 'local', emprunteurId: '' });
      setShowCostumeForm(false);
      setEditingCostume(null);
    } catch (err) {
      console.error("Error saving costume piece:", err);
      alert("Erreur lors de l'enregistrement de la pièce.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCostume = (piece) => {
    setEditingCostume(piece);
    setCostumeForm({
      type: piece.type,
      taille: piece.taille || 'M',
      etat: piece.etat || 'Bon',
      statut: piece.statut || 'local',
      emprunteurId: piece.emprunteurId || ''
    });
    setShowCostumeForm(true);
  };

  const handleDeleteCostume = async (id) => {
    const isOk = await confirm({
      title: "Supprimer la pièce",
      message: "Êtes-vous sûr de vouloir supprimer cette pièce de l'inventaire ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    try {
      await deleteDoc(doc(db, 'wardrobeInventory', id));
    } catch (err) {
      console.error("Error deleting costume piece:", err);
      alert("Erreur de suppression.");
    }
  };

  // Couture Project handlers
  const handleProjectSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!projectForm.name.trim()) return;

    try {
      if (editingProject) {
        await updateDoc(doc(db, 'coutureProjects', editingProject.id), {
          ...projectForm,
          cost: parseFloat(projectForm.cost) || 0
        });
      } else {
        await addDoc(collection(db, 'coutureProjects'), {
          ...projectForm,
          groupId,
          cost: parseFloat(projectForm.cost) || 0,
          createdAt: new Date().toISOString()
        });
      }
      setShowProjectForm(false);
      setEditingProject(null);
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Erreur d'enregistrement.");
    }
  };

  const handleEditProject = (proj) => {
    setEditingProject(proj);
    setProjectForm({
      name: proj.name,
      needs: proj.needs || '',
      cost: proj.cost || 0,
      status: proj.status || 'a_commencer'
    });
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (id) => {
    const isOk = await confirm({
      title: "Supprimer le projet couture",
      message: "Supprimer ce projet couture ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    try {
      await deleteDoc(doc(db, 'coutureProjects', id));
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Erreur de suppression.");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col gap-4 text-left select-none w-full max-w-3xl mx-auto mt-4">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-sm font-black text-red-700 uppercase tracking-widest">
            🚨 ACCÈS REFUSÉ
          </h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous n'avez pas accès au module Vestiaire de l'association.
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ Retour
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-5xl mx-auto select-none">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← Retour
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          👔 Gestion du Vestiaire
        </span>
        <div className="w-12"></div>
      </div>



      {/* TAB 1: COSTUME INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-6">
          <div className="mb-2">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-2">
              <WardrobeBlock 
                formData={formData}
                handleChange={handleChange}
                saving={savingSettings}
              />
              <div className="flex justify-end">
                <CordelButton type="submit" variant="ocre" disabled={savingSettings} className="px-6 py-2 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]">
                  {savingSettings ? "Enregistrement..." : "💾 Enregistrer Configuration"}
                </CordelButton>
              </div>
            </form>
          </div>

          {/* Section 1: Costumes & Pièces Management */}
          <CostumesAdminManager groupId={groupId} />

          {/* Section 2: Physical Items Inventory */}
          <div className="pt-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col gap-4">
            <h3 className="font-cactus font-black text-sm text-cordel-wood uppercase tracking-wider text-left">
              📦 Stock physique & Emprunts de pièces
            </h3>
            <div className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-3 rounded border border-dashed border-encre-noire/15">
              <span className="text-xs font-bold text-cordel-master-dark">
                Total : {costumes.length} pièce{costumes.length > 1 ? 's' : ''} répertoriée{costumes.length > 1 ? 's' : ''}
              </span>
            <button
              type="button"
              onClick={() => {
                setEditingCostume(null);
                setCostumeForm({ type: '', taille: 'M', etat: 'Bon', statut: 'local', emprunteurId: '' });
                setShowCostumeForm(!showCostumeForm);
              }}
              className="text-[10px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer"
            >
              {showCostumeForm ? "Fermer le formulaire" : "➕ Ajouter une pièce"}
            </button>
          </div>

          {/* Costume Ajouter/Edit Form */}
          {showCostumeForm && (
            <form onSubmit={handleCostumeSubmit} className="flex flex-col gap-3.5 bg-white/40 dark:bg-black/20 p-4 rounded border border-dashed border-encre-noire/15 text-xs text-left">
              <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px] border-b border-dashed border-encre-noire/10 pb-1">
                {editingCostume ? "📝 Modifier la pièce" : "➕ Enregistrer une pièce de costume"}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('wardrobe.pieceType')}</label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    value={costumeForm.type}
                    onChange={(e) => setCostumeForm({ ...costumeForm, type: e.target.value })}
                    placeholder="ex: Jupe, Chemise, Chapeau"
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Taille</label>
                  <select
                    disabled={saving}
                    value={costumeForm.taille}
                    onChange={(e) => setCostumeForm({ ...costumeForm, taille: e.target.value })}
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">État</label>
                  <select
                    disabled={saving}
                    value={costumeForm.etat}
                    onChange={(e) => setCostumeForm({ ...costumeForm, etat: e.target.value })}
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  >
                    <option value="Neuf">Neuf</option>
                    <option value="Bon">Bon</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Abîmé">Abîmé</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Statut</label>
                  <select
                    disabled={saving}
                    value={costumeForm.statut}
                    onChange={(e) => setCostumeForm({ ...costumeForm, statut: e.target.value })}
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  >
                    <option value="local">Au local</option>
                    <option value="emprunte">Emprunté</option>
                    <option value="reparation">En réparation</option>
                  </select>
                </div>

                {costumeForm.statut === 'emprunte' && (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Emprunteur</label>
                    <select
                      required
                      disabled={saving}
                      value={costumeForm.emprunteurId}
                      onChange={(e) => setCostumeForm({ ...costumeForm, emprunteurId: e.target.value })}
                      className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                    >
                      <option value="" disabled>Sélectionner un membre...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-[10px] font-black uppercase bg-cordel-ocre text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer"
                >
                  {saving ? "Enregistrement..." : "Valider"}
                </button>
              </div>
            </form>
          )}

          {/* Costume inventory table */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="bg-cordel-bg border-b border-encre-noire text-[9px] uppercase font-black text-cordel-master-dark tracking-wider select-none">
                    <th className="py-2 px-2 md:py-2.5 md:px-4">{t('common.type')}</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4 text-center">{t('onboarding.tshirtSize')}</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4 text-center">{t('common.status')}</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4">{t('common.status')}</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4">Emprunteur</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-encre-noire/10">
                  {costumes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center italic opacity-60">
                        L'inventaire des costumes est vide.
                      </td>
                    </tr>
                  ) : (
                    costumes.map((piece) => (
                      <tr key={piece.id} className="hover:bg-white/20 transition-colors">
                        <td className="py-2 px-2 md:py-2.5 md:px-4 font-bold">{piece.type}</td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 text-center font-black">
                          <span className="bg-amber-100 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">
                            {piece.taille}
                          </span>
                        </td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            piece.etat === 'Neuf' ? 'bg-[#2d6a4f]/15 text-[#2d6a4f] border border-[#2d6a4f]/30 font-black' :
                            piece.etat === 'Bon' ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/20' :
                            piece.etat === 'Moyen' ? 'bg-[#c05621]/15 text-[#c05621] border border-[#c05621]/30 font-bold' : 'bg-[#8b2a1a]/15 text-[#8b2a1a] border border-[#8b2a1a]/30 font-black'
                          }`}>
                            {piece.etat}
                          </span>
                        </td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 font-bold">
                          {piece.statut === 'local' && "🏠 Au local"}
                          {piece.statut === 'emprunte' && "🎒 Emprunte"}
                          {piece.statut === 'reparation' && "🛠️ En réparation"}
                        </td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 italic text-cordel-wood/90">{piece.statut === 'emprunte' ? piece.emprunteurNom : '-'}</td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 text-right">
                          <div className="flex gap-2.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleEditCostume(piece)}
                              className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCostume(piece.id)}
                              className="text-[10px] font-black uppercase text-red-600 hover:underline cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CordelCard>
          </div>
        </div>
      )}

      {/* TAB 2: COUTURE WORKSHOP */}
      {activeTab === 'couture' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-3 rounded border border-dashed border-encre-noire/15">
            <span className="text-xs font-bold text-cordel-master-dark">
              Projets couture : {projects.length} projet{projects.length > 1 ? 's' : ''} en cours
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setProjectForm({ name: '', needs: '', cost: 0, status: 'a_commencer' });
                setShowProjectForm(!showProjectForm);
              }}
              className="text-[10px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer"
            >
              {showProjectForm ? "Fermer le formulaire" : "🧵 Créer un projet"}
            </button>
          </div>

          {/* Couture project form */}
          {showProjectForm && (
            <form onSubmit={handleProjectSubmit} className="flex flex-col gap-3.5 bg-white/40 dark:bg-black/20 p-4 rounded border border-dashed border-encre-noire/15 text-xs text-left">
              <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px] border-b border-dashed border-encre-noire/10 pb-1">
                {editingProject ? "📝 Modifier le projet" : "🧵 Lancer un projet couture"}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Nom du projet</label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="ex: Nouvelles Jupes Blanches"
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Coût estimé (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={saving}
                    value={projectForm.cost}
                    onChange={(e) => setProjectForm({ ...projectForm, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="ex: 150.00"
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Statut</label>
                  <select
                    disabled={saving}
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light"
                  >
                    <option value="a_commencer">À commencer</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 col-span-1 sm:col-span-4">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Besoins / Accessoires (Métrage de tissu, fils, boutons...)</label>
                  <textarea
                    disabled={saving}
                    value={projectForm.needs}
                    onChange={(e) => setProjectForm({ ...projectForm, needs: e.target.value })}
                    placeholder="ex: 20m de Tissu Coton Blanc, Fil résistant blanc, 15m de Ceinture élastique..."
                    className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light h-16 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-[10px] font-black uppercase bg-cordel-ocre text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer"
                >
                  {saving ? "Enregistrement..." : "Créer le projet"}
                </button>
              </div>
            </form>
          )}

          {/* Couture projects table list */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="bg-cordel-bg border-b border-encre-noire text-[9px] uppercase font-black text-cordel-master-dark tracking-wider select-none">
                    <th className="py-2 px-2 md:py-2.5 md:px-4">Projet</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4">Besoins répertoriés</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4 text-center">Coût estimé</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4">Statut</th>
                    <th className="py-2 px-2 md:py-2.5 md:px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-encre-noire/10">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center italic opacity-60">
                        Aucun projet couture pour le moment.
                      </td>
                    </tr>
                  ) : (
                    projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-white/20 transition-colors">
                        <td className="py-2 px-2 md:py-2.5 md:px-4 font-bold text-cordel-wood uppercase text-[10px]">{proj.name}</td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 max-w-xs truncate" title={proj.needs}>{proj.needs || <span className="italic opacity-50">Aucun besoin saisi</span>}</td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 text-center font-black">{proj.cost.toFixed(2)} €</td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 font-bold">
                          {proj.status === 'a_commencer' && "⏳ À commencer"}
                          {proj.status === 'en_cours' && "🧵 En cours"}
                          {proj.status === 'termine' && "✅ Terminé"}
                        </td>
                        <td className="py-2 px-2 md:py-2.5 md:px-4 text-right">
                          <div className="flex gap-2.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleEditProject(proj)}
                              className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(proj.id)}
                              className="text-[10px] font-black uppercase text-red-600 hover:underline cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CordelCard>
        </div>
      )}

      {/* TAB 3: MEMBERS SIZES TABLE */}
      {activeTab === 'sizes' && (
        <div className="w-full">
          <CostumeSizesTable
            allUsers={allUsers}
            profileData={profileData}
          />
        </div>
      )}
      {/* TAB 4: MATIERES PREMIERES */}
      {activeTab === 'supplies' && (
        <div className="flex flex-col gap-6">
          <SuppliesListView 
            supplies={supplies} 
            loading={suppliesLoading} 
            addSupply={addSupply} 
            updateSupply={updateSupply} 
            deleteSupply={deleteSupply} 
            adjustSupplyStock={adjustSupplyStock}
            domaine="costumerie"
          />
        </div>
      )}

      {/* TAB 5: OUTILLAGE */}
      {activeTab === 'tools' && (
        <div className="flex flex-col gap-6">
          <WorkshopToolsListView 
            tools={tools} 
            loading={suppliesLoading} 
            addTool={addTool} 
            updateTool={updateTool} 
            deleteTool={deleteTool} 
            domaine="costumerie"
          />
        </div>
      )}
      
    </div>
  );
}
