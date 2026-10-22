import React from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import { DEFAULT_MEMBER_TABS_VISIBILITY } from '../../../hooks/useAssociationSettings';

/**
 * Carte 2 : Affichage de l'Espace Membre (Niveau 2 SaaS).
 * Permet de masquer/afficher individuellement chaque onglet élève
 * même si le pôle back-office correspondant est actif dans l'association.
 */
export default function MemberTabsVisibilityCard({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const enabledModules = formData.enabledModules || {};
  const memberTabsVisibility = formData.memberTabsVisibility || DEFAULT_MEMBER_TABS_VISIBILITY;

  // Calcul d'état des Pôles Parents (Niveau 1)
  const isLogistiqueOrLutherieActive = enabledModules.logistique !== false || enabledModules.lutherie !== false;
  const isCostumerieActive = enabledModules.costumerie !== false && (enabledModules.costumerie !== undefined || enabledModules.vestiaire !== false);
  const isLutherieOrCostumerieActive = enabledModules.lutherie !== false || isCostumerieActive;
  const isPedagogieActive = enabledModules.pedagogie !== false && (enabledModules.pedagogie !== undefined || (enabledModules.mestre !== false || enabledModules.studioSocial !== false));
  const isRepertoireParentActive = isPedagogieActive || enabledModules.mestre !== false;
  const isStudioSocialActive = enabledModules.studioSocial !== false;
  const isCovoiturageActive = enabledModules.covoiturage !== false;

  const handleToggleTab = (tabKey, isChecked) => {
    const nextVis = { ...memberTabsVisibility, [tabKey]: isChecked };
    handleChange('memberTabsVisibility', nextVis);

    // Synchronisation transversale pour la compatibilité
    if (tabKey === 'repertoire') {
      const currentFeatures = formData.features || {};
      handleChange('features', { ...currentFeatures, repertoireEleves: isChecked });
    }
    if (tabKey === 'monParcours') {
      handleChange('enableIndividualProgression', isChecked);
    }
  };

  const tabsConfig = [
    {
      key: 'materiel',
      icon: '🎸',
      titleKey: 'settings.modules.modulesSwitchesTable.tabMateriel',
      descKey: 'settings.modules.modulesSwitchesTable.tabMaterielDesc',
      title: 'Onglet Mon Matériel',
      desc: 'Instruments empruntés et fiches de prêt',
      isParentActive: isLogistiqueOrLutherieActive,
      parentWarning: 'Pôle Logistique / Lutherie désactivé'
    },
    {
      key: 'vestiaire',
      icon: '👗',
      titleKey: 'settings.modules.modulesSwitchesTable.tabVestiaire',
      descKey: 'settings.modules.modulesSwitchesTable.tabVestiaireDesc',
      title: 'Onglet Mon Vestiaire',
      desc: 'Mannequin d\'habillage, checklist des pièces',
      isParentActive: isCostumerieActive,
      parentWarning: 'Pôle Costumerie désactivé'
    },
    {
      key: 'atelier',
      icon: '🛠️',
      titleKey: 'settings.modules.modulesSwitchesTable.tabAtelier',
      descKey: 'settings.modules.modulesSwitchesTable.tabAtelierDesc',
      title: 'Onglet Mon Atelier',
      desc: 'Fabrication d\'instruments, couture et artisanat',
      isParentActive: isLutherieOrCostumerieActive,
      parentWarning: 'Pôles Lutherie et Costumerie désactivés'
    },
    {
      key: 'monParcours',
      icon: '📈',
      titleKey: 'settings.modules.modulesSwitchesTable.tabMonParcours',
      descKey: 'settings.modules.modulesSwitchesTable.tabMonParcoursDesc',
      title: 'Onglet Mon Parcours & Auto-évaluation',
      desc: 'Carnet d\'aisance, défis rythme et progression',
      isParentActive: isPedagogieActive,
      parentWarning: 'Pôle Pédagogie désactivé'
    },
    {
      key: 'repertoire',
      icon: '📜',
      titleKey: 'settings.modules.modulesSwitchesTable.tabRepertoire',
      descKey: 'settings.modules.modulesSwitchesTable.tabRepertoireDesc',
      title: 'Onglet Répertoire & Paroles',
      desc: 'Accès aux toadas, paroles, partitions et audios',
      isParentActive: isRepertoireParentActive,
      parentWarning: 'Pôle Pédagogie / Mestria désactivé'
    },
    {
      key: 'trombinoscope',
      icon: '👥',
      titleKey: 'settings.modules.modulesSwitchesTable.tabTrombinoscope',
      descKey: 'settings.modules.modulesSwitchesTable.tabTrombinoscopeDesc',
      title: 'Onglet Trombinoscope',
      desc: 'Annuaire visuel avec photos et pupitres',
      isParentActive: true,
      parentWarning: null
    },
    {
      key: 'varal',
      icon: '🧺',
      titleKey: 'settings.modules.modulesSwitchesTable.tabVaral',
      descKey: 'settings.modules.modulesSwitchesTable.tabVaralDesc',
      title: 'Onglet Varal (Documents)',
      desc: 'Partage de documents associatifs et toadas',
      isParentActive: isStudioSocialActive,
      parentWarning: 'Pôle Studio Social désactivé'
    },
    {
      key: 'covoiturage',
      icon: '🚗',
      titleKey: 'settings.modules.modulesSwitchesTable.tabCovoiturage',
      descKey: 'settings.modules.modulesSwitchesTable.tabCovoiturageDesc',
      title: 'Onglet Covoiturage',
      desc: 'Offres et demandes de trajets événements',
      isParentActive: isCovoiturageActive,
      parentWarning: 'Pôle Covoiturage désactivé'
    }
  ];

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-4">
      {/* En-tête de la carte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20 text-left">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            {t('settings.modules.modulesSwitchesTable.memberTabsTitle') || '📱 Affichage de l\'Espace Membre (Vue Adhérents)'}
          </h3>
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
            {t('settings.modules.modulesSwitchesTable.memberTabsDesc') || 'Gérez la visibilité des onglets affichés sur le smartphone et l\'espace personnel de vos adhérents.'}
          </p>
        </div>
      </div>

      {/* Grille des 8 onglets membres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-left">
        {tabsConfig.map(tab => {
          const isExplicitlyChecked = memberTabsVisibility[tab.key] !== false;
          const isVisible = tab.isParentActive && isExplicitlyChecked;
          const isParentBlocked = !tab.isParentActive;

          return (
            <div 
              key={tab.key}
              className={`p-2.5 rounded border transition-all flex flex-col justify-between ${
                isParentBlocked
                  ? 'bg-stone-100/70 border-stone-200 opacity-50 cursor-not-allowed'
                  : isVisible
                    ? 'bg-white border-encre-noire/30 shadow-2xs'
                    : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base shrink-0">{tab.icon}</span>
                  <span className="text-[10.5px] font-black text-encre-noire leading-tight">
                    {tab.titleKey ? (t(tab.titleKey) || tab.title) : tab.title}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isVisible}
                  disabled={saving || isParentBlocked}
                  onChange={(e) => handleToggleTab(tab.key, e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)] shrink-0 mt-0.5"
                />
              </div>

              <p className="text-[8px] text-stone-500 font-medium leading-tight">
                {tab.descKey ? (t(tab.descKey) || tab.desc) : tab.desc}
              </p>

              {isParentBlocked && (
                <span className="inline-block mt-2 text-[7.5px] font-black uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  ⚠️ {tab.parentWarning}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
