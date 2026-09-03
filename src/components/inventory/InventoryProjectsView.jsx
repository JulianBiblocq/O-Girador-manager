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
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectData, setNewProjectData] = useState({ nom: '', modelId: '', artisanId: '' });
  const [selectedSessionSlots, setSelectedSessionSlots] = useState([]);
  const [selectedWorkflowSlot, setSelectedWorkflowSlot] = useState(null);
  const [selectedVaralTutorial, setSelectedVaralTutorial] = useState(null);
  const [membersList, setMembersList] = useState([]);
  const [viewMode, setViewMode] = useState('schema'); // 'schema' | 'list'
  const [showBaptismModal, setShowBaptismModal] = useState(false);

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
        updatedAt: new Date().toISOString()
      });

      await batch.commit();
      
      setShowBaptismModal(false);
      setEditingProject(null);
      // Appel optionnel pour rafraîchir ou notifier le parent si nécessaire
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
    
    // Compilation liste courses / outils pour les pièces MANQUANTES uniquement
    const missingMats = new Set();
    const missingOutils = new Set();
    missingSlots.forEach(s => {
      (s.materiels || []).forEach(m => missingMats.add(m));
      (s.outils || []).forEach(o => missingOutils.add(o));
    });

    const isComplete = missingSlots.length === 0;

    // Calcul de la Mallette
    const sessionOutils = new Set();
    const sessionMateriaux = new Set();
    
    selectedSessionSlots.forEach(slotId => {
      const slot = allSlots.find(s => s.slotId === slotId);
      if (!slot) return;
      const assignedInvId = assignedMap[slotId];
      const invPart = inventoryParts.find(p => p.id === assignedInvId);
      const currentStep = invPart?.currentStepIndex || 0;
      
      const stepData = slot.chapitres?.[currentStep];
      if (stepData) {
        (stepData.outils || []).forEach(o => sessionOutils.add(o));
        (stepData.materiaux || []).forEach(m => sessionMateriaux.add(m));
      }
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
                  <span>Pièces requises pour l'assemblage</span>
                  <span className="text-[10px] bg-cordel-wood text-white px-2 py-0.5 rounded-full">{allSlots.length - missingSlots.length} / {allSlots.length}</span>
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
                    onSelectPiece={setSelectedWorkflowSlot}
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
                  <span className="text-sm font-black text-cordel-vert uppercase tracking-wider">🎉 Toutes les pièces sont assemblées !</span>
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
            {selectedSessionSlots.length > 0 && (
              <CordelCard variant="ocre" className="p-4 bg-cordel-wood text-cordel-bg-light">
                <h4 className="text-xs font-black uppercase mb-3 flex items-center gap-2 border-b border-cordel-bg-light/30 pb-2">
                  🧰 Mallette de la séance
                </h4>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <strong className="text-[10px] opacity-80 uppercase">Outils nécessaires :</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sessionOutils.size > 0 ? Array.from(sessionOutils).map(o => (
                        <span key={o} className="text-[9px] bg-white text-cordel-wood px-2 py-0.5 rounded font-bold shadow-sm">{o}</span>
                      )) : <span className="text-[9px] opacity-50 italic">Aucun outil spécifique</span>}
                    </div>
                  </div>
                  <div>
                    <strong className="text-[10px] opacity-80 uppercase">Matériaux à préparer :</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sessionMateriaux.size > 0 ? Array.from(sessionMateriaux).map(m => (
                        <span key={m} className="text-[9px] bg-white text-cordel-wood px-2 py-0.5 rounded font-bold shadow-sm">{m}</span>
                      )) : <span className="text-[9px] opacity-50 italic">Aucun matériau spécifique</span>}
                    </div>
                  </div>
                </div>
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
                  <h5 className="text-[10px] font-bold text-encre-noire uppercase mb-1">🛒 Matériaux à acheter / prévoir</h5>
                  {missingMats.size === 0 ? <span className="text-[9px] italic opacity-50">Aucun</span> : (
                    <ul className="list-disc list-inside text-[9px] flex flex-col gap-0.5">
                      {Array.from(missingMats).map((m, i) => <li key={i} className="bg-white px-1 py-0.5 rounded border border-encre-noire/10 w-fit">{m}</li>)}
                    </ul>
                  )}
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-encre-noire uppercase mb-1">🧰 Outils à préparer</h5>
                  {missingOutils.size === 0 ? <span className="text-[9px] italic opacity-50">Aucun</span> : (
                    <ul className="list-disc list-inside text-[9px] flex flex-col gap-0.5">
                      {Array.from(missingOutils).map((m, i) => <li key={i} className="bg-white px-1 py-0.5 rounded border border-encre-noire/10 w-fit">{m}</li>)}
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
          invPart={selectedWorkflowSlot?.invPart}
          updatePartWorkflow={updatePartWorkflow}
          isValidator={isWorkshopValidator}
          validatorName={profileData?.prenom || profileData?.nom_complet || 'Admin'}
        />

        {selectedVaralTutorial && (
          <FabricationCard
            fabrication={selectedVaralTutorial}
            onClose={() => setSelectedVaralTutorial(null)}
          />
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
