import React from 'react';
import AdminPolesSwitchesCard from './AdminPolesSwitchesCard';
import MemberTabsVisibilityCard from './MemberTabsVisibilityCard';
import SatelliteAppsCard from './SatelliteAppsCard';

/**
 * Composant de compatibilité regroupant les deux cartes de configuration SaaS (Niveau 1 et 2).
 */
export default function ModulesSwitchesTable({ formData = {}, handleChange, saving }) {
  return (
    <>
      <AdminPolesSwitchesCard
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />
      <MemberTabsVisibilityCard
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />
      <SatelliteAppsCard
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />
    </>
  );
}
