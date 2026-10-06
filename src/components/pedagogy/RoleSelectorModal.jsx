import React from 'react';
import { SEQUENCIADOR_ROLES } from '../../utils/trainingLauncher';

export { SEQUENCIADOR_ROLES };

/**
 * Composant de sélection de pupitre - DÉSACTIVÉ / OBSOLÈTE.
 * 
 * Ce composant a été rendu obsolète : Organizad'Or ne bloque plus l'utilisateur
 * avec une modale intermédiaire. L'instrument principal est extrait automatiquement
 * du profil de l'élève, et en l'absence de pupitre défini, Sequenciador gère lui-même
 * sa propre sélection de pupitre à l'atterrissage.
 *
 * Retourne toujours `null` pour neutraliser tout affichage intempestif.
 */
export default function RoleSelectorModal() {
  return null;
}

