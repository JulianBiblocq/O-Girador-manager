import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import StudentInstrumentsWorkshop from './StudentInstrumentsWorkshop';
import AtelierCouture from './AtelierCouture';

/**
 * Composant principal « Mon Atelier » pour l'espace membre / élève.
 * Propose une navigation par sous-onglets thématiques :
 * - 🥁 Instruments : Suivi de fabrication d'instruments, tutoriels Varal et soumission au Mestre.
 * - 🧵 Vestiaire & Costumes : Confection et personnalisation des tenues, bracelets et chapeaux.
 * - 📚 Édition & Reliure : Préparé pour l'impression et la reliure artisanale des carnets de toadas.
 */
export default function MonAtelier({ user, profileData, onBack, initialSubTab = 'instruments' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const subTabs = [
    { id: 'instruments', label: '🥁 Instruments', description: 'Fabrication et assemblage' },
    { id: 'vestiaire', label: '🧵 Vestiaire & Costumes', description: 'Couture et ornements' },
    { id: 'edition', label: '📚 Édition & Reliure', description: 'Carnets de toadas et livrets' }
  ];

  return (
    <div className="flex flex-col gap-5 p-4 max-w-6xl mx-auto">
      {/* En-tête de l'Atelier Cordel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-3">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <h2 className="text-xl font-black text-cordel-wood uppercase tracking-wider">
              L'Atelier d'Artisanat
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Espace de fabrication collective et d'apprentissage manuel : construisez vos instruments, confectionnez vos costumes et préparez vos supports.
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="text-xs font-bold px-3 py-1.5 bg-white border border-encre-noire rounded shadow-xs hover:bg-stone-100 self-start sm:self-auto cursor-pointer"
          >
            ← Accueil
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

        {activeSubTab === 'edition' && (
          <CordelCard variant="default" className="p-8 text-center bg-white/50 border-dashed max-w-2xl mx-auto flex flex-col items-center gap-4">
            <span className="text-4xl">📚</span>
            <div>
              <h3 className="text-sm font-extrabold text-cordel-wood uppercase tracking-wider">
                Atelier Reliure & Édition Artisanale
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Cet atelier accueillera très prochainement les tutoriels de confection et d'impression pour :
              </p>
              <ul className="text-xs text-stone-700 mt-3 space-y-1 text-left list-disc list-inside bg-stone-50 p-4 rounded border border-stone-200">
                <li><strong>Impression & reliure à la japonaise</strong> des carnets de toadas et paroles de l'association.</li>
                <li><strong>Tirage et gravure sur bois (Xilogravura)</strong> pour les couvertures et affiches culturelles.</li>
                <li><strong>Planches de chants et accords</strong> à glisser dans votre housse d'instrument.</li>
              </ul>
            </div>
            <span className="text-[10px] font-bold text-[var(--color-cordel-ocre)] uppercase tracking-wider bg-amber-100/60 px-3 py-1 rounded-full border border-amber-300">
              Module en préparation • Bientôt disponible
            </span>
          </CordelCard>
        )}
      </div>
    </div>
  );
}
