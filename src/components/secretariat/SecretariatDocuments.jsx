import React from 'react';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import TabDocuments from '../association-settings/TabDocuments';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Composant de gestion des chartes associatives, consentements RGPD (droit à l'image)
 * et attestations de santé / aptitudes médicales pour le Secrétariat.
 */
export default function SecretariatDocuments({ groupId, onBack }) {
  const { t } = useTranslation();

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
          Chargement des documents...
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
            <span className="text-[#2d6a4f] dark:text-emerald-400">Chartes & Santé</span>
          </div>
          <h2 className="text-xl font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>📋</span> Chartes, RGPD & Aptitudes Médicales
          </h2>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Configurez les formulaires obligatoires requis lors de l'adhésion (droit à l'image, questionnaires de santé) et les cordes du Varal.
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

      {/* Contenu principal */}
      <div className="flex flex-col gap-4">
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
            {saving ? "Enregistrement..." : "💾 Enregistrer les Documents"}
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
