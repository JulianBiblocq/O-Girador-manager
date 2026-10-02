import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import StudentInstrumentsWorkshop from './StudentInstrumentsWorkshop';
import AtelierCouture from './AtelierCouture';
import AtelierArtisanat from './AtelierArtisanat';
import { useTranslation } from '../LanguageContext';

/**
 * Composant principal « Mon Atelier » pour l'espace membre / élève.
 * Propose une navigation par sous-onglets thématiques :
 * - 🥁 Instruments : Suivi de fabrication d'instruments, tutoriels Varal et soumission au Mestre.
 * - 🧵 Vestiaire & Costumes : Confection et personnalisation des tenues, bracelets et chapeaux.
 * - 🎨 Artisanat : Reliure de carnets de toadas, pochoirs, travail du cuir et accessoires.
 */
export default function MonAtelier({ user, profileData, onBack, initialSubTab = 'instruments' }) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const subTabs = [
    { id: 'instruments', label: t('workshopMember.tabInstruments'), icon: '🥁', description: 'Fabrication et assemblage' },
    { id: 'vestiaire', label: t('workshopMember.tabCostumes'), icon: '🧵', description: 'Couture et ornements' },
    { id: 'artisanat', label: t('workshopMember.tabCrafts'), icon: '🎨', description: 'Reliure, pochoirs et accessoires' }
  ];

  return (
    <div className="flex flex-col gap-5 p-4 max-w-6xl mx-auto">
      {/* En-tête de l'Atelier Cordel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-3">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <h2 className="text-xl font-black text-cordel-wood uppercase tracking-wider">
              {t('lutherie.craftWorkshopTitle')}
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            {t('lutherie.craftWorkshopDesc')}
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="text-xs font-bold px-3 py-1.5 bg-white border border-encre-noire rounded shadow-xs hover:bg-stone-100 self-start sm:self-auto cursor-pointer"
          >
            {t('lutherie.btnHomeBack')}
          </button>
        )}
      </div>

      {/* Barre de navigation des sous-onglets d'atelier */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1">
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-md transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                isActive
                  ? 'bg-white text-cordel-wood border-[var(--color-cordel-wood)] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 border-transparent hover:bg-stone-100/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu du sous-onglet sélectionné */}
      <div className="mt-1">
        {activeSubTab === 'instruments' && (
          <StudentInstrumentsWorkshop
            user={user}
            profileData={profileData}
          />
        )}

        {activeSubTab === 'vestiaire' && (
          <div className="flex flex-col gap-4">
            <AtelierCouture
              groupId={profileData?.groupId}
              onBack={() => setActiveSubTab('instruments')}
            />
          </div>
        )}

        {activeSubTab === 'artisanat' && (
          <AtelierArtisanat
            groupId={profileData?.groupId}
            user={user}
            profileData={profileData}
            onBack={() => setActiveSubTab('instruments')}
          />
        )}
      </div>
    </div>
  );
}
