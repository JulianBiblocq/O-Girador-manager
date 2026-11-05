import React from 'react';
import { HorizontalRibbonContainer } from '../navigation/HorizontalTabRibbon';
import { useTranslation } from '../LanguageContext';

/**
 * Ruban horizontal des 6 piliers de configuration de l'association.
 */
export default function AssociationSettingsTabRibbon({
  activeSettingsTab,
  setActiveSettingsTab
}) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'identity', icon: '🏢', label: t('settings.general.associationSettings.identiteLegale') },
    { id: 'organisation', icon: '👥', label: t('settings.general.associationSettings.inscriptionProfilsPupitres'), matchIds: ['organisation', 'profile'] },
    { id: 'agenda', icon: '📅', label: t('settings.general.associationSettings.agendaLieux') },
    { id: 'security', icon: '🛡️', label: t('settings.general.associationSettings.badgesSecurite') },
    { id: 'comms', icon: '📬', label: t('settings.general.associationSettings.communicationAutomatisations') },
    { id: 'modules', icon: '🧩', label: t('settings.general.associationSettings.modulesApparenceMedias') }
  ];

  return (
    <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 mb-1 select-none overflow-hidden lg:overflow-visible w-full">
      <HorizontalRibbonContainer activeTabId={activeSettingsTab}>
        {tabs.map((tab) => {
          const isActive = tab.matchIds
            ? tab.matchIds.includes(activeSettingsTab)
            : activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab-id={tab.id}
              data-tab-active={isActive ? 'true' : 'false'}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`shrink-0 whitespace-nowrap min-h-[40px] lg:min-h-0 px-3.5 py-1.5 lg:px-2.5 lg:py-1 text-sm lg:text-xs font-black uppercase tracking-wider lg:tracking-wide rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                isActive
                  ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                  : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </HorizontalRibbonContainer>
    </div>
  );
}

