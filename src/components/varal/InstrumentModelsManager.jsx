import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useInstrumentModels } from '../../hooks/useInstrumentModels';
import InstrumentModelEditor from './InstrumentModelEditor';
import { XiloChisel } from '../XiloIcons';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { exportInstrumentMasterBundle } from '../../utils/bundleExportService';
import ImportModelWizardModal from '../inventory/ImportModelWizardModal';
import { useSuppliesData } from '../../hooks/useSuppliesData';
import useConfirm from '../../hooks/useConfirm';

export default function InstrumentModelsManager({ groupId, isAuthorized, varalCategories }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { models, loading, addModel, updateModel, deleteModel } = useInstrumentModels(groupId);
  const [editingModel, setEditingModel] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const { supplies, tools } = useSuppliesData(groupId, 'lutherie');

  const handleSaveModel = async (modelData) => {
    try {
      if (editingModel.id === 'new') {
        await addModel(modelData);
      } else {
        await updateModel(editingModel.id, modelData);
      }
      setEditingModel(null);
    } catch (err) {
      alert(t('lutherie.alertSaveModelError'));
    }
  };

  const handleDeleteModel = async (modelId, nom) => {
    const ok = await confirm({
      title: "Supprimer le modèle ?",
      message: `Êtes-vous sûr de vouloir supprimer le modèle "${nom}" ?\nAttention, ceci supprimera aussi les tutoriels associés.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger"
    });
    if (ok) {
      try {
        await deleteModel(modelId);
      } catch (err) {
        alert(t('lutherie.alertDeleteModelError'));
      }
    }
  };

  const handleTogglePublic = async (model) => {
    try {
      const isCurrentlyPublic = model.isPublic === true;
      let updates = {
        isPublic: !isCurrentlyPublic
      };

      if (!isCurrentlyPublic) {
        updates.authorGroupId = groupId;
        
        const assocRef = doc(db, 'associations', groupId);
        const assocSnap = await getDoc(assocRef);
        if (assocSnap.exists()) {
          const assocData = assocSnap.data();
          updates.authorName = assocData.name || assocData.nom || 'Association';
        }

        if (!model.rewardClaimed) {
          updates.rewardClaimed = true;
          await updateDoc(assocRef, {
            contributionPoints: increment(25)
          });
          alert(t('lutherie.alertShareAxePointsSuccess'));
        }
      }

      await updateModel(model.id, updates);
    } catch (err) {
      console.error("Error toggling public state:", err);
      alert(t('lutherie.alertTogglePublicError'));
    }
  };

  const handleExportModel = async (model) => {
    setIsExporting(true);
    try {
      await exportInstrumentMasterBundle(model, supplies, tools);
    } catch (err) {
      console.error("Erreur lors de l'export :", err);
      alert(t('lutherie.alertCreateBundleError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportPack = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImportFile(file);
    event.target.value = null; // Reset input pour permettre de resélectionner le même fichier
  };

  const handleImportSuccess = (nomModel) => {
    alert(`Bundle "${nomModel}" importé avec succès !`);
    setImportFile(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500 font-bold uppercase tracking-wider animate-pulse">{t('lutherie.loadingModels')}</div>;
  }

  if (!isAuthorized) {
    return <div className="p-8 text-center text-xs text-red-500 font-bold">{t('lutherie.unauthorizedSection')}</div>;
  }

  if (editingModel) {
    return (
      <InstrumentModelEditor 
        model={editingModel.id === 'new' ? null : editingModel}
        existingModels={models}
        varalCategories={varalCategories}
        tools={tools}
        supplies={supplies}
        onSave={handleSaveModel}
        onCancel={() => setEditingModel(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloChisel size={16} /> {t('lutherie.instrumentModelsTitle')}
        </h3>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-white text-cordel-wood border border-cordel-wood text-xs px-4 py-1.5 shadow-[2px_2px_0px_0px_var(--color-cordel-wood)] rounded font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors">
            {t('lutherie.btnImportMasterBundle')}
            <input type="file" accept=".json,.zip" onChange={handleImportPack} className="hidden" />
          </label>
          <CordelButton 
            variant="ocre" 
            onClick={() => setEditingModel({ id: 'new' })}
            className="text-xs px-4 py-1.5 shadow-[2px_2px_0px_0px_#181716]"
          >
            {t('lutherie.btnCreateModel')}
          </CordelButton>
        </div>
      </div>

      <div className="text-xs text-stone-600 mb-4 leading-relaxed">
        {t('lutherie.modelsRecipeDescription')}
      </div>

      {models.length === 0 ? (
        <CordelCard variant="default" className="p-8 text-center bg-white/50 border-dashed border-cordel-master-dark/30">
          <span className="text-xs font-bold text-stone-500">{t('lutherie.noModelDefinedYet')}</span>
        </CordelCard>
      ) : (
        <div data-tour="lutherie-models-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div data-tour="lutherie-model-blueprint" className="text-[10px] text-encre-noire font-bold bg-white/50 border border-dashed border-cordel-master-dark/20 rounded p-1.5 mt-auto">
                {t('lutherie.partsToBuildCount', { count: model.parts?.length || 0 })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => handleTogglePublic(model)}
                    className={`text-[10px] font-bold ${model.isPublic ? 'text-cordel-vert' : 'text-cordel-ocre'} hover:underline flex items-center gap-1`}
                  >
                    {model.isPublic ? '🔓 Dépublier' : '🔒 Publier Terreiro'}
                  </button>
                  <button 
                    onClick={() => setEditingModel(model)}
                    className="text-[10px] font-bold text-cordel-wood hover:underline"
                  >
                    {t('lutherie.btnEdit')}
                  </button>
                  <button 
                    onClick={() => handleDeleteModel(model.id, model.nom)}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    {t('lutherie.btnDelete')}
                  </button>
                </div>
                <CordelButton 
                  variant="secondary" 
                  className="text-[10px] uppercase font-bold py-1.5 px-3 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                  onClick={() => handleExportModel(model)}
                  disabled={isExporting}
                >
                  {isExporting ? "Export..." : `📦 ${t('lutherie.btnExportBundle')}`}
                </CordelButton>
              </div>
            </CordelCard>
          ))}
        </div>
      )}

      {/* Modale d'importation Wizard */}
      {importFile && (
        <ImportModelWizardModal
          groupId={groupId}
          file={importFile}
          suppliesList={supplies}
          toolsList={tools}
          onClose={() => setImportFile(null)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
