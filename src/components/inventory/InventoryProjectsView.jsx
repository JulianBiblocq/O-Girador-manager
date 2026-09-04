import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloChisel } from '../XiloIcons';
import { useInventoryProjects } from '../../hooks/useInventoryProjects';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';
import { useInventoryData } from '../../hooks/useInventoryData';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import { useSuppliesData } from '../../hooks/useSuppliesData';
import PartWorkflowModal from './PartWorkflowModal';
import FabricationCard from '../FabricationCard';
import AssemblySlotItem from './AssemblySlotItem';
import InstrumentVisualizer from './InstrumentVisualizer';
import InstrumentBaptismModal from './InstrumentBaptismModal';
import { doc, writeBatch } from 'firebase/firestore';

export default function InventoryProjectsView({ groupId, isAuthorized, profileData, t, inventoryParts, onCreateInstrument }) {
  const { projects, loading: pLoading, addProject, updateProject, deleteProject } = useInventoryProjects(groupId);
  const { models, loading: mLoading } = useInstrumentModels(groupId);
  const { updatePartWorkflow } = useInventoryData(groupId);
  const { formData: settingsData } = useAssociationSettings(groupId);
  const { tools = [], supplies = [] } = useSuppliesData(groupId, 'lutherie');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectData, setNewProjectData] = useState({ nom: '', modelId: '', artisanId: '' });
  const [selectedSessionSlots, setSelectedSessionSlots] = useState([]);
  const [selectedWorkflowSlot, setSelectedWorkflowSlot] = useState(null);
  const [selectedVaralTutorial, setSelectedVaralTutorial] = useState(null);
  const [workflowToast, setWorkflowToast] = useState(null);
  const [membersList, setMembersList] = useState([]);
  const [viewMode, setViewMode] = useState('schema'); // 'schema' | 'list'
  const [showBaptismModal, setShowBaptismModal] = useState(false);

  // Auto-fermeture du toast d'atelier
  useEffect(() => {
    if (!workflowToast) return;
    const timer = setTimeout(() => setWorkflowToast(null), 4000);
    return () => clearTimeout(timer);
  }, [workflowToast]);

  // Synchronisation de la liste des membres pour assignation d'artisan/élève
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', groupId));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          nom: d.nom || '',
          prenom: d.prenom || '',
          instrument: d.instrument || ''
        });
      });
      list.sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));
      setMembersList(list);
    });
    return () => unsub();
  }, [groupId]);

  /**
   * Adaptateur de données pour convertir les chapitres/matériaux du modèle
   * au format attendu par la modale FabricationCard du Varal.
   */
  const handleOpenVaralTutorial = (slot, model) => {
    if (!slot) return;
    const etapes = (slot.chapitres || []).map((chap, idx) => ({
      id: chap.id || idx,
      sousTitre: chap.titre || `Étape ${idx + 1}`,
      description: chap.texte || '',
      imageUrl: chap.photoUrl || '',
      materiaux: Array.isArray(chap.materiaux) ? chap.materiaux : [],
      outils: Array.isArray(chap.outils) ? chap.outils : []
    }));

    const cardPayload = {
      id: slot.id || slot.slotId,
      titre: `${model?.nom || 'Instrument'} - ${slot.nom || slot.slotLabel}`,
      instrumentConcerne: model?.type || model?.nom || '',
      materielRequis: Array.isArray(slot.materiels) ? slot.materiels : [],
      outilsNecessaires: Array.isArray(slot.outils) ? slot.outils : [],
      contenuFabrication: slot.description || `Fiche de fabrication et montage pour la pièce "${slot.nom || slot.slotLabel}". Suivez les étapes pour usiner et préparer cette pièce.`,
      visuelAnimeUrl: slot.visuelAnimeUrl || '',
      etapesFabrication: etapes,
      notesLexique: slot.notesLexique || []
    };

    setSelectedVaralTutorial(cardPayload);
  };

  const isWorkshopValidator = useMemo(() => {
    if (!profileData) return false;
    if (profileData.isSystemAdmin) return true;
    if (profileData.role === 'mestre' || profileData.role === 'super-admin') return true;
    
    const permissionsMatrice = settingsData?.permissionsMatrice || {};
    const validatorTags = permissionsMatrice.canValidateWorkshopSteps || [];
    const userTags = profileData.tags || [];
    
    return validatorTags.some(tagId => userTags.includes(tagId));
  }, [profileData, settingsData]);

  const toggleSessionSlot = (slotId) => {
    setSelectedSessionSlots(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const availableStock = useMemo(() => {
    return inventoryParts.filter(p => p.status === 'En stock');
  }, [inventoryParts]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.nom || !newProjectData.modelId) return;
    try {
      const selectedMember = membersList.find(m => m.id === newProjectData.artisanId);
      const artisanNom = selectedMember ? `${selectedMember.prenom || ''} ${selectedMember.nom || ''}`.trim() : null;
      await addProject({
        ...newProjectData,
        artisanId: newProjectData.artisanId || null,
        artisanNom: artisanNom || null
      });
      setIsAdding(false);
      setNewProjectData({ nom: '', modelId: '', artisanId: '' });
    } catch (err) {
      alert("Erreur lors de la création du projet.");
    }
  };

  const handleDeleteProject = async (id, nom) => {
    if (window.confirm(`Supprimer le projet "${nom}" ?`)) {
      await deleteProject(id);
      if (editingProject?.id === id) setEditingProject(null);
    }
  };

  const handleAssignPart = async (projectId, modelPartId, inventoryPartId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Si on désassigne (inventoryPartId === '')
    let newAssignees = [...(project.piecesAssignees || [])];
    if (!inventoryPartId) {
      newAssignees = newAssignees.filter(a => a.modelPartId !== modelPartId);
    } else {
      // Si on assigne
      const existingIdx = newAssignees.findIndex(a => a.modelPartId === modelPartId);
      if (existingIdx >= 0) {
        newAssignees[existingIdx].inventoryPartId = inventoryPartId;
      } else {
        newAssignees.push({ modelPartId, inventoryPartId });
      }
    }

    try {
      await updateProject(projectId, { piecesAssignees: newAssignees });
    } catch (err) {
      alert("Erreur d'assignation.");
    }
  };

  const handleOpenBaptismModal = (project, model) => {
    setShowBaptismModal(true);
  };

  const handleUpdateSlotWorkflow = async (slotId, workflowUpdates, isSlotFinished) => {
    const currentProject = projects.find(p => p.id === editingProject?.id) || editingProject;
    if (!currentProject) return;

    try {
      const currentSlotsWf = currentProject.slotsWorkflow || {};
      const newSlotsWf = {
        ...currentSlotsWf,
        [slotId]: {
          ...(currentSlotsWf[slotId] || {}),
          ...workflowUpdates
        }
      };

      let updatedAssignees = [...(currentProject.piecesAssignees || [])];
      
      // Si la phase est terminée, propager automatiquement la pièce à la phase suivante si elle n'est pas assignée !
      if (isSlotFinished) {
        const model = models.find(m => m.id === currentProject.modelId);
        const allSlots = (model?.parts || []).flatMap(p => {
          const qty = parseInt(p.quantiteRequise, 10) || 1;
          return Array.from({length: qty}, (_, i) => ({
            ...p,
            slotId: qty > 1 ? `${p.id}_${i}` : p.id,
            slotLabel: qty > 1 ? `${p.nom} (${i + 1}/${qty})` : p.nom,
            originalPartId: p.id
          }));
        });

        const currentSlotIdx = allSlots.findIndex(s => s.slotId === slotId);
        const assignedMap = updatedAssignees.reduce((acc, curr) => {
          acc[curr.modelPartId] = curr.inventoryPartId;
          return acc;
        }, {});
        const currentAssignedId = assignedMap[slotId];

        if (currentSlotIdx >= 0 && currentSlotIdx < allSlots.length - 1 && currentAssignedId) {
          const nextSlot = allSlots[currentSlotIdx + 1];
          const nextAssigned = updatedAssignees.find(a => a.modelPartId === nextSlot.slotId);
          if (!nextAssigned) {
            updatedAssignees.push({
              modelPartId: nextSlot.slotId,
              inventoryPartId: currentAssignedId
            });
          }
          // Initialiser la phase suivante à l'étape 0
          if (!newSlotsWf[nextSlot.slotId]) {
            newSlotsWf[nextSlot.slotId] = {
              currentStepIndex: 0,
              statutEtape: 'en_cours',
              historiqueControles: []
            };
          }
        }
      }

      await updateProject(currentProject.id, {
        slotsWorkflow: newSlotsWf,
        piecesAssignees: updatedAssignees
      });

      setEditingProject(prev => prev ? ({
        ...prev,
        slotsWorkflow: newSlotsWf,
        piecesAssignees: updatedAssignees
      }) : prev);
    } catch (err) {
      console.error("Erreur mise à jour workflow du slot :", err);
      throw err;
    }
  };

  const handleValidateBaptism = async (project, model, formData) => {
    try {
      const batch = writeBatch(db);
      const inventoryRef = collection(db, 'inventory');
      const newInstrumentRef = doc(inventoryRef);
      
      const assignedPartsIds = (project.piecesAssignees || []).map(a => a.inventoryPartId).filter(Boolean);

      const kitChecklist = formData.kitAccessoires 
        ? formData.kitAccessoires.split(',').map(s => s.trim()).filter(Boolean).map((nom, idx) => ({ id: Date.now() + idx, nom, checked: true }))
        : [];

      // 1. Création de l'instrument
      const instrumentData = {
        groupId,
        nom: formData.nom,
        type: model.type || model.nom,
        etat: 'Neuf',
        proprietaire: formData.proprietaire || 'Association',
        localisationPhysique: formData.localisationPhysique || 'Local',
        status: 'En stock',
        assignations: [],
        kitChecklist,
        nomenclature: assignedPartsIds,
        createdAt: new Date().toISOString()
      };
      batch.set(newInstrumentRef, instrumentData);

      // 2. Mise à jour des pièces détachées
      assignedPartsIds.forEach(partId => {
        const partRef = doc(db, 'inventory_parts', partId);
        batch.update(partRef, {
          status: 'Assemble',
          instrumentAssocie_id: newInstrumentRef.id
        });
      });

      // 3. Marquer le projet comme terminé
      const projectRef = doc(db, 'inventory_projects', project.id);
      batch.update(projectRef, {
        status: 'termine',
        statut: 'Terminé',
        statutProjet: 'termine',
        updatedAt: new Date().toISOString()
      });

      await batch.commit();
      
      setShowBaptismModal(false);
      setEditingProject(null);
      setWorkflowToast({
        type: 'validated',
        title: "🎉 Instrument baptisé avec succès !",
        message: `L'instrument "${formData.nom}" a été intégré au parc officiel de l'association.`
      });
    } catch (err) {
      console.error("Erreur lors de la clôture du chantier :", err);
      alert("Une erreur est survenue lors de la clôture du chantier.");
    }
  };

  if (pLoading || mLoading) {
    return <div className="text-[10px] text-center p-4">Chargement de l'atelier...</div>;
  }

  // VUE DETAIL : Projet en cours d'édition
  if (editingProject) {
    const project = projects.find(p => p.id === editingProject.id) || editingProject;
    const model = models.find(m => m.id === project.modelId);

    if (!model) {
      return (
        <CordelCard variant="default" className="p-4">
          <p className="text-red-500 text-xs">Modèle introuvable. Il a peut-être été supprimé.</p>
          <CordelButton variant="default" onClick={() => setEditingProject(null)}>Retour</CordelButton>
        </CordelCard>
      );
    }

    const allSlots = (model.parts || []).flatMap(p => {
      const qty = parseInt(p.quantiteRequise, 10) || 1;
      return Array.from({length: qty}, (_, i) => ({
        ...p,
        slotId: qty > 1 ? `${p.id}_${i}` : p.id,
        slotLabel: qty > 1 ? `${p.nom} (${i + 1}/${qty})` : p.nom,
        originalPartId: p.id
      }));
    });

    const assignedMap = (project.piecesAssignees || []).reduce((acc, curr) => {
      acc[curr.modelPartId] = curr.inventoryPartId;
      return acc;
    }, {});

    const missingSlots = allSlots.filter(s => !assignedMap[s.slotId]);
    
    // Pièce de référence déjà assignée dans le projet pour continuer simplement entre les phases
    const defaultProjectPiece = (() => {
      const firstAssigned = (project.piecesAssignees || []).find(a => a.inventoryPartId);
      if (!firstAssigned) return null;
      return inventoryParts.find(p => p.id === firstAssigned.inventoryPartId) || null;
    })();

    // Progression globale des phases
    const finishedSlotsCount = allSlots.filter(slot => {
      const slotWf = project.slotsWorkflow?.[slot.slotId];
      const assignedInvId = assignedMap[slot.slotId];
      const invPart = inventoryParts.find(p => p.id === assignedInvId);
      const totalSteps = slot.chapitres?.length || 0;
      const currentStep = slotWf?.currentStepIndex !== undefined ? slotWf.currentStepIndex : (invPart?.currentStepIndex || 0);
      const statutEtape = slotWf?.statutEtape || invPart?.statutEtape || 'en_cours';
      return !!assignedInvId && (statutEtape === 'terminee' || totalSteps === 0 || currentStep >= totalSteps);
    }).length;

    const allSlotsFinished = allSlots.length > 0 && finishedSlotsCount === allSlots.length;

    // Compilation liste courses / outils pour les pièces MANQUANTES uniquement
    const missingMats = new Set();
    const missingOutils = new Set();
    missingSlots.forEach(s => {
      (s.materiels || []).forEach(m => missingMats.add(m));
      (s.outils || []).forEach(o => missingOutils.add(o));
    });

    const isComplete = allSlotsFinished || (allSlots.length > 0 && missingSlots.length === 0);

    // Compilation complète de la Mallette de la séance
    const sessionOutils = new Set();
    const sessionMateriaux = new Set();
    
    selectedSessionSlots.forEach(slotId => {
      const slot = allSlots.find(s => s.slotId === slotId);
      if (!slot) return;
      
      // 1. Outils & matériaux du slot (définis au niveau de la pièce/phase)
      (slot.outils || []).forEach(o => o && sessionOutils.add(o.trim()));
      (slot.materiels || []).forEach(m => m && sessionMateriaux.add(m.trim()));

      // 2. Outils & matériaux de tous les chapitres/étapes de ce slot
      (slot.chapitres || []).forEach(chap => {
        (chap.outils || []).forEach(o => o && sessionOutils.add(o.trim()));
        (chap.materiaux || []).forEach(m => m && sessionMateriaux.add(m.trim()));
      });
    });

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-cordel-bg-light border border-cordel-master-dark/20 p-3 rounded">
          <div>
            <h3 className="text-sm font-black text-cordel-wood uppercase">Projet : {project.nom}</h3>
            <p className="text-[10px] text-stone-500 font-bold">Modèle : {model.nom}</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-stone-300 rounded shadow-xs">
              <span className="text-[10px] font-bold text-stone-500">👤 Artisan :</span>
              <select
                value={project.artisanId || ''}
                onChange={async (e) => {
                  const aid = e.target.value;
                  const selectedMember = membersList.find(m => m.id === aid);
                  const anom = selectedMember ? `${selectedMember.prenom || ''} ${selectedMember.nom || ''}`.trim() : null;
                  await updateProject(project.id, { artisanId: aid || null, artisanNom: anom || null });
                  setEditingProject(prev => ({ ...prev, artisanId: aid || null, artisanNom: anom || null }));
                }}
                className="theme-input text-[10px] py-0.5 px-1 bg-transparent border-none cursor-pointer"
              >
                <option value="">-- Projet collectif (Atelier) --</option>
                {membersList.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.prenom} {m.nom} {m.instrument ? `(${m.instrument})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={() => setEditingProject(null)} className="text-[10px] bg-white border border-encre-noire px-3 py-1 rounded shadow hover:bg-stone-100 cursor-pointer font-bold">
              Fermer le projet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne gauche : Assemblage */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-white/50">
              <h4 className="text-xs font-bold text-encre-noire uppercase mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span>Pièces & Phases requises</span>
                  <span className="text-[10px] bg-cordel-wood text-white px-2 py-0.5 rounded-full font-black">
                    {finishedSlotsCount} / {allSlots.length} validée{allSlots.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-1 bg-cordel-master-dark/10 p-0.5 rounded">
                  <button 
                    onClick={() => setViewMode('schema')} 
                    className={`text-[9px] px-2 py-1 rounded transition-colors ${viewMode === 'schema' ? 'bg-white shadow text-cordel-wood font-black' : 'text-stone-500 hover:text-cordel-wood'}`}
                  >
                    🖼️ Schéma
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`text-[9px] px-2 py-1 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow text-cordel-wood font-black' : 'text-stone-500 hover:text-cordel-wood'}`}
                  >
                    📋 Liste
                  </button>
                </div>
              </h4>
              
              <div className="flex flex-col gap-2">
                {viewMode === 'schema' ? (
                  <InstrumentVisualizer 
                    modelType={model.type || model.nom}
                    slots={allSlots}
                    assignedMap={assignedMap}
                    inventoryParts={inventoryParts}
                    onSelectPiece={(slot) => {
                      const assignedInvId = assignedMap[slot.slotId] || defaultProjectPiece?.id;
                      const invPart = inventoryParts.find(p => p.id === assignedInvId);
                      setSelectedWorkflowSlot({ slot, invPart });
                    }}
                  />
                ) : (
                  allSlots.map(slot => {
                    const assignedInvId = assignedMap[slot.slotId];
                    const invPart = inventoryParts.find(p => p.id === assignedInvId);

                    return (
                      <AssemblySlotItem
                        key={slot.slotId}
                        slot={slot}
                        model={model}
                        invPart={invPart}
                        slotWorkflow={project.slotsWorkflow?.[slot.slotId]}
                        defaultProjectPiece={defaultProjectPiece}
                        isSessionSelected={selectedSessionSlots.includes(slot.slotId)}
                        onToggleSessionSlot={toggleSessionSlot}
                        onSelectWorkflow={setSelectedWorkflowSlot}
                        onAssignPart={(slotId, partId) => handleAssignPart(project.id, slotId, partId)}
                        onOpenVaralTutorial={(s) => handleOpenVaralTutorial(s, model)}
                        availableStock={availableStock}
                      />
                    );
                  })
                )}
              </div>

              {isComplete && (
                <div className="mt-6 p-4 bg-cordel-vert/20 border border-cordel-vert rounded text-center flex flex-col gap-3">
                  <span className="text-sm font-black text-cordel-vert uppercase tracking-wider">
                    🎉 {allSlotsFinished ? "Toutes les phases de fabrication sont validées !" : "Toutes les pièces sont assemblées !"}
                  </span>
                  <CordelButton 
                    variant="vert" 
                    useExtremeBorder={true}
                    onClick={() => handleOpenBaptismModal(project, model)}
                    className="self-center shadow-lg"
                  >
                    🥁 Clôturer l'assemblage & Baptiser l'instrument
                  </CordelButton>
                </div>
              )}
            </CordelCard>
          </div>

          {/* Colonne droite : Feuille de route & Mallette */}
          <div className="flex flex-col gap-3">
            {/* Mallette de la Session */}
            {selectedSessionSlots.length > 0 ? (
              <CordelCard variant="ocre" className="p-4 bg-[var(--color-cordel-wood)] text-white shadow-md">
                <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-3">
                  <h4 className="text-xs font-black uppercase flex items-center gap-2 tracking-wider">
                    <span>🧰</span> Mallette de la séance ({selectedSessionSlots.length} phase{selectedSessionSlots.length > 1 ? 's' : ''})
                  </h4>
                  <button
                    onClick={() => setSelectedSessionSlots([])}
                    className="text-[9px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded cursor-pointer font-bold transition-colors"
                    title="Vider la mallette de séance"
                  >
                    Vider
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Outils nécessaires avec correspondance inventaire physique */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <strong className="text-[10px] uppercase font-bold text-white/90">
                        🛠️ Outils à emporter ({sessionOutils.size})
                      </strong>
                    </div>
                    {sessionOutils.size > 0 ? (
                      <ul className="flex flex-col gap-1.5">
                        {Array.from(sessionOutils).map((outilNom, idx) => {
                          const found = tools.find(t => t.nom?.toLowerCase().trim() === outilNom.toLowerCase().trim());
                          return (
                            <li key={idx} className="bg-white text-stone-900 px-2.5 py-1.5 rounded border border-stone-300 flex items-center justify-between gap-2 shadow-xs text-[10px]">
                              <span className="font-bold flex items-center gap-1.5 min-w-0 truncate">
                                <span>🔧</span>
                                <span className="truncate">{outilNom}</span>
                              </span>
                              {found ? (
                                <div className="flex items-center gap-1 shrink-0 text-[9px]">
                                  <span className={`px-1.5 py-0.5 rounded font-black uppercase ${
                                    found.isResident 
                                      ? 'bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)]' 
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}>
                                    {found.isResident ? '🏠 Au local' : '🚗 Mobile'}
                                  </span>
                                  {found.emplacement && (
                                    <span className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200 font-bold" title="Emplacement / Atelier de l'outil">
                                      📍 {found.emplacement}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[9px] text-stone-400 italic shrink-0">
                                  Non inventorié
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-[10px] text-white/70 italic">Aucun outil requis pour les phases sélectionnées</span>
                    )}
                  </div>

                  {/* Matériaux & Fournitures à préparer avec stock */}
                  <div className="border-t border-white/20 pt-2.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <strong className="text-[10px] uppercase font-bold text-white/90">
                        📦 Matériaux & Fournitures ({sessionMateriaux.size})
                      </strong>
                    </div>
                    {sessionMateriaux.size > 0 ? (
                      <ul className="flex flex-col gap-1.5">
                        {Array.from(sessionMateriaux).map((matNom, idx) => {
                          const found = supplies.find(s => s.nom?.toLowerCase().trim() === matNom.toLowerCase().trim());
                          const hasStock = found && Number(found.quantiteStock) > 0;
                          return (
                            <li key={idx} className="bg-white text-stone-900 px-2.5 py-1.5 rounded border border-stone-300 flex items-center justify-between gap-2 shadow-xs text-[10px]">
                              <span className="font-bold flex items-center gap-1.5 min-w-0 truncate">
                                <span>📦</span>
                                <span className="truncate">{matNom}</span>
                              </span>
                              {found ? (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                                  hasStock
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-red-50 text-red-800 border-red-300'
                                }`}>
                                  {hasStock ? `Stock : ${found.quantiteStock} ${found.unite || ''}` : 'Rupture'}
                                </span>
                              ) : (
                                <span className="text-[9px] text-stone-400 italic shrink-0">
                                  Non répertorié
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-[10px] text-white/70 italic">Aucun matériau requis pour les phases sélectionnées</span>
                    )}
                  </div>
                </div>
              </CordelCard>
            ) : (
              <CordelCard variant="default" className="p-3.5 bg-amber-50/70 border-dashed border-amber-300 text-stone-700">
                <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-[var(--color-cordel-wood)]">
                  <span>🧰</span>
                  <span>Mallette de la séance d'atelier</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-snug">
                  Cliquez sur le bouton <strong>"+ Mallette séance"</strong> à côté d'une ou plusieurs phases pour préparer la liste des outils et matériaux à emporter pour votre atelier.
                </p>
              </CordelCard>
            )}

            <CordelCard variant="default" className="p-4 bg-cordel-master-dark/5 border-cordel-master-dark/20 shadow-none">
              <h4 className="text-xs font-extrabold text-cordel-wood uppercase mb-2 flex items-center gap-2">
                <XiloChisel size={14} /> Feuille de route
              </h4>
              <p className="text-[9px] text-stone-600 leading-relaxed mb-4">
                Liste consolidée pour les <strong className="text-cordel-rouge">{missingSlots.length} pièces restant à fabriquer</strong>.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <h5 className="text-[10px] font-bold text-encre-noire uppercase mb-1">🛒 Matériaux & Fournitures</h5>
                  {missingMats.size === 0 ? <span className="text-[9px] italic opacity-50">Aucun</span> : (
                    <ul className="flex flex-col gap-1 text-[10px]">
                      {Array.from(missingMats).map((matNom, i) => {
                        const found = supplies.find(s => s.nom?.toLowerCase().trim() === matNom.toLowerCase().trim());
                        const hasStock = found && Number(found.quantiteStock) > 0;
                        return (
                          <li key={i} className="bg-white px-2 py-1 rounded border border-encre-noire/15 flex items-center justify-between gap-2">
                            <span className="font-bold flex items-center gap-1.5 text-stone-800">
                              <span>📦</span> {matNom}
                            </span>
                            {found ? (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                hasStock
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-red-50 text-red-800 border-red-300'
                              }`}>
                                {hasStock ? `En stock : ${found.quantiteStock} ${found.unite || ''}` : 'Rupture'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-stone-400 italic">
                                Non répertorié
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-encre-noire uppercase mb-1">🧰 Outils à préparer</h5>
                  {missingOutils.size === 0 ? <span className="text-[9px] italic opacity-50">Aucun</span> : (
                    <ul className="flex flex-col gap-1 text-[10px]">
                      {Array.from(missingOutils).map((outilNom, i) => {
                        const found = tools.find(t => t.nom?.toLowerCase().trim() === outilNom.toLowerCase().trim());
                        return (
                          <li key={i} className="bg-white px-2 py-1 rounded border border-encre-noire/15 flex items-center justify-between gap-2">
                            <span className="font-bold flex items-center gap-1.5 text-stone-800">
                              <span>🛠️</span> {outilNom}
                            </span>
                            {found ? (
                              <div className="flex items-center gap-1.5 shrink-0 text-[9px]">
                                <span className={`px-1.5 py-0.5 rounded font-black uppercase ${
                                  found.isResident ? 'bg-cordel-vert/15 text-cordel-vert' : 'bg-cordel-ocre/15 text-cordel-ocre'
                                }`}>
                                  {found.isResident ? '🏠 Au local' : '🚗 Mobile'}
                                </span>
                                {found.emplacement && (
                                  <span className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200 font-bold" title="Emplacement / Atelier de l'outil">
                                    📍 {found.emplacement}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] text-stone-400 italic">
                                Non répertorié
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </CordelCard>
          </div>
        </div>

        <PartWorkflowModal
          isOpen={!!selectedWorkflowSlot}
          onClose={() => setSelectedWorkflowSlot(null)}
          slot={selectedWorkflowSlot?.slot}
          invPart={inventoryParts?.find(p => p.id === selectedWorkflowSlot?.invPart?.id) || selectedWorkflowSlot?.invPart}
          project={project}
          onUpdateSlotWorkflow={handleUpdateSlotWorkflow}
          updatePartWorkflow={updatePartWorkflow}
          isValidator={isWorkshopValidator}
          validatorName={profileData?.prenom || profileData?.nom_complet || 'Admin'}
          onFeedback={(fb) => setWorkflowToast(fb)}
        />

        {showBaptismModal && (
          <InstrumentBaptismModal
            project={project}
            model={model}
            onClose={() => setShowBaptismModal(false)}
            onValidate={(formData) => handleValidateBaptism(project, model, formData)}
          />
        )}

        {selectedVaralTutorial && (
          <FabricationCard
            fabrication={selectedVaralTutorial}
            onClose={() => setSelectedVaralTutorial(null)}
          />
        )}

        {/* Notification flottante de validation ou soumission */}
        {workflowToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg border-2 border-encre-noire shadow-2xl bg-white animate-fade-in">
            <span className="text-3xl">
              {workflowToast.type === 'submitted' ? '📨' : workflowToast.type === 'validated' ? '🎉' : '🔄'}
            </span>
            <div className="text-left">
              <h5 className="text-xs font-black uppercase tracking-wider text-encre-noire">{workflowToast.title}</h5>
              <p className="text-[11px] text-stone-600 font-bold">{workflowToast.message}</p>
            </div>
            <button 
              onClick={() => setWorkflowToast(null)} 
              className="ml-2 text-stone-400 hover:text-stone-700 font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // VUE LISTE : Projets d'atelier
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/30 pb-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            🛠️ L'Atelier (Projets en cours)
          </h3>
          <p className="text-[10px] text-stone-500 mt-1">Assemblez des pièces pour créer de nouveaux instruments.</p>
        </div>
        {isAuthorized && (
          <CordelButton 
            variant="vert" 
            onClick={() => setIsAdding(true)}
            className="text-xs shadow-md"
          >
            + Démarrer un projet
          </CordelButton>
        )}
      </div>

      {isAdding && (
        <CordelCard variant="default" className="p-4 bg-cordel-vert/5 border-cordel-vert/30 mb-4">
          <h4 className="text-xs font-bold text-encre-noire uppercase mb-3">Nouveau projet d'assemblage</h4>
          <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Nom de l'instrument (ex: Alfaia N°12)"
              value={newProjectData.nom}
              onChange={e => setNewProjectData(prev => ({ ...prev, nom: e.target.value }))}
              required
              className="theme-input text-xs py-1.5 flex-1 min-w-[200px]"
            />
            <select
              value={newProjectData.modelId}
              onChange={e => setNewProjectData(prev => ({ ...prev, modelId: e.target.value }))}
              required
              className="theme-input text-xs py-1.5 flex-1 min-w-[180px] bg-white"
            >
              <option value="">-- Choisir un Modèle du Varal --</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>
              ))}
            </select>
            <select
              value={newProjectData.artisanId || ''}
              onChange={e => setNewProjectData(prev => ({ ...prev, artisanId: e.target.value }))}
              className="theme-input text-xs py-1.5 flex-1 min-w-[180px] bg-white"
            >
              <option value="">-- Artisan : Projet collectif (Atelier) --</option>
              {membersList.map(m => (
                <option key={m.id} value={m.id}>
                  👤 {m.prenom} {m.nom} {m.instrument ? `(${m.instrument})` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] font-bold px-3 border rounded hover:bg-stone-100 cursor-pointer">Annuler</button>
              <button type="submit" className="text-[10px] font-bold px-3 bg-cordel-vert text-white rounded cursor-pointer">Créer</button>
            </div>
          </form>
        </CordelCard>
      )}

      {projects.length === 0 && !isAdding ? (
        <div className="text-center py-10 bg-white/40 border border-dashed border-cordel-master-dark/30 rounded">
          <span className="text-xs text-stone-500 font-bold">Aucun projet en cours dans l'atelier.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(proj => {
            const model = models.find(m => m.id === proj.modelId);
            const totalParts = model?.parts?.length || 0;
            const assignedParts = proj.piecesAssignees?.length || 0;
            const progress = totalParts > 0 ? Math.round((assignedParts / totalParts) * 100) : 0;

            return (
              <CordelCard key={proj.id} variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-encre-noire">{proj.nom}</h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[9px] text-cordel-wood uppercase font-bold tracking-wider">Modèle : {model?.nom || 'Inconnu'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-stone-100 border border-stone-200 text-stone-700">
                        {proj.artisanNom ? `👤 ${proj.artisanNom}` : "🏛️ Projet d'atelier"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-cordel-master-dark/10 px-2 py-0.5 rounded text-encre-noire uppercase font-bold">
                    {proj.statut}
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Progression assemblage</span>
                    <span>{assignedParts} / {totalParts} pièces</span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progress === 100 ? 'bg-cordel-vert' : 'bg-cordel-ocre'} transition-all`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
                  <button 
                    onClick={() => setEditingProject(proj)}
                    className="text-[10px] font-bold text-cordel-wood hover:underline"
                  >
                    Ouvrir l'établi
                  </button>
                  <button 
                    onClick={() => handleDeleteProject(proj.id, proj.nom)}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Annuler
                  </button>
                </div>
              </CordelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
