import { useState, useCallback } from 'react';
import { launchTrainingStage, resolveUserSequencerRole } from '../utils/trainingLauncher';

/**
 * Hook personnalisé gérant le déclenchement d'un entraînement « Tocar Junto ».
 * Tente d'abord de récupérer l'instrument principal depuis le profil de l'adhérent.
 * Si aucun pupitre valide n'est défini, ouvre la micro-modale de sélection.
 *
 * @param {Object} [profileData] - Profil de l'adhérent connecté
 * @param {string} [sequenceurUrl] - URL optionnelle de base du Séquenceur
 * @returns {Object} États et callbacks pour l'entraînement et la modale de sélection de rôle
 */
export function usePracticeLauncher(profileData = null, sequenceurUrl = undefined) {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [pendingTraining, setPendingTraining] = useState(null);

  /**
   * Déclenche la pratique d'un palier d'entraînement.
   * Si le rôle est déjà connu, ouvre directement le Séquenceur en mode Tocar Junto.
   * Sinon, affiche la micro-modale de sélection.
   */
  const startPractice = useCallback(
    (presetId, trainingId, stageIndex = 0) => {
      const detectedRole = resolveUserSequencerRole(profileData);

      if (detectedRole) {
        launchTrainingStage(presetId, trainingId, stageIndex, {
          role: detectedRole,
          tocarJunto: 1,
          baseOnly: 1,
          baseUrl: sequenceurUrl
        });
      } else {
        setPendingTraining({ presetId, trainingId, stageIndex });
        setIsRoleModalOpen(true);
      }
    },
    [profileData, sequenceurUrl]
  );

  /**
   * Gère la validation d'un pupitre sélectionné via la micro-modale.
   */
  const handleSelectRole = useCallback(
    (roleId) => {
      if (pendingTraining && roleId) {
        launchTrainingStage(
          pendingTraining.presetId,
          pendingTraining.trainingId,
          pendingTraining.stageIndex,
          {
            role: roleId,
            tocarJunto: 1,
            baseOnly: 1,
            baseUrl: sequenceurUrl
          }
        );
      }
      setPendingTraining(null);
      setIsRoleModalOpen(false);
    },
    [pendingTraining, sequenceurUrl]
  );

  /**
   * Fermeture ou annulation de la micro-modale.
   */
  const handleCloseModal = useCallback(() => {
    setPendingTraining(null);
    setIsRoleModalOpen(false);
  }, []);

  return {
    startPractice,
    isRoleModalOpen,
    handleSelectRole,
    handleCloseModal
  };
}
