import React from 'react';
import MonVestiaire from './MonVestiaire';

export default function CostumeChecklist({
  userId,
  groupId,
  userCostumeChecklist = {},
  costumeChecklist = {},
  userSection = '',
  onNavigateToTuto
}) {
  return (
    <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 select-none">
      <MonVestiaire
        userId={userId}
        groupId={groupId}
        userChecklist={userCostumeChecklist}
        userSection={userSection}
      />
    </div>
  );
}
