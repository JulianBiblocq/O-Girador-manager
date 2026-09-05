import React, { useState } from 'react';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import TabDocuments from '../association-settings/TabDocuments';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Composant de gestion des Ressources & Liens de l'association pour le Secrétariat :
 * 1. Chartes associatives, consentements RGPD (droit à l'image) et aptitudes médicales.
 * 2. Liens de stockage et partages externes (Dropbox pour les photos d'événements, Framaspace/Drive pour le forum).
 */
export default function SecretariatDocuments({ groupId, onBack, initialSubTab = 'chartes' }) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState(initialSubTab);

  const {
    formData,
    handleChange,
    droitImageFile,
    setDroitImageFile,
    aptitudeMedicaleFile,
    setAptitudeMedicaleFile,
    saving,
    loading,
    toastMessage,
    handleSave
  } = useAssociationSettings(groupId, true, onBack, t);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin text-4xl select-none">⏳</div>
        <p className="font-semibold text-xs uppercase tracking-widest text-cordel-master-dark opacity-60">
          Chargement des ressources et liens...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left select-none max-w-4xl mx-auto w-full">
      {/* En-tête avec fil d'ariane et bouton retour */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-dashed border-cordel-master-dark/30">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cordel-master-dark uppercase tracking-wider mb-1">
            <span>Secrétariat</span>
            <span>›</span>
            <span className="text-[#2d6a4f] dark:text-emerald-400">Ressources & Liens</span>
          </div>
          <h2 className="text-xl font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>📁</span> Ressources & Liens Partagés
          </h2>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Gérez les chartes d'adhésion, attestations de santé, ainsi que vos espaces de stockage partagés (Drive, Dropbox, Framaspace).
          </p>
        </div>

        {onBack && (
          <CordelButton
            type="button"
            onClick={onBack}
            className="text-xs font-bold"
          >
            ⬅️ Retour
          </CordelButton>
        )}
      </div>

      {/* Sélecteur de sous-onglets */}
      <div className="flex gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2 mb-1 select-none">
        <button
          type="button"
          onClick={() => setSubTab('chartes')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
            subTab === 'chartes'
              ? 'bg-[#2d6a4f] text-white border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          📋 Chartes & Santé
        </button>
        <button
          type="button"
          onClick={() => setSubTab('liens')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
            subTab === 'liens'
              ? 'bg-[#2d6a4f] text-white border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          🔗 Stockages & Liens Partagés
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col gap-4">
        {subTab === 'chartes' ? (
          <TabDocuments 
            formData={formData}
            handleChange={handleChange}
            droitImageFile={droitImageFile}
            setDroitImageFile={setDroitImageFile}
            aptitudeMedicaleFile={aptitudeMedicaleFile}
            setAptitudeMedicaleFile={setAptitudeMedicaleFile}
            saving={saving}
            t={t}
          />
        ) : (
          <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
              🎛️ Liens Externes & Espaces Cloud
            </h3>
            <div className="flex flex-col gap-4 text-left">
              {/* Lien externe de récolte de photos */}
              <div className="flex flex-col gap-1">
                <label htmlFor="secLienRecoltePhotos" className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
                  📷 Lien externe de récolte de photos (Dropbox, Google Drive...)
                </label>
                <input 
                  id="secLienRecoltePhotos"
                  type="url"
                  value={formData.lienRecoltePhotosExternes || formData.lienGoogleFormRecoltePhotos || ''}
                  onChange={(e) => {
                    handleChange('lienRecoltePhotosExternes', e.target.value);
                    handleChange('lienGoogleFormRecoltePhotos', e.target.value);
                  }}
                  disabled={saving}
                  placeholder="ex: https://www.dropbox.com/request/... ou https://drive.google.com/..."
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
                <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
                  Permet de générer un QR Code public affichable sur la fiche de chaque événement pour inviter le public et les membres à envoyer leurs photos et vidéos.
                </p>
              </div>

              {/* Lien de Dépôt des Images du Forum */}
              <div className="flex flex-col gap-1 text-left pt-3 border-t border-dashed border-cordel-master-dark/15">
                <label htmlFor="secLienDepotForum" className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
                  🖼️ Espace de stockage des photos du Forum (Framaspace, Drive...)
                </label>
                <input 
                  id="secLienDepotForum"
                  type="url"
                  value={formData.lienDepotForum || ''}
                  onChange={(e) => handleChange('lienDepotForum', e.target.value)}
                  disabled={saving}
                  placeholder="ex: https://mon-asso.framaspace.org/... ou https://drive.google.com/..."
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
                <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
                  Redirige les membres vers votre espace de stockage partagé lors de l'insertion d'une photo dans les discussions du Porte-voix.
                </p>
              </div>

              {/* Consignes personnalisées pour le Dépôt des Images */}
              {formData.lienDepotForum && (
                <div className="flex flex-col gap-1 text-left animate-fade-in pl-4 border-l-2 border-[#c05621]">
                  <label htmlFor="secConsignesDepotForum" className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
                    📝 Consignes personnalisées d'upload (Optionnel)
                  </label>
                  <textarea 
                    id="secConsignesDepotForum"
                    value={formData.consignesDepotForum || ''}
                    onChange={(e) => handleChange('consignesDepotForum', e.target.value)}
                    disabled={saving}
                    placeholder="Ex: Allez dans le dossier 'Photos Forum', ajoutez votre image, puis copiez son lien de partage..."
                    className="theme-input text-xs font-bold p-2 bg-cordel-bg-light w-full min-h-[65px]"
                  />
                  <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
                    Texte d'aide qui s'affichera à vos membres pour leur expliquer comment récupérer le lien sur votre espace de stockage. S'il est vide, une consigne générique s'affichera.
                  </p>
                </div>
              )}
            </div>
          </CordelCard>
        )}

        {/* Bouton d'action et enregistrement */}
        <div className="flex justify-end pt-3 border-t border-dashed border-cordel-master-dark/20">
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
          >
            {saving ? "Enregistrement..." : "💾 Enregistrer les Modifications"}
          </CordelButton>
        </div>
      </div>

      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-lg shadow-[3px_3px_0px_0px_#181716] border-2 border-encre-noire flex items-center gap-2.5 select-none animate-fade-in">
          <span className="text-base">✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
