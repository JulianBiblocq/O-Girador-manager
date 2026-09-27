import React from 'react';
import ModulesSwitchesTable from './modules/ModulesSwitchesTable';
import TamboursNamingAccordion from './modules/TamboursNamingAccordion';
import BrandingLogoAccordion from './modules/BrandingLogoAccordion';
import MediaStorageAccordion from './modules/MediaStorageAccordion';
import MemberDashboardLayoutAccordion from './modules/MemberDashboardLayoutAccordion';

/**
 * Pôle Configuration - Onglet Modules SaaS, Apparence & Médias ('config-modules').
 * Regroupe les interrupteurs des modules, la nomenclature des tambours, le logo/thème,
 * les playlists YouTube, le stockage cloud et l'ordonnancement de l'accueil adhérent.
 */
export default function TabModules({
  formData,
  handleChange,
  logoFile,
  setLogoFile,
  uploadingLogo,
  groupId,
  saving,
  t
}) {
  return (
    <div className="flex flex-col gap-2 text-left select-none">
      {/* 1. Tableau unifié des interrupteurs des modules SaaS et pôles métiers */}
      <div data-tour="config-modules-toggles">
        <ModulesSwitchesTable
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 2. Nomenclature des tambours & pupitres - Accordéon replié */}
      <div data-tour="config-modules-tambours">
        <TamboursNamingAccordion
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 3. Apparence, Logo officiel & Thème - Accordéon replié */}
      <div data-tour="config-modules-appearance">
        <BrandingLogoAccordion
          formData={formData}
          handleChange={handleChange}
          logoFile={logoFile}
          setLogoFile={setLogoFile}
          uploadingLogo={uploadingLogo}
          saving={saving}
        />
      </div>

      {/* 4. Playlists YouTube & Stockage Cloud vidéo (Framaspace) - Accordéons fermés */}
      <MediaStorageAccordion
        formData={formData}
        handleChange={handleChange}
        groupId={groupId}
        saving={saving}
      />

      {/* 5. Disposition des blocs de l'accueil adhérent & Anniversaires - Accordéon replié */}
      <MemberDashboardLayoutAccordion
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />
    </div>
  );
}
