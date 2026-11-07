import React, { useState, useCallback } from 'react';
import WidgetAnniversaires from '../WidgetAnniversaires';
import WidgetCommandes from '../WidgetCommandes';

/**
 * Conteneur duo pour l'écran d'Accueil sur PC :
 * Aligne « Anniversaires du mois » à gauche et « Commande groupée » à droite
 * dans une grille `grid grid-cols-1 lg:grid-cols-2 gap-4 items-start`.
 * Si l'un des deux widgets n'est pas affiché, l'autre occupe toute la largeur (`lg:col-span-2`).
 */
export default function DashboardBirthdaysOrdersDuo({
  groupId,
  user,
  profileData,
  currentProfile,
  hasOpenCampaign,
  showBirthdaysInLayout = true,
  showOrdersInLayout = true,
  onNavigateToView
}) {
  const [hasBirthdays, setHasBirthdays] = useState(true);

  const handleHasBirthdaysChange = useCallback((value) => {
    setHasBirthdays(Boolean(value));
  }, []);

  const isOrdersVisible = Boolean(showOrdersInLayout && hasOpenCampaign);
  const isBirthdaysVisible = Boolean(showBirthdaysInLayout && hasBirthdays);

  if (!showBirthdaysInLayout && !isOrdersVisible) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full">
      {showBirthdaysInLayout && (
        <div
          className={`w-full min-w-0 ${
            !hasBirthdays ? 'hidden' : isOrdersVisible ? 'lg:col-span-1' : 'lg:col-span-2'
          }`}
        >
          <WidgetAnniversaires
            groupId={groupId}
            currentUser={user}
            profileData={profileData}
            onHasBirthdaysChange={handleHasBirthdaysChange}
            onContactUser={(userId, message) => {
              if (onNavigateToView) {
                onNavigateToView('forum', { userId, message });
              }
            }}
          />
        </div>
      )}

      {isOrdersVisible && (
        <div className={`w-full min-w-0 ${isBirthdaysVisible ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          <WidgetCommandes
            groupId={currentProfile?.groupId || groupId}
            user={user}
            profileData={currentProfile || profileData}
          />
        </div>
      )}
    </div>
  );
}

