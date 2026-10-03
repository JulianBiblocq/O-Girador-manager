import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import TabPublicProDocs from '../TabPublicProDocs';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Accordéon 4 : Documents Espace Pro
 * Gère les 4 fichiers téléchargeables réservés aux organisateurs et programmateurs
 * (Dossier artistique, fiche technique, plan de scène et kit presse).
 */
export default function ProDocsAccordion({
  formData = {},
  handleChange,
  dossierPresentationFile,
  setDossierPresentationFile,
  ficheTechniqueFile,
  setFicheTechniqueFile,
  planSceneFile,
  setPlanSceneFile,
  kitPresseFile,
  setKitPresseFile,
  saving,
  defaultOpen = false
}) {
  const { t } = useTranslation();
  const publicTheme = formData.publicTheme || {};
  
  // Comptage des documents renseignés
  const docsKeys = ['dossierPresentationUrl', 'dossierProPdfUrl', 'ficheTechniqueUrl', 'planSceneUrl', 'kitPresseUrl'];
  const uploadedCount = [
    publicTheme.dossierPresentationUrl || publicTheme.dossierProPdfUrl,
    publicTheme.ficheTechniqueUrl,
    publicTheme.planSceneUrl,
    publicTheme.kitPresseUrl
  ].filter(Boolean).length;

  return (
    <CordelAccordion
      title={t('vitrine.admin.proDocs.proDocsAccordion.documentsEspacePro')}
      subtitle={t('vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan', {
        param: uploadedCount,
        count: uploadedCount,
        s: uploadedCount > 1 ? 's' : ''
      })}
      icon="📥"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="pt-1 text-left">
        <TabPublicProDocs
          formData={formData}
          handleChange={handleChange}
          dossierPresentationFile={dossierPresentationFile}
          setDossierPresentationFile={setDossierPresentationFile}
          ficheTechniqueFile={ficheTechniqueFile}
          setFicheTechniqueFile={setFicheTechniqueFile}
          planSceneFile={planSceneFile}
          setPlanSceneFile={setPlanSceneFile}
          kitPresseFile={kitPresseFile}
          setKitPresseFile={setKitPresseFile}
          saving={saving}
        />
      </div>
    </CordelAccordion>
  );
}
