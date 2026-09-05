import React from 'react';

/**
 * Barre de navigation par onglets pour la fiche détaillée d'un événement (Navigation Hub Cordel).
 * Permet d'alterner de manière fluide entre les 4 piliers de l'événement.
 *
 * @param {Object} props
 * @param {string} props.activeTab Identifiant de l'onglet actif ('rsvp', 'logistics', 'program', 'admin')
 * @param {Function} props.setActiveTab Callback pour basculer d'onglet
 * @param {boolean} props.canAccessAdminTab Indique si l'utilisateur a accès aux outils de gestion
 * @param {number} [props.attendeesCount] Nombre de participants présents (badge)
 * @param {number} [props.carsCount] Nombre de véhicules déclarés (badge)
 * @param {boolean} [props.hasProgram] Indique si un programme artistique ou un plan de scène existe
 */
export default function EventTabsNav({
  activeTab,
  setActiveTab,
  canAccessAdminTab,
  attendeesCount = 0,
  carsCount = 0,
  hasProgram = false
}) {
  const tabs = [
    {
      id: 'rsvp',
      label: 'Mon RSVP',
      icon: '🎟️',
      badge: null
    },
    {
      id: 'logistics',
      label: 'Convoi & Présences',
      icon: '🚗',
      badge: attendeesCount > 0 ? `${attendeesCount}` : null
    },
    {
      id: 'program',
      label: 'Scène & Programme',
      icon: '🎵',
      badge: hasProgram ? '•' : null
    }
  ];

  if (canAccessAdminTab) {
    tabs.push({
      id: 'admin',
      label: 'Gestion & Bilan',
      icon: '⚙️',
      badge: null
    });
  }

  return (
    <div className="w-full border-b-2 border-dashed border-cordel-master-dark/20 pb-2 mb-3">
      <nav
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none"
        aria-label="Navigation de l'événement"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                group shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px_8px_5px_7px] text-xs transition-all cursor-pointer select-none
                ${isActive
                  ? 'bg-cordel-bg border-2 border-encre-noire font-black text-cordel-wood shadow-[2.5px_2.5px_0px_0px_#181716] -translate-y-0.5'
                  : 'bg-cordel-bg-light/70 hover:bg-cordel-bg border-2 border-dashed border-encre-noire/30 font-bold text-encre-noire/75 hover:text-encre-noire shadow-xs'
                }
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="whitespace-nowrap tracking-wide">{tab.label}</span>

              {tab.badge && (
                <span
                  className={`
                    ml-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border leading-none
                    ${isActive
                      ? 'bg-cordel-wood text-white border-encre-noire'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
