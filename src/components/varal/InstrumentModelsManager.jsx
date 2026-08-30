import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';
import InstrumentModelEditor from './InstrumentModelEditor';
import { XiloChisel } from '../XiloIcons';

export default function InstrumentModelsManager({ groupId, isAuthorized, varalCategories }) {
  const { models, loading, addModel, updateModel, deleteModel } = useInstrumentModels(groupId);
  const [editingModel, setEditingModel] = useState(null);

  const handleSaveModel = async (modelData) => {
    try {
      if (editingModel.id === 'new') {
        await addModel(modelData);
      } else {
        await updateModel(editingModel.id, modelData);
      }
      setEditingModel(null);
    } catch (err) {
      alert("Erreur lors de la sauvegarde du modèle.");
    }
  };

  const handleDeleteModel = async (modelId, nom) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${nom}" ?\nAttention, ceci supprimera aussi les tutoriels associés.`)) {
      try {
        await deleteModel(modelId);
      } catch (err) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleExportModel = (model) => {
    const exportData = { ...model };
    delete exportData.id;
    delete exportData.groupId;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `pack_${(model.nom || 'modele').replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportPack = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.nom || !importedData.type) {
          alert("Fichier non valide : ce pack ne semble pas être un Modèle d'instrument.");
          return;
        }
        // Force l'association à ce groupe via le hook useInstrumentModels qui s'en charge
        await addModel(importedData);
        alert(`Pack "${importedData.nom}" importé avec succès !`);
      } catch (err) {
        alert("Erreur lors de la lecture ou de l'import du fichier JSON.");
        console.error(err);
      }
      event.target.value = null; // Reset input
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500 font-bold uppercase tracking-wider animate-pulse">Chargement des modèles...</div>;
  }

  if (!isAuthorized) {
    return <div className="p-8 text-center text-xs text-red-500 font-bold">Accès non autorisé à cette section.</div>;
  }

  if (editingModel) {
    return (
      <InstrumentModelEditor 
        model={editingModel.id === 'new' ? null : editingModel}
        existingModels={models}
        varalCategories={varalCategories}
        onSave={handleSaveModel}
        onCancel={() => setEditingModel(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloChisel size={16} /> Modèles d'Instruments & Tutos
        </h3>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-white text-cordel-wood border border-cordel-wood text-xs px-4 py-1.5 shadow-[2px_2px_0px_0px_var(--color-cordel-wood)] rounded font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors">
            📥 Importer Pack
            <input type="file" accept=".json" onChange={handleImportPack} className="hidden" />
          </label>
          <CordelButton 
            variant="ocre" 
            onClick={() => setEditingModel({ id: 'new' })}
            className="text-xs px-4 py-1.5 shadow-[2px_2px_0px_0px_#181716]"
          >
            + Créer un Modèle
          </CordelButton>
        </div>
      </div>

      <div className="text-xs text-stone-600 mb-4 leading-relaxed">
        Gérez ici la "recette" de fabrication de vos instruments (les pièces requises, le matériel, les outils) et créez les chapitres du Varal associés à chaque pièce.
      </div>

      {models.length === 0 ? (
        <CordelCard variant="default" className="p-8 text-center bg-white/50 border-dashed border-cordel-master-dark/30">
          <span className="text-xs font-bold text-stone-500">Aucun modèle d'instrument défini pour le moment.</span>
        </CordelCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => (
            <CordelCard key={model.id} variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-2 relative group hover:bg-[#faf8f5] transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-encre-noire leading-tight">{model.nom}</h4>
                  <span className="text-[9px] bg-cordel-master-dark/10 px-1.5 py-0.5 rounded text-cordel-master-dark font-bold uppercase">
                    {model.type}
                  </span>
                </div>
              </div>
              
              <p className="text-[10px] text-stone-600 line-clamp-2 italic h-8">
                {model.description || "Aucune description"}
              </p>

              <div className="text-[10px] text-encre-noire font-bold bg-white/50 border border-dashed border-cordel-master-dark/20 rounded p-1.5 mt-auto">
                {model.parts?.length || 0} Pièces à fabriquer
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
                <button 
                  onClick={() => handleExportModel(model)}
                  className="text-[10px] font-bold text-cordel-vert hover:underline"
                >
                  Exporter Pack
                </button>
                <button 
                  onClick={() => setEditingModel(model)}
                  className="text-[10px] font-bold text-cordel-wood hover:underline"
                >
                  Éditer
                </button>
                <button 
                  onClick={() => handleDeleteModel(model.id, model.nom)}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </CordelCard>
          ))}
        </div>
      )}
    </div>
  );
}
