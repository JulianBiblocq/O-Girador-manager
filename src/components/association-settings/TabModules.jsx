import React from 'react';
import AdminPolesSwitchesCard from './modules/AdminPolesSwitchesCard';
import MemberTabsVisibilityCard from './modules/MemberTabsVisibilityCard';
import SatelliteAppsCard from './modules/SatelliteAppsCard';
import WardrobeMemberModeCard from './modules/WardrobeMemberModeCard';
import TamboursNamingAccordion from './modules/TamboursNamingAccordion';
import BrandingLogoAccordion from './modules/BrandingLogoAccordion';
import MediaStorageAccordion from './modules/MediaStorageAccordion';
import MemberDashboardLayoutAccordion from './modules/MemberDashboardLayoutAccordion';

/**
 * Pôle Configuration - Onglet Modules SaaS, Apparence & Médias ('config-modules').
 * Regroupe les interrupteurs des pôles métiers (Niveau 1), la visibilité membre (Niveau 2),
 * les apps satellites, le mode vestiaire adhérent, la nomenclature, le logo/thème et les médias.
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
      {/* 1. Carte Niveau 1 : Pôles Métiers & Back-Office */}
      <div data-tour="config-modules-admin-poles">
        <AdminPolesSwitchesCard
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 2. Carte Niveau 2 : Affichage de l'Espace Membre (Vue Adhérents) */}
      <div data-tour="config-modules-member-tabs">
        <MemberTabsVisibilityCard
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 3. Carte Niveau 2b : Mode de fonctionnement du Vestiaire Adhérent */}
      <div data-tour="config-modules-wardrobe-mode">
        <WardrobeMemberModeCard
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 4. Applications Satellites Écosystème & Options transversales */}
      <div data-tour="config-modules-satellite-apps">
        <SatelliteAppsCard
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
