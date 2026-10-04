import React from 'react';
import AdminExport from '../AdminExport';

/**
 * Composant MemberDirectory (Annuaire des membres du Pôle Secrétariat)
 * Sert de point d'entrée modulaire pour l'Annuaire, l'exportation et l'inscription manuelle par le Bureau.
 */
export default function MemberDirectory({ user, profileData, onBack }) {
  return (
    <div className="w-full flex flex-col gap-4">
      <AdminExport user={user} profileData={profileData} onBack={onBack} />
    </div>
  );
}
