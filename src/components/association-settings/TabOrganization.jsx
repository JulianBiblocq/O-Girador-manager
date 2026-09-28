import React from 'react';
import RegistrationFieldsTable from './organization/RegistrationFieldsTable';
import CustomFieldsAccordion from './organization/CustomFieldsAccordion';
import AnnualCyclesAccordion from './organization/AnnualCyclesAccordion';
import PupitresNomenclatureAccordion from './organization/PupitresNomenclatureAccordion';

/**
 * Pôle Configuration - Onglet Inscription, Profils & Pupitres.
 * Restructuré en tableau clair et accordéons compacts pour éliminer le défilement vertical excessif.
 */
export default function TabOrganization({ formData, handleChange, saving, t }) {
  return (
    <div className="flex flex-col gap-2 text-left select-none">
      {/* 1. Tableau récapitulatif des champs d'inscription standards (Actif / Obligatoire) */}
      <div data-tour="config-profile-form-accordion">
        <RegistrationFieldsTable
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 2. Questions sur-mesure (Champs personnalisés) - Accordéon replié */}
      <div data-tour="config-profile-custom-fields">
        <CustomFieldsAccordion
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      </div>

      {/* 3. Cycles calendaires annuels (Saison & Exercice comptable) - Accordéon replié */}
      <AnnualCyclesAccordion
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />

      {/* 4. Pupitres, Tambours & Nomenclature - Accordéon replié */}
      <div data-tour="config-profile-pupitres">
        <PupitresNomenclatureAccordion
          formData={formData}
          handleChange={handleChange}
          saving={saving}
          t={t}
        />
      </div>
    </div>
  );
}

