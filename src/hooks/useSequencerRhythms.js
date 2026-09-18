/**
 * Hook unifié pour fournir le catalogue complet des rythmes du Séquenceur
 * (motifs Firestore, dossiers privés, presets, sections et fichiers Storage)
 * aux composants de gestion artistique, du répertoire et de l'agenda.
 * Délègue de manière transparente à useSequencerFirestoreData sans rompre les contrats existants.
 */

import { useSequencerFirestoreData } from './useSequencerFirestoreData';

/**
 * Fournit la liste unifiée des rythmes pour l'association spécifiée.
 *
 * @param {string} groupId - Identifiant de l'association
 * @returns {{ catalogRhythms: Array, loadingRhythms: boolean, fetchCatalogRhythms: Function }}
 */
export function useSequencerRhythms(groupId) {
  const { rhythms, loading, refresh } = useSequencerFirestoreData(groupId);

  return {
    catalogRhythms: rhythms,
    loadingRhythms: loading,
    fetchCatalogRhythms: refresh
  };
}
