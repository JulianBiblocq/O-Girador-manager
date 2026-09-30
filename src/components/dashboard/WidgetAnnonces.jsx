/**
 * WidgetAnnonces.jsx (dashboard alias)
 * Wrapper exportant le composant WidgetAnnonces pour le tableau de bord,
 * intégrant l'accusé de lecture WhatsApp Cordel (Fiche 1).
 */

import React from 'react';
import WidgetAnnonces from '../WidgetAnnonces';

export default function DashboardWidgetAnnonces(props) {
  return <WidgetAnnonces {...props} />;
}

export { WidgetAnnonces };
