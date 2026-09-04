import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose, XiloChisel } from '../XiloIcons';
import { useInventoryProjects } from '../../hooks/useInventoryProjects';
import PartAssignmentBadge from './PartAssignmentBadge';

const ETAT_OPTIONS = ['Neuf', 'Bon', 'Usé', 'À réparer', 'Au rebut'];
const STATUS_OPTIONS = ['En stock', 'Assemblé'];

export default function InventoryPartsView({
  groupId,
  instruments = [],
  inventoryParts,
  instrumentModels = [],
  isPartFormOpen,
  setIsPartFormOpen,
  editingPartId,
  partFormData,
  handlePartInputChange,
  handleOpenPartAdd,
  handleOpenPartEdit,
  handleSavePart,
  handleDeletePart,
  handleSplitPart,
  saving,
  t: _t
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const { projects = [] } = useInventoryProjects(groupId);

  const assignmentsMap = useMemo(() => {
    const map = {};
    inventoryParts.forEach(part => {
      const inst = instruments.find(i => (i.nomenclature || []).includes(part.id));
      if (inst) {
        map[part.id] = { type: 'instrument', instrumentName: inst.nom, instId: inst.id };
        return;
      }
      const proj = projects.find(p => (p.piecesAssignees || []).some(a => a.inventoryPartId === part.id));
      if (proj) {
        map[part.id] = { type: 'projet', projectName: proj.nom, projId: proj.id };
        return;
      }
      map[part.id] = { type: 'libre' };
    });
    return map;
  }, [inventoryParts, instruments, projects]);

  const filteredParts = inventoryParts.filter(part => {
    const assign = assignmentsMap[part.id] || { type: 'libre' };
    if (assignmentFilter !== 'all' && assign.type !== assignmentFilter) return false;

    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (part.nom && part.nom.toLowerCase().includes(lowerQuery)) ||
      (part.typePiece && part.typePiece.toLowerCase().includes(lowerQuery))
    );
  });

  const selectedModel = useMemo(() => {
    return instrumentModels.find(m => m.id === partFormData.modelId);
  }, [instrumentModels, partFormData.modelId]);

  const modelParts = useMemo(() => {
    return Array.isArray(selectedModel?.parts) ? selectedModel.parts : [];
  }, [selectedModel]);

  const hasModelParts = modelParts.length > 0;

  // Détermine si le type actuellement sélectionné existe dans la nomenclature du modèle
  const isTypeInModel = hasModelParts && modelParts.some(
    p => p.id === partFormData.partId || (partFormData.typePiece && p.nom.toLowerCase() === partFormData.typePiece.toLowerCase())
  );

  // Résolution de la pièce sélectionnée dans la nomenclature du modèle et de ses étapes
  const currentModelPart = useMemo(() => {
    if (!hasModelParts) return null;
    return modelParts.find(
      p => p.id === partFormData.partId || (partFormData.typePiece && p.nom.toLowerCase() === partFormData.typePiece.toLowerCase())
    ) || null;
  }, [hasModelParts, modelParts, partFormData.partId, partFormData.typePiece]);

  const currentPartSteps = useMemo(() => {
    return Array.isArray(currentModelPart?.chapitres) ? currentModelPart.chapitres : [];
  }, [currentModelPart]);

  /**
   * Gestionnaire de changement d'étape d'usinage avec synchronisation du statut (en_cours / terminee).
   */
  const handleStepSelectionChange = (e) => {
    const stepIndex = parseInt(e.target.value, 10) || 0;
    handlePartInputChange({ target: { name: 'currentStepIndex', value: stepIndex } });
    if (currentPartSteps.length > 0) {
      if (stepIndex >= currentPartSteps.length) {
        handlePartInputChange({ target: { name: 'statutEtape', value: 'terminee' } });
      } else {
        handlePartInputChange({ target: { name: 'statutEtape', value: 'en_cours' } });
      }
    }
  };

  /**
   * Gestionnaire lors du changement de modèle d'instrument.
   * Si le modèle possède des pièces définies, alimente automatiquement la première pièce.
   */
  const handleModelChange = (e) => {
    const newModelId = e.target.value;
    handlePartInputChange(e);
    setIsCustomType(false);

    const newModel = instrumentModels.find(m => m.id === newModelId);
    const newParts = Array.isArray(newModel?.parts) ? newModel.parts : [];

    if (newParts.length > 0) {
      const firstPart = newParts[0];
      handlePartInputChange({ target: { name: 'partId', value: firstPart.id } });
      handlePartInputChange({ target: { name: 'typePiece', value: firstPart.nom } });
      if (!partFormData.nom || partFormData.nom.includes("Pièce") || instrumentModels.some(m => partFormData.nom.includes(m.nom))) {
        handlePartInputChange({ target: { name: 'nom', value: `${firstPart.nom} - ${newModel.nom}` } });
      }
    } else {
      handlePartInputChange({ target: { name: 'partId', value: '' } });
    }
  };

  /**
   * Gestionnaire lors de la sélection d'une pièce dans la liste du modèle ou bascule en saisie libre.
   */
  const handlePartSelectionChange = (e) => {
    const val = e.target.value;
    if (val === '__autre__') {
      setIsCustomType(true);
      handlePartInputChange({ target: { name: 'partId', value: '' } });
      handlePartInputChange({ target: { name: 'typePiece', value: '' } });
    } else {
      setIsCustomType(false);
      handlePartInputChange({ target: { name: 'partId', value: val } });
      const partObj = modelParts.find(p => p.id === val);
      if (partObj) {
        handlePartInputChange({ target: { name: 'typePiece', value: partObj.nom } });
        if (!partFormData.nom || partFormData.nom.includes("Pièce") || (selectedModel && partFormData.nom.includes(selectedModel.nom))) {
          handlePartInputChange({ target: { name: 'nom', value: `${partObj.nom} - ${selectedModel.nom}` } });
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {isPartFormOpen ? (
        <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 relative">
          <button
            type="button"
            onClick={() => setIsPartFormOpen(false)}
            disabled={saving}
            className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            <XiloClose size={10} />
          </button>

          <h3 className="panel-title text-sm font-bold text-cordel-wood mb-4">
            {editingPartId ? "Modifier une pièce" : "Ajouter une pièce détachée"}
          </h3>

          {editingPartId && (
            <div className="mb-4">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark block mb-1">
                Affectation actuelle
              </label>
              <div className="bg-stone-50 border border-stone-200 p-2 rounded flex items-center justify-between">
                <PartAssignmentBadge assignment={assignmentsMap[editingPartId]} />
                <span className="text-[9px] text-stone-500 italic">Information en lecture seule</span>
              </div>
            </div>
          )}

          {editingPartId && parseInt(partFormData.quantite, 10) > 1 && (
            <div className="mb-4 bg-amber-50 border border-amber-300 p-2.5 rounded flex items-center justify-between gap-3 text-left">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-amber-900 uppercase">
                  ⚡ Lot de {partFormData.quantite} pièces groupées
                </span>
                <span className="text-[9px] text-stone-600">
                  Cette référence compte {partFormData.quantite} unités groupées. Vous pouvez la scinder pour créer {partFormData.quantite} pièces distinctes et les affecter chacune à un projet différent.
                </span>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const fullPart = inventoryParts.find(p => p.id === editingPartId);
                  if (fullPart && handleSplitPart) {
                    await handleSplitPart(fullPart);
                    setIsPartFormOpen(false);
                  }
                }}
                className="text-[9px] font-black uppercase bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded shadow-xs cursor-pointer shrink-0 transition-all active:scale-95"
              >
                ⚡ Scinder en {partFormData.quantite} pièces
              </button>
            </div>
          )}

          <form onSubmit={handleSavePart} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Nom / Référence de la pièce
              </label>
              <input
                type="text"
                name="nom"
                value={partFormData.nom}
                onChange={handlePartInputChange}
                required
                placeholder="Ex: Calebasse Agbê ou Fût Alfaia"
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Modèle d'instrument (Ref)
                </label>
                <select
                  name="modelId"
                  value={partFormData.modelId || ''}
                  onChange={handleModelChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light cursor-pointer"
                >
                  <option value="">-- Indépendant / Aucun modèle --</option>
                  {instrumentModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom} {m.type ? `(${m.type})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur dynamique des pièces selon le modèle ou repli sur champ texte libre */}
              <div className="flex flex-col gap-1">
                {hasModelParts && !isCustomType ? (
                  <>
                    <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Pièce du modèle ({selectedModel?.nom})
                    </label>
                    <select
                      name="partId"
                      value={partFormData.partId || (isTypeInModel ? modelParts.find(p => p.nom === partFormData.typePiece)?.id : '') || ''}
                      onChange={handlePartSelectionChange}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light cursor-pointer"
                    >
                      <option value="">-- Sélectionnez une pièce du modèle --</option>
                      {modelParts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom} {p.chapitres?.length > 0 ? `(${p.chapitres.length} étapes)` : ''}
                        </option>
                      ))}
                      <option value="__autre__">+ Autre / Saisie personnalisée...</option>
                    </select>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                        Catégorie / Type de pièce {isCustomType && hasModelParts ? '(Personnalisée)' : ''}
                      </label>
                      {hasModelParts && isCustomType && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomType(false);
                            const firstPart = modelParts[0];
                            if (firstPart) {
                              handlePartInputChange({ target: { name: 'partId', value: firstPart.id } });
                              handlePartInputChange({ target: { name: 'typePiece', value: firstPart.nom } });
                            }
                          }}
                          className="text-[8px] text-[var(--color-cordel-wood)] hover:underline font-bold cursor-pointer"
                        >
                          ↺ Choisir dans le modèle
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      name="typePiece"
                      value={partFormData.typePiece || ''}
                      onChange={handlePartInputChange}
                      disabled={saving}
                      placeholder={selectedModel ? "Ex: Pièce spéciale, renfort..." : "Ex: Fût, Calebasse, Filet de perles, Peau..."}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  État
                </label>
                <select
                  name="etat"
                  value={partFormData.etat}
                  onChange={handlePartInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  {ETAT_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Quantité {editingPartId ? "unitaire" : "à créer (pièces indépendantes)"}
                  </label>
                  {!editingPartId && (parseInt(partFormData.quantite, 10) || 1) > 1 && (
                    <span className="text-[8px] font-black text-[var(--color-cordel-vert)]">
                      {partFormData.quantite} pièces distinctes (#1 à #{partFormData.quantite})
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="quantite"
                  min="1"
                  max="50"
                  value={partFormData.quantite || 1}
                  onChange={handlePartInputChange}
                  disabled={saving || Boolean(editingPartId)}
                  className={`theme-input text-xs font-bold py-1.5 bg-cordel-bg-light ${editingPartId ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {!editingPartId && (
                  <span className="text-[8px] text-stone-500 italic">
                    Chaque pièce sera créée de façon autonome et numérotée pour être affectée individuellement à un projet.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sélecteur dynamique d'étapes d'usinage */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Étape de fabrication {currentPartSteps.length > 0 ? `(${currentPartSteps.length} étapes définies)` : ''}
                  </label>
                  {currentPartSteps.length > 0 && (
                    <span className="text-[8px] font-bold text-cordel-wood">
                      {partFormData.currentStepIndex >= currentPartSteps.length 
                        ? '✅ Terminée' 
                        : `Étape ${(parseInt(partFormData.currentStepIndex, 10) || 0) + 1} / ${currentPartSteps.length}`}
                    </span>
                  )}
                </div>

                {currentPartSteps.length > 0 ? (
                  <>
                    <select
                      name="currentStepIndex"
                      value={partFormData.currentStepIndex ?? 0}
                      onChange={handleStepSelectionChange}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light cursor-pointer"
                    >
                      {currentPartSteps.map((step, idx) => (
                        <option key={step.id || idx} value={idx}>
                          Étape {idx + 1} : {step.titre || `Étape ${idx + 1}`}
                        </option>
                      ))}
                      <option value={currentPartSteps.length}>
                        ✅ Prête / Terminée (Toutes étapes validées)
                      </option>
                    </select>

                    {/* Aperçu dynamique du titre et de la consigne de l'étape */}
                    {currentPartSteps[partFormData.currentStepIndex] && (
                      <div className="bg-amber-50/80 border border-amber-200 p-2 rounded text-left mt-0.5 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-cordel-wood flex items-center gap-1">
                          <span>📌</span> Étape {(parseInt(partFormData.currentStepIndex, 10) || 0) + 1} : {currentPartSteps[partFormData.currentStepIndex].titre || 'Consigne'}
                        </span>
                        {currentPartSteps[partFormData.currentStepIndex].texte && (
                          <p className="text-[9px] text-stone-700 leading-snug line-clamp-2 whitespace-pre-line">
                            {currentPartSteps[partFormData.currentStepIndex].texte}
                          </p>
                        )}
                        {(currentPartSteps[partFormData.currentStepIndex].outils?.length > 0 || currentPartSteps[partFormData.currentStepIndex].materiaux?.length > 0) && (
                          <div className="flex items-center gap-2 flex-wrap text-[8px] text-stone-600 font-bold pt-1 border-t border-amber-200/60">
                            {currentPartSteps[partFormData.currentStepIndex].outils?.length > 0 && (
                              <span>🛠️ {currentPartSteps[partFormData.currentStepIndex].outils.join(', ')}</span>
                            )}
                            {currentPartSteps[partFormData.currentStepIndex].materiaux?.length > 0 && (
                              <span>📦 {currentPartSteps[partFormData.currentStepIndex].materiaux.join(', ')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="number"
                    name="currentStepIndex"
                    min="0"
                    value={partFormData.currentStepIndex || 0}
                    onChange={handlePartInputChange}
                    disabled={saving}
                    placeholder="Index d'usinage (ex: 0)"
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Statut
                </label>
                <select
                  name="status"
                  value={partFormData.status}
                  onChange={handlePartInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Notes Atelier
              </label>
              <textarea
                name="notesAtelier"
                value={partFormData.notesAtelier || ''}
                onChange={handlePartInputChange}
                disabled={saving}
                placeholder="Particularités, cotes, essence de bois..."
                className="theme-input text-xs py-1.5 bg-cordel-bg-light min-h-[50px]"
              />
            </div>

            <div className="flex justify-between items-center mt-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
              {editingPartId ? (
                <button
                  type="button"
                  onClick={() => handleDeletePart(editingPartId)}
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
                  onClick={() => setIsPartFormOpen(false)}
                  className="text-xs px-3 py-1.5"
                >
                  Annuler
                </CordelButton>
                <CordelButton
                  type="submit"
                  variant="ocre"
                  useExtremeBorder={true}
                  disabled={saving || !partFormData.nom.trim()}
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
          <div className="flex justify-between items-center bg-cordel-bg border-2 border-encre-noire p-2 rounded-[5px_4px_6px_3px] shadow-[2px_2px_0px_0px_#181716] flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher une pièce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-input text-xs py-1.5 px-3 w-64 border-none shadow-none bg-transparent"
              />
              <div className="h-6 w-px bg-cordel-master-dark/20 hidden sm:block"></div>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="theme-input text-xs py-1.5 px-2 bg-white border border-stone-300 rounded text-stone-700 font-bold cursor-pointer"
              >
                <option value="all">Toutes les pièces</option>
                <option value="libre">🟢 Libres uniquement</option>
                <option value="projet">🟠 En projet d'assemblage</option>
                <option value="instrument">🔵 Montées sur instrument</option>
              </select>
            </div>
            <CordelButton
              variant="ocre"
              onClick={handleOpenPartAdd}
              className="text-xs px-3 py-1.5 font-bold shrink-0"
            >
              + Ajouter Pièce
            </CordelButton>
          </div>

          <div className="w-full max-h-[calc(100vh-280px)] overflow-x-auto overflow-y-auto border-2 border-encre-noire rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-cordel-card-bg relative">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="bg-cordel-bg-light border-b-2 border-encre-noire text-[10px] uppercase tracking-wider text-cordel-wood font-black select-none sticky top-0 z-20">
                <tr>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 left-0 bg-cordel-bg-light z-30">Nom / Réf</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">Type</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">Affectation</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">État</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">Statut</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">Avancement</th>
                  <th className="p-3 text-right sticky top-0 z-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-xs opacity-60 font-bold italic">
                      Aucune pièce détachée trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map(part => {
                    // Résolution du modèle et calcul de l'étape courante / total d'étapes
                    const model = instrumentModels.find(m => m.id === part.modelId);
                    const modelPart = model?.parts?.find(p => p.id === part.partId || (part.typePiece && p.nom.toLowerCase() === part.typePiece.toLowerCase()));
                    const totalEtapes = modelPart?.chapitres?.length || 0;
                    const currentStep = part.currentStepIndex || 0;
                    const statutEtape = part.statutEtape || 'en_cours';
                    const isTerminee = statutEtape === 'terminee' || (totalEtapes > 0 && currentStep >= totalEtapes);
                    const isWaiting = statutEtape === 'en_attente_controle';

                    return (
                      <tr key={part.id} className="border-b border-dashed border-encre-noire/20 hover:bg-black/5 transition-colors">
                        <td className="p-2 border-r border-encre-noire/10 font-bold sticky left-0 bg-cordel-card-bg z-10 shadow-[1px_0_0_0_rgba(24,23,22,0.1)]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{part.nom}</span>
                            {parseInt(part.quantite, 10) > 1 && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                Lot de {part.quantite}
                              </span>
                            )}
                          </div>
                          {part.modelId && (
                            <div className="text-[9px] text-cordel-master-dark opacity-80 mt-0.5">
                              Modèle : {model?.nom || 'Inconnu'}
                            </div>
                          )}
                        </td>
                        <td className="p-2 border-r border-encre-noire/10 font-semibold">
                          {part.typePiece || '—'}
                        </td>
                        <td className="p-2 border-r border-encre-noire/10">
                          <PartAssignmentBadge assignment={assignmentsMap[part.id]} />
                        </td>
                        <td className="p-2 border-r border-encre-noire/10">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            part.etat === 'Neuf' ? 'bg-[var(--color-cordel-vert)]/10 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/30' :
                            part.etat === 'Bon' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            part.etat === 'Usé' ? 'bg-[var(--color-cordel-ocre)]/10 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/30' :
                            'bg-[var(--color-cordel-rouge)]/10 text-[var(--color-cordel-rouge)] border-[var(--color-cordel-rouge)]/30'
                          }`}>
                            {part.etat}
                          </span>
                        </td>
                        <td className="p-2 border-r border-encre-noire/10">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            part.status === 'En stock' ? 'bg-green-100 text-green-800 border-green-300' :
                            'bg-gray-100 text-gray-600 border-gray-300'
                          }`}>
                            {part.status}
                          </span>
                        </td>
                        <td className="p-2 border-r border-encre-noire/10">
                          {totalEtapes > 0 ? (
                            isTerminee ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40">
                                <span>✅</span> Terminée ({totalEtapes}/{totalEtapes})
                              </span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                  isWaiting
                                    ? 'bg-amber-100 text-amber-800 border-amber-400 animate-pulse'
                                    : 'bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40'
                                }`}>
                                  <span>{isWaiting ? '⏳' : '🛠️'}</span>
                                  <span>Étape {Math.min(currentStep + 1, totalEtapes)} / {totalEtapes}</span>
                                </span>
                                {modelPart?.chapitres?.[currentStep]?.titre && (
                                  <span className="text-[8px] text-stone-500 font-semibold truncate max-w-[130px]" title={modelPart.chapitres[currentStep].titre}>
                                    {modelPart.chapitres[currentStep].titre}
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-[9px] text-stone-400 italic">
                              {part.modelId ? 'Sans étape' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {parseInt(part.quantite, 10) > 1 && (
                              <button
                                type="button"
                                onClick={() => handleSplitPart && handleSplitPart(part)}
                                className="px-2 py-1 border border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer text-[9px] font-black uppercase flex items-center gap-1 shrink-0"
                                title={`Cette référence regroupe ${part.quantite} unités. Cliquer pour scinder en ${part.quantite} pièces distinctes.`}
                              >
                                <span>⚡</span>
                                <span className="hidden sm:inline">Scinder</span>
                                <span>({part.quantite})</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenPartEdit(part)}
                              className="p-1.5 border border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                              title="Modifier la pièce"
                            >
                              <XiloChisel size={10} />
                            </button>
                            <button
                              onClick={() => handleDeletePart(part.id)}
                              className="p-1.5 border border-red-700 bg-red-50 hover:bg-red-100 text-red-700 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer text-[10px]"
                              title="Supprimer la pièce"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
