import { useCallback } from 'react';
import { launchTrainingStage, resolveUserSequencerRole } from '../utils/trainingLauncher';

/**
 * Hook personnalisé gérant le déclenchement immédiat d'un entraînement « Tocar Junto ».
 * Récupère et normalise automatiquement l'instrument principal depuis le profil de l'élève.
 * Redirige instantanément vers Sequenciador via le helper SSO sans aucune modale intermédiaire :
 * - Si le pupitre est identifié, le paramètre role est transmis à Sequenciador.
 * - Si aucun pupitre n'est défini, le paramètre role est omis et Sequenciador affiche sa sélection native.
 *
 * @param {Object|string} [profileData] - Profil de l'adhérent connecté ou pupitre direct
 * @param {string} [sequenceurUrl] - URL optionnelle de base du Séquenceur
 * @returns {Object} Callbacks de pratique (avec drapeaux de compatibilité)
 */
export function usePracticeLauncher(profileData = null, sequenceurUrl = undefined) {
  /**
   * Déclenche la pratique d'un palier d'entraînement sans interception.
   * Ouvre directement Sequenciador en mode Tocar Junto en 1 seul clic.
   */
  const startPractice = useCallback(
    (presetId, trainingId, stageIndex = 0) => {
      const detectedRole = resolveUserSequencerRole(profileData);

      launchTrainingStage(presetId, trainingId, stageIndex, {
        role: detectedRole || undefined,
        tocarJunto: 1,
        baseOnly: 1,
        baseUrl: sequenceurUrl
      });
    },
    [profileData, sequenceurUrl]
  );

  return {
    startPractice,
    // Propriétés conservées pour rétrocompatibilité d'interface sans effet de bord
    isRoleModalOpen: false,
    handleSelectRole: () => {},
    handleCloseModal: () => {}
  };
}
