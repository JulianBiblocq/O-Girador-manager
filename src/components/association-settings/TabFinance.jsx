import React from 'react';
import CotisationsBlock from './blocks/CotisationsBlock';
import BankDetailsBlock from './blocks/BankDetailsBlock';

export default function TabFinance({
  formData,
  handleChange,
  saving,
  groupId,
  handleSaveHelloAssoKey
}) {
  return (
    <>
      <BankDetailsBlock 
        formData={formData} 
        handleChange={handleChange} 
        saving={saving} 
      />
      
      <div className="mt-4">
        <CotisationsBlock 
          formData={formData} 
          handleChange={handleChange} 
          saving={saving} 
          groupId={groupId} 
          handleSaveHelloAssoKey={handleSaveHelloAssoKey} 
        />
      </div>
    </>
  );
}
