import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import { useTranslation } from '../LanguageContext';

export default function TabDocuments({
  formData,
  handleChange,
  droitImageFile,
  setDroitImageFile,
  aptitudeMedicaleFile,
  setAptitudeMedicaleFile,
  saving,
  t: propT
}) {
  const { t: contextT } = useTranslation();
  const t = propT || contextT;
  const { confirm } = useConfirm();
  const {
    demanderDroitImage = false,
    droitImageDocUrl = '',
    demanderAttestationSante = false,
    aptitudeMedicaleDocUrl = '',
    varalCategories = []
  } = formData;

  const [newCatName, setNewCatName] = useState('');
  const [newCatUpload, setNewCatUpload] = useState(false);
  const [newCatUploadUrl, setNewCatUploadUrl] = useState('');
  const [newCatArchive, setNewCatArchive] = useState(false);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      nom: newCatName.trim(),
      actif: true,
      activerUploadPublic: newCatUpload,
      lienUploadPublic: newCatUpload ? newCatUploadUrl.trim() : '',
      activerOpaciteArchive: newCatArchive
    };
    handleChange('varalCategories', [...varalCategories, newCat]);
    setNewCatName('');
    setNewCatUpload(false);
    setNewCatUploadUrl('');
    setNewCatArchive(false);
  };

  const handleToggleCategoryActive = (id, newActiveState) => {
    const updated = varalCategories.map(c => 
      c.id === id ? { ...c, actif: newActiveState } : c
    );
    handleChange('varalCategories', updated);
  };

  const handleRemoveCategory = async (id) => {
    const msg = t?.('documents.varalSettingsRemoveConfirm') || "Êtes-vous sûr de vouloir supprimer cette corde ? Les documents liés ne seront pas supprimés mais n'auront plus de catégorie associée.";
    const isOk = await confirm({
      title: t('settings.communication.tabDocuments.supprimerLaCorde'),
      message: msg,
      confirmText: t('common.yesDelete') || "Oui, supprimer",
      cancelText: t('common.cancel') || "Annuler",
      variant: "danger"
    });
    if (isOk) {
      handleChange('varalCategories', varalCategories.filter(c => c.id !== id));
    }
  };

  return (
    <>
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          {t('settings.communication.tabDocuments.documentsDeLAssociationRgpd')}
        </h3>

        {/* Image Rights Basculer */}
        <div className="flex flex-col gap-1 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left mb-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={demanderDroitImage}
              onChange={(e) => handleChange('demanderDroitImage', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-encre-noire">
                {t('settings.communication.tabDocuments.activerLaDemandeDeDroit')}
              </span>
              <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
                {t('settings.communication.tabDocuments.siActiveLesAdherentsVerront')}
              </span>
            </div>
          </label>
        </div>

        {/* Droit à l'image Doc */}
        <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
            {t('settings.communication.tabDocuments.charteDeDroitAL')}
          </span>
          <div className="flex flex-col gap-1.5">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => setDroitImageFile(e.target.files?.[0] || null)}
              disabled={saving}
              className="text-[9px] font-bold"
            />
            {droitImageFile && (
              <span className="text-[9px] text-green-600 font-bold">
                {t('settings.communication.tabDocuments.selectionne')} {droitImageFile.name}
              </span>
            )}
            {droitImageDocUrl && (
              <a 
                href={droitImageDocUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[9px] text-cordel-wood hover:underline font-bold"
              >
                {t('settings.communication.tabDocuments.voirLeDocumentEnLigne')}
              </a>
            )}
          </div>
        </div>

        {/* Medical Aptitude Basculer */}
        <div className="flex flex-col gap-1 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left mb-3 mt-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={demanderAttestationSante}
              onChange={(e) => handleChange('demanderAttestationSante', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-encre-noire">
                {t('settings.communication.tabDocuments.activerLaDemandeDAptitude')}
              </span>
              <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
                {t('settings.communication.tabDocuments.siActiveLesAdherentsDevront')}
              </span>
            </div>
          </label>
        </div>

        {/* Aptitude médicale Doc */}
        <div className="flex flex-col gap-2 mt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
            {t('settings.communication.tabDocuments.modeleDeCertificatMedicalReglement')}
          </span>
          <div className="flex flex-col gap-1.5">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => setAptitudeMedicaleFile(e.target.files?.[0] || null)}
              disabled={saving}
              className="text-[9px] font-bold"
            />
            {aptitudeMedicaleFile && (
              <span className="text-[9px] text-green-600 font-bold">
                {t('settings.communication.tabDocuments.selectionne')} {aptitudeMedicaleFile.name}
              </span>
            )}
            {aptitudeMedicaleDocUrl && (
              <a 
                href={aptitudeMedicaleDocUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[9px] text-cordel-wood hover:underline font-bold"
              >
                {t('settings.communication.tabDocuments.voirLeDocumentEnLigne')}
              </a>
            )}
          </div>
        </div>
      </CordelCard>

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🔗 {t('settings.communication.tabDocuments.categoriesDuVaralFils')}
        </h3>
      
        {/* Form to ajouter a new category */}
        <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-cordel-master-dark/15 text-xs text-left">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('settings.communication.tabDocuments.nomDeLaCategorieEx')}
              </label>
              <input 
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={t('documents.varalSettingsNamePlaceholder')}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <label className="flex items-center gap-2 font-bold text-[10px] cursor-pointer">
                <input 
                  type="checkbox"
                  checked={newCatUpload}
                  onChange={(e) => setNewCatUpload(e.target.checked)}
                  className="scale-95 cursor-pointer"
                />
                <span>{t('settings.communication.tabDocuments.activerLUploadPublicLien')}</span>
              </label>
              {newCatUpload && (
                <input 
                  type="url"
                  value={newCatUploadUrl}
                  onChange={(e) => setNewCatUploadUrl(e.target.value)}
                  placeholder={t('documents.varalSettingsUploadUrlLabel')}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full mt-1.5"
                />
              )}
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <label className="flex items-center gap-2 font-bold text-[10px] cursor-pointer">
                <input 
                  type="checkbox"
                  checked={newCatArchive}
                  onChange={(e) => setNewCatArchive(e.target.checked)}
                  className="scale-95 cursor-pointer"
                />
                <span>{t('settings.communication.tabDocuments.archiverVisuellementOpaciteReduiteSi')}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-1">
            <CordelButton 
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleAddCategory}
              disabled={saving || !newCatName.trim() || (newCatUpload && !newCatUploadUrl.trim())}
              className="py-1.5 text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
            >
              {t('settings.communication.tabDocuments.ajouter')}
            </CordelButton>
          </div>
        </div>

        {/* Display list of configured categories */}
        <div className="flex flex-col gap-2 mt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
            {t('settings.communication.tabDocuments.cordesConfigurees')}
          </span>
          {varalCategories.length === 0 ? (
            <span className="text-[10px] italic opacity-60">
              {t('settings.communication.tabDocuments.aucuneCategorieConfiguree')}
            </span>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {varalCategories.map((cat) => (
                <div 
                  key={cat.id}
                  className="border border-encre-noire/15 p-2.5 rounded bg-white/40 dark:bg-black/10 flex justify-between items-center text-xs text-left"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-encre-noire">{cat.nom}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1 text-[8px] font-black uppercase text-cordel-wood">
                      {cat.activerUploadPublic && (
                        <span className="px-1 bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-sm">
                          {t('settings.communication.tabDocuments.public')}
                        </span>
                      )}
                      {cat.activerOpaciteArchive && (
                        <span className="px-1 bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 rounded-sm">
                          {t('settings.communication.tabDocuments.opaciteArchive')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={cat.actif !== false}
                        onChange={(e) => handleToggleCategoryActive(cat.id, e.target.checked)}
                        disabled={saving}
                        className="w-4 h-4 rounded cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
                      />
                      <span className={`text-[10px] font-bold ${cat.actif !== false ? 'text-[var(--color-cordel-vert,#2d6a4f)] font-black' : 'text-cordel-master-dark/60 italic'}`}>
                        {/* Afficher cette corde */}
                        {cat.actif !== false ? t('settings.communication.tabDocuments.afficherCetteCorde') : t('settings.communication.tabDocuments.cordeMasquee')}
                      </span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="text-xs hover:text-red-500 font-bold px-2 py-1 cursor-pointer select-none"
                      title={t('settings.communication.tabDocuments.supprimer')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CordelCard>
    </>
  );
}
