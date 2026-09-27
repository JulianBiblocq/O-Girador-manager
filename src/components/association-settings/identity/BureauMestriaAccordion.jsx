import React from 'react';
import BureauAccordion from './BureauAccordion';
import MestriaAccordion from './MestriaAccordion';

/**
 * Orchestrateur pour les deux tiroirs compacts du Bureau et de la Direction Artistique.
 */
export default function BureauMestriaAccordion({ formData = {}, handleChange, saving }) {
  return (
    <div className="flex flex-col mb-4">
      {/* 1. Trombinoscope Bureau Officiel */}
      <BureauAccordion
        bureauMembres={formData.bureauMembres}
        handleChange={handleChange}
        saving={saving}
      />

      {/* 2. Direction Artistique & Mestria */}
      <MestriaAccordion
        directionArtistique={formData.directionArtistique}
        afficherMestriaPV={formData.afficherMestriaPV}
        handleChange={handleChange}
        saving={saving}
      />
    </div>
  );
}
