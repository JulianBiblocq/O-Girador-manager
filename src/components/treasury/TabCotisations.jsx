/**
 * TabCotisations.jsx
 * Composant de l'onglet Cotisations du pôle Trésorerie.
 * Fait le lien avec TreasuryCotisations et intègre la synchronisation HelloAsso.
 */

import React from 'react';
import TreasuryCotisations from './TreasuryCotisations';

export default function TabCotisations(props) {
  return <TreasuryCotisations {...props} />;
}

export { TreasuryCotisations };
