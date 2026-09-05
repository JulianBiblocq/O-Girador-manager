// Composant modulaire d'affichage : Programme de Fabrication & Lutherie pour l'Agenda
// Présente les chantiers d'instruments ciblés, les jauges d'étape, la boîte à outils et le déclencheur du tutoriel Varal
import React, { useState, useMemo } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelButton from '../CordelButton';
import FabricationCard from '../FabricationCard';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';
import { useSuppliesData } from '../../hooks/useSuppliesData';
import { useInventoryData } from '../../hooks/useInventoryData';
import { useInventoryProjects } from '../../hooks/useInventoryProjects';
import WorkshopValidationModal from './WorkshopValidationModal';

export default function EventWorkshopProgram({ event, isMestre, isAuthorized, profileData }) {
  const [selectedVaralTutorial, setSelectedVaralTutorial] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Chargement des modèles pour enrichir les fiches de fabrication Varal
  const { models = [] } = useInstrumentModels(event?.groupId);
  const { projects = [] } = useInventoryProjects(event?.groupId);
  const { updatePartWorkflow, inventoryParts = [] } = useInventoryData(event?.groupId);
  
  // Chargement de l'outillage pour la mallette intelligente
  const { tools = [], supplies = [] } = useSuppliesData(event?.groupId, 'lutherie');
  const [checkedTools, setCheckedTools] = useState(new Set());

  const toggleToolChecked = (toolNom) => {
    setCheckedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolNom)) next.delete(toolNom);
      else next.add(toolNom);
      return next;
    });
  };

  const programme = event?.programmeFabrication;
  const piecesCibles = programme?.piecesCibles || [];
  const outilsRequis = programme?.outilsNecessaires || programme?.outilsRequis || [];
  const materiauxRequis = programme?.materiauxNecessaires || programme?.materiauxRequis || [];
  const consignesSecurite = programme?.consignesEpi || programme?.consignesSecurite || '';

  // Séparation intelligente des outils
  const malletteItems = useMemo(() => {
    const resident = [];
    const mobile = [];
    const inconnus = [];
    
    outilsRequis.forEach(outilNom => {
      const foundTool = tools.find(t => t.nom?.toLowerCase().trim() === outilNom.toLowerCase().trim());
      if (foundTool) {
        if (foundTool.isResident) {
          resident.push({ nom: outilNom, emplacement: foundTool.emplacement });
        } else {
          mobile.push({ nom: outilNom, emplacement: foundTool.emplacement });
        }
      } else {
        inconnus.push({ nom: outilNom });
      }
    });
    
    return { resident, mobile, inconnus };
  }, [outilsRequis, tools]);

  /**
   * Ouvre la modale de fabrication Varal en superposant la fiche complète
   * de l'instrument et de l'étape ciblée.
   */
  const handleOpenTutorial = (piece) => {
    // Tenter de retrouver le modèle d'instrument original pour extraire les visuels et descriptions riches
    const foundModel = models.find(m => m.nom === piece.modelNom || m.type === piece.modelType || m.parts?.some(p => p.id === piece.partId));
    const foundPart = foundModel?.parts?.find(p => p.id === piece.partId || p.nom.toLowerCase() === piece.nomPiece.toLowerCase());

    const etapesRaw = foundPart?.chapitres || [];
    let etapesFabrication = [];

    if (etapesRaw.length > 0) {
      etapesFabrication = etapesRaw.map((chap, idx) => ({
        id: chap.id || idx,
        sousTitre: chap.titre || `Étape ${idx + 1}`,
        description: chap.texte || '',
        imageUrl: chap.photoUrl || '',
        materiaux: Array.isArray(chap.materiaux) ? chap.materiaux : [],
        outils: Array.isArray(chap.outils) ? chap.outils : []
      }));
    } else {
      // Repli si le modèle n'est pas encore synchronisé
      etapesFabrication = [
        {
          id: piece.etapeCibleIndex || 0,
          sousTitre: piece.titreEtape || 'Étape d\'usinage',
          description: piece.consigneEtape || 'Suivez les consignes de travail transmises par le Mestre pour cette étape.',
          imageUrl: '',
          materiaux: piece.stepMateriaux || [],
          outils: piece.stepOutils || []
        }
      ];
    }

    const payload = {
      id: piece.partId || piece.projetId || 'workshop_part',
      titre: `${piece.modelNom || 'Instrument'} — ${piece.nomPiece}`,
      instrumentConcerne: piece.modelType || piece.modelNom || 'Instrument d\'atelier',
      materielRequis: materiauxRequis.length > 0 ? materiauxRequis : (foundPart?.materiels || []),
      outilsNecessaires: outilsRequis.length > 0 ? outilsRequis : (foundPart?.outils || []),
      contenuFabrication: foundPart?.description || `Fiche technique pour la confection et l'assemblage de : ${piece.nomPiece}. Travail ciblé sur l'étape : ${piece.titreEtape}.`,
      visuelAnimeUrl: foundPart?.visuelAnimeUrl || '',
      etapesFabrication,
      notesLexique: foundPart?.notesLexique || []
    };

    setSelectedVaralTutorial(payload);
  };

  // Ne rien afficher si ce n'est pas un atelier de fabrication ou s'il n'y a aucun contenu
  const isFabrication = (event?.type === 'atelier' || event?.type === 'stage') && event?.specialiteAtelier === 'fabrication';
  if (!isFabrication) return null;

  const isAdminOrMestre = Boolean(
    isMestre || 
    isAuthorized || 
    profileData?.role === 'mestre' || 
    profileData?.role === 'admin' || 
    profileData?.isMestre || 
    profileData?.isSystemAdmin
  );

  const handleValidateSteps = async (validatedPieces) => {
    try {
      // Pour chaque pièce validée, synchronisation simultanée dans inventory_projects et inventory_parts
      for (const piece of validatedPieces) {
        const total = piece.totalEtapes || 1;
        const nextStepIndex = Math.min(total, (piece.etapeCibleIndex !== undefined ? piece.etapeCibleIndex + 1 : 1));
        const isComplete = nextStepIndex >= total;
        const slotKey = piece.slotId || piece.partId;

        // 1. Mise à jour conjointe du projet d'assemblage (slotsWorkflow dans inventory_projects)
        if (piece.projetId && slotKey) {
          const projectRef = doc(db, 'inventory_projects', piece.projetId);
          await updateDoc(projectRef, {
            [`slotsWorkflow.${slotKey}.currentStepIndex`]: nextStepIndex,
            [`slotsWorkflow.${slotKey}.statutEtape`]: isComplete ? 'terminee' : 'en_cours',
            [`slotsWorkflow.${slotKey}.status`]: isComplete ? 'terminee' : 'en_cours',
            updatedAt: serverTimestamp()
          });
        }

        // 2. Mise à jour de la pièce physique liée dans inventory_parts (si assignée)
        let actualInventoryPartId = piece.inventoryPartId;
        if (!actualInventoryPartId && piece.projetId) {
          const project = projects.find(p => p.id === piece.projetId);
          const assignation = project?.piecesAssignees?.find(a => a.modelPartId === slotKey || a.modelPartId === piece.partId);
          actualInventoryPartId = assignation?.inventoryPartId;
        }

        if (actualInventoryPartId) {
          const actualPart = inventoryParts.find(p => p.id === actualInventoryPartId);
          const updates = {
            currentStepIndex: nextStepIndex,
            statutEtape: isComplete ? 'terminee' : 'en_cours'
          };
          const today = new Date().toLocaleDateString('fr-FR');
          const oldNotes = actualPart?.notesAtelier || '';
          const newNoteEntry = `[${today}] Étape ${piece.etapeCibleIndex + 1} validée lors de la séance.`;
          updates.notesAtelier = oldNotes ? `${oldNotes}\n${newNoteEntry}` : newNoteEntry;

          await updatePartWorkflow(actualInventoryPartId, updates);
        }
      }
      
      setShowValidationModal(false);
      alert("Émargement de séance enregistré avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'émargement :", err);
      alert("Une erreur est survenue lors de la validation des étapes.");
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. En-tête Cordel */}
      <div className="flex items-center justify-between border-b border-dashed border-cordel-wood/30 pb-2 flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🛠️</span> Chantiers & Ordre du Jour de Lutherie
          </h4>
          <p className="text-[10px] text-stone-600 mt-0.5">
            Pièces d'instruments travaillées et objectifs d'usinage prévus pour cette session.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[var(--color-cordel-vert)] text-white font-bold px-2 py-0.5 rounded shadow-2xs">
            {piecesCibles.length} chantier{piecesCibles.length > 1 ? 's' : ''}
          </span>
          {isAdminOrMestre && (
            <button
              type="button"
              disabled={piecesCibles.length === 0}
              onClick={() => setShowValidationModal(true)}
              className={`text-[9px] font-black uppercase px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1 cursor-pointer transition-all ${
                piecesCibles.length > 0
                  ? 'bg-cordel-vert text-white hover:bg-emerald-700'
                  : 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
              }`}
              title={piecesCibles.length === 0 ? "Aucun chantier ciblé pour cet atelier" : "Émarger et valider les étapes achevées lors de la séance"}
            >
              <span>✍️</span> Valider les étapes de la séance
            </button>
          )}
        </div>
      </div>

      {/* 2. Liste des Cartes de Chantiers */}
      {piecesCibles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {piecesCibles.map((piece, idx) => {
            const stepNum = (piece.etapeCibleIndex || 0) + 1;
            const total = piece.totalEtapes || 1;
            const percent = Math.min(100, Math.round((stepNum / total) * 100));

            return (
              <div
                key={`${piece.projetId}-${piece.partId}-${idx}`}
                className="bg-[#fdfaf2] p-3 rounded border-2 border-[var(--color-cordel-wood)] shadow-[2px_2px_0px_0px_var(--color-cordel-wood)] flex flex-col justify-between gap-2.5 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  {/* Titre du projet / Instrument */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-cordel-wood uppercase block">
                          🥁 {piece.nomProjet}
                        </span>
                        {(() => {
                          const proj = projects.find(p => p.id === piece.projetId);
                          return proj?.artisanNom ? (
                            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                              👤 {proj.artisanNom}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <span className="text-[11px] font-bold text-encre-noire">
                        Composant : {piece.nomPiece}
                      </span>
                    </div>
                    <span className="text-[9px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded border border-stone-300 shrink-0">
                      Objectif séance
                    </span>
                  </div>

                  {/* Badge d'étape ciblée */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[9.5px] bg-[var(--color-cordel-ocre)] text-white font-black px-2 py-0.5 rounded">
                      Étape {stepNum}/{total}
                    </span>
                    <span className="text-[10.5px] font-bold text-stone-800 line-clamp-1">
                      {piece.titreEtape}
                    </span>
                  </div>

                  {/* Jauge visuelle proportionnelle */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1.5 border border-stone-300">
                    <div
                      className="bg-[var(--color-cordel-vert)] h-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Consigne d'atelier */}
                  {piece.consigneEtape && (
                    <p className="text-[9.5px] text-stone-600 mt-2 leading-relaxed bg-white/70 p-1.5 rounded border border-stone-200 line-clamp-2 italic">
                      « {piece.consigneEtape} »
                    </p>
                  )}
                </div>

                {/* Bouton Varal interactif */}
                <div className="pt-2 border-t border-dashed border-cordel-wood/20 flex justify-end">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => handleOpenTutorial(piece)}
                    className="text-[10px] py-1 px-2.5 font-bold cursor-pointer flex items-center gap-1 bg-white hover:bg-amber-50"
                  >
                    <span>📖</span> Voir le tuto de l'étape
                  </CordelButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-stone-100 rounded border border-stone-200 text-stone-600 text-xs text-center italic">
          Aucune pièce spécifique n'a encore été assignée pour cet atelier de lutherie.
        </div>
      )}

      {/* 3. Boîte à Outils & Matériaux de la Session */}
      {(outilsRequis.length > 0 || materiauxRequis.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed border-cordel-wood/30">
          {/* Outils avec Filtrage Intelligent */}
          {outilsRequis.length > 0 && (
            <div className="flex flex-col gap-2">
              {/* Outils Résidents */}
              <div className="bg-green-50 border border-green-200 rounded p-2.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-xl">✅</div>
                <h5 className="text-[10px] font-black uppercase text-green-800 mb-1.5 flex items-center gap-1">
                  Déjà sur place au local
                </h5>
                {malletteItems.resident.length > 0 ? (
                  <ul className="space-y-1 text-[11px] text-green-800 font-medium">
                    {malletteItems.resident.map((toolObj, i) => (
                      <li key={i} className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1">
                          <span className="text-green-600">✓</span> {toolObj.nom}
                        </span>
                        {toolObj.emplacement && (
                          <span className="text-[9px] bg-green-100/80 text-green-800 px-1.5 py-0.2 rounded border border-green-300 font-normal">
                            📍 {toolObj.emplacement}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[9.5px] text-green-600/70 italic">Aucun outil résident identifié.</p>
                )}
              </div>

              {/* Outils Mobiles avec Check-list Interactive pour le convoi */}
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                    <span>🚗</span> À emporter dans la mallette (Convoi)
                  </h5>
                  {(malletteItems.mobile.length > 0 || malletteItems.inconnus.length > 0) && (
                    <span className="text-[9px] font-bold text-amber-900 bg-amber-200/70 px-1.5 py-0.2 rounded">
                      {checkedTools.size} / {malletteItems.mobile.length + malletteItems.inconnus.length} vérifié{checkedTools.size > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {(malletteItems.mobile.length > 0 || malletteItems.inconnus.length > 0) ? (
                  <div className="flex flex-col gap-1">
                    {malletteItems.mobile.map((toolObj, i) => {
                      const isChecked = checkedTools.has(toolObj.nom);
                      return (
                        <div
                          key={`mob-${i}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleToolChecked(toolObj.nom)}
                          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleToolChecked(toolObj.nom); } }}
                          className={`flex items-center justify-between gap-1.5 p-1.5 rounded border text-[11px] transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 text-stone-500 line-through opacity-75'
                              : 'bg-white border-amber-200 text-stone-800 hover:bg-amber-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-3.5 h-3.5 text-emerald-700 rounded focus:ring-emerald-700 pointer-events-none"
                            />
                            <span className="font-semibold truncate">
                              {isChecked ? '✓' : '🧰'} {toolObj.nom}
                            </span>
                          </div>
                          {toolObj.emplacement && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border shrink-0 ${
                              isChecked
                                ? 'bg-stone-100 text-stone-400 border-stone-200'
                                : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            }`}>
                              📍 {toolObj.emplacement}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {malletteItems.inconnus.map((toolObj, i) => {
                      const isChecked = checkedTools.has(toolObj.nom);
                      return (
                        <div
                          key={`inc-${i}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleToolChecked(toolObj.nom)}
                          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleToolChecked(toolObj.nom); } }}
                          className={`flex items-center justify-between gap-1.5 p-1.5 rounded border text-[11px] transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 text-stone-500 line-through opacity-75'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-3.5 h-3.5 text-emerald-700 rounded focus:ring-emerald-700 pointer-events-none"
                            />
                            <span className="truncate">
                              {isChecked ? '✓' : '•'} {toolObj.nom}
                            </span>
                          </div>
                          <span className="text-[8.5px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200 shrink-0">
                            non répertorié
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[9.5px] text-amber-600/70 italic">Aucun outil mobile requis.</p>
                )}
              </div>
            </div>
          )}

          {/* Fournitures & Matériaux avec Statut de Stock Temps Réel */}
          {materiauxRequis.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-white/70 p-2.5 rounded border border-stone-200">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
                <span>📦</span> Fournitures & Matériaux de Session
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {materiauxRequis.map((mat, idx) => {
                  const foundSupply = supplies.find(s => s.nom?.toLowerCase().trim() === mat.toLowerCase().trim());
                  const qty = Number(foundSupply?.quantiteStock || 0);
                  const seuil = Number(foundSupply?.seuilCritique || 0);
                  const isOutOfStock = foundSupply && qty <= 0;
                  const isLow = foundSupply && !isOutOfStock && qty <= seuil;

                  return (
                    <div
                      key={idx}
                      className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1.5 shadow-2xs font-bold ${
                        isOutOfStock
                          ? 'bg-red-50 text-red-800 border-red-300'
                          : isLow
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : foundSupply
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-50 text-stone-700 border-stone-300'
                      }`}
                    >
                      <span>{isOutOfStock ? '⚠️' : isLow ? '⚡' : foundSupply ? '✓' : '📦'}</span>
                      <span>{mat}</span>
                      {foundSupply && (
                        <span className="text-[9px] opacity-80 font-normal">
                          ({isOutOfStock ? 'Rupture' : `${qty} ${foundSupply.unite || ''}`})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Consignes de Sécurité & EPI */}
      {consignesSecurite && (
        <div className="p-2.5 bg-amber-50 border-l-4 border-[var(--color-cordel-ocre)] rounded text-stone-800 flex items-start gap-2">
          <span className="text-base shrink-0">⚠️</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-ocre)]">
              Consignes d'Atelier & Sécurité (EPI)
            </span>
            <p className="text-xs leading-relaxed mt-0.5 font-medium">
              {consignesSecurite}
            </p>
          </div>
        </div>
      )}

      {/* 5. Modale Varal en Superposition */}
      {selectedVaralTutorial && (
        <FabricationCard
          card={selectedVaralTutorial}
          onClose={() => setSelectedVaralTutorial(null)}
        />
      )}

      {/* 6. Modale d'émargement de séance */}
      {showValidationModal && (
        <WorkshopValidationModal
          piecesCibles={piecesCibles}
          onClose={() => setShowValidationModal(false)}
          onValidate={handleValidateSteps}
        />
      )}
    </div>
  );
}
