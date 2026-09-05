import React, { useState, useMemo, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useInventoryProjects } from '../../hooks/useInventoryProjects';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';
import { useInventoryData } from '../../hooks/useInventoryData';
import AssemblySlotItem from '../inventory/AssemblySlotItem';
import FabricationCard from '../FabricationCard';
import PartWorkflowModal from '../inventory/PartWorkflowModal';

/**
 * Composant de l'Atelier Instruments côté Élève / Membre.
 * Permet à l'artisan de consulter ses instruments en cours d'assemblage,
 * de suivre les étapes avec le Varal, et de soumettre ses étapes terminées au Mestre.
 */
export default function StudentInstrumentsWorkshop({ user, profileData, onNavigateToTab: _onNavigateToTab }) {
  const groupId = profileData?.groupId;
  const { projects, loading: pLoading } = useInventoryProjects(groupId);
  const { models, loading: mLoading } = useInstrumentModels(groupId);
  const { inventoryParts, updatePartWorkflow } = useInventoryData(groupId);

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [selectedSessionSlots, setSelectedSessionSlots] = useState([]);
  const [selectedWorkflowSlot, setSelectedWorkflowSlot] = useState(null);
  const [selectedVaralTutorial, setSelectedVaralTutorial] = useState(null);
  const [workflowToast, setWorkflowToast] = useState(null);

  // Auto-fermeture du toast d'atelier
  useEffect(() => {
    if (!workflowToast) return;
    const timer = setTimeout(() => setWorkflowToast(null), 4000);
    return () => clearTimeout(timer);
  }, [workflowToast]);

  // Filtrer les projets : instruments assignés à l'élève en priorité, ou projets collectifs
  const myProjects = useMemo(() => {
    if (!projects || !user?.uid) return [];
    return projects.filter(p => p.artisanId === user.uid);
  }, [projects, user?.uid]);

  const collectiveProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => !p.artisanId);
  }, [projects]);

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find(p => p.id === activeProjectId);
  }, [projects, activeProjectId]);

  const activeModel = useMemo(() => {
    if (!activeProject) return null;
    return models.find(m => m.id === activeProject.modelId);
  }, [activeProject, models]);

  // Adaptateur pour la pop-up du Varal (FabricationCard)
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
      contenuFabrication: slot.description || `Fiche de fabrication et montage pour la pièce "${slot.nom || slot.slotLabel}".`,
      visuelAnimeUrl: slot.visuelAnimeUrl || '',
      etapesFabrication: etapes,
      notesLexique: slot.notesLexique || []
    };

    setSelectedVaralTutorial(cardPayload);
  };

  const toggleSessionSlot = (slotId) => {
    setSelectedSessionSlots(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  if (pLoading || mLoading) {
    return (
      <div className="text-center py-10 text-stone-500 font-bold text-xs animate-pulse">
        Chargement de votre atelier...
      </div>
    );
  }

  // VUE ÉTABLI DE L'ÉLÈVE POUR UN INSTRUMENT
  if (activeProject && activeModel) {
    const allSlots = (activeModel.parts || []).flatMap(p => {
      const qty = parseInt(p.quantiteRequise, 10) || 1;
      return Array.from({ length: qty }, (_, i) => ({
        ...p,
        slotId: qty > 1 ? `${p.id}_${i}` : p.id,
        slotLabel: qty > 1 ? `${p.nom} (${i + 1}/${qty})` : p.nom,
        originalPartId: p.id
      }));
    });

    const assignedMap = (activeProject.piecesAssignees || []).reduce((acc, curr) => {
      acc[curr.modelPartId] = curr.inventoryPartId;
      return acc;
    }, {});

    const completedSlotsCount = allSlots.filter(slot => {
      const assignedInvId = assignedMap[slot.slotId];
      if (!assignedInvId) return false;
      const invPart = inventoryParts.find(p => p.id === assignedInvId);
      const slotWf = activeProject.slotsWorkflow?.[slot.slotId];
      const statutEtape = slotWf?.statutEtape || invPart?.statutEtape || 'en_cours';
      const totalSteps = slot.chapitres?.length || 0;
      return statutEtape === 'terminee' || totalSteps === 0;
    }).length;

    return (
      <div className="flex flex-col gap-4">
        {/* Bandeau d'en-tête de l'instrument */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-cordel-bg-light border border-cordel-master-dark/20 p-3 rounded">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🪓</span>
              <h3 className="text-sm font-black text-cordel-wood uppercase">
                {activeProject.nom}
              </h3>
            </div>
            <p className="text-[10px] text-stone-600 font-bold mt-0.5">
              Modèle : {activeModel.nom} ({activeModel.type}) • Progression terminée : {completedSlotsCount} / {allSlots.length} pièces
            </p>
          </div>

          <CordelButton
            variant="default"
            onClick={() => setActiveProjectId(null)}
            className="text-[10px] px-3 py-1 font-bold cursor-pointer"
          >
            ← Retour à mes projets
          </CordelButton>
        </div>

        {/* Message d'accompagnement pour l'élève */}
        <div className="bg-amber-50 border-l-4 border-[var(--color-cordel-ocre)] p-3 rounded text-left">
          <p className="text-xs text-stone-800 leading-relaxed">
            <strong>Conseil d'atelier :</strong> Dépliez les étapes de chaque pièce pour suivre les consignes et ouvrir le tutoriel du Varal. Quand votre geste est terminé (ponçage, découpe, vernis), cliquez sur la pièce pour <strong>soumettre votre étape au Mestre</strong>.
          </p>
        </div>

        {/* Liste des pièces requises */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-encre-noire uppercase tracking-wider flex justify-between items-center">
            <span>Composants de votre instrument</span>
            <span className="text-[10px] bg-cordel-wood text-white px-2 py-0.5 rounded-full font-bold">
              {completedSlotsCount} / {allSlots.length} terminés
            </span>
          </h4>

          <div className="flex flex-col gap-2">
            {allSlots.map(slot => {
              const assignedInvId = assignedMap[slot.slotId];
              const invPart = inventoryParts.find(p => p.id === assignedInvId);

              return (
                <AssemblySlotItem
                  key={slot.slotId}
                  slot={slot}
                  model={activeModel}
                  invPart={invPart}
                  slotWorkflow={activeProject?.slotsWorkflow?.[slot.slotId]}
                  isSessionSelected={selectedSessionSlots.includes(slot.slotId)}
                  onToggleSessionSlot={toggleSessionSlot}
                  onSelectWorkflow={setSelectedWorkflowSlot}
                  onAssignPart={() => {}} // L'élève ne modifie pas l'assignation de stock
                  onOpenVaralTutorial={(s) => handleOpenVaralTutorial(s, activeModel)}
                  availableStock={[]} // Pas de sélecteur de stock pour l'élève
                />
              );
            })}
          </div>
        </div>

        {/* Modale de workflow d'atelier (Validation / Soumission) */}
        <PartWorkflowModal
          isOpen={!!selectedWorkflowSlot}
          onClose={() => setSelectedWorkflowSlot(null)}
          slot={selectedWorkflowSlot?.slot}
          invPart={inventoryParts?.find(p => p.id === selectedWorkflowSlot?.invPart?.id) || selectedWorkflowSlot?.invPart}
          project={activeProject}
          model={activeModel}
          profileData={profileData}
          slotWorkflow={activeProject?.slotsWorkflow?.[selectedWorkflowSlot?.slot?.slotId]}
          updatePartWorkflow={updatePartWorkflow}
          isValidator={false} // L'élève soumet son étape, il ne valide pas lui-même
          validatorName={profileData?.prenom || 'Élève'}
          onFeedback={(fb) => setWorkflowToast(fb)}
        />

        {/* Modale de tutoriel Varal avec fond crème opaque */}
        {selectedVaralTutorial && (
          <FabricationCard
            fabrication={selectedVaralTutorial}
            onClose={() => setSelectedVaralTutorial(null)}
          />
        )}

        {/* Notification flottante d'atelier */}
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

  // VUE LISTE DES PROJETS D'INSTRUMENTS DISPONIBLES POUR L'ÉLÈVE
  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Section 1 : Mes instruments personnels en fabrication */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/30 pb-2">
          <div>
            <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-2">
              <span>🥁</span> Mes Instruments en Fabrication
            </h3>
            <p className="text-[10px] text-stone-500 mt-0.5">
              Instruments qui vous sont nominativement attribués pour votre apprentissage ou votre équipement.
            </p>
          </div>
        </div>

        {myProjects.length === 0 ? (
          <CordelCard variant="default" className="p-6 text-center bg-white/40 border-dashed">
            <span className="text-2xl mb-1 block">🛠️</span>
            <p className="text-xs font-semibold text-stone-600">
              Vous n'avez pas encore d'instrument personnel en cours de fabrication.
            </p>
            <p className="text-[10px] text-stone-500 mt-1">
              Rapprochez-vous de votre Mestre pour qu'il vous attribue un projet d'instrument (Alfaia, Agbê, Gongoque...).
            </p>
          </CordelCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProjects.map(proj => {
              const model = models.find(m => m.id === proj.modelId);
              const totalParts = model?.parts?.length || 0;
              const assignedParts = proj.piecesAssignees?.length || 0;
              const progress = totalParts > 0 ? Math.round((assignedParts / totalParts) * 100) : 0;

              return (
                <CordelCard key={proj.id} variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-white/60 hover:scale-[1.01] transition-transform">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-encre-noire">{proj.nom}</h4>
                      <span className="text-[9px] text-cordel-wood uppercase font-bold tracking-wider">
                        Modèle : {model?.nom || 'Inconnu'}
                      </span>
                    </div>
                    <span className="text-[9px] bg-[var(--color-cordel-vert)] text-white px-2 py-0.5 rounded font-bold uppercase">
                      Mon Instrument
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-[10px] font-bold text-stone-700">
                      <span>Assemblage des pièces</span>
                      <span>{assignedParts} / {totalParts}</span>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-cordel-vert)] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/20">
                    <CordelButton
                      variant="vert"
                      onClick={() => setActiveProjectId(proj.id)}
                      className="text-xs py-1 px-3"
                    >
                      Ouvrir mon Établi →
                    </CordelButton>
                  </div>
                </CordelCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2 : Projets collectifs de l'atelier (accessibles en consultation) */}
      {collectiveProjects.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-cordel-master-dark/20">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏛️</span> Projets Collectifs de l'Atelier ({collectiveProjects.length})
              </h4>
              <p className="text-[9px] text-stone-400">
                Instruments construits pour le parc commun de l'association.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {collectiveProjects.map(proj => {
              const model = models.find(m => m.id === proj.modelId);
              return (
                <div
                  key={proj.id}
                  className="bg-white/40 p-3 rounded border border-stone-200 flex justify-between items-center hover:bg-white/70 transition-colors cursor-pointer"
                  onClick={() => setActiveProjectId(proj.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-encre-noire">{proj.nom}</span>
                    <span className="text-[9px] text-stone-500 font-semibold">{model?.nom || 'Instrument'}</span>
                  </div>
                  <span className="text-[10px] text-cordel-wood font-bold hover:underline">
                    Consulter →
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
