import React from 'react';
import CarpoolBlock from './blocks/CarpoolBlock';
import WardrobeBlock from './blocks/WardrobeBlock';

export default function TabLogistics({ formData, handleChange, saving }) {
  return (
    <>
      <CarpoolBlock formData={formData} handleChange={handleChange} saving={saving} />
      <div className="mt-4">
        <WardrobeBlock formData={formData} handleChange={handleChange} saving={saving} />
      </div>
    </>
  );
}
