/**
 * Trombinoscope.jsx (sous-dossier trombinoscope)
 * Réexporte le composant principal Trombinoscope avec barre de recherche ajustée.
 */

import React from 'react';
import Trombinoscope from '../Trombinoscope';

export default function SubfolderTrombinoscope(props) {
  return <Trombinoscope {...props} />;
}

export { Trombinoscope };
