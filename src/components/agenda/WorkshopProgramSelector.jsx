// Composant modulaire : Sélecteur de spécialité et de programme d'atelier pour l'Agenda
// Permet de configurer les pièces, étapes, outils et matériaux requis pour un atelier de lutherie
import React, { useMemo } from 'react';
import CordelButton from '../CordelButton';
import { useInventoryProjects } from '../../hooks/useInventoryProjects';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';

const SPECIALITES_OPTIONS = [
  { id: 'fabrication', label: '🛠️ Lutherie & Fabrication d\'instruments', desc: 'Usinage, montage, cordage et réglages d\'instruments' },
  { id: 'couture', label: '🧵 Vestiaire, Costumes & Couture', desc: 'Confection des tenues de scène, fitas et chapeaux' },
  { id: 'chant', label: '🎤 Chant & Toadas', desc: 'Apprentissage et répétition vocale des toadas' },
  { id: 'rythme', label: '🥁 Rythme & Percussion', desc: 'Technique de frappe, baques et variations rythmiques' },
  { id: 'general', label: '🌀 Atelier Général / Polyvalent', desc: 'Session transversale sans outillage spécifique' }
];

export default function WorkshopProgramSelector({
  specialiteAtelier = 'general',
  setSpecialiteAtelier,
  programmeFabrication = null,
  setProgrammeFabrication,
  groupId,
  disabled = false
}) {
  // Chargement des projets d'assemblage et modèles de l'association
  const { projects = [], loading: loadingProjects } = useInventoryProjects(groupId);
  const { models = [] } = useInstrumentModels(groupId);

  // État local pour le formulaire d'ajout d'une pièce au programme
  const [selectedProjectId, setSelectedProjectId] = React.useState('');
  const [selectedPartId, setSelectedPartId] = React.useState('');
  const [selectedStepIndex, setSelectedStepIndex] = React.useState(0);

  // Programme de fabrication courant avec valeurs de repli
  const currentProgramme = useMemo(() => {
    return programmeFabrication || {
      piecesCibles: [],
      outilsRequis: [],
      materiauxRequis: [],
      consignesSecurite: ''
    };
  }, [programmeFabrication]);

  // Modèle associé au projet sélectionné
  const currentSelectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const currentSelectedModel = useMemo(() => {
    if (currentSelectedProject) {
      return models.find(m => m.id === currentSelectedProject.modelId) || null;
    }
    return null;
  }, [models, currentSelectedProject]);

  // Pièces disponibles pour le projet sélectionné
  const availableParts = useMemo(() => {
    return currentSelectedModel?.parts || [];
  }, [currentSelectedModel]);

  // Pièce actuellement sélectionnée dans la liste déroulante
  const currentSelectedPart = useMemo(() => {
    return availableParts.find(p => p.id === selectedPartId) || null;
  }, [availableParts, selectedPartId]);

  // Étapes de la pièce sélectionnée
  const availableSteps = useMemo(() => {
    return currentSelectedPart?.chapitres || [];
  }, [currentSelectedPart]);

  // Réinitialiser la pièce et l'étape quand on change de projet
  const handleProjectChange = (projId) => {
    setSelectedProjectId(projId);
    const proj = projects.find(p => p.id === projId);
    const model = proj ? models.find(m => m.id === proj.modelId) : null;
    const firstPart = model?.parts?.[0];
    setSelectedPartId(firstPart?.id || '');
    setSelectedStepIndex(0);
  };

  // Réinitialiser l'étape quand on change de pièce
  const handlePartChange = (partId) => {
    setSelectedPartId(partId);
    setSelectedStepIndex(0);
  };

  // Ajouter une pièce et son étape au programme de session
  const handleAddPieceCible = () => {
    if (!currentSelectedProject || !currentSelectedPart) return;

    const stepObj = availableSteps[selectedStepIndex] || null;
    const stepTitle = stepObj?.titre || `Étape ${Number(selectedStepIndex) + 1}`;
    const stepConsigne = stepObj?.texte || '';

    const newTarget = {
      projetId: currentSelectedProject.id,
      nomProjet: currentSelectedProject.nom,
      partId: currentSelectedPart.id,
      nomPiece: currentSelectedPart.nom,
      etapeCibleIndex: Number(selectedStepIndex),
      titreEtape: stepTitle,
      totalEtapes: availableSteps.length || 1,
      consigneEtape: stepConsigne,
      modelNom: currentSelectedModel?.nom || '',
      modelType: currentSelectedModel?.type || '',
      // Extraire les outils et matériaux déclarés dans cette étape
      stepOutils: Array.isArray(stepObj?.outils) ? stepObj.outils : [],
      stepMateriaux: Array.isArray(stepObj?.materiaux) ? stepObj.materiaux : []
    };

    // Agrégation automatique sans doublon des outils et matériaux
    const existingPieces = currentProgramme.piecesCibles || [];
    const updatedPieces = [...existingPieces, newTarget];

    const aggregatedOutils = new Set(currentProgramme.outilsRequis || []);
    const aggregatedMateriaux = new Set(currentProgramme.materiauxRequis || []);

    (newTarget.stepOutils || []).forEach(o => { if (o && o.trim()) aggregatedOutils.add(o.trim()); });
    (newTarget.stepMateriaux || []).forEach(m => { if (m && m.trim()) aggregatedMateriaux.add(m.trim()); });

    setProgrammeFabrication({
      ...currentProgramme,
      piecesCibles: updatedPieces,
      outilsRequis: Array.from(aggregatedOutils),
      materiauxRequis: Array.from(aggregatedMateriaux)
    });
  };

  // Supprimer une pièce du programme
  const handleRemovePieceCible = (indexToRemove) => {
    const updatedPieces = (currentProgramme.piecesCibles || []).filter((_, idx) => idx !== indexToRemove);
    setProgrammeFabrication({
      ...currentProgramme,
      piecesCibles: updatedPieces
    });
  };

  // Gestion des outils personnalisés (séparés par virgule)
  const handleOutilsChange = (text) => {
    const arr = text.split(',').map(s => s.trim()).filter(Boolean);
    setProgrammeFabrication({
      ...currentProgramme,
      outilsRequis: arr
    });
  };

  // Gestion des matériaux personnalisés (séparés par virgule)
  const handleMateriauxChange = (text) => {
    const arr = text.split(',').map(s => s.trim()).filter(Boolean);
    setProgrammeFabrication({
      ...currentProgramme,
      materiauxRequis: arr
    });
  };

  // Gestion des consignes de sécurité / EPI
  const handleSecuriteChange = (text) => {
    setProgrammeFabrication({
      ...currentProgramme,
      consignesSecurite: text
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#fdfaf2] border-2 border-[var(--color-cordel-wood)] rounded-[var(--theme-border-radius)] text-left shadow-xs">
      {/* 1. Sélecteur de Spécialité */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>🎯 Thématique de l'atelier / stage</span>
          <span className="text-red-700">*</span>
        </label>
        <select
          value={specialiteAtelier}
          onChange={(e) => {
            const val = e.target.value;
            setSpecialiteAtelier(val);
            if (val === 'fabrication' && !programmeFabrication) {
              setProgrammeFabrication({
                piecesCibles: [],
                outilsRequis: [],
                materiauxRequis: [],
                consignesSecurite: 'Prévoir vêtements d\'atelier et vos équipements de protection (EPI).'
              });
            }
          }}
          disabled={disabled}
          className="theme-input font-bold bg-white border border-stone-300 py-1.5 text-xs rounded cursor-pointer"
        >
          {SPECIALITES_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-stone-600 italic">
          {SPECIALITES_OPTIONS.find(o => o.id === specialiteAtelier)?.desc}
        </p>
      </div>

      {/* 2. Bloc Dépliable si Thématique Fabrication d'Instruments */}
      {specialiteAtelier === 'fabrication' && (
        <div className="flex flex-col gap-4 mt-2 pt-3 border-t border-dashed border-cordel-wood/40">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🛠️</span> Programme Lutherie & Chantiers de Fabrication
            </h5>
            <span className="text-[9px] bg-[var(--color-cordel-vert)] text-white px-2 py-0.5 rounded font-bold">
              {currentProgramme.piecesCibles?.length || 0} chantier{(currentProgramme.piecesCibles?.length || 0) > 1 ? 's' : ''} ciblé{((currentProgramme.piecesCibles?.length || 0) > 1 ? 's' : '')}
            </span>
          </div>

          {/* Formulaire d'ajout d'une pièce d'un projet */}
          <div className="bg-white/80 p-2.5 rounded border border-stone-200 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-encre-noire">
              Sélectionnez un instrument en cours et l'étape visée pour la séance :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Choix du projet */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-stone-600">Instrument / Projet :</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  disabled={disabled || loadingProjects}
                  className="theme-input text-[10px] p-1 bg-white border rounded"
                >
                  <option value="">-- Choisir un projet ({projects.length}) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.artisanNom ? `(${p.artisanNom})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Choix de la pièce */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-stone-600">Composant / Pièce :</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => handlePartChange(e.target.value)}
                  disabled={disabled || !selectedProjectId || availableParts.length === 0}
                  className="theme-input text-[10px] p-1 bg-white border rounded"
                >
                  <option value="">-- Composant ({availableParts.length}) --</option>
                  {availableParts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Choix de l'étape visée */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-stone-600">Étape visée :</label>
                <select
                  value={selectedStepIndex}
                  onChange={(e) => setSelectedStepIndex(e.target.value)}
                  disabled={disabled || !selectedPartId || availableSteps.length === 0}
                  className="theme-input text-[10px] p-1 bg-white border rounded"
                >
                  {availableSteps.map((step, idx) => (
                    <option key={step.id || idx} value={idx}>
                      #{idx + 1} : {step.titre || `Étape ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bouton d'ajout */}
            <div className="flex justify-end mt-1">
              <CordelButton
                type="button"
                variant="primary"
                onClick={handleAddPieceCible}
                disabled={disabled || !selectedProjectId || !selectedPartId}
                className="text-[10px] py-1 px-3 font-bold cursor-pointer"
              >
                + Ajouter ce chantier à l'ordre du jour
              </CordelButton>
            </div>
          </div>

          {/* Liste des chantiers actuellement ajoutés au programme */}
          {currentProgramme.piecesCibles && currentProgramme.piecesCibles.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
                Chantiers prévus pour cette séance :
              </p>
              <div className="flex flex-col gap-1.5">
                {currentProgramme.piecesCibles.map((item, idx) => (
                  <div
                    key={`${item.projetId}-${item.partId}-${idx}`}
                    className="flex items-center justify-between bg-white p-2 rounded border border-stone-200 shadow-2xs"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-cordel-wood">
                        🥁 {item.nomProjet} — <span className="text-encre-noire font-bold">{item.nomPiece}</span>
                      </span>
                      <span className="text-[10px] text-[var(--color-cordel-vert)] font-bold">
                        Étape {item.etapeCibleIndex + 1}/{item.totalEtapes} : {item.titreEtape}
                      </span>
                      {item.consigneEtape && (
                        <span className="text-[9px] text-stone-500 line-clamp-1 italic">
                          Consigne : {item.consigneEtape}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePieceCible(idx)}
                      disabled={disabled}
                      className="text-[10px] text-[var(--color-cordel-rouge)] hover:underline font-bold px-2 py-1 cursor-pointer"
                      title="Retirer ce chantier du programme"
                    >
                      Retirer ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Boîte à Outils et Matériaux agrégés automatiquement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200">
            {/* Outils requis */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase text-stone-700 flex items-center gap-1">
                <span>🔧 Boîte à outils requise</span>
                <span className="text-[8px] font-normal text-stone-500">(Séparés par virgule)</span>
              </label>
              <input
                type="text"
                value={(currentProgramme.outilsRequis || []).join(', ')}
                onChange={(e) => handleOutilsChange(e.target.value)}
                disabled={disabled}
                placeholder="Ex : Ciseaux, Scie japonaise, Papier de verre 120"
                className="theme-input text-[10px] p-1.5 bg-white border rounded"
              />
            </div>

            {/* Matériaux requis */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase text-stone-700 flex items-center gap-1">
                <span>📦 Matériaux & Fournitures</span>
                <span className="text-[8px] font-normal text-stone-500">(Séparés par virgule)</span>
              </label>
              <input
                type="text"
                value={(currentProgramme.materiauxRequis || []).join(', ')}
                onChange={(e) => handleMateriauxChange(e.target.value)}
                disabled={disabled}
                placeholder="Ex : Fil nylon 1mm, Colle PVA, Cire d'abeille"
                className="theme-input text-[10px] p-1.5 bg-white border rounded"
              />
            </div>
          </div>

          {/* 4. Consignes de Sécurité & EPI */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-stone-700 flex items-center gap-1">
              <span>⚠️ Consignes de sécurité & Équipements recommandés (EPI)</span>
            </label>
            <input
              type="text"
              value={currentProgramme.consignesSecurite || ''}
              onChange={(e) => handleSecuriteChange(e.target.value)}
              disabled={disabled}
              placeholder="Ex : Prévoir vêtements d'atelier, gants de protection et masque anti-poussière."
              className="theme-input text-[10px] p-1.5 bg-white border rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
