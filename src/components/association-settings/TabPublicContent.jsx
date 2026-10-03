import React from 'react';
import { useTranslation } from '../LanguageContext';
import TabPublicGeneral from './TabPublicGeneral';
import TabPublicTheme from './TabPublicTheme';
import HeroHeaderAccordion from './vitrine/HeroHeaderAccordion';
import PresentationVieAccordion from './vitrine/PresentationVieAccordion';
import FormulesRecrutementAccordion from './vitrine/FormulesRecrutementAccordion';
import ProDocsAccordion from './vitrine/ProDocsAccordion';
import GallerySouvenirsAccordion from './vitrine/GallerySouvenirsAccordion';
import SocialNewsletterAccordion from './vitrine/SocialNewsletterAccordion';

/**
 * Pôle Vitrine Publique - Hub d'administration des contenus éditoriaux.
 * Cloisonnement strict des vues par onglet : 1 onglet actif = son contenu exclusif uniquement.
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
  t: propT,
  contentSubTab = 'general',
  activeTab
}) {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;

  const currentTab = (activeTab || contentSubTab || 'general')
    .replace(/^vitrine-/, '')
    .toLowerCase()
    .trim();

  switch (currentTab) {
    case 'presentation':
    case 'apresentacao':
    case 'presentation-textes':
      return (
        <div className="flex flex-col gap-2 text-left select-none">
          <HeroHeaderAccordion
            formData={formData}
            handleChange={handleChange}
            heroImageFile={heroImageFile}
            setHeroImageFile={setHeroImageFile}
            saving={saving}
            defaultOpen={true}
          />
          <PresentationVieAccordion
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            defaultOpen={true}
          />
        </div>
      );

    case 'organisateur':
    case 'organizer':
    case 'technique':
    case 'tecnica':
    case 'pro-docs':
    case 'prodocs':
      return (
        <div className="flex flex-col gap-2 text-left select-none">
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
            defaultOpen={true}
          />
        </div>
      );

    case 'galerie':
    case 'gallery':
    case 'galeria':
    case 'fotos':
      return (
        <div className="flex flex-col gap-2 text-left select-none">
          <GallerySouvenirsAccordion
            formData={formData}
            handleChange={handleChange}
            groupId={groupId}
            saving={saving}
            defaultOpen={true}
          />
        </div>
      );

    case 'recrutement':
    case 'recruitment':
    case 'recrutamento':
      return (
        <div className="flex flex-col gap-2 text-left select-none">
          <FormulesRecrutementAccordion
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            defaultOpen={true}
          />
        </div>
      );

    case 'reseaux':
    case 'social':
    case 'newsletter':
    case 'redes':
      return (
        <div className="flex flex-col gap-2 text-left select-none">
          <SocialNewsletterAccordion
            formData={formData}
            handleChange={handleChange}
            groupId={groupId}
            saving={saving}
            defaultOpen={true}
          />
        </div>
      );

    case 'apparence':
    case 'theme':
    case 'aparencia':
      return (
        <div className="flex flex-col gap-2 text-left select-none">
          <TabPublicTheme
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        </div>
      );

    case 'general':
    case 'vitrine-general':
    case 'seo':
    default:
      return (
        <TabPublicGeneral
          formData={formData}
          handleChange={handleChange}
          groupId={groupId}
          saving={saving}
        />
      );
  }
}
