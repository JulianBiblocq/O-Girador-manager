import React from 'react';
import CarpoolBlock from './blocks/CarpoolBlock';
import WardrobeBlock from './blocks/WardrobeBlock';
import AccessoriesKitsBlock from './blocks/AccessoriesKitsBlock';

export default function TabLogistics({ formData, handleChange, saving, t }) {
  return (
    <>
      <CarpoolBlock formData={formData} handleChange={handleChange} saving={saving} />
      <div className="mt-4">
        <WardrobeBlock formData={formData} handleChange={handleChange} saving={saving} />
      </div>
      <div className="mt-4">
        <AccessoriesKitsBlock formData={formData} handleChange={handleChange} saving={saving} t={t} />
      </div>
    </>
  );
}
