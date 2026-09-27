import React from 'react';
import TabPublicGeneral from './TabPublicGeneral';
import HeroHeaderAccordion from './vitrine/HeroHeaderAccordion';
import PresentationVieAccordion from './vitrine/PresentationVieAccordion';
import FormulesRecrutementAccordion from './vitrine/FormulesRecrutementAccordion';
import ProDocsAccordion from './vitrine/ProDocsAccordion';
import GallerySouvenirsAccordion from './vitrine/GallerySouvenirsAccordion';
import SocialNewsletterAccordion from './vitrine/SocialNewsletterAccordion';

/**
 * Pôle Vitrine Publique - Hub d'administration des contenus éditoriaux.
 * Structuré en 6 accordéons thématiques compacts repliés par défaut
 * pour éliminer le défilement vertical excessif et clarifier la gestion.
 */
export default function TabPublicContent({
  formData = {},
  handleChange,
  heroImageFile,
  setHeroImageFile,
  dossierProPdfFile,
  setDossierProPdfFile,
  dossierPresentationFile,
  setDossierPresentationFile,
  ficheTechniqueFile,
  setFicheTechniqueFile,
  planSceneFile,
  setPlanSceneFile,
  kitPresseFile,
  setKitPresseFile,
  groupId,
  saving,
  t,
  contentSubTab = 'general'
}) {
  // Si l'utilisateur est sur l'onglet spécifique Général & SEO
  if (contentSubTab === 'general') {
    return (
      <TabPublicGeneral
        formData={formData}
        handleChange={handleChange}
        groupId={groupId}
        saving={saving}
      />
    );
  }

  // Détermination de l'accordéon ciblé par la navigation directe (optionnel)
  const isHeroTargeted = contentSubTab === 'presentation';
  const isPresentationTargeted = contentSubTab === 'presentation-textes';
  const isRecruitmentTargeted = contentSubTab === 'recrutement';
  const isProDocsTargeted = contentSubTab === 'organisateur';
  const isGalleryTargeted = contentSubTab === 'galerie';
  const isSocialTargeted = contentSubTab === 'reseaux';

  return (
    <div className="flex flex-col gap-2 text-left select-none">
      {/* Accordéon 1 : En-tête & Accroche (Hero) */}
      <HeroHeaderAccordion
        formData={formData}
        handleChange={handleChange}
        heroImageFile={heroImageFile}
        setHeroImageFile={setHeroImageFile}
        saving={saving}
        defaultOpen={isHeroTargeted}
      />

      {/* Accordéon 2 : Présentation & Vie Associative */}
      <PresentationVieAccordion
        formData={formData}
        handleChange={handleChange}
        saving={saving}
        defaultOpen={isPresentationTargeted}
      />

      {/* Accordéon 3 : Formules & Recrutement */}
      <FormulesRecrutementAccordion
        formData={formData}
        handleChange={handleChange}
        saving={saving}
        defaultOpen={isRecruitmentTargeted}
      />

      {/* Accordéon 4 : Documents Espace Pro */}
      <ProDocsAccordion
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
        defaultOpen={isProDocsTargeted}
      />

      {/* Accordéon 5 : Galerie & Souvenirs */}
      <GallerySouvenirsAccordion
        formData={formData}
        handleChange={handleChange}
        groupId={groupId}
        saving={saving}
        defaultOpen={isGalleryTargeted}
      />

      {/* Accordéon 6 : Réseaux Sociaux & Newsletter */}
      <SocialNewsletterAccordion
        formData={formData}
        handleChange={handleChange}
        groupId={groupId}
        saving={saving}
        defaultOpen={isSocialTargeted}
      />
    </div>
  );
}
