import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose, XiloChisel } from '../XiloIcons';
import { useInventoryProjects } from '../../hooks/useInventoryProjects';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';

export default function InventoryProjectsView({ groupId, isAuthorized, t, inventoryParts, onCreateInstrument }) {
  const { projects, loading: pLoading, addProject, updateProject, deleteProject } = useInventoryProjects(groupId);
  const { models, loading: mLoading } = useInstrumentModels(groupId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectData, setNewProjectData] = useState({ nom: '', modelId: '' });

  const availableStock = useMemo(() => {
    return inventoryParts.filter(p => p.status === 'En stock');
  }, [inventoryParts]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.nom || !newProjectData.modelId) return;
    try {
      await addProject(newProjectData);
      setIsAdding(false);
      setNewProjectData({ nom: '', modelId: '' });
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

  const handleFinalizeProject = async (project, model) => {
    if (window.confirm(`Voulez-vous clôturer ce projet et générer l'instrument "${project.nom}" complet dans l'inventaire ?`)) {
      // 1. Appeler le parent pour créer l'instrument avec la nomenclature
      const assignedPartsIds = (project.piecesAssignees || []).map(a => a.inventoryPartId).filter(Boolean);
      
      const success = await onCreateInstrument({
        nom: project.nom,
        type: model.type,
        etat: 'Neuf',
        proprietaire: 'Association',
        localisationPhysique: 'Local',
        status: 'En stock',
        assignations: [],
        kitChecklist: [],
        nomenclature: assignedPartsIds
      });

      if (success) {
        // 2. Supprimer ou archiver le projet
        await deleteProject(project.id);
        setEditingProject(null);
      }
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

    const assignedMap = (project.piecesAssignees || []).reduce((acc, curr) => {
      acc[curr.modelPartId] = curr.inventoryPartId;
      return acc;
    }, {});

    const missingParts = model.parts.filter(p => !assignedMap[p.id]);
    
    // Compilation liste courses / outils pour les pièces MANQUANTES uniquement
    const missingMats = new Set();
    const missingOutils = new Set();
    missingParts.forEach(p => {
      (p.materiels || []).forEach(m => missingMats.add(m));
      (p.outils || []).forEach(o => missingOutils.add(o));
    });

    const isComplete = missingParts.length === 0;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-cordel-bg-light border border-cordel-master-dark/20 p-3 rounded">
          <div>
            <h3 className="text-sm font-black text-cordel-wood uppercase">Projet : {project.nom}</h3>
            <p className="text-[10px] text-stone-500 font-bold">Modèle : {model.nom}</p>
          </div>
          <button onClick={() => setEditingProject(null)} className="text-[10px] bg-white border border-encre-noire px-3 py-1 rounded shadow hover:bg-stone-100">
            Fermer le projet
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne gauche : Assemblage */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-white/50">
              <h4 className="text-xs font-bold text-encre-noire uppercase mb-3 flex justify-between">
                <span>Pièces requises pour l'assemblage</span>
                <span className="text-[10px] bg-cordel-wood text-white px-2 rounded-full">{model.parts.length - missingParts.length} / {model.parts.length}</span>
              </h4>
              
              <div className="flex flex-col gap-2">
                {model.parts.map(part => {
                  const assignedInvId = assignedMap[part.id];
                  const isAssigned = !!assignedInvId;
                  
                  return (
                    <div key={part.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-2 rounded border ${isAssigned ? 'bg-cordel-vert/10 border-cordel-vert' : 'bg-[#faf8f5] border-dashed border-cordel-master-dark/30'}`}>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-encre-noire flex items-center gap-2">
                          {isAssigned ? '✅' : '⏳'} {part.nom}
                        </span>
                        {!isAssigned && part.chapitres?.length > 0 && (
                          <span className="text-[9px] text-cordel-wood italic mt-0.5">
                            Voir le tuto ({part.chapitres.length} étapes) dans le Varal
                          </span>
                        )}
                      </div>

                      <div className="mt-2 sm:mt-0">
                        {isAssigned ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                              Assigné: {inventoryParts.find(p => p.id === assignedInvId)?.nom || 'Pièce inconnue'}
                            </span>
                            <button 
                              onClick={() => handleAssignPart(project.id, part.id, null)}
                              className="text-[9px] text-red-500 hover:underline font-bold"
                            >
                              Retirer
                            </button>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => handleAssignPart(project.id, part.id, e.target.value)}
                            value=""
                            className="theme-input text-[10px] py-1 bg-white max-w-[200px]"
                          >
                            <option value="">-- Pieuiser dans le stock --</option>
                            {availableStock.map(sp => (
                              // On ne disable pas strictement car les noms peuvent différer, on fait confiance au luthier
                              <option key={sp.id} value={sp.id}>
                                {sp.nom} ({sp.typePiece})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isComplete && (
                <div className="mt-6 p-4 bg-cordel-vert/20 border border-cordel-vert rounded text-center flex flex-col gap-3">
                  <span className="text-sm font-black text-cordel-vert uppercase tracking-wider">🎉 Toutes les pièces sont assemblées !</span>
                  <CordelButton 
                    variant="vert" 
                    useExtremeBorder={true}
                    onClick={() => handleFinalizeProject(project, model)}
                    className="self-center shadow-lg"
                  >
                    Valider la fabrication & Créer l'instrument
                  </CordelButton>
                </div>
              )}
            </CordelCard>
          </div>

          {/* Colonne droite : Feuille de route */}
          <div className="flex flex-col gap-3">
            <CordelCard variant="default" className="p-4 bg-cordel-master-dark/5 border-cordel-master-dark/20 shadow-none">
              <h4 className="text-xs font-extrabold text-cordel-wood uppercase mb-2 flex items-center gap-2">
                <XiloChisel size={14} /> Feuille de route
              </h4>
              <p className="text-[9px] text-stone-600 leading-relaxed mb-4">
                Liste consolidée pour les <strong className="text-cordel-rouge">{missingParts.length} pièces restant à fabriquer</strong>.
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
          <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nom de l'instrument (ex: Alfaia N°12)"
              value={newProjectData.nom}
              onChange={e => setNewProjectData(prev => ({ ...prev, nom: e.target.value }))}
              required
              className="theme-input text-xs py-1.5 flex-1"
            />
            <select
              value={newProjectData.modelId}
              onChange={e => setNewProjectData(prev => ({ ...prev, modelId: e.target.value }))}
              required
              className="theme-input text-xs py-1.5 flex-1 bg-white"
            >
              <option value="">-- Choisir un Modèle du Varal --</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] font-bold px-3 border rounded hover:bg-stone-100">Annuler</button>
              <button type="submit" className="text-[10px] font-bold px-3 bg-cordel-vert text-white rounded">Créer</button>
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
                    <span className="text-[9px] text-cordel-wood uppercase font-bold tracking-wider">Modèle : {model?.nom || 'Inconnu'}</span>
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
