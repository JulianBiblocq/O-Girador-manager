import React, { useState } from 'react';
import KilometricReimbursementManager from '../KilometricReimbursementManager';
import TreasuryExpenseClaims from './TreasuryExpenseClaims';

/**
 * Conteneur principal de l'onglet Trésorerie "Frais" (frais-km).
 * 
 * Offre une sous-navigation ergonomique entre :
 * 1. "Notes de frais & Achats" (nouveau module d'achats adhérents et workflow)
 * 2. "Frais kilométriques" (module covoiturage existant préservé 100% intact)
 */
export default function TreasuryFraisTab({
  groupId,
  role,
  isSystemAdmin,
  hasAccessTresorerie,
  onBack,
  associationSettings
}) {
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // 'expenses' | 'km'

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* Barre de sous-onglets Frais */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] cursor-pointer transition-all flex items-center gap-1.5 select-none ${
              activeSubTab === 'expenses'
                ? 'bg-cordel-wood text-cordel-bg-light border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]'
                : 'bg-white/60 dark:bg-black/20 border border-dashed border-cordel-master-dark/35 text-encre-noire hover:bg-cordel-hover'
            }`}
          >
            🧾 Notes de frais & Achats
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('km')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] cursor-pointer transition-all flex items-center gap-1.5 select-none ${
              activeSubTab === 'km'
                ? 'bg-cordel-wood text-cordel-bg-light border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]'
                : 'bg-white/60 dark:bg-black/20 border border-dashed border-cordel-master-dark/35 text-encre-noire hover:bg-cordel-hover'
            }`}
          >
            🚗 Frais kilométriques (Covoiturage)
          </button>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark hover:text-cordel-wood cursor-pointer transition-colors"
          >
            ⬅️ Retour
          </button>
        )}
      </div>

      {/* Contenu du sous-onglet sélectionné */}
      {activeSubTab === 'expenses' ? (
        <TreasuryExpenseClaims
          groupId={groupId}
          role={role}
          isSystemAdmin={isSystemAdmin}
          hasAccessTresorerie={hasAccessTresorerie}
          associationSettings={associationSettings}
        />
      ) : (
        <KilometricReimbursementManager
          groupId={groupId}
          role={role}
          isSystemAdmin={isSystemAdmin}
          hasAccessTresorerie={hasAccessTresorerie}
          isEmbedded={true}
          onBack={onBack}
        />
      )}
    </div>
  );
}
